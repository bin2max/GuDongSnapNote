// 腾讯云物体识别工具类
class TencentCloudRecognition {
  constructor() {
    // 腾讯云配置
    // ...（省略密钥等配置，实际调用用云函数）
  }

  // 车辆正面识别：只用物体检测API
  async recognizeVehicle({ imageUrl, imageBase64 }) {
    // 调用云函数
    const result = await this.detectObjects({ imageUrl, imageBase64 })
    // 解析车牌号和车型
    return this.parseVehicleInfoFromObjects(result)
  }

  // 物体识别（车辆正面或装载物资）
  async detectObjects({ imageUrl, imageBase64 }) {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'detectObjects',
        data: {
          imageUrl,
          imageBase64,
          maxDetectedNum: 50
        },
        success: res => {
          console.log('detectObjects 云函数返回:', res.result)
          // 兼容云函数返回格式
          if (res.result && res.result.success && res.result.data) {
            // 如果是车辆识别结果（RecognizeCarPro）
            if (res.result.data.CarTags) {
              const carTags = res.result.data.CarTags
              const objects = carTags.map(tag => ({
                Name: tag.PlateContent?.Plate || tag.Type || tag.Brand || '车辆',
                Confidence: tag.Confidence || 0,
                Type: 'vehicle'
              }))
              resolve(objects)
            }
            // 如果是普通物体识别结果
            else if (res.result.data.Objects) {
              resolve(res.result.data.Objects)
            } else {
              resolve([])
            }
          } else if (res.result && res.result.Objects) {
            resolve(res.result.Objects)
          } else {
            resolve([])
          }
        },
        fail: err => {
          console.error('detectObjects 云函数调用失败:', err)
          reject(err)
        }
      })
    })
  }

  // 解析车辆正面识别结果，提取车牌号和车型
  parseVehicleInfoFromObjects(objects) {
    let plateNumber = ''
    let vehicleType = ''
    // 车牌号一般为7位，且包含省份简称
    const plateRegex = /[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{5}/
    const vehicleTypes = ['汽车', '卡车', '货车', '面包车', '轿车', 'SUV', '皮卡', '小轿车', '大货车']
    
    console.log('解析车辆信息，对象列表:', objects)
    
    for (const obj of objects) {
      // 车牌号
      if (!plateNumber && plateRegex.test(obj.Name)) {
        plateNumber = obj.Name
        console.log('识别到车牌号:', plateNumber)
      }
      // 车型
      if (!vehicleType && vehicleTypes.includes(obj.Name)) {
        vehicleType = obj.Name
        console.log('识别到车型:', vehicleType)
      }
    }
    
    // 如果没有识别到车牌号，尝试从所有对象中查找
    if (!plateNumber) {
      for (const obj of objects) {
        const name = obj.Name || ''
        if (name.includes('鲁') || name.includes('京') || name.includes('沪') || name.includes('粤')) {
          const match = name.match(/[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{4,5}/)
          if (match) {
            plateNumber = match[0]
            console.log('从文本中提取车牌号:', plateNumber)
            break
          }
        }
      }
    }
    
    return {
      plateNumber,
      vehicleType,
      objects // 保留原始物体列表
    }
  }
}

export default TencentCloudRecognition 