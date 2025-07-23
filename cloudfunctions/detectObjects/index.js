// 腾讯云物体识别云函数
const cloud = require('wx-server-sdk')
const tencentcloud = require('tencentcloud-sdk-nodejs')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const TiaClient = tencentcloud.tia.v20190529.Client

exports.main = async (event, context) => {
  const secretId = process.env.TENCENT_SECRET_ID
  const secretKey = process.env.TENCENT_SECRET_KEY
  if (!secretId || !secretKey) {
    return { success: false, error: '环境变量 TENCENT_SECRET_ID 或 TENCENT_SECRET_KEY 未配置' }
  }
  const clientConfig = {
    credential: { secretId, secretKey },
    region: 'ap-beijing',
    profile: { httpProfile: { endpoint: 'tiia.tencentcloudapi.com' } }
  }
  const client = new TiaClient(clientConfig)

  try {
    const { imageBase64 } = event
    if (!imageBase64) {
      return { success: false, error: '缺少图片数据' }
    }
    const params = { ImageBase64: imageBase64 }
    const result = await client.RecognizeCarPro(params)
    // 解析车辆识别结果
    const carTags = result.CarTags || []
    const carPlates = carTags.map(tag => ({
      plate: tag.PlateContent?.Plate || '',
      type: tag.Type || '',
      brand: tag.Brand || '',
      color: tag.Color || '',
      confidence: tag.Confidence || 0
    }))
    return {
      success: true,
      data: {
        CarTags: carTags,
        CarPlates: carPlates,
        CarCoords: result.CarCoords || [],
        RequestId: result.RequestId
      }
    }
  } catch (error) {
    console.error('车辆识别失败:', error)
    return { success: false, error: error.message || '识别失败' }
  }
} 