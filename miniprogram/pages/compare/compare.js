Page({
  data: {
    plateNumber: '',
    terminalType: '', // 终端类型
    inCargoList: [],
    outCargoList: [],
    result: 'blocked',
    resultText: '拦截',
    resultDetail: '物资数量不匹配',
    photoUploading: false,  // 添加照片上传状态
    photoUploaded: false    // 添加照片上传完成状态
  },
  
  onLoad(query) {
    console.log('=== compare 页面加载 ===')
    console.log('接收到的参数:', query)
    
    const { plateNumber, vehicleType, terminalType, imageUrl, cargoList, outVehicleImageUrl } = query
    this.setData({
      plateNumber,
      terminalType: terminalType || '',
      outCargoList: JSON.parse(decodeURIComponent(cargoList)),
      outPhotoFileID: '',
      outVehicleImageUrl: outVehicleImageUrl ? decodeURIComponent(outVehicleImageUrl) : ''
    })
    
    console.log('设置后的数据:', {
      plateNumber: this.data.plateNumber,
      outVehicleImageUrl: this.data.outVehicleImageUrl
    })
    
    // 如果有出场车辆本地图片，自动上传
    if (outVehicleImageUrl) {
      const filePath = decodeURIComponent(outVehicleImageUrl)
      const cloudPath = `vehicle_photos/out_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`
      console.log('开始上传出场照片:', { filePath, cloudPath })
      
      this.setData({ photoUploading: true })  // 设置照片上传状态为 true
      wx.cloud.uploadFile({
        cloudPath,
        filePath,
        success: uploadRes => {
          console.log('出场照片上传成功:', uploadRes)
          this.setData({ outPhotoFileID: uploadRes.fileID, photoUploading: false, photoUploaded: true })  // 设置照片上传状态为 false，照片上传完成状态为 true
        },
        fail: error => {
          console.error('出场照片上传失败:', error)
          this.setData({ photoUploading: false, photoUploaded: false })
          wx.showToast({ title: '照片上传失败', icon: 'error' })
        }
      })
    } else {
      console.log('没有出场照片需要上传')
      // 没有照片需要上传，直接设置为完成状态
      this.setData({ photoUploaded: true })
    }
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
        data: {
          plate_number: this.data.plateNumber,
          terminalType: this.data.terminalType
        }
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
    const { result, plateNumber, terminalType, outCargoList, outPhotoFileID, photoUploading, photoUploaded } = this.data
    console.log('=== 确认操作开始 ===')
    console.log('当前数据:', { result, plateNumber, terminalType, outPhotoFileID, photoUploading, photoUploaded })
    
    // 检查照片上传状态
    if (photoUploading) {
      console.log('照片正在上传中，阻止操作')
      wx.showToast({ title: '照片上传中，请稍候', icon: 'loading' })
      return
    }
    
    if (!photoUploaded) {
      console.log('照片上传失败，阻止操作')
      wx.showToast({ title: '照片上传失败，请重试', icon: 'error' })
      return
    }
    
    console.log('照片上传完成，开始更新记录')
    wx.showLoading({ title: '处理中...' })
    
    if (result === 'allowed') {
      const now = new Date()
      const outDate = now.toISOString().split('T')[0]
      const outTime = now.toISOString()
      
      // 根据终端类型确定新状态
      const newStatus = terminalType === 'disposal' ? 'parking' : 'out'
      
      const updateData = {
        plate_number: plateNumber,
        out_date: outDate,
        out_time: outTime,
        status: newStatus, // 使用新的状态
        out_photo_url: outPhotoFileID,
        terminalType: terminalType // 传递终端类型
      }
      console.log('准备更新数据:', updateData)
      
      wx.cloud.callFunction({
        name: 'vehicleRecords',
        data: {
          action: 'update',
          data: updateData
        },
        success: res => {
      wx.hideLoading()
          console.log('更新结果:', res.result)
          if (res.result && res.result.success) {
        wx.showModal({
          title: '放行成功',
          content: '车辆已放行',
          showCancel: false,
          success: () => {
            wx.redirectTo({ url: '/pages/index/index' })
          }
        })
      } else {
            wx.showToast({ title: '更新失败', icon: 'error' })
          }
        },
        fail: error => {
          wx.hideLoading()
          console.error('更新失败:', error)
          wx.showToast({ title: '更新失败', icon: 'error' })
        }
      })
    } else {
      wx.hideLoading()
        wx.showModal({
          title: '拦截成功',
          content: '车辆已被拦截，请检查物资',
          showCancel: false,
          success: () => {
            wx.redirectTo({ url: '/pages/index/index' })
          }
        })
      }
  },
  
  // 返回首页
  onBack() {
    wx.redirectTo({ url: '/pages/index/index' })
  }
}) 