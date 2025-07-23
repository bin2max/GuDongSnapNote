Page({
  onInRegister() {
    wx.navigateTo({ url: '/pages/upload/upload?mode=in' })
  },
  onOutRegister() {
    wx.navigateTo({ url: '/pages/upload/upload?mode=out' })
  },
  onHistory() {
    wx.navigateTo({ url: '/pages/history/history' })
  },
  onTestEnv() {
    wx.showLoading({ title: '测试中...' })
    wx.cloud.callFunction({
      name: 'testEnv',
      success: res => {
        wx.hideLoading()
        if (res.result && res.result.success) {
          const data = res.result.data
          wx.showModal({
            title: '环境变量测试结果',
            content: `SecretId: ${data.hasSecretId ? '已配置' : '未配置'} (${data.secretIdLength}位)\nSecretKey: ${data.hasSecretKey ? '已配置' : '未配置'} (${data.secretKeyLength}位)\n\nSecretId格式: ${data.secretIdValid ? '正确' : '可能有问题'}\nSecretKey格式: ${data.secretKeyValid ? '正确' : '可能有问题'}\n\nSecretId前缀: ${data.secretIdPrefix}\nSecretKey前缀: ${data.secretKeyPrefix}`,
            showCancel: false
          })
        } else {
          wx.showToast({ title: '测试失败', icon: 'error' })
        }
      },
      fail: err => {
        wx.hideLoading()
        console.error('测试环境变量失败:', err)
        wx.showToast({ title: '测试失败', icon: 'error' })
      }
    })
  }
}) 