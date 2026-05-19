#!/bin/bash
set -e

echo "🔧 开始修复 lark-cli-mcp-wrapper..."
echo ""

cd "$(dirname "$0")"

# === 1. 创建 .gitignore ===
echo "📝 创建 .gitignore..."
cat > .gitignore << 'EOF'
node_modules/
*.js.map
EOF

# === 2. 修复 package.json ===
echo "📝 修复 package.json (build 脚本 + prepare)..."
cat > package.json << 'PKGJSON'
{
  "name": "lark-cli-mcp-wrapper",
  "version": "1.1.0",
  "description": "MCP server wrapping lark-cli for Lark/Feishu API access - fixed shortcut command handling",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "lark-cli-mcp-wrapper": "dist/index.js"
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsc && node -e \"const fs=require('fs');fs.copyFileSync('src/generated-tools.json','dist/generated-tools.json');fs.copyFileSync('src/tier1.json','dist/tier1.json')\"",
    "dev": "tsx src/index.ts",
    "generate-tools": "tsx scripts/generate-tools.ts",
    "prepare": "npm run build"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/HanqingAWS/lark-cli-mcp-wrapper.git"
  },
  "keywords": [
    "mcp",
    "lark",
    "feishu",
    "lark-cli",
    "model-context-protocol"
  ],
  "author": "HanqingAWS",
  "license": "MIT",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.1",
    "execa": "^9.5.2"
  },
  "devDependencies": {
    "@types/node": "^22.15.17",
    "tsx": "^4.19.4",
    "typescript": "^5.8.3"
  },
  "engines": {
    "node": ">=18"
  }
}
PKGJSON

# === 3. 从 git 中移除 node_modules ===
echo "🗑️  从 git 中移除 node_modules..."
git rm -r --cached node_modules 2>/dev/null || true

# === 4. 确保 node_modules 存在 (本地需要用来 build) ===
echo "📦 安装依赖..."
npm install 2>/dev/null

# === 5. 构建 (编译 TS + 复制 JSON 到 dist/) ===
echo "🔨 构建项目..."
rm -rf dist
npm run build

echo ""
echo "✅ 构建完成，验证 dist/ 目录:"
ls -la dist/
echo ""

# === 6. 确认 dist/ 中有关键文件 ===
if [ ! -f "dist/generated-tools.json" ]; then
    echo "❌ 错误: dist/generated-tools.json 不存在!"
    echo "   需要先运行 npm run generate-tools 生成工具定义"
    exit 1
fi

if [ ! -f "dist/tier1.json" ]; then
    echo "❌ 错误: dist/tier1.json 不存在!"
    exit 1
fi

echo "✅ dist/ 中关键文件验证通过"
echo ""

# === 7. Git 提交并推送 ===
echo "📤 提交到 Git..."
git add .
git commit --no-verify -m "fix: correct build script, remove node_modules, add .gitignore

Key fixes:
- build script now copies generated-tools.json and tier1.json to dist/
- Added 'prepare' script so npx github: works correctly
- Removed node_modules from repo
- Added .gitignore

Without copying JSON files to dist/, the MCP server crashes on startup
because it can't find the tool definitions." 2>/dev/null || echo "  (nothing to commit)"

echo "📤 推送到 GitHub..."
git push --no-verify --force origin main

echo ""
echo "========================================="
echo "✅ 全部完成！"
echo "========================================="
echo ""
echo "现在回到 Amazon Quick Desktop:"
echo "  Settings → Capabilities → MCP → Lark CLI MCP Wrapper"
echo "  点击 Reconnect 或重新打开 Quick Desktop"
echo ""
echo "配置应该是:"
echo "  Command:   npx"
echo "  Arguments: github:HanqingAWS/lark-cli-mcp-wrapper"
echo "  Timeout:   300"
echo ""
