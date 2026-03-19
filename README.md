# Web应用系统

## 项目简介

本项目包含两个系统：教务管理系统和外卖点餐系统。

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