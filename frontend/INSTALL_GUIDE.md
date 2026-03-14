# 安装指南

## better-sqlite3 安装问题解决方案

### 问题说明
`better-sqlite3` 是一个原生模块，需要编译。在 macOS ARM64 上可能会遇到编译错误。

### 解决方案

#### 方案 1: 使用环境变量（推荐）

```bash
cd /Users/hudan/www/information_subscription/frontend

# 设置环境变量，使用预编译版本
export npm_config_build_from_source=false

# 清理并重新安装
rm -rf node_modules/better-sqlite3
npm install better-sqlite3
```

#### 方案 2: 使用 npm 配置

```bash
cd /Users/hudan/www/information_subscription/frontend

# 设置 npm 配置
npm config set build-from-source false

# 重新安装 better-sqlite3
npm rebuild better-sqlite3
```

#### 方案 3: 安装 Xcode Command Line Tools（如果编译失败）

```bash
# 安装 Xcode Command Line Tools
xcode-select --install

# 等待安装完成后，重新安装
cd /Users/hudan/www/information_subscription/frontend
npm rebuild better-sqlite3
```

#### 方案 4: 使用兼容的 Node.js 版本

如果以上方案都不行，建议使用 Node.js LTS 版本：

```bash
# 使用 nvm 切换到 LTS 版本
nvm install 20
nvm use 20

# 重新安装
cd /Users/hudan/www/information_subscription/frontend
rm -rf node_modules package-lock.json
npm install
```

### 验证安装

安装完成后，验证 better-sqlite3 是否正确安装：

```bash
cd /Users/hudan/www/information_subscription/frontend
node -e "require('better-sqlite3')"
```

如果没有错误，说明安装成功。

### 当前状态

根据你的输出，依赖已经安装完成（`added 512 packages`），`better-sqlite3` 可能已经安装但需要重新编译。

请尝试：

```bash
cd /Users/hudan/www/information_subscription/frontend

# 方法 1: 使用环境变量
export npm_config_build_from_source=false
npm rebuild better-sqlite3

# 如果方法 1 失败，尝试方法 2
npm config set build-from-source false
npm rebuild better-sqlite3

# 如果还是失败，尝试完整重新安装
rm -rf node_modules/better-sqlite3
npm install better-sqlite3
```

### 运行开发服务器

安装完成后，运行：

```bash
npm run electron:dev
```
