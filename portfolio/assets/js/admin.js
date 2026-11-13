/* ============================================================
   admin.js —— 内容管理面板
   功能：连接 GitHub 仓库后，可在网页上直接
         1) 上传文件到仓库
         2) 新增 / 编辑 / 删除作品
         无需任何服务器，用的是 GitHub 官方 API
   ============================================================ */
(function () {
  "use strict";

  var CFG_KEY = "portfolio.git.v1";
  var cfg = loadCfg();
  var editingId = null;
  var $ = function (id) { return document.getElementById(id); };

  /* ---------------- 配置读写 ---------------- */
  function defaults() {
    var d = (window.SITE && window.SITE.repo) || {};
    return {
      owner: d.owner || "",
      name: d.name || "",
      branch: d.branch || "main",
      token: ""
    };
  }

  function loadCfg() {
    var base = defaults();
    try {
      var raw = localStorage.getItem(CFG_KEY);
      if (!raw) return base;
      var saved = JSON.parse(raw) || {};
      return {
        owner: saved.owner || base.owner,
        name: saved.name || base.name,
        branch: saved.branch || base.branch,
        token: saved.token || ""
      };
    } catch (e) {
      return base;
    }
  }

  function saveCfg() {
    try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) {}
  }

  function isConnected() {
    return !!(cfg.owner && cfg.name && cfg.token);
  }

  /* ---------------- 小工具 ---------------- */
  function utf8ToB64(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  function fileToB64(file) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () {
        var s = String(fr.result);
        resolve(s.slice(s.indexOf(",") + 1));
      };
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }

  function safeName(name) {
    var dot = name.lastIndexOf(".");
    var base = dot > 0 ? name.slice(0, dot) : name;
    var ext = dot > 0 ? name.slice(dot) : "";
    base = base.replace(/[^\w\u4e00-\u9fa5-]+/g, "-").slice(0, 48).replace(/^-+|-+$/g, "");
    return (base || "file") + ext.toLowerCase();
  }

  function encPath(path) {
    return path.split("/").map(encodeURIComponent).join("/");
  }

  function today() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  function setStatus(id, msg, kind) {
    var el = $(id);
    if (!el) return;
    el.textContent = msg || "";
    el.className = "status" + (kind ? " " + kind : "");
  }

  /* ---------------- GitHub API ---------------- */
  function apiBase() {
    return "https://api.github.com/repos/" + cfg.owner + "/" + cfg.name;
  }

  function msgFor(status, json) {
    var detail = json && json.message ? "（" + json.message + "）" : "";
    if (status === 401) return "Token 无效或已过期，请重新生成" + detail;
    if (status === 403)
      return "没有写入权限。若用 Fine-grained Token，请确认 Permissions → Repository permissions → Contents 已设为 Read and write，且 Token 勾选了这个仓库" + detail;
    if (status === 404)
      return "找不到仓库或分支。若仓库确实存在，多半是 Token 没有勾选它（Repository access → Only select repositories），或分支名不是 " + (cfg.branch || "main") + detail;
    if (status === 409) return "文件冲突，刷新页面后重试" + detail;
    if (status === 422) return "提交被拒绝，可能是文件过大" + detail;
    return "请求失败 " + status + detail;
  }

  async function api(path, opts) {
    opts = opts || {};
    var res = await fetch("https://api.github.com" + path, {
      method: opts.method || "GET",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: "Bearer " + cfg.token,
        "X-GitHub-Api-Version": "2022-11-28"
      },
      body: opts.body
    });
    var text = await res.text();
    var json = null;
    try { json = text ? JSON.parse(text) : null; } catch (e) {}
    if (!res.ok) {
      var err = new Error(msgFor(res.status, json));
      err.status = res.status;
      throw err;
    }
    return json;
  }

  async function getFileMeta(path) {
    try {
      return await api("/repos/" + cfg.owner + "/" + cfg.name + "/contents/" + encPath(path) + "?ref=" + encodeURIComponent(cfg.branch || "main"));
    } catch (e) {
      if (e.status === 404) return null;
      throw e;
    }
  }

  async function putFile(path, content, message, alreadyBase64) {
    var meta = await getFileMeta(path);
    var body = {
      message: message,
      branch: cfg.branch || "main",
      content: alreadyBase64 ? content : utf8ToB64(content)
    };
    if (meta && meta.sha) body.sha = meta.sha;
    return api("/repos/" + cfg.owner + "/" + cfg.name + "/contents/" + encPath(path), {
      method: "PUT",
      body: JSON.stringify(body)
    });
  }

  /* ---------------- works.js 生成 ---------------- */
  function buildWorksFile(items) {
    var header =
      "/* ============================================================\n" +
      "   作品列表 —— 每一项就是首页的一张卡片\n" +
      "   （这个文件由网页上的管理面板自动生成，也可以手动编辑）\n" +
      "   ============================================================ */\n\n";
    return header + "window.WORKS = " + JSON.stringify({ updated: today(), items: items }, null, 2) + ";\n";
  }

  function downloadWorks() {
    var items = window.SiteApp ? window.SiteApp.getWorks() : [];
    var blob = new Blob([buildWorksFile(items)], { type: "text/javascript;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "works.js";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  async function publish(items, message) {
    if (!isConnected()) {
      setStatus("formStatus", "尚未连接仓库：已保存在当前页面，可下载 works.js 手动覆盖", "err");
      return { ok: false, local: true };
    }
    await putFile("data/works.js", buildWorksFile(items), message || "更新作品列表");
    return { ok: true };
  }

  /* ---------------- 面板开关 ---------------- */
  function openPanel(tab) {
    var panel = $("panel"), scrim = $("scrim");
    if (!panel) return;
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    if (scrim) scrim.classList.add("is-open");
    document.body.classList.add("is-locked");
    if (tab) switchTab(tab);
  }

  function closePanel() {
    var panel = $("panel"), scrim = $("scrim");
    if (!panel) return;
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    if (scrim) scrim.classList.remove("is-open");
    document.body.classList.remove("is-locked");
  }

  function switchTab(name) {
    document.querySelectorAll(".panel-tabs button").forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-tab") === name);
    });
    document.querySelectorAll(".pane").forEach(function (p) {
      p.classList.toggle("is-active", p.getAttribute("data-pane") === name);
    });
    if (name === "list") renderWorkList();
    if (name === "conn") fillConnForm();
  }

  /* ---------------- 表单 ---------------- */
  function fillConnForm() {
    if ($("c-owner")) $("c-owner").value = cfg.owner || "";
    if ($("c-repo")) $("c-repo").value = cfg.name || "";
    if ($("c-branch")) $("c-branch").value = cfg.branch || "main";
    if ($("c-token")) $("c-token").value = cfg.token || "";
  }

  function resetForm() {
    editingId = null;
    ["f-title", "f-category", "f-year", "f-desc", "f-tags", "f-url", "f-cover"].forEach(function (id) {
      if ($(id)) $(id).value = "";
    });
    if ($("f-featured")) $("f-featured").checked = false;
    if ($("f-id")) $("f-id").value = "";
    if ($("saveWork")) $("saveWork").textContent = "保存并发布";
    setStatus("formStatus", "");
  }

  function fillForm(item) {
    editingId = item.id || item.title;
    $("f-id").value = editingId;
    $("f-title").value = item.title || "";
    $("f-category").value = item.category || "";
    $("f-year").value = item.year || "";
    $("f-desc").value = item.description || "";
    $("f-tags").value = (item.tags || []).join(", ");
    $("f-url").value = item.url || "";
    $("f-cover").value = item.cover || "";
    $("f-featured").checked = !!item.featured;
    $("saveWork").textContent = "更新这条作品";
    switchTab("edit");
    openPanel("edit");
    setStatus("formStatus", "正在编辑：" + (item.title || ""), "");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    var title = $("f-title").value.trim();
    var desc = $("f-desc").value.trim();
    if (!title || !desc) {
      setStatus("formStatus", "标题和简介都要填", "err");
      return;
    }

    var item = {
      id: editingId || "w-" + Date.now().toString(36),
      title: title,
      category: $("f-category").value.trim() || "其他",
      year: $("f-year").value.trim() || String(new Date().getFullYear()),
      description: desc,
      tags: $("f-tags").value.split(/[,，]/).map(function (s) { return s.trim(); }).filter(Boolean),
      cover: $("f-cover").value.trim(),
      url: $("f-url").value.trim(),
      featured: $("f-featured").checked
    };

    $("saveWork").disabled = true;
    setStatus("formStatus", "正在保存…", "");

    try {
      window.SiteApp.addOrUpdate(item);
      var items = window.SiteApp.getWorks();
      var r = await publish(items, (editingId ? "更新作品：" : "新增作品：") + title);
      if (r.ok) {
        setStatus("formStatus", "已发布，GitHub Pages 约 30–60 秒后更新 ✓", "ok");
        resetForm();
        renderWorkList();
      } else if (r.local) {
        setStatus("formStatus", "已更新当前页面预览。点下方按钮下载 works.js，拖到仓库 data/ 目录覆盖即可。", "err");
      }
    } catch (err) {
      setStatus("formStatus", err.message || "保存失败", "err");
    } finally {
      $("saveWork").disabled = false;
    }
  }

  /* ---------------- 已发布列表 ---------------- */
  function renderWorkList() {
    var el = $("workList");
    if (!el) return;
    var items = window.SiteApp ? window.SiteApp.getWorks() : [];
    if (!items.length) {
      el.innerHTML = '<li style="justify-content:center;color:var(--muted-2);font-size:12.5px">还没有作品</li>';
      return;
    }
    el.innerHTML = items
      .map(function (w) {
        var id = w.id || w.title;
        return (
          '<li data-item="' + window.SiteApp.esc(id) + '">' +
            '<div class="wl-main">' +
              '<div class="wl-title">' + window.SiteApp.esc(w.title || "未命名") + "</div>" +
              '<div class="wl-meta">' + window.SiteApp.esc(w.category || "其他") + " · " + window.SiteApp.esc(w.year || "—") + "</div>" +
            "</div>" +
            '<button class="icon-btn" type="button" data-act="edit" title="编辑">' +
              '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>' +
            "</button>" +
            '<button class="icon-btn" type="button" data-act="del" title="删除">' +
              '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>' +
            "</button>" +
          "</li>"
        );
      })
      .join("");
  }

  async function deleteWork(id) {
    var items = window.SiteApp.getWorks();
    var target = items.filter(function (w) { return (w.id || w.title) === id; })[0];
    if (!target) return;
    if (!confirm("确定删除「" + (target.title || id) + "」？")) return;

    var rest = items.filter(function (w) { return (w.id || w.title) !== id; });
    window.SiteApp.setWorks(rest);
    renderWorkList();

    try {
      var r = await publish(rest, "删除作品：" + (target.title || id));
      if (!r.ok) setStatus("formStatus", "已从页面移除。请下载 works.js 覆盖到仓库。", "err");
    } catch (err) {
      alert("删除已生效于当前页面，但提交到 GitHub 失败：" + err.message);
    }
  }

  /* ---------------- 文件上传 ---------------- */
  function addUploadRow(name) {
    var list = $("uploadList");
    var li = document.createElement("li");
    li.innerHTML = '<span class="up-name">' + window.SiteApp.esc(name) + '</span><span style="margin-left:auto;flex:none">上传中…</span>';
    list.prepend(li);
    return li;
  }

  async function uploadFiles(files) {
    if (!files || !files.length) return;
    if (!isConnected()) {
      switchTab("conn");
      setStatus("connStatus", "先连接 GitHub 仓库才能上传文件", "err");
      return;
    }

    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      var row = addUploadRow(file.name);

      if (file.size > 10 * 1024 * 1024) {
        row.innerHTML = '<span class="up-name">' + window.SiteApp.esc(file.name) + '</span><span class="err" style="margin-left:auto;flex:none">超过 10MB</span>';
        continue;
      }

      try {
        var path = "uploads/" + Date.now() + "-" + safeName(file.name);
        var b64 = await fileToB64(file);
        await putFile(path, b64, "上传文件：" + file.name, true);
        row.innerHTML =
          '<span class="ok" style="flex:none">✓</span>' +
          '<code data-copy="' + window.SiteApp.esc(path) + '" title="点击复制路径">' + window.SiteApp.esc(path) + "</code>" +
          '<button class="icon-btn" type="button" data-cover="' + window.SiteApp.esc(path) + '" style="margin-left:auto;flex:none;width:26px;height:26px" title="设为封面">封面</button>';
      } catch (err) {
        row.innerHTML = '<span class="up-name">' + window.SiteApp.esc(file.name) + '</span><span class="err" style="margin-left:auto;flex:none">' + window.SiteApp.esc(err.message || "失败") + "</span>";
      }
    }
  }

  /* ---------------- 连接 ---------------- */
  async function testConnection() {
    setStatus("connStatus", "正在测试…", "");
    var branch = cfg.branch || "main";

    // 第一步：仓库是否可见
    var repo;
    try {
      repo = await api("/repos/" + cfg.owner + "/" + cfg.name);
    } catch (err) {
      if (err.status === 404) {
        setStatus(
          "connStatus",
          "访问不到 " + cfg.owner + "/" + cfg.name +
          "：①仓库名是否精确（应为 zzj903.github.io）；②Token 是否勾选了这个仓库（Repository access → Only select repositories）",
          "err"
        );
      } else {
        setStatus("connStatus", err.message || "连接失败", "err");
      }
      return;
    }

    // 第二步：能否读到分支里的文件（Contents 权限 / 分支是否存在）
    try {
      await api("/repos/" + cfg.owner + "/" + cfg.name + "/contents/data?ref=" + encodeURIComponent(branch));
      setStatus(
        "connStatus",
        "连接成功 ✓ 默认分支 " + repo.default_branch + "，Contents 可读，可以开始上传了",
        "ok"
      );
    } catch (err2) {
      if (err2.status === 404) {
        setStatus(
          "connStatus",
          "仓库能访问，但分支「" + branch + "」或 data/ 目录读不到。请确认分支名（新建仓库通常是 main，也可能是 master）",
          "err"
        );
      } else if (err2.status === 403) {
        setStatus(
          "connStatus",
          "仓库能访问，但 Token 读不到文件内容：请在 Token 的 Permissions → Repository permissions 里把 Contents 设为 Read and write",
          "err"
        );
      } else {
        setStatus("connStatus", err2.message || "读取内容失败", "err");
      }
    }
  }

  /* ---------------- Token 形态自检 ---------------- */
  function tokenHint(token) {
    if (/^github_pat_[A-Za-z0-9_]{20,}$/.test(token)) return { kind: "fine", msg: "已识别为 Fine-grained Token" };
    if (/^ghp_[A-Za-z0-9]{20,}$/.test(token)) return { kind: "classic", msg: "已识别为 Classic Token（需确认勾选了 repo）" };
    if (/\s/.test(token)) return { kind: "bad", msg: "Token 里含有空格或换行，复制时多带了字符，请重新粘贴" };
    if (token.length < 20) return { kind: "bad", msg: "Token 看起来不完整，请复制完整的一整串" };
    return { kind: "unknown", msg: "Token 格式不常见，仍然可以试一下" };
  }

  /* ---------------- 同步 UI ---------------- */
  function sync() {
    // 连接提示
    var hint = $("connHint");
    if (hint) {
      if (isConnected()) {
        hint.className = "hint";
        hint.innerHTML = "已连接 <b>" + window.SiteApp.esc(cfg.owner + "/" + cfg.name) + "</b>（分支 " + window.SiteApp.esc(cfg.branch || "main") + "）。上传后 30–60 秒自动生效。";
      } else {
        hint.className = "hint is-warn";
        hint.innerHTML = "还没连接仓库。先去「连接仓库」填一次信息，之后就能在这里直接上传文件、发布作品。";
      }
    }

    // 分类候选
    var dl = $("catList");
    if (dl && window.SiteApp) {
      var cats = window.SiteApp.getCategories();
      dl.innerHTML = cats.map(function (c) { return '<option value="' + window.SiteApp.esc(c) + '"></option>'; }).join("");
    }

    renderWorkList();
  }

  /* ---------------- 事件绑定 ---------------- */
  function bind() {
    if ($("openPanel")) $("openPanel").addEventListener("click", function () { openPanel(); });
    if ($("openPanelHero")) $("openPanelHero").addEventListener("click", function () { openPanel("upload"); });
    if ($("closePanel")) $("closePanel").addEventListener("click", closePanel);
    if ($("scrim")) $("scrim").addEventListener("click", closePanel);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closePanel();
    });

    document.querySelectorAll(".panel-tabs button").forEach(function (b) {
      b.addEventListener("click", function () { switchTab(b.getAttribute("data-tab")); });
    });

    // 拖拽上传
    var drop = $("drop"), input = $("fileInput");
    if (drop && input) {
      drop.addEventListener("click", function () { input.click(); });
      input.addEventListener("change", function () {
        uploadFiles(input.files);
        input.value = "";
      });
      ["dragenter", "dragover"].forEach(function (ev) {
        drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("is-over"); });
      });
      ["dragleave", "drop"].forEach(function (ev) {
        drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("is-over"); });
      });
      drop.addEventListener("drop", function (e) {
        if (e.dataTransfer && e.dataTransfer.files) uploadFiles(e.dataTransfer.files);
      });
    }

    // 上传结果：复制路径 / 设为封面
    var upList = $("uploadList");
    if (upList) {
      upList.addEventListener("click", function (e) {
        var code = e.target.closest("[data-copy]");
        if (code) {
          var p = code.getAttribute("data-copy");
          navigator.clipboard && navigator.clipboard.writeText(p);
          code.textContent = "已复制 ✓";
          setTimeout(function () { code.textContent = p; }, 1200);
          return;
        }
        var cov = e.target.closest("[data-cover]");
        if (cov) {
          if ($("f-cover")) $("f-cover").value = cov.getAttribute("data-cover");
          switchTab("edit");
          setStatus("formStatus", "封面已填入，接着填标题和简介即可发布", "ok");
        }
      });
    }

    // 已发布列表操作
    var wl = $("workList");
    if (wl) {
      wl.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-act]");
        if (!btn) return;
        var li = btn.closest("[data-item]");
        var id = li.getAttribute("data-item");
        if (btn.getAttribute("data-act") === "del") deleteWork(id);
        else {
          var item = window.SiteApp.getWorks().filter(function (w) { return (w.id || w.title) === id; })[0];
          if (item) fillForm(item);
        }
      });
    }

    // 表单
    if ($("workForm")) $("workForm").addEventListener("submit", handleSubmit);
    if ($("resetForm")) $("resetForm").addEventListener("click", resetForm);
    if ($("downloadWorks")) $("downloadWorks").addEventListener("click", downloadWorks);

    // 连接
    if ($("saveConn")) {
      $("saveConn").addEventListener("click", function () {
        cfg.owner = $("c-owner").value.trim();
        cfg.name = $("c-repo").value.trim();
        cfg.branch = $("c-branch").value.trim() || "main";
        cfg.token = $("c-token").value.trim();
        if (!cfg.owner || !cfg.name || !cfg.token) {
          setStatus("connStatus", "用户名、仓库名、Token 三项都要填写", "err");
          return;
        }
        saveCfg();
        sync();

        var hint = tokenHint(cfg.token);
        if (hint.kind === "bad") {
          setStatus("connStatus", hint.msg, "err");
        } else {
          setStatus("connStatus", "已保存 · " + hint.msg + "，点「测试」确认连接", "ok");
        }
      });
    }
    if ($("testConn")) $("testConn").addEventListener("click", testConnection);
  }

  /* ---------------- 对外 ---------------- */
  window.Admin = {
    open: openPanel,
    close: closePanel,
    edit: function (id) {
      var item = window.SiteApp.getWorks().filter(function (w) { return (w.id || w.title) === id; })[0];
      if (item) fillForm(item);
      else openPanel("edit");
    },
    sync: sync,
    isConnected: isConnected
  };

  document.addEventListener("DOMContentLoaded", function () {
    bind();
    fillConnForm();
    sync();

    // 支持 #admin 直达管理面板（例如 index.html#admin-conn），方便收藏
    if (location.hash.indexOf("#admin") === 0) {
      var tab = location.hash.split("-")[1] || "";
      openPanel(tab || undefined);
    }
  });
})();
