# Gudong SnapNote 小程序

## 项目简介
Gudong SnapNote 是一款基于微信小程序和微信云开发的车辆进出管理系统，支持车辆进出登记、物资识别、语音辅助录入、历史记录查询等功能，适用于工地、园区等场景。

## 目录结构
```
Gudong SnapNote/
├── miniprogram/           # 小程序主目录
│   ├── app.js
│   ├── app.json
│   ├── app.wxss
│   ├── utils/             # 工具类目录
│   │   └── tencentCloud.js # 腾讯云API调用工具
│   └── pages/             # 页面目录
│       ├── index/         # 首页
│       ├── upload/        # 拍照页
│       ├── recognize/     # 识别结果页
│       ├── compare/       # 物资比对页
│       ├── history/       # 历史记录页
│       └── detail/        # 详情页
├── cloudfunctions/        # 云函数目录
│   ├── init_db/           # 数据库初始化
│   ├── asrVoice/          # 语音识别（ASR）
│   ├── vehicleRecords/    # 车辆进出记录操作
│   ├── detectObjects/     # 腾讯云TIIA图像识别（车辆+物资）
│   ├── parseVehicleText/  # 语音文本解析
│   ├── recognizePlate/    # 车牌识别
│   └── exportRecords/     # 记录导出（Excel）
├── project.config.json    # 项目全局配置
├── project.private.config.json # 本地个性化配置
└── .gitignore            # Git 忽略文件
```

## 主要功能
- **两级终端管理**：支持停车区和处置区两个终端，分别管理车辆进出
- **车辆进出登记**：分步拍照，自动识别车牌、车型、品牌、物资
- **智能状态流转**：根据终端类型自动确定车辆状态（停车区/处置区/离场）
- **智能图像识别**：集成腾讯云TIIA API，支持车辆识别（RecognizeCarPro）和物资识别（DetectProduct）
- **语音转文字**：腾讯云ASR录音文件识别，支持语音辅助录入
- **物资清单管理**：可编辑的物资清单，支持语音识别结果自动解析
- **进出对比**：自动比对进出物资，防止物资流失
- **历史记录查询**：完整的进出记录查询与详情展示，支持按日期筛选
- **数据导出功能**：支持将筛选后的记录导出为Excel文件，可下载或分享
- **云存储集成**：自动上传照片到云存储，支持临时URL转换

## 快速开始
1. **克隆项目**
   ```sh
   git clone https://github.com/yourname/Gudong-SnapNote.git
   ```
2. **导入微信开发者工具**
   - 选择 Gudong SnapNote 根目录（包含 project.config.json）
   - 确保 miniprogramRoot、cloudfunctionRoot 配置正确
3. **配置云开发环境**
   - 开通云开发，创建环境
   - 配置环境变量：
     - `TENCENT_SECRET_ID`：腾讯云API密钥ID
     - `TENCENT_SECRET_KEY`：腾讯云API密钥Key
   - 上传并部署所有云函数
   - 运行 init_db 云函数初始化数据库
4. **本地开发与测试**
   - 预览/真机调试，测试各项功能

## 依赖环境
- 微信开发者工具（最新版）
- Node.js（云函数依赖）
- 腾讯云API密钥（TIIA图像识别、ASR语音识别）

## 主要技术栈
- **前端**：微信小程序原生开发
- **后端**：微信云开发（云函数/数据库/存储）
- **AI能力**：
  - 腾讯云TIIA（Tencent Intelligent Image Analytics）
    - RecognizeCarPro：车辆识别
    - DetectProduct：商品识别
  - 腾讯云ASR（Automatic Speech Recognition）：语音识别
- **数据库**：云开发NoSQL数据库
- **存储**：云开发存储

## 核心云函数说明
- **detectObjects**：统一的图像识别云函数，根据type参数调用不同的TIIA API
- **asrVoice**：语音识别云函数，支持录音文件转文字
- **parseVehicleText**：语音文本解析，提取车牌号、车型、物资信息
- **vehicleRecords**：车辆记录管理，支持增删改查操作、日期筛选和状态流转
- **exportRecords**：记录导出云函数，支持将筛选后的记录导出为Excel文件

## 车辆状态流转规则
- **进场登记（停车区终端）** → 状态：停车区
- **进场登记（处置区终端）** → 状态：处置区
- **出场放行（处置区终端）** → 状态：停车区
- **出场放行（停车区终端）** → 状态：离场

## 联系方式
- 作者：Jeremy C
- 邮箱：ldp102@163.com
- Issues: https://github.com/yourname/Gudong-SnapNote/issues

---
如有问题欢迎提issue或联系作者！ 