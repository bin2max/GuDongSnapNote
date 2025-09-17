Page({
  data: {
    terminalType: '',
    whitelistEnabled: false,
    blacklistEnabled: false
  },
  
  onLoad() {
    const savedTerminalType = wx.getStorageSync('terminalType')
    if (savedTerminalType) {
      this.setData({ terminalType: savedTerminalType })
    }
    const whitelistEnabled = wx.getStorageSync('whitelistEnabled') || false
    const blacklistEnabled = wx.getStorageSync('blacklistEnabled') || false
    this.setData({ whitelistEnabled, blacklistEnabled })
  },
  
  selectTerminal(e) {
    const terminalType = e.currentTarget.dataset.type
    this.setData({ terminalType })
    wx.setStorageSync('terminalType', terminalType)
    wx.showToast({ title: `已选择${terminalType === 'parking' ? '停车区' : '处置区'}终端`, icon: 'success' })
  },

  onToggleWhitelist(e) {
    const checked = e.detail.value
    this.setData({ whitelistEnabled: checked })
    wx.setStorageSync('whitelistEnabled', checked)
  },
  onToggleBlacklist(e) {
    const checked = e.detail.value
    this.setData({ blacklistEnabled: checked })
    wx.setStorageSync('blacklistEnabled', checked)
  },

  async onUploadWhitelist() {
    await this.uploadList('white')
  },
  async onUploadBlacklist() {
    await this.uploadList('black')
  },

  async uploadList(type) {
    try {
      const res = await wx.chooseMessageFile({ count: 1, type: 'file' })
      const file = res.tempFiles[0]
      const cloudPath = `plate_lists/${Date.now()}_${file.name}`
      const up = await wx.cloud.uploadFile({ cloudPath, filePath: file.path })
      wx.showLoading({ title: '导入中...' })
      const result = await wx.cloud.callFunction({
        name: 'plateLists',
        data: { action: type === 'white' ? 'importWhitelist' : 'importBlacklist', data: { fileID: up.fileID } }
      })
      wx.hideLoading()
      if (result.result && result.result.success) {
        wx.showToast({ title: `导入成功(${result.result.data.count})`, icon: 'success' })
      } else {
        wx.showToast({ title: '导入失败', icon: 'error' })
      }
    } catch (e) {
      wx.hideLoading && wx.hideLoading()
      wx.showToast({ title: '导入取消或失败', icon: 'none' })
    }
  },

  onInRegister() {
    if (!this.data.terminalType) {
      wx.showToast({ title: '请先选择终端类型', icon: 'error' })
      return
    }
    wx.navigateTo({ url: `/pages/upload/upload?mode=in&terminalType=${this.data.terminalType}` })
  },
  onOutRegister() {
    if (!this.data.terminalType) {
      wx.showToast({ title: '请先选择终端类型', icon: 'error' })
      return
    }
    wx.navigateTo({ url: `/pages/upload/upload?mode=out&terminalType=${this.data.terminalType}` })
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
        wx.showToast({ title: '测试失败', icon: 'error' })
      }
    })
  }
}) 