// 车牌识别云函数
const cloud = require('wx-server-sdk')
const tencentcloud = require('tencentcloud-sdk-nodejs')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 初始化腾讯云客户端
const OcrClient = tencentcloud.ocr.v20181119.Client
const clientConfig = {
  credential: {
    secretId: process.env.TENCENT_SECRET_ID,
    secretKey: process.env.TENCENT_SECRET_KEY,
  },
  region: 'ap-beijing',
  profile: {
    httpProfile: {
      endpoint: 'ocr.tencentcloudapi.com',
    },
  },
}

const client = new OcrClient(clientConfig)

exports.main = async (event, context) => {
  try {
    const { imageBase64 } = event
    
    if (!imageBase64) {
      return {
        success: false,
        error: '缺少图片数据'
      }
    }
    
    // 调用腾讯云通用OCR API
    const params = {
      ImageBase64: imageBase64
    }
    
    const result = await client.GeneralBasicOCR(params)
    
    // 从OCR结果中提取车牌号
    const textResults = result.TextDetections || []
    let plateNumber = ''
    
    // 车牌号正则表达式
    const plateRegex = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{5}$/
    
    for (const text of textResults) {
      const detectedText = text.DetectedText
      if (plateRegex.test(detectedText)) {
        plateNumber = detectedText
        break
      }
    }
    
    // 如果没有找到标准格式的车牌，尝试其他格式
    if (!plateNumber) {
      for (const text of textResults) {
        const detectedText = text.DetectedText
        // 查找包含"鲁"、"京"等省份简称的文本
        if (detectedText.includes('鲁') || detectedText.includes('京') || 
            detectedText.includes('沪') || detectedText.includes('粤')) {
          // 提取可能的车牌号
          const match = detectedText.match(/[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{4,5}/)
          if (match) {
            plateNumber = match[0]
            break
          }
        }
      }
    }
    
    return {
      success: true,
      data: {
        plateNumber: plateNumber,
        allText: textResults.map(t => t.DetectedText).join('\n'),
        textCount: textResults.length
      }
    }
    
  } catch (error) {
    console.error('车牌识别失败:', error)
    return {
      success: false,
      error: error.message || '识别失败'
    }
  }
} 