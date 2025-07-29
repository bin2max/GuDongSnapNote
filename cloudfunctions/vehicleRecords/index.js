// 车辆记录数据库操作云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const vehicleRecordsCollection = db.collection('vehicle_records')

exports.main = async (event, context) => {
  const { action, data } = event
  
  try {
    switch (action) {
      case 'create':
        return await createRecord(data)
      case 'update':
        return await updateRecord(data)
      case 'find':
        return await findRecord(data)
      case 'list':
        return await listRecords(data)
      case 'findById':
        return await findRecordById(data)
      case 'findLastInByPlate':
        return await findLastInByPlate(data)
      default:
        return {
          success: false,
          error: '未知操作类型'
        }
    }
  } catch (error) {
    console.error('数据库操作失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 创建进场记录
async function createRecord(data) {
  const {
    serial_number,
    date,
    vehicle_type,
    plate_number,
    driver_name,
    phone_number,
    cargo_list,
    in_time,
    status,
    duty_person,
    remark,
    in_photo_url
  } = data
  
  const record = {
    serial_number,
    date,
    vehicle_type,
    plate_number,
    driver_name,
    phone_number,
    cargo_list,
    in_time,
    status,
    duty_person,
    remark,
    in_photo_url,
    create_time: db.serverDate(),
    update_time: db.serverDate()
  }
  
  const result = await vehicleRecordsCollection.add({
    data: record
  })
  
  return {
    success: true,
    data: {
      _id: result._id,
      ...record
    }
  }
}

// 更新出场记录
async function updateRecord(data) {
  const {
    plate_number,
    out_date,
    out_time,
    status,
    out_photo_url,
    remark
  } = data
  
  console.log('更新记录参数:', { plate_number, out_date, out_time, status })
  
  // 查找同车牌号的最远一次进场记录（与 findLastInByPlate 保持一致，不添加时间限制）
  const record = await vehicleRecordsCollection
    .where({
      plate_number: plate_number,
      status: 'in'
    })
    .orderBy('in_time', 'desc')
    .limit(1)
    .get()
  
  console.log('查询结果:', { 
    found: record.data.length > 0, 
    recordCount: record.data.length,
    firstRecord: record.data[0] ? {
      _id: record.data[0]._id,
      plate_number: record.data[0].plate_number,
      in_time: record.data[0].in_time,
      status: record.data[0].status
    } : null
  })
  
  if (record.data.length === 0) {
    return {
      success: false,
      error: '未找到该车牌的进场记录'
    }
  }
  
  const recordId = record.data[0]._id
  
  const updateData = {
    out_date,
    out_time,
    status,
    out_photo_url,
    remark,
    update_time: db.serverDate()
  }
  
  console.log('准备更新记录:', { recordId, updateData })
  
  await vehicleRecordsCollection.doc(recordId).update({
    data: updateData
  })
  
  console.log('记录更新成功')
  
  return {
    success: true,
    data: {
      _id: recordId,
      ...updateData
    }
  }
}

// 查找记录
async function findRecord(data) {
  const { plate_number } = data
  
  const result = await vehicleRecordsCollection
    .where({
      plate_number: plate_number
    })
    .orderBy('in_time', 'desc')
    .get()
  
  return {
    success: true,
    data: result.data
  }
}

// 获取记录列表
async function listRecords(data) {
  const { page = 1, pageSize = 20, status } = data
  
  let query = vehicleRecordsCollection
  
  if (status) {
    query = query.where({
      status: status
    })
  }
  
  const result = await query
    .orderBy('create_time', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()
  
  // 获取总数
  const countResult = await query.count()
  
  return {
    success: true,
    data: {
      records: result.data,
      total: countResult.total,
      page,
      pageSize
    }
  }
} 

// 新增：根据id查找单条记录
async function findRecordById(data) {
  const { id } = data
  if (!id) {
    return { success: false, error: '缺少id' }
  }
  const result = await vehicleRecordsCollection.doc(id).get()
  return {
    success: true,
    data: result.data
  }
} 

// 新增：根据车牌号查找最近的进场记录
async function findLastInByPlate(data) {
  const { plate_number } = data
  if (!plate_number) return { success: false, error: '缺少车牌号' }
  const result = await vehicleRecordsCollection
    .where({ plate_number, status: 'in' })
    .orderBy('in_time', 'desc')
    .limit(1)
    .get()
  if (result.data.length === 0) {
    return { success: false, error: '未找到进场记录' }
  }
  return { success: true, data: result.data[0] }
} 