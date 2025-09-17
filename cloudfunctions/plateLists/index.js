const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const whitelist = db.collection('whitelist_plates')
const blacklist = db.collection('blacklist_plates')

exports.main = async (event, context) => {
  const { action, data } = event || {}
  try {
    // 确保集合与索引存在
    await ensureCollectionAndIndex('whitelist_plates')
    await ensureCollectionAndIndex('blacklist_plates')

    switch (action) {
      case 'checkPlate':
        return await checkPlate(data)
      case 'importWhitelist':
        return await importList(data, 'white')
      case 'importBlacklist':
        return await importList(data, 'black')
      default:
        return { success: false, error: '未知操作类型' }
    }
  } catch (e) {
    console.error('plateLists 错误:', e)
    return { success: false, error: e.message }
  }
}

function normalizePlate(plate) {
  if (!plate) return ''
  return String(plate).toUpperCase().replace(/\s+/g, '').replace(/·/g, '')
}

async function ensureCollectionAndIndex(name) {
  try {
    await db.createCollection(name)
  } catch (e) {
    // 已存在忽略
  }
  try {
    // 创建唯一索引（若已存在会抛错，忽略）
    await db.collection(name).createIndex({ plate_number: 1 }, { unique: true, name: 'uniq_plate_number' })
  } catch (e) {
    // 索引已存在或不支持该接口时忽略
  }
}

async function checkPlate(data) {
  const { plateNumber } = data || {}
  const plate = normalizePlate(plateNumber)
  if (!plate) return { success: false, error: '缺少车牌号' }
  const whiteRes = await whitelist.where({ plate_number: plate }).limit(1).get()
  if (whiteRes.data.length > 0) return { success: true, data: { hit: true, type: 'white' } }
  const blackRes = await blacklist.where({ plate_number: plate }).limit(1).get()
  if (blackRes.data.length > 0) return { success: true, data: { hit: true, type: 'black' } }
  return { success: true, data: { hit: false } }
}

async function importList(data, type) {
  const { fileID } = data || {}
  if (!fileID) return { success: false, error: '缺少文件 fileID' }

  // 读取云存储文本（CSV/每行一个车牌）
  const buffer = await cloud.downloadFile({ fileID })
  const content = buffer.fileContent.toString('utf8')
  const lines = content.split(/\r?\n/).map(l => normalizePlate(l)).filter(Boolean)
  if (lines.length === 0) return { success: false, error: '文件为空或格式不正确' }

  const coll = type === 'white' ? whitelist : blacklist
  let successCount = 0
  let duplicateCount = 0

  for (const plate of lines) {
    const ok = await insertUnique(coll, plate)
    if (ok === 'dup') duplicateCount++
    else if (ok) successCount++
  }

  return { success: true, data: { total: lines.length, inserted: successCount, duplicates: duplicateCount } }
}

async function insertUnique(coll, plate) {
  try {
    await coll.add({ data: { plate_number: plate, create_time: db.serverDate() } })
    return true
  } catch (e) {
    // 唯一索引冲突（或已存在）
    if ((e && e.errCode) || (e && /duplicate|exists|E11000/i.test(String(e.message)))) {
      return 'dup'
    }
    // 如果 SDK 未暴露具体错误码，尝试退化为查询判断
    try {
      const exist = await coll.where({ plate_number: plate }).limit(1).get()
      if (exist.data.length > 0) return 'dup'
    } catch (_) {}
    throw e
  }
} 