// 腾讯云车辆识别云函数（增强版）
const cloud = require('wx-server-sdk')
// 推荐专用包
const tencentcloud = require('tencentcloud-sdk-nodejs-tiia')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const TiiaClient = tencentcloud.tiia.v20190529.Client

exports.main = async (event, context) => {
  const secretId = process.env.TENCENT_SECRET_ID
  const secretKey = process.env.TENCENT_SECRET_KEY
  if (!secretId || !secretKey) {
    return { success: false, error: '环境变量 TENCENT_SECRET_ID 或 TENCENT_SECRET_KEY 未配置' }
  }
  const { type, scene, imageUrl, imageBase64 } = event
  if (!imageUrl && !imageBase64) {
    return { success: false, error: '缺少图片数据（imageUrl 或 imageBase64）' }
  }
  const params = imageUrl ? { ImageUrl: imageUrl } : { ImageBase64: imageBase64 }

  // 根据识别类型选择 endpoint
  const endpointMap = {
    car: 'tiia.ap-beijing.tencentcloudapi.com',
    product: 'tiia.tencentcloudapi.com'
  }
  const endpoint = endpointMap[type] || 'tiia.tencentcloudapi.com'
  const clientConfig = {
    credential: { secretId, secretKey },
    region: 'ap-beijing',
    profile: { httpProfile: { endpoint } }
  }
  const client = new TiiaClient(clientConfig)

  try {
    if (type === 'car') {
      // 车辆识别
      const result = await client.RecognizeCarPro(params)
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
        scene,
        type,
        data: {
          CarTags: carTags,
          CarPlates: carPlates,
          CarCoords: resp.CarCoords || [],
          RequestId: resp.RequestId
        }
      }
    } else if (type === 'product') {
      // 商品识别
      const result = await client.DetectProduct(params)
      const resp = result.Response || result
      return {
        success: true,
        scene,
        type,
        data: {
          Products: resp.Products || [],
          RequestId: resp.RequestId
        }
      }
    } else {
      return { success: false, error: '不支持的识别类型' }
    }
  } catch (error) {
    console.error('识别失败:', error, error?.response || '')
    return { success: false, error: error.message || JSON.stringify(error) || '识别失败' }
  }
} 