# DevPilot 流程核心规则（SessionStart 自动注入）

> 本文件由 .claude/hooks/load-behavioral-system.sh 自动加载到每个会话。
> **完整规则详见 `$FRAMEWORK/CLAUDE.md`，本文件仅保留会话必须知道的硬规则，避免重复维护。**

---

## 1. 流程门控规则（FLOW GATE — 最高优先级，不可绕过）

1. 匹配到 DevPilot 关键字（需求/PRD/设计/代码实现/测试/需求变更）→ **必须先进入 DevPilot 流水线**，外部 Skill 不得抢占
2. 外部技能只能在阶段**内部**被调用，禁止替代流水线入口
3. DevPilot 流程 **无条件优先** 于 Superpowers 或任何外部技能匹配
4. 阶段内调用 Superpowers MUST 记录：触发阶段、使用 skill、输入材料、输出证据
5. Superpowers review / TDD / verification 门禁未通过时，MUST 停留当前阶段，不得进入下一阶段

> 优先级：**根 CLAUDE.md > 外部技能 > cicd-rules.md > 其他规则文件**

### 1.1 Superpowers 阶段内增强映射

| DevPilot 阶段 | 可叠加 Superpowers | 必需证据 |
|---------------|-------------------|----------|
| 任务3 需求分析 | brainstorming | 隐式假设、非功能需求、风险问题清单 |
| 任务4.5 接口契约先行 | brainstorming | endpoint、DTO、错误码、关键时序 |
| 任务5 软件设计 | brainstorming + writing-plans | 方案取舍、批次计划、回滚策略 |
| 任务6 代码实现 | test-driven-development | RED/GREEN/REFACTOR 和测试结果 |
| 调试 | systematic-debugging | 复现、定位、修复、回归验证 |
| 每批次完工 | requesting-code-review + receiving-code-review | review 结论和处理记录 |
| 任务8 前 | verification-before-completion | 测试命令、结果、残留风险 |

### 1.2 流程门控反模式与禁止行为（FLOW GATE ANTI-PATTERNS）

**以下行为在需求标识确认前绝对禁止：**

| 禁止行为 | 严重度 | 正确做法 |
|---------|:------:|---------|
| 在需求标识确认前读取任何源码文件（.lua/.py/.go/.ts 等） | 🔴 严重 | 先确认标识，创建 00 文件，再读代码 |
| 在需求标识确认前读取 `docs/{需求标识}/` 下的需求文档（00/01/02/03/05 等） | 🔴 严重 | 先确认标识，再读相关文档 |
| 读取 `docs/knowledge-base/` 下的知识库（BASE/DETAIL/PUML 等） | ✅ **允许** | 知识库可随时检索。当作**当前事实**前 MUST 先跑 `verify-kb-facts.js`，只引用 pass。不限制读源码 |
| 把 BASE/DETAIL 里的路径/符号/模块不经验证直接当事实 | 🔴 严重 | 先跑事实门控，只引用 `PROJECT_KNOWLEDGE_ADMITTED.md` / `query-admit.md` 的 pass |
| 跳过标识确认直接分析需求 | 🔴 严重 | 必须先建议标识，等用户确认 |
| 标识确认的同时并行读取代码 | 🟡 违规 | 标识确认是独立步骤，不与代码探索并行 |
| 不提示用户直接创建需求目录 | 🔴 严重 | 必须先展示标识建议，用户确认后再创建 |
| 在需求标识确认前执行 git log / git diff 探索变更 | 🟡 违规 | 先确认标识，再探索变更历史 |

**唯一例外**：用户在消息中已明确写出需求标识（如 `需求变更：mgmt-unicast-key-derivation xxx`），此时标识已确认，可直接进入分析。

**自检清单（每次检测到需求意图时必须先问自己）：**
1. 我是否已经向用户建议了需求标识？ 如否 → 立即建议
2. 用户是否已经确认了标识？ 如否 → 等待用户回复
3. 我是否已经创建了 00-原始需求.md + CHANGELOG.md？ 如否 → 先创建再继续
4. 进入步骤 ④ 需求分析前，是否已经跑过事实门控并读取准入结果？ 如否 -> 必须先跑 `verify-kb-facts.js --query` 再分析

---

## 2. 触发关键字

| 关键字 | 触发任务 | 说明 |
|-------|---------|------|
| `需求：` `需求 ` `需求分析` `需求分析：` `分析需求` | 任务3 需求分析 | 读取 DEVPILOT.md + DevPilot 委派指南 → 读 Agent 文件执行 |
| `生成PRD` `PRD` | 任务4 PRD | 同上 |
| `软件设计` `变更策略` | 任务5 设计 | 同上 |
| `代码实现` `开始编码` | 任务6 代码实现 | 同上 |
| `测试用例` `回归验证` | 任务7 测试用例 | 同上 |
| `测试报告` `运行测试` | 任务8 测试报告 | 同上 |
| `需求变更` `变更需求` `需求变更：` | 任务9 需求变更 | 同上 |
| `知识库更新` `更新知识库` | 任务8.5 知识库更新 | 走 jit-project-knowledge-base-update |
| `知识库验真` `事实门控` `准入知识` | 知识库事实门控 | 走 jit-project-knowledge-fact-gate |
| `生成知识库` `项目知识库` `PROJECT_KNOWLEDGE_BASE` | 任务2 知识库 | 走 jit-project-knowledge-base |
| `查看状态` | 项目状态 | 走 jit-project-devpilot-status |
| `激活DevPilot` `启动流水线` `devpilot` | 激活 DevPilot | 走 jit-devpilot-init |

> **确认规则**：明确为功能开发/代码修改 → 直接进入流水线。意图模糊（检查、审计、扫描等）→ 提示用户确认是否走流水线。

---

## 3. 输出路径规则（最高优先级）

- 所有文档输出到 **目标项目目录**，绝不输出到框架目录
- 一个需求一个目录：`[目标项目]/docs/{需求标识}/`
- 知识库共享：`[目标项目]/docs/knowledge-base/`
- 测试代码：`[目标项目]/tests/{需求标识}/`

### 3.1 目标项目路径

> **核心原则：目标项目路径只需指定一次，后续自动继承。能自动识别就不问用户。**

**首次触发规则：**
- 触发 DevPilot 关键字时，按以下优先级确定目标项目：
  1. 用户在本会话中已指定过 → **自动继承，不再询问**
  2. 用户当前工作目录**不是**框架目录 → **自动识别为候选项目路径**，提示用户确认："检测到当前目录为 `<路径>`，是否作为目标项目？"
  3. 以上都不满足 → 询问用户："请提供目标项目路径（如 `目标项目：D:\my-app`）"
- 路径确认后，AI 在本次会话中**永久记住**，后续所有阶段自动使用

**示例：**
```
# 首次（在框架目录启动 claude，未指定过目标项目）
用户: 需求分析：用户登录模块
AI:   请提供目标项目路径（如 目标项目：D:\my-app）

# 首次（在项目目录启动 claude）
用户: /jit-devpilot-init
AI:   检测到当前目录为 D:\my-app，是否作为目标项目？
用户: 是

# 后续（目标项目已确认）
用户: 需求分析：用户登录模块
AI:   [目标项目 D:\my-app 已记住] 需求标识建议：user-login...
```

### 3.2 需求目录冲突
- 若 `[目标项目]/docs/{需求标识}/` 已存在，**必须提示用户**：
  "⚠️ 需求目录 `docs/{需求标识}/` 已存在。请选择：1) 继续使用现有目录（增量追加）2) 更换需求标识 3) 覆盖现有目录（将丢失原有文档）"
- 用户明确选择前，不得写入任何文件

---

## 4. 任务3 执行顺序（MUST — 强制，不可调换，不可跳过）

**每一步都是阻塞的，必须等待用户确认后才能进行下一步。**

```
检测到需求意图
    │
    ▼
① 建议需求标识（AI MUST 根据描述自动建议 kebab-case 英文标识）
    │  MUST: 只建议标识，不做任何代码读取、文档读取、git 操作
    │  MUST: 等待用户回复确认
    │
    ▼
② 用户确认标识（用户可能调整，AI MUST 等待用户明确确认）
    │
    ▼
③ 创建 00-原始需求.md + CHANGELOG.md（MUST 先于一切分析工作）
    │  MUST: 在所有 Read/Glob/Grep/git 操作之前完成
    │
    ▼
④ 需求分析（按 S/M/L 级别控制深度）
    │  ④.1 先做知识库事实门控，再读知识库（MUST）：
    │      - 运行 node "$FRAMEWORK/skills/jit-project-knowledge-fact-gate/scripts/verify-kb-facts.js" "<目标项目>" --query "<当前需求关键词>"
    │      - 只把 PROJECT_KNOWLEDGE_ADMITTED.md / .verified/query-admit.md 的 pass 当当前事实
    │      - fail 禁止当事实；需要时下钻源码
    │      - docs/knowledge-base/PROJECT_KNOWLEDGE_BASE.md（结构线索，路径/符号以准入为准）
    │      - docs/knowledge-base/PROJECT_KNOWLEDGE_DETAIL.md（模块线索，同上）
    │      - 相关 PUML 流程图（按需求涉及模块选择）
    │      - 同领域专题文档（如 CRYPTO_INTL.md / PBKDF2_KEY_DERIVATION.md，按需求关键词匹配）
    │  ④.2 然后读相关源码和需求文档
    │  注：知识库读取不受需求标识门控限制；事实门控不限制读源码
    │
    ▼
⑤ 🔴 分级评估 → 用户确认级别 → 按级别进入后续阶段
```

> **00-原始需求.md MUST 在需求标识确认后立刻创建，在所有分析工作之前。**
> 分级评估在需求分析过程中/之后进行，分析深度由初步判断的级别指导，最终级别由用户确认。
> **违反执行顺序（如在步骤①-③完成前读取代码）视为流程违规，必须立即中止并回到步骤①。**

---

## 5. 原始需求记录模板

需求标识确认后立即创建 `[目标项目]/docs/{需求标识}/00-原始需求.md` 和 `[目标项目]/docs/{需求标识}/CHANGELOG.md`：

**00-原始需求.md：**

```
# 原始需求记录

## 基本信息
| 字段 | 内容 |
|------|------|
| 需求标识 | {requirement-id} |
| 需求中文名 | {用户的中文需求描述} |
| 记录时间 | YYYY-MM-DD HH:MM |
| 目标项目 | {绝对路径} |
| 变更级别 | （待分级后填写） |

## 原始需求描述
（用户输入的原始自然语言需求，逐字保留，不修改不概括）

## 澄清记录
（需求分析阶段用户对AI疑问的澄清回答，逐条记录）
```

> **变更记录**：如果后续发生需求变更（任务9），在 `CHANGELOG.md` 中追加变更记录，不在 00-原始需求.md 内重复。

**CHANGELOG.md：**

```
# 变更记录

## 知识库锚点

> 任务 3 需求分析阶段填写，任务 8.5 完成时更新。**唯一写入位置**，不在 00/01/02/03 等开发文档内重复。

- 知识库版本：（待填写，如 vX.Y）
- 涉及模块域：（待填写）
- 关联流程图：（待填写，如 ota_flow.puml）
- 预计变更：（待填写）
- 详见：[PROJECT_KNOWLEDGE_DETAIL.md](../knowledge-base/PROJECT_KNOWLEDGE_DETAIL.md)

## 变更1：初始需求
- 状态：✅ 已完成
- 日期：YYYY-MM-DD
- 影响阶段：全部
- 说明：初始需求创建
```

---

## 6. 需求标识规则

1. AI MUST 根据需求描述自动建议英文标识（kebab-case）
2. **MUST 提示用户确认**，用户确认后才创建目录
3. 示例：`需求【用户登录模块】英文标识建议：user-login，是否需要调整？`
4. **MUST 等待用户回复**：在用户明确确认或调整标识之前，不得进入下一步
5. 标识确认后，MUST 立即创建 `docs/{标识}/00-原始需求.md` 和 `docs/{标识}/CHANGELOG.md`，然后才允许读取代码

---

## 7. 分级判定

| 级别 | 判定 | 流程差异 |
|------|------|---------|
| S | ≤3 文件 | 跳 PRD、设计、测试用例 |
| M | 4-15 文件或 2-3 模块 | TDD、完整流程 |
| L | >15 文件或跨模块 | change-strategy、回归清单 |

> 详细级别适配表见 `CLAUDE.md`

---

## 8. 知识库锚点规则

- 如果知识库存在，每个需求的 `CHANGELOG.md` 必须包含 `## 知识库锚点` section（版本、模块域、流程图、预计变更）
- 每个文档末尾必须包含变更记录表（版本、日期、变更范围、说明）

## 9. 流程闭环

测试报告完成 → **必须**执行知识库增量更新（不全量重扫）。

## 10. 推荐工具：CodeGraph

- `codegraph build` — 预生成依赖图，提升模块分析准确性
- `codegraph fn-impact <函数>` — 精确计算变更影响半径
- `codegraph dead-code` / `codegraph check` — 死代码检测 / CI门禁
- 安装：`npm install -g @optave/codegraph`（非必装，Node >= 22.12.0；知识库 Skill 在 CLI 可用时会自动 `codegraph build`）
- Windows 安装失败/残留修复：见 [docs/CodeGraph 安装指南.md](../docs/CodeGraph 安装指南.md)

## 11. 需求-知识库双向关联规则（MANDATORY）

**每次需求完成（测试报告后），MUST 更新 DETAIL 知识库，不只是加一行记录。**

### 11.1 更新内容（不止更新记录）

DETAIL 更新 MUST 包含以下三类内容：

| 类别 | 内容 | 示例 |
|------|------|------|
| **需求索引** | 追加/更新需求索引表一行 | 标识、中文名、级别、涉及模块、版本 |
| **模块描述** | 同步更新涉及模块的功能描述、函数列表、数据格式 | log_wrapper 新增 `get_ap_mac_str()`；beacon_exchange 新增 `read_kdf_EncKey_plain()` |
| **变更记录** | 追加更新记录行 | 版本、日期、变更范围、说明 |

**反模式**：只加一条更新记录，模块描述不更新 → 知识库变 stale，和历史一个效果。

### 11.2 知识库 → 需求：需求索引表

**需求索引表和变更记录 MUST 优先维护在 DETAIL 文件中**，遵循以下 fallback 规则：

```
DETAIL 存在？
  ├── 是 → 更新 DETAIL（需求索引 + 更新记录）
  └── 否 → 更新 BASE（需求索引 + 更新记录）
```

BASE vs DETAIL 职责划分：

| 文件 | 定位 | 更新频率 |
|------|------|:--:|
| `PROJECT_KNOWLEDGE_DETAIL.md` | 深度分析、API 清单、**需求索引、变更记录**（优先） | 每次需求完成 |
| `PROJECT_KNOWLEDGE_BASE.md` | 项目框架概览、架构、模块索引、技术栈 | 仅架构变更 / DETAIL 不存在时 fallback |

需求索引表格式（放在 DETAIL 末尾更新记录上方）：

```markdown
## 需求索引

| 需求标识 | 中文名 | 级别 | 涉及模块 | 完成版本 |
|---------|-------|:--:|---------|:--:|
| user-login | 用户登录模块 | S | login.lua, auth.lua | v6.1 |
```

- 新增需求：DETAIL 中追加索引行 + 更新记录行
- 变更需求：DETAIL 中更新"涉及模块"列
- BASE 只在架构/打包/部署等结构性变更时更新

### 11.3 需求 → 知识库：文档锚点

每个需求的 `CHANGELOG.md` MUST 包含 `## 知识库锚点` section，指向 DETAIL（**唯一写入位置**，不在 00/01/02/03 等开发文档内重复）：

```markdown
## 知识库锚点
- 知识库版本：vX.Y
- 涉及模块域：Phase 2 - 模块1, 模块2
- 关联需求：[[other-req-id]]
- 详见：[PROJECT_KNOWLEDGE_DETAIL.md](../knowledge-base/PROJECT_KNOWLEDGE_DETAIL.md)
```

### 11.4 更新时机

| 时机 | 更新文件 | 动作 |
|------|---------|------|
| S/M/L 流程完成 | DETAIL | 更新需求索引表 + 更新记录 |
| 需求变更完成 | DETAIL | 更新涉及模块列 |
| 架构/部署变更 | BASE | 更新对应 Phase 章节 |
| 知识库全量重建 | BASE + DETAIL | 同步所有锚点版本号 |

### 11.5 自检清单

需求完成时 MUST 确认：
- [ ] DETAIL 需求索引表已更新
- [ ] DETAIL 涉及模块的功能描述、函数列表、数据格式已同步更新
- [ ] DETAIL 更新记录已追加
- [ ] CHANGELOG.md 已添加 `## 知识库锚点` section（指向 DETAIL）
- [ ] BASE 无需更新（除非架构变更）
