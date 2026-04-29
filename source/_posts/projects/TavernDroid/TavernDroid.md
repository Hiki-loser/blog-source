---
title: "TavernDroid 技术设计文档 v1.0"
date: 2026-4-29 23:49:00
categories: projects/TavernDroid
tags:
- sillytavern
- character-ai
- agent
- intro
---
# TavernDroid — SillyTavern Android 客户端
## v1.0 技术设计文档

> **文档版本**：1.0.0  
> **目标读者**：具备 Java/Kotlin 基础、熟悉 SpringBoot 分层架构、有 LLM API 使用经验的开发者  
> **v1.0 目标**：可发布到 GitHub 获得初始 Star，核心功能闭环可用，架构具备良好扩展性

---

## 目录

1. [项目定位与 v1.0 范围](#1-项目定位与-v10-范围)
2. [整体架构设计](#2-整体架构设计)
3. [模块详细设计](#3-模块详细设计)
4. [数据库设计](#4-数据库设计)
5. [格式兼容层设计](#5-格式兼容层设计)
6. [LLM Provider 抽象层](#6-llm-provider-抽象层)
7. [分步实现计划](#7-分步实现计划)
8. [工程配置与环境搭建](#8-工程配置与环境搭建)
9. [测试策略](#9-测试策略)
10. [发布与运营](#10-发布与运营)
11. [v1.0 之后的扩展路线](#11-v10-之后的扩展路线)

---

## 1. 项目定位与 v1.0 范围

### 1.1 核心价值主张

TavernDroid 是 SillyTavern 的 Android 原生客户端，**不依赖任何本地服务器**，除调用远程 LLM API 外，所有逻辑均在设备本地运行。

**与现有方案的差异化**：

| 方案 | 门槛 | ST格式兼容 | 原生体验 |
|------|------|-----------|---------|
| Termux + SillyTavern | 极高，需手动配置 | 完整 | 差（浏览器访问） |
| ChatterUI | 低 | 无 | 好 |
| Maid | 低 | 无 | 好 |
| **TavernDroid** | **极低** | **完整** | **好** |

格式兼容是核心护城河，也是获得 Star 的最主要理由。

### 1.2 v1.0 功能范围

**纳入 v1.0（必须实现）**：

- 角色卡导入与管理（PNG/CHARX 两种格式）
- 基于角色卡的对话（含角色人设注入）
- OpenAI 兼容格式 API 接入（SSE 流式输出）
- Claude API 接入（与 OpenAI 格式有差异）
- 聊天记录本地持久化与管理
- 基础 World Info / 世界书注入（关键词触发）
- Markdown 渲染（对话气泡内）
- 多 API 配置管理（可配置多个端点并切换）

**推迟到 v1.x（架构预留但不实现）**：

- 表情/立绘显示系统
- TTS 语音
- Prompt 预设管理（高级）
- World Info 高级逻辑（深度注入、权重排序）
- 导入/导出聊天记录到 ST 格式 JSON

**明确不做（超出定位）**：

- 本地模型运行（llama.cpp 等）
- 图像生成
- 扩展插件系统

### 1.3 项目命名与仓库建议

推荐仓库名：`TavernDroid` 或 `SillyTavernAndroid`  
推荐 Topic 标签：`sillytavern`, `character-ai`, `llm`, `android`, `roleplay`, `character-card`

---

## 2. 整体架构设计

### 2.1 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        UI 层 (Compose)                       │
│  CharacterListScreen  │  ChatScreen  │  SettingsScreen       │
└───────────────────────┬─────────────────────────────────────┘
                        │ 观察 StateFlow / 触发 Intent
┌───────────────────────▼─────────────────────────────────────┐
│                     ViewModel 层                             │
│  CharacterViewModel   │  ChatViewModel  │  SettingsViewModel │
└───────────┬───────────┴────────┬────────────────────────────┘
            │                    │
┌───────────▼──────┐   ┌─────────▼──────────────────────────┐
│  Repository 层   │   │         Repository 层               │
│  CharacterRepo   │   │  ChatRepo  │  WorldInfoRepo          │
└───────┬──────────┘   └─────────┬──────────────────────────┘
        │                        │
┌───────▼──────────┐   ┌─────────▼──────────┐   ┌──────────────────┐
│   Room Database  │   │   LLM Provider层    │   │  格式兼容层       │
│  (本地持久化)    │   │  (网络请求/流式)    │   │  (解析角色卡等)  │
└──────────────────┘   └────────────────────┘   └──────────────────┘
```

**与 SpringBoot 的类比**：

| SpringBoot 概念 | Android 对应 | 说明 |
|---|---|---|
| `@Controller` + 路由 | `Screen` + `NavController` | 处理"进入某个页面" |
| `@Service` | `ViewModel` | 业务逻辑，持有状态 |
| `@Repository` | `Repository` + `Room DAO` | 数据访问 |
| `application.yml` | `DataStore` | 配置持久化 |
| Bean 单例容器 | Hilt 依赖注入 | 对象生命周期管理 |
| HTTP Filter | Coroutines Flow 操作符 | 数据流处理 |

### 2.2 技术栈总览

```
语言与运行时：
  Kotlin 1.9+
  Kotlin Coroutines + Flow（异步，类比 CompletableFuture + Stream）
  
UI 框架：
  Jetpack Compose（声明式 UI）
  Material3 设计系统
  Compose Navigation（页面路由）

本地存储：
  Room 2.6+（SQLite ORM，类比 MyBatis）
  DataStore Preferences（KV 配置存储，类比 Redis/Properties 文件）
  
网络：
  OkHttp 4.x（底层 HTTP 客户端，SSE 流式处理）
  Retrofit 2.x（REST API 声明式封装，类比 Feign）
  kotlinx.serialization（JSON 序列化）

依赖注入：
  Hilt（基于 Dagger，类比 Spring IoC 容器）

图片加载：
  Coil 2.x（角色头像加载，异步图片库）

Markdown 渲染：
  compose-markdown 或 Markwon（聊天气泡内渲染）

构建工具：
  Gradle 8.x（Kotlin DSL）
  
最低支持：Android 8.0（API 26）
目标版本：Android 14（API 34）
```

### 2.3 包结构设计

```
com.yourname.taverndroid/
├── di/                          # 依赖注入模块（Hilt）
│   ├── DatabaseModule.kt        # Room 数据库提供
│   ├── NetworkModule.kt         # OkHttp/Retrofit 提供
│   └── RepositoryModule.kt      # Repository 绑定
│
├── data/
│   ├── local/
│   │   ├── db/
│   │   │   ├── AppDatabase.kt   # Room 数据库入口
│   │   │   ├── dao/             # DAO 接口
│   │   │   └── entity/          # 数据库实体
│   │   └── datastore/
│   │       └── AppPreferences.kt # 应用配置
│   ├── remote/
│   │   ├── api/                 # Retrofit 接口定义
│   │   └── model/               # 网络请求/响应模型
│   └── repository/              # Repository 实现类
│
├── domain/
│   ├── model/                   # 领域模型（纯 Kotlin data class）
│   │   ├── Character.kt
│   │   ├── ChatMessage.kt
│   │   ├── WorldInfoEntry.kt
│   │   └── ProviderConfig.kt
│   ├── repository/              # Repository 接口定义（抽象）
│   └── usecase/                 # 业务用例（可选，复杂逻辑抽离）
│
├── format/                      # 格式兼容层（核心差异化）
│   ├── CharacterCardParser.kt   # PNG/CHARX 解析入口
│   ├── PngChunkReader.kt        # PNG tEXt chunk 读取
│   ├── CharxParser.kt           # CHARX ZIP 格式解析
│   └── model/                   # 格式相关数据类
│       ├── CharacterCardV2.kt   # V2 规范 JSON 映射
│       └── WorldInfoBook.kt     # 世界书格式映射
│
├── llm/                         # LLM Provider 抽象层
│   ├── LLMProvider.kt           # Provider 接口
│   ├── ContextBuilder.kt        # 上下文构建（关键逻辑）
│   ├── provider/
│   │   ├── OpenAIProvider.kt
│   │   └── ClaudeProvider.kt
│   └── model/                   # LLM 请求/响应模型
│
├── ui/
│   ├── navigation/
│   │   └── AppNavGraph.kt       # 路由定义
│   ├── screen/
│   │   ├── characterlist/       # 角色卡列表页
│   │   ├── chat/                # 聊天页
│   │   ├── settings/            # 设置页
│   │   └── worldinfo/           # 世界书管理页
│   ├── component/               # 可复用 Compose 组件
│   └── theme/                   # Material3 主题
│
└── MainActivity.kt
```

> **设计原则**：`format/` 和 `llm/` 两个包对 Android 框架无依赖，可以单独编写单元测试，也可在未来迁移到其他平台。

---

## 3. 模块详细设计

### 3.1 格式兼容层（format/）

这是整个项目最核心的模块，也是与竞品最大的差异化来源。

#### 3.1.1 角色卡格式概述

SillyTavern 支持两种角色卡文件格式：

**PNG 格式（Character Card V2）**：
- 外观是普通 PNG 图片（角色头像）
- 角色数据以 JSON 形式编码为 Base64，嵌入 PNG 文件的 `tEXt` chunk 中
- chunk 的 keyword 为 `chara`
- JSON 遵循 [Character Card V2 规范](https://github.com/malfoyslastname/character-card-spec-v2)

**CHARX 格式（Backyard AI）**：
- 本质是 ZIP 压缩包，扩展名为 `.charx`
- ZIP 内包含 `card.json`（角色数据）和可选的 `sprites/` 目录（立绘图片）
- `card.json` 结构与 V2 规范基本兼容

#### 3.1.2 解析流程设计

```
用户选择文件（文件选择器 URI）
        │
        ▼
CharacterCardParser.parse(uri)   ← 入口，根据扩展名路由
        │
  ┌─────┴─────┐
  │           │
  ▼           ▼
PNG 流程   CHARX 流程
  │           │
  ▼           ▼
PngChunk  ZipInputStream
Reader        │
  │       card.json
  │           │
  └─────┬─────┘
        │
        ▼
   JSON 字符串
        │
        ▼
  CharacterCardV2      ← kotlinx.serialization 反序列化
  （规范数据模型）
        │
        ▼
    Character          ← 领域模型（应用内使用）
  （数据库存储）
```

#### 3.1.3 CharacterCardV2 数据模型

遵循 [官方规范](https://github.com/malfoyslastname/character-card-spec-v2/blob/main/spec_v2.md)，字段与规范严格对应：

```
CharacterCardV2:
  spec: String                    // "chara_card_v2"
  spec_version: String            // "2.0"
  data:
    name: String                  // 角色名称
    description: String           // 角色描述/人设
    personality: String           // 性格描述
    scenario: String              // 场景背景
    first_mes: String             // 开场白（第一条消息）
    mes_example: String           // 示例对话（<START>分隔块）
    system_prompt: String         // 自定义系统提示（覆盖默认）
    post_history_instructions: String  // 历史消息后追加的指令
    creator_notes: String         // 创作者备注（不注入上下文）
    tags: List<String>            // 标签
    creator: String               // 创作者
    character_version: String     // 角色版本
    extensions: Map<String, Any>  // 扩展字段（V2 预留，解析时忽略）
    // V2 核心功能：内嵌世界书
    character_book: CharacterBook? // 内嵌世界书（可选）
```

> **注意**：`extensions` 字段可能包含第三方扩展数据（如 Risu 的字段），解析时应容忍未知字段，不能报错。使用 `kotlinx.serialization` 时配置 `ignoreUnknownKeys = true`。

#### 3.1.4 PNG chunk 解析原理

PNG 文件由若干 chunk（数据块）组成，每个 chunk 结构为：

```
[4字节 数据长度] [4字节 类型] [N字节 数据] [4字节 CRC校验]
```

角色卡数据藏在类型为 `tEXt` 的 chunk 中，格式为：

```
keyword (ASCII字符串) + 0x00 (分隔符) + text (Latin-1编码文本)
```

当 keyword 为 `chara` 时，text 即为 Base64 编码的角色 JSON。

解析步骤：
1. 跳过 8 字节 PNG 签名
2. 循环读取每个 chunk
3. 遇到类型 `tEXt` 时，读取 keyword
4. 如果 keyword 是 `chara`，读取剩余文本并 Base64 解码
5. 将 UTF-8 字符串反序列化为 `CharacterCardV2`

> 📖 **参考资料**：PNG 规范文档 [http://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html](http://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html)

### 3.2 上下文构建模块（llm/ContextBuilder）

这是 SillyTavern 兼容性的另一个核心——上下文是如何组装的，直接影响对话质量。

#### 3.2.1 ST 的上下文结构

SillyTavern 发送给 LLM 的消息列表，大致结构如下（从上到下）：

```
[system] 主系统提示（可自定义或使用角色的 system_prompt）
[system] World Info 条目（position=0，在角色描述之前）
[system] 角色描述块：
         [描述] {{char}}: {{description}}
         [性格] {{char}}'s personality: {{personality}}
         [场景] Scenario: {{scenario}}
[system] World Info 条目（position=1，在角色描述之后）
[user]   示例对话（mes_example）转换的消息对
[assistant] ...
...（历史对话，按 token 限制从最近往前截取）
[system] post_history_instructions（最后追加）
[user]   当前用户消息
```

#### 3.2.2 宏替换

ST 使用 `{{char}}`、`{{user}}` 等宏变量，在注入前需替换：

```
{{char}}  → 角色名称
{{user}}  → 用户人设名称（默认 "User"）
{{original}} → 仅在 post_history_instructions 中使用
```

宏替换应在所有文本注入前统一处理，设计一个 `MacroProcessor` 工具类。

#### 3.2.3 World Info 触发逻辑

```
输入：
  - messages: 最近 N 条对话（扫描范围）
  - worldInfoEntries: 当前角色的世界书条目列表
  - scanDepth: 扫描最近多少条消息（默认5，可配置）

处理：
  1. 拼接最近 scanDepth 条消息文本为扫描字符串
  2. 对每个 enabled=true 的条目：
     - selectiveLogic=0 (AND ANY): keys 中任意一个出现在扫描字符串中 → 触发
     - selectiveLogic=1 (NOT ALL): keys 不全部出现 → 触发
     - selectiveLogic=2 (NOT ANY): keys 没有任何一个出现 → 触发（常用于"默认注入"）
  3. 触发的条目按 order 字段排序
  4. 按 position 字段分组，插入到上下文的对应位置

输出：
  - 触发的 WorldInfoEntry 列表，分组后可供 ContextBuilder 使用
```

#### 3.2.4 Token 预算管理（简化版）

v1.0 采用简化策略，不做精确 Token 计数：

- 允许用户在设置中配置"最大上下文消息数"（默认 20 条）
- 历史消息从最新往前取，超出数量截断
- v1.x 版本再引入精确 Token 计数库

### 3.3 LLM Provider 抽象层（llm/provider/）

#### 3.3.1 Provider 接口设计

接口只有一个核心方法，返回 `Flow<String>` 实现流式输出：

```
interface LLMProvider {
  val id: String                     // 唯一标识，如 "openai", "claude"
  val displayName: String            // 显示名称
  
  // 流式对话，每次 emit 一个 token 片段
  fun streamChat(
    messages: List<ChatMessage>,
    config: ProviderConfig           // 包含 apiKey, endpoint, model 等
  ): Flow<String>
  
  // 验证配置是否有效（发送一个测试请求）
  suspend fun validateConfig(config: ProviderConfig): Result<Unit>
}
```

#### 3.3.2 ProviderConfig 数据模型

```
data class ProviderConfig(
  id: String,                // UUID，本地生成
  name: String,              // 用户自定义显示名，如"我的GPT-4配置"
  providerId: String,        // 对应哪个 Provider，如 "openai"
  apiKey: String,            // API 密钥（加密存储）
  endpoint: String,          // 自定义端点，如 "https://api.openai.com/v1"
  model: String,             // 模型名，如 "gpt-4o"
  maxTokens: Int,            // 最大生成 token 数
  temperature: Float,        // 温度参数
  // 可扩展字段：
  extraHeaders: Map<String, String>,  // 自定义请求头（部分中转站需要）
  extraParams: Map<String, String>    // 自定义参数
)
```

#### 3.3.3 OpenAI Provider 实现要点

OpenAI 接口采用 SSE（Server-Sent Events）流式协议：

```
请求格式（POST /v1/chat/completions）：
{
  "model": "gpt-4o",
  "stream": true,
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "..."}
  ]
}

SSE 响应格式（每行）：
data: {"choices":[{"delta":{"content":"token片段"}}]}
data: [DONE]
```

实现要点：
- 使用 OkHttp 发送请求，**不用** Retrofit（Retrofit 不支持 SSE 流式读取）
- 读取响应 body 的 `Source`，逐行解析
- 每解析出一个 token，向 Flow 中 emit
- 需处理错误状态码（401 未授权、429 限流等），转换为自定义异常

> 📖 **参考资料**：OkHttp 官方文档 [https://square.github.io/okhttp/](https://square.github.io/okhttp/)，重点阅读"Calls"和"Events"章节

#### 3.3.4 Claude Provider 实现要点

Claude API 格式与 OpenAI **有以下关键差异**：

```
1. 端点不同：POST /v1/messages
2. 认证头不同：x-api-key 而非 Authorization: Bearer
3. system 消息单独字段，不在 messages 数组中：
   {
     "model": "claude-3-5-sonnet-20241022",
     "max_tokens": 1024,
     "system": "系统提示文本",     ← 单独字段
     "messages": [               ← 只包含 user/assistant 消息
       {"role": "user", "content": "..."}
     ],
     "stream": true
   }
4. 需要额外头：anthropic-version: 2023-06-01
5. SSE 事件类型不同：content_block_delta 事件包含实际文本
```

设计建议：在 `ContextBuilder` 输出后，Provider 负责将统一的 `List<ChatMessage>` 转换为自己格式，这样上层无需关心差异。

---

## 4. 数据库设计

### 4.1 Room 数据库概述

Room 是 Android 官方的 SQLite ORM，与 MyBatis 类比：

| MyBatis 概念 | Room 概念 |
|---|---|
| Entity/POJO | `@Entity` 数据类 |
| Mapper 接口 | `@Dao` 接口 |
| SQL XML | `@Query` 注解 |
| SqlSession | `RoomDatabase` |

> 📖 **学习资料**：[Room 官方文档](https://developer.android.com/training/data-storage/room)，建议先看完"Define data using Room entities"和"Access data using Room DAOs"两节。

### 4.2 Entity 设计

#### 4.2.1 CharacterEntity（角色表）

```
表名：characters

字段：
  id            TEXT PRIMARY KEY    -- UUID，本地生成
  name          TEXT NOT NULL       -- 角色名称
  description   TEXT NOT NULL       -- 角色描述（原始文本）
  personality   TEXT                -- 性格
  scenario      TEXT                -- 场景
  firstMessage  TEXT                -- 开场白
  mesExample    TEXT                -- 示例对话
  systemPrompt  TEXT                -- 自定义系统提示
  postHistoryInstructions TEXT      -- 历史后指令
  tags          TEXT                -- JSON 数组序列化存储
  creator       TEXT
  creatorNotes  TEXT
  avatarPath    TEXT                -- 本地头像文件路径
  charxPath     TEXT                -- 如果是 CHARX，原文件路径（用于提取立绘）
  createdAt     INTEGER NOT NULL    -- 时间戳（毫秒）
  updatedAt     INTEGER NOT NULL
```

#### 4.2.2 ConversationEntity（会话表）

```
表名：conversations

字段：
  id              TEXT PRIMARY KEY
  characterId     TEXT NOT NULL      -- 外键，关联 characters.id
  title           TEXT               -- 会话标题（可由用户修改）
  lastMessageAt   INTEGER            -- 最后消息时间（用于排序）
  messageCount    INTEGER DEFAULT 0  -- 缓存消息数量（避免 COUNT 查询）
  createdAt       INTEGER NOT NULL
  
外键约束：
  FOREIGN KEY (characterId) REFERENCES characters(id) ON DELETE CASCADE
```

#### 4.2.3 MessageEntity（消息表）

```
表名：messages

字段：
  id              TEXT PRIMARY KEY
  conversationId  TEXT NOT NULL      -- 外键，关联 conversations.id
  role            TEXT NOT NULL      -- "user" | "assistant" | "system"
  content         TEXT NOT NULL      -- 消息内容
  isStreaming     INTEGER DEFAULT 0  -- 是否正在流式输出（0/1）
  tokenCount      INTEGER            -- token 数（暂时不填，预留）
  createdAt       INTEGER NOT NULL

外键约束：
  FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE
  
索引：
  INDEX idx_messages_conversation ON messages(conversationId, createdAt)
```

#### 4.2.4 WorldInfoEntryEntity（世界书条目表）

```
表名：world_info_entries

字段：
  id              TEXT PRIMARY KEY
  characterId     TEXT               -- 关联角色（NULL 表示全局世界书）
  bookName        TEXT               -- 世界书名称（同一角色可有多本）
  uid             INTEGER            -- 条目在书中的顺序 ID
  keys            TEXT NOT NULL      -- JSON 数组，触发关键词
  content         TEXT NOT NULL      -- 注入内容
  enabled         INTEGER DEFAULT 1  -- 是否启用
  position        INTEGER DEFAULT 1  -- 注入位置（0=角色描述前, 1=角色描述后）
  selectiveLogic  INTEGER DEFAULT 0  -- 0=AND_ANY, 1=NOT_ALL, 2=NOT_ANY
  priority        INTEGER DEFAULT 0  -- 优先级/排序
  comment         TEXT               -- 备注（不注入，仅显示用）
  
外键约束：
  FOREIGN KEY (characterId) REFERENCES characters(id) ON DELETE CASCADE
```

#### 4.2.5 ProviderConfigEntity（Provider 配置表）

```
表名：provider_configs

字段：
  id            TEXT PRIMARY KEY
  name          TEXT NOT NULL        -- 用户自定义名称
  providerId    TEXT NOT NULL        -- "openai" | "claude" | ...
  apiKey        TEXT                 -- 加密存储（见安全设计节）
  endpoint      TEXT NOT NULL
  model         TEXT NOT NULL
  maxTokens     INTEGER DEFAULT 2048
  temperature   REAL DEFAULT 0.7
  isDefault     INTEGER DEFAULT 0    -- 是否为默认配置（同时只有一个）
  extraJson     TEXT                 -- 其余扩展参数，JSON 序列化
  createdAt     INTEGER NOT NULL
```

### 4.3 数据库版本管理

Room 支持 Migration，从一开始就要建立版本管理意识：

- v1.0 数据库版本号：`1`
- 每次 schema 变更必须写 `Migration` 而非直接 `fallbackToDestructiveMigration`
- 将 `schema` 文件导出到 `assets/databases/` 目录并纳入版本控制

---

## 5. 格式兼容层设计

### 5.1 导入流程完整设计

```
用户操作：点击"导入角色卡"按钮
    │
    ▼
Android FileProvider 打开文件选择器
（支持 MIME: image/png, application/zip, application/octet-stream）
    │
    ▼
获取文件 URI
    │
    ▼
CharacterCardParser.parse(context, uri)
    │
    ├─ 判断扩展名或 MIME type
    │
    ├─ .png → PngChunkReader.extractCharaChunk(stream)
    │          → Base64 解码 → JSON 字符串
    │
    └─ .charx → CharxParser.parse(stream)
               → 解压 ZIP → 读取 card.json
    │
    ▼
JSON 字符串
    │
    ▼
kotlinx.serialization 反序列化为 CharacterCardV2
（配置 ignoreUnknownKeys = true，兼容扩展字段）
    │
    ▼
CharacterMapper.toCharacterEntity(card, avatarUri)
（领域模型 → 数据库实体的转换）
    │
    ▼
提取头像图片：
  - PNG 格式：文件本身就是头像
  - CHARX 格式：ZIP 中的 avatar.png 或 card.png
    │
    ▼
复制头像到 app 内部存储：
  getFilesDir()/avatars/{characterId}.png
    │
    ▼
CharacterRepository.insertCharacter(entity)
    │
    ▼
如果角色有内嵌世界书（character_book 字段）：
  → WorldInfoRepository.insertEntries(entries, characterId)
    │
    ▼
导入完成，刷新角色列表
```

### 5.2 文件存储策略

```
内部存储布局（getFilesDir()）：
  /avatars/           → 角色头像 PNG 文件
  /charx/             → 原始 CHARX 文件（用于后续提取立绘）
  /exports/           → 导出的聊天记录（v1.x 实现）
```

不要使用外部存储（SD卡），避免 Android 11+ 的 Scoped Storage 权限问题。内部存储不需要运行时权限申请。

---

## 6. LLM Provider 抽象层

### 6.1 SSE 流式输出实现原理

SSE 是一种服务器向客户端推送事件的协议，格式为：

```
data: {"choices":[{"delta":{"content":"Hello"}}]}

data: {"choices":[{"delta":{"content":" World"}}]}

data: [DONE]
```

在 Android 中，使用 OkHttp 实现 SSE 读取的思路：

1. 构造普通 HTTP POST 请求，添加 `Accept: text/event-stream` 请求头
2. 用 `call.execute()` 获取响应（同步，在 Coroutine 中调用）
3. 用 `response.body.source()` 获取 Okio `Source` 对象
4. 循环调用 `source.readUtf8Line()` 逐行读取
5. 解析每行，提取 `data:` 后的 JSON
6. 从 JSON 中提取 `choices[0].delta.content`
7. 向外部 `Flow` 的 `ProducerScope` 发送（`send(token)`）

> 📖 **关键技术**：需要掌握 Kotlin `callbackFlow` 或 `flow {}` 构建器。推荐阅读 [Kotlin Flow 官方文档](https://kotlinlang.org/docs/flow.html) 中的"Flow builders"一节。

### 6.2 错误处理设计

定义统一的异常体系，Provider 层将网络错误转换为这些异常：

```
sealed class LLMException(message: String) : Exception(message) {
  class AuthenticationError(message: String) : LLMException(message)  // 401
  class RateLimitError(message: String) : LLMException(message)       // 429
  class ContextLengthError(message: String) : LLMException(message)   // 超出上下文长度
  class NetworkError(cause: Throwable) : LLMException(cause.message ?: "")
  class ApiError(val code: Int, message: String) : LLMException(message)
  class StreamInterrupted(message: String) : LLMException(message)    // 流中断
}
```

在 ViewModel 中，通过 `catch` 操作符捕获并转换为 UI 状态：

```
provider.streamChat(...)
  .catch { e ->
    when (e) {
      is LLMException.AuthenticationError → _uiState.update { it.copy(error = "API Key 错误") }
      is LLMException.RateLimitError → _uiState.update { it.copy(error = "请求频率超限，请稍后再试") }
      ...
    }
  }
  .collect { token → appendToCurrentMessage(token) }
```

### 6.3 API Key 安全存储

API Key 属于敏感数据，不能明文存储在数据库或 SharedPreferences 中：

- Android 提供 `EncryptedSharedPreferences`（基于 Keystore 系统），透明加密
- 使用 `androidx.security:security-crypto` 库
- 存储方案：ProviderConfig 存数据库，API Key 单独存入 `EncryptedSharedPreferences`，以 `config.id` 为 key

---

## 7. 分步实现计划

### 7.1 总体时间预估

假设每天可投入 2-3 小时，全部完成约需 10-14 周。

```
阶段1：Android 基础学习（Week 1-2）
阶段2：工程搭建（Week 3）
阶段3：格式兼容层（Week 4-5）  ← 最核心
阶段4：数据库与本地功能（Week 6-7）
阶段5：LLM 接入（Week 8-9）
阶段6：UI 完善与集成（Week 10-11）
阶段7：测试与 v1.0 发布（Week 12-14）
```

---

### 阶段一：Android 基础学习（Week 1-2）

**目标**：建立 Android 开发心智模型，避免后续踩坑。

**必学内容清单**（按顺序）：

1. **Kotlin 基础语法补强**（1-2天）
   - 如果你已有 Java 基础，重点看：data class、object、sealed class、扩展函数、lambda、`?.` 和 `?:` 操作符
   - 推荐：[Kotlin 官方 Koans 练习](https://play.kotlinlang.org/koans/overview)，在线交互，1天内可过完

2. **Kotlin Coroutines**（2-3天）—— **最重要**
   - 理解 `suspend` 函数、`CoroutineScope`、`viewModelScope`
   - 理解 `Flow`：类比 Java Stream，但是异步的
   - 推荐：[官方 Coroutines 文档](https://kotlinlang.org/docs/coroutines-overview.html)，重点看前4节
   - **重点理解**：`StateFlow` = 当前状态的"只读发布者"，类比 Spring 事件总线中的状态发布

3. **Jetpack Compose 基础**（3-4天）
   - 理解声明式 UI：状态变了 → UI 自动重组（类比 React/Vue，不是命令式操作 View）
   - 必学：`@Composable`、`remember`、`mutableStateOf`、`LazyColumn`、`Column/Row`
   - 推荐：[Compose 官方 Codelab - Basics](https://developer.android.com/codelabs/jetpack-compose-basics)，约3小时

4. **ViewModel + StateFlow 模式**（1-2天）
   - 这是 Android 的 Service 层 + 状态管理
   - 推荐：[官方 ViewModel 文档](https://developer.android.com/topic/libraries/architecture/viewmodel)
   - **关键理解**：Activity 会在转屏时销毁重建，ViewModel 不会；所有状态放 ViewModel，不放 Activity

5. **Android 文件操作与 FileProvider**（1天）
   - 理解 URI 与文件路径的区别（Android 不暴露真实路径）
   - 理解 `Intent.ACTION_OPEN_DOCUMENT` 打开文件选择器

**验证目标**：能够独立写出一个"点击按钮，显示计数"的 Compose App，并在 ViewModel 里维护状态。

---

### 阶段二：工程搭建（Week 3）

**目标**：搭建可运行的空项目，配置好所有依赖，验证架构可行。

**Step 1：创建 Android 项目**

打开 Android Studio，选择 "Empty Activity"（Compose 模板）：
- Language: Kotlin
- Minimum SDK: API 26 (Android 8.0)
- Build configuration language: Kotlin DSL

**Step 2：配置 build.gradle.kts 依赖**

在 `app/build.gradle.kts` 的 `dependencies` 块添加以下依赖（版本号以实际最新稳定版为准）：

```
// Compose
implementation("androidx.compose.ui:ui")
implementation("androidx.compose.material3:material3")
implementation("androidx.compose.ui:ui-tooling-preview")
implementation("androidx.activity:activity-compose:1.8.x")

// Navigation
implementation("androidx.navigation:navigation-compose:2.7.x")

// ViewModel
implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.x")

// Room
implementation("androidx.room:room-runtime:2.6.x")
implementation("androidx.room:room-ktx:2.6.x")
ksp("androidx.room:room-compiler:2.6.x")  // 需要 KSP 插件

// DataStore
implementation("androidx.datastore:datastore-preferences:1.0.x")

// Hilt
implementation("com.google.dagger:hilt-android:2.x")
ksp("com.google.dagger:hilt-compiler:2.x")
implementation("androidx.hilt:hilt-navigation-compose:1.1.x")

// Network
implementation("com.squareup.okhttp3:okhttp:4.x")
implementation("com.squareup.retrofit2:retrofit:2.x")

// Serialization
implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.x")

// Coil
implementation("io.coil-kt:coil-compose:2.x")

// Security
implementation("androidx.security:security-crypto:1.1.x")

// Markdown（选择一个）
implementation("com.github.jeziellago:compose-markdown:0.x")
```

**Step 3：配置 Hilt**

1. 在根 `build.gradle.kts` 添加 Hilt Gradle 插件
2. 在 `app/build.gradle.kts` 应用 `com.google.dagger.hilt.android` 和 `com.google.devtools.ksp` 插件
3. 创建继承 `@HiltAndroidApp` 的 `Application` 类

**Step 4：验证**

运行空项目，确认编译通过、模拟器能显示默认 UI。

---

### 阶段三：格式兼容层（Week 4-5）

**这是整个项目最重要的阶段，完成后即可作为技术亮点。**

**Step 1：定义 CharacterCardV2 数据模型**

在 `format/model/` 下创建 `CharacterCardV2.kt`，使用 `@Serializable` 注解，字段与规范严格对应。注意：
- 所有字段设为可空（`?`），规范字段不总是存在
- 配置 `@SerialName("mes_example")` 处理 JSON 字段名与 Kotlin 命名规范的差异

**Step 2：实现 PngChunkReader**

纯 Kotlin 实现，无需任何第三方库：
1. 读取 `InputStream` 为 `ByteArray`
2. 验证前8字节是否为 PNG 签名（`89 50 4E 47 0D 0A 1A 0A`）
3. 循环解析 chunk：读取4字节长度（大端序）→ 读取4字节类型 → 读取 N 字节数据 → 跳过4字节 CRC
4. 匹配 `tEXt` 类型，分割 keyword 和 text
5. keyword 为 `chara` 时，Base64 解码并返回

**测试方法**：从 SillyTavern 下载任意角色卡 PNG，用 JUnit 测试解析结果。

**Step 3：实现 CharxParser**

使用标准库 `java.util.zip.ZipInputStream`：
1. 打开 ZIP 流
2. 遍历 `ZipEntry`，找到 `card.json`
3. 读取字节，转 UTF-8 字符串
4. 同时收集 `avatar.png` 或 `card.png`（头像）

**Step 4：实现 CharacterCardParser（入口类）**

根据 URI 的文件扩展名（或 MIME type）路由到对应解析器，统一返回 `Result<CharacterCardV2>` 处理错误。

**Step 5：实现 CharacterMapper**

将 `CharacterCardV2`（格式层模型）转换为 `Character`（领域模型），同时处理空字段的默认值。

**验证目标**：写 JUnit 测试，导入真实角色卡文件，验证 name、description 等字段解析正确。

---

### 阶段四：数据库与本地功能（Week 6-7）

**Step 1：定义 Room Entity**

按第4章的设计创建所有 Entity 类，注意：
- 使用 `@TypeConverter` 处理 `List<String>` 字段（序列化为 JSON 字符串存储）
- 定义 `@ForeignKey` 和 `@Index`

**Step 2：定义 DAO 接口**

每个 Entity 对应一个 DAO，常用方法：
- `@Insert(onConflict = OnConflictStrategy.REPLACE)`
- `@Delete`
- `@Update`
- `@Query("SELECT * FROM characters ORDER BY updatedAt DESC")`
- 返回类型用 `Flow<List<...>>`，Room 会自动在数据变化时重新发射

**Step 3：创建 AppDatabase**

```
@Database(
  entities = [CharacterEntity::class, ConversationEntity::class, 
              MessageEntity::class, WorldInfoEntryEntity::class,
              ProviderConfigEntity::class],
  version = 1,
  exportSchema = true   // 导出 schema 文件，纳入版本控制
)
```

**Step 4：实现 Repository**

- `CharacterRepository`：封装 DAO，处理头像文件复制逻辑
- `ConversationRepository`：封装会话和消息的 CRUD
- `WorldInfoRepository`：封装世界书条目的 CRUD

**Step 5：配置 Hilt 注入**

在 `DatabaseModule` 中提供 `AppDatabase` 和各 DAO 的单例。

**验证目标**：能通过 Repository 保存一个角色并读取出来。

---

### 阶段五：LLM 接入（Week 8-9）

**Step 1：定义领域模型**

```
data class ChatMessage(
  val id: String,
  val role: MessageRole,   // enum: SYSTEM, USER, ASSISTANT
  val content: String
)
```

**Step 2：实现 ContextBuilder**

这是 SillyTavern 兼容性的核心逻辑，按以下顺序实现：

1. `MacroProcessor`：实现 `{{char}}` 和 `{{user}}` 替换
2. `WorldInfoMatcher`：实现关键词匹配，返回触发的条目列表
3. `ContextBuilder.build()`：
   - 组装 system 消息（包含角色描述、触发的 World Info、system_prompt）
   - 将 `mes_example` 解析为示例消息对（按 `<START>` 分割）
   - 追加历史消息（按消息数量截断）
   - 追加 `post_history_instructions`
   - 返回 `List<ChatMessage>`

**Step 3：实现 OpenAIProvider**

1. 构造 JSON 请求体（使用 kotlinx.serialization）
2. 使用 OkHttp 发送 POST 请求
3. 用 `callbackFlow {}` 包裹 SSE 读取循环
4. 实现 `validateConfig`：发送一个简单请求检验 API Key

**Step 4：实现 ClaudeProvider**

参考第3章的差异说明，主要处理：
- `system` 字段分离
- `x-api-key` 认证头
- `anthropic-version` 头
- SSE 事件格式差异（`content_block_delta`）

**Step 5：Provider 注册表**

```
object ProviderRegistry {
  val providers: Map<String, LLMProvider> = mapOf(
    "openai" to OpenAIProvider(),
    "claude" to ClaudeProvider(),
  )
}
```

**验证目标**：用命令行或 Android 测试，能向 OpenAI API 发送请求并打印流式响应。

---

### 阶段六：UI 实现（Week 10-11）

**页面清单与优先级**：

```
高优先级（必须完成）：
  1. 角色卡列表页（CharacterListScreen）
  2. 聊天页（ChatScreen）
  3. 设置页 - Provider 配置（SettingsScreen）

中优先级：
  4. 会话列表页（ConversationListScreen）
  5. 导入引导页/欢迎页

低优先级（可简化）：
  6. 世界书查看页（只读即可，v1.1 再做编辑）
```

**角色卡列表页设计要点**：
- `LazyColumn` 展示角色列表，每个 item 显示头像（Coil 加载）、名称、标签
- 右上角 FAB（浮动按钮）触发文件选择器导入
- 长按角色显示删除确认对话框
- 点击角色进入会话列表

**聊天页设计要点**：
- 顶部：角色名称 + 切换 Provider 下拉菜单
- 中部：`LazyColumn` 展示消息列表，用户消息右对齐，AI 消息左对齐
- AI 消息使用 Markdown 渲染组件
- 流式输出时，显示"打字光标"动画（最后一个字符后加 `▌`，用 `AnimatedContent` 或简单计时器）
- 底部：多行输入框 + 发送按钮，发送中变为停止按钮（支持中断流式输出）
- 首次进入时，如果角色有 `first_mes`，自动显示为 AI 的第一条消息

**设置页设计要点**：
- Provider 配置列表，可新增/编辑/删除
- 新增 Provider 配置：选择 Provider 类型 → 填写 API Key、Endpoint、Model
- "测试连接"按钮，调用 `validateConfig`
- 全局设置：用户名（`{{user}}` 宏替换）、最大上下文消息数

**ChatViewModel 核心状态**：

```
data class ChatUiState(
  val messages: List<MessageUiModel>,    // 显示的消息列表
  val isStreaming: Boolean,              // 是否正在流式输出
  val inputText: String,                 // 输入框内容
  val error: String?,                    // 错误信息
  val character: Character?,             // 当前角色
  val activeProvider: ProviderConfig?,   // 当前 Provider
)
```

**停止生成的实现**：
- 在 ChatViewModel 中持有当前的 `Job`（Coroutine Job）
- 点击"停止"时调用 `job.cancel()`
- Flow 会自动取消，不会再继续接收 token

---

### 阶段七：测试与发布（Week 12-14）

**Step 1：关键功能测试**

格式兼容层（纯 JUnit 测试）：
- 准备10个以上真实角色卡文件（从 [Character Hub](https://characterhub.org) 或 [Chub.ai](https://chub.ai) 下载）
- 验证 PNG 解析成功率
- 验证有世界书的角色卡能正确提取 World Info

LLM 集成测试：
- 用真实 API Key 测试 OpenAI 流式输出
- 测试错误处理：故意填错 API Key，验证错误提示

**Step 2：体验优化 Checklist**

发布前必须完成：

```
□ 角色卡列表为空时显示引导（"点击 + 导入你的第一张角色卡"）
□ 发送消息后输入框自动清空并关闭软键盘
□ 消息列表在新消息时自动滚动到底部
□ 流式输出中途 App 切换到后台，不会崩溃
□ 导入格式错误的文件时，显示友好错误提示
□ 无网络时发送消息，显示错误提示
□ 深色模式（Material3 自动支持，确认样式正确）
□ 旋转屏幕不丢失聊天内容（ViewModel 保证）
```

**Step 3：构建 Release APK**

1. 在 `build.gradle.kts` 配置签名：`signingConfigs { release { ... } }`
2. `./gradlew assembleRelease`
3. 验证 APK 可以在未安装 Android Studio 的设备上安装

---

## 8. 工程配置与环境搭建

### 8.1 开发环境

```
IDE：Android Studio Hedgehog（2023.1.1）或更新版本
  下载：https://developer.android.com/studio

JDK：Android Studio 内置 JDK 17（无需单独安装）

Android SDK：
  在 SDK Manager 中安装：
  - Android 14 (API 34) 平台
  - Android Emulator
  - Build Tools 34.x

模拟器配置：
  - Pixel 7 Pro 或 Pixel 6（推荐，代表主流屏幕比例）
  - Android 14 系统镜像
  - 分配至少 2GB RAM
```

### 8.2 版本控制规范

```
分支策略：
  main         → 始终可发布的稳定代码
  develop      → 开发分支
  feature/xxx  → 功能分支，从 develop 切出，完成后 PR 合并

Commit 规范（Conventional Commits）：
  feat: 新功能
  fix: 修复 bug
  refactor: 重构（不影响功能）
  docs: 文档
  test: 测试
  chore: 构建/工具变更

Tag 规范：
  v1.0.0-alpha.1  → 早期测试版
  v1.0.0-beta.1   → 功能完整，等待测试
  v1.0.0          → 正式发布
```

### 8.3 GitHub 仓库配置

必须配置的文件：

```
README.md         → 参见第10章详细说明
LICENSE           → 推荐 AGPL-3.0（与 SillyTavern 保持一致）
.gitignore        → Android 标准模板 + 添加 /local.properties
CHANGELOG.md      → 版本更新日志
CONTRIBUTING.md   → 贡献指南（吸引社区参与）
.github/
  ISSUE_TEMPLATE/
    bug_report.md
    feature_request.md
  workflows/
    build.yml     → GitHub Actions 自动构建 APK
```

**GitHub Actions 自动构建**（重要）：
配置在每次 push tag 时自动编译 Release APK 并上传到 GitHub Releases，用户可直接下载安装，无需自己编译。这对获取 Star 至关重要。

---

## 9. 测试策略

### 9.1 分层测试

```
单元测试（src/test/）  ← 不需要 Android 设备，速度快
  - PngChunkReader
  - CharxParser
  - CharacterMapper
  - ContextBuilder
  - WorldInfoMatcher
  - MacroProcessor
  目标覆盖率：格式兼容层 > 80%

集成测试（src/androidTest/）  ← 需要模拟器或设备
  - Room 数据库 CRUD
  - Repository 层
  目标：核心 CRUD 操作全覆盖

手动测试清单
  - 从不同来源（ChHub、Character.AI 导出等）导入角色卡
  - 测试各 Provider 的流式输出
  - 测试 World Info 触发
```

### 9.2 测试数据准备

建议在 `src/test/resources/` 目录下放置测试用角色卡文件：

- `test_v2_basic.png`：基础 V2 格式角色卡
- `test_v2_with_worldinfo.png`：含内嵌世界书的角色卡
- `test_charx_basic.charx`：基础 CHARX 格式
- `test_charx_with_sprites.charx`：含立绘的 CHARX（用于验证未来立绘功能）
- `test_malformed.png`：非角色卡 PNG（用于测试错误处理）

---

## 10. 发布与运营

### 10.1 README 结构（决定 Star 数量的关键）

README 是获得 Star 最重要的因素，结构建议：

```markdown
# TavernDroid

[徽章：GitHub Release] [徽章：License] [徽章：Android API]

> SillyTavern 的 Android 原生客户端，直接导入你的角色卡，无需 Termux 或任何服务器。

## 演示 GIF（最重要！）
（录制：导入角色卡 → 开始对话 → 流式输出的完整流程，约15秒）

## 功能特性
- ✅ 完整兼容 SillyTavern 角色卡（PNG/CHARX）
- ✅ World Info / 世界书注入
- ✅ 支持 OpenAI、Claude 及所有 OpenAI 兼容接口
- ✅ 流式输出，Markdown 渲染
- ✅ 本地聊天记录
- ✅ Material You 设计

## 安装
[直接下载 APK] - 指向 GitHub Releases 最新版本

## 使用说明
1. 在设置中配置 API Key
2. 点击 + 导入角色卡（.png 或 .charx）
3. 点击角色开始对话

## 与 SillyTavern 的兼容性
| 功能 | TavernDroid | 说明 |
...

## 贡献
欢迎 PR 和 Issue。尤其需要：更多 Provider 支持，翻译。

## 致谢
本项目基于 SillyTavern 的角色卡规范实现...
```

### 10.2 发布渠道（按优先级）

**第一优先级（精准用户）**：
- SillyTavern 官方 Discord 的 `#related-projects` 或 `#mobile-clients` 频道
- Reddit `r/SillyTavernAI` — 发帖标题建议：「I made a native Android app that directly imports your ST character cards - no Termux needed」

**第二优先级（扩散流量）**：
- Reddit `r/LocalLLaMA` — 强调多 Provider 支持
- Reddit `r/CharacterAI` — 强调角色扮演功能

**第三优先级（长尾流量）**：
- F-Droid 提交（开源 Android 应用市场，吸引技术用户）
- GitHub Trending（如果发布初期获得足够 Star）

### 10.3 现实 Star 预期

```
发布当天（好的情况）：  20-50 stars
第一个月：            100-300 stars
v1.0 稳定后：         300-800 stars
破千需要：            被大 V 推荐 或 ST 官方提及
```

---

## 11. v1.0 之后的扩展路线

架构已为以下功能预留接口，v1.1 可按需实现：

### 11.1 表情/立绘系统（v1.1）

- `CharxParser` 已保存原始 CHARX 文件路径
- 实现 `SpriteExtractor`：从 CHARX 的 `sprites/` 目录提取立绘
- 实现 `EmotionDetector`：扫描 AI 回复，关键词匹配情绪
- 在 ChatScreen 中添加立绘显示区域（Coil 加载）

### 11.2 更多 Provider（v1.1）

Provider 接口已定义，新增 Provider 只需：
1. 实现 `LLMProvider` 接口
2. 注册到 `ProviderRegistry`
3. 添加对应 UI 配置项

优先级：Google Gemini（OpenAI 兼容）、Ollama（本地模型）、OpenRouter

### 11.3 ST 格式聊天记录导入/导出（v1.2）

SillyTavern 聊天记录格式为 JSONL：
- 第一行：元数据（角色名、时间等）
- 后续行：每条消息的 JSON

实现双向转换：
- 导入：解析 JSONL → 存入 Room
- 导出：Room 消息 → JSONL 文件

### 11.4 Prompt 预设管理（v1.2）

- 数据库添加 `PromptPreset` 表
- UI 添加预设选择/编辑界面
- `ContextBuilder` 接受预设参数

### 11.5 TTS 语音（v1.3）

- 定义 `TTSEngine` 接口
- 实现 Android 内置 `TextToSpeech`（免费）
- 预留 OpenAI TTS、Edge TTS 接口
- AI 消息生成完毕后，可选触发朗读

---

## 附录

### A. 关键外部资源

| 资源 | 地址 | 用途 |
|---|---|---|
| Character Card V2 规范 | https://github.com/malfoyslastname/character-card-spec-v2 | 角色卡格式参考 |
| SillyTavern 文档 | https://docs.sillytavern.app | 功能行为参考 |
| Character Hub | https://characterhub.org | 测试用角色卡下载 |
| Chub.ai | https://chub.ai | 测试用角色卡下载 |
| Android Compose Codelab | https://developer.android.com/codelabs/jetpack-compose-basics | Compose 入门 |
| Kotlin Flow 文档 | https://kotlinlang.org/docs/flow.html | 流式处理学习 |
| Room 数据库文档 | https://developer.android.com/training/data-storage/room | Room 使用参考 |
| OkHttp 文档 | https://square.github.io/okhttp | SSE 实现参考 |
| PNG 规范（Chunks） | http://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html | PNG 解析参考 |

### B. 常见坑与解决方案

**坑1：转屏后 AI 正在生成的消息消失**
- 原因：消息状态保存在 Activity 而非 ViewModel
- 解决：所有流式接收的 token 实时更新到 ViewModel 的 `StateFlow`

**坑2：`FileNotFoundException` 打开用户选择的文件**
- 原因：Android 权限问题，需要在打开文件选择器后立即持久化 URI 权限
- 解决：`contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION)`

**坑3：Room 在主线程访问崩溃**
- 原因：Room 默认禁止主线程数据库访问
- 解决：所有 DAO 调用放在 `suspend` 函数或 `Flow` 中，在 `viewModelScope` 里调用

**坑4：OkHttp SSE 流在 App 进后台后中断**
- 原因：Android 系统限制后台网络
- 解决：发送消息时使用 Foreground Service，或在设置中提示用户保持 App 在前台

**坑5：kotlinx.serialization 遇到 unknown key 崩溃**
- 原因：角色卡可能包含扩展字段（如 RisuAI、Silly 自己的扩展）
- 解决：`Json { ignoreUnknownKeys = true }` 配置全局 Json 实例

### C. v1.0 功能完成度自查表

```
格式兼容：
  □ PNG 角色卡解析（Character Card V2）
  □ CHARX 角色卡解析
  □ 内嵌世界书提取
  □ 错误格式友好提示

对话功能：
  □ 角色人设注入（description/personality/scenario）
  □ system_prompt 支持
  □ first_mes 显示
  □ mes_example 注入
  □ post_history_instructions 支持
  □ {{char}} {{user}} 宏替换
  □ World Info 关键词触发（基础）

LLM 接入：
  □ OpenAI 格式流式输出
  □ Claude API 接入
  □ 错误处理（401/429/网络错误）
  □ 停止生成

本地功能：
  □ 角色卡列表/导入/删除
  □ 会话创建/切换/删除
  □ 消息持久化
  □ Provider 配置增删改
  □ API Key 加密存储

UI/UX：
  □ 流式输出打字动画
  □ Markdown 渲染
  □ 深色模式
  □ 空状态引导页
  □ 错误 Toast 提示
```