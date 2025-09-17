import TencentCloudRecognition from '../../utils/tencentCloud.js'

Page({
  data: {
    mode: 'in',
    vehicleImageUrl: '',
    cargoImageUrl: '',
    vehicleRecognitionResult: null, // { plateNumber, vehicleType, objects }
    cargoRecognitionResult: [], // 物资 objects 数组
    isRecognizing: false
  },
  
  onLoad(options) {
    this.setData({
      mode: options.mode || 'in',
      terminalType: options.terminalType || ''
    })
    this.recognition = new TencentCloudRecognition()
  },
  
  // 车辆正面拍照
  takeVehiclePhoto() {
    wx.chooseImage({
      count: 1,
      sourceType: ['camera'],
      success: res => {
        console.log('=== 车辆正面拍照成功 ===')
        console.log('选择的图片路径:', res.tempFilePaths[0])
        this.setData({ vehicleImageUrl: res.tempFilePaths[0] })
        console.log('setData后的vehicleImageUrl:', this.data.vehicleImageUrl)
        this.recognizeVehicle(res.tempFilePaths[0])
      },
      fail: err => {
        console.error('车辆正面拍照失败:', err)
        wx.showToast({ title: '拍照失败', icon: 'error' })
      }
    })
  },
  chooseVehicleImage() {
    wx.chooseImage({
      count: 1,
      sourceType: ['album'],
      success: res => {
        console.log('=== 选择车辆正面图片成功 ===')
        console.log('选择的图片路径:', res.tempFilePaths[0])
        this.setData({ vehicleImageUrl: res.tempFilePaths[0] })
        console.log('setData后的vehicleImageUrl:', this.data.vehicleImageUrl)
        this.recognizeVehicle(res.tempFilePaths[0])
      },
      fail: err => {
        console.error('选择车辆正面图片失败:', err)
        wx.showToast({ title: '选择图片失败', icon: 'error' })
      }
    })
  },
  // 装载区域拍照
  takeCargoPhoto() {
    wx.chooseImage({
      count: 1,
      sourceType: ['camera'],
      success: res => {
        console.log('=== 装载区域拍照成功 ===')
        console.log('选择的图片路径:', res.tempFilePaths[0])
        this.setData({ cargoImageUrl: res.tempFilePaths[0] })
        console.log('setData后的cargoImageUrl:', this.data.cargoImageUrl)
        this.recognizeCargo(res.tempFilePaths[0])
      },
      fail: err => {
        console.error('装载区域拍照失败:', err)
        wx.showToast({ title: '拍照失败', icon: 'error' })
      }
    })
  },
  chooseCargoImage() {
    wx.chooseImage({
      count: 1,
      sourceType: ['album'],
      success: res => {
        console.log('=== 选择装载区域图片成功 ===')
        console.log('选择的图片路径:', res.tempFilePaths[0])
        this.setData({ cargoImageUrl: res.tempFilePaths[0] })
        console.log('setData后的cargoImageUrl:', this.data.cargoImageUrl)
        this.recognizeCargo(res.tempFilePaths[0])
      },
      fail: err => {
        console.error('选择装载区域图片失败:', err)
        wx.showToast({ title: '选择图片失败', icon: 'error' })
      }
    })
  },
  
  // 车辆正面识别
  async recognizeVehicle(imagePath) {
    if (this.data.isRecognizing) return
    this.setData({ isRecognizing: true })
    wx.showLoading({ title: '识别车辆中...' })
    try {
      // 优先上传到云存储，拿到imageUrl
      const cloudPath = `vehicle_images/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`
      let imageUrl = ''
      try {
        const uploadRes = await wx.cloud.uploadFile({
          cloudPath,
          filePath: imagePath
        })
        const tempUrlRes = await wx.cloud.getTempFileURL({ fileList: [uploadRes.fileID] })
        imageUrl = tempUrlRes.fileList[0].tempFileURL
      } catch (e) {
        imageUrl = ''
      }
      let vehicleResult = null
      const scene = this.data.mode === 'in' ? 'entry' : 'exit'
      if (imageUrl) {
        vehicleResult = await this.recognition.recognizeVehicle({ imageUrl, scene })
      } else {
        // 上传失败则降级为base64
        const imageBase64 = await this.imageToBase64(imagePath)
        vehicleResult = await this.recognition.recognizeVehicle({ imageBase64, scene })
      }
      this.setData({
        vehicleRecognitionResult: vehicleResult,
        isRecognizing: false
      })
      console.log('=== 车辆识别完成 ===')
      console.log('识别结果:', vehicleResult)
      console.log('车牌号:', vehicleResult?.plateNumber)
      console.log('车型:', vehicleResult?.vehicleType)
      console.log('品牌:', vehicleResult?.brand)
      wx.hideLoading()
      wx.showToast({ title: '车辆识别完成', icon: 'success' })
    } catch (error) {
      console.error('车辆识别失败:', error)
      this.setData({ vehicleRecognitionResult: null, isRecognizing: false })
      wx.hideLoading()
      wx.showToast({ title: '识别失败，请手动输入', icon: 'error' })
    }
  },
  // 装载物资识别
  async recognizeCargo(imagePath) {
    if (this.data.isRecognizing) return
    this.setData({ isRecognizing: true })
    wx.showLoading({ title: '识别物资中...' })
    try {
      // 优先上传到云存储，拿到imageUrl
      const cloudPath = `cargo_images/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`
      let imageUrl = ''
      try {
        const uploadRes = await wx.cloud.uploadFile({
          cloudPath,
          filePath: imagePath
        })
        const tempUrlRes = await wx.cloud.getTempFileURL({ fileList: [uploadRes.fileID] })
        imageUrl = tempUrlRes.fileList[0].tempFileURL
      } catch (e) {
        imageUrl = ''
      }
      let objects = []
      const scene = this.data.mode === 'in' ? 'entry' : 'exit'
      if (imageUrl) {
        objects = await this.recognition.detectObjects({ imageUrl, type: 'product', scene })
      } else {
        // 上传失败则降级为base64
        const imageBase64 = await this.imageToBase64(imagePath)
        objects = await this.recognition.detectObjects({ imageBase64, type: 'product', scene })
      }
      this.setData({
        cargoRecognitionResult: objects,
        isRecognizing: false
      })
      wx.hideLoading()
      wx.showToast({ title: `识别到${objects.length}种物资`, icon: 'success' })
    } catch (error) {
      console.error('物资识别失败:', error)
      this.setData({ cargoRecognitionResult: [], isRecognizing: false })
      wx.hideLoading()
      wx.showToast({ title: '识别失败，请手动输入', icon: 'error' })
    }
  },
  // 图片转Base64
  imageToBase64(filePath) {
    return new Promise((resolve, reject) => {
      wx.getFileSystemManager().readFile({
        filePath,
        encoding: 'base64',
        success: res => { resolve(res.data) },
        fail: err => { reject(err) }
      })
    })
  },
  // 下一步
  onNext() {
    const { vehicleImageUrl, cargoImageUrl, vehicleRecognitionResult, cargoRecognitionResult, mode } = this.data
    
    console.log('=== onNext 参数 ===')
    console.log('vehicleImageUrl:', vehicleImageUrl)
    console.log('cargoImageUrl:', cargoImageUrl)
    console.log('vehicleRecognitionResult:', vehicleRecognitionResult)
    console.log('cargoRecognitionResult:', cargoRecognitionResult)
    console.log('mode:', mode)
    
    if (!vehicleImageUrl) {
      wx.showToast({ title: '请拍摄车辆正面照片', icon: 'error' })
      return
    }
    
    const url = `/pages/recognize/recognize?mode=${mode}&terminalType=${this.data.terminalType}` +
      `&vehicleImageUrl=${encodeURIComponent(vehicleImageUrl)}` +
      `&cargoImageUrl=${encodeURIComponent(cargoImageUrl || '')}` +
      `&plateNumber=${vehicleRecognitionResult?.plateNumber || ''}` +
      `&vehicleType=${vehicleRecognitionResult?.vehicleType || ''}` +
      `&cargoList=${encodeURIComponent(JSON.stringify(cargoRecognitionResult || []))}`
    
    console.log('跳转URL:', url)
    
    wx.navigateTo({ url })
  }
}) 