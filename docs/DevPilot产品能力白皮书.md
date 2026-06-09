# Autopilot 产品能力白皮书

> v1.0.1.6 | 2026-06-08

---

## 一、产品定位

**Autopilot**（产品名 DevPilot）是一套基于 Claude Code 的 AI 辅助开发智能流水线框架，实现从自然语言需求到代码交付的全流程自动化。核心设计是"**共用框架 + 多项目分离产出**"——框架目录不存放业务代码，所有产出输出到目标项目。

---

## 二、核心指标

| 指标 | 数值 |
|------|------|
| 当前版本 | **1.0.1.6** |
| 已注册 Skills | **15 个** |
| Agent 定义 | **30 个** |
| Hook 脚本 | **6 个** |

---

## 三、六大核心能力

### 1. 智能流水线（9 阶段，严格有序）

```
任务2 → 任务3 → 任务4 → 任务5 → 任务6 → 任务7 → 任务8 → 任务8.5
知识库    需求     PRD     设计     代码     测试     测试     知识库
生成      分析                     实现     用例     报告     增量更新
```

| 阶段 | 能力 | 产出物 |
|------|------|--------|
| 任务2 知识库生成 | 对历史项目全量扫描，生成结构化知识文档 | `PROJECT_KNOWLEDGE_BASE.md` + `DETAIL.md` |
| 任务3 需求分析 | 自然语言→结构化需求文档，**先记录 `00-原始需求.md` 永久保存用户原始输入**，自动评估 S/M/L 级别 | `00-原始需求.md` + `01-requirements-analysis.md` |
| 任务4 PRD | 生成含用户故事、功能规格、验收标准的 PRD | `02-prd.md` |
| 任务5 软件设计 | S/M 级走架构设计，L 级走变更策略 | `03-software-design.md` 或 `03-change-strategy.md` |
| 任务6 代码实现 | **S级直接改码 / M级TDD / L级分批执行** | 目标项目源码 + 测试代码 |
| 任务7 测试用例 | M级标准用例，L级回归验证清单，S级跳过 | `04-test-cases.md` 或 `04-regression-checklist.md` |
| 任务8 测试报告 | 执行测试、统计结果、覆盖率分析 | `05-test-report.md` |
| 任务8.5 知识库更新 | 流程闭环，**增量更新**（不全量重扫） | 更新知识库对应章节 |
| 任务9 需求变更 | 描述变更 → AI 影响分析 → 增量重做受影响阶段 | 增量更新文档 + 代码 |

**关键特性**：
- 每个阶段产出需人工确认后才进入下一阶段
- 知识库贯穿全流程：所有后续阶段自动带上知识库作为参考
- 需求标识自动建议（中文→英文 kebab-case），必须用户确认
- **原始需求永久记录**：需求标识确认后立即生成 `00-原始需求.md`，用户原始输入逐字保留，避免流程走完后忘记最初需求

---

### 2. 三级变更分级机制（S/M/L 自动适配）

| 级别 | 判定条件 | 流程 | 典型场景 |
|------|----------|------|----------|
| **S** | ≤3 文件，逻辑简单 | 简要分析 → 直接改码 → 简要报告 | 新增字段、改常量 |
| **M** | 4-15 文件 或 2-3 模块 | 完整 6 阶段标准流程 | 新增功能模块 |
| **L** | >15 文件 或 跨模块全局变更 | 策略文档 → 分批执行 → 回归验证 | 框架升级、批量重构 |

**强制规则**：
- 用户不指定级别时，AI 必须自动评估并等用户确认
- 级别只能升级，不能降级
- 不能跳过分级直接执行

---

### 3. 四种触发方式

| 方式 | 机制 | 示例 |
|------|------|------|
| **自然语言关键字** | 识别"需求分析""生成PRD"等关键字 | `需求分析：用户登录模块，目标项目：D:\my-app` |
| **Skill 命令（/ 开头）** | Tab 可发现 | `/jit-devpilot-init`、`/jit-project-knowledge-base` |
| **传统任务编号** | 向后兼容 | `执行任务6` |
| **UI 前端文件自动激活** | 编辑 `.html/.vue/.tsx` 等时自动激活 `jit-ui-ux-pro-max` | — |

---

### 4. 知识库三层体系

| 层级 | 文件 | 更新频率 | 定位 |
|------|------|---------|------|
| **P0 最高** | `*.puml` 流程图 | 实时（代码流程变了先更图） | 流程事实标准 |
| **P1** | `PROJECT_KNOWLEDGE_DETAIL-*.md` | 中频（核心模块变更时） | 深度备查手册 |
| **P2** | `PROJECT_KNOWLEDGE_BASE.md` | 低频（重大架构变更时） | 快速入门索引 |

配套规则：
- 所有开发文档必须包含「知识库锚点」章节
- 增量更新，禁止全量重写
- PUML 固定格式（统一 skinparam + 变更记录倒序）
- 代码合并前必须先完成知识库更新

---

### 5. 全局任意目录激活（jit-devpilot-init）

安装后将框架路径写入 `~/.claude/devpilot-framework-path`，用户在任何目录输入 `/jit-devpilot-init` 即可激活完整流水线，无需 cd 到框架目录。激活后展示全部可用 Skill 命令清单，用户可按需执行 `/jit-project-autopilot-status` 扫描项目状态或直接使用自然语言开始工作。

---

### 6. UI/UX 智能增强（jit-ui-ux-pro-max）

- **67 种设计风格**（glassmorphism, brutalism, minimalism 等）
- **96 套配色**、**57 种字体配对**、**25 种图表**
- 覆盖 **13 个技术栈**（React, Vue, Svelte, Flutter, SwiftUI, Tailwind, shadcn/ui 等）
- 前端文件编辑时**自动激活**

---

## 四、技术架构

### Hook 系统（6 个）

| 钩子 | 触发时机 | 作用 |
|------|----------|------|
| `load-behavioral-system.sh` | SessionStart | 注入 Autopilot 规则 + DECISION.md 到每个会话 |
| `block-destructive-commands.sh` | PreToolUse(Bash) | 阻止破坏性命令 |
| `directive-enforcer.sh` | PreToolUse(Write/Edit) | 确保输出到目标项目目录 |
| `collective-metrics.sh` | PreToolUse + PostToolUse | 收集 Agent 执行指标 |
| `test-driven-handoff.sh` | PostToolUse(Task) + SubagentStop | TDD 交接验证 |
| `routing-executor.sh` | — | 路由执行 |

### Agent 体系（30 个专业 Agent）

| 类别 | Agent | 数量 |
|------|-------|------|
| 流程编排 | task-orchestrator, task-executor, workflow-agent, routing-agent | 4 |
| 需求/PRD | prd-research-agent, prd-agent, prd-mvp | 3 |
| 代码实现 | feature-implementation-agent, component-implementation-agent, testing-implementation-agent, infrastructure-implementation-agent | 4 |
| 质量控制 | quality-agent, enhanced-quality-gate, tdd-validation-agent, task-checker, completion-gate, readiness-gate | 6 |
| 测试验证 | functional-testing-agent | 1 |
| DevOps | devops-agent, npx-package-agent | 2 |
| 系统/元能力 | behavioral-transformation-agent, command-system-agent, dynamic-agent-creator, hook-integration-agent, van-maintenance-agent, metrics-collection-agent, polish-implementation-agent | 7 |

### 目标项目产出结构

```
目标项目/
├── docs/
│   ├── knowledge-base/           # 项目知识库（共享，增量更新）
│   ├── user-login/               # 需求A：独立目录
│   │   ├── 00-原始需求.md            # 先于01创建，永久保存
│   │   ├── 01-requirements-analysis.md
│   │   ├── 02-prd.md
│   │   ├── 03-software-design.md
│   │   ├── 04-test-cases.md
│   │   ├── 05-test-report.md
│   │   └── CHANGELOG.md
│   └── message-push/             # 需求B：完全隔离
├── tests/
│   ├── user-login/               # 需求A测试代码
│   └── message-push/
└── (项目源代码...)
```

---

## 五、依赖要求

| 依赖 | 要求 | 说明 |
|------|------|------|
| Node.js | >= 18 | 硬性依赖 |
| git | 任意版本 | 硬性依赖 |
| Claude Code CLI | 最新版 | 硬性依赖 |
| Python 3 | 可选 | jit-ui-ux-pro-max 搜索功能需要 |
| CodeGraph | 可选 | Node >= 22.6，代码图谱分析 |
| Node 工具包 | 可选 | docx, xlsx, pdf-parse, mammoth |

---

## 六、安装与启动

```bash
# 安装
git clone <仓库地址> claude-code-autopilot
cd claude-code-autopilot
bash install.sh --tools

# 启动
claude    # 在框架目录下启动，自动激活
# 或任意目录输入 /jit-devpilot-init
```

---

## 七、场景流程

### 场景1：正常需求实现

```
需求分析 → 分级确认 → PRD → 设计 → 代码实现 → 测试用例 → 测试报告 → 知识库更新
```

### 场景2：需求变更

```
描述变更 → 影响分析+分级 → 确认范围 → 按级别执行 → 知识库更新
```

---

## 八、文件索引

| 文件 | 用途 |
|------|------|
| `README.md` | 完整流程说明（AI 规则书） |
| `CLAUDE.md` | 项目行为规则（流程触发、变更分级） |
| `快速入门.md` | 用户快速入门指南 |
| `install.sh` | 一键安装脚本 |
| `uninstall.sh` | 卸载脚本 |
| `VERSION` | 版本号 |
| `docs/DevPilot产品能力白皮书.md` | 本文件 — 产品能力白皮书 |
| `docs/DIRECTORY_STRUCTURE.md` | 完整目录结构说明 |
| `docs/KNOWLEDGE_BASE_RULES.md` | 知识库贯穿规则（7条强制规则） |
| `docs/定制与拓展.md` | 二次开发指南（定制 Skill/Agent/Hook） |
| `.claude-collective/cicd-rules.md` | Autopilot 核心规则（SessionStart 注入） |
| `.claude-collective/DECISION.md` | 全局决策引擎（自动委托基础设施） |
