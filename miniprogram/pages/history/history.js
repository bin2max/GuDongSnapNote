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
        
        // 添加调试日志，输出第一条记录的字段信息
        if (records.length > 0) {
          const firstRecord = records[0]
          console.log('=== 历史记录字段调试开始 ===')
          console.log('第一条记录ID:', firstRecord._id)
          console.log('车牌号:', firstRecord.plate_number)
          console.log('所有字段名:', Object.keys(firstRecord))
          console.log('物资清单字段:', firstRecord.cargo_list)
          console.log('进门时间字段:', firstRecord.in_time)
          console.log('状态字段:', firstRecord.status)
          console.log('出门日期字段:', firstRecord.out_date)
          console.log('出门时间字段:', firstRecord.out_time)
          console.log('=== 历史记录字段调试结束 ===')
          
          // 直接测试函数调用
          console.log('=== 函数测试开始 ===')
          const cargoResult = this.getCargoSummary(firstRecord.cargo_list)
          const timeResult = this.formatTime(firstRecord.in_time)
          const outTimeResult = this.formatOutTime(firstRecord.out_time)
          const statusResult = this.getStatusText(firstRecord.status)
          console.log('函数测试结果:', {
            cargoResult,
            timeResult,
            outTimeResult,
            statusResult
          })
          console.log('=== 函数测试结束 ===')
        }
        
        // 为每条记录添加格式化后的字段
        const processedRecords = records.map(record => ({
          ...record,
          formatted_cargo: this.getCargoSummary(record.cargo_list),
          formatted_in_time: this.formatTime(record.in_time || record['in time']),
          formatted_out_time: this.formatOutTime(record.out_time),
          formatted_status: this.getStatusText(record.status)
        }))
        
        const newRecords = this.data.page === 1 ? processedRecords : [...this.data.records, ...processedRecords]
        
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
    return statusMap[status] || status || '未知'
  },
  
  // 获取物资摘要
  getCargoSummary(cargoList) {
    console.log('getCargoSummary 被调用，参数:', cargoList)
    if (!cargoList || cargoList.length === 0) {
      console.log('物资清单为空，返回"无"')
      return '无'
    }
    try {
      const result = cargoList.map(item => {
        console.log('处理物资项:', item)
        // 处理不同的字段名格式
        const name = item.name || item.Name || item.nane || '未知物资'
        const count = item.count || 1
        console.log('解析结果:', { name, count })
        return `${name}×${count}`
      }).join('、')
      console.log('最终物资摘要:', result)
      return result
    } catch (e) {
      console.error('物资清单解析错误:', e)
      return '解析错误'
    }
  },
  
  // 格式化时间
  formatTime(timeStr) {
    console.log('formatTime 被调用，参数:', timeStr)
    if (!timeStr) {
      console.log('时间字符串为空，返回空字符串')
      return ''
    }
    try {
      const date = new Date(timeStr)
      if (isNaN(date.getTime())) {
        console.log('时间解析失败，返回原字符串')
        return timeStr
      }
      // 使用本地时间
      const result = `${date.getMonth() + 1}-${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      console.log('格式化时间结果:', result)
      return result
    } catch (e) {
      console.log('时间格式化异常，返回原字符串')
      return timeStr
    }
  },
  
  // 格式化出门时间（只显示时间部分）
  formatOutTime(timeStr) {
    console.log('formatOutTime 被调用，参数:', timeStr)
    if (!timeStr) {
      console.log('出门时间字符串为空，返回空字符串')
      return ''
    }
    try {
      const date = new Date(timeStr)
      if (isNaN(date.getTime())) {
        console.log('出门时间解析失败，返回原字符串')
        return timeStr
      }
      // 使用本地时间
      const result = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      console.log('格式化出门时间结果:', result)
      return result
    } catch (e) {
      console.log('出门时间格式化异常，返回原字符串')
      return timeStr
    }
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