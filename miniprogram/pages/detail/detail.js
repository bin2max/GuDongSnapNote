Page({
  data: {
    record: {
      plate_number: '鲁A12345',
      vehicle_type: '货车',
      in_time: '2024-05-01 08:00',
      in_photo_url: '',
      out_time: '2024-05-01 18:00',
      out_photo_url: '',
      cargo_list: [
        { name: '钢管', count: 10 },
        { name: '阀门', count: 2 }
      ],
      status: 'allowed',
      duty_person: '张三',
      remark: '无'
    }
  },
  onLoad(query) {
    const id = query.id
    if (!id) return
    console.log('记录详情页面加载，ID:', id)
    
    wx.cloud.callFunction({
      name: 'vehicleRecords',
      data: {
        action: 'findById',
        data: { id }
      },
      success: res => {
        console.log('获取记录结果:', res.result)
        if (res.result && res.result.success && res.result.data) {
          const record = res.result.data
          console.log('原始记录数据:', record)
          console.log('出门照片字段:', record.out_photo_url)
          
          const fileIdList = []
          const fileIdMap = {}
          
          // 修复字段名：使用正确的数据库字段名
          if (record.in_photo_url && record.in_photo_url.startsWith('cloud://')) {
            console.log('添加进场照片到处理列表:', record.in_photo_url)
            fileIdList.push(record.in_photo_url)
            fileIdMap[record.in_photo_url] = 'in_photo_url'
          }
          if (record.out_photo_url && record.out_photo_url.startsWith('cloud://')) {
            console.log('添加出场照片到处理列表:', record.out_photo_url)
            fileIdList.push(record.out_photo_url)
            fileIdMap[record.out_photo_url] = 'out_photo_url'
          }
          
          console.log('需要处理的文件列表:', fileIdList)
          console.log('文件映射:', fileIdMap)
          
          if (fileIdList.length > 0) {
            wx.cloud.getTempFileURL({
              fileList: fileIdList,
              success: tempRes => {
                console.log('获取临时链接成功:', tempRes)
                tempRes.fileList.forEach(f => {
                  console.log('处理文件:', f.fileID, '临时链接:', f.tempFileURL)
                  if (f.tempFileURL && fileIdMap[f.fileID]) {
                    record[fileIdMap[f.fileID]] = f.tempFileURL
                    console.log('更新记录字段:', fileIdMap[f.fileID], '=', f.tempFileURL)
                  }
                })
                console.log('最终记录数据:', record)
                this.setData({ record })
              },
              fail: (error) => {
                console.error('获取临时链接失败:', error)
                this.setData({ record })
              }
            })
          } else {
            console.log('没有需要处理的文件，直接设置记录')
            this.setData({ record })
          }
        }
      },
      fail: (error) => {
        console.error('获取记录失败:', error)
      }
    })
  }
}) 