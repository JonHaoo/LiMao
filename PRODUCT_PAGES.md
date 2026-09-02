# 产品子页面统一结构

所有产品详情子页面统一放在 `public/products/`，每个产品一个目录，页面入口统一命名为 `index.html`。

```text
public/products/
├── assets/                  # 共用样式与交互脚本
│   ├── products.css
│   └── products.js
├── marketing-drainage/      # 全平台自动化营销引流工具
│   └── index.html
├── ai-outbound/             # AI外呼系统（AI电销机器人）
│   └── index.html
├── ai-video/                # AI视频系统
│   ├── index.html           # 版本价格表
│   ├── features.html        # 功能详情说明
│   └── ai-video.css
└── geo/                     # 企业GEO
    ├── index.html
    ├── geo.css
    ├── geo.js
    └── geo-city-network-v2.png
```

## 新增产品模块

1. 在 `public/products/` 下新建以英文短横线命名的目录，例如 `public/products/new-module/`。
2. 在该目录中创建 `index.html`，页面资源放在产品目录内部；需要通用站点头部、按钮和滚动样式时，引用 `../assets/products.css` 与 `../assets/products.js`。
3. 每个产品需要独立配色或独有组件时，在该产品目录内放置自己的 CSS 文件。
4. 更新官网首页的“产品中心”下拉菜单和首页产品模块简介卡片中的入口链接。
