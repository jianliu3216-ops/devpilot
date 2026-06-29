---
name: jit-project-knowledge-base
description: 扫描已有项目代码，生成 PROJECT_KNOWLEDGE_BASE.md，包含架构概览、模块字典、工具函数索引、可复用资产和重构建议。用于历史项目接入或构建项目私域知识库。
---

# 项目知识库构建（Project Knowledge Base Builder）

用于将“历史项目”快速沉淀为结构化文档 `PROJECT_KNOWLEDGE_BASE.md`，便于后续复用、评审与上手。

---

## 前期准备

执行本 Skill 前：
1. 读取同级目录 `reference.md` → 了解各表格的字段标准
2. 读取同级目录 `examples.md` → 了解最终输出的结构示例
3. **CodeGraph（若已安装则 MUST 执行）**：检测 `codegraph --version`；可用时在目标项目根目录执行 `codegraph build`，将 `.codegraph/` 产出作为 Phase 1–2 模块依赖分析的优先输入（见下方 Phase 0.2）

严格遵循 `reference.md` 的字段定义输出。

---

## 前置条件（必做）

开始前请先向用户确认/获取：

1. 项目根目录绝对路径
2. 允许读取的范围/是否可全量检索
3. 输出语言（默认中文）
4. 输出文件路径（默认：项目根目录 `docs/knowledge-base/PROJECT_KNOWLEDGE_BASE.md` + `docs/knowledge-base/PROJECT_KNOWLEDGE_DETAIL.md`，允许用户指定其他 `docs/knowledge-base/` 下路径）
5. **期望深度**（三选一，默认：标准完整）：
   - `快速骨架` → 仅 BASE 精简版，不含 DETAIL，适合超大项目快速入门
   - `标准完整` → **双文件结构**（推荐默认）：
     - BASE：精简入门版（概览+模块精简+TOP 10 工具+PUML 索引+技术栈+架构+建议）
     - DETAIL：深度备查版（全量模块+全量工具+协议格式+配置分析+所有深度内容）
   - `尽量详尽` → 双文件结构 + 额外的深度分析章节（算法/模型/数据层/安全机制等）
6. 可选：项目领域背景（例如 AIOPS）
7. 可选：你最关心的方向（架构/复用/接口/数据/安全）

任一关键信息缺失 → 先提问再执行。

---

## 标准流程（固定顺序，Mandatory Order）

### Phase 0 - 范围与边界

- 评估项目规模与预期深度
- **大项目判定（MUST）**：若满足任一条件，默认进入“大项目模式”：自有源码文件数 > 500、仓库体积 > 100MB、多模块/monorepo、或用户选择“标准完整/尽量详尽”
- **大项目模式下 CodeGraph 优先**：必须先尝试 CodeGraph 预扫描；成功后以 `.codegraph/` 作为 Phase 1–2 的优先输入，禁止直接进入无范围全量源码读取
- **自动检测构建系统**：
  - 找到 `pom.xml` → Maven 项目 (Java/Kotlin)
  - 找到 `build.gradle` / `build.gradle.kts` → Gradle 项目 (Java/Kotlin)
  - 找到 `package.json` → Node.js 项目 (JavaScript/TypeScript)
  - 找到 `go.mod` → Go 项目
  - 找到 `CMakeLists.txt` → C/C++ 项目 (CMake)
  - 找到 `Cargo.toml` → Rust 项目
  - 找到 `*.rockspec` → Lua 项目 (LuaRocks)
  - 多个构建文件 → 向用户确认主构建文件
- 判断架构风格（单体 / 多模块 /  monorepo / 微服务聚合）
- 记录假设与限制（未能构建、证据缺失、权限不足、部分目录无法扫描等）

#### Phase 0.2 - CodeGraph 预扫描（CLI 可用时 MUST）

```bash
# 在目标项目根目录执行
codegraph --version          # 不可用则跳过本阶段
codegraph build              # 生成 .codegraph/ 依赖图谱
```

**使用规则**：
- `codegraph build` 成功 → Phase 1–2 **优先**读取 `.codegraph/` 中的模块/依赖/调用关系，减少全量 grep
- 大项目中 `codegraph` 不可用 / build 失败 → 必须输出降级说明，并改为“索引优先 + 分模块深扫”：先目录/构建/入口/依赖索引，再按用户确认的模块域逐步读取源码
- 小项目中 `codegraph` 不可用 → 可回退手动扫描，在文档中注明「未使用 CodeGraph」
- 可选深化：`codegraph fn-impact <函数>`（变更场景）、`codegraph dead-code`（重构建议）
- Windows 安装失败：见 `docs/CodeGraph 安装指南.md`（需 Node >= 22.12.0）

#### Phase 0.3 - 知识库结构校验（生成后 MUST）

知识库生成完成后执行：

```bash
node "$FRAMEWORK/skills/jit-project-knowledge-base/scripts/validate-kb.js" "<目标项目绝对路径>"
```

校验结果必须写入交付说明。若存在 Error，知识库不算完成；若大项目缺少 `.codegraph/`，必须解释原因并记录降级策略。

---

#### Phase 0.1 - 项目特征标签（自动检测 + 用户多选组合）

> **核心思路**：不把项目硬塞进一个类别，而是用**多维度标签组合**描述项目特征，不同标签组合决定后续分析侧重。

**Step 1 — 自动检测，生成推荐标签**

扫描项目文件结构，按以下规则**自动匹配**推荐标签（可命中多个，用 ✅ 标记）：

| 检测规则 | 推荐标签 | 说明 |
|----------|----------|------|
| 存在 `*.lua` + `nginx.conf` / `openresty` | `🌐 OpenResty网关` | Lua/OpenResty 网关应用 |
| 存在 `SpringBootApplication` / `@RestController` / `@Controller` | `☕ Spring后端` | Java Spring 系列 |
| 存在 `app.py` / `flask` / `django` / `fastapi` | `🐍 Python后端` | Python Web 后端 |
| 存在 `go.mod` + `net/http` / `gin` / `echo` | `🐹 Go后端` | Go Web 服务 |
| 存在 `package.json` + `next.config` / `vite.config` / `vue` / `react` / `angular` | `🖥️ 前端SPA` | 单页应用前端 |
| 存在 `Dockerfile` / `docker-compose.yml` | `🐳 容器化部署` | Docker 容器 |
| 存在 `k8s/` / `*.yaml` 含 `apiVersion: apps` | `☸️ K8s编排` | Kubernetes 部署 |
| 存在 `*.proto` / `gRPC` / `grpc` | `📡 gRPC/Protobuf` | Protobuf 协议通信 |
| 存在自定义二进制协议头（如固定 magic number） | `🔌 自定义协议` | 非标准协议交互 |
| 存在 `kafka` / `rabbitmq` / `rocketmq` / `MQ` 引用 | `📨 消息队列驱动` | MQ 消息驱动架构 |
| 存在 `*.sql` / `migration` / `mybatis` / `hibernate` / `sequelize` / `sqlalchemy` | `🗄️ 数据库密集` | ORM/SQL 数据层 |
| 存在 `skf` / `hsm` / `pkcs11` / `crypto` / `国密` / `sm2`/`sm3`/`sm4` | `🔐 加密/国密` | 密码学/国密算法 |
| 存在 FFI / JNI / ctypes / cgo 调用 | `⚙️ 硬件交互/FFI` | 跨语言/硬件调用 |
| 存在 `auth` / `jwt` / `oauth` / `casbin` / `shiro` / `spring-security` | `🛡️ 认证授权` | 安全认证体系 |
| 存在 `cron` / `schedule` / `celery` / `quartz` / `定时` | `⏰ 定时任务` | 定时调度 |
| 存在 `ota` / `hot reload` / `热更新` / `upgrade` | `🔄 OTA/热更新` | 远程升级机制 |
| 存在 `guard` / `supervisor` / `systemd` / `daemon` / `watchdog` | `🛡️ 进程守护` | 进程监控自愈 |
| 存在 `*.puml` / `*.plantuml` / `docs/` 图文资产 | `📊 已有文档资产` | 存在可整合的文档 |
| 存在 `Jenkinsfile` / `.gitlab-ci.yml` / `GitHub Actions` / `Jenkins` | `🚀 CI/CD流水线` | 已有构建流水线 |
| 存在 `pytest` / `junit` / `jest` / `mocha` / `test` 目录 | `🧪 已有测试体系` | 存在测试代码 |
| 存在 `Dockerfile` 且目标架构含 `arm` / `mips` | `🔲 嵌入式/边缘` | 非x86部署目标 |
| 存在 `tensorflow` / `pytorch` / `sklearn` / `模型` / `inference` | `🤖 AI/ML` | 机器学习相关 |
| 存在 `mqtt` / `coap` / `iot` / `设备` / `sensor` | `📡 IoT/设备接入` | 物联网设备对接 |
| 存在 `README` 中提 `微服务` / `microservice` 或多模块独立部署 | `🏛️ 微服务架构` | 微服务拆分 |
| 存在 `pnpm workspace` / `turborepo` / `nx.json` / `lerna.json` | `📦 Monorepo` | 多包单体仓库 |
| 存在 `webpack` / `vite` / `rollup` / `esbuild` 配置 | `🔧 前端构建工具链` | 前端工程化 |
| 存在 `audit` / `合规` / `compliance` / `日志审计` | `📋 审计合规` | 合规审计需求 |
| 存在 `redis` / `memcached` / `缓存` / `cache` | `💾 缓存层` | 缓存中间件 |
| 存在 `nginx` / `envoy` / `traefik` / `网关` / `gateway` | `🌐 API网关/代理` | 网关/反向代理层 |
| 存在 `Makefile` 且含交叉编译 / `cross` / `toolchain` | `🔨 交叉编译` | 跨平台编译 |
| 存在 `swag` / `swagger` / `openapi` / `apidoc` | `📖 API文档生成` | 已有API文档规范 |

**Step 2 — 向用户展示并确认标签组合**

将自动检测到的推荐标签 ✅ 与全部可选标签一起展示，**格式如下**：

```
📌 项目特征标签（可多选组合）

自动检测推荐（✅ = 已检测到）：
  ✅ 🌐 OpenResty网关    ✅ 🔌 自定义协议    ✅ 🔐 加密/国密
  ✅ ⚙️ 硬件交互/FFI     ✅ 🔄 OTA/热更新     ✅ 🛡️ 进程守护

可选补充（根据你的了解勾选）：
  ☐ ☕ Spring后端      ☐ 🐍 Python后端      ☐ 🖥️ 前端SPA
  ☐ 🐳 容器化部署      ☐ ☸️ K8s编排         ☐ 📡 gRPC/Protobuf
  ☐ 📨 消息队列驱动    ☐ 🗄️ 数据库密集      ☐ 🛡️ 认证授权
  ☐ ⏰ 定时任务        ☐ 📊 已有文档资产     ☐ 🚀 CI/CD流水线
  ☐ 🧪 已有测试体系    ☐ 🔲 嵌入式/边缘      ☐ 🤖 AI/ML
  ☐ 📡 IoT/设备接入    ☐ 🏛️ 微服务架构       ☐ 📦 Monorepo
  ☐ 🔧 前端构建工具链  ☐ 📋 审计合规         ☐ 💾 缓存层
  ☐ 🌐 API网关/代理    ☐ 🔨 交叉编译         ☐ 📖 API文档生成
  ☐ 🐹 Go后端

请确认或调整标签组合（可增删）：
```

**Step 3 — 根据标签组合决定分析侧重**

不同标签组合会在标准流程基础上**激活额外的分析章节或深度要求**：

| 标签 | 激活的额外分析 |
|------|---------------|
| 🌐 OpenResty网关 | nginx.conf 解析、Lua 模块调用链、共享字典分析、请求处理阶段（rewrite/access/content/log） |
| ☕ Spring后端 | Bean 依赖图、AOP 切面分析、Spring Security 过滤链、自动配置条件 |
| 🖥️ 前端SPA | 组件树结构、路由表、状态管理（Redux/Vuex/Pinia）、API 调用层、构建配置 |
| 🔌 自定义协议 | 报文格式解析（magic/type/body）、编解码逻辑、状态机流转、协议版本兼容 |
| 🔐 加密/国密 | 算法实现分析（SM2/SM3/SM4/AES/RSA）、密钥生命周期、PKI 证书链、密钥派生流程 |
| ⚙️ 硬件交互/FFI | FFI/JNI/cgo 接口定义、C 库函数签名、硬件操作序列、错误码与重试策略 |
| 🔄 OTA/热更新 | 升级包格式与签名验证、回滚机制、版本管理、热重载触发条件 |
| 🛡️ 进程守护 | 守护逻辑（轮询/事件）、重启策略、日志轮转、资源监控 |
| 📨 消息队列驱动 | 消息生产者/消费者、Topic/Queue 拓扑、消息格式、消费幂等性、死信处理 |
| 🗄️ 数据库密集 | ER 图、Migration 版本链、索引策略、DAO/Repository 方法清单、慢查询风险 |
| 🛡️ 认证授权 | 认证流程（OAuth/JWT/Session）、权限模型（RBAC/ABAC）、Token 生命周期 |
| ⏰ 定时任务 | Cron 表达式、任务依赖、幂等性、失败重试、分布式锁 |
| 📡 IoT/设备接入 | 设备协议（MQTT/CoAP/自定义）、设备生命周期、数据采集→存储→分析链路 |
| 🤖 AI/ML | 模型结构、训练 Pipeline、特征工程、推理接口、评估指标 |
| 📋 审计合规 | 审计日志格式、合规规则校验、数据脱敏策略、操作追溯链 |
| 📦 Monorepo | 包依赖图、共享配置、构建顺序、发布策略 |
| 🌐 API网关/代理 | 路由规则、负载均衡策略、限流/熔断、上游服务拓扑 |
| 💾 缓存层 | 缓存策略（TTL/LRU）、缓存一致性、穿透/雪崩防护、热点 Key |
| 🏛️ 微服务架构 | 服务注册发现、调用链路、服务间通信方式、分布式事务 |
| 📖 API文档生成 | 现有 API 文档覆盖率、文档与代码一致性 |
| 🐳 容器化部署 | Dockerfile 分析、镜像分层优化、环境变量注入、健康检查 |
| ☸️ K8s编排 | Deployment/Service/ConfigMap 分析、HPA 策略、网络策略 |

**标签组合示例**：
- `🌐 OpenResty网关` + `🔌 自定义协议` + `🔐 加密/国密` + `⚙️ 硬件交互/FFI` → 典型安全网关场景，侧重协议解析、加密流程、硬件加速
- `☕ Spring后端` + `🗄️ 数据库密集` + `🛡️ 认证授权` + `🐳 容器化部署` → 典型企业后端，侧重数据模型、安全链路、部署配置
- `🖥️ 前端SPA` + `🔧 前端构建工具链` + `📦 Monorepo` → 前端工程化项目，侧重组件复用、构建优化、包管理
- `🐍 Python后端` + `🤖 AI/ML` + `📨 消息队列驱动` → AI 数据平台，侧重模型Pipeline、数据流、调度

**Step 4 — 记录标签组合到分析边界说明**

最终确认的标签组合写入 Phase 0 产出，作为后续所有 Phase 的分析导向依据。

产出：分析边界说明（boundary notes）+ 项目特征标签组合

### Phase 1 - 宏观探索

1. 扫描根目录，识别顶级模块/目录分层
2. **递归扫描每个子目录**（排除 `.git`、`node_modules`、`vendor`、第三方源码的 `bundle` 等），获取完整的目录树（至少 3 层深度），**不能只看顶层目录名就跳过**
3. **如果存在 `README.md`** → 自动读取并提取项目简介整合到概览
4. **如果存在 git 信息** → 自动提取远程仓库地址和最近变更趋势
5. 读取主构建文件提取项目信息
6. 判断架构风格（单体 / 多模块 / 分层）
7. 归纳项目类型/领域定位

产出：项目概览、模块统计、架构结论

### Phase 1.1 - 深度内容探查（强制必做，全量读取）

> **核心原则：不能只看目录名就推断功能，必须逐个读取每个源文件内容才能给出准确分析。**
> **强约束：不允许只读"关键文件"然后"推断"其余文件，必须全量读取所有自定义源码文件。**

对 Phase 1 识别出的**每个项目自有模块**（非第三方依赖），必须执行：

1. **递归列出目录下所有源码文件**（按语言后缀过滤：`*.lua`, `*.c`, `*.h`, `*.cs`, `*.java`, `*.py`, `*.go`, `*.js`, `*.ts`, `*.sh` 等）
2. **逐个读取所有自定义源文件**（全量，不可只读"关键"文件再推断其余）：
   - 入口文件（`main.*`、`app.*`、`index.*`、`*_init.lua`、`nginx.conf` 等）
   - 配置文件（`*.conf`、`*.properties`、`*.yml`、`*.yaml`、`*.json` 等）
   - 全部业务文件（不仅是 handler/controller/service/router，所有自定义 `*.lua`、`*.py`、`*.go`、`*.java` 等都必须读取）
   - 头文件/接口定义（`*.h`、`interface.*`、`*.proto` 等）
   - 工具/辅助文件（`*utils*`、`*helper*`、`*store*`、`*config*` 等）
   - 测试文件（`*test*`、`*spec*` 等）
3. **对于 C/C++ 项目**：读取 `Makefile`、`CMakeLists.txt`、所有头文件（`.h`）、所有源文件（`.c`/`.cpp`）
4. **对于 C# 项目**：读取 `.csproj`、`.sln` 和所有 `.cs` 文件
5. **对于 Lua/OpenResty 项目**：读取 `nginx.conf`、所有 `*.lua` 文件（包括子目录中的）
6. **对每个文件输出**：
   - 文件路径
   - 功能摘要（1-3 句话，基于实际读取的代码内容，包含核心函数/方法名和职责）
   - 导出的函数/方法/类列表
   - 依赖的其他模块（基于 require/import/include 语句）
7. **全量读取的验证标准**：
   - 自定义源文件读取率必须 100%（不可抽样、不可跳过）
   - 每个文件必须有基于实际内容的摘要，不允许出现"基于文件名推断"的描述
   - 如果因文件过大无法全量读取，必须至少读取核心函数定义和模块导出部分

产出：每个模块的完整源文件清单 + 每个文件的功能摘要 + 模块间调用关系

### Phase 2 - 模块业务字典（必做）

把模块分成：
- 聚合入口
- 业务模块
- 基础/通用模块
- 构建/部署模块

**重要：每个模块的分析必须基于 Phase 1.1 中实际读取的源文件内容，不能只凭目录名推断。**

每个模块提炼：
- 业务含义（一句话，基于实际代码内容描述）
- 核心功能（2-5 点，基于实际读取的函数/类/方法）
- 关键源文件列表（列出模块内的核心文件路径）
- 依赖关系（上游/下游，基于 require/import/include 语句）
- 优先级（高/中/低）

产出：模块业务字典表（必须表格化），且每个模块必须附带关键源文件清单

### Phase 3 - 可复用资产提取（Util/Helper，严格要求）

1. 全局检索所有工具类/工具函数，按语言约定：
   | 语言 | 检索模式 |
   |------|----------|
   | Java/Kotlin | `*Util*`, `*Helper*`, `*Utils` |
   | Go | `*util*` 包, `*helper*` 包 |
   | JavaScript/TypeScript | `*/utils/*.ts`, `*/helpers/*.ts`, `*Utils.ts` |
   | Python | `utils.py`, `helpers.py`, `*_utils.py` |
   | C# | `*Helper`, `*Utility` |
   | C/C++ | `*utils.h`, `*helper.h` |
| Lua | `*utils*.lua`, `*util*.lua`, `*helper*.lua` |
   
2. 按功能分类（安全/文件/网络/日志/日期/转换/校验/通用等）
3. 评估复用价值与风险
4. **必须递归搜索所有子目录**，不能只搜索顶层目录。对于每个找到的工具文件，必须读取其内容，提取：
   - 导出的函数/方法名列表
   - 每个函数的简要功能说明
   - 函数参数和返回值（如果可辨识）

输出强约束：
- Util/Helper **全量索引**（不可抽样截断）
- 分类汇总统计（每类数量）
- 每个工具标注复用等级（High/Medium/Low 或同义）
- “高复用 TOP 10”仅作为入口（可选）

### Phase 4 - 图文资产整合与 PUML 流程图生成（强制强制执行）

> ⚠️ **重要提醒：团队成员必须严格遵守本节。偷工减料只生成 1 个图的行为是不允许的！**

#### Step 1 — 检索现有图文资产

检索现有图文资产：
- `*.puml`, `*.plantuml`, `*.png`, `*.jpg`, `*.svg`

若存在现成流程图：
- 建立索引（文件路径 + 内容摘要）
- 给出文字流程解释（触发/主链路/异常/输出）

#### Step 2 — 基于代码分析生成 PUML 流程图（必须独立文件输出）

> 🚫 **错误行为禁止清单**（违者返工）：
> ❌ 不能只在 markdown 中嵌入 plantuml 代码块，不生成独立 .puml 文件
> ❌ 不能只生成一个 "综合大图" 包含所有内容
> ❌ 不能生成项目中不存在的流程（如没有加密卡就不能画硬件图）
> ❌ 不能省略源文件路径标注
> ❌ 不能随便命名（必须用规范文件名，如 main_flow.puml）

> ✅ **正确行为**：每个有意义的业务流程**单独生成一个 .puml 文件**，不嵌入 MD，不合并为一个大图。

根据 Phase 1.1 实际读取的代码 + Phase 2 模块依赖关系，识别项目中的**所有独立业务流程**，每个流程生成一个独立的 PUML 文件。

**必须生成的流程图类型（按项目特征标签激活，P0=必选）：**

| 优先级 | 流程图类型 | 文件名 | 激活标签 | 内容要求 |
|--------|-----------|--------|---------|---------|
| P0 | 主业务流程 | `main_flow.puml` | **所有项目必选** | 端到端主链路：从入口到输出，覆盖核心模块调用顺序 |
| P0 | 模块依赖关系 | `module_dependency.puml` | **所有项目必选** | 模块间 require/import/call 关系图 |
| P1 | 协议报文处理 | `protocol_flow.puml` | 自定义协议 | 报文接收→解析→路由→处理→响应完整流程 |
| P1 | 加密/安全流程 | `security_flow.puml` | 加密/国密 | 密钥协商、加解密调用链、证书加载流程 |
| P1 | 硬件交互流程 | `hardware_flow.puml` | 硬件交互/FFI | FFI 调用序列、硬件操作生命周期 |
| P1 | 认证授权流程 | `auth_flow.puml` | 认证授权 | 登录→验证→Token发放→鉴权→过期续签 |
| P1 | 数据模型关系 | `data_model.puml` | 数据库密集 | ER 图：实体、关系、基数 |
| P1 | API 调用链 | `api_flow.puml` | Spring后端 / Python后端 / Go后端 | 请求→路由→Controller→Service→DAO→响应 |
| P1 | 部署架构 | `deployment.puml` | 容器化部署 / K8s编排 | 组件→容器→服务→网络拓扑 |
| P1 | 微服务调用链 | `microservice_flow.puml` | 微服务架构 | 服务间调用关系、同步/异步通信方式 |
| P1 | 消息流转流程 | `message_flow.puml` | 消息队列驱动 | 生产者→Topic/Queue→消费者→处理→结果 |
| P1 | OTA/升级流程 | `ota_flow.puml` | OTA/热更新 | 版本检测→下载→校验→安装→回滚 |
| P1 | 定时任务调度 | `scheduler_flow.puml` | 定时任务 | 触发→执行→幂等校验→结果处理→失败重试 |
| P1 | 前端组件树 | `component_tree.puml` | 前端SPA | 页面→布局→组件→子组件层级关系 |
| P1 | 缓存策略 | `cache_flow.puml` | 缓存层 | 请求→缓存查询→命中/穿透→回源→更新缓存 |
| P1 | IoT 设备生命周期 | `iot_lifecycle.puml` | IoT/设备接入 | 设备注册→接入→数据上报→指令下发→离线/重连 |
| P1 | 审计日志流程 | `audit_flow.puml` | 审计合规 | 操作发生→采集→脱敏→存储→查询→告警 |
| P1 | 进程守护机制 | `daemon_flow.puml` | 进程守护 | 检测→判断→重启→验证→告警 |
| P1 | 交叉编译流程 | `cross_build_flow.puml` | 交叉编译 | 源码→工具链选择→编译→链接→打包→签名 |

**生成规则（强制执行）：**

1. **每个 PUML 文件必须独立完整**：有自己的 `@startuml` / `@enduml`，可单独渲染
2. **只生成有代码证据的流程图**：没有对应标签的流程图不生成，不臆造
3. **项目有多个独立流程就生成多个文件**：不允许把所有流程塞进一个图
4. **命名规范**：`{流程类型}.puml`，存放在 `docs/knowledge-base/` 目录（不存在则创建）
5. **所有 PUML 使用 PlantUML 语法**，兼容在线渲染（如 plantuml.com/plantuml）
6. **图中必须标注源码文件路径**：每个处理节点旁标注实现它的源文件名（如 `packet_handler.lua`），方便定位
7. **每个文件头部必须包含元数据**：项目名、图类型、生成时间、激活标签
8. **[强制] PUML 语言规则**：**所有 PUML 图的标签、标题、注释、节点描述必须使用中文**。代码文件名和类名保持原文。skinparam 元数据注释可使用英文。title 必须为中文。此规则优先级高于模板示例

---

#### ⚠️ 【强制】PlantUML 语法兼容性规范（必须遵守！）

> 🚫 **不遵守此规则生成的图会导致渲染失败！** 已在多个项目中发现以下语法导致 PUML 打不开。
>
> **核心原则：只使用最基础、兼容性最高的 1990 年代 PlantUML 语法，绝对不追新特性。**

##### 一、皮肤配置语法（绝对禁止特定类型 skinparam）

| 禁用 skinparam ❌ | 通用兼容 skinparam ✅ | 原因 |
|------------------|----------------------|------|
| `skinparam rectangleBackgroundColor` | `skinparam BackgroundColor` | 旧版本不支持按元素类型设置背景 |
| `skinparam rectangleBorderColor` | `skinparam BorderColor` | 按元素类型设边框兼容性差 |
| `skinparam participantBackgroundColor` | `skinparam BackgroundColor` | participant 特定配置不通用 |
| `skinparam databaseBackgroundColor` | 直接移除，用默认 | database 特定配置不通用 |
| `skinparam componentBackgroundColor` | `skinparam BackgroundColor` | component 特定配置不通用 |
| `skinparam xxx { ... }` 块语法 | 所有 skinparam 全部单行 | 块语法 100% 导致旧版本渲染失败 |

**【唯一正确】标准皮肤配置（所有图完全相同，禁止任何自定义！）：**
```plantuml
skinparam backgroundColor #FEFEFE
skinparam BackgroundColor #E8F4FD
skinparam BorderColor #2196F3
skinparam NoteBackgroundColor #FFF9C4
skinparam NoteBorderColor #FBC02D
skinparam ArrowColor #555555
```

---

##### 二、绝对禁止使用的语法黑名单（发现即返工）

| 禁止使用的语法 ❌ | 替代方案 ✅ | 踩坑记录 |
|------------------|-----------|---------|
| `box "xxx" #color` / `end box` | 移除 box，直接写 participant，用 note 说明分组 | 时序图用 box 语法 90% 旧版本不支持 |
| `participant "xxx\nyyy" as z` | `participant "xxx_yyy" as z` 或 单行文本 | participant 名称内换行符经常导致解析失败 |
| `hexagon` / `cloud` / `database` 特殊形状 | 只用最基础的 `note` 或 `rectangle` | 特殊形状支持度极差 |
| `fork` / `fork again` / `split` / `split again` | 用普通 `if/then/else` 或 多个顺序步骤 | 分支嵌套语法几乎 100% 不兼容 |
| `group xxx` / `end group` | 移除 group，用 note 说明分组 | group 语法支持度非常差 |
| `partition "xxx" { ... }` | 移除 partition，用 package 或 纯文本 note | partition 内部经常解析失败 |
| `-[hidden]->` / `-[thickness]->` / `-[dashed]->` | 只用最基础的 `-->` 箭头 | 箭头修饰符大部分渲染器不支持 |
| `state xxx { ... }` 嵌套 state | state 扁平化，不嵌套 | State 嵌套解析器经常崩溃 |
| State 图内写 `:xxx;` Activity 步骤 | State label 只用纯文本，不加冒号 | State/Activity 语法体系完全独立，混用必崩 |

---

##### 三、特殊字符黑名单（发现即返工）

**以下字符绝对不能出现在 PUML 文件任何位置：**

| 禁止字符 | 替代字符 | 说明 |
|-----------|-----------|------|
| 所有 emoji | 纯中文描述 | emoji 在 50% 以上渲染器中会变成乱码 |
| 制表符 | 普通 `-` 连字符 + 纯文本 | 不同编码下制表符会变成未知字符 |
| 全角符号 | 半角对应符号 | 全角标点经常导致解析器截断 |
| 连续 3 个以上特殊字符 | 简化为纯文本 | 复杂符号组合极易触发解析 bug |
| **Activity节点中的括号 `()`** | **移除或用空格分隔** | 括号在 `:text;` 标签内会被误解析为函数调用语法，导致渲染报错 |
| **Activity节点中的方括号 `[]`** | **改为"列表"等中文描述** | 方括号会被误解析为样式或链接语法 |
| **Activity节点中的等号 `=`** | **改为"等于"或": "** | 等号在某些解析器中触发key=value解析 |
| **Activity节点中的 `/` 路径分隔符** | **改为`_`或空格** | 斜杠在部分渲染器中触发特殊解析 |

---

##### 四、不同类型图的安全语法子集

| 图类型 | 只允许使用的安全语法 |
|--------|-------------------|
| **Activity 活动图** | `start` / `:xxx;` / `if/then/else` / `note left/right` / `stop` |
| **State 状态机图** | `[*] --> state` / `state "纯文本label" as name` / `state1 --> state2` / `note left/right` |
| **Component 组件图** | `package "xxx" {` / `component "xxx"` / `component1 --> component2` / `note left/right` |
| **Sequence 序列图** | `participant "xxx" as y` / `->` / `note left/right` / `alt/else/end`（alt 慎用！） |

---

##### 五、快速检查清单（生成后逐项核对，不通过不能交付）

- [ ] 没有 `skinparam xxx { ... }` 块语法
- [ ] skinparam 只有标准 6 行，不包含任何特定元素类型的配置
- [ ] 没有 `box ... end box` 语法
- [ ] participant/component/state 名称内没有 `\n` 换行符
- [ ] 没有 `hexagon`/`fork`/`split`/`group`/`partition` 等高级语法
- [ ] 没有 `-[hidden]->` 等箭头修饰符
- [ ] State 图内没有 `:xxx;` Activity 语法
- [ ] 文件中没有任何 emoji 或制表符
- [ ] 每个文件都有完整的 `@startuml` / `@enduml` 包裹
- [ ] 所有中文都是纯文本，不含特殊格式

---

##### 六、每个 PUML 文件的标准模板（直接套用，禁止增删 skinparam）

```
@startuml
' 项目：[项目名，纯英文，不含特殊字符]
' 流程图类型：[主业务流程/模块依赖/...]
' 生成时间：YYYY-MM-DD
' 激活标签：[对应标签，纯文本，不含emoji]
'
' 变更记录（倒序，纯文本）：
' vX.X - YYYY-MM-DD - [修改内容描述]

' 重要：只使用最通用的 plantuml 语法，确保所有版本兼容
skinparam backgroundColor #FEFEFE
skinparam BackgroundColor #E8F4FD
skinparam BorderColor #2196F3
skinparam NoteBackgroundColor #FFF9C4
skinparam NoteBorderColor #FBC02D
skinparam ArrowColor #555555

title [图标题，必须使用中文，不含特殊字符]

' [图内容 - 所有标签、节点描述、注释必须使用中文]
' State 图和 Activity 图语法绝对不能混用！
' - Activity 图安全子集：start / :xxx; / if/then/else / stop
' - State 图安全子集：[*] --> state / state "xxx" as s1 / note

@enduml
```

**输出目录结构示例：**
```
docs/knowledge-base/
├── main_flow.puml              # 主业务流程
├── module_dependency.puml       # 模块依赖关系
├── protocol_flow.puml           # 协议报文处理（自定义协议）
├── security_flow.puml           # 加密安全流程（加密/国密）
├── hardware_flow.puml           # 硬件交互流程（硬件交互/FFI）
├── ota_flow.puml                # OTA升级流程（OTA/热更新）
└── ... 其他激活标签对应的图
```

#### Step 3 — 在知识库 MD 中建立 PUML 索引

在 `PROJECT_KNOWLEDGE_BASE.md` 中**新增独立章节 "PUML 流程图索引"**：

1. **PUML 文件索引表**：文件名、流程类型、激活标签、简述（表格形式）
2. **每个流程图附加文字说明**：触发条件、主链路、关键分支、异常路径、输出结果
3. **渲染方式说明**：告诉用户如何渲染这些 .puml 文件（在线渲染、VS Code 插件、本地 Java 命令）
4. **文字说明与 PUML 图一一对应**，不能只有图没有文字，也不能只有文字没有图

### Phase 4.1 - 脚本与配置资产分析（混合语言项目）

对于包含多种类型资产的项目（Java + 脚本 + 配置），增加此阶段分析：

检索并整理以下类型文件（**必须递归搜索所有子目录，包括嵌套子目录**）：
- **脚本文件**：`*.py`, `*.sh`, `*.bat`, `*.lua` - 整理功能说明、执行位置、依赖环境
- **配置文件**：`*.properties`, `*.json`, `*.yml`, `*.yaml`, `*.conf`, `*.ini` - 分类整理关键配置作用
- **部署资产**：`Dockerfile`, `docker-compose.yml`, `k8s/*.yaml`, `k8s/*.yml` - Kubernetes/Docker 部署配置说明
- **打包压缩资产**：`*.tar`, `*.zip`, `*.gz` - 说明是什么资产的打包（探针包、依赖包等）

产出要求：
- 按文件类型分表格索引
- 每个文件标注路径、功能、执行上下文
- **必须读取脚本/配置文件内容**，基于实际内容描述功能，不能只凭文件名推测
- 关键脚本说明输入输出依赖

**深度模式额外要求**：阅读脚本内容提取核心逻辑，总结脚本功能。

#### Phase 4.1.1 - 配置交叉引用解析（强制必做！历史教训：多次遗漏关键配置）

> ⚠️ **本节是硬性强制要求，不是建议！** 历史上多次发生：扫描到配置文件并列入清单，但未实际读取内容，导致关键信息（如服务注册表、API地址列表等）被遗漏。
>
> **核心原则：配置文件之间经常相互引用，只读入口配置不追引用链 = 只看目录不进房间。**

**Step 1 - 识别配置文件间的引用关系**

读取每个配置文件时，识别以下引用模式：

| 引用模式 | 示例 | 说明 |
|----------|------|------|
| 文件路径引用 | `path=file:config/cube-service.json` | 直接引用另一个配置文件 |
| Spring引用 | `spring.config.location`, `spring.config.import` | Spring Boot 配置文件链 |
| Include/Import | `include=xxx.properties`, `@PropertySource` | 属性文件包含 |
| 资源路径 | `classpath:xxx.yml`, `file:conf/xxx.json` | 类路径或文件系统引用 |
| XML引用 | `<import resource="xxx.xml"/>` | Spring XML 配置导入 |
| 环境变量指向 | `${VAR:default}` 指向外部文件 | 变量引用的文件 |

**Step 2 - 递归读取所有被引用文件（强制！）**

对于 Step 1 发现的每个引用，**必须执行以下操作**：

1. **解析引用路径**：将相对路径转为绝对路径（相对于当前配置文件所在目录或项目根目录）
2. **实际读取被引用文件**：用 Read 工具读取文件内容，不能只记录"该文件被引用"
3. **提取被引用文件的核心数据**：如 JSON 中的服务列表、YAML 中的路由表、Properties 中的连接参数等
4. **将核心数据写入知识库**：不能只在表格中写一行"Cube服务注册配置"，必须展开核心内容
5. **继续检查被引用文件是否又引用了其他文件**：递归直到引用链终止

**Step 3 - 配置读取验证清单（每个配置文件必须通过）**

对 Phase 4.1 中扫描到的每个配置文件，逐一检查：

```
配置文件读取验证表：
| 文件路径 | 是否已读取内容 | 核心数据是否已提取到知识库 | 引用了哪些文件 | 被引用文件是否已读取 |
|---------|:---:|:---:|---|:---:|
| platform.properties | ✅ | ✅ | cube-service.json, jdbc.properties | ? |
| cube-service.json   | ?   | ?   | - | - |
| ... |
```

**任何一行"被引用文件是否已读取"为 ❌ 的，必须返回读取，不能跳过！**

**典型遗漏场景（反面教材）**：
- ❌ `platform.properties` 中写了 `cube.lookupservice.path=file:config/cube-service.json`，但只记录了"Cube服务注册配置"一句话，未读取 JSON 内容提取 70+ 个服务注册条目
- ❌ `application.properties` 中写了 `spring.config.name=application,additional`，但未读取 `additional.properties`
- ❌ `redis.properties` 中写了集群节点列表，但未展开说明各节点角色
- ✅ **正确做法**：读到引用 → 追过去读 → 提取核心数据 → 写入知识库 → 检查是否还有嵌套引用

### Phase 5 - 技术栈与架构说明

- 从代码/配置/构建文件提取：语言、框架、中间件、数据库、缓存、MQ
- 版本号只能用“可追溯证据”来源（build file/config）
- 说明层级边界与调用路径（谁调用谁、在哪里落地）

### Phase 6 - 问题发现与重构建议（只写有证据的）

每条建议至少包含：
- 证据位置（path/symbol 引用）
- 风险说明（影响、可维护性、性能、安全等）
- 建议动作（怎么改）
- 预期收益（为什么值得改）

---

### Phase 7 - 深度分析（仅`尽量详尽`模式需要）

根据期望深度，在"尽量详尽"模式下增加以下分析：

#### 7.1 入口点分析
- 找到项目启动入口（`main` 方法 / `SpringBootApplication` / 根路由文件等）
- 梳理启动加载流程
- 标注关键配置项位置

#### 7.2 API 接口分析（针对 Web 项目）
- 提取所有 Controller / 路由处理器
- 列出所有接口路径、HTTP 方法、功能简述
- 整理成接口清单表格

#### 7.3 配置文件分析
- 找到主配置文件（`application.yml`/`application.properties`/`config.*` 等）
- 提取关键配置项（数据库连接、端口、密钥、第三方API地址等）
- 说明各配置项作用

#### 7.4 数据层分析（如果有数据库）
- 识别实体模型 / DO / Entity
- 提取核心表结构关系
- 梳理 DAO / Repository 层职责

#### 7.5 定时任务分析
- 找出所有定时任务
- 列出 cron 表达式、任务功能

#### 7.6 安全机制分析
- 识别认证/授权入口
- 梳理安全过滤链路
- 说明权限控制方式

#### 7.7 算法分析（针对算法/机器学习项目）
- 识别核心算法模块与模型文件
- 提取算法类型（分类/回归/聚类/强化学习等）
- 梳理特征工程流程与特征选择逻辑
- 整理模型结构、超参数配置与训练方式
- 标注推理接口输入输出格式
- 说明模型评估指标与性能结果

---

## 最终交付（Final Deliverable）

> 📦 **标准交付 = 分层文件结构 + 多个独立 PUML 文件**
> 
> **分层原则：基于信息维度，而非行数硬约束**
> - 第一层：`PROJECT_KNOWLEDGE_BASE.md` = 核心索引层（10 分钟快速上手）
> - 第二层：`PROJECT_KNOWLEDGE_DETAIL.md` = 深度备查层（开发参考手册）
> - 第三层：`PROJECT_KNOWLEDGE_DETAIL-{模块域}.md` = 超大项目分卷（>50 模块时自动拆分）
> - PUML 文件：多个独立流程图文件，每个流程一个文件

---

### 第一层：PROJECT_KNOWLEDGE_BASE.md（核心索引层）

**定位**：新人上手、架构评审、快速了解项目全貌  
**设计目标**：10 分钟能看完，回答 3 个核心问题：
1. 「这项目是做什么的？」
2. 「核心架构和依赖是什么？」
3. 「我要改 X 功能应该去哪个文件？」

**强制包含内容（内容驱动，而非行数驱动）**：
1. 目录导航（TOC）
2. 项目整体概览：项目定位、核心能力（≤5 点）、架构风格
3. **PUML 流程图索引**：独立章节，列出所有 .puml 文件表格 + 渲染方式说明
4. 模块业务字典（精简版）：只列 Top 20% 核心模块，每模块一句话 + 关键文件路径 + 被引用次数
5. 高复用工具 TOP 10：只列最常用的 10 个，每个一句话说明适用场景
6. 技术栈全景表：语言/框架/中间件/版本，一张表列完
7. 关键架构决策（≤5 点）：最核心的设计选择与取舍
8. 重构建议 TOP 5：最值得优先改进的 5 个问题
9. 分析边界与假设：什么没覆盖、依赖的前提条件
10. 底部加跳转链接：「📚 深度分析请查阅 PROJECT_KNOWLEDGE_DETAIL.md」
11. **（超大项目）分卷索引表**：列出所有 DETAIL 分卷的文件名和内容范围

---

### 第二层：PROJECT_KNOWLEDGE_DETAIL.md（深度备查层）

**定位**：开发手册、深度排查、代码复用参考  
**设计目标**：所有开发需要的细节都能在这里查到，不需要去翻源码

**强制包含内容（内容驱动，而非行数驱动）**：
1. 目录导航（TOC）
2. 开头加跳转链接：「📖 快速入门请查阅 PROJECT_KNOWLEDGE_BASE.md」
3. **协议报文格式**（如有 🔌 自定义协议标签）：magic 校验、type_val 路由表、编解码逻辑、错误码
4. **模块间完整调用关系图**（ASCII 或 Mermaid）
5. **模块业务字典（完整版）**：所有模块的所有导出函数 + 完整依赖链 + 输入输出说明
6. **可复用工具全量索引**：所有 Util/Helper，分类统计、每个函数参数/返回值/功能说明
7. **脚本与配置资产全索引**：所有脚本/配置文件的路径、功能、参数、执行上下文
8. **核心技术/算法详解**（如有 🔐 加密/国密 / 🤖 AI/ML 标签）
9. **硬件/FFI 接口分析**（如有 ⚙️ 硬件交互/FFI 标签）：所有接口的参数、返回值、错误处理
10. **启动入口分析**：完整启动流程、关键配置位置、初始化顺序
11. **API 接口清单**（Web 项目）：所有接口的路径、方法、参数、返回值、权限要求
12. **关键配置项说明**：所有配置项的默认值、作用、合法值范围
13. **安全机制与密钥层次**（如有 🔐 加密/国密 / 🛡️ 认证授权标签）
14. **错误码体系**：所有错误码的含义、触发场景、排查建议
15. **状态机详解**（如有 🔄 OTA/热更新 / ⏰ 定时任务标签）
16. **进程守护机制**（如有 🛡️ 进程守护标签）
17. **打包发布流程**
18. **需求索引**：首次生成时也必须创建空表，后续任务 8.5 追加/更新
19. **函数与接口变更索引**：首次生成时创建空表，后续按需求增量维护
20. **更新记录**：首次生成写入 `v1.0` 全量创建记录

初始化模板：

```markdown
## 需求索引

| 需求标识 | 中文名 | 级别 | 涉及模块 | 完成版本 | 状态 | 备注 |
|---------|-------|:--:|---------|:--:|------|------|

## 函数与接口变更索引

| 模块 | 符号/接口 | 文件路径 | 变更类型 | 摘要 | 调用方/消费者 | 风险 | 需求标识 | 版本 |
|------|----------|----------|----------|------|---------------|------|----------|------|

## 更新记录

| 版本 | 日期 | 需求标识 | 变更范围 | 说明 | 更新文件 |
|------|------|----------|----------|------|----------|
| v1.0 | YYYY-MM-DD | initial | 全量创建 | 初始知识库 | BASE, DETAIL |
```

---

### 第三层：超大项目分卷（>50 模块时自动触发）

**触发条件**：
- 模块数 > 50
- 或预估 DETAIL.md > 2000 行

**分卷规则**：
1. **始终保留一个 BASE**：核心索引层永远是单文件
2. **公共部分放主 DETAIL**：协议格式、工具全量索引、配置分析、启动流程等公共内容
3. **每个业务域一个 DETAIL 分卷**：按领域拆分，如：
   - `PROJECT_KNOWLEDGE_DETAIL-通信模块域.md`
   - `PROJECT_KNOWLEDGE_DETAIL-加密模块域.md`
   - `PROJECT_KNOWLEDGE_DETAIL-升级模块域.md`
4. **每个分卷控制在 1000 行以内**
5. **BASE 中增加「分卷索引表」**：列出所有 DETAIL 分卷的文件名和内容范围
6. **每个分卷开头都加跳转链接**：「📖 返回索引请查阅 PROJECT_KNOWLEDGE_BASE.md」

---

### PUML 流程图文件（必须单独交付）

必须同时交付以下独立文件，存放在 `docs/knowledge-base/` 目录：
- **P0 必选 2 个**：`main_flow.puml`、`module_dependency.puml`
- **P1 根据标签激活 N 个**：例如有加密标签则交付 `security_flow.puml`，有协议标签则交付 `protocol_flow.puml` 等

**所有 PUML 文件必须：**
- 有完整的 `@startuml` / `@enduml`，可独立渲染
- 头部有元数据注释（项目名、图类型、生成时间、激活标签）
- 关键节点标注对应的源码文件路径
- 使用统一的 skinparam 样式模板

---

## 质量门槛（Quality Checklist）

> ⚠️ **执行完成后必须逐条自查，未通过检查的知识库需要返工**
> ⚠️ **任何一项不通过都不算完成！**

---

### 一、分层结构检查（所有深度模式必须通过）
- [ ] `PROJECT_KNOWLEDGE_BASE.md` 存在，内容是**核心索引层**
- [ ] `PROJECT_KNOWLEDGE_DETAIL.md` 存在，内容是**深度备查层**
- [ ] **BASE 只放了 TOP 10 工具，不是全量索引**（核心索引层不堆细节）
- [ ] **DETAIL 放了全量工具索引**，不是只放 TOP 10
- [ ] **BASE 只放了模块精简字典**（Top 20% 核心模块，一句话说明）
- [ ] **DETAIL 放了模块完整版字典**，含所有模块的所有导出函数
- [ ] BASE 底部有跳转链接：「📚 深度分析请查阅 PROJECT_KNOWLEDGE_DETAIL.md」
- [ ] DETAIL 顶部有反向链接：「📖 快速入门请查阅 PROJECT_KNOWLEDGE_BASE.md」
- [ ] **（超大项目）按业务域拆分了 DETAIL 分卷，BASE 中有分卷索引表**

---

### 二、基础内容检查（所有深度都需要满足）
- [ ] 构建文件已解析并给出技术栈版本证据
- [ ] **Phase 1.1 深度内容探查已执行**（每个自有模块都读取了内部源文件，不能只看目录名）
- [ ] BASE 中有模块精简字典（每个模块附带关键源文件清单）
- [ ] DETAIL 中有全量 Util/Helper 索引（递归搜索所有子目录）
- [ ] DETAIL 中有脚本与配置资产全索引（基于实际文件内容描述）
- [ ] DETAIL 中已初始化 `## 需求索引`
- [ ] DETAIL 中已初始化 `## 函数与接口变更索引`
- [ ] DETAIL 中已初始化 `## 更新记录`，且包含 `v1.0` 全量创建记录
- [ ] **Phase 4.1.1 配置交叉引用解析已执行**（每个被引用的配置文件都已实际读取，核心数据已提取到知识库，不能只在表格中写一句描述）
- [ ] **配置读取验证表已填写并全部通过**（所有"被引用文件是否已读取"列都是 ✅）
- [ ] BASE 中有重构建议（有证据、可落地）
- [ ] BASE 中有分析边界与假设说明

---

### 三、PUML 流程图专项检查（所有项目必须通过，**不通过即返工**）

> 🚨 **这是最高优先级的检查项！** 历史数据显示：超过 60% 的交付投诉来自 PUML 渲染失败。
>
> 建议：生成完所有 PUML 后，**先复制到 plantuml.com/plantuml 在线试渲染一遍**，确认无误再交付。

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 基础完整性 | - | |
| - [ ] | 至少生成了 2 个独立 .puml 文件 | main_flow.puml + module_dependency.puml 是底线 |
| - [ ] | 每个文件都有完整 @startuml / @enduml | 可独立渲染，不能缺头少尾 |
| - [ ] | 头部有标准元数据注释 | 项目名、图类型、生成时间、激活标签、变更记录 |
| - [ ] | 所有 .puml 存放在 `docs/knowledge-base/` 目录 | 路径正确 |
| | | |
| **Skinparam 语法检查** | - | **最常见的渲染失败原因** |
| - [ ] | skinparam 只有标准 6 行 | 不允许增加、删除、修改任何 skinparam |
| - [ ] | 没有 `skinparam xxx { ... }` 块语法 | 发现即返工 |
| - [ ] | 没有特定类型 skinparam | 如 rectangleBackgroundColor、participantBackgroundColor 等，全部要替换为通用 |
| | | |
| **高级语法黑名单检查** | - | **第二大常见渲染失败原因** |
| - [ ] | 没有 `box ... end box` 语法 | 时序图分组绝对不能用 box |
| - [ ] | participant/component 名称内没有 `\n` 换行 | 所有名称必须单行 |
| - [ ] | 没有 `hexagon` / `fork` / `split` / `group` / `partition` | 这些高级语法全部禁用 |
| - [ ] | 没有 `-[hidden]->` 等箭头修饰符 | 只用最基础的 `-->` |
| - [ ] | State 图内没有 `:xxx;` Activity 语法 | State/Activity 语法绝对不能混用 |
| - [ ] | State 图没有嵌套 | 所有 state 必须扁平化 |
| | | |
| **特殊字符检查** | - | **第三大常见渲染失败原因** |
| - [ ] | 没有任何 emoji 字符 | 🔄🔌🔐⚙️🛡️★ 等全部要移除 |
| - [ ] | 没有制表符（├ └ ─ │ 等） | 所有列表用普通 `-` 连字符 |
| - [ ] | 没有全角标点符号（、 。 ： ；） | 全部用半角 |
| | | |
| 内容质量检查 | - | |
| - [ ] | 所有流程图按照标签激活规则生成 | 有什么标签就生成什么图，不臆造 |
| - [ ] | 关键节点标注了对应的源码文件路径 | 方便用户定位代码 |
| - [ ] | BASE 中有独立的 "PUML 流程图索引" 章节 | |
| - [ ] | 索引章节包含完整的文件表格 | 文件名、流程类型、激活标签、简述 |
| - [ ] | ❌ 没有把所有流程塞进一个"综合大图" | 每个流程必须是独立文件 |
| - [ ] | ❌ 没有只在 markdown 嵌入代码块而不交付独立 .puml | 必须交付可独立渲染的文件 |

**快速自检命令（可选）：**
```bash
# 检查是否有 block 语法
grep -l "skinparam.*{" *.puml
# 检查是否有特殊字符
grep -P "[\x{1F300}-\x{1F9FF}]" *.puml
# 检查是否有 box 语法
grep -l "^box" *.puml
```

---

### 四、深度分析检查（所有深度都需要满足）
- [ ] DETAIL 中有启动入口分析
- [ ] DETAIL 中有完整的调用关系图
- [ ] DETAIL 中有 API 接口清单（Web 项目）
- [ ] DETAIL 中有所有关键配置项说明
- [ ] DETAIL 中有安全机制说明（如有相关标签）
- [ ] DETAIL 中有错误码体系说明
- [ ] DETAIL 中有状态机详解（如有相关标签）

---

## 输出风格（Output Style）

- 只用 Markdown
- 索引类章节优先用表格
- 结论先行，证据后置
- 不堆大段原始代码（避免噪音）

---

## 失败与降级策略（Failure Handling）

### 正常流程（默认）
- 所有项目（标准完整/尽量详尽）都默认采用**分层文件结构**，不是只有内容过多才拆分
- BASE + DETAIL 双文件是标配，不是可选

### 项目规模分级处理
| 项目规模 | 判定标准 | 交付策略 |
|---------|---------|---------|
| **小型项目** | 模块数 < 10 | BASE + DETAIL（单文件） |
| **中型项目** | 模块数 10-50 | BASE + DETAIL（单文件） |
| **大型项目** | 模块数 > 50 或 预估 DETAIL > 2000 行 | BASE + DETAIL（公共部分） + DETAIL-{模块域}.md（按业务域分卷） |
| **超大型项目** | 模块数 > 100 或 文件数 > 2000 | 第一阶段：先输出 BASE + PUML + 模块目录；<br>第二阶段：按模块域增量生成 DETAIL 分卷 |

### 特殊情况处理
- **权限不足无法读取部分目录**：在 BASE 的"分析边界"章节明确标出"无法扫描 X 目录，结果可能不完整"，继续处理可访问部分
- **缺少构建文件/证据**：标注"缺证据项"而不是猜测版本号
- **未找到任何工具类**：DETAIL 中明确写"未发现独立工具类"，留空表格不如明确说明
- **无流程图资产**：自动生成至少 2 个基础流程图（main_flow + module_dependency），不省略章节
- **PUML 渲染报错**：立即检查语法（是否漏了 @enduml、是否有语法错误），修复后重新生成
- **用户中断**：已生成的内容保留，下次继续从断点生成剩余部分


