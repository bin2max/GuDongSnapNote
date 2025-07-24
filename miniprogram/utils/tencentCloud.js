// 腾讯云物体识别工具类
class TencentCloudRecognition {
  constructor() {}

  // 车辆正面识别：直接用CarTags[0]结构化字段
  async recognizeVehicle({ imageUrl, imageBase64, scene }) {
    const result = await this.detectObjects({ imageUrl, imageBase64, type: 'car', scene })
    if (result && result.length > 0) {
      const tag = result[0]
      return {
        plateNumber: tag.PlateContent?.Plate || '',
        vehicleType: tag.Type || '',
        brand: tag.Brand || '',
        objects: result
      }
    }
    return { plateNumber: '', vehicleType: '', brand: '', objects: [] }
  }

  // 物体识别（车辆正面或装载物资）
  async detectObjects({ imageUrl, imageBase64, type = 'product', scene }) {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'detectObjects',
        data: {
          imageUrl,
          imageBase64,
          type,
          scene,
          maxDetectedNum: 50
        },
        success: res => {
          // 兼容云函数返回格式
          if (res.result && res.result.success && res.result.data && res.result.data.CarTags) {
            resolve(res.result.data.CarTags)
          } else if (res.result && res.result.data && res.result.data.Products) {
            resolve(res.result.data.Products)
          } else if (res.result && res.result.data && res.result.data.Objects) {
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

  // 保留物资清单解析方法（如有需要）
  parseVehicleInfoFromObjects(objects) {
    // 已不再用于车型解析
    return { plateNumber: '', vehicleType: '', objects }
  }
}

export default TencentCloudRecognition 