# 多端Web应用系统

## 项目简介

本项目包含两个主要系统：教务管理系统和外卖点餐系统。每个系统都采用前后端分离架构，使用Node.js + Express作为后端，原生HTML/CSS/JavaScript作为前端。

## 项目结构

```
web/
├── 教务端/                # 教务管理系统
│   ├── server.js         # 后端服务器
│   ├── public/           # 前端静态资源
│   └── database.sql      # 数据库初始化脚本
├── 外卖/                  # 外卖点餐系统
│   ├── server.js         # 后端服务器
│   └── public/           # 前端静态资源
│       ├── user/         # 用户端（点餐系统）
│       └── merchant/     # 商家端（管理系统）
└── .gitignore           # Git忽略文件
```

## 功能介绍

### 教务管理系统

- **管理员功能**：
  - 学生管理（添加、编辑、删除学生）
  - 课程管理（添加、编辑、删除课程）
  - 成绩管理（录入和查看学生成绩）
  
- **学生功能**：
  - 查看个人信息
  - 查看已选课程和成绩
  - 提交课程作业

### 外卖点餐系统

#### 用户端 (/user)
- 浏览菜单和菜品
- 加入购物车并下单
- 查看订单状态
- 个人中心管理

#### 商家端 (/merchant)
- 菜品管理（添加、编辑、删除菜品）
- 分类管理（添加、编辑、删除菜品分类）
- 订单管理（查看、处理订单状态）
- 销售数据统计

## 技术栈

- **后端**：Node.js + Express
- **前端**：HTML5 + CSS3 + JavaScript (原生)
- **数据库**：MySQL
- **版本控制**：Git

## 安装和运行

### 前置条件

- Node.js (v14+)
- MySQL

### 安装步骤

1. 克隆仓库
```bash
git clone https://github.com/Psfja/web.git
cd web
```

2. 安装依赖
```bash
# 教务端
cd 教务端
npm install

# 外卖端
cd ../外卖
npm install
```

3. 配置数据库
- 创建MySQL数据库
- 执行 `database.sql` 文件初始化数据库结构和示例数据

4. 启动服务

```bash
# 教务端（端口：3000）
cd 教务端
node server.js

# 外卖端（端口：8080）
cd ../外卖
node server.js
```

## 访问地址

- **教务管理系统**：http://localhost:3000
- **外卖用户端**：http://localhost:8080/user
- **外卖商家端**：http://localhost:8080/merchant

## 示例账号

### 教务系统
- 管理员：admin / 123456
- 学生：student / 123456

### 外卖系统
- 用户：user / 123456
- 商家：merchant / 123456

## 开发说明

- 代码遵循ES6+规范
- 缩进使用4个空格
- 函数命名采用大驼峰式
- 变量命名采用小驼峰式
- 常量命名采用全大写加下划线

## 许可证

MIT License