// 车辆语音文本结构化云函数
exports.main = async (event, context) => {
  const { text } = event
  if (!text) return { success: false, error: '缺少文本' }

  // 车牌号正则：省份简称 + 字母 + 5或6位字母数字（支持7/8位车牌，如 鲁E8J995、鲁BFM5551）
  const plateRegex = /[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{5,6}/
  // 车型词典
  const vehicleTypes = ['汽车', '卡车', '货车', '面包车', '轿车', 'SUV', '皮卡', '小轿车', '大货车']

  let plateNumber = ''
  let vehicleType = ''
  let cargoList = []
  let driverName = ''
  let phoneNumber = ''

  const normalized = text.replace(/\s+/g, '')

  // 提取车牌号（7或8位）
  const plateMatch = normalized.match(plateRegex)
  if (plateMatch) plateNumber = plateMatch[0]

  // 提取车型
  for (const type of vehicleTypes) {
    if (normalized.includes(type)) {
      vehicleType = type
      break
    }
  }

  // 提取手机号（11位）
  const phoneRegex = /(1[3-9]\d{9})/
  const phoneMatch = normalized.match(phoneRegex)
  if (phoneMatch) phoneNumber = phoneMatch[1]

  // 提取驾驶人姓名：常见姓氏开头，姓名总长限定为2-3字，避免吞并后续中文；或匹配 X师傅/X司机
  let nameSearchText = normalized
  if (plateNumber) nameSearchText = nameSearchText.replace(plateNumber, '')
  if (phoneNumber) nameSearchText = nameSearchText.replace(phoneNumber, '')

  const surname = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛范彭郎鲁韦昌马苗凤花方俞任袁柳鲍史唐费廉岑薛雷贺倪汤滕殷罗毕郝邬安常乐于时傅皮齐康伍余元卜顾孟平黄和穆萧尹姚邵湛汪祁毛禹狄米贝明臧计伏成戴谈宋冉景詹邢邹柴伏'
  const nameRegex = new RegExp('([' + surname + '][\\u4e00-\\u9fa5]{1,2}|[\\u4e00-\\u9fa5]{1,4}(?:师傅|司机))(?![\\u4e00-\\u9fa5])')
  const nameMatch = nameSearchText.match(nameRegex)
  if (nameMatch) driverName = nameMatch[1]

  // -------- 物资抽取改为全局扫描：名称+数量(+单位) --------
  // 预清理：从待匹配文本中剔除车牌、手机号、姓名
  let cargoSearchText = normalized
  if (plateNumber) cargoSearchText = cargoSearchText.replace(plateNumber, '')
  if (phoneNumber) cargoSearchText = cargoSearchText.replace(phoneNumber, '')
  if (driverName) cargoSearchText = cargoSearchText.replace(driverName, '')

  // 物资词表（无单位时启用约束）
  const cargoLexicon = ['乙炔','乙炔气瓶','气瓶','氧气瓶','阀门','井下工具','油管','钢管','水泥','砂石','铜管','铜条','钢板','板房','空调','呼吸器','电缆','电线','木材','铁管','化工桶','桶装油','焊条','螺丝','螺母','阀门']
  const unitGroup = '(个|根|袋|条|件|台|块|箱|瓶|支|米|吨|公斤|kg|车|KG)'

  // 使用全局正则逐个捕获三元组，避免跨物资串连
  const triplet = new RegExp('([\\u4e00-\\u9fa5儿]{1,12}?)(\\d{1,4})' + unitGroup + '?', 'g')
  let m
  while ((m = triplet.exec(cargoSearchText))) {
    let name = (m[1] || '')
    const numStr = m[2] || ''
    const unit = m[3] || ''

    if (!name || !numStr) continue
    // 避免手机号等长数字
    if (numStr.length >= 6) continue

    // 规范化名称：去除内部多余标点、前后量词残留，将儿化音保留
    name = name.replace(/[：:，,。\.\s]/g, '')
    // 切分并取最后一个名词短语，避免残留如“个油管”
    name = name.split(/个|根|袋|条|件|台|块|箱|瓶|支|米|吨|公斤|kg|车|KG/).pop() || name

    // 无单位时需词表命中
    if (!unit) {
      const hit = cargoLexicon.some(k => name.includes(k))
      if (!hit) continue
    }

    const count = parseInt(numStr, 10)
    if (Number.isNaN(count) || count <= 0) continue

    cargoList.push({ name, count })
  }

  // 合并同名物资
  if (cargoList.length > 1) {
    const merged = new Map()
    for (const item of cargoList) {
      const key = item.name
      merged.set(key, (merged.get(key) || 0) + (item.count || 0))
    }
    cargoList = Array.from(merged.entries()).map(([name, count]) => ({ name, count }))
  }

  return {
    success: true,
    data: {
      plateNumber,
      vehicleType,
      cargoList,
      driverName,
      phoneNumber
    }
  }
}
