# 个人成果展示站 · GitHub Pages 版

深色科技风、单页、零依赖（纯 HTML/CSS/JS），托管在 GitHub Pages 完全免费。
内置"上传 / 管理"面板：连接仓库后，可以直接在网页上上传文件、新增/编辑/删除作品。

```
portfolio/
├── index.html          页面结构（一般不用动）
├── assets/
│   ├── css/style.css   样式（想调颜色改这里的 :root 变量）
│   └── js/
│       ├── main.js     页面渲染 + 背景动效（一般不用动）
│       └── admin.js    管理面板 / GitHub 上传逻辑（一般不用动）
└── data/
    ├── site.js         ★ 你的名字、简介、联系方式 —— 改这里
    └── works.js        ★ 作品列表 —— 改这里，或在网页上管理
```

---

## 一、发布到 GitHub Pages（约 5 分钟）

> 本站已按 `https://zzj903.github.io` 配置好：站点地址、canonical、GitHub 链接、
> 管理面板的默认仓库（`zzj903/zzj903.github.io`）都已预填。
> **唯一要求：仓库名必须精确写成 `zzj903.github.io`**，否则地址不会是这个域名。

1. **建仓库**：登录 GitHub → New repository
   - Repository name 填 **`zzj903.github.io`**（必须是这个，大小写也不变）
   - 选 Public，**不要**勾选 README / .gitignore 等任何初始化选项
2. **上传文件**：打开仓库页面 → `Add file` → `Upload files`
   - 把 `portfolio` 文件夹里的**全部内容**拖进去（index.html、README.md、.nojekyll、assets、data 都在第一层，不要再套一层文件夹）
   - Commit changes
3. **开启 Pages**：仓库 → `Settings` → `Pages` → Source 选 `Deploy from a branch`，Branch 选 `main` / `(root)` → Save
4. 等待 1~2 分钟，访问 **<https://zzj903.github.io>** 即可

> 用户名下的 `<用户名>.github.io` 仓库是"用户主页仓库"，建好后默认就是这个域名，无需额外配置。

## 二、日常编辑内容的两种方式

### 方式 A：网页上直接管理（推荐）

1. 打开你的网站 → 右上角 **「上传 / 管理」**（或直接访问 <https://zzj903.github.io/#admin-conn>）
2. 切到 **「连接仓库」**：用户名 `zzj903`、仓库名 `zzj903.github.io`、分支 `main` 已经预填好了，**只需要粘一个 Token**（下面第三节），保存 → 点「测试」
3. 之后就可以：
   - **上传文件**：拖入图片/PDF，自动传到仓库 `uploads/` 目录，上传完可一键"设为封面"
   - **新增作品**：填表单 → 保存并发布，30–60 秒后网站自动更新
   - **已发布**：鼠标移到卡片右上角 ✎ 也能直接编辑；列表里可删除
4. Token 只保存在你自己电脑的浏览器里，换电脑需要重新填一次

### 方式 B：改文件

- 改名字/简介/联系方式：编辑 `data/site.js`
- 改作品：编辑 `data/works.js`（每个对象一张卡片，字段有注释）
- 提交到 GitHub：网页上 `Add file` → `Upload files` 覆盖上传，或用 git push
- 改主色调：`assets/css/style.css` 顶部的 `--accent` / `--accent-2`

没连仓库时，管理面板里也能编辑预览，并点"下载 works.js"把结果导出，手动拖回仓库。

## 三、创建 Token（只做一次）

### 方案 A · Fine-grained Token（推荐，只授权一个仓库）

1. 打开 <https://github.com/settings/personal-access-tokens/new>
2. **Token name** 随便填（如 `portfolio`），**Expiration** 选个过期时间
3. **Repository access** → 选 **Only select repositories** → 下拉里**勾选 `zzj903.github.io`**
4. **Permissions 默认是折叠的，要先点一下展开** → 进入 **Repository permissions**
5. 列表里找到 **Contents** → 右侧下拉改成 **Read and write**（其它保持 No access）
6. 页面底部 **Generate token** → 复制 `github_pat_` 开头的一整串

> **找不到 Permissions？** 基本都是因为第 3 步没勾仓库——不选仓库时权限列表不会出现。
> 中文界面路径：**权限 → 仓库权限 → 内容 → 读取和写入**。
> 如果 Repository access 的下拉里找不到这个仓库，说明仓库还没建，先做第一章。

### 方案 B · Classic Token（更省事，但权限更大）

1. 打开 <https://github.com/settings/tokens/new?scopes=repo&description=portfolio>（链接已自动勾好 repo）
2. Note 随便填，Expiration 可设为 No expiration
3. 确认 **Select scopes** 里只勾最上面的 **repo**
4. **Generate token** → 复制 `ghp_` 开头的一整串

Classic token **没有** "Repository permissions" 这一项，只有 scopes 勾选框，所以不用设 Contents。
代价是它对你账号下所有仓库都有写权限，泄露风险高于方案 A。

粘贴到管理面板 → 保存 → 点「测试」。测试会分两步告诉你结果：仓库能不能访问、Contents 能不能读。
常见报错对应关系：

| 提示 | 含义 |
| --- | --- |
| Token 无效或已过期（401） | 复制不完整，或 Token 被删了 |
| 访问不到 owner/repo（404） | 仓库名写错，或 Token 没勾这个仓库 |
| 仓库能访问但读不到文件（403） | Contents 权限没设成 Read and write |
| 分支或 data/ 目录读不到（404） | 分支名不对（新建仓库可能是 master） |

> 安全提示：Fine-grained token 只对这一个仓库有写权限，风险可控；
> 但不要把 token 发给别人，也不要在公共电脑上保存。

## 四、本地预览

直接双击 `index.html` 就能看（数据文件是 .js，无跨域限制）。
右上角"上传 / 管理"面板的一切编辑会即时反映到当前页面，连接仓库后才会真正写入 GitHub。

## 五、常见问题

| 问题 | 处理 |
| --- | --- |
| 打开是 404 | Pages 还没部署完；确认 `index.html` 在仓库根目录 |
| 改了作品没生效 | 强制刷新（Ctrl+F5）；Pages 重新部署约需 30–60 秒 |
| 上传报 401 | Token 过期/无效，重新生成 |
| 上传报 404 | 用户名/仓库名/分支填错；空仓库需先在网页上传过一次文件 |
| 图片太大 | 单文件限制 10MB，GitHub 单文件上限 100MB |
