// 腾讯云物体识别云函数
const cloud = require('wx-server-sdk')
const tencentcloud = require('tencentcloud-sdk-nodejs')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 初始化腾讯云客户端
const TiaClient = tencentcloud.tia.v20190226.Client
const clientConfig = {
  credential: {
    secretId: process.env.TENCENT_SECRET_ID,
    secretKey: process.env.TENCENT_SECRET_KEY,
  },
  region: 'ap-beijing',
  profile: {
    httpProfile: {
      endpoint: 'tiia.tencentcloudapi.com',
    },
  },
}

const client = new TiaClient(clientConfig)

exports.main = async (event, context) => {
  try {
    const { imageBase64, maxDetectedNum = 50 } = event
    
    if (!imageBase64) {
      return {
        success: false,
        error: '缺少图片数据'
      }
    }
    
    // 调用腾讯云物体识别API
    const params = {
      ImageBase64: imageBase64,
      MaxDetectedNum: maxDetectedNum
    }
    
    const result = await client.DetectObject(params)
    
    // 处理识别结果
    const objects = result.Objects || []
    
    // 统计同类物体数量
    const objectCounts = {}
    objects.forEach(obj => {
      const name = obj.Name
      if (objectCounts[name]) {
        objectCounts[name]++
      } else {
        objectCounts[name] = 1
      }
    })
    
    // 转换为物资清单格式
    const cargoList = Object.entries(objectCounts).map(([name, count]) => ({
      name,
      count,
      confidence: objects.find(obj => obj.Name === name)?.Confidence || 0
    }))
    
    // 按置信度排序
    cargoList.sort((a, b) => b.confidence - a.confidence)
    
    return {
      success: true,
      data: {
        Objects: objects,
        CargoList: cargoList,
        TotalCount: objects.length,
        CargoTypes: cargoList.length
      }
    }
    
  } catch (error) {
    console.error('物体识别失败:', error)
    return {
      success: false,
      error: error.message || '识别失败'
    }
  }
} 