---
title: AutoAgent — 多模态智能工作流平台设计文档
date: 2026-04-26
categories: projects/autoagent
tags:
- AI
- Agent
- LLM
description: 从零到一的企业级多模态智能工作流平台设计文档，涵盖架构、技术选型、模块设计与开发流程。
cover:
---

# AutoAgent — 企业级多模态智能工作流平台
## 从零到一完整项目设计文档

> **文档版本**：v1.0  
> **适用人群**：有 Java / Python 基础的开发者，首次构建 AI Agent 项目  
> **技术栈**：Spring Boot 3.x + Python 3.11 + LangGraph + LangChain + gRPC + Kafka  

---

## 目录

1. [项目背景与目标](#1-项目背景与目标)
2. [整体架构设计](#2-整体架构设计)
3. [开发环境搭建](#3-开发环境搭建)
4. [Spring Boot 服务详细设计](#4-spring-boot-服务详细设计)
5. [Python Agent 服务详细设计](#5-python-agent-服务详细设计)
6. [两服务通信设计（gRPC + Kafka）](#6-两服务通信设计grpc--kafka)
7. [数据库设计](#7-数据库设计)
8. [前端设计概要](#8-前端设计概要)
9. [可观测性设计](#9-可观测性设计)
10. [部署方案](#10-部署方案)
11. [开发顺序与里程碑](#11-开发顺序与里程碑)

---

## 1. 项目背景与目标

### 1.1 项目背景

中大型企业内部每天面临大量重复性、跨系统的知识型工作：

- **客服场景**：用户反复询问产品文档、退款流程、合同条款，人工重复回答，效率低
- **数据聚合场景**：销售人员需要从 CRM、ERP、邮件系统中手动拼凑客户信息
- **内容生产场景**：运营需要每周整合多个数据源，生成报告并发送邮件
- **代码辅助场景**：开发团队需要快速检索内部 SDK 文档、生成样板代码

传统 RPA 方案无法处理自然语言理解，规则固化，维护成本高。本项目通过 **LLM 驱动的多 Agent 协作**，让系统具备自主规划、拆解并执行复杂任务的能力，同时通过 **Human-in-the-loop** 机制保障关键操作的可控性。

### 1.2 项目核心价值

| 价值维度 | 描述 |
|---|---|
| 效率提升 | 企业知识问答响应速度从分钟级降至秒级 |
| 跨系统集成 | Agent 通过工具调用打通多个内部系统 |
| 可解释性 | 每一步推理过程可追溯，决策透明 |
| 安全可控 | 高风险操作需人工确认，不存在完全失控的自动化 |
| 可扩展性 | 新增工具或 Agent 只需实现标准接口，无需改动核心逻辑 |

### 1.3 功能清单

**核心功能（必须实现）：**

- [ ] 用户注册/登录，JWT 鉴权
- [ ] 多轮对话（带记忆）
- [ ] RAG 知识库问答（上传文档 → 向量化 → 检索增强）
- [ ] 多 Agent 工作流执行（Supervisor + Worker 模式）
- [ ] 工具调用（搜索、代码执行、文件读写）
- [ ] 流式输出（前端实时显示 Agent 思考过程）
- [ ] Human-in-the-loop 审批节点
- [ ] Agent 执行日志与 Trace 查看

**扩展功能（加分项）：**

- [ ] 企业内部系统 MCP 工具集成
- [ ] 多模型切换（OpenAI / 本地 Ollama）
- [ ] 任务调度（定时执行 Agent 工作流）
- [ ] Prometheus + Grafana 监控大盘
- [ ] 多租户支持

---

## 2. 整体架构设计

### 2.1 架构总览

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (React)                          │
│         WebSocket / REST / SSE                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  Spring Boot 服务 (:8080)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  API 网关层  │  │  业务编排层   │  │  Agent 调用代理层  │  │
│  │  (安全/限流) │  │  (会话/调度) │  │  (gRPC Client)   │  │
│  └─────────────┘  └──────────────┘  └───────────────────┘  │
│              │                              │               │
│              ▼                              ▼               │
│  ┌───────────────────────┐   ┌─────────────────────────┐   │
│  │  MySQL + Redis + MinIO│   │       Kafka Broker       │   │
│  └───────────────────────┘   └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                      gRPC (:50051) ▲▼  Kafka ▲▼
┌─────────────────────────────────────────────────────────────┐
│                  Python Agent 服务 (:8000)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐ │
│  │  FastAPI 层  │  │  Agent 核心  │  │  记忆 & 知识库     │ │
│  │  (gRPC Srv)  │  │  (LangGraph) │  │  (RAG / Memory)   │ │
│  └──────────────┘  └──────────────┘  └───────────────────┘ │
│                           │                                 │
│  ┌────────────────────────▼──────────────────────────────┐  │
│  │              工具集 (Tools / MCP)                       │  │
│  │  搜索工具 | 代码沙箱 | 文件工具 | 邮件工具 | 自定义工具  │  │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                     向量数据库层                              │
│            ChromaDB (开发) / Milvus (生产)                   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 请求链路说明

**短任务链路（< 30秒，同步 gRPC）：**

```
用户发送消息
  → Spring Boot 接收 REST 请求
  → JWT 验证
  → 创建会话记录 (MySQL)
  → gRPC 调用 Python Agent 服务
  → Python Agent 执行 (LangGraph)
  → 返回结果 gRPC Response
  → Spring Boot 保存对话历史
  → 返回 HTTP Response 给前端
```

**长任务链路（> 30秒，异步 Kafka）：**

```
用户触发工作流任务
  → Spring Boot 接收请求
  → 任务入库 (status=PENDING)
  → 发送消息到 Kafka topic: agent.task.input
  → 立即返回 taskId 给前端
  → 前端建立 WebSocket 连接，订阅任务进度
  → Python Agent 消费 Kafka 消息
  → Agent 执行过程中，实时发送进度到 Kafka topic: agent.task.progress
  → Spring Boot 消费进度消息，通过 WebSocket 推送前端
  → Agent 执行完成，结果发到 Kafka topic: agent.task.result
  → Spring Boot 消费结果，更新数据库，WebSocket 通知前端
```

### 2.3 模块划分原则

- **Spring Boot** 负责：认证、业务逻辑、数据持久化、对外 API、消息路由
- **Python** 负责：LLM 调用、Agent 编排、工具执行、向量检索
- **两者职责严格分离**，Python 不直接操作业务数据库，Spring Boot 不直接调用 LLM

---

## 3. 开发环境搭建

### 3.1 基础依赖版本

| 依赖 | 版本 | 说明 |
|---|---|---|
| JDK | 21 LTS | 满足 Spring Boot 3.x 要求 |
| Maven | 3.9+ | Java 构建工具 |
| Python | 3.11 | Agent 服务运行环境 |
| Poetry | 1.7+ | Python 依赖管理 |
| Docker | 24+ | 中间件容器化 |
| Docker Compose | 2.x | 本地多服务编排 |
| Node.js | 20 LTS | 前端开发 |
| Redis | 7.x | 缓存与会话 |
| MySQL | 8.0 | 业务数据库 |
| Kafka | 3.6 | 异步消息 |
| MinIO | latest | 文件对象存储 |

### 3.2 本地 Docker Compose 配置说明

**文件路径**：`docker/docker-compose-dev.yml`

需要启动以下容器：

- `mysql:8.0` — 端口 3306，初始化脚本挂载 `/docker-entrypoint-initdb.d/`
- `redis:7-alpine` — 端口 6379，开启 AOF 持久化
- `bitnami/kafka:3.6` — 端口 9092（外部），9093（Controller），使用 KRaft 模式（无 Zookeeper）
- `minio/minio` — 端口 9000（API），9001（Console）
- `chromadb/chroma` — 端口 8100（开发向量库）
- `prom/prometheus` — 端口 9090
- `grafana/grafana` — 端口 3001

**Kafka KRaft 模式关键环境变量：**

```
KAFKA_CFG_NODE_ID=1
KAFKA_CFG_PROCESS_ROLES=broker,controller
KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093
KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=1@kafka:9093
KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER
```

### 3.3 Kafka Topic 初始化脚本

项目启动时需要预创建以下 Topic：

| Topic 名称 | 分区数 | 副本数 | 说明 |
|---|---|---|---|
| `agent.task.input` | 3 | 1 | 任务下发 |
| `agent.task.progress` | 3 | 1 | 执行进度 |
| `agent.task.result` | 3 | 1 | 执行结果 |
| `agent.task.humanhit` | 1 | 1 | 人工审批通知 |

### 3.4 项目目录结构总览

```
autoagent/
├── autoagent-backend/          # Spring Boot 项目
│   ├── src/main/java/
│   │   └── com/autoagent/
│   │       ├── config/         # 配置类
│   │       ├── controller/     # 控制器
│   │       ├── service/        # 业务层
│   │       ├── repository/     # 数据访问层
│   │       ├── domain/         # 实体与 VO
│   │       ├── grpc/           # gRPC 客户端
│   │       ├── kafka/          # 消息生产/消费
│   │       ├── websocket/      # WebSocket 处理
│   │       ├── security/       # 安全相关
│   │       └── common/         # 工具类/异常
│   ├── src/main/proto/         # .proto 文件
│   └── pom.xml
│
├── autoagent-python/           # Python Agent 项目
│   ├── app/
│   │   ├── api/                # FastAPI 路由
│   │   ├── grpc_server/        # gRPC 服务端
│   │   ├── agent/              # Agent 核心逻辑
│   │   │   ├── graph/          # LangGraph 定义
│   │   │   ├── nodes/          # 图节点
│   │   │   └── supervisor/     # Supervisor Agent
│   │   ├── tools/              # 工具集
│   │   ├── memory/             # 记忆模块
│   │   ├── rag/                # RAG 模块
│   │   ├── llm/                # LLM 统一接口
│   │   └── config/             # 配置
│   ├── proto/                  # .proto 文件（与 Java 共享）
│   ├── tests/
│   ├── pyproject.toml
│   └── Dockerfile
│
├── autoagent-frontend/         # React 前端
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── store/              # Zustand 状态管理
│   │   ├── api/                # API 封装
│   │   └── hooks/
│   └── package.json
│
├── docker/
│   ├── docker-compose-dev.yml
│   └── docker-compose-prod.yml
│
├── proto/                      # 共享 proto 定义（软链接）
└── docs/                       # 文档
```

---

## 4. Spring Boot 服务详细设计

### 4.1 Maven 依赖清单（pom.xml）

**核心依赖：**

```xml
<!-- Spring Boot Starter -->
spring-boot-starter-web
spring-boot-starter-security
spring-boot-starter-websocket
spring-boot-starter-data-redis
spring-boot-starter-actuator
spring-boot-starter-validation
spring-boot-starter-aop

<!-- 数据库 -->
mybatis-plus-boot-starter (3.5.x)
mysql-connector-j
druid-spring-boot-starter

<!-- gRPC -->
grpc-spring-boot-starter (net.devh, 2.15.0)
<!-- 注意：需要配合 protobuf-maven-plugin 生成代码 -->

<!-- Kafka -->
spring-kafka

<!-- JWT -->
jjwt-api (0.12.x)
jjwt-impl
jjwt-jackson

<!-- 限流熔断 -->
resilience4j-spring-boot3
resilience4j-circuitbreaker
resilience4j-ratelimiter

<!-- 任务调度 -->
quartz

<!-- 文件存储 -->
minio (8.5.x)

<!-- API 文档 -->
springdoc-openapi-starter-webmvc-ui (2.x)

<!-- 工具 -->
mapstruct
lombok
hutool-all
```

**Maven 插件：**

```xml
<!-- protobuf 代码生成 -->
protobuf-maven-plugin
os-maven-plugin
```

### 4.2 包结构与类职责详解

#### 4.2.1 config 包 — 配置类

**`SecurityConfig`**
- 职责：Spring Security 全局安全配置
- 核心配置：
  - 关闭 CSRF（前后端分离）
  - 配置无需认证的白名单接口（`/api/auth/**`、`/actuator/health`、WebSocket 端点）
  - 配置 JWT 过滤器优先于 UsernamePasswordAuthenticationFilter
  - 配置 CORS 允许前端域名跨域
  - 密码加密器 Bean：`BCryptPasswordEncoder`
  - Session 策略设为 STATELESS

**`JwtConfig`**
- 职责：JWT 相关配置读取与初始化
- 从 `application.yml` 读取：`jwt.secret`、`jwt.expiration`（Access Token 过期时间，建议 2h）、`jwt.refresh-expiration`（Refresh Token，建议 7d）
- 初始化签名 Key（使用 HMAC-SHA256）

**`RedisConfig`**
- 职责：Redis 连接池与序列化配置
- 配置 `RedisTemplate<String, Object>`，Value 使用 Jackson2JsonRedisSerializer（避免乱码）
- 配置 `StringRedisTemplate` 用于简单字符串操作
- 配置连接池：Lettuce，最大连接数 20

**`KafkaConfig`**
- 职责：Kafka Producer 和 Consumer 的 Bean 配置
- Producer 配置：`StringSerializer`，`acks=all`，`retries=3`，`enable.idempotence=true`
- Consumer 配置：`StringDeserializer`，`auto.offset.reset=earliest`，手动提交 offset（`enable.auto.commit=false`），`max.poll.records=10`
- 定义消费者组 ID：`autoagent-backend-group`

**`WebSocketConfig`**
- 职责：STOMP over WebSocket 配置
- 注册消息代理：`/topic`（广播）、`/queue`（点对点）
- 设置应用前缀：`/app`（客户端发送目的地前缀）
- 配置 WebSocket 端点：`/ws`，允许所有来源
- 配置入站通道拦截器：用于 WebSocket 握手时验证 JWT Token

**`GrpcClientConfig`**
- 职责：gRPC Channel 连接配置（通过 `grpc-spring-boot-starter` 自动配置，此类补充定制）
- 配置 Python 服务地址（从配置文件读取）
- 配置连接超时、读取超时、最大消息大小（4MB）
- 配置重试策略：指数退避，最多 3 次

**`MinioConfig`**
- 职责：MinIO 客户端 Bean
- 从配置文件读取 endpoint、accessKey、secretKey
- 初始化 `MinioClient` Bean
- 配置默认 Bucket 名称（程序启动时自动创建 Bucket 若不存在）

**`QuartzConfig`**
- 职责：Quartz 调度器配置
- 配置 JobStore 使用 JDBC（持久化调度任务到 MySQL，表名 `qrtz_*`）
- 配置线程池大小：10
- 配置错过触发策略

**`Resilience4jConfig`**
- 职责：限流与熔断规则配置（补充 yml 配置的自定义 Bean）
- 配置 CircuitBreaker：`agent-python-cb`，失败率 50% 触发，等待 30s，半开状态允许 3 次探测
- 配置 RateLimiter：`api-rate-limiter`，每秒 100 次请求

**`SwaggerConfig`**
- 职责：OpenAPI 3.0 文档配置
- 定义 API 信息（标题、版本、描述）
- 配置 Bearer Token 认证方案

#### 4.2.2 security 包 — 安全相关

**`JwtTokenProvider`**
- 职责：JWT 令牌的生成、解析、验证
- 方法：
  - `generateAccessToken(UserDetails userDetails)` → 生成 Access Token，携带 userId、roles
  - `generateRefreshToken(String userId)` → 生成 Refresh Token
  - `validateToken(String token)` → 验证签名和过期时间，返回是否有效
  - `getUserIdFromToken(String token)` → 从 Token 中提取 userId
  - `getClaimsFromToken(String token)` → 提取全部 Claims
- 注意：Access Token 不存 Redis，通过签名验证；Refresh Token 存 Redis，支持主动吊销

**`JwtAuthenticationFilter`**
- 职责：每次请求的 JWT 校验过滤器，继承 `OncePerRequestFilter`
- 处理流程：
  1. 从 `Authorization` Header 提取 Bearer Token
  2. 调用 `JwtTokenProvider.validateToken()`
  3. 若有效，从 Token 中提取 userId，从 Redis 或数据库加载 UserDetails
  4. 构建 `UsernamePasswordAuthenticationToken` 放入 SecurityContext
  5. 若无效或过期，直接放行（由后续 Security 配置决定是否拦截）

**`CustomUserDetailsService`**
- 职责：实现 Spring Security 的 `UserDetailsService`
- 方法：`loadUserByUsername(String userId)` → 查 MySQL 用户表，构建 `UserDetails`，携带角色列表

**`CustomAuthenticationEntryPoint`**
- 职责：未认证请求的统一响应（返回 401 JSON 而非跳转）

**`CustomAccessDeniedHandler`**
- 职责：权限不足请求的统一响应（返回 403 JSON）

#### 4.2.3 controller 包 — 控制器层

**设计规范：**
- 所有 Controller 只做参数校验（`@Valid`）、调用 Service、封装统一响应
- 禁止在 Controller 中写业务逻辑
- 统一返回 `ApiResponse<T>` 包装类

**`AuthController`**（路径：`/api/auth`）

| 方法 | 路径 | 描述 |
|---|---|---|
| POST | `/register` | 用户注册 |
| POST | `/login` | 用户登录，返回 Access + Refresh Token |
| POST | `/refresh` | 使用 Refresh Token 换取新 Access Token |
| POST | `/logout` | 吊销 Refresh Token |

**`ConversationController`**（路径：`/api/conversations`，需认证）

| 方法 | 路径 | 描述 |
|---|---|---|
| POST | `/` | 创建新会话 |
| GET | `/` | 获取当前用户的会话列表 |
| GET | `/{conversationId}` | 获取会话详情（含历史消息） |
| DELETE | `/{conversationId}` | 删除会话 |
| POST | `/{conversationId}/messages` | 发送消息（短任务，同步） |
| GET | `/{conversationId}/messages` | 获取消息列表（分页） |

**`TaskController`**（路径：`/api/tasks`，需认证）

| 方法 | 路径 | 描述 |
|---|---|---|
| POST | `/` | 创建并触发长任务工作流 |
| GET | `/{taskId}` | 查询任务状态 |
| GET | `/` | 获取任务列表（分页、按状态筛选） |
| POST | `/{taskId}/approve` | 人工审批通过（Human-in-the-loop） |
| POST | `/{taskId}/reject` | 人工审批拒绝 |

**`KnowledgeBaseController`**（路径：`/api/knowledge-bases`，需认证）

| 方法 | 路径 | 描述 |
|---|---|---|
| POST | `/` | 创建知识库 |
| GET | `/` | 获取知识库列表 |
| POST | `/{kbId}/documents` | 上传文档（触发向量化异步任务） |
| GET | `/{kbId}/documents` | 查看文档列表和向量化状态 |
| DELETE | `/{kbId}/documents/{docId}` | 删除文档 |
| POST | `/{kbId}/query` | 直接对知识库提问（测试用） |

**`AgentConfigController`**（路径：`/api/agent-configs`，管理员权限）

| 方法 | 路径 | 描述 |
|---|---|---|
| GET | `/` | 获取 Agent 配置列表（可用工具、模型） |
| PUT | `/{agentId}` | 更新 Agent 配置 |

**`MonitorController`**（路径：`/api/monitor`，管理员权限）

| 方法 | 路径 | 描述 |
|---|---|---|
| GET | `/traces/{taskId}` | 获取任务的完整 Agent Trace 日志 |
| GET | `/stats` | 获取系统统计信息 |

#### 4.2.4 service 包 — 业务层

**`AuthService`**
- 职责：用户认证相关业务逻辑
- 方法：
  - `register(RegisterRequest req)` → 校验用户名不重复 → BCrypt 加密密码 → 插入用户表 → 返回用户信息
  - `login(LoginRequest req)` → 验证账密 → 生成双 Token → Refresh Token 存 Redis（key: `refresh:${userId}`，TTL 7天）→ 返回 TokenPair
  - `refreshToken(String refreshToken)` → 验证 Refresh Token → 查 Redis 确认未被吊销 → 生成新 Access Token → 返回
  - `logout(String userId)` → 删除 Redis 中 Refresh Token

**`ConversationService`**
- 职责：会话和消息管理
- 方法：
  - `createConversation(String userId, CreateConversationRequest req)` → 创建会话记录，关联知识库（可选）→ 返回 ConversationVO
  - `sendMessage(String userId, String conversationId, SendMessageRequest req)` → 
    1. 查询会话是否存在且属于当前用户
    2. 保存用户消息到数据库
    3. 从 Redis 获取对话历史（最近 20 条，控制 Token 消耗）
    4. 调用 `AgentCallService.callAgent()` 获取回复
    5. 保存 Agent 回复消息
    6. 更新 Redis 中对话历史
    7. 返回消息 VO
  - `getMessages(String conversationId, PageRequest pageReq)` → 分页查询消息列表

**`TaskService`**
- 职责：长任务的生命周期管理
- 方法：
  - `createTask(String userId, CreateTaskRequest req)` → 创建任务记录（status=PENDING）→ 发 Kafka 消息 → 返回 taskId
  - `getTask(String taskId)` → 查询任务详情（含步骤列表）
  - `updateTaskStatus(String taskId, TaskStatus status)` → 更新任务状态
  - `handleHumanApproval(String taskId, boolean approved, String userId)` → 处理审批，发送 Kafka 消息通知 Python 继续/取消执行
  - `saveTaskStep(String taskId, TaskStep step)` → 保存任务执行步骤记录

**`AgentCallService`**
- 职责：封装对 Python Agent 的调用，屏蔽通信细节
- 方法：
  - `callAgent(AgentCallRequest req)` → 同步 gRPC 调用，超时 60s，支持 Resilience4j 熔断降级，降级返回"服务繁忙，请稍后再试"
  - `callAgentStream(AgentCallRequest req, StreamObserver observer)` → 流式 gRPC 调用，每收到一个 token 回调 observer
  - `dispatchAsyncTask(AsyncTaskRequest req)` → 异步任务下发到 Kafka

**`KnowledgeBaseService`**
- 职责：知识库和文档管理
- 方法：
  - `createKnowledgeBase(String userId, CreateKBRequest req)` → 创建知识库记录
  - `uploadDocument(String kbId, MultipartFile file)` →
    1. 上传文件到 MinIO，获取文件 URL
    2. 保存文档记录（status=PROCESSING）
    3. 发送 Kafka 消息：`agent.task.input`（type=VECTORIZE_DOC），携带 docId 和文件 URL
    4. 返回 docId
  - `updateDocumentStatus(String docId, DocStatus status, int chunkCount)` → 由 Kafka 消费者调用，更新文档向量化状态

**`FileStorageService`**
- 职责：封装 MinIO 文件操作
- 方法：
  - `uploadFile(String bucketName, String objectName, InputStream stream, String contentType)` → 上传文件，返回访问 URL
  - `getPresignedUrl(String bucketName, String objectName, int expirySecs)` → 生成预签名下载链接（有效期可配置）
  - `deleteFile(String bucketName, String objectName)` → 删除文件
  - `fileExists(String bucketName, String objectName)` → 检查文件是否存在

#### 4.2.5 grpc 包 — gRPC 客户端

**`AgentServiceGrpcClient`**
- 职责：封装对 Python gRPC 服务的调用
- 注入：`AgentServiceGrpc.AgentServiceBlockingStub`（同步）和 `AgentServiceGrpc.AgentServiceStub`（异步）
- 方法：
  - `chat(ChatRequest request)` → 调用 Python 的 `Chat` RPC，返回 `ChatResponse`
  - `chatStream(ChatRequest request, StreamObserver<ChatChunk> observer)` → 调用 `ChatStream` RPC
  - `executeTask(TaskRequest request)` → 调用 `ExecuteTask` RPC
  - `vectorizeDocument(VectorizeRequest request)` → 调用文档向量化 RPC
  - `queryKnowledgeBase(QueryRequest request)` → 调用知识库查询 RPC
- 异常处理：捕获 `StatusRuntimeException`，转换为业务异常，触发 Resilience4j 熔断计数

#### 4.2.6 kafka 包 — 消息生产与消费

**`TaskMessageProducer`**
- 职责：向 Kafka 发送任务相关消息
- 方法：
  - `sendTaskInput(String taskId, TaskInputMessage msg)` → 发送到 `agent.task.input`，key=taskId（保证同一任务有序）
  - `sendHumanApprovalDecision(String taskId, boolean approved)` → 发送审批结果

**`TaskProgressConsumer`**
- 职责：消费 Python Agent 发出的进度消息
- 监听：`agent.task.progress`
- 处理逻辑：
  1. 解析消息，获取 taskId 和进度信息
  2. 更新数据库任务步骤记录
  3. 通过 `WebSocketMessageBroker` 推送消息到前端订阅的 `/topic/task/{taskId}`
  4. 手动 ACK

**`TaskResultConsumer`**
- 职责：消费 Python Agent 发出的最终结果消息
- 监听：`agent.task.result`
- 处理逻辑：
  1. 解析消息，更新任务状态（COMPLETED / FAILED）
  2. 保存最终结果到数据库
  3. WebSocket 通知前端任务完成
  4. 手动 ACK

**`HumanApprovalConsumer`**
- 职责：消费 Python Agent 发出的需要人工审批的消息
- 监听：`agent.task.humanhit`
- 处理逻辑：
  1. 更新任务状态为 AWAITING_APPROVAL
  2. 保存审批上下文信息（需要审批的操作描述）
  3. WebSocket 通知相关用户弹出审批对话框

**`DocumentVectorizeResultConsumer`**
- 职责：消费文档向量化完成的消息
- 处理逻辑：更新文档状态为 COMPLETED，记录 chunk 数量

#### 4.2.7 websocket 包 — WebSocket 处理

**`WebSocketChannelInterceptor`**
- 职责：WebSocket 握手时的认证拦截
- 实现 `ChannelInterceptor`，重写 `preSend()`
- 当消息类型为 `CONNECT` 时，从 Header 中提取 JWT Token 验证，失败则抛出异常断开连接

**`WebSocketEventListener`**
- 职责：监听 WebSocket 连接/断开事件
- 监听 `SessionConnectedEvent`：记录用户 sessionId → userId 映射（存 Redis）
- 监听 `SessionDisconnectEvent`：清理映射关系

**`NotificationService`**
- 职责：封装 WebSocket 消息发送
- 方法：
  - `sendToUser(String userId, String destination, Object payload)` → 发送给特定用户（点对点）
  - `sendToTopic(String topic, Object payload)` → 广播

#### 4.2.8 domain 包 — 数据模型

**实体类（Entity，与数据库表对应）：**

- `User` — 用户表
- `Conversation` — 会话表
- `Message` — 消息表
- `Task` — 任务表
- `TaskStep` — 任务步骤表
- `AgentTrace` — Agent 推理链路日志表
- `KnowledgeBase` — 知识库表
- `Document` — 文档表

**值对象（VO，用于 API 响应）：**

- `UserVO`
- `ConversationVO`
- `MessageVO`
- `TaskVO`（含 TaskStepVO 列表）
- `KnowledgeBaseVO`
- `DocumentVO`

**请求对象（Request）：**

- `RegisterRequest`（用户名、密码、邮件、验证码）
- `LoginRequest`（用户名、密码）
- `CreateConversationRequest`（标题、关联知识库 ID 列表、Agent 配置 ID）
- `SendMessageRequest`（消息内容、消息类型 TEXT/FILE）
- `CreateTaskRequest`（任务类型、任务描述、输入参数 JSON、关联知识库）
- `CreateKBRequest`（知识库名称、描述、Embedding 模型选择）

**消息对象（Kafka Message）：**

- `TaskInputMessage`（taskId、taskType、inputParams、userId、knowledgeBaseIds）
- `TaskProgressMessage`（taskId、stepName、stepIndex、totalSteps、content、timestamp）
- `TaskResultMessage`（taskId、success、result、errorMsg、totalTokens、duration）
- `HumanApprovalMessage`（taskId、actionDescription、context、requiredByAgent）

**统一响应类：**

```java
// ApiResponse<T>
// code: 200=成功, 400=参数错误, 401=未认证, 403=权限不足, 500=服务器错误
// message: 描述
// data: 业务数据
// timestamp: 时间戳
```

#### 4.2.9 repository 包 — 数据访问层

使用 **MyBatis-Plus**，大部分 CRUD 通过 `BaseMapper<T>` 自动实现。

**`UserMapper`**
- 继承 `BaseMapper<User>`
- 自定义方法：`selectByUsername(String username)` → 通过用户名查用户（XML 或注解）

**`ConversationMapper`**
- 继承 `BaseMapper<Conversation>`
- 自定义：`selectByUserId(String userId, PageParam page)` → 分页查询用户会话列表

**`MessageMapper`**
- 继承 `BaseMapper<Message>`
- 自定义：`selectByConversationId(String conversationId, int limit)` → 查询最近 N 条消息（用于构建历史上下文）

**`TaskMapper`**
- 继承 `BaseMapper<Task>`
- 自定义：`selectByUserIdAndStatus(String userId, TaskStatus status, PageParam page)`

**`TaskStepMapper`**
- 继承 `BaseMapper<TaskStep>`
- 自定义：`selectByTaskId(String taskId)` → 查询任务的所有步骤（按 stepIndex 排序）

**`AgentTraceMapper`**
- 继承 `BaseMapper<AgentTrace>`
- 自定义：`selectByTaskId(String taskId)` → 查询任务的完整 Trace 日志

**`DocumentMapper`**
- 继承 `BaseMapper<Document>`
- 自定义：`selectByKnowledgeBaseId(String kbId, PageParam page)`

#### 4.2.10 common 包 — 通用工具

**`GlobalExceptionHandler`**
- 使用 `@RestControllerAdvice`
- 处理：`MethodArgumentNotValidException`（参数校验失败）、`BusinessException`（业务异常）、`AuthenticationException`（认证异常）、`AccessDeniedException`（权限异常）、`StatusRuntimeException`（gRPC 异常）、`Exception`（兜底）
- 统一返回 `ApiResponse` 格式

**`BusinessException`**
- 自定义业务异常，携带错误码枚举 `ErrorCode`

**`ErrorCode` 枚举**
- 定义所有业务错误码，如：`USER_NOT_FOUND(1001)`、`CONVERSATION_NOT_FOUND(2001)`、`AGENT_SERVICE_UNAVAILABLE(5001)`

**`PageResult<T>`**
- 分页结果包装类：total、pageNum、pageSize、list

**`RedisKeyConstants`**
- 所有 Redis Key 的常量定义，如：`REFRESH_TOKEN_PREFIX`、`CONVERSATION_HISTORY_PREFIX`、`USER_SESSION_PREFIX`

**`SnowflakeIdGenerator`**
- 基于雪花算法的 ID 生成器（或直接使用 `cn.hutool.core.lang.Snowflake`）

**`DateTimeUtils`**
- 时间工具类

### 4.3 配置文件设计（application.yml）

**分环境配置结构：**

```
src/main/resources/
├── application.yml          # 公共配置
├── application-dev.yml      # 开发环境
├── application-prod.yml     # 生产环境
└── application-test.yml     # 测试环境
```

**公共配置（application.yml）关键项：**

```yaml
server:
  port: 8080
  servlet:
    context-path: /

spring:
  application:
    name: autoagent-backend
  profiles:
    active: dev  # 默认激活 dev

# JWT 配置（实际密钥通过环境变量注入）
jwt:
  secret: ${JWT_SECRET:default-dev-secret-change-in-prod}
  expiration: 7200        # Access Token 2小时，单位秒
  refresh-expiration: 604800  # Refresh Token 7天

# gRPC 客户端配置（net.devh）
grpc:
  client:
    agent-python:
      address: static://${PYTHON_AGENT_HOST:localhost}:${PYTHON_AGENT_PORT:50051}
      negotiation-type: plaintext
      deadline: 60000  # 60秒超时

# MinIO 配置
minio:
  endpoint: ${MINIO_ENDPOINT:http://localhost:9000}
  access-key: ${MINIO_ACCESS_KEY:minioadmin}
  secret-key: ${MINIO_SECRET_KEY:minioadmin}
  default-bucket: autoagent-files

# Resilience4j 熔断配置
resilience4j:
  circuitbreaker:
    instances:
      agent-python-cb:
        failure-rate-threshold: 50
        slow-call-rate-threshold: 80
        slow-call-duration-threshold: 30s
        wait-duration-in-open-state: 30s
        permitted-number-of-calls-in-half-open-state: 3
  ratelimiter:
    instances:
      api-rate-limiter:
        limit-for-period: 100
        limit-refresh-period: 1s

# MyBatis Plus 配置
mybatis-plus:
  mapper-locations: classpath*:mapper/**/*.xml
  type-aliases-package: com.autoagent.domain.entity
  global-config:
    db-config:
      id-type: ASSIGN_ID   # 使用雪花算法
      logic-delete-field: isDeleted
      logic-delete-value: 1
      logic-not-delete-value: 0
```

---

## 5. Python Agent 服务详细设计

### 5.1 依赖管理（pyproject.toml）

**核心依赖：**

```toml
[tool.poetry.dependencies]
python = "^3.11"

# Web 框架
fastapi = "^0.111"
uvicorn = {extras = ["standard"], version = "^0.29"}
pydantic = "^2.7"
pydantic-settings = "^2.2"

# gRPC
grpcio = "^1.63"
grpcio-tools = "^1.63"
protobuf = "^4.25"

# LangChain & LangGraph（核心！）
langchain = "^0.2"
langchain-openai = "^0.1"
langchain-community = "^0.2"
langgraph = "^0.1"

# 向量数据库
chromadb = "^0.5"
# pymilvus = "^2.4"  # 生产环境

# Kafka
aiokafka = "^0.11"   # 异步 Kafka 客户端

# RAG 工具
pypdf = "^4.2"
python-docx = "^1.1"
unstructured = "^0.14"   # 文档解析
tiktoken = "^0.7"    # Token 计数

# 工具相关
httpx = "^0.27"      # HTTP 工具
docker = "^7.0"      # 代码沙箱（Docker SDK）
python-minio = "^7.2"   # MinIO 客户端

# 监控
prometheus-client = "^0.20"
opentelemetry-sdk = "^1.24"

# 工具
python-dotenv = "^1.0"
structlog = "^24.1"   # 结构化日志
tenacity = "^8.3"     # 重试
```

### 5.2 应用入口与启动流程

**`app/main.py`**

职责：FastAPI 应用创建与生命周期管理

启动流程：
1. 加载配置（`app/config/settings.py`）
2. 初始化日志
3. 初始化 LLM 连接（验证 API Key 可用）
4. 初始化向量数据库连接
5. 初始化 gRPC Server（在独立线程中启动）
6. 初始化 Kafka Consumer（在后台任务中启动）
7. 注册 FastAPI 路由（健康检查、内部管理接口）
8. 注册 Prometheus 指标端点

**`app/config/settings.py`**

使用 Pydantic `BaseSettings`，从环境变量和 `.env` 文件读取：

```python
# 关键配置项（类型标注示意）
class Settings(BaseSettings):
    # LLM
    openai_api_key: str
    openai_base_url: str = "https://api.openai.com/v1"
    default_model: str = "gpt-4o"
    embedding_model: str = "text-embedding-3-small"
    
    # 本地 LLM（可选）
    ollama_base_url: str = "http://localhost:11434"
    use_local_llm: bool = False
    
    # 向量数据库
    chroma_host: str = "localhost"
    chroma_port: int = 8100
    
    # Kafka
    kafka_bootstrap_servers: str = "localhost:9092"
    kafka_consumer_group: str = "autoagent-python-group"
    
    # gRPC
    grpc_port: int = 50051
    
    # MinIO
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str
    minio_secret_key: str
    
    # Agent 行为
    max_iterations: int = 10  # Agent 最大推理步数，防止死循环
    max_tokens_per_call: int = 4000
    temperature: float = 0.7
    
    class Config:
        env_file = ".env"
```

### 5.3 LLM 统一接口层

**`app/llm/llm_factory.py`**

职责：根据配置创建 LLM 实例，屏蔽具体 LLM 实现

方法：
- `get_llm(model_name: str = None, temperature: float = None) -> BaseChatModel` → 返回 LangChain `BaseChatModel` 实例
  - 若 `use_local_llm=True`，返回 `ChatOllama`
  - 否则返回 `ChatOpenAI`（支持 Azure OpenAI，通过 base_url 切换）
- `get_embedding_model() -> Embeddings` → 返回 Embedding 模型实例

**`app/llm/token_counter.py`**

职责：Token 计数与成本估算

方法：
- `count_tokens(text: str, model: str) -> int` → 使用 `tiktoken` 计算 Token 数
- `estimate_cost(input_tokens: int, output_tokens: int, model: str) -> float` → 估算调用成本

### 5.4 Agent 核心设计（LangGraph）

#### 5.4.1 LangGraph 核心概念

LangGraph 基于**有向状态图**构建 Agent：
- **State**：贯穿整个工作流的共享状态（TypedDict）
- **Node**：图中的处理节点，是普通的 Python 函数
- **Edge**：节点之间的连接，可以是条件边
- **Graph**：将 Node 和 Edge 组合，编译后得到可执行的 Agent

#### 5.4.2 共享状态定义

**`app/agent/state.py`**

```python
# AgentState — 多 Agent 系统共享状态
# 字段说明（TypedDict）：
# - messages: List[BaseMessage]  → 对话历史（使用 add_messages reducer）
# - task_id: str                 → 任务 ID
# - user_id: str                 → 用户 ID
# - task_type: str               → 任务类型（CHAT/WORKFLOW/VECTORIZE）
# - input_params: dict           → 输入参数
# - knowledge_base_ids: List[str]→ 关联知识库 ID 列表
# - current_agent: str           → 当前执行的子 Agent 名称
# - agent_outputs: dict          → 各子 Agent 的输出结果
# - tool_calls: List[dict]       → 工具调用记录
# - pending_approval: Optional[dict] → 等待审批的操作（Human-in-the-loop）
# - error: Optional[str]         → 错误信息
# - is_finished: bool            → 是否完成
# - metadata: dict               → 元数据（token 消耗、耗时等）
```

#### 5.4.3 Supervisor Agent（总控）

**`app/agent/supervisor/supervisor.py`**

职责：接收任务，分析任务复杂度，决定调用哪个子 Agent，合并结果

`SupervisorAgent` 类：
- `__init__(self, llm, available_agents: List[str])` → 初始化，配置可用的子 Agent 列表
- `create_graph(self) -> CompiledGraph` → 创建并编译 LangGraph 工作流

Supervisor 图的节点：
1. `route_task` 节点：根据 task_type 路由到对应子 Agent
2. `aggregate_results` 节点：合并子 Agent 的输出，生成最终回复
3. `handle_error` 节点：错误处理，记录错误并返回友好提示

条件路由逻辑（`route_after_supervisor`函数）：
- 若 `state.task_type == "CHAT"` → 路由到 `chat_agent`
- 若 `state.task_type == "WORKFLOW"` → 路由到 `workflow_agent`
- 若 `state.task_type == "VECTORIZE"` → 路由到 `vectorize_agent`
- 若 `state.pending_approval` → 路由到 `END`（等待人工审批）
- 若 `state.is_finished` → 路由到 `END`

#### 5.4.4 Chat Agent（对话智能体）

**`app/agent/nodes/chat_node.py`**

职责：处理普通对话，支持 RAG 检索增强、工具调用

`chat_node(state: AgentState) -> AgentState` 函数：

1. 从 state 中提取对话历史和用户最新消息
2. 若关联了知识库，调用 `RagService.retrieve()` 检索相关文档块
3. 构建 System Prompt（注入检索到的上下文、当前时间、用户信息）
4. 创建绑定了工具的 LLM（`llm.bind_tools(tools)`）
5. 调用 LLM
6. 若 LLM 返回 tool_call，执行工具（使用 LangGraph 的 `ToolNode`）
7. 将工具结果加入消息历史，再次调用 LLM
8. 返回更新后的 state

绑定的工具列表（基础对话 Agent）：
- `WebSearchTool`（联网搜索）
- `CalculatorTool`（计算）

#### 5.4.5 Workflow Agent（工作流智能体）

**`app/agent/nodes/workflow_node.py`**

职责：执行复杂多步骤任务，支持并行子任务

`WorkflowAgent` 类：
- 内部维护一个 LangGraph 子图
- 子图节点：`plan` → `execute_steps` → `check_approval` → `aggregate` → END
- `plan` 节点：调用 LLM 将复杂任务拆解为有序步骤列表（JSON 格式）
- `execute_steps` 节点：
  - 遍历步骤列表
  - 每步调用对应工具或子 Agent
  - 每步执行完发送进度消息到 Kafka（通过 `KafkaProducerService`）
  - 若某步骤标记为 `requires_approval=True`，发送 Human-in-the-loop 消息并暂停
- `check_approval` 节点：轮询审批状态（或通过外部中断机制）
- `aggregate` 节点：汇总所有步骤结果，生成最终报告

支持的工具列表（工作流 Agent）：
- 全部基础工具
- `CodeExecutionTool`（代码沙箱执行）
- `FileReadTool`、`FileWriteTool`
- `EmailSendTool`
- 自定义 MCP 工具

#### 5.4.6 Vectorize Agent（文档向量化智能体）

**`app/agent/nodes/vectorize_node.py`**

`vectorize_node(state: AgentState) -> AgentState` 函数：

1. 从 state.input_params 获取 docId 和文件 URL
2. 从 MinIO 下载文档
3. 调用 `DocumentParser.parse()`，提取纯文本
4. 调用 `TextSplitter.split()`，切分为 chunks（默认 512 token，100 token 重叠）
5. 批量调用 Embedding 模型（批量大小 100）
6. 批量写入向量数据库
7. 发送完成消息到 Kafka（包含 docId、chunk 数量）
8. 更新 state 为完成

#### 5.4.7 LangGraph 工作流编译

**`app/agent/graph/main_graph.py`**

职责：将所有节点和边组合，编译为可执行的 Graph

```python
# 图结构描述（非代码）：
# 
# StateGraph(AgentState)
#   .add_node("supervisor", supervisor_node)
#   .add_node("chat_agent", chat_node)
#   .add_node("workflow_agent", workflow_node)
#   .add_node("vectorize_agent", vectorize_node)
#   .add_node("tools", ToolNode(all_tools))
#   .add_node("error_handler", error_handler_node)
# 
# 边：
#   START -> supervisor
#   supervisor -> (条件路由) -> chat_agent / workflow_agent / vectorize_agent
#   chat_agent -> tools (若有 tool_call)
#   tools -> chat_agent (继续对话)
#   chat_agent -> END (若无 tool_call)
#   workflow_agent -> END
#   vectorize_agent -> END
# 
# 编译时配置 Checkpointer（使用 MemorySaver 或自定义持久化 Checkpointer）
# Checkpointer 用于支持 Human-in-the-loop（中断后恢复执行）
```

**关于 Checkpointer（重要）：**

LangGraph 的 Checkpointer 是实现 Human-in-the-loop 的关键。每次节点执行后，状态被保存到 Checkpointer。当 Agent 触发审批节点时：
1. 抛出 `NodeInterrupt` 异常（LangGraph 内置）
2. 图执行暂停，状态保存到 Checkpointer
3. 人工审批后，调用 `graph.invoke(None, config, interrupt_before=None)` 从断点恢复

开发阶段使用 `MemorySaver`（内存）；生产阶段需实现基于 Redis 或 PostgreSQL 的持久化 Checkpointer。

### 5.5 工具集设计

**`app/tools/` 目录结构：**

```
tools/
├── __init__.py           # 工具注册与导出
├── base_tool.py          # 工具基类
├── web_search.py         # 联网搜索
├── code_executor.py      # 代码执行沙箱
├── file_tools.py         # 文件读写工具
├── calculator.py         # 计算器
├── email_tool.py         # 邮件发送
└── mcp/                  # MCP 自定义工具
    ├── mcp_client.py     # MCP 协议客户端
    └── custom_tools/     # 企业内部系统工具
```

**`BaseTool`（继承 LangChain `BaseTool`）**

所有工具必须实现的属性和方法：
- `name: str` → 工具名称（唯一标识，Agent 通过此名称选择工具）
- `description: str` → 工具功能描述（**非常重要**，LLM 通过此判断何时使用该工具）
- `args_schema: Type[BaseModel]` → 输入参数的 Pydantic Schema
- `_run(self, **kwargs) -> str` → 同步执行逻辑
- `_arun(self, **kwargs) -> str` → 异步执行逻辑

**`WebSearchTool`**
- 描述：搜索互联网获取最新信息，当需要实时数据、新闻、当前事件时使用
- 输入：`query: str`（搜索关键词）
- 实现：调用 Tavily Search API（或 SerpAPI），返回 Top 5 搜索结果摘要
- 返回格式：JSON 字符串，包含 title、url、snippet

**`CodeExecutorTool`**
- 描述：在安全沙箱中执行 Python 代码，用于数据分析、计算、文件处理
- 输入：`code: str`（Python 代码）、`timeout: int = 30`（超时秒数）
- 实现：
  1. 使用 Docker SDK 创建临时容器（`python:3.11-slim` 镜像）
  2. 将代码写入临时文件
  3. 在容器中执行，捕获 stdout/stderr
  4. 超时后强制停止容器
  5. 删除临时容器
- 安全限制：禁止网络访问（`--network none`），内存限制 256MB，只读文件系统（除 /tmp）
- 返回：执行输出或错误信息

**`FileReadTool`**
- 描述：从 MinIO 对象存储中读取文件内容，适合读取之前上传的文档
- 输入：`file_path: str`（MinIO 中的对象路径）
- 实现：调用 MinIO SDK 下载文件，支持 txt/csv/json 格式直接返回内容，其他格式返回下载链接

**`FileWriteTool`**
- 描述：将内容写入 MinIO 对象存储
- 输入：`content: str`、`file_name: str`、`content_type: str`
- 实现：将内容上传到 MinIO，返回访问 URL

**`EmailTool`**（需要人工审批）
- 描述：发送电子邮件，**此操作需要人工确认才能执行**
- 输入：`to: str`、`subject: str`、`body: str`
- 实现：
  1. 触发 Human-in-the-loop（设置 `state.pending_approval`）
  2. 等待人工审批
  3. 审批通过后，调用 SMTP 发送邮件
- 返回：发送成功/失败

**MCP 工具集成（`app/tools/mcp/`）**

MCP（Model Context Protocol）是 Anthropic 提出的工具调用标准协议。通过实现 MCP 接口，可以快速将企业内部系统封装为 Agent 可调用的工具。

`MCPClient` 类：
- 通过 HTTP 或 STDIO 连接 MCP Server
- `list_tools() -> List[MCPToolDef]` → 获取 MCP Server 暴露的工具列表
- `call_tool(tool_name: str, params: dict) -> str` → 调用指定工具

`MCPToolAdapter` 类：
- 将 MCP 工具定义适配为 LangChain `BaseTool`
- 自动根据 MCP 工具的 schema 生成 Pydantic 参数模型

### 5.6 RAG 模块设计

**`app/rag/` 目录：**

```
rag/
├── document_parser.py     # 文档解析
├── text_splitter.py       # 文本切分
├── embedding_service.py   # Embedding 服务
├── vector_store.py        # 向量数据库封装
└── rag_service.py         # RAG 主服务（组合上述模块）
```

**`DocumentParser`**

方法：`parse(file_path: str, file_type: str) -> List[Document]`

支持文件类型与解析方式：
- `.pdf` → 使用 `pypdf` 或 `unstructured`，按页分割
- `.docx` → 使用 `python-docx`，提取段落
- `.txt` / `.md` → 直接读取
- `.csv` → 转换为 Markdown 表格格式（便于 LLM 理解）
- `.html` → 使用 `BeautifulSoup` 提取正文

每个解析结果包含：
- `page_content: str`（文本内容）
- `metadata: dict`（docId、知识库 ID、文件名、页码/段落序号、创建时间）

**`SmartTextSplitter`**

职责：将长文档切分为合适大小的 chunk，同时保持语义完整性

配置参数（从 settings 读取）：
- `chunk_size: int = 512`（每个 chunk 的最大 token 数）
- `chunk_overlap: int = 100`（相邻 chunk 重叠 token 数，保证上下文连续性）
- `separators: List[str]`（按优先级：`\n\n` → `\n` → `. ` → ` `）

使用 LangChain 的 `RecursiveCharacterTextSplitter`，配置 `length_function=tiktoken_length`（基于 Token 计数而非字符数）。

**`EmbeddingService`**

职责：批量生成文本的向量表示

方法：
- `embed_texts(texts: List[str], batch_size: int = 100) -> List[List[float]]` → 批量 Embedding，控制并发请求速率（rate limit）
- `embed_query(query: str) -> List[float]` → 单个 query 的 Embedding（检索时使用）

注意：Embedding 调用有 API 限流，需使用 `tenacity` 实现指数退避重试。

**`VectorStoreService`**

职责：封装向量数据库操作，屏蔽 ChromaDB / Milvus 差异

方法：
- `create_collection(collection_name: str, dimension: int)` → 创建集合（知识库对应一个 collection）
- `upsert(collection_name: str, ids: List[str], embeddings: List[List[float]], documents: List[str], metadatas: List[dict])` → 批量插入/更新
- `query(collection_name: str, query_embedding: List[float], top_k: int = 5, filter: dict = None) -> List[RetrievedDocument]` → 向量相似度检索
- `delete(collection_name: str, ids: List[str])` → 删除文档向量
- `delete_collection(collection_name: str)` → 删除整个集合（删除知识库时调用）

**`RagService`**（核心 RAG 流程）

方法：
- `retrieve(query: str, knowledge_base_ids: List[str], top_k: int = 5) -> List[RetrievedDocument]`
  1. 对 query 做 Embedding
  2. 在指定知识库的 collection 中并行检索（asyncio.gather）
  3. 合并结果，按相似度分数排序，去重
  4. 过滤低分结果（相似度 < 0.5 的丢弃）
  5. 返回 Top-K 结果（含原文和来源信息）
- `format_context(retrieved_docs: List[RetrievedDocument]) -> str` → 将检索结果格式化为注入 Prompt 的上下文字符串，附带来源引用

**Prompt 模板（RAG System Prompt）：**

```
你是一个专业的企业知识助手。回答问题时，请优先基于以下参考资料：

[参考资料]
{context}

[要求]
1. 答案必须基于参考资料，如果资料不足，明确说明
2. 在回答末尾标注引用来源（文档名 + 页码）
3. 用中文回答，专业、简洁

当前时间：{current_time}
用户信息：{user_info}
```

### 5.7 记忆模块设计

**`app/memory/` 目录：**

```
memory/
├── short_term_memory.py   # 短期对话记忆
├── long_term_memory.py    # 长期用户画像记忆
└── memory_manager.py      # 记忆管理器（组合）
```

**短期记忆（Short-term Memory）**

- 存储：Redis List，key = `memory:short:{userId}:{conversationId}`
- 内容：最近 20 条对话（Human + AI 消息对）
- 格式：JSON 序列化的 `BaseMessage` 列表
- TTL：7天（会话不活跃自动清理）
- 方法：
  - `add_messages(userId, conversationId, messages: List[BaseMessage])` → 追加消息，超出 20 条时 LPOP 最旧的
  - `get_messages(userId, conversationId) -> List[BaseMessage]` → 读取历史
  - `clear(userId, conversationId)` → 清空

**长期记忆（Long-term Memory）**

- 存储：向量数据库（独立 collection：`user_memory_{userId}`）
- 内容：从对话中提取的用户偏好、知识背景、重要事实
- 更新时机：每次对话结束后，异步调用 LLM 提取记忆摘要，向量化存储
- 检索时机：新会话开始时，用当前问题检索相关长期记忆，注入 System Prompt

`LongTermMemoryExtractor`：
- `extract(messages: List[BaseMessage]) -> List[MemoryItem]` → 调用 LLM，提取对话中值得记住的信息点
  - Prompt 指引 LLM 只提取：用户姓名/角色、技术偏好、重要约束、已完成的事项
  - 返回结构化的记忆列表（每条记忆含内容、重要度分级）

### 5.8 gRPC Server 设计

**`app/grpc_server/` 目录：**

```
grpc_server/
├── server.py              # gRPC Server 启动
├── agent_servicer.py      # AgentService 实现
└── interceptors.py        # gRPC 拦截器（日志、认证）
```

**`AgentServicer`（实现 proto 定义的 AgentService）**

方法（与 .proto 定义对应）：

- `Chat(request, context)` → 同步对话接口
  1. 将 gRPC Request 转换为 `AgentState`
  2. 调用 compiled_graph.invoke()
  3. 从最终 state 提取回复消息
  4. 构建 gRPC Response 返回

- `ChatStream(request, context)` → 流式对话接口
  1. 使用 `graph.astream()` 异步流式执行
  2. 每收到一个 LLM token，yield 一个 `ChatChunk` gRPC 消息
  3. 最后 yield 一个 `is_finish=True` 的消息

- `ExecuteTask(request, context)` → 异步任务执行（Kafka 模式下不常用此接口）
  1. 在后台启动 asyncio 任务
  2. 立即返回 taskId
  3. 任务进度/结果通过 Kafka 发送

- `VectorizeDocument(request, context)` → 文档向量化
  1. 下载文件
  2. 解析、切分、Embedding
  3. 存入向量数据库
  4. 返回成功状态和 chunk 数量

- `QueryKnowledgeBase(request, context)` → 知识库查询
  1. 调用 `RagService.retrieve()`
  2. 格式化检索结果
  3. 返回

**`LoggingInterceptor`**
- 记录每次 gRPC 调用的方法名、耗时、状态码

### 5.9 Kafka 消费者设计（Python 侧）

**`app/kafka/consumer.py`**

使用 `aiokafka`（异步）消费 `agent.task.input` Topic：

处理流程：
1. 消费到消息后，解析 `TaskInputMessage`
2. 根据 `task_type` 分发：
   - `CHAT` → 调用 graph，结果发到 `agent.task.result`
   - `WORKFLOW` → 启动 workflow_agent，进度实时发到 `agent.task.progress`
   - `VECTORIZE_DOC` → 调用 vectorize_node，完成后发结果
3. 执行过程中异常 → 发送到 `agent.task.result`（success=false）
4. 手动 commit offset

**`app/kafka/producer.py`**

职责：发送进度和结果消息回 Spring Boot 侧

方法：
- `send_progress(task_id: str, progress: TaskProgressMessage)` → 发送进度
- `send_result(task_id: str, result: TaskResultMessage)` → 发送结果
- `send_human_approval_needed(task_id: str, msg: HumanApprovalMessage)` → 发送审批请求

---

## 6. 两服务通信设计（gRPC + Kafka）

### 6.1 Proto 文件定义

**文件路径**：`proto/agent_service.proto`

```protobuf
syntax = "proto3";

package autoagent;

option java_multiple_files = true;
option java_package = "com.autoagent.grpc";
option java_outer_classname = "AgentServiceProto";

// ====================== 消息定义 ======================

message ChatRequest {
  string user_id = 1;
  string conversation_id = 2;
  string message = 3;
  repeated string knowledge_base_ids = 4;
  repeated HistoryMessage history = 5;  // 最近 N 条历史
  string agent_config_id = 6;
  map<string, string> metadata = 7;
}

message HistoryMessage {
  string role = 1;  // "human" 或 "ai"
  string content = 2;
  int64 timestamp = 3;
}

message ChatResponse {
  string message_id = 1;
  string content = 2;
  repeated SourceReference sources = 3;  // RAG 引用来源
  int32 input_tokens = 4;
  int32 output_tokens = 5;
  int64 duration_ms = 6;
}

message ChatChunk {
  string chunk_id = 1;
  string content = 2;   // 每次 LLM 输出的 token 片段
  bool is_finish = 3;
  string finish_reason = 4;  // "stop" / "tool_call" / "error"
}

message SourceReference {
  string document_name = 1;
  string chunk_content = 2;
  float similarity_score = 3;
  string document_id = 4;
  int32 page_number = 5;
}

message VectorizeRequest {
  string doc_id = 1;
  string knowledge_base_id = 2;
  string file_url = 3;       // MinIO 文件 URL
  string file_type = 4;      // pdf/docx/txt
  string file_name = 5;
}

message VectorizeResponse {
  bool success = 1;
  int32 chunk_count = 2;
  string error_message = 3;
}

message QueryRequest {
  string query = 1;
  repeated string knowledge_base_ids = 2;
  int32 top_k = 3;
}

message QueryResponse {
  repeated SourceReference results = 1;
}

// ====================== 服务定义 ======================

service AgentService {
  // 同步对话（短任务）
  rpc Chat(ChatRequest) returns (ChatResponse);
  
  // 流式对话（SSE 场景）
  rpc ChatStream(ChatRequest) returns (stream ChatChunk);
  
  // 文档向量化
  rpc VectorizeDocument(VectorizeRequest) returns (VectorizeResponse);
  
  // 知识库查询
  rpc QueryKnowledgeBase(QueryRequest) returns (QueryResponse);
  
  // 健康检查
  rpc HealthCheck(google.protobuf.Empty) returns (HealthResponse);
}

message HealthResponse {
  bool healthy = 1;
  string version = 2;
}
```

### 6.2 Kafka 消息格式规范

所有 Kafka 消息使用 JSON 格式，包含统一的 `messageType` 字段便于路由。

**`agent.task.input` Topic 消息格式：**

```json
{
  "messageType": "TASK_INPUT",
  "taskId": "uuid",
  "taskType": "WORKFLOW",
  "userId": "uuid",
  "knowledgeBaseIds": ["kb-1", "kb-2"],
  "inputParams": {
    "description": "帮我搜集最新的 AI 新闻并生成周报",
    "output_format": "markdown",
    "send_email": true,
    "email_recipients": ["xxx@company.com"]
  },
  "agentConfigId": "default",
  "timestamp": 1717000000000
}
```

**`agent.task.progress` Topic 消息格式：**

```json
{
  "messageType": "TASK_PROGRESS",
  "taskId": "uuid",
  "stepName": "联网搜索",
  "stepIndex": 2,
  "totalSteps": 5,
  "content": "正在搜索过去 7 天的 AI 新闻...",
  "toolName": "web_search",
  "toolInput": {"query": "AI news past 7 days"},
  "toolOutput": "找到 15 篇相关文章",
  "status": "RUNNING",
  "timestamp": 1717000005000
}
```

**`agent.task.result` Topic 消息格式：**

```json
{
  "messageType": "TASK_RESULT",
  "taskId": "uuid",
  "success": true,
  "result": "# AI 周报\n\n## 本周重要进展\n...",
  "errorMessage": null,
  "totalInputTokens": 8500,
  "totalOutputTokens": 1200,
  "durationMs": 45000,
  "timestamp": 1717000050000
}
```

**`agent.task.humanhit` Topic 消息格式：**

```json
{
  "messageType": "HUMAN_APPROVAL_NEEDED",
  "taskId": "uuid",
  "approvalId": "uuid",
  "actionType": "SEND_EMAIL",
  "actionDescription": "Agent 即将发送邮件给以下收件人：xxx@company.com",
  "actionContext": {
    "to": "xxx@company.com",
    "subject": "AI 周报 - 2024年第22周",
    "bodyPreview": "邮件正文前200字..."
  },
  "waitTimeoutMs": 300000,
  "timestamp": 1717000040000
}
```

### 6.3 gRPC 代码生成流程

**Java 侧（Maven Plugin）：**

pom.xml 中配置 `protobuf-maven-plugin`：
- 插件会自动下载 `protoc` 编译器
- 执行 `mvn generate-sources` 命令
- 在 `target/generated-sources/protobuf/` 生成 Java 类
- 需要将此目录添加为 Source Root

**Python 侧：**

执行命令：
```bash
python -m grpc_tools.protoc \
  -I./proto \
  --python_out=./app/grpc_server/generated \
  --grpc_python_out=./app/grpc_server/generated \
  ./proto/agent_service.proto
```

建议将此命令写入 `Makefile` 的 `proto` 目标，每次 proto 文件变更后执行。

---

## 7. 数据库设计

### 7.1 MySQL 表设计

#### `t_user` 用户表

```sql
CREATE TABLE t_user (
  id            BIGINT       NOT NULL COMMENT '雪花 ID',
  username      VARCHAR(50)  NOT NULL COMMENT '用户名',
  password      VARCHAR(100) NOT NULL COMMENT 'BCrypt 加密密码',
  email         VARCHAR(100) COMMENT '邮箱',
  nickname      VARCHAR(50)  COMMENT '昵称',
  avatar_url    VARCHAR(500) COMMENT '头像 URL',
  role          VARCHAR(20)  NOT NULL DEFAULT 'USER' COMMENT 'USER/ADMIN',
  status        TINYINT      NOT NULL DEFAULT 1 COMMENT '1=正常, 0=禁用',
  last_login_at DATETIME     COMMENT '最后登录时间',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted    TINYINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uk_username (username),
  UNIQUE KEY uk_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
```

#### `t_conversation` 会话表

```sql
CREATE TABLE t_conversation (
  id                 BIGINT       NOT NULL,
  user_id            BIGINT       NOT NULL COMMENT '所属用户',
  title              VARCHAR(200) COMMENT '会话标题（自动提取或用户命名）',
  agent_config_id    VARCHAR(50)  COMMENT '使用的 Agent 配置',
  knowledge_base_ids VARCHAR(500) COMMENT '关联知识库 ID，逗号分隔',
  message_count      INT          NOT NULL DEFAULT 0 COMMENT '消息数量',
  last_message_at    DATETIME     COMMENT '最后消息时间',
  created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted         TINYINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_user_id (user_id),
  KEY idx_last_message_at (last_message_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对话会话表';
```

#### `t_message` 消息表

```sql
CREATE TABLE t_message (
  id              BIGINT       NOT NULL,
  conversation_id BIGINT       NOT NULL COMMENT '所属会话',
  user_id         BIGINT       NOT NULL COMMENT '所属用户',
  role            VARCHAR(20)  NOT NULL COMMENT 'USER/ASSISTANT/SYSTEM',
  content         LONGTEXT     NOT NULL COMMENT '消息内容',
  content_type    VARCHAR(20)  NOT NULL DEFAULT 'TEXT' COMMENT 'TEXT/IMAGE/FILE',
  sources         JSON         COMMENT 'RAG 引用来源（JSON 数组）',
  input_tokens    INT          COMMENT 'LLM 输入 Token 数',
  output_tokens   INT          COMMENT 'LLM 输出 Token 数',
  duration_ms     INT          COMMENT '响应耗时毫秒',
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_deleted      TINYINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_conversation_id (conversation_id),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对话消息表';
```

#### `t_task` 任务表

```sql
CREATE TABLE t_task (
  id              BIGINT       NOT NULL,
  user_id         BIGINT       NOT NULL COMMENT '创建用户',
  title           VARCHAR(200) NOT NULL COMMENT '任务标题',
  task_type       VARCHAR(50)  NOT NULL COMMENT 'WORKFLOW/VECTORIZE/etc',
  status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING' 
                               COMMENT 'PENDING/RUNNING/AWAITING_APPROVAL/COMPLETED/FAILED/CANCELLED',
  input_params    JSON         COMMENT '任务输入参数',
  result          LONGTEXT     COMMENT '任务最终结果',
  error_message   VARCHAR(1000)COMMENT '错误信息',
  knowledge_base_ids VARCHAR(500) COMMENT '关联知识库',
  agent_config_id VARCHAR(50),
  total_input_tokens  INT      COMMENT '总输入 Token',
  total_output_tokens INT      COMMENT '总输出 Token',
  started_at      DATETIME     COMMENT '开始执行时间',
  finished_at     DATETIME     COMMENT '完成时间',
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted      TINYINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_user_id (user_id),
  KEY idx_status (status),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Agent 任务表';
```

#### `t_task_step` 任务步骤表

```sql
CREATE TABLE t_task_step (
  id            BIGINT       NOT NULL,
  task_id       BIGINT       NOT NULL COMMENT '所属任务',
  step_index    INT          NOT NULL COMMENT '步骤序号，从 1 开始',
  step_name     VARCHAR(100) COMMENT '步骤名称',
  status        VARCHAR(20)  NOT NULL DEFAULT 'PENDING' 
                             COMMENT 'PENDING/RUNNING/COMPLETED/FAILED/SKIPPED',
  tool_name     VARCHAR(100) COMMENT '调用的工具名称',
  tool_input    JSON         COMMENT '工具输入参数',
  tool_output   LONGTEXT     COMMENT '工具输出结果',
  error_message VARCHAR(500),
  started_at    DATETIME,
  finished_at   DATETIME,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_task_id (task_id),
  KEY idx_task_step (task_id, step_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='任务步骤记录表';
```

#### `t_agent_trace` Agent 推理链路表

```sql
CREATE TABLE t_agent_trace (
  id            BIGINT       NOT NULL,
  task_id       BIGINT       COMMENT '关联任务 ID（长任务）',
  message_id    BIGINT       COMMENT '关联消息 ID（对话）',
  trace_type    VARCHAR(50)  COMMENT 'THOUGHT/ACTION/OBSERVATION/FINAL_ANSWER',
  agent_name    VARCHAR(100) COMMENT '执行的 Agent 节点名',
  content       LONGTEXT     COMMENT 'Trace 内容（LLM 思考过程/工具调用/工具结果）',
  sequence      INT          COMMENT '在当次执行中的顺序',
  tokens        INT          COMMENT '本步骤消耗 Token',
  duration_ms   INT          COMMENT '本步骤耗时',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_task_id (task_id),
  KEY idx_message_id (message_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Agent 推理链路日志';
```

#### `t_knowledge_base` 知识库表

```sql
CREATE TABLE t_knowledge_base (
  id               BIGINT       NOT NULL,
  user_id          BIGINT       NOT NULL COMMENT '创建用户',
  name             VARCHAR(100) NOT NULL COMMENT '知识库名称',
  description      VARCHAR(500) COMMENT '描述',
  embedding_model  VARCHAR(100) NOT NULL DEFAULT 'text-embedding-3-small' COMMENT '使用的 Embedding 模型',
  chunk_size       INT          NOT NULL DEFAULT 512,
  chunk_overlap    INT          NOT NULL DEFAULT 100,
  document_count   INT          NOT NULL DEFAULT 0,
  total_chunks     INT          NOT NULL DEFAULT 0,
  status           VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE/INACTIVE',
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted       TINYINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='知识库表';
```

#### `t_document` 文档表

```sql
CREATE TABLE t_document (
  id               BIGINT       NOT NULL,
  knowledge_base_id BIGINT      NOT NULL COMMENT '所属知识库',
  user_id          BIGINT       NOT NULL COMMENT '上传用户',
  file_name        VARCHAR(200) NOT NULL COMMENT '原始文件名',
  file_type        VARCHAR(20)  NOT NULL COMMENT 'pdf/docx/txt/csv',
  file_size        BIGINT       NOT NULL COMMENT '文件大小（字节）',
  minio_path       VARCHAR(500) NOT NULL COMMENT 'MinIO 对象路径',
  status           VARCHAR(20)  NOT NULL DEFAULT 'PROCESSING' 
                               COMMENT 'PROCESSING/COMPLETED/FAILED',
  chunk_count      INT          COMMENT '切分后的 chunk 数量',
  error_message    VARCHAR(500),
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted       TINYINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_knowledge_base_id (knowledge_base_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='知识库文档表';
```

#### `t_agent_config` Agent 配置表

```sql
CREATE TABLE t_agent_config (
  id              VARCHAR(50)  NOT NULL COMMENT '配置 ID（如 default, creative）',
  name            VARCHAR(100) NOT NULL COMMENT '配置名称',
  description     VARCHAR(500),
  llm_model       VARCHAR(100) NOT NULL DEFAULT 'gpt-4o' COMMENT '使用的 LLM 模型',
  temperature     DECIMAL(3,2) NOT NULL DEFAULT 0.70,
  max_iterations  INT          NOT NULL DEFAULT 10 COMMENT '最大推理步数',
  enabled_tools   JSON         COMMENT '启用的工具列表（JSON 数组）',
  system_prompt   LONGTEXT     COMMENT '自定义 System Prompt',
  is_default      TINYINT      NOT NULL DEFAULT 0,
  status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Agent 配置表';
```

### 7.2 Redis 数据结构设计

| Key 模式 | 数据类型 | TTL | 说明 |
|---|---|---|---|
| `refresh:{userId}` | String | 7天 | Refresh Token 存储 |
| `conv:history:{userId}:{conversationId}` | List | 7天 | 对话历史消息（JSON 序列化） |
| `ws:session:{sessionId}` | String | 1天 | WebSocket sessionId → userId 映射 |
| `task:approval:{approvalId}` | Hash | 5分钟 | 审批上下文缓存 |
| `rate:limit:{userId}` | String | 1分钟 | 用户请求频率计数 |
| `llm:cache:{queryHash}` | String | 1小时 | LLM 响应缓存（相同 query 复用） |

### 7.3 向量数据库 Collection 设计

每个知识库对应一个 ChromaDB Collection，命名规则：`kb_{knowledgeBaseId}`

Collection 字段：
- `id`：chunk 唯一 ID（`{docId}_chunk_{index}`）
- `embedding`：向量（维度取决于 Embedding 模型，text-embedding-3-small 为 1536 维）
- `document`：chunk 原文内容
- `metadata`：
  ```json
  {
    "doc_id": "uuid",
    "knowledge_base_id": "uuid",
    "file_name": "技术文档.pdf",
    "file_type": "pdf",
    "chunk_index": 3,
    "page_number": 2,
    "created_at": "2024-06-01T10:00:00Z"
  }
  ```

---

## 8. 前端设计概要

### 8.1 技术栈

| 技术 | 版本 | 说明 |
|---|---|---|
| React | 18.x | UI 框架 |
| TypeScript | 5.x | 类型安全 |
| Vite | 5.x | 构建工具 |
| React Router | 6.x | 路由 |
| Zustand | 4.x | 状态管理（轻量，适合中小型应用） |
| TanStack Query | 5.x | 服务端状态管理与缓存 |
| Axios | 1.x | HTTP 请求 |
| STOMP.js | 7.x | WebSocket STOMP 客户端 |
| Tailwind CSS | 3.x | 原子化 CSS |
| shadcn/ui | latest | 组件库（基于 Radix UI） |
| React Markdown | 9.x | Markdown 渲染 |
| Prism.js | 1.x | 代码高亮 |
| React Hot Toast | 2.x | 消息提示 |

### 8.2 页面结构

```
pages/
├── LoginPage              # 登录页
├── RegisterPage           # 注册页
├── ChatPage               # 对话主页（核心）
│   ├── ConversationList   # 左侧会话列表
│   ├── MessageArea        # 中间消息区
│   │   ├── MessageItem    # 单条消息（支持 Markdown 渲染）
│   │   └── SourceCard     # RAG 引用来源卡片
│   └── InputArea          # 底部输入框
├── TaskPage               # 工作流任务管理页
│   ├── TaskList           # 任务列表
│   ├── TaskDetail         # 任务详情（步骤进度）
│   └── ApprovalModal      # 人工审批弹窗
├── KnowledgeBasePage      # 知识库管理页
│   ├── KBList             # 知识库列表
│   ├── DocumentList       # 文档列表
│   └── UploadModal        # 文件上传弹窗
└── MonitorPage            # 监控页（管理员）
    └── TraceViewer        # Agent Trace 可视化
```

### 8.3 核心交互设计

**对话流式输出：**
1. 用户发送消息
2. 前端调用 `/api/conversations/{id}/messages` POST 接口
3. 响应为普通 JSON（短任务）或立即返回 taskId（长任务）
4. 短任务：直接展示返回内容
5. 长任务：建立 WebSocket 订阅 `/topic/task/{taskId}`，逐步展示进度

**Agent Trace 展示：**
- 消息右下角有"查看推理过程"按钮
- 点击展开侧边栏，展示：
  - 🤔 思考（Thought）
  - 🔧 调用工具（Action）
  - 📊 工具结果（Observation）
  - ✅ 最终回答（Final Answer）

**人工审批弹窗：**
- WebSocket 收到 `HUMAN_APPROVAL_NEEDED` 消息时，全局弹出审批对话框
- 展示 Agent 即将执行的操作描述和上下文
- 用户点击「允许」→ 调用 `/api/tasks/{taskId}/approve`
- 用户点击「拒绝」→ 调用 `/api/tasks/{taskId}/reject`
- 有倒计时（5分钟），超时自动拒绝

### 8.4 Zustand Store 设计

```
stores/
├── authStore.ts           # 用户认证状态（user, tokens, login/logout）
├── conversationStore.ts   # 当前会话列表和激活会话 ID
├── messageStore.ts        # 消息列表（按 conversationId 分组）
├── taskStore.ts           # 任务列表和任务详情
├── wsStore.ts             # WebSocket 连接状态和消息队列
└── uiStore.ts             # UI 状态（弹窗开关、加载状态）
```

---

## 9. 可观测性设计

### 9.1 日志规范

**Java 侧（Logback + SLF4J）：**

日志格式（JSON 结构化，便于 ELK 采集）：
```json
{
  "timestamp": "2024-06-01T10:00:00.000Z",
  "level": "INFO",
  "logger": "com.autoagent.service.AgentCallService",
  "traceId": "abc123",
  "userId": "uuid",
  "message": "gRPC call to Python agent succeeded",
  "duration": 1234
}
```

关键日志点：
- 每次 gRPC 调用：方法名、耗时、成功/失败
- 每次 Kafka 消息发送/消费：topic、offset、耗时
- 每次 JWT 验证失败：IP、userId（若有）
- 业务异常：完整 stacktrace

**Python 侧（structlog）：**

使用 structlog 的 JSON 渲染器，格式与 Java 侧一致，便于 ELK 统一处理。

关键日志点：
- 每次 LLM 调用：模型名、token 数、耗时、成功/失败
- 每次工具调用：工具名、输入、耗时
- 每次 Embedding 调用
- Agent 每步推理节点进入/退出

### 9.2 Prometheus 指标

**Java 侧（Micrometer，Spring Boot Actuator 自动暴露）：**

自定义指标：
- `agent_call_total`（Counter）：gRPC 调用总次数，标签：success=true/false
- `agent_call_duration_seconds`（Histogram）：gRPC 调用耗时
- `kafka_message_produced_total`（Counter）：Kafka 消息发送次数，标签：topic
- `active_websocket_connections`（Gauge）：当前 WebSocket 连接数
- `task_total`（Counter）：任务总数，标签：status（completed/failed）

**Python 侧（prometheus-client）：**

自定义指标：
- `llm_call_total`（Counter）：LLM 调用次数，标签：model、success
- `llm_call_duration_seconds`（Histogram）：LLM 调用耗时
- `llm_tokens_total`（Counter）：Token 消耗，标签：type（input/output）
- `tool_call_total`（Counter）：工具调用次数，标签：tool_name、success
- `embedding_call_total`（Counter）：Embedding 调用次数
- `vector_search_duration_seconds`（Histogram）：向量检索耗时

### 9.3 Grafana 监控大盘

创建以下 Dashboard Panel：

**系统总览 Dashboard：**
- 请求 QPS 折线图
- 平均响应时间（p50/p95/p99）
- 错误率
- 活跃 WebSocket 连接数

**AI Agent Dashboard：**
- LLM 调用频率与耗时
- Token 消耗趋势（每日/每周）
- 预估 API 成本
- 工具调用分布（饼图）
- Agent 成功/失败率

**基础设施 Dashboard：**
- JVM 内存使用
- GC 频率
- MySQL 连接池使用率
- Redis 内存使用
- Kafka 消费延迟（Consumer Lag）

### 9.4 OpenTelemetry Trace 集成

Spring Boot 侧：引入 `spring-boot-starter-actuator` + `micrometer-tracing-bridge-otel` + `opentelemetry-exporter-jaeger`

配置：自动为每次 HTTP 请求生成 Trace ID，并在 gRPC 调用时通过 Header 传播到 Python 侧

Python 侧：引入 `opentelemetry-sdk`，在 gRPC Server Interceptor 中提取 Trace ID，关联所有 LLM 调用和工具调用 Span

效果：从前端请求 → Spring Boot → gRPC → Python Agent → LLM 调用，全链路追踪，在 Jaeger UI 中可视化。

---

## 10. 部署方案

### 10.1 开发环境

**本地开发流程：**

1. 启动中间件（一键）：
   ```bash
   cd docker && docker-compose -f docker-compose-dev.yml up -d
   ```

2. 启动 Spring Boot：
   ```bash
   cd autoagent-backend && mvn spring-boot:run -Dspring-boot.run.profiles=dev
   ```

3. 启动 Python Agent：
   ```bash
   cd autoagent-python && poetry run uvicorn app.main:app --reload --port 8000
   ```
   （gRPC Server 在 main.py 中自动启动，监听 50051 端口）

4. 启动前端：
   ```bash
   cd autoagent-frontend && npm run dev
   ```

### 10.2 生产环境 Docker Compose

**`docker/docker-compose-prod.yml` 服务列表：**

```
services:
  mysql          # 挂载数据卷，开启 slow_query_log
  redis          # 开启持久化（RDB + AOF）
  kafka          # KRaft 模式
  minio          # 挂载数据卷
  milvus         # 生产向量数据库（替换 ChromaDB）
  autoagent-backend    # Spring Boot 镜像
  autoagent-python     # Python Agent 镜像
  autoagent-frontend   # Nginx + React 打包产物
  prometheus
  grafana
  elasticsearch  # ELK 日志
  logstash
  kibana
  nginx          # 反向代理（统一入口，SSL 终止）
```

**Nginx 配置要点：**
- `location /api` → 代理到 Spring Boot 8080
- `location /ws` → WebSocket 代理（需设置 `Upgrade` 和 `Connection` Header）
- `location /` → React 静态文件（try_files 支持 History Router）
- SSL 证书配置
- Gzip 压缩静态资源

### 10.3 Dockerfile 设计

**Spring Boot Dockerfile（多阶段构建）：**

```dockerfile
# 阶段1：Maven 构建
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline  # 预下载依赖，利用 Docker 缓存层
COPY src ./src
RUN mvn package -DskipTests

# 阶段2：运行镜像
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-Xms512m", "-Xmx1g", "-jar", "app.jar"]
```

**Python Dockerfile：**

```dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN pip install poetry
COPY pyproject.toml poetry.lock ./
RUN poetry install --no-dev --no-root
COPY app ./app
EXPOSE 8000 50051
CMD ["poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 10.4 环境变量管理

生产环境所有敏感配置通过环境变量注入（不写入代码和配置文件）：

```bash
# Spring Boot
JWT_SECRET=xxx
MYSQL_URL=jdbc:mysql://mysql:3306/autoagent
MYSQL_USER=xxx
MYSQL_PASSWORD=xxx
REDIS_HOST=redis
MINIO_ACCESS_KEY=xxx
MINIO_SECRET_KEY=xxx

# Python
OPENAI_API_KEY=sk-xxx
MINIO_ACCESS_KEY=xxx
MINIO_SECRET_KEY=xxx
KAFKA_BOOTSTRAP_SERVERS=kafka:9092
```

---

## 11. 开发顺序与里程碑

### 阶段一：基础设施搭建（第1-2周）

**目标：** 两个服务能启动，gRPC 通信正常

- [ ] 搭建 Spring Boot 项目骨架（包结构、Maven 依赖、配置文件）
- [ ] 搭建 Python 项目骨架（包结构、Poetry 依赖、settings）
- [ ] Docker Compose 中间件全部启动（MySQL、Redis、Kafka、MinIO、ChromaDB）
- [ ] 定义 .proto 文件，生成 Java 和 Python 代码
- [ ] 实现 Python gRPC Server，提供 HealthCheck 接口
- [ ] 实现 Java gRPC Client，调用 HealthCheck 确认连通
- [ ] Kafka 主题创建脚本
- [ ] 数据库建表脚本

**验收标准：** Spring Boot 启动成功，调用 `GET /actuator/health` 返回 UP，调用 Python HealthCheck 成功

---

### 阶段二：用户认证体系（第3周）

**目标：** 用户可以注册、登录，JWT 鉴权正常

- [ ] `t_user` 建表
- [ ] `AuthController` + `AuthService` + `UserMapper`
- [ ] `JwtTokenProvider` + `JwtAuthenticationFilter`
- [ ] `SecurityConfig` 配置白名单
- [ ] Redis Refresh Token 存储
- [ ] Postman 测试：注册 → 登录 → 拿 Token → 访问受保护接口

**验收标准：** 完整的注册登录流程，Token 过期后使用 Refresh Token 刷新成功

---

### 阶段三：基础对话功能（第4-5周）

**目标：** 用户能和 Agent 进行多轮对话，有记忆

- [ ] `t_conversation`、`t_message` 建表
- [ ] `ConversationController` + `ConversationService` + 相关 Mapper
- [ ] Python 侧：`LLMFactory`、`ShortTermMemory`（Redis）、基础 `chat_node`
- [ ] Python gRPC `Chat` 接口实现（不带 RAG，先跑通）
- [ ] Java `AgentCallService.callAgent()`，调用 gRPC，结果存库
- [ ] 前端：登录页 → 对话页（简单版）

**验收标准：** 前端能正常对话，刷新页面后历史消息不丢失，多轮对话有上下文记忆

---

### 阶段四：RAG 知识库（第6-7周）

**目标：** 上传文档，对话时自动检索增强

- [ ] `t_knowledge_base`、`t_document` 建表
- [ ] MinIO 配置和 `FileStorageService`
- [ ] `KnowledgeBaseController` + `KnowledgeBaseService`
- [ ] Python 侧：`DocumentParser`、`SmartTextSplitter`、`EmbeddingService`、`VectorStoreService`
- [ ] Python 侧：`vectorize_node` + Kafka 消费（触发向量化）
- [ ] Java 侧：文档上传 → Kafka 下发 → Python 向量化 → 结果回写 MySQL
- [ ] Python 侧：`RagService.retrieve()` + RAG Prompt 构建
- [ ] 对话时若关联知识库，自动检索并注入上下文

**验收标准：** 上传一份 PDF，提问文档中的内容，回答准确且有来源引用

---

### 阶段五：多 Agent 工作流（第8-9周）

**目标：** 复杂任务能拆解执行，进度实时推送，支持人工审批

- [ ] `t_task`、`t_task_step`、`t_agent_trace` 建表
- [ ] `TaskController` + `TaskService`
- [ ] Java 侧：`TaskMessageProducer`、`TaskProgressConsumer`、`TaskResultConsumer`
- [ ] Python 侧：`SupervisorAgent` + `WorkflowAgent` 基础骨架（LangGraph）
- [ ] Python 侧：工具集（WebSearchTool、CodeExecutorTool、FileTools）
- [ ] Python 侧：Kafka 消费 task.input，执行，发送 progress/result
- [ ] WebSocket 集成：前端订阅任务进度
- [ ] Human-in-the-loop：Python 触发审批 → Kafka → Java → WebSocket → 前端弹窗 → 用户决策 → Kafka → Python 恢复

**验收标准：** 创建工作流任务，前端实时看到步骤执行进度，邮件发送工具触发审批弹窗

---

### 阶段六：流式输出优化（第10周）

**目标：** 对话回复逐字流式显示，提升用户体验

- [ ] Python gRPC `ChatStream` 接口（AsyncGenerator + yield token）
- [ ] Java 侧流式 gRPC 调用，转为 SSE 或 WebSocket 推送
- [ ] 前端：消息逐字显示动效

**验收标准：** 发送消息后，回复内容逐字流式出现，体验接近 ChatGPT

---

### 阶段七：可观测性与优化（第11-12周）

**目标：** 项目生产可用，有监控，可 Debug

- [ ] Prometheus 自定义指标（Java + Python）
- [ ] Grafana Dashboard 配置
- [ ] ELK 日志集成（Logstash 采集容器日志）
- [ ] Resilience4j 熔断测试
- [ ] 限流测试
- [ ] Docker Compose 生产配置
- [ ] Swagger 文档完善
- [ ] Agent Trace 前端可视化（侧边栏展示推理过程）

**验收标准：** Grafana 能看到 LLM 调用成本、QPS、错误率；Kibana 能搜索日志；Python 服务下线时熔断生效，返回降级响应

---

## 附录：常见问题与注意事项

### A. gRPC 超时设置

gRPC 调用 LLM 可能耗时较长（尤其工作流任务）。建议：
- Chat 接口：60秒超时
- 文档向量化：300秒超时（大文件）
- Java 侧 `@GrpcClient` 注解配置 deadline

### B. LangGraph Checkpointer 选型

- 开发阶段：`MemorySaver`（内存，重启丢失）
- 生产阶段：自行实现 Redis Checkpointer 或使用 LangGraph Platform（商业方案）
- 简易生产方案：将 state 序列化后存 Redis，key = `graph:state:{task_id}`

### C. OpenAI API 限流处理

- 使用 `tenacity` 装饰所有 LLM 调用，指数退避重试
- 批量 Embedding 时控制并发（使用 `asyncio.Semaphore`，最大并发 10）
- 预估 Token 数，超过模型上下文窗口时截断历史消息（保留最新的）

### D. Docker 代码沙箱安全

- 每次代码执行创建新容器，执行完立即删除
- 容器资源限制：`--memory 256m --cpus 0.5`
- 网络隔离：`--network none`
- 文件系统只读（除 `/tmp`）：`--read-only --tmpfs /tmp`
- 执行用户：非 root（`--user nobody`）

### E. 向量数据库 ChromaDB → Milvus 迁移

两者通过 `VectorStoreService` 接口抽象，迁移时只需：
1. 实现 `MilvusVectorStoreService`
2. 修改 `settings.py` 中的 `vector_store_type`
3. 数据重新向量化（重新触发所有文档的向量化任务）

### F. 项目演示建议

在求职演示时，重点展示以下场景：

1. **场景一（RAG）：** 上传公司产品手册 PDF → 提问产品细节 → 展示带来源引用的准确回答
2. **场景二（工作流）：** 触发"竞品分析"工作流 → 展示 Agent 自动搜索、总结、生成报告的过程（重点展示 Trace 面板）
3. **场景三（Human-in-the-loop）：** 工作流包含发送邮件步骤 → 审批弹窗出现 → 用户确认 → 邮件发出
4. **场景四（监控）：** 展示 Grafana 大盘中的 LLM Token 消耗、响应时间、工具调用分布

---

*文档结束 — AutoAgent v1.0 设计文档*