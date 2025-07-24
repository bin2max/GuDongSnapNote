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
│   └── detectObjects/     # 腾讯云物体识别
├── project.config.json    # 项目全局配置
├── project.private.config.json # 本地个性化配置
└── .gitignore            # Git 忽略文件
```

## 主要功能
- 车辆进出登记（分步拍照，自动识别车牌、车型、物资）
- 物体识别（腾讯云TIaa）
- 语音转文字辅助录入（腾讯云ASR）
- 物资清单可编辑
- 历史记录查询与详情
- 云数据库、云存储、云函数一体化

## 快速开始
1. **克隆项目**
   ```sh
   git clone https://github.com/yourname/Gudong-SnapNote.git
   ```
2. **导入微信开发者工具**
   - 选择 Gudong SnapNote 根目录（包含 project.config.json）
   - 确保 miniprogramRoot、cloudfunctionRoot 配置正确
3. **配置云开发环境**
   - 开通云开发，创建环境，配置环境变量（TENCENT_SECRET_ID/KEY）
   - 上传并部署所有云函数
   - 运行 init_db 云函数初始化数据库
4. **本地开发与测试**
   - 预览/真机调试，测试各项功能

## 依赖环境
- 微信开发者工具（最新版）
- Node.js（云函数依赖）
- 腾讯云API密钥（物体识别、ASR）

## 主要技术栈
- 微信小程序原生开发
- 微信云开发（云函数/数据库/存储）
- 腾讯云AI能力（物体识别、语音识别）

## 联系方式
- 作者：Jeremy C
- 邮箱：ldp102@163.com
- Issues: https://github.com/yourname/Gudong-SnapNote/issues

---
如有问题欢迎提issue或联系作者！ 