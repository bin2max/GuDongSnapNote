Page({
  data: {
    records: [],
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 20
  },
  
  onLoad() {
    this.loadRecords()
  },
  
  onShow() {
    // 每次显示页面时刷新数据
    this.refreshRecords()
  },
  
  // 刷新记录
  refreshRecords() {
    this.setData({
      records: [],
      page: 1,
      hasMore: true
    })
    this.loadRecords()
  },
  
  // 加载历史记录
  async loadRecords() {
    if (this.data.loading || !this.data.hasMore) return
    
    this.setData({ loading: true })
    
    try {
      const result = await wx.cloud.callFunction({
        name: 'vehicleRecords',
        data: {
          action: 'list',
          data: {
            page: this.data.page,
            pageSize: this.data.pageSize
          }
        }
      })
      
      if (result.result.success) {
        const { records, total } = result.result.data
        const newRecords = this.data.page === 1 ? records : [...this.data.records, ...records]
        
        this.setData({
          records: newRecords,
          hasMore: newRecords.length < total,
          page: this.data.page + 1,
          loading: false
        })
      } else {
        throw new Error(result.result.error)
      }
      
    } catch (error) {
      console.error('加载记录失败:', error)
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    }
  },
  
  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      'in': '在场',
      'completed': '已完成',
      'blocked': '已拦截'
    }
    return statusMap[status] || status
  },
  
  // 格式化时间
  formatTime(timeStr) {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
  },
  
  // 获取物资摘要
  getCargoSummary(cargoList) {
    if (!cargoList || cargoList.length === 0) return '无'
    return cargoList.map(item => `${item.name}×${item.count}`).join('、')
  },
  
  // 查看详情
  onDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },
  
  // 下拉刷新
  onPullDownRefresh() {
    this.refreshRecords()
    wx.stopPullDownRefresh()
  },
  
  // 上拉加载更多
  onReachBottom() {
    this.loadRecords()
  }
}) 