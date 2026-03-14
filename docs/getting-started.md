# 快速开始指南

## 第一步：下载并安装客户端

1. 访问 [Releases页面](https://github.com/your-username/information-subscription-dist/releases)
2. 下载对应平台的安装包：
   - **Windows**: `information-subscription-Setup-x.x.x.exe`
   - **macOS**: `information-subscription-x.x.x.dmg`
   - **Linux**: `information-subscription-x.x.x.AppImage`
3. 安装并启动应用

## 第二步：创建GitHub仓库

1. 登录GitHub，创建一个新仓库（可以是公开或私有）
   - 仓库名称：例如 `my-rss-subscription`
   - 可以选择初始化为空仓库
2. 记录仓库信息：`your-username/my-rss-subscription`

## 第三步：配置GitHub Personal Access Token

1. 访问 GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 点击 "Generate new token (classic)"
3. 设置权限：
   - ✅ `repo` (完整仓库访问权限)
   - ✅ `workflow` (更新GitHub Actions工作流)
4. 生成Token并复制保存（只显示一次）

## 第四步：在客户端中配置

1. **打开设置页面**：
   - 点击应用中的"Settings"按钮
2. **配置GitHub信息**：
   - **Repository**: 输入您的仓库名称（格式：`username/repo-name`）
   - **Personal Access Token**: 粘贴刚才生成的Token
   - 点击"测试连接"验证配置
3. **配置AI服务**（可选）：
   - **Model**: 选择AI模型（如GPT-4o）
   - **API Key**: 输入AI服务的API密钥
   - **System Prompt**: 自定义系统提示词（可选）
4. **配置通知**（可选）：
   - **企业微信Webhook**: 输入企业微信Webhook地址
   - **个人微信（WxPusher）**: 
     - 输入AppToken（从 [https://wxpusher.zjiecode.com/admin](https://wxpusher.zjiecode.com/admin) 获取）
     - 扫码关注公众号获取UID
5. **配置博客**（可选）：
   - 启用GitHub Pages博客功能
   - 设置博客标题、描述等信息
6. **点击"保存"**：
   - **重要**：所有配置修改后，必须点击"保存"按钮才会推送到GitHub
   - 点击保存后，客户端会自动：
     - 创建GitHub Secrets（敏感配置）
     - 推送工作流文件到您的仓库
     - 推送二进制文件到您的仓库
     - **加载默认AI相关的RSS订阅源和爬虫任务**
     - 默认配置会自动应用AI关键词过滤
     - 创建配置文件结构
     - 推送到GitHub并触发Actions
   - 保存过程中会显示状态提示
   - 保存成功后，配置立即生效
   - **注意**：默认配置不可删除，爬虫都不可删除（只能关闭）

## 第五步：添加RSS订阅源

1. 在客户端中添加RSS订阅源：
   - 点击"添加订阅"
   - 输入RSS URL
   - 设置抓取频率（默认1小时）
   - 启用/禁用订阅
2. 配置会自动推送到GitHub仓库的`config/subscriptions.json`

## 第六步：验证GitHub Actions运行

1. 访问您的GitHub仓库
2. 点击"Actions"标签页
3. 查看工作流是否自动运行
4. 如果配置了自动触发，配置推送后几秒内会自动运行
5. 也可以手动点击"Run workflow"触发

## 第七步：查看结果

1. 在客户端中查看同步的数据
2. 或者在GitHub仓库的`data/`目录查看执行结果
3. 如果配置了通知，会收到推送消息
4. 如果配置了博客，访问GitHub Pages查看生成的博客

## 常见问题

### Q1: 客户端提示"无法连接到GitHub"？

**A**: 检查：
1. Personal Access Token是否正确
2. Token是否有`repo`和`workflow`权限
3. 网络连接是否正常
4. 仓库名称格式是否正确（`username/repo-name`）

### Q2: GitHub Actions没有运行？

**A**: 检查：
1. 仓库的Actions功能是否启用（Settings → Actions → General）
2. 工作流文件是否正确推送到`.github/workflows/`目录
3. 查看Actions页面的错误信息

### Q3: 如何更新二进制文件？

**A**: 
1. 客户端会自动检测新版本
2. 如果有更新，会提示您
3. 点击"更新"按钮，客户端会自动下载并推送到您的仓库

### Q4: 配置修改后多久生效？

**A**:
- **自动触发**：配置推送后几秒内自动触发Actions
- **手动触发**：点击"立即执行"按钮立即触发
- **定时触发**：按照设定的cron时间执行

### Q5: 数据存储在哪里？

**A**:
- **本地数据**：存储在客户端SQLite数据库中（完全本地化）
- **GitHub数据**：Actions执行结果存储在仓库的`data/`目录
- **配置数据**：存储在仓库的`config/`目录
