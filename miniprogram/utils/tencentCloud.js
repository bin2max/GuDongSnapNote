// 腾讯云物体识别工具类
class TencentCloudRecognition {
  constructor() {
    // 腾讯云配置
    // ...（省略密钥等配置，实际调用用云函数）
  }

  // 车辆正面识别：只用物体检测API
  async recognizeVehicle(imageBase64) {
    // 调用云函数
    const result = await this.detectObjects(imageBase64)
    // 解析车牌号和车型
    return this.parseVehicleInfoFromObjects(result)
  }

  // 物体识别（车辆正面或装载物资）
  async detectObjects(imageBase64) {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'detectObjects',
        data: {
          imageBase64,
          maxDetectedNum: 50
        },
        success: res => {
          // 兼容云函数返回格式
          if (res.result && res.result.success && res.result.data && res.result.data.Objects) {
            resolve(res.result.data.Objects)
          } else if (res.result && res.result.Objects) {
            resolve(res.result.Objects)
          } else {
            resolve([])
          }
        },
        fail: err => {
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
    for (const obj of objects) {
      // 车牌号
      if (!plateNumber && plateRegex.test(obj.Name)) {
        plateNumber = obj.Name
      }
      // 车型
      if (!vehicleType && vehicleTypes.includes(obj.Name)) {
        vehicleType = obj.Name
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