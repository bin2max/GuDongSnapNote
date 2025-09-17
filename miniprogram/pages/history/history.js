Page({
  data: {
    records: [],
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 20,
    // 日期筛选相关
    showDateFilter: false,
    startDate: '',
    endDate: '',
    // 导出相关
    exporting: false
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
      // 构建查询参数
      const queryData = {
        page: this.data.page,
        pageSize: this.data.pageSize
      }
      
      // 添加日期筛选条件
      if (this.data.startDate && this.data.endDate) {
        queryData.startDate = this.data.startDate
        queryData.endDate = this.data.endDate
      }
      
      const result = await wx.cloud.callFunction({
        name: 'vehicleRecords',
        data: {
          action: 'list',
          data: queryData
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
      'parking': '停车区',
      'disposal': '处置区',
      'out': '离场',
      'in': '在场', // 保留旧状态兼容性
      'completed': '已完成', // 保留旧状态兼容性
      'blocked': '已拦截' // 保留旧状态兼容性
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
  },
  
  // 切换日期筛选显示
  toggleDateFilter() {
    this.setData({
      showDateFilter: !this.data.showDateFilter
    })
  },
  
  // 开始日期变化
  onStartDateChange(e) {
    this.setData({
      startDate: e.detail.value
    })
  },
  
  // 结束日期变化
  onEndDateChange(e) {
    this.setData({
      endDate: e.detail.value
    })
  },
  
  // 应用日期筛选
  applyDateFilter() {
    if (this.data.startDate && this.data.endDate && this.data.startDate > this.data.endDate) {
      wx.showToast({
        title: '开始日期不能晚于结束日期',
        icon: 'error'
      })
      return
    }
    
    this.setData({
      showDateFilter: false,
      records: [],
      page: 1,
      hasMore: true
    })
    this.loadRecords()
  },
  
  // 清除日期筛选
  clearDateFilter() {
    this.setData({
      startDate: '',
      endDate: '',
      showDateFilter: false,
      records: [],
      page: 1,
      hasMore: true
    })
    this.loadRecords()
  },
  
  // 导出记录
  async exportRecords() {
    if (this.data.exporting) return
    
    this.setData({ exporting: true })
    wx.showLoading({ title: '导出中...' })
    
    try {
      const result = await wx.cloud.callFunction({
        name: 'exportRecords',
        data: {
          action: 'export',
          startDate: this.data.startDate,
          endDate: this.data.endDate
        }
      })
      
      if (result.result.success) {
        const { tempFileURL, fileName, recordCount } = result.result.data
        
        // 显示导出成功提示
        wx.hideLoading()
        wx.showModal({
          title: '导出成功',
          content: `已导出${recordCount}条记录，文件名为：${fileName}`,
          confirmText: '下载',
          cancelText: '分享',
          success: (res) => {
            if (res.confirm) {
              // 下载文件
              wx.downloadFile({
                url: tempFileURL,
                success: (downloadRes) => {
                  wx.openDocument({
                    filePath: downloadRes.tempFilePath,
                    fileType: 'xlsx',
                    success: () => {
                      console.log('文件打开成功')
                    },
                    fail: (err) => {
                      console.error('文件打开失败:', err)
                      wx.showToast({
                        title: '文件打开失败',
                        icon: 'error'
                      })
                    }
                  })
                },
                fail: (err) => {
                  console.error('文件下载失败:', err)
                  wx.showToast({
                    title: '文件下载失败',
                    icon: 'error'
                  })
                }
              })
            } else if (res.cancel) {
              // 分享文件
              wx.showShareMenu({
                withShareTicket: true,
                menus: ['shareAppMessage', 'shareTimeline']
              })
              
              // 复制链接到剪贴板
              wx.setClipboardData({
                data: tempFileURL,
                success: () => {
                  wx.showToast({
                    title: '下载链接已复制',
                    icon: 'success'
                  })
                }
              })
            }
          }
        })
      } else {
        throw new Error(result.result.error)
      }
      
    } catch (error) {
      console.error('导出失败:', error)
      wx.hideLoading()
      wx.showToast({
        title: '导出失败',
        icon: 'error'
      })
    } finally {
      this.setData({ exporting: false })
    }
  }
}) 