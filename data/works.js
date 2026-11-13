/* ============================================================
   作品列表 —— 每一项就是首页的一张卡片
   ------------------------------------------------------------
   字段说明：
     id          唯一标识，留空会自动生成
     title       标题
     category    分类（用于顶部筛选，可自由填写，如：项目 / 写作 / 设计）
     year        年份
     description 一两句话说明
     tags        标签数组
     cover       封面图地址；留空会自动生成渐变封面
     url         点击卡片跳转的地址（可留空）
     featured    是否置顶（true 会排在最前）
   ============================================================ */

window.WORKS = {
  updated: "2026-11-13",
  items: [
    {
      id: "w-001",
      title: "数据看板重设计",
      category: "项目",
      year: "2025",
      description:
        "为运营团队重构的信息看板，把 12 个分散的报表收拢到一屏，查询时间从平均 4 分钟降到 20 秒。",
      tags: ["React", "可视化", "信息架构"],
      cover: "",
      url: "",
      featured: true
    },
    {
      id: "w-002",
      title: "个人效率系统",
      category: "项目",
      year: "2025",
      description:
        "一套自用的任务与笔记流，用纯文本文件驱动，支持全文检索和自动归档，已经在本地稳定跑了两年。",
      tags: ["Node.js", "本地优先"],
      cover: "",
      url: "",
      featured: false
    },
    {
      id: "w-003",
      title: "关于「简洁」的三种误解",
      category: "写作",
      year: "2024",
      description:
        "简洁不等于少，而是每个元素都承担明确的职责。这篇梳理了我在实际项目里踩过的坑。",
      tags: ["设计思考", "长文"],
      cover: "",
      url: "",
      featured: false
    },
    {
      id: "w-004",
      title: "动效语言规范",
      category: "设计",
      year: "2024",
      description:
        "为产品建立的一套动效规则：时长、缓动、层级位移的统一约定，附可复用的参数表。",
      tags: ["Design System", "Motion"],
      cover: "",
      url: "",
      featured: false
    },
    {
      id: "w-005",
      title: "城市几何 · 摄影集",
      category: "设计",
      year: "2023",
      description: "两年里拍下的建筑立面与光影切片，共 48 张，探索秩序与偶然的交界。",
      tags: ["摄影", "视觉"],
      cover: "",
      url: "",
      featured: false
    },
    {
      id: "w-006",
      title: "开源组件库维护",
      category: "项目",
      year: "2023",
      description:
        "维护一个轻量表单组件库，累计 1.2k star，处理了 200+ issue，建立了完整的测试与发版流程。",
      tags: ["开源", "TypeScript"],
      cover: "",
      url: "",
      featured: false
    }
  ]
};
