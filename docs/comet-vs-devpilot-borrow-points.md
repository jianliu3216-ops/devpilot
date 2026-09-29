# DevPilot 借鉴 Comet 能力方案留档

> 文档目的：记录 Comet（https://github.com/rpamis/comet）相对 DevPilot 的能力差异，提炼 6 个可借鉴方向并给出改造路径。
> 留档时间：2026-08-19
> 对比基线：DevPilot v2.2.0 vs Comet 0.4.0-beta.7（GitHub: rpamis/comet，2795 stars，2026-05 创建，纯 Node/TypeScript，MIT）

---

## 0. 背景与定位差异（必读）

DevPilot 和 Comet 同属"Claude Code 里的 AI 开发流水线"，但走向不同：Comet 把流程做成了**机器状态机 + Skill 生态平台**，DevPilot 把流程做成了**文档驱动的方法论流水线**。

| 维度 | DevPilot | Comet |
|------|----------|-------|
| 本质 | 纵向文档驱动开发流水线（需求→PRD→设计→TDD→测试→报告→知识库） | Agent Skill 工作流 + Skill 评估/发布平台 |
| 内核 | 文档即状态（00-05 交付物即阶段证据） | 机器状态机（`.comet.yaml` + guard 脚本 + 审计日志） |
| 阶段推进 | 人工确认门控（每阶段等用户确认） | `auto_transition` 默认自动 + guard 脚本校验 |
| 变更分级 | S/M/L 三档自动适配流程 | 无显式分级，Classic 有 full/tweak/hotfix 预设 |
| 项目知识库 | 三层知识库（BASE/DETAIL/ADMITTED）+ 事实门控（代码预言机） | CodeGraph 索引，无结构化学识库 |
| Agent 体系 | 30+ 专用 agent（TDD / 质量门禁 / 变更分析等） | 无 agent 群，Classic 靠 OpenSpec + Superpowers Skills |
| Skill 评估 | 无 | Eval 平台（Rubric / Pass@k / Pass^k / LangSmith） |
| 可恢复性 | `continue-handoff` skill（提示词级） | `resume-probe` + run-state + 事务/锁（机器级） |
| 平台适配 | 仅 Claude Code | 34 个 AI 编码平台，runtime 纯 Node 去 Bash/WSL |
| 阶段产出 | PRD / 设计 / 测试用例 / 测试报告 等业务文档 | brief / spec / verification / plan 等工程工件 |
| 状态可视化 | `jit-project-devpilot-status`（CLI 文本） | `comet dashboard`（Web）+ `comet doctor` |
| Skill 发布 | 手工维护 jit-* Skill | `/comet-any` 创作 + `comet eval` 验证 + `comet publish` 分发 |

借鉴原则：**取机器校验层，不动文档驱动内核**。DevPilot 的文档交付物、S/M/L 分级、知识库事实门控、人工门控是核心价值，不能为了像 Comet 而稀释。

---

## 1. 六个可借鉴点（按 ROI 排序）

### 借鉴点 1：机器状态机 + 阶段守卫脚本（guard / state）

**现状（DevPilot）**

阶段推进完全靠提示词 + 人工确认：
- 没有机器可读的阶段状态文件，无法判断"当前需求进行到哪一步"
- "测试报告完成后才允许知识库更新"这类约束靠 prompt 软约束，agent 可跳过
- 阶段证据（测试报告、设计文档）是否真的存在，没有脚本校验

**Comet 做法**

一套 Node 脚本管状态与门禁：

```
comet-state.mjs      # agent 操作状态的唯一接口：init/set/get/check
comet-guard.mjs      # 阶段守卫：校验退出条件，--apply 自动更新 .comet.yaml
comet-yaml-validate.mjs  # schema 校验：必填字段、枚举、路径存在性、未知字段
```

- 每个 change 的 `.comet.yaml` 记录 `phase`、`verify_result`、`verification_report`、`branch_status`、`archived` 等
- 每次状态迁移追加审计事件到 `.comet/state-events.jsonl`（append-only，含 before/after 与字段变更）
- 阶段退出不靠 agent 说"done"，靠脚本检查证据

**借鉴方向**

1. 每个需求目录加一个 `state.yaml`，记录阶段、证据文件路径、级别、状态
2. 写一个 `devpilot-guard.mjs`：校验阶段前置/后置条件，如"进入知识库更新必须存在 05-test-report.md"
3. 状态迁移追加 `.devpilot/state-events.jsonl` 审计日志
4. 文档仍是人可读的事实源，`state.yaml` 只是机器镜像，两者由 guard 脚本同步

**预估成本**：低（一个 node 脚本 + 每需求一个小 YAML）

**风险**：
- 文档与 state.yaml 双轨可能失同步，需要 guard 脚本单向校验
- agent 需多一步写状态操作，可能被当作额外负担跳过——所以守卫要放在 hook 或阶段入口强制

**ROI**：高。把"阶段推进"从 prompt 软约束变成机器硬约束，是 DevPilot 最缺的一块。

---

### 借鉴点 2：验证证据门禁（不可自证 + 证据文件放行）

**现状（DevPilot）**

有 `completion-gate` agent 做阶段验收，但依赖 agent 自觉：
- 代码实现阶段的 agent 自己写代码、自己宣布完成，无独立复核
- "测试报告存在"不是硬条件，agent 可能口头确认就推进
- 验收项没有逐条 pass/fail 的证据记录

**Comet 做法**

- **Builder 不能自证**：Build 阶段提交 handoff，由 Runtime 跑必要检查后，交给一个**全新的 read-only Verifier** 复核
- **验收逐条**：Verifier 必须对每个 acceptance item 返回 passed / failed / blocked 之一；缺失、重复、未知项不能通过
- **证据硬门禁**：`verify-pass` 迁移要求 `verification_report` 指向**真实存在的文件** + `branch_status=handled`；两条件任一不满足即 `[HARD STOP]`
- 失败的证据会反馈给 Builder 带着具体 gap 回到 Build

**借鉴方向**

1. 强化 `completion-gate`：从"agent 自我评估"改为"证据文件必须存在"的脚本校验
2. 代码实现完成后，用一个新的 read-only Verifier agent（全新上下文）复核，避免自证
3. 验收标准逐条记录结果到 `04-test-cases.md` 或 state 文件，缺项不放行

**预估成本**：低-中（主要改 completion-gate 的 prompt + 加一个证据校验脚本）

**风险**：
- 独立 Verifier 会多一次 LLM 调用，成本略增
- 验收项未拆细时，Verifier 可能流于形式

**ROI**：高。直接解决"代码实现自说自话通过"的信任问题，和质量门禁目标一致。

---

### 借鉴点 3：可恢复运行 + 审计日志（resume）

**现状（DevPilot）**

- `continue-handoff` skill 是提示词级恢复：中断后 agent 要重读文档猜进度
- 长会话压缩后，agent 容易"忘了走到哪"，需要用户重新说明
- 无机器态可查询，`jit-project-devpilot-status` 只能扫文档目录猜

**Comet 做法**

三层可恢复架构：

```
.comet/current-change.json   # 当前归属（哪个 change 在写）
docs/comet/changes/<name>/comet-state.yaml   # 可移植状态：phase、Loop、验收结果、next action
.comet/runtime/native/       # 机器运行态：state.json、locks、transactions
.comet/state-events.jsonl    # append-only 审计日志
```

- `comet resume-probe`：只读探测，返回 auto_resume / ask_user / out_of_scope / none，再路由到正确入口
- 轻量恢复：中断后只重跑必要检查，不重跑 Shape/Build/已完成的 check
- 状态写入用原子写 + 短锁 + 可恢复事务，防半写损坏

**借鉴方向**

1. 每个需求目录加 `.run-state.json`（机器态）+ 追加式状态事件日志
2. `continue-handoff` skill 改造为优先读 run-state，而非重读全部文档
3. 需求目录加 `next-action` 字段，agent 恢复时直接看"下一步该干什么"

**预估成本**：中（run-state 格式 + 读写脚本 + continue-handoff 改造）

**风险**：
- run-state 与文档双轨，需定义清晰的主从关系（文档为主、run-state 为镜像）
- 多需求并行时，当前归属切换需要管理

**ROI**：中高。长会话/中断恢复是真实痛点，机器态比猜文档可靠得多。

---

### 借鉴点 4：Skill 科学评估平台（Eval：Rubric / Pass@k / Pass^k）

**现状（DevPilot）**

- 无任何 Skill 评估机制，jit-* Skill 质量靠人测
- 改了一个 Skill 不知道是变好还是变坏
- 无法用证据回答"这个 Skill 在标准任务上到底可不可靠"

**Comet 做法**

`comet eval` 回答一个朴素问题：**这个 Skill 在标准任务上是否稳定可用？**

- **Rubric**：结构化评分标准（LLM-as-judge 独立 agent，与主 agent 隔离凭据）
- **Pass@k / Pass^k**：多次运行的成功率 / 连续成功概率，作为演进证据
- 本地路径：`comet eval ./my-skill --collect` 静态检查 → `--html` 出报告
- 生产路径：`--suite langsmith` 与 LangSmith 同步，双 agent 架构在真实环境自动评估
- 报告区分失败归属：Skill / workflow / task / model / harness，避免误判

**借鉴方向**

1. 为 jit-* Skill 建一个轻量 rubric + 标准任务集（如"激活初始化→生成知识库→需求分析"冒烟任务）
2. 写一个 `jit-skill-eval` skill：跑 N 次标准任务，统计 Pass@k 与 rubric 得分，出 Markdown 报告
3. 不急着上 LangSmith，先本地跑，报告落 `docs/skill-eval/`
4. 知识库事实门控（verify-kb-facts.js）可作为"评估断言"的雏形扩展

**预估成本**：中（rubric 设计 + 任务集 + 评估脚本；评估任务集质量决定评估有效性）

**风险**：
- 评估任务集设计得不好，指标会失真（garbage in garbage out）
- 每次评估都要跑真实 agent，成本不低，需限定在 Skill 变更时触发

**ROI**：中高。让 DevPilot 从"经验驱动"走向"证据驱动"，与知识库事实门控一脉相承。

---

### 借鉴点 5：阶段间上下文压缩（handoff context compression）

**现状（DevPilot）**

阶段间把完整文档传给下一阶段：
- 需求分析 → PRD → 设计 → 实现，每步都带着全量前文
- 长需求（几十个需求点）在实现阶段上下文膨胀，token 高、判断易受干扰
- 没有 handoff 压缩机制

**Comet 做法**

Classic `context_compression: beta`：Design → Build handoff 时，用 **Design Doc + SHA256 哈希引用** 代替全量 spec 摘录，token 省 **25–30%**（官方基准：测试通过率 100% 不受影响，spec 覆盖率 100%→95%）。

- `comet-handoff.mjs` 生成确定性上下文包，SHA256 追踪防篡改
- `off` / `beta` 两档可配，压缩只影响 handoff 输入，不影响最终产物

**借鉴方向**

1. PRD → 设计、设计 → 实现 的 handoff 生成"压缩上下文包"：要点摘录 + 文档路径 + 哈希引用
2. 需要全文细节时再按需读原文档，而不是全量带过去
3. 可先用 `off`/`beta` 两档实验，量化 token 节省与正确率

**预估成本**：低-中（handoff 生成脚本 + 一档配置）

**风险**：
- 细节丢失（spec 覆盖率 100%→95%），边界场景需注意
- 哈希引用要求文档不可中途乱改，否则 hash 对不上

**ROI**：中。省 token、提速、长需求更稳，是纯收益型改造。

---

### 借鉴点 6：Skill 创作 / 发布平台（/comet-any + bundle + publish）

**现状（DevPilot）**

- jit-* Skill 全部手工维护：写 SKILL.md、写脚本、手动复制进 `~/.claude/skills/`
- 无创作辅助、无验证、无分发
- 换机器或给团队分发只能手动拷贝

**Comet 做法**

- `/comet-any`：描述你的 Skill 需求，agent 自动补齐 hooks、rules、scripts、引用文件，产出可复用 Skill
- `comet eval`：创作后立即验证
- `comet publish distribute`：一键把 Skill 打包成 Bundle 分发到多个平台，支持中/英双语变体
- `domains/bundle/`：authoring / compiler / distribute / publish / validate 全套

**借鉴方向**

1. 提供一个 `jit-skill-creator` skill：半自动生成 jit-* Skill（SKILL.md + 脚本骨架 + 校验）
2. 定义轻量 bundle 目录规范（如 `skills/<name>/SKILL.md + scripts/ + reference/`），配校验脚本
3. 先只支持 Claude Code 分发，不追 34 平台

**预估成本**：中高（创作辅助 + bundle 规范 + 分发脚本）

**风险**：
- bundle 跨平台格式复杂度高，起步只做 Claude Code 可避免
- Skill 自动创作质量不稳，需 eval 门禁兜底

**ROI**：中。把"手工维护 Skill"变成"平台化创作"，长期价值高但短期投入大。

---

## 2. 优先级矩阵

| 借鉴点 | 实施成本 | 业务价值 | 风险 | 优先级 |
|--------|:--------:|:--------:|:----:|:------:|
| 1. 机器状态机 + 阶段守卫 | 低 | 高 | 低 | P0 |
| 2. 验证证据门禁 | 低-中 | 高 | 低 | P0 |
| 3. 可恢复运行 + 审计日志 | 中 | 中高 | 中 | P1 |
| 4. Skill 科学评估（Eval） | 中 | 中高 | 中 | P1 |
| 5. 阶段间上下文压缩 | 低-中 | 中 | 低 | P2 |
| 6. Skill 创作/发布平台 | 中高 | 中 | 中 | P3 |

建议实施顺序：**1 -> 2 -> 5 -> 3 -> 4 -> 6**

- 点 1、2 是 DevPilot 内部改造，不引入外部依赖，先做——把阶段推进和验收从"软约束"变成"硬证据"
- 点 5 是纯收益型（省 token），成本低，可插在 P0 之间顺手做
- 点 3 依赖点 1 的 state 基础，排在状态机之后
- 点 4 让 Skill 演进有证据，是能力升级但不是当前痛点
- 点 6 投入大，等核心稳定后评估

---

## 3. 不要照搬的点（Comet 的局限）

借鉴不是全盘吸收，以下 Comet 的特性**不建议**引入 DevPilot：

1. **`auto_transition` 默认自动跳阶段**：Comet 默认阶段完成后自动调用下一 Skill。DevPilot 的人工确认门控是明确的核心价值，**不能自动推进**。可借鉴的是"状态推进与 Skill 调用分离"——状态机器推进，但调用仍等用户确认。

2. **Native 无文档驱动路径**：Comet Native 的 Shape→Build→Verify→Archive 轻量路径不产出 PRD/设计/用例文档。若 DevPilot 引入"完全无文档产出"的模式，会稀释文档驱动核心价值（与 multica 对比时的结论一致）。DevPilot 的 S 级"简要分析 + 直接改"已经是轻量化的正确姿势，不必再造一个 Native。

3. **双 workflow 双状态轨**：Comet 同时维护 Native / Classic 两套状态 schema、目录、Guard。DevPilot 单一流水线更简单可靠，不要为了"适配强模型/弱模型"引入双轨。

4. **34 平台抽象工程**：Comet 为跨平台做了 bundle compiler、platform-install、per-platform Skill 目录等大量复杂度，甚至把 runtime 全 TS 化以去 Bash/WSL。DevPilot 聚焦 Claude Code，复刻这套抽象纯属浪费。

5. **机器独占状态写入**：Comet 要求 agent 必须走 `comet-state.mjs`、不能手改 `.comet.yaml`。DevPilot 文档即状态、人可读可改，强制机器独占写入会增加摩擦。取其"guard 校验"即可，不必取其"独占写入"。

6. **Skill 自动创作无沙箱风险**：Comet 的 `/comet-any` 自动生成 Skill 并安装 hooks/scripts，若生成的脚本不可信会有执行风险。DevPilot 引入创作平台时必须加校验门禁，不能盲信自动产出。

---

## 4. 结论

Comet 是**"产品化"的 Agent 工作流平台**：优势集中在机器状态机、可恢复性、Skill 科学评估、Skill 创作/发布生态、多平台适配。它的 2795 stars 和快速增长说明"把流程做成机器可校验的工程"是行业方向。

DevPilot 是**"方法论化"的文档驱动流水线**：优势集中在文档交付物（PRD/设计/测试用例/报告）、S/M/L 分级、三层知识库 + 事实门控、30+ 专用 agent、人工门控。这些是 Comet 没有或较弱的。

两者不冲突，理想形态是 **DevPilot 保持文档驱动内核，借鉴 Comet 的机器校验层**：用状态机 + 守卫 + 证据门禁把 DevPilot 的阶段推进从 prompt 软约束升级为机器硬约束，用可恢复机制解决长会话痛点，用轻量 Eval 让 Skill 演进有证据。

短期（P0-P2）聚焦内部改造（状态机、证据门禁、上下文压缩、可恢复），不引入外部依赖；中期（P1）上轻量 Skill 评估；长期（P3）评估 Skill 创作/发布平台。

---

## 附：信息来源

- [Comet GitHub 仓库](https://github.com/rpamis/comet)（README 全文、git trees 目录结构）
- [Comet 官方文档](https://docs.comet.rpamis.com)
- [Comet vs Industry 对比](https://docs.comet.rpamis.com/zh/tech-blog/comet-vs-industry)
- [Comet Native vs 0.4.0 Classic 真实评估](https://docs.comet.rpamis.com/zh/eval/comet-native-vs-040-experiment)（Token -76.8%、Agent rounds -57.4%、时间 -47.4%、pass^3 87.5%）
- GitHub API：`https://api.github.com/repos/rpamis/comet`（元数据：语言 JavaScript、2795 stars、MIT、2026-05 创建）

## 采纳记录（2026-08-19）

评审 6 个可借鉴点后的决策，已落实到框架 v2.2.0：

| 借鉴点 | 决策 | 落地情况 |
|--------|------|----------|
| 4. Skill 科学评估（Eval） | ✅ 采纳，轻量版 | `skills/jit-skill-eval/`：静态检查 + LLM 冒烟，HTML 报告到 `docs/skill-eval/`；手动触发不自动跑 |
| 5. 阶段间上下文压缩 | ✅ 采纳 | `skills/jit-context-compress/`：compress-handoff.js 生成 `.handoff/{阶段}.context.md`（章节骨架+要点+SHA256+下钻建议），哈希复用 |
| 1. 机器状态机 + 阶段守卫 | ⏸️ 暂缓 | 只做"证据存在性检查"的薄版（未做完整状态机），待核心稳定后评估 |
| 2. 验证证据门禁 | ⏸️ 部分已有 | DevPilot 已有 `completion-gate`（独立验证），补"证据文件硬校验"暂缓 |
| 3. 可恢复运行 + 审计日志 | ❌ 砍掉 | 用户判定增加复杂度，且不做点1状态机则审计日志无意义 |
| 6. Skill 创作/发布平台 | ⏸️ 未排期 | 投入大，等核心稳定后评估 |

## 变更记录

| 版本 | 日期 | 变更范围 | 说明 |
|------|------|----------|------|
| v1.1 | 2026-08-19 | 采纳记录 | 标记点4/点5 已落地为 `jit-skill-eval`、`jit-context-compress`；点1/2 暂缓；点3 砍掉；点6 未排期 |
| v1.0 | 2026-08-19 | 初始创建 | 基于 Comet 0.4.0-beta.7 README 与仓库结构对比，提炼 6 个可借鉴点并给出改造路径 |
