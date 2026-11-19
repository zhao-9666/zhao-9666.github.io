/* ============================================================
   main.js —— 渲染页面 + 背景动效
   这个文件一般不需要改，改内容请改 data/site.js 和 data/works.js
   ============================================================ */
(function () {
  "use strict";

  var SITE = window.SITE || {};
  var DATA = window.WORKS || { items: [] };
  var WORKS = Array.isArray(DATA.items) ? DATA.items.slice() : [];

  var $ = function (id) { return document.getElementById(id); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- 工具 ---------------- */
  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function hashCode(str) {
    var h = 0, s = String(str || "x");
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  }

  function coverCSS(seed) {
    // 限制在蓝-紫-青的色相区间，保持整体科技感统一
    var h = hashCode(seed);
    var a = 205 + (h % 68);      // 205 ~ 272
    var b = (a + 34) % 360;
    return (
      "background: radial-gradient(130% 130% at 18% 0%, hsl(" + a + " 62% 30% / .9), transparent 64%)," +
      "linear-gradient(152deg, hsl(" + b + " 48% 17%), #080d16 80%);"
    );
  }

  function firstChar(str) {
    var s = String(str || "").trim();
    return s ? s.charAt(0).toUpperCase() : "·";
  }

  /* ---------------- 渲染站点信息 ---------------- */
  function renderSite() {
    var name = SITE.name || "Portfolio";

    document.title = name + " · 作品集";
    if ($("brandText")) $("brandText").textContent = name;
    if ($("heroName")) $("heroName").textContent = name;
    if ($("footerName")) $("footerName").textContent = name;

    if ($("heroRole")) $("heroRole").textContent = SITE.role || "PORTFOLIO";
    if ($("heroTagline")) $("heroTagline").textContent = SITE.tagline || "";

    // 统计
    var cats = [];
    WORKS.forEach(function (w) {
      var c = w.category || "其他";
      if (cats.indexOf(c) === -1) cats.push(c);
    });
    if ($("statWorks")) $("statWorks").textContent = WORKS.length;
    if ($("statCats")) $("statCats").textContent = cats.length;
    if ($("statUpdated")) {
      var u = DATA.updated || "";
      $("statUpdated").textContent = u ? u.slice(0, 7).replace("-", ".") : "—";
    }
    if ($("statLoc")) $("statLoc").textContent = SITE.location || "—";

    // 关于
    var aboutEl = $("aboutText");
    if (aboutEl) {
      var paras = String(SITE.intro || "").split(/\n+/).filter(Boolean);
      aboutEl.innerHTML = paras.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
      if (!paras.length) aboutEl.innerHTML = "<p>" + esc("还没有填写简介，打开 data/site.js 修改即可。") + "</p>";
    }

    // 技能
    var skillsEl = $("skills");
    if (skillsEl) {
      var list = Array.isArray(SITE.skills) ? SITE.skills : [];
      skillsEl.innerHTML = list.length
        ? list.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("")
        : '<li style="color:var(--muted-2);border:0;padding:6px 0">暂无</li>';
    }

    // 邮箱 & 链接
    var mail = SITE.email || "";
    if ($("mailText")) $("mailText").textContent = mail || "（未填写邮箱）";
    if ($("mailLink")) $("mailLink").setAttribute("href", mail ? "mailto:" + mail : "#");

    var linksEl = $("links");
    if (linksEl) {
      var links = Array.isArray(SITE.links) ? SITE.links : [];
      linksEl.innerHTML = links
        .filter(function (l) { return l && l.url; })
        .map(function (l) {
          return '<li><a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.label || l.url) + "</a></li>";
        })
        .join("");
    }
  }

  /* ---------------- 渲染作品 ---------------- */
  var activeFilter = "全部";

  function sortedWorks() {
    return WORKS.slice().sort(function (a, b) {
      var fa = a.featured ? 1 : 0, fb = b.featured ? 1 : 0;
      if (fa !== fb) return fb - fa;
      return String(b.year || "").localeCompare(String(a.year || ""));
    });
  }

  function cardHTML(w) {
    var cat = w.category || "其他";
    var title = w.title || "未命名";
    var tags = Array.isArray(w.tags) ? w.tags : [];
    var media = w.cover
      ? '<img src="' + esc(w.cover) + '" alt="' + esc(title) + '" loading="lazy" onerror="this.style.display=\'none\'" />'
      : "";
    var ph = w.cover ? "" : '<div class="card-ph" style="' + coverCSS(title) + '">' + esc(firstChar(title)) + "</div>";

    return (
      '<article class="card" data-cat="' + esc(cat) + '" data-id="' + esc(w.id || title) + '">' +
        '<div class="card-media">' +
          '<span class="card-badge">' + esc(cat) + (w.year ? " · " + esc(w.year) : "") + "</span>" +
          media + ph +
        "</div>" +
        '<div class="card-body">' +
          '<h3 class="card-title">' + esc(title) + "</h3>" +
          '<p class="card-desc">' + esc(w.description || "") + "</p>" +
          (tags.length
            ? '<div class="card-tags">' + tags.map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") + "</div>"
            : "") +
          '<div class="card-foot">' +
            "<span>" + esc(w.year || "—") + "</span>" +
            (w.url
              ? '<a class="card-link" href="' + esc(w.url) + '" target="_blank" rel="noopener">查看 ↗</a>'
              : '<span style="opacity:.45">NO LINK</span>') +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function renderChips() {
    var el = $("filters");
    if (!el) return;
    var cats = [];
    sortedWorks().forEach(function (w) {
      var c = w.category || "其他";
      if (cats.indexOf(c) === -1) cats.push(c);
    });
    var all = ["全部"].concat(cats);
    el.innerHTML = all
      .map(function (c) {
        return '<button class="chip' + (c === activeFilter ? " is-active" : "") + '" type="button" data-filter="' + esc(c) + '" role="tab">' + esc(c) + "</button>";
      })
      .join("");
  }

  function renderGrid() {
    var grid = $("grid");
    if (!grid) return;
    var items = sortedWorks().filter(function (w) {
      return activeFilter === "全部" || (w.category || "其他") === activeFilter;
    });

    grid.innerHTML = items.map(cardHTML).join("");
    if ($("empty")) $("empty").hidden = items.length > 0;

    // 依次进场
    var cards = grid.querySelectorAll(".card");
    for (var i = 0; i < cards.length; i++) {
      (function (card, idx) {
        if (reduceMotion) { card.classList.add("is-in"); return; }
        setTimeout(function () { card.classList.add("is-in"); }, 40 + idx * 55);
      })(cards[i], i);
    }
  }

  function renderAll() {
    renderSite();
    renderChips();
    renderGrid();
  }

  /* ---------------- 交互 ---------------- */
  function bindUI() {
    var filters = $("filters");
    if (filters) {
      filters.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-filter]");
        if (!btn) return;
        activeFilter = btn.getAttribute("data-filter");
        renderChips();
        renderGrid();
      });
    }

    var grid = $("grid");
    if (grid) {
      grid.addEventListener("click", function (e) {
        var card = e.target.closest(".card");
        if (!card) return;
        var id = card.getAttribute("data-id");
        var item = WORKS.filter(function (w) { return (w.id || w.title) === id; })[0];
        if (item && item.url && !e.target.closest("a")) window.open(item.url, "_blank", "noopener");
      });
    }

    // 导航滚动状态
    var nav = $("nav");
    function onScroll() {
      if (!nav) return;
      nav.classList.toggle("is-scrolled", window.scrollY > 12);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // reveal：默认可见，只有首屏之外的元素才走滚动进入动画
    var reveals = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window && !reduceMotion) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("is-in");
            en.target.classList.remove("is-hidden");
            io.unobserve(en.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
      reveals.forEach(function (el) {
        if (el.getBoundingClientRect().top > window.innerHeight * 0.92) {
          el.classList.add("is-hidden");
          io.observe(el);
        }
      });
    }
  }

  /* ---------------- 鼠标光晕 ---------------- */
  function bindSpotlight() {
    var el = $("spotlight");
    if (!el || reduceMotion || window.matchMedia("(hover: none)").matches) {
      if (el) el.style.display = "none";
      return;
    }
    var raf = null;
    window.addEventListener("pointermove", function (e) {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        el.style.transform = "translate3d(" + e.clientX + "px," + e.clientY + "px,0)";
        raf = null;
      });
    }, { passive: true });
  }

  /* ---------------- 背景粒子网络 ---------------- */
  function initCanvas() {
    var canvas = $("bg-canvas");
    if (!canvas || reduceMotion) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, pts = [];
    var mouse = { x: -9999, y: -9999 };

    function resize() {
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var count = Math.max(22, Math.min(78, Math.floor((W * H) / 22000)));
      pts = [];
      for (var i = 0; i < count; i++) {
        pts.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          r: Math.random() * 1.5 + 0.6
        });
      }
    }

    var LINK = 132;

    function draw() {
      ctx.clearRect(0, 0, W, H);

      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20) p.x = W + 20;
        if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20;
        if (p.y > H + 20) p.y = -20;

        var dxm = p.x - mouse.x, dym = p.y - mouse.y;
        var dm = Math.sqrt(dxm * dxm + dym * dym);
        var near = dm < 190;

        ctx.beginPath();
        ctx.arc(p.x, p.y, near ? p.r * 1.7 : p.r, 0, Math.PI * 2);
        ctx.fillStyle = near ? "rgba(120, 190, 255, .85)" : "rgba(140, 170, 220, .5)";
        ctx.fill();
      }

      for (var a = 0; a < pts.length; a++) {
        for (var b = a + 1; b < pts.length; b++) {
          var dx = pts[a].x - pts[b].x;
          var dy = pts[a].y - pts[b].y;
          var d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            var alpha = (1 - Math.sqrt(d2) / LINK) * 0.26;
            ctx.beginPath();
            ctx.moveTo(pts[a].x, pts[a].y);
            ctx.lineTo(pts[b].x, pts[b].y);
            ctx.strokeStyle = "rgba(120, 160, 235, " + alpha.toFixed(3) + ")";
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(draw);
    }

    resize();
    draw();

    var t;
    window.addEventListener("resize", function () {
      clearTimeout(t);
      t = setTimeout(resize, 180);
    });
    window.addEventListener("pointermove", function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }, { passive: true });
    window.addEventListener("pointerleave", function () {
      mouse.x = -9999;
      mouse.y = -9999;
    });
  }

  /* ---------------- 对外接口（给管理面板用） ---------------- */
  window.SiteApp = {
    getWorks: function () { return WORKS.slice(); },
    getCategories: function () {
      var cats = [];
      WORKS.forEach(function (w) {
        var c = w.category || "其他";
        if (cats.indexOf(c) === -1) cats.push(c);
      });
      return cats;
    },
    setWorks: function (items) {
      WORKS = Array.isArray(items) ? items.slice() : [];
      renderAll();
    },
    addOrUpdate: function (item) {
      var idx = -1;
      for (var i = 0; i < WORKS.length; i++) {
        if ((WORKS[i].id || WORKS[i].title) === (item.id || item.title)) { idx = i; break; }
      }
      if (idx >= 0) WORKS[idx] = Object.assign({}, WORKS[idx], item);
      else WORKS.push(item);
      renderAll();
    },
    remove: function (id) {
      WORKS = WORKS.filter(function (w) { return (w.id || w.title) !== id; });
      renderAll();
    },
    rerender: renderAll,
    esc: esc,
    hashCode: hashCode,
    coverCSS: coverCSS,
    firstChar: firstChar
  };

  /* ---------------- 启动 ---------------- */
  document.addEventListener("DOMContentLoaded", function () {
    renderAll();
    bindUI();
    bindSpotlight();
    initCanvas();
  });
})();
