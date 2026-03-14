# 讯流 数据仓库

本仓库由**讯流 Electron 客户端**自动管理，无需手动编辑配置文件。

## 快速开始

### 1. 在 GitHub 上使用此模板创建你的数据仓库

点击右上角 **"Use this template"** → **"Create a new repository"**，命名为 `my-feeds`（或任意名字），选择 **Public 或 Private** 均可。

### 2. 配置 GitHub Secrets（敏感信息）

进入你的仓库 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret 名称 | 说明 | 是否必填 |
|---|---|---|
| `AI_API_KEY` | AI 模型 API Key | 可选（不填则不进行 AI 总结）|
| `AI_BASE_URL` | AI 接口地址（国内模型需要填）| 可选 |
| `WECHAT_WEBHOOK_URL` | 企业微信 Webhook 地址 | 可选 |
| `WXPUSHER_APP_TOKEN` | WxPusher App Token | 可选 |
| `WXPUSHER_UID` | WxPusher 用户 UID | 可选 |

### 3. 配置 Crawler 仓库地址（Variables）

进入 **Settings** → **Secrets and variables** → **Actions** → **Variables** → **New repository variable**

| 变量名 | 值 | 说明 |
|---|---|---|
| `CRAWLER_REPO` | `your-github-username/information-subscription` | 讯流源码/发布仓库 |

### 4. 下载并安装讯流客户端

从 [讯流 Release 页面](https://github.com/your-username/information-subscription/releases) 下载对应平台的安装包。

### 5. 首次配置客户端

打开讯流客户端 → **设置** → 填写：
- GitHub Token（需要有读写仓库权限）
- 你的 GitHub 用户名
- 上面创建的数据仓库名（如 `my-feeds`）

点击保存，客户端会自动将配置同步到 GitHub。

## 工作原理

```
讯流客户端 → 推送 config/*.json 到此仓库
                    ↓
GitHub Actions 自动触发 fetch.yml
                    ↓
下载讯流后端二进制 → 抓取 RSS & 爬虫
                    ↓
AI 总结 → 通知推送 → 写入 data/articles/
                    ↓
客户端同步按钮 → 拉取最新数据到本地 SQLite
```

## 文件结构

```
.
├── .github/workflows/fetch.yml   # GitHub Actions 工作流
├── config/
│   ├── subscriptions.json        # RSS 订阅列表（客户端自动维护）
│   ├── crawlers.json             # 爬虫配置（客户端自动维护）
│   ├── ai-config.json            # AI 配置（不含 API Key）
│   ├── notifications.json        # 通知配置
│   └── blog.json                 # 博客配置
└── data/
    └── articles/                 # 抓取结果（JSON 文件）
```
