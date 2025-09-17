const cloud = require('wx-server-sdk')
const xlsx = require('xlsx')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { action, startDate, endDate } = event
  
  try {
    if (action === 'export') {
      // 构建查询条件
      let query = {}
      
      if (startDate && endDate) {
        query.in_time = db.command.gte(startDate).and(db.command.lte(endDate))
      }
      
      // 获取所有符合条件的记录
      const result = await db.collection('vehicle_records')
        .where(query)
        .orderBy('in_time', 'desc')
        .get()
      
      const records = result.data
      
      if (records.length === 0) {
        return {
          success: false,
          error: '没有找到符合条件的记录'
        }
      }
      
      // 准备Excel数据
      const excelData = records.map(record => {
        const cargoList = record.cargo_list || []
        const cargoText = cargoList.map(item => {
          const name = item.name || item.Name || item.nane || '未知'
          const count = item.count || 1
          return `${name} ×${count}`
        }).join(', ')
        
        return {
          '车牌号': record.plate_number || '',
          '车型': record.vehicle_type || '',
          '品牌': record.brand || '',
          '物资清单': cargoText,
          '进门时间': record.in_time ? new Date(record.in_time).toLocaleString('zh-CN') : '',
          '出门时间': record.out_time ? new Date(record.out_time).toLocaleString('zh-CN') : '',
          '状态': record.status === 'in' ? '进场中' : record.status === 'completed' ? '已完成' : '未知',
          '操作员': record.duty_person || '',
          '备注': record.remarks || ''
        }
      })
      
      // 创建工作簿
      const workbook = xlsx.utils.book_new()
      const worksheet = xlsx.utils.json_to_sheet(excelData)
      
      // 设置列宽
      const colWidths = [
        { wch: 12 }, // 车牌号
        { wch: 10 }, // 车型
        { wch: 10 }, // 品牌
        { wch: 30 }, // 物资清单
        { wch: 20 }, // 进门时间
        { wch: 20 }, // 出门时间
        { wch: 8 },  // 状态
        { wch: 10 }, // 操作员
        { wch: 15 }  // 备注
      ]
      worksheet['!cols'] = colWidths
      
      // 添加工作表到工作簿
      xlsx.utils.book_append_sheet(workbook, worksheet, '车辆记录')
      
      // 生成Excel文件
      const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' })
      
      // 上传到云存储
      const fileName = `车辆记录_${startDate || '全部'}_${endDate || '全部'}_${Date.now()}.xlsx`
      const uploadResult = await cloud.uploadFile({
        cloudPath: `exports/${fileName}`,
        fileContent: excelBuffer
      })
      
      // 获取临时下载链接
      const tempUrlResult = await cloud.getTempFileURL({
        fileList: [uploadResult.fileID]
      })
      
      return {
        success: true,
        data: {
          fileID: uploadResult.fileID,
          tempFileURL: tempUrlResult.fileList[0].tempFileURL,
          fileName: fileName,
          recordCount: records.length
        }
      }
    }
    
    return {
      success: false,
      error: '无效的操作'
    }
    
  } catch (error) {
    console.error('导出记录失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
} 