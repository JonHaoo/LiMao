#!/bin/bash
set -e

# ─── 荔猫AI 热部署脚本 ───
# 用法: ./deploy.sh <服务器SSH地址> [部署目录]
# 示例: ./deploy.sh root@your-server.com /www/wwwroot/limao

SSH_TARGET="${1}"
DEPLOY_DIR="${2:-/www/wwwroot/limao}"

if [ -z "$SSH_TARGET" ]; then
  echo "❌ 用法: ./deploy.sh <user@host> [部署目录]"
  echo "   例: ./deploy.sh root@123.456.789.0"
  exit 1
fi

echo "🏗️  1/4 构建前端..."
npm run build

echo "📦 2/4 提交代码..."
git add -A
git commit --allow-empty -m "deploy: $(date '+%Y-%m-%d %H:%M')"
git push origin main

echo "🔗 3/4 连接服务器拉取更新..."
ssh "$SSH_TARGET" "cd $DEPLOY_DIR && git pull origin main && cd server && npm install && cd .."

echo "🚀 4/4 重启服务..."
ssh "$SSH_TARGET" "cd $DEPLOY_DIR && npx pm2 restart limao --update-env"

echo ""
echo "✅ 部署完成！"
