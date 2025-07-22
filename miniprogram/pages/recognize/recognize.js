import TencentCloudRecognition from '../../utils/tencentCloud.js'

Page({
  data: {
    vehicleImageUrl: '',
    cargoImageUrl: '',
    plateNumber: '',
    vehicleType: '',
    driverName: '',
    phoneNumber: '',
    cargoList: [], // 直接为物体objects数组
    detectionResults: [],
    voiceText: '',
    mode: 'in',
    isRecognizing: false,
    recorder: null,
    recognizing: false
  },
  
  onLoad(query) {
    const { mode, vehicleImageUrl, cargoImageUrl, plateNumber, vehicleType, cargoList } = query
    
    this.setData({ 
      mode,
      vehicleImageUrl: decodeURIComponent(vehicleImageUrl || ''),
      cargoImageUrl: decodeURIComponent(cargoImageUrl || ''),
      plateNumber: plateNumber || '',
      vehicleType: vehicleType || '',
      driverName: '张三', // 需要手动输入
      phoneNumber: '13800138000', // 需要手动输入
      cargoList: JSON.parse(decodeURIComponent(cargoList || '[]')),
      detectionResults: JSON.parse(decodeURIComponent(cargoList || '[]')),
      voiceText: ''
    })
  },
  
  // 表单输入事件
  onPlateNumberChange(e) {
    this.setData({ plateNumber: e.detail.value })
  },
  
  onVehicleTypeChange(e) {
    this.setData({ vehicleType: e.detail.value })
  },
  
  onDriverNameChange(e) {
    this.setData({ driverName: e.detail.value })
  },
  
  onPhoneNumberChange(e) {
    this.setData({ phoneNumber: e.detail.value })
  },
  
  onCargoNameChange(e) {
    const { index } = e.currentTarget.dataset
    const { value } = e.detail
    const cargoList = [...this.data.cargoList]
    cargoList[index].name = value
    this.setData({ cargoList })
  },
  
  onCargoCountChange(e) {
    const { index } = e.currentTarget.dataset
    const { value } = e.detail
    const cargoList = [...this.data.cargoList]
    cargoList[index].count = parseInt(value) || 0
    this.setData({ cargoList })
  },
  
  addCargo() {
    const cargoList = [...this.data.cargoList]
    cargoList.push({ name: '', count: 1 })
    this.setData({ cargoList })
  },
  
  removeCargo(e) {
    const { index } = e.currentTarget.dataset
    const cargoList = [...this.data.cargoList]
    cargoList.splice(index, 1)
    this.setData({ cargoList })
  },
  
  // 语音识别区
  onVoiceTextInput(e) {
    this.setData({ voiceText: e.detail.value })
  },
  onVoiceRecognize() {
    if (this.data.recognizing) return;
    const recorderManager = wx.getRecorderManager();
    this.setData({ recognizing: true });
    wx.showToast({ title: '正在录音...', icon: 'none', duration: 1000 });
    recorderManager.start({
      duration: 60000,
      format: 'mp3',
      sampleRate: 16000,
      encodeBitRate: 96000,
      numberOfChannels: 1
    });
    recorderManager.onStop = async (res) => {
      this.setData({ recognizing: false });
      wx.showLoading({ title: '识别中...' });
      try {
        // 1. 上传音频到云存储
        const cloudPath = `asr_voice/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`
        const uploadRes = await wx.cloud.uploadFile({
          cloudPath,
          filePath: res.tempFilePath
        })
        // 2. 调用云函数进行ASR识别
        const asrRes = await wx.cloud.callFunction({
          name: 'asrVoice',
          data: { fileID: uploadRes.fileID }
        })
        wx.hideLoading();
        if (asrRes.result && asrRes.result.success) {
          this.setData({ voiceText: asrRes.result.text });
          wx.showToast({ title: '识别完成', icon: 'success' });
        } else {
          wx.showToast({ title: '识别失败', icon: 'error' });
        }
      } catch (e) {
        wx.hideLoading();
        wx.showToast({ title: '识别失败', icon: 'error' });
      }
    };
    recorderManager.onError = () => {
      this.setData({ recognizing: false });
      wx.showToast({ title: '录音失败', icon: 'error' });
    };
    setTimeout(() => {
      if (this.data.recognizing) {
        recorderManager.stop();
      }
    }, 5000); // 最多录5秒
  },
  onVoiceUpdate() {
    // 简单解析voiceText，自动填充车牌号、车型、物资
    const text = this.data.voiceText.trim();
    if (!text) return;
    // 车牌号正则
    const plateRegex = /[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{5}/;
    const vehicleTypes = ['汽车', '卡车', '货车', '面包车', '轿车', 'SUV', '皮卡', '小轿车', '大货车'];
    let plateNumber = '';
    let vehicleType = '';
    let cargoList = [];
    // 解析车牌号
    const plateMatch = text.match(plateRegex);
    if (plateMatch) plateNumber = plateMatch[0];
    // 解析车型
    for (const type of vehicleTypes) {
      if (text.includes(type)) {
        vehicleType = type;
        break;
      }
    }
    // 解析物资（假设格式：物资名+数量+单位）
    const cargoRegex = /([\u4e00-\u9fa5]+)(\d+)[^\d\u4e00-\u9fa5]?/g;
    let match;
    while ((match = cargoRegex.exec(text))) {
      cargoList.push({ name: match[1], count: parseInt(match[2]) });
    }
    if (plateNumber) this.setData({ plateNumber });
    if (vehicleType) this.setData({ vehicleType });
    if (cargoList.length > 0) this.setData({ cargoList });
    wx.showToast({ title: '已根据语音内容更新', icon: 'success' });
  },
  
  // 确认进场
  async onRegister() {
    const { plateNumber, vehicleType, driverName, phoneNumber, cargoList, vehicleImageUrl, cargoImageUrl } = this.data
    
    if (!plateNumber || !vehicleType || !driverName || !phoneNumber) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'error'
      })
      return
    }
    
    wx.showLoading({ title: '登记中...' })
    
    try {
      // 上传图片到云存储
      const [vehiclePhotoUrl, cargoPhotoUrl] = await Promise.all([
        this.uploadImage(vehicleImageUrl),
        this.uploadImage(cargoImageUrl)
      ])
      
      // 生成序号
      const serialNumber = await this.generateSerialNumber()
      
      // 创建记录数据
      const recordData = {
        serial_number: serialNumber,
        date: new Date().toISOString().split('T')[0],
        vehicle_type: vehicleType,
        plate_number: plateNumber,
        driver_name: driverName,
        phone_number: phoneNumber,
        cargo_list: cargoList,
        in_time: new Date().toISOString(),
        status: 'in',
        duty_person: '值班员', // 可以从用户信息获取
        remark: '',
        in_photo_url: vehiclePhotoUrl,
        cargo_photo_url: cargoPhotoUrl
      }
      
      // 调用云函数创建记录
      const result = await wx.cloud.callFunction({
        name: 'vehicleRecords',
        data: {
          action: 'create',
          data: recordData
        }
      })
      
      wx.hideLoading()
      
      if (result.result.success) {
        wx.showModal({
          title: '登记成功',
          content: '车辆进场登记已完成',
          showCancel: false,
          success: () => {
            wx.redirectTo({ url: '/pages/index/index' })
          }
        })
      } else {
        throw new Error(result.result.error)
      }
      
    } catch (error) {
      console.error('登记失败:', error)
      wx.hideLoading()
      wx.showToast({
        title: '登记失败，请重试',
        icon: 'error'
      })
    }
  },
  
  // 确认出场
  async onNext() {
    const { plateNumber, vehicleType, cargoList, vehicleImageUrl, cargoImageUrl } = this.data
    
    if (!plateNumber || !vehicleType) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'error'
      })
      return
    }
    
    // 跳转到比对页面
    wx.navigateTo({
      url: `/pages/compare/compare?plateNumber=${plateNumber}&vehicleType=${vehicleType}&vehicleImageUrl=${encodeURIComponent(vehicleImageUrl)}&cargoImageUrl=${encodeURIComponent(cargoImageUrl)}&cargoList=${encodeURIComponent(JSON.stringify(cargoList))}`
    })
  },
  
  // 上传图片到云存储
  async uploadImage(filePath) {
    const cloudPath = `vehicle_photos/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`
    
    const result = await wx.cloud.uploadFile({
      cloudPath,
      filePath
    })
    
    return result.fileID
  },
  
  // 生成序号
  async generateSerialNumber() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'vehicleRecords',
        data: {
          action: 'list',
          data: { page: 1, pageSize: 1 }
        }
      })
      
      if (result.result.success) {
        return (result.result.data.total || 0) + 1
      }
      return 1
    } catch (error) {
      console.error('生成序号失败:', error)
      return Date.now()
    }
  }
}) 