# DevPilot 借鉴 Multica 能力方案留档

> 文档目的：记录 Multica（https://multica.ai/）相对 DevPilot 的能力差异，提炼 5 个可借鉴方向并给出改造路径。
> 留档时间：2026-07-15
> 对比基线：DevPilot v1.0.5.4 vs Multica 官网公开能力（GitHub: multica-ai/multica）

---

## 0. 背景与定位差异（必读）

DevPilot 和 Multica 不是竞品，是正交关系：

| 维度 | DevPilot | Multica |
|------|----------|---------|
| 本质 | 纵向文档驱动开发流水线 | 横向 agent 协作/调度平台 |
| 产物 | PRD / 设计 / 测试用例 / 知识库 | task 执行结果 / 活动时间线 |
| runtime 绑定 | 仅 Claude Code | 15 个 coding tool 可切换 |
| 形态 | Claude Code 会话内 Skill + Agent | Desktop App + CLI + Web + iOS |
| 解决问题 | 质量与可追溯 | 执行效率与编排 |

借鉴原则：**取编排层能力，不动文档驱动内核**。DevPilot 的流水线门控、S/M/L 分级、知识库三层结构是核心价值，不能为了像 Multica 而稀释。

---

## 1. 五个可借鉴点（按 ROI 排序）

### 借鉴点 1：Task 状态机 + 失败重试 + 超时兜底

**现状（DevPilot）**

DevPilot 通过 Task 工具委派 Agent，是 fire-and-forget 模式：
- 委派后只能等待返回，没有中间状态可见
- Agent 执行失败后只能用户手动重试
- 没有超时兜底，agent 卡死会拖死整个会话
- 多个独立 Task 并行时无法看到"哪个还在跑、哪个失败"

**Multica 做法**

明确的 Task 状态机：

```
Queued -> Dispatched -> Running -> Completed / Failed / Cancelled
```

- 超时规则：dispatched 5 分钟、running 2.5 小时
- 失败分类：
  - retryable：runtime_offline / runtime_recovery / timeout，最多重试 2 次
  - non-retryable：agent_error，不重试
- 失败原因可追溯，便于诊断

**借鉴方向**

1. 在 `.claude/hooks/` 加一个 task-tracking 脚本，记录 Task 委派的 start / end / status
2. Task 失败时自动重试一次（runtime 类失败），agent_error 类失败直接报告
3. 长时间无返回的 Task 输出超时提示，建议用户中止
4. 多 Task 并行时输出状态表

**预估成本**：低（主要是 hook 脚本 + 状态记录文件）

**风险**：
- Claude Code 的 Task 工具本身没有暴露状态接口，可能只能从 hook 间接观测
- 自动重试可能导致非幂等的 agent 操作产生副作用，需要标记 idempotent 等级

**ROI**：高。立竿见影改善"agent 卡死拖死会话"和"失败只能手动重试"两个高频痛点。

---

### 借鉴点 2：Autopilots（cron / webhook 触发的定时自主任务）

**现状（DevPilot）**

完全用户驱动：
- 用户输入 `生成PRD` / `代码实现` 等关键字触发
- 会话关闭即停止
- 无法定时跑（如每天 9 点跑回归测试）
- 无法被外部事件触发（如 GitHub PR 提交自动跑 code review）

**Multica 做法**

> "Autopilots are standing orders: cron or webhook triggered autonomous tasks."

- cron 定时触发：`multica autopilot trigger <id>`
- webhook 触发：GitHub / Slack / Lark 等事件
- REST API：`POST /api/issues/{id}/rerun`
- 适合"每日跑回归""PR 提交自动审查""定时同步知识库"等场景

**借鉴方向**

1. 提供一个 `jit-devpilot-autopilot` Skill，接受 cron 表达式和 DevPilot 命令
2. 用系统计划任务（Windows Task Scheduler / Linux cron）触发 `claude -p "需求分析：..."`
3. Webhook 入口：监听 GitHub PR 事件 -> 自动执行 code-review Skill
4. Autopilot 配置文件：`.claude/devpilot-autopilots.yml` 声明触发器和执行内容

**预估成本**：中。需要做 Skill 包装 + 外部触发器集成 + 配置文件解析。

**风险**：
- Autopilot 失败不自动重试（Multica 自己也是这设计），需要明确告警机制
- GitHub webhook 鉴权要做好，避免恶意触发
- 定时任务可能撞上正在跑的会话，需要锁机制

**ROI**：中高。解锁"夜间自动跑测试""PR 自动审查"等无人值守场景，是 DevPilot 从开发工具升级为平台能力的关键一步。

---

### 借鉴点 3：REST API + Webhook（外部系统可触发 DevPilot 阶段）

**现状（DevPilot）**

无 API、无 webhook：
- 无法从 CI/CD 触发 DevPilot 阶段
- 无法从 Slack / Lark / GitHub 触发流程
- 无法程序化集成到现有研发平台

**Multica 做法**

- REST API：`POST /api/issues/{id}/rerun`
- Webhook v1：bearer auth（HMAC 在路上）
- Channels 集成：Slack / Lark / GitHub 原生支持
- API token 管理

**借鉴方向**

1. 暴露本地 HTTP 端口（如 `localhost:7421`），提供：
   - `POST /devpilot/requirement` - 触发需求分析
   - `POST /devpilot/prd` - 触发 PRD 生成
   - `GET /devpilot/status/{requirement_id}` - 查询需求状态
2. Webhook 入口：接 GitHub / GitLab 事件，PR 提交自动跑 verification
3. CLI 包装：`devpilot trigger requirement --project D:\my-app --desc "..."`

**预估成本**：中高。需要起一个本地服务，做鉴权、路由、状态查询。

**风险**：
- 本地服务暴露端口有安全风险，必须做 token 鉴权
- Claude Code 会话是非长驻的，需要解决"会话不在跑时怎么触发"的问题（可能要起 daemon）
- 与借鉴点 2 强相关，建议合并实现

**ROI**：中。让 DevPilot 能融入研发流程链路，但实现成本不低，建议作为借鉴点 2 的后续扩展。

---

### 借鉴点 4：多 runtime 抽象（底层不只绑 Claude Code）

**现状（DevPilot）**

强绑定 Claude Code：
- 所有 Agent 定义在 `.claude/agents/*.md`
- Skill 通过 `~/.claude/skills/` 加载
- 行为规则由 Claude Code SessionStart hook 注入
- 换到 Cursor / Codex / Copilot 全部失效

**Multica 做法**

> "Multica ships with built-in support for 15 AI coding tools. They all implement the same interface - queue, dispatch, execute, return results."

- 统一接口：queue / dispatch / execute / return
- runtime 动态发现：本机装了什么 coding tool 自动注册
- agent 和 runtime 解耦：同一 agent 可以在不同 runtime 上跑

**借鉴方向**

1. 抽象 runtime adapter 层：
   - `claude-code-adapter`（现有）
   - `cursor-adapter`（待开发）
   - `codex-adapter`（待开发）
2. Agent 定义格式标准化：用与 runtime 无关的中间格式（如 YAML），由 adapter 翻译成各 runtime 的 agent 格式
3. 行为规则层抽象：CLAUDE.md / AGENTS.md / .cursorrules 等规则文件做同步生成

**预估成本**：高。需要重新设计 agent/skill 的存储格式，每个 runtime 都要写 adapter，工作量大。

**风险**：
- 不同 runtime 的能力差异大（Claude Code 有 hook、Cursor 没有；Claude Code 有 Skill、Codex 没有），抽象层容易漏特性
- 各 runtime 的 agent 格式演化快，adapter 维护成本高
- DevPilot 重度依赖 Claude Code 的 hook、Task、Skill 机制，迁移到弱能力 runtime 会损失功能

**ROI**：长期高，短期低。建议在 DevPilot 核心稳定后再考虑，且优先支持能力对等的 runtime（如 Codex）。

---

### 借鉴点 5：任务级 memory 隔离

**现状（DevPilot）**

会话级共享上下文：
- 一个会话内的所有 Task 委派共享同一上下文
- 前一个 Task 学到的"临时状态"会污染后续 Task
- 不同需求的对话容易串味（如需求 A 的澄清结果影响需求 B 的判断）
- 长会话后上下文膨胀，影响判断准确性

**Multica 做法**

> "Task memory is isolated per task: a fresh memories/ directory, plus the external memory.provider backend is disabled in the derived config, so neither on-disk notes nor a shared Supermemory/Hindsight-style bank crosses between tasks."

- 每个 task 独立 memories/ 目录
- 派生配置里关闭外部 memory provider
- 避免 cross-task 污染

**借鉴方向**

1. 每个 DevPilot 需求目录加一个 `.memory/` 子目录：
   ```
   docs/{需求标识}/
   ├── 00-原始需求.md
   ├── 01-requirements-analysis.md
   ├── .memory/          # 新增
   │   ├── clarifications.md
   │   ├── assumptions.md
   │   └── pending-questions.md
   ```
2. Task 委派时强制传入该需求的 `.memory/` 路径，agent 读写限定在该目录
3. 需求完成后 `.memory/` 归档，不带入下一个需求
4. 知识库（BASE/DETAIL）继续作为跨需求共享的事实源，与 `.memory/` 分离

**预估成本**：中。需要改 Agent 委派时的 prompt 模板，加 memory 路径约束。

**风险**：
- 过度隔离可能导致 agent 看不到必要的跨需求上下文（如本次变更依赖上次需求的实现）
- `.memory/` 目录的内容如何归档和检索需要设计
- 与现有知识库（PROJECT_KNOWLEDGE_DETAIL.md）的边界要划清，避免重复

**ROI**：中。改善长会话和多需求并行时的判断质量，但不是最痛点。

---

## 2. 优先级矩阵

| 借鉴点 | 实施成本 | 业务价值 | 风险 | 优先级 |
|--------|:--------:|:--------:|:----:|:------:|
| 1. Task 状态机 + 重试 + 超时 | 低 | 高 | 低 | P0 |
| 2. Autopilots（cron/webhook） | 中 | 中高 | 中 | P1 |
| 5. 任务级 memory 隔离 | 中 | 中 | 低 | P2 |
| 3. REST API + Webhook | 中高 | 中 | 中 | P3 |
| 4. 多 runtime 抽象 | 高 | 长期高 | 高 | P4 |

建议实施顺序：**1 -> 5 -> 2 -> 3 -> 4**

- 点 1 和点 5 都是 DevPilot 内部改造，不引入外部依赖，先做
- 点 2 解锁无人值守场景，价值密度高
- 点 3 是点 2 的自然延伸，做点 2 时一并设计
- 点 4 是战略级投入，等 DevPilot 核心稳定后再评估

---

## 3. 不要照搬的点（Multica 的局限）

借鉴不是全盘吸收，以下 Multica 的特性**不建议**引入 DevPilot：

1. **agent 自行创建 issue 能力**：Multica 允许 agent 运行中自行开新 issue。DevPilot 是文档驱动流水线，agent 自行开 issue 会破坏需求标识协议和阶段门控，导致流程失控。

2. **Skills 无沙箱直接导入**：Multica 采用 Anthropic Agent Skills 开放标准，但官网承认发生过 "ClawHavoc" 事故（恶意 Skill 偷 API key）。DevPilot 的 `jit-*` Skill 是自定义格式但受控，不要为了开放性放弃安全。

3. **Webhook v1 bearer-only**：Multica 自己也承认这设计有缺陷（HMAC 在路上）。如果 DevPilot 实现 webhook，直接上 HMAC + IP allowlist，不要走 bearer-only 弯路。

4. **agent 作为"teammate"营销概念**：Multica 把 agent 包装成有 profile 的"虚拟同事"。DevPilot 的 agent 是工具，不是同事；保持"工具理性"定位更利于质量门禁执行。

5. **完全去文档化的 task 驱动**：Multica 只有 issue/task，没有 PRD/设计/测试用例文档产出。DevPilot 的核心价值就是文档驱动质量门禁，**绝对不能**为了像 Multica 而放弃文档产出。

---

## 4. 结论

Multica 的优势集中在**横向编排能力**（runtime 抽象、task 状态机、queue、retry、超时、Autopilots、Squads）和**平台化能力**（GUI/CLI/mobile、API、webhook、self-host、开源生态）。

DevPilot 的优势集中在**纵向质量管控**（文档驱动、S/M/L 分级、知识库、流程门控、质量门禁）。

两者结合的理想形态：**DevPilot 作为流水线规则层，跑在 Multica（或类似编排平台）之上**。DevPilot 负责产出 PRD/设计/测试用例，Multica 负责把这些产出作为 task 派发给合适的 runtime 执行，并管理状态、重试、监控。

短期（P0-P2）建议聚焦内部改造，不引入外部依赖；中期（P3）评估接入编排平台；长期（P4）考虑 runtime 解绑。

---

## 附：信息来源

- [Multica 官网首页](https://multica.ai/)
- [Multica About](https://multica.ai/about)
- [Multica Docs](https://multica.ai/docs)
- [AI coding tools matrix](https://multica.ai/docs/providers)
- [Autopilots docs](https://multica.ai/docs/autopilots)
- [Skills docs](https://multica.ai/docs/skills)
- [Squads docs](https://multica.ai/docs/squads)
- [Tasks docs](https://multica.ai/docs/tasks)
- [GitHub: multica-ai/multica](https://github.com/multica-ai/multica)

## 变更记录

| 版本 | 日期 | 变更范围 | 说明 |
|------|------|----------|------|
| v1.0 | 2026-07-15 | 初始创建 | 基于 Multica 官网公开能力对比，提炼 5 个可借鉴点并给出改造路径 |
