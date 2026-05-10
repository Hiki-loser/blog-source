# Hiki的小站

> 记录生活与技术 — 分享后端开发、ACG 文化和生活感悟。

[![Deploy](https://github.com/Hiki-loser/blog-source/actions/workflows/deploy.yml/badge.svg)](https://github.com/Hiki-loser/blog-source/actions)
[![Hexo](https://img.shields.io/badge/Hexo-8.1-blue.svg)](https://hexo.io/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

在线访问：**[hiki-loser.github.io](https://hiki-loser.github.io)**

---

## 技术栈

- **框架**：[Hexo](https://hexo.io/) 8.1
- **主题**：Akari（自托管于 `themes/akari/`）
- **代码高亮**：highlight.js
- **部署**：GitHub Actions 自动构建 → GitHub Pages

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:4000）
npx hexo server

# 生成静态文件
npx hexo generate

# 清理缓存
npx hexo clean
```

## 新建文章

```bash
npx hexo new post "<title>"
```

文章存放在 `source/_posts/` 下，按分类目录组织。Hexo 会根据 frontmatter 中的 `categories` 自动归类。

## 文章分类

| 分类 | 说明 |
|------|------|
| `technology/agent` | AI Agent 相关技术 |
| `technology/java` | Java 技术栈 |
| `technology/database` | 数据库与正则表达式 |
| `technology/back-end` | 后端开发与设计模式 |
| `technology/computer-science` | 计算机科学基础 |
| `technology/python` | Python 技术栈 |
| `technology/documentation` | 技术文档与教程 |
| `projects/autoagent` | AutoAgent — 多模态智能工作流平台 |
| `projects/TavernDroid` | TavernDroid — SillyTavern Android 客户端 |
| `essay/reflections` | 生活随笔与感悟 |

---

## 用本项目搭建你的博客

**核心理念**：只需 Fork + 改配置 + 写文章 + 推送到 GitHub，博客自动上线。推送即部署，全程无需手动操作服务器。

整个过程大约 **10-15 分钟**，你只需要一个 GitHub 账号和一个文本编辑器。

### 第一步：创建你的 GitHub Pages 仓库

1. 在 GitHub 上创建一个名为 `<你的用户名>.github.io` 的公开仓库（例如 `zhangsan.github.io`）
2. 仓库创建后，进入 **Settings → Developer settings → Personal access tokens → Tokens (classic)**
3. 点击 **Generate new token (classic)**，勾选 `repo` 和 `workflow` 权限，生成后将 Token 复制保存（只显示一次）
4. 回到你刚才创建的 `<用户名>.github.io` 仓库，进入 **Settings → Secrets and variables → Actions**
5. 新建一个 Secret，名称设为 `GH_TOKEN`，值粘贴刚才复制的 Token

### 第二步：Fork 本项目并克隆到本地

1. 点击本仓库右上角 **Fork** 按钮，Fork 到你的账号下
2. 将 Fork 后的仓库克隆到本地：

```bash
git clone git@github.com:<你的用户名>/blog-source.git
cd blog-source
npm install
```

### 第三步：修改配置，变成你的博客

#### 1. 修改 `_config.yml`

以下字段需要改成你自己的信息：

```yaml
# 站点信息
title: 你的博客名称
subtitle: 你的副标题
description: 你的博客描述
keywords:
  - 你的
  - 关键词
author: 你的名字
author_description: 你的简介

# 你的 GitHub Pages 地址
url: https://<你的用户名>.github.io

# 主题配置中的站点信息（文件底部 akari 段）
akari:
  site:
    title: 你的博客名称
    subtitle: 你的副标题
    author: 你的名字
    author_description: 你的简介
  social:
    github: https://github.com/<你的用户名>
    email: <你的邮箱>
    bilibili: <你的B站链接>  # 不需要可删除这行
```

#### 2. 修改 `source/_data/categories.yml`

这个文件定义了博客的分类结构。按照你的博客主题重新组织分类，例如：

```yaml
technology:
  name: 技术
  icon: code
  description: 技术文章
  subcategories:
    frontend:
      name: 前端
      description: 前端开发相关
    backend:
      name: 后端
      description: 后端开发相关

life:
  name: 生活
  icon: heart
  description: 生活记录
  subcategories:
    diary:
      name: 日记
      description: 日常记录
```

#### 3. 修改 `.github/workflows/deploy.yml`

找到 `external_repository` 字段，改成你的 GitHub Pages 仓库：

```yaml
external_repository: <你的用户名>/<你的用户名>.github.io
```

#### 4. 删除我的文章，写你自己的

```bash
# 删除我的所有文章
rm -rf source/_posts/*

# 创建你的第一篇文章
npx hexo new post "我的第一篇博客"
```

编辑生成的 Markdown 文件，修改 frontmatter 中的 `categories` 为你自己定义的分类即可。

### 第四步：推送 → 自动上线

```bash
git add .
git commit -m "初始化我的博客"
git push origin main
```

推送后，GitHub Actions 会自动执行：安装依赖 → `hexo generate` 生成静态文件 → 部署到 `<用户名>.github.io` 仓库。几分钟后，打开 `https://<你的用户名>.github.io` 即可看到你的博客。

**之后每次你写完文章，只需要 `git push`，博客就会自动更新。什么都不用管。**

### 常见问题

- **部署失败？** 检查 GitHub Actions 日志，通常是 `GH_TOKEN` 权限不足或 `external_repository` 写错
- **本地预览正常但线上样式错乱？** 检查 `_config.yml` 中的 `url` 是否配置正确
- **想用自己的域名？** 在你的 GitHub Pages 仓库 Settings 中配置自定义域名，然后将 `_config.yml` 中的 `url` 改为你的域名
- **Akari 主题更多配置？** 参考 `_config.yml` 中 `akari` 段的注释，支持评论、音乐播放器、暗色模式等功能

---

## 目录结构

```
blog-source/
├── scaffolds/              # 文章模板
├── source/
│   ├── _data/              # 分类等数据文件
│   └── _posts/             # Markdown 文章
├── themes/akari/           # 博客主题
├── _config.yml             # Hexo + 主题配置
├── .github/workflows/      # GitHub Actions 自动部署
└── package.json
```

## License

MIT — 随意使用，Fork 后删除我的文章、修改配置即可变成你自己的博客。
