// 车辆记录数据库操作云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const vehicleRecordsCollection = db.collection('vehicle_records')

exports.main = async (event, context) => {
  const { action, data } = event
  
  try {
    switch (action) {
      case 'create':
        return await createRecord(data)
      case 'update':
        return await updateRecord(data)
      case 'find':
        return await findRecord(data)
      case 'list':
        return await listRecords(data)
      default:
        return {
          success: false,
          error: '未知操作类型'
        }
    }
  } catch (error) {
    console.error('数据库操作失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 创建进场记录
async function createRecord(data) {
  const {
    serial_number,
    date,
    vehicle_type,
    plate_number,
    driver_name,
    phone_number,
    cargo_list,
    in_time,
    status,
    duty_person,
    remark,
    in_photo_url
  } = data
  
  const record = {
    serial_number,
    date,
    vehicle_type,
    plate_number,
    driver_name,
    phone_number,
    cargo_list,
    in_time,
    status,
    duty_person,
    remark,
    in_photo_url,
    create_time: db.serverDate(),
    update_time: db.serverDate()
  }
  
  const result = await vehicleRecordsCollection.add({
    data: record
  })
  
  return {
    success: true,
    data: {
      _id: result._id,
      ...record
    }
  }
}

// 更新出场记录
async function updateRecord(data) {
  const {
    plate_number,
    out_date,
    out_time,
    status,
    out_photo_url,
    remark
  } = data
  
  // 查找同车牌号两个月内的最近一次进场记录
  const twoMonthsAgo = new Date()
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)
  
  const record = await vehicleRecordsCollection
    .where({
      plate_number: plate_number,
      in_time: db.command.gte(twoMonthsAgo),
      status: 'in'
    })
    .orderBy('in_time', 'desc')
    .limit(1)
    .get()
  
  if (record.data.length === 0) {
    return {
      success: false,
      error: '未找到该车牌的进场记录'
    }
  }
  
  const recordId = record.data[0]._id
  
  const updateData = {
    out_date,
    out_time,
    status,
    out_photo_url,
    remark,
    update_time: db.serverDate()
  }
  
  await vehicleRecordsCollection.doc(recordId).update({
    data: updateData
  })
  
  return {
    success: true,
    data: {
      _id: recordId,
      ...updateData
    }
  }
}

// 查找记录
async function findRecord(data) {
  const { plate_number } = data
  
  const result = await vehicleRecordsCollection
    .where({
      plate_number: plate_number
    })
    .orderBy('in_time', 'desc')
    .get()
  
  return {
    success: true,
    data: result.data
  }
}

// 获取记录列表
async function listRecords(data) {
  const { page = 1, pageSize = 20, status } = data
  
  let query = vehicleRecordsCollection
  
  if (status) {
    query = query.where({
      status: status
    })
  }
  
  const result = await query
    .orderBy('create_time', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()
  
  // 获取总数
  const countResult = await query.count()
  
  return {
    success: true,
    data: {
      records: result.data,
      total: countResult.total,
      page,
      pageSize
    }
  }
} 