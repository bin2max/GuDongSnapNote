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
      operator: '张三',
      remark: '无'
    }
  },
  onLoad(query) {
    // TODO: 根据id查询数据库获取详情
  }
}) 