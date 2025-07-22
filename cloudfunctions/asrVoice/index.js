const cloud = require('wx-server-sdk')
const tencentcloud = require('tencentcloud-sdk-nodejs')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const AsrClient = tencentcloud.asr.v20190614.Client

exports.main = async (event, context) => {
  const { fileID } = event
  if (!fileID) return { success: false, error: '缺少音频fileID' }

  // 获取音频临时链接
  const res = await cloud.getTempFileURL({ fileList: [fileID] })
  const url = res.fileList[0].tempFileURL

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
      EngSerViceType: '16k_zh', // 普通话16k
      SourceType: 0,
      Url: url,
      VoiceFormat: 'mp3'
    }
    const result = await client.CreateRecTask(params)
    const taskId = result.Data.TaskId

    // 轮询获取识别结果
    let text = ''
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 2000))
      const statusRes = await client.DescribeTaskStatus({ TaskId: taskId })
      if (statusRes.Data.StatusStr === 'success') {
        text = statusRes.Data.Result
        break
      }
      if (statusRes.Data.StatusStr === 'failed') {
        return { success: false, error: 'ASR识别失败' }
      }
    }
    if (!text) return { success: false, error: 'ASR超时' }
    return { success: true, text }
  } catch (e) {
    return { success: false, error: e.message }
  }
} 