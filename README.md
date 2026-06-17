# 智慧城市事件管理系统

一个完整的智慧城市市政事件上报与处理系统，包含事件上报、地图分布、工单流转、统计看板、权限管理、接口服务六个模块。

## 技术栈

### 前端
- React 18 + TypeScript
- Vite
- Ant Design 5
- ECharts 5
- Axios
- React Router 6

### 后端
- Node.js + NestJS
- MongoDB + Mongoose
- JWT 认证
- bcryptjs 密码加密

## 系统模块

### 1. 事件上报
- 市民/工作人员上报市政事件
- 支持事件分类、优先级设置
- 支持上传现场照片
- 记录上报人信息和事发地点

### 2. 地图分布
- 在地图上展示所有事件的分布
- 按状态、分类筛选事件
- 点击标记查看事件详情
- 统计各状态事件数量

### 3. 工单流转
- 事件转工单流程
- 工单分派（派单）
- 工单处理（开始、完成）
- 工单核查
- 工单关闭
- 完整的操作日志记录

### 4. 统计看板
- 事件/工单总览统计
- 趋势图表（近30天）
- 事件分类统计
- 优先级分布饼图
- 各部门工单统计
- 处理人员排行

### 5. 权限管理
- 用户管理（增删改查）
- 角色管理（增删改查）
- 权限分配
- 用户状态管理

### 6. 接口服务
- RESTful API 设计
- JWT 身份认证
- 完整的 CRUD 接口
- 统计分析接口

## 快速开始

### 环境要求
- Node.js >= 16.x
- MongoDB >= 4.x
- npm >= 8.x

### 一键安装（推荐）

```bash
# Mac/Linux
chmod +x setup.sh
./setup.sh

# Windows
setup.bat
```

### 手动安装

#### 1. 安装后端依赖
```bash
cd backend
npm install
```

#### 2. 安装前端依赖
```bash
cd frontend
npm install
```

#### 3. 启动 MongoDB
确保 MongoDB 服务已启动，默认连接地址：`mongodb://localhost:27017/smart-city`

#### 4. 初始化数据
```bash
cd backend
npm run seed
```

#### 5. 启动后端服务
```bash
cd backend
npm run start:dev
```
后端服务运行在 http://localhost:3001

#### 6. 启动前端服务
```bash
cd frontend
npm run dev
```
前端服务运行在 http://localhost:3000

## 默认账号

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | 123456 | 超级管理员 | 拥有所有权限 |
| dispatcher1 | 123456 | 调度员 | 负责事件受理和工单分派 |
| dispatcher2 | 123456 | 调度员 | 负责事件受理和工单分派 |
| handler1 | 123456 | 处理人员 | 市政维修部 |
| handler2 | 123456 | 处理人员 | 环卫部门 |
| handler3 | 123456 | 处理人员 | 园林部门 |
| handler4 | 123456 | 处理人员 | 水务部门 |
| verifier1 | 123456 | 核查人员 | 质检部 |
| verifier2 | 123456 | 核查人员 | 质检部 |
| citizen1 | 123456 | 市民 | 普通市民 |

## 事件分类

- 道路设施
- 环境卫生
- 园林绿化
- 公共设施
- 噪声污染
- 供排水
- 电力设施
- 燃气设施
- 其他

## 工单流程

```
创建工单 → 已分派 → 处理中 → 已完成 → 已核查 → 已关闭
                    ↓              ↑
                    └──────────────┘
                     核查不通过
```

## 项目结构

```
smart-city/
├── backend/                 # 后端项目
│   ├── src/
│   │   ├── auth/           # 认证模块
│   │   ├── users/          # 用户模块
│   │   ├── roles/          # 角色模块
│   │   ├── events/         # 事件模块
│   │   ├── workorders/     # 工单模块
│   │   ├── statistics/     # 统计模块
│   │   ├── schemas/        # 数据模型
│   │   └── seed/           # 数据初始化
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # 前端项目
│   ├── src/
│   │   ├── api/            # API 接口
│   │   ├── pages/          # 页面组件
│   │   ├── layouts/        # 布局组件
│   │   ├── utils/          # 工具函数
│   │   └── main.tsx        # 入口文件
│   ├── package.json
│   └── vite.config.ts
├── setup.sh                # Mac/Linux 安装脚本
├── setup.bat               # Windows 安装脚本
└── README.md
```

## API 接口

### 认证
- POST /api/auth/login - 登录
- GET /api/auth/profile - 获取用户信息

### 事件
- GET /api/events - 获取事件列表
- GET /api/events/:id - 获取事件详情
- POST /api/events - 创建事件
- PUT /api/events/:id - 更新事件
- DELETE /api/events/:id - 删除事件
- GET /api/events/map - 获取地图事件
- GET /api/events/statistics - 获取事件统计
- GET /api/events/trend - 获取事件趋势

### 工单
- GET /api/workorders - 获取工单列表
- GET /api/workorders/:id - 获取工单详情
- POST /api/workorders - 创建工单
- PUT /api/workorders/:id - 更新工单
- DELETE /api/workorders/:id - 删除工单
- PUT /api/workorders/:id/assign - 派单
- PUT /api/workorders/:id/start - 开始处理
- PUT /api/workorders/:id/complete - 处理完成
- PUT /api/workorders/:id/verify - 核查
- PUT /api/workorders/:id/close - 关闭
- GET /api/workorders/:id/logs - 获取操作日志

### 统计
- GET /api/statistics/overview - 总览数据
- GET /api/statistics/event-category - 事件分类统计
- GET /api/statistics/event-status - 事件状态统计
- GET /api/statistics/workorder-status - 工单状态统计
- GET /api/statistics/trend - 趋势数据
- GET /api/statistics/department - 部门统计
- GET /api/statistics/priority - 优先级统计
- GET /api/statistics/handler-ranking - 处理人员排行

### 用户
- GET /api/users - 获取用户列表
- GET /api/users/:id - 获取用户详情
- POST /api/users - 创建用户
- PUT /api/users/:id - 更新用户
- DELETE /api/users/:id - 删除用户

### 角色
- GET /api/roles - 获取角色列表
- GET /api/roles/:id - 获取角色详情
- POST /api/roles - 创建角色
- PUT /api/roles/:id - 更新角色
- DELETE /api/roles/:id - 删除角色

## 开发说明

### 后端开发
```bash
cd backend
npm run start:dev    # 开发模式
npm run build        # 构建
npm run start:prod   # 生产模式
npm run seed         # 初始化数据
```

### 前端开发
```bash
cd frontend
npm run dev          # 开发模式
npm run build        # 构建
npm run preview      # 预览构建结果
```

## License

MIT
