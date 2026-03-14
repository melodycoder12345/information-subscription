# 故障排除指南

## better-sqlite3 编译错误

如果遇到 `better-sqlite3` 编译错误，请尝试以下解决方案：

### 方案 1: 安装 Xcode Command Line Tools

```bash
xcode-select --install
```

### 方案 2: 使用预编译版本

如果编译仍然失败，可以尝试使用预编译的二进制文件：

```bash
npm install better-sqlite3 --build-from-source=false
```

### 方案 3: 更新 better-sqlite3 版本

已更新 package.json 中的版本到 `^11.0.0`，这个版本对 Node.js v25 有更好的支持。

### 方案 4: 使用兼容的 Node.js 版本

如果以上方案都不行，建议使用 Node.js LTS 版本（v20 或 v22）：

```bash
# 使用 nvm 切换 Node.js 版本
nvm install 20
nvm use 20
npm install
```

### 方案 5: 设置环境变量

```bash
export CC=clang
export CXX=clang++
export CPPFLAGS=-I/opt/homebrew/include
export LDFLAGS=-L/opt/homebrew/lib
npm install
```

## concurrently 命令未找到

这是因为依赖还没有安装完成。请先完成 `npm install`，如果 `better-sqlite3` 安装失败，可以：

1. 先安装其他依赖（跳过 better-sqlite3）：
```bash
npm install --ignore-scripts
npm install better-sqlite3 --build-from-source=false
```

2. 或者使用 yarn：
```bash
yarn install
```

## 完整安装步骤

1. 确保已安装 Xcode Command Line Tools：
```bash
xcode-select --install
```

2. 清理并重新安装：
```bash
cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

3. 如果仍然失败，尝试使用预编译版本：
```bash
npm install better-sqlite3 --build-from-source=false
```

4. 或者使用兼容的 Node.js 版本：
```bash
nvm install 20
nvm use 20
npm install
```
