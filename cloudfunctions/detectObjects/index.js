// 腾讯云车辆识别云函数（增强版）
const cloud = require('wx-server-sdk')
// 推荐专用包
const tencentcloud = require('tencentcloud-sdk-nodejs-tiia')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const TiiaClient = tencentcloud.tiia.v20190529.Client

exports.main = async (event, context) => {
  // 统一用 TENCENT_ 前缀
  const secretId = process.env.TENCENT_SECRET_ID
  const secretKey = process.env.TENCENT_SECRET_KEY
  if (!secretId || !secretKey) {
    return { success: false, error: '环境变量 TENCENT_SECRET_ID 或 TENCENT_SECRET_KEY 未配置' }
  }
  const clientConfig = {
    credential: { secretId, secretKey },
    region: 'ap-beijing',
    profile: { httpProfile: { endpoint: 'tiia.ap-beijing.tencentcloudapi.com' } }
  }
  const client = new TiiaClient(clientConfig)

  try {
    // 支持 imageUrl 和 imageBase64，优先 imageUrl
    const { imageUrl, imageBase64 } = event
    if (!imageUrl && !imageBase64) {
      return { success: false, error: '缺少图片数据（imageUrl 或 imageBase64）' }
    }
    const params = imageUrl ? { ImageUrl: imageUrl } : { ImageBase64: imageBase64 }
    const result = await client.RecognizeCarPro(params)
    console.log('RecognizeCarPro 返回:', JSON.stringify(result))

    // 兼容腾讯云SDK返回结构
    const resp = result.Response || result
    const carTags = resp.CarTags || []
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
        CarCoords: resp.CarCoords || [],
        RequestId: resp.RequestId
      }
    }
  } catch (error) {
    console.error('车辆识别失败:', error, error?.response || '')
    return { success: false, error: error.message || JSON.stringify(error) || '识别失败' }
  }
} 