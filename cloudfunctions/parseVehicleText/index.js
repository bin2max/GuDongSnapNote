// 车辆语音文本结构化云函数
exports.main = async (event, context) => {
  const { text } = event
  if (!text) return { success: false, error: '缺少文本' }

  // 车牌号正则
  const plateRegex = /[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{5}/
  // 车型词典
  const vehicleTypes = ['汽车', '卡车', '货车', '面包车', '轿车', 'SUV', '皮卡', '小轿车', '大货车']

  let plateNumber = ''
  let vehicleType = ''
  let cargoList = []

  // 提取车牌号
  const plateMatch = text.match(plateRegex)
  if (plateMatch) plateNumber = plateMatch[0]

  // 提取车型
  for (const type of vehicleTypes) {
    if (text.includes(type)) {
      vehicleType = type
      break
    }
  }

  // 提取物资及数量（如“钢管10根 水泥20袋”）
  const cargoRegex = /([\u4e00-\u9fa5]+)(\d+)[^\d\u4e00-\u9fa5]?/g
  let match
  while ((match = cargoRegex.exec(text))) {
    cargoList.push({ name: match[1], count: parseInt(match[2]) })
  }

  return {
    success: true,
    data: {
      plateNumber,
      vehicleType,
      cargoList
    }
  }
}
