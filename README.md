# Information Subscription

RSS订阅和爬虫应用 - 支持AI内容总结、GitHub Actions部署、企业微信和个人微信推送

## 项目结构

```
information-subscription/
├── frontend/              # Electron + React前端应用
│   ├── src/
│   │   ├── renderer/     # 渲染进程代码（React应用）
│   │   ├── main/         # 主进程代码（Electron）
│   │   └── preload/      # 预加载脚本
│   ├── package.json
│   └── vite.config.ts
├── backend/              # Golang后端服务
│   ├── cmd/server/      # 主程序入口
│   ├── internal/        # 内部模块
│   │   ├── config/      # 配置管理
│   │   ├── rss/         # RSS订阅模块
│   │   ├── crawler/     # 爬虫模块
│   │   ├── ai/          # AI总结模块
│   │   ├── notification/# 通知推送模块
│   │   └── blog/        # 博客生成模块
│   └── go.mod
├── .github/
│   └── workflows/        # GitHub Actions工作流
└── configs/             # 配置文件模板
```

## 技术栈

- **前端**: Electron + React + TypeScript + Tailwind CSS
- **后端**: Golang
- **数据库**: SQLite (better-sqlite3)
- **部署**: GitHub Actions

## 功能特性

- ✅ RSS订阅管理（10个默认AI相关RSS源）
- ✅ 网页爬虫（3个默认AI相关爬虫）
- ✅ AI内容总结
- ✅ AI关键词过滤
- ✅ 默认配置不可删除
- ✅ 抓取频率设置
- ✅ GitHub Actions集成
- ✅ 企业微信和个人微信推送
- ✅ GitHub Pages博客生成
- ✅ 数据同步
- ✅ 数据清理（删除/归档）

## 快速开始

### 开发环境

1. 安装依赖：
```bash
cd frontend
npm install
```

2. 启动开发服务器：
```bash
npm run electron:dev
```

### 构建

```bash
# 构建所有平台
npm run build:all

# 构建特定平台
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

## 配置说明

详见 [用户使用指南](docs/getting-started.md)

## 许可证

MIT
