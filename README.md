# 个人成果展示站 · GitHub Pages 版

深色科技风、单页、零依赖（纯 HTML/CSS/JS），托管在 GitHub Pages 完全免费。
站点地址：<https://zhao-9666.github.io>

```
portfolio/
├── index.html          页面结构（一般不用动）
├── mlp/
│   └── index.html      作品「涨跌之间 · 一个 MLP 的学习现场」的可视化页面
│                       （成果卡片点击后跳转到这里）
├── assets/
│   ├── css/style.css   样式（想调颜色改这里的 :root 变量）
│   └── js/main.js      页面渲染 + 背景动效（一般不用动）
└── data/
    ├── site.js         ★ 站名、简介、联系方式 —— 改这里
    └── works.js        ★ 作品列表 —— 改这里
```

---

## 一、发布到 GitHub Pages（约 5 分钟）

> **唯一要求：仓库名必须精确写成 `zhao-9666.github.io`**，否则地址不会是这个域名。

1. **建仓库**：登录 GitHub → New repository
   - Repository name 填 **`zhao-9666.github.io`**（大小写不变）
   - 选 Public，**不要**勾选 README / .gitignore 等任何初始化选项
2. **上传文件**：打开仓库页面 → `Add file` → `Upload files`
   - 把 `portfolio` 文件夹里的**全部内容**拖进去（index.html、README.md、.nojekyll、assets、data、mlp 都在第一层，不要再套一层文件夹）
   - 注意 `.nojekyll` 是隐藏文件，资源管理器需开启"显示隐藏项目"才能看到；或用 git 上传
   - Commit changes
3. **开启 Pages**：仓库 → `Settings` → `Pages` → Source 选 `Deploy from a branch`，Branch 选 `main` / `(root)` → Save
4. 等待 1~2 分钟，访问 **<https://zhao-9666.github.io>** 即可

## 二、日常编辑内容

所有内容都集中在 `data/` 目录，改完保存，再上传到 GitHub 仓库同名文件覆盖（或用 git push），30–60 秒后网站自动更新。

- **改站名 / 简介 / 邮箱 / 技能**：编辑 `data/site.js`
- **改作品**：编辑 `data/works.js`（每个对象就是一张卡片，字段有中文注释）
  - 「链接」支持站内相对路径（如 `mlp/`），点击卡片会在新标签打开对应页面
  - **想新增一个可点击进入的页面**：在站点里建一个子文件夹放 `index.html`（如 `my-page/`），再在 `works.js` 里新增一条，`url` 填 `my-page/` 即可
- **改主色调**：`assets/css/style.css` 顶部的 `--accent` / `--accent-2`

本地预览：直接双击 `index.html`，无需任何服务器。

## 三、常见问题

| 问题 | 处理 |
| --- | --- |
| 打开是 404 | Pages 还没部署完；确认 `index.html` 在仓库根目录 |
| 改了作品没生效 | 强制刷新（Ctrl+F5）；Pages 重新部署约需 30–60 秒 |
| 卡片点击没反应 | 检查 `works.js` 里这条的 `url` 是否填了、路径是否正确（区分大小写） |
| 图片想当封面 | 把图片放进仓库（如 `uploads/` 目录），`cover` 填相对路径 `uploads/xxx.png` |
