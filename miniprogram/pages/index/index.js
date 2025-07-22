Page({
  onInRegister() {
    wx.navigateTo({ url: '/pages/upload/upload?mode=in' })
  },
  onOutRegister() {
    wx.navigateTo({ url: '/pages/upload/upload?mode=out' })
  },
  onHistory() {
    wx.navigateTo({ url: '/pages/history/history' })
  }
}) 