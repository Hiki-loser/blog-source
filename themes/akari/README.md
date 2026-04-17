# Akari - ACG 风格 Hexo 主题

一个简洁、美观、可扩展的 ACG 风格 Hexo 博客主题。

![Akari Theme](https://img.shields.io/badge/version-1.0.0-primary)
![Hexo](https://img.shields.io/badge/Hexo-%3E%3D5.0.0-red)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 特性

- 🎨 ACG 风格设计
- 🌙 深色模式切换
- 📱 响应式布局
- ⚡ 轻量加载
- 🧩 模块化组件
- 🎵 音乐播放器
- 💬 评论系统
- 🖼️ 每日美图

---

## 安装

```bash
cd your-hexo-blog
git clone https://github.com/yourname/hexo-theme-akari.git themes/akari
```

在 Hexo 根目录的 `_config.yml` 中启用主题：

```yaml
theme: akari
```

统一配置请优先编辑 Hexo 根目录 `_config.yml` 中的 `akari` 字段。

---

## 目录结构

```text
themes/akari/
├── _config.yml
├── layout/
│   ├── index.ejs
│   ├── post.ejs
│   ├── page.ejs
│   ├── archive.ejs
│   ├── category.ejs
│   ├── tag.ejs
│   └── partial/
├── source/
│   ├── css/
│   ├── js/
│   └── img/
└── scripts/
```

---

## 配置

推荐在 Hexo 根目录 `_config.yml` 的 `akari` 字段中管理站点信息、导航、社交、功能开关等配置。

```yaml
site:
  title: Hexo
  subtitle: ''
  description: ACG 与技术并行的个人博客
  keywords: [Hexo, ACG, Blog]
  author: John Doe
  author_description: 前端开发者 | ACG 爱好者
  avatar: /img/avatar.svg
  language: zh-CN
  since: 2024

nav:
  - name: 首页
    path: /
  - name: 归档
    path: /archives
  - name: 分类
    path: /categories
  - name: 标签
    path: /tags
  - name: 关于
    path: /about

social:
  github: https://github.com/yourname
  email: mailto:your.email@example.com

akari:
  home:
  featured_count: 3
  daily_image:
    enable: true
    api: https://uapis.cn/api/v1/random/image?category=acg&type=pc
    alt_text: 每日 ACG 美图
    refresh: true
    background_image:
      enable: true
      api: https://uapis.cn/api/v1/random/image?category=landscape
    stats:
      enable: true

dark_mode:
  enable: true
  default: auto

music:
  enable: false
  type: netease
  playlist_id: ''
  auto: false

comment:
  enable: false
  type: giscus
```

---

## 自定义

- 修改配色：编辑 `source/css/style.css`
- 添加自定义样式：在 `source/css/` 下新增文件并引入
- 扩展组件：在 `layout/partial/` 下新增组件并引用

---

## 致谢

- Hexo
- Tailwind CSS
- kun-touchgal-next# Akari - ACG 风格 Hexo 主题

一个简洁、美观、可扩展的 ACG 风格 Hexo 博客主题。

## Akari - ACG 风格 Hexo 主题

一个简洁、美观、可扩展的 ACG 风格 Hexo 博客主题。

![Akari Theme](https://img.shields.io/badge/version-1.0.0-primary)
![Hexo](https://img.shields.io/badge/Hexo-%3E%3D5.0.0-red)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 特性

- 🎨 ACG 风格设计
- 🌙 深色模式切换
- 📱 响应式布局
- ⚡ 轻量加载
- 🧩 模块化组件
- 🎵 音乐播放器
- 💬 评论系统
- 🖼️ 每日美图

---

## 安装

```bash
cd your-hexo-blog
git clone https://github.com/yourname/hexo-theme-akari.git themes/akari
```

在 Hexo 根目录的 `_config.yml` 中启用主题：

```yaml
theme: akari
```

统一配置请优先编辑 Hexo 根目录 `_config.yml` 中的 `akari` 字段。

---

## 目录结构

```
themes/akari/
├── _config.yml
├── layout/
│   ├── index.ejs
│   ├── post.ejs
│   ├── page.ejs
│   ├── archive.ejs
│   ├── category.ejs
│   ├── tag.ejs
│   └── partial/
├── source/
│   ├── css/
│   ├── js/
│   └── img/
└── scripts/
```

---

## 配置

推荐在 Hexo 根目录 `_config.yml` 的 `akari` 字段中管理站点信息、导航、社交、功能开关等配置：

```yaml
site:
  title: Hexo
  subtitle: ''
  description: ACG 与技术并行的个人博客
  keywords: [Hexo, ACG, Blog]
  author: John Doe
  author_description: 前端开发者 | ACG 爱好者
  avatar: /img/avatar.svg

nav:
  - name: 首页
    path: /
  - name: 归档
    path: /archives
  - name: 分类
    path: /categories
  - name: 标签
    path: /tags
  - name: 关于
    path: /about

social:
  github: https://github.com/yourname
  email: mailto:your.email@example.com

akari:
  home:
  featured_count: 3
  daily_image:
    enable: true
    api: https://uapis.cn/api/v1/random/image?category=acg&type=pc
    alt_text: 每日 ACG 美图
    refresh: true
    background_image:
      enable: true
      api: https://uapis.cn/api/v1/random/image?category=landscape
    stats:
      enable: true

dark_mode:
  enable: true
  default: auto

music:
  enable: false
  type: netease
  playlist_id: ''
  auto: false

comment:
  enable: false
  type: giscus
```

---

## 自定义

- 修改配色：编辑 `source/css/style.css`
- 添加自定义样式：在 `source/css/` 下新增文件并引入
- 扩展组件：在 `layout/partial/` 下新增组件并引用

---

## 致谢

- Hexo
- Tailwind CSS
- kun-touchgal-next

### 接入新的 ACG 图片 API

编辑 Hexo 根目录 `_config.yml` 的 `akari.home.daily_image.api`：

```yaml
akari:
  home:
    daily_image:
      api: https://your-api.com/image
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
