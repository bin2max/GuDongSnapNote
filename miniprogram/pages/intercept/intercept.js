Page({
  data: {
    plateNumber: '',
    type: '',
    terminalType: ''
  },
  onLoad(query) {
    this.setData({
      plateNumber: query.plateNumber || '',
      type: query.type || '',
      terminalType: query.terminalType || ''
    })
  },
  onBack() {
    wx.reLaunch({ url: '/pages/index/index' })
  }
}) 