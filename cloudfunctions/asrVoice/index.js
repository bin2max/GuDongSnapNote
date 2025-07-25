const cloud = require('wx-server-sdk')
const tencentcloud = require('tencentcloud-sdk-nodejs-asr')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const AsrClient = tencentcloud.asr.v20190614.Client

exports.main = async (event, context) => {
  const { fileID } = event
  if (!fileID) {
    console.error('缺少音频fileID', event)
    return { success: false, error: '缺少音频fileID' }
  }

  // 获取音频临时链接
  let url = ''
  try {
    const res = await cloud.getTempFileURL({ fileList: [fileID] })
    url = res.fileList[0].tempFileURL
    console.log('音频临时链接:', url)
    if (!url) {
      console.error('获取音频临时链接失败', res)
      return { success: false, error: '获取音频临时链接失败' }
    }
  } catch (e) {
    console.error('获取音频临时链接异常', e)
    return { success: false, error: '获取音频临时链接异常: ' + e.message }
  }

  // 腾讯云ASR配置
  const clientConfig = {
    credential: {
      secretId: process.env.TENCENT_SECRET_ID,
      secretKey: process.env.TENCENT_SECRET_KEY,
    },
    region: 'ap-shanghai',
    profile: { httpProfile: { endpoint: 'asr.tencentcloudapi.com' } }
  }
  const client = new AsrClient(clientConfig)

  // 调用ASR
  try {
    const params = {
      EngineModelType: '16k_zh', // 推荐新参数
      SourceType: 0,
      Url: url,
      ChannelNum: 1, // 单声道
      ResTextFormat: 0 // 返回文本格式，0:基础文本(推荐)
    }
    console.log('调用ASR参数:', params)
    const result = await client.CreateRecTask(params)
    console.log('CreateRecTask结果:', result)
    const taskId = result.Data.TaskId

    // 轮询获取识别结果
    let text = ''
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 2000))
      const statusRes = await client.DescribeTaskStatus({ TaskId: taskId })
      console.log('DescribeTaskStatus:', statusRes)
      if (statusRes.Data.StatusStr === 'success') {
        text = statusRes.Data.Result
        break
      }
      if (statusRes.Data.StatusStr === 'failed') {
        console.error('ASR识别失败', statusRes)
        return { success: false, error: 'ASR识别失败', detail: statusRes }
      }
    }
    if (!text) {
      console.error('ASR超时')
      return { success: false, error: 'ASR超时' }
    }
    // 去除时间戳前缀，只保留纯文本（全局替换）
    text = text.replace(/\[.*?\]\s*/g, '').replace(/\n/g, '');
    return { success: true, text }
  } catch (e) {
    console.error('ASR调用异常', e)
    return { success: false, error: e.message, detail: e }
  }
} 