// 腾讯云物体识别工具类
class TencentCloudRecognition {
  constructor() {}

  // 车辆正面识别：兼容 CarPlates 和 CarTags 两种返回结构
  async recognizeVehicle({ imageUrl, imageBase64, scene }) {
    const result = await this.detectObjects({ imageUrl, imageBase64, type: 'car', scene })
    let plateNumber = ''
    let vehicleType = ''
    let brand = ''
    
    console.log('=== recognizeVehicle 解析开始 ===')
    console.log('detectObjects 返回结果:', result)
    
    if (result && result.length > 0) {
      const tag = result[0]
      console.log('第一个标签:', tag)
      
      // 兼容 CarPlates 和 CarTags 两种结构
      if (tag.plate !== undefined) {
        // CarPlates 结构
        plateNumber = tag.plate || ''
        vehicleType = tag.type || ''
        brand = tag.brand || ''
        console.log('使用 CarPlates 结构解析:', { plateNumber, vehicleType, brand })
      } else if (tag.PlateContent && tag.PlateContent.Plate !== undefined) {
        // CarTags 结构
        plateNumber = tag.PlateContent.Plate || ''
        vehicleType = tag.Type || ''
        brand = tag.Brand || ''
        console.log('使用 CarTags 结构解析:', { plateNumber, vehicleType, brand })
      } else {
        // 兜底逻辑：尝试从任何可能的字段获取信息
        plateNumber = tag.plate || tag.PlateContent?.Plate || tag.Plate || ''
        vehicleType = tag.type || tag.Type || ''
        brand = tag.brand || tag.Brand || ''
        console.log('使用兜底逻辑解析:', { plateNumber, vehicleType, brand })
      }
    }
    
    const finalResult = {
      plateNumber,
      vehicleType,
      brand,
      objects: result
    }
    
    console.log('最终解析结果:', finalResult)
    return finalResult
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
            // 车辆识别：优先返回 CarPlates，如果没有则返回 CarTags
            if (res.result.data.CarPlates && res.result.data.CarPlates.length > 0) {
              resolve(res.result.data.CarPlates)
            } else {
            resolve(res.result.data.CarTags)
            }
          } else if (res.result && res.result.data && res.result.data.Products) {
            // 适配商品识别字段
            const products = res.result.data.Products.map(item => ({
              name: item.Name,
              confidence: item.Confidence,
              count: 1, // 商品识别没有数量，默认1
              ...item // 保留原始字段
            }))
            resolve(products)
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