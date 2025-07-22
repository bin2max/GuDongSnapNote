// 数据库初始化云函数
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    // 1. 创建集合（如果已存在会自动跳过）
    try {
      await db.createCollection('vehicle_records')
    } catch (e) {
      // 集合已存在时会报错，忽略即可
    }

    // 2. 创建常用索引（如车牌号+进门时间）
    try {
      await db.collection('vehicle_records').createIndex({
        data: { plate_number: 1, in_time: -1 }
      })
    } catch (e) {}
    try {
      await db.collection('vehicle_records').createIndex({
        data: { plate_number: 1, date: -1, status: 1 }
      })
    } catch (e) {}

    // 3. 插入一条完整测试数据（如已存在则跳过）
    const countRes = await db.collection('vehicle_records').count()
    if (countRes.total === 0) {
      await db.collection('vehicle_records').add({
        data: {
          serial_number: 1,
          date: '2024-06-01',
          vehicle_type: '货车',
          plate_number: '鲁A12345',
          driver_name: '张三',
          phone_number: '13800138000',
          cargo_list: [
            { name: '钢管', count: 10 },
            { name: '水泥', count: 20 }
          ],
          in_time: new Date(),
          out_date: '',
          out_time: '',
          status: 'in',
          duty_person: '李四',
          remark: '测试数据',
          in_photo_url: '',
          out_photo_url: ''
        }
      })
    }

    return { success: true, message: '数据库初始化成功' }
  } catch (e) {
    return { success: false, error: e.message }
  }
} 