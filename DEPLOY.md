# 荔猫AI 部署指南

## 架构

```
本地开发                         生产服务器
┌─────────────────┐              ┌─────────────────────────────┐
│  Vite 开发服务器  │  git push   │  PM2 → Express (端口 3001)  │
│  :3333           │ ──────────→ │    ├─ 静态文件 (dist/)       │
│  proxy → :3001   │             │    ├─ API 路由 (/api/*)      │
└─────────────────┘             │    ├─ 后台管理 (/admin/*)    │
                                 │    └─ SQLite 数据库          │
           deploy.sh             └─────────────────────────────┘
      (本地一键执行)                         ↑
                                          Nginx 反向代理
                                      (端口 80/443 → :3001)
```

## 首次部署（只需一次）

### 前置条件

- Node.js ≥ 22（服务器和本地都需要）
- 服务器已安装 PM2：`npm install -g pm2`
- 项目仓库：`git clone https://github.com/JonHaoo/LiMao.git`

### 步骤

#### 1. 宝塔面板：创建站点 & 申请 SSL

- 宝塔 → 网站 → 添加站点，输入域名
- 进入站点目录，记下路径（通常是 `/www/wwwroot/你的域名`）

#### 2. 宝塔面板：配置 Node 项目

宝塔 → 网站 → Node 项目 → 添加 Node 项目：

| 配置项 | 值 |
|---|---|
| 项目路径 | `/www/wwwroot/你的域名` |
| 启动文件 | `server/index.js` |
| 项目名称 | `limao` |
| 运行用户 | `www` |
| 端口 | `3001` |
| Node 版本 | 22+ |

点击启动（宝塔会自动用 PM2 管理进程，名称自动设为 `limao`）。

#### 3. 宝塔面板：配置 Nginx 反向代理

宝塔 → 网站 → 设置 → 反向代理 → 添加：

```
代理名称: limao
目标 URL: http://127.0.0.1:3001
```

然后在「配置文件」中确认或添加：

```nginx
location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

#### 4. 验证

- 访问 `https://你的域名` — 应看到官网首页
- 访问 `https://你的域名/admin` — 应进入后台管理页
- 访问 `https://你的域名/admin/login` — 首次注册管理员账号

---

## 热部署（日常更新）

本地执行：

```bash
./deploy.sh root@你的服务器IP
```

脚本自动完成：

| 步骤 | 说明 |
|---|---|
| `npm run build` | 构建前端 → `dist/` |
| `git push` | 推送到 GitHub |
| `ssh git pull + npm install` | 服务器拉取代码、更新后端依赖 |
| `pm2 restart limao` | 发送 SIGTERM，旧进程处理完请求后优雅退出，新进程接管 |

### 本地环境要求

```bash
node -v     # ≥ 22
npm -v      # ≥ 9
git --version
ssh-keygen -t ed25519 -C "your@email.com"     # 生成 SSH 密钥
# 然后将公钥添加到 GitHub（Settings → SSH and GPG keys）和服务器
```

### 首次运行部署脚本前

确保本地可以免密 SSH 到服务器：

```bash
ssh-copy-id root@你的服务器IP
```

---

## 数据

- 数据库文件：`server/limao.db`（SQLite）
- 数据库有 `.gitignore` 忽略，不会随 git 推送
- 迁移服务器时需手动备份这个文件
- 建议定期从服务器下载备份

## 回滚

如果部署后出现问题：

```bash
# 服务器上操作
cd /www/wwwroot/你的域名
git log --oneline -5          # 查看最近提交
git reset --hard <上一个正常提交的 hash>
pm2 restart limao
```
