Page({
  data: {
    plateNumber: '',
    inCargoList: [],
    outCargoList: [],
    result: 'blocked',
    resultText: '拦截',
    resultDetail: '物资数量不匹配'
  },
  
  onLoad(query) {
    const { plateNumber, vehicleType, imageUrl, cargoList } = query
    
    this.setData({
      plateNumber,
      outCargoList: JSON.parse(decodeURIComponent(cargoList))
    })
    
    // 查找进场记录
    this.findInRecord()
  },
  
  // 查找进场记录
  findInRecord() {
    wx.showLoading({ title: '查找记录中...' })
    wx.cloud.callFunction({
      name: 'vehicleRecords',
      data: {
        action: 'findLastInByPlate',
        data: { plate_number: this.data.plateNumber }
      },
      success: res => {
        wx.hideLoading()
        if (res.result && res.result.success && res.result.data) {
          const inCargoList = res.result.data.cargo_list || []
          this.setData({ inCargoList })
          this.compareCargo()
        } else {
          wx.showToast({ title: '未找到进场记录', icon: 'error' })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '查找失败', icon: 'error' })
      }
    })
  },
  
  // 物资比对
  compareCargo() {
    const { inCargoList, outCargoList } = this.data
    
    // 创建物资映射
    const inMap = new Map()
    const outMap = new Map()
    
    inCargoList.forEach(item => {
      inMap.set(item.name, item.count)
    })
    
    outCargoList.forEach(item => {
      outMap.set(item.name, item.count)
    })
    
    // 检查是否有物资数量超出
    let isAllowed = true
    let detail = '物资数量匹配，允许放行'
    
    for (const [name, outCount] of outMap) {
      const inCount = inMap.get(name) || 0
      if (outCount > inCount) {
        isAllowed = false
        detail = `${name}数量超出：进场${inCount}，出场${outCount}`
        break
      }
    }
    
    // 检查是否有未登记的物资
    if (isAllowed) {
      for (const [name, outCount] of outMap) {
        if (!inMap.has(name)) {
          isAllowed = false
          detail = `发现未登记物资：${name}`
          break
        }
      }
    }
    
    this.setData({
      result: isAllowed ? 'allowed' : 'blocked',
      resultText: isAllowed ? '放行' : '拦截',
      resultDetail: detail
    })
  },
  
  // 确认操作
  onConfirm() {
    const { result, plateNumber, outCargoList } = this.data
    
    wx.showLoading({ title: '处理中...' })
    
    // TODO: 调用云函数更新出场记录
    setTimeout(() => {
      wx.hideLoading()
      
      if (result === 'allowed') {
        wx.showModal({
          title: '放行成功',
          content: '车辆已放行',
          showCancel: false,
          success: () => {
            wx.redirectTo({ url: '/pages/index/index' })
          }
        })
      } else {
        wx.showModal({
          title: '拦截成功',
          content: '车辆已被拦截，请检查物资',
          showCancel: false,
          success: () => {
            wx.redirectTo({ url: '/pages/index/index' })
          }
        })
      }
    }, 1000)
  },
  
  // 返回首页
  onBack() {
    wx.redirectTo({ url: '/pages/index/index' })
  }
}) 