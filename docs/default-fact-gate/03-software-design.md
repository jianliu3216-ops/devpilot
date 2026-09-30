# 03 软件设计：默认瘦上下文（default-fact-gate）

- 日期：2026-09-30
- 级别：M
- 上游：`02-prd.md`（US1–US3 / FR1–FR4 / AC1–AC7）
- 上下文：`.handoff/design.context.md`

## 1. 架构视图

不新增组件，只强化规则层与 Skill 声明层：

```text
CLAUDE.md（注入法律 = 唯一事实源）
  ├─ cicd-rules.md §4（任务3–9 门控顺序，引用法律）
  ├─ fact-gate SKILL（切片唯一可注入声明）
  ├─ compress SKILL（禁复读声明）
  ├─ DEVPILOT.md（S 级条款对齐分级表）
  └─ requirements-analysis-agent（④.1 禁令一句）
```

## 2. 模块划分

| 模块 | 文件 | 改动 |
|------|------|------|
| D1 法律条文章节 | `CLAUDE.md` | 分级规则后新增「## 注入法律（CONTEXT INJECTION LAW）」小节，含 L1/L2/L3 |
| D2 门控范围 | `.claude-collective/cicd-rules.md` | §4 标题与内容扩为任务 3/4/5/6/9 |
| D3 切片声明 | `skills/jit-project-knowledge-fact-gate/SKILL.md` | 「做什么」节追加唯一可注入声明 |
| D4 禁复读声明 | `skills/jit-context-compress/SKILL.md` | 触发节追加硬禁令 |
| D5 S 级条款 | `DEVPILOT.md` | 分级表下方追加成文条款 |
| D6 agent 禁令 | `.claude/agents/requirements-analysis-agent.md` | 步骤 ④.1 追加一句 |

## 3. 关键设计

### 3.1 D1 注入法律条文（照抄进 CLAUDE.md，分级规则之后）

```markdown
## 注入法律（CONTEXT INJECTION LAW — 任何阶段不得违反）

**L1 知识库注入形态**：任务 3/4/5/6/9 在把知识库内容当「当前事实」引用前，MUST 已运行
`node "$FRAMEWORK/skills/jit-project-knowledge-fact-gate/scripts/verify-kb-facts.js" "<目标项目>" --query "<任务关键词>"`
且只引用 ADMITTED / `.verified/query-admit.md` 的 **pass** 断言。
**禁止**将 PROJECT_KNOWLEDGE_BASE.md / PROJECT_KNOWLEDGE_DETAIL*.md 全文或大段贴进上下文；BASE/DETAIL 仅作检索线索（先检索定位 → 再门控 → 再按需打开单个源码文件）。

**L2 阶段推进压缩**：进入新阶段前 MUST 运行 `compress-handoff.js`（哈希未变自动复用），只读 `.handoff/*.context.md` + 按「按需下钻建议」打开章节；**禁止**全文复读 01/02/03/04/05 任一前序文档。

**L3 S 级纪律**：用户确认 S 后跳过 02/03/04；代码实现后仅出简要测试报告（必含：改动点清单、验证命令与结果、残留风险）+ 知识库增量。**模型禁止以质量为由自行升级级别**；仅当后续发现影响扩大时提示用户确认升级（只升不降）。
```

冲突澄清（写进法律末行）：原「必读清单」语义 = 检索线索 + 先门控；与本法律冲突时以法律为准。

### 3.2 D2 cicd-rules §4 扩展

标题「任务3 执行顺序」下 ④.1 事实门控说明扩为：「任务 3/4/5/6/9 在引用知识库事实前 MUST 带 --query；任务3 在步骤 ④ 必跑」；反模式表（§1.2）加一行「贴 BASE/DETAIL 整本/大段 → 🔴 → 改为 pass 切片 + 按需下钻」。

### 3.3 D3 fact-gate SKILL

「做什么」节追加：**`query-admit.md` 切片是知识库内容进入模型上下文的唯一合法形态；整本 BASE/DETAIL 禁止注入。** 触发节改写：「任务 3/4/5/6/9 必跑；流水线内自动，无需用户手动」。

### 3.4 D4 compress SKILL

触发节追加：阶段推进必须本 Skill 先行；**禁止以「文档不长」为由跳过或复读全文**。

### 3.5 D5 DEVPILOT.md S 级条款（分级表之后）

```markdown
> **S 级纪律**：确认 S 后跳过 02/03/04 文档；实现后仅出简要测试报告（改动点、验证命令与结果、残留风险）+ 知识库增量更新。AI 不得自行把 S 升级为 M/L；影响扩大时提示用户确认。
```

### 3.6 D6 requirements-analysis-agent ④.1

追加一句：「无 query pass 切片时，禁止引用知识库路径/符号为事实；BASE/DETAIL 只作检索线索。」

## 4. 数据结构 / 接口

无。

## 5. 一致性与风险

| 风险 | 对策 |
|------|------|
| 与 2.3 R1–R4 叠加后规则过密 | R4 管路由、法律管注入，职责分离；法律条文自含触发条件，不引用 R 编号 |
| 「必读清单」旧语义残留 | D1 末行冲突澄清条款 |
| L3 与「只升不降」重复 | L3 显式引用既有规则，不另造流程 |

## 6. 批次

1. 批次1：D1 + D5（核心条款）
2. 批次2：D2 + D3 + D4 + D6
3. 批次3：AC1–AC7 验收 + 04/05 + 规划状态表

回滚：文档改动，revert 单提交。

## 7. 知识库一致性检查

- [x] 本仓无知识库；变更后更新对象为规划文档状态表 + 本需求 CHANGELOG