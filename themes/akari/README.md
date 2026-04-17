# Akari - ACG 风格 Hexo 主题

一个简洁、美观、可扩展的 ACG 风格 Hexo 博客主题。

![Akari Theme](https://img.shields.io/badge/version-1.0.0-primary)
![Hexo](https://img.shields.io/badge/Hexo-%3E%3D5.0.0-red)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 特性

-   🎨 **ACG 风格设计** - 清新、轻量、二次元审美
-   🌙 **深色模式** - 自动/手动切换，保护视力
-   📱 **响应式布局** - 完美适配各种设备
-   ⚡ **高性能** - 优化的加载速度
-   🧩 **模块化设计** - 易于扩展和维护
-   🎵 **音乐播放器** - 支持网易云/Spotify
-   💬 **评论系统** - 支持 Giscus/Valine/Utterances
-   🖼️ **每日美图** - ACG 图片 API 集成

---

## 预览

![Preview](./screenshot.png)

---

## 安装

```bash
cd your-hexo-blog
git clone https://github.com/yourname/hexo-theme-akari.git themes/akari
```

然后在 `_config.yml` 中设置主题：

```yaml
theme: akari
```

---

## 目录结构

```
themes/akari/
├── _config.yml              # 主题配置文件
├── layout/
│   ├── layout.ejs           # 基础布局模板
│   ├── index.ejs            # 首页
│   ├── post.ejs             # 文章页
│   ├── page.ejs             # 单页 (关于页等)
│   ├── archive.ejs          # 归档页
│   ├── category.ejs         # 分类页
│   ├── tag.ejs              # 标签页
│   └── partial/
│       ├── header.ejs       # 头部导航
│       ├── footer.ejs       # 页脚
│       ├── daily-image.ejs  # 每日美图
│       ├── featured-posts.ejs # 精选文章
│       ├── post-card.ejs    # 文章卡片
│       ├── profile-card.ejs # 个人资料卡片
│       ├── social-links.ejs # 社交链接
│       ├── categories.ejs   # 分类列表
│       ├── tags.ejs         # 标签列表
│       ├── pagination.ejs   # 分页
│       ├── comments.ejs     # 评论系统
│       └── music-player.ejs # 音乐播放器
├── source/
│   ├── css/
│   │   └── style.css        # 主样式文件
│   ├── js/
│   │   └── dark-mode.js     # 深色模式切换
│   └── img/                 # 图片资源
│       ├── avatar.jpg       # 头像
│       └── favicon.ico      # 网站图标
└── scripts/                 # 扩展脚本
```

---

## 配置

在 `themes/akari/_config.yml` 中配置主题：

### 站点信息

```yaml
author: John Doe
author_description: 前端开发者 | ACG 爱好者
avatar: /img/avatar.jpg
```

### 社交链接

```yaml
social:
  github: https://github.com/yourname
  email: mailto:your.email@example.com
  twitter: https://twitter.com/yourname
  bilibili: https://space.bilibili.com/yourid
```

### 深色模式

```yaml
dark_mode:
  enable: true
  default: auto # auto, light, dark
```

### 首页设置

```yaml
home:
  featured_count: 3
  daily_image:
    enable: true
    api: https://api.i-meto.com/akari/daily
    alt_text: "每日 ACG 美图"
```

### 音乐播放器

```yaml
music:
  enable: false
  type: netease # netease, spotify, custom
  playlist_id: "" # 你的歌单 ID
  auto: false # 是否自动播放
```

### 评论系统

```yaml
comment:
  enable: false
  type: giscus # giscus, valine, utterances
  giscus:
    repo: "username/repo"
    repo_id: ""
    category: "General"
    category_id: ""
```

---

## 自定义

### 修改配色

编辑 `source/css/style.css` 中的 Tailwind 配置：

```js
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: { /* ... */ },
        secondary: { /* ... */ },
        accent: { /* ... */ }
      }
    }
  }
}
```

### 添加自定义样式

在 `source/css/` 目录下创建新的 CSS 文件，然后在 `layout.ejs` 中引入。

### 扩展组件

在 `layout/partial/` 目录下创建新的组件文件，然后在需要的页面中引用。

---

## 扩展开发指南

### 接入新的 ACG 图片 API

编辑 `layout/partial/daily-image.ejs`，修改 API 地址：

```ejs
<%
const dailyImageApi = 'https://your-api.com/image';
%>
```

### 添加新的社交链接

在 `layout/partial/social-links.ejs` 中添加：

```ejs
<% if (social.your_platform) { %>
  <a href="<%= social.your_platform %>" class="...">
    <!-- SVG Icon -->
  </a>
<% } %>
```

### 集成新的评论系统

在 `layout/partial/comments.ejs` 中添加对应平台的代码。

---

## 浏览器支持

- Chrome (最新)
- Firefox (最新)
- Safari (最新)
- Edge (最新)
- 移动端浏览器

---

## 许可证

MIT License

---

## 致谢

- [Hexo](https://hexo.io/) - 快速、简洁且高效的博客框架
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [kun-touchgal-next](https://github.com/KUN1007/kun-touchgal-next) - 设计灵感来源

---

## 反馈与支持

如有问题或建议，欢迎提 Issue 或加入讨论组。

- Telegram: [链接]
- Discord: [链接]
- Email: your.email@example.com

---

**Made with 💜 for ACG lovers**
