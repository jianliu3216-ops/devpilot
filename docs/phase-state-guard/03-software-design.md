# 03 软件设计（HLD + LLD 合并）：阶段状态与证据守卫（phase-state-guard）

- 日期：2026-09-30
- 级别：L（HLD + LLD 合并于本文，不拆分）
- 上游：`02-prd.md`（US1–US5 / FR1–FR7 / AC1–AC9）
- 上下文：`.handoff/design.context.md`
- 执行策略见：`03a-change-strategy.md`（批次引用本文章节号，禁止在批次中重新设计）

---

# 第一部分 HLD（高层设计）

## 1. 架构（C4-Container 视角，文字图）

```text
┌───────────────────────────── Claude Code 会话 ─────────────────────────────┐
│  CLAUDE.md 协议层（激活 / R1–R4 / 注入法律 L1–L3 / 阶段推进接 guard）        │
│      │ 调用                                                                │
│      ▼                                                                     │
│  ┌──────────────────┐   读/写    ┌──────────────────────────────┐          │
│  │ devpilot-guard.js │──────────▶│ docs/{id}/state.yaml          │          │
│  │ (新增，唯一写者)   │   追加    │ docs/{id}/.devpilot/          │          │
│  └──────────────────┘──────────▶│   state-events.jsonl          │          │
│      │ check 证据              └──────────────────────────────┘          │
│      ▼                                                                     │
│  docs/{id}/00–05（人可读事实源，guard 只读其存在性）                        │
│  docs/{id}/.handoff/*.context.md（2.4 压缩包，恢复协议输入）                │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. 模块划分与依赖

| 模块 | 位置 | 职责 | 依赖 |
|------|------|------|------|
| G1 guard 脚本 | `skills/jit-devpilot-init/scripts/devpilot-guard.js`（新增） | state 读写、规则表校验、审计、四命令 | 仅 Node 内置 fs/path；DEVPILOT.md 产出路径常量 |
| G2 state 契约 | `docs/{id}/state.yaml`（运行时产物） | 阶段/级别/证据镜像 | 由 G1 创建与更新 |
| G3 协议接入 | `CLAUDE.md`、`cicd-rules.md` | 阶段推进 = check→用户确认→--apply | G1 命令行 |
| G4 恢复协议 | `skills/jit-devpilot-init/SKILL.md` 第 3 步 | 中断续跑流程 | G1 resume + .handoff |
| G5 流程对齐 | `DEVPILOT.md` | 场景1 描述对齐；status SKILL 提示 | — |

## 3. 状态机（LLD 见 §6 规则表）

```mermaid
stateDiagram-v2
    [*] --> identified
    identified --> original_req : 标识确认
    original_req --> analysis : 00存在+check过
    analysis --> prd : 01存在+确认(M/L)
    analysis --> design : 01存在+确认(M/L,无prd场景*)
    analysis --> impl : 01存在+级别确认(S)
    prd --> design : 02存在+确认
    design --> impl : 03存在+确认(M)/03+03a(L)
    impl --> test_cases : 实现完成证据(M/L)
    impl --> report : 实现完成证据(S)
    test_cases --> report : 04存在(L需04a)
    report --> kb_update : 05存在+报告确认
    kb_update --> done : 8.5完成/跳过理由
    note right of prd : S级=skipped:true，迁移不要求文件
    note left of analysis : waiting_confirm时禁止--apply
```

`*`：M/L 级 prd 为必经阶段（枚举中括号仅表示 S 级 skipped），S 级由 analysis 直达 impl。

---

# 第二部分 LLD（详细设计）

## 4. state.yaml Schema（锁定）

```yaml
id: user-login                 # 需求标识（kebab-case）
level: S                       # S | M | L（用户确认后写入；identified 阶段可暂为 null）
phase: impl                    # 枚举见 FR2/§3
status: in_progress            # in_progress | waiting_confirm | blocked | done
skipped: [prd, design, test_cases]   # 仅 S 级；M/L 为 []
evidence:                      # 相对目标项目根的路径或 null
  original_requirements: docs/user-login/00-原始需求.md
  analysis: docs/user-login/01-requirements-analysis.md
  prd: null
  design: null
  change_strategy: null        # L 级 03a
  test_cases: null
  test_report: null
no_test_note: null             # 用户确认无测时记录一句话理由
updated_at: 2026-09-30T00:00:00+08:00
```

规则：
- guard 写入时全量重写（YAML 无嵌套冲突）；写前读旧值算 diff 供审计
- `phase` 与 `status` 分离：`waiting_confirm` 表示该阶段产出已生成、等人确认
- 解析器：无第三方 YAML 库 → guard 内置最小解析（仅支持本 schema 的平铺 key + 一层列表/映射），非法结构报错退出（防手改破坏）

## 5. 审计事件 Schema

```json
{"ts":"2026-09-30T12:00:00+08:00","from":"analysis","to":"prd","level":"M","evidence":"docs/x/01-requirements-analysis.md","via":"--apply"}
```

追加写；guard 启动时若文件缺失自动创建；历史行永不改写（AC5）。

## 6. 守卫规则表（G1 内置常量，与 PRD FR4 一致）

```text
REQUIRED[target][level] =
  analysis  : S/M/L -> [00]
  prd       : S -> skipped；M/L -> [01]
  design    : S -> skipped；M/L -> [02]
  impl      : S -> [01, levelConfirmed]；M -> [02, 03]；L -> [02, 03, 03a]
  test_cases: S -> skipped；M/L -> [implDone]      // implDone = tests/{id}/ 存在 或 state.no_test_note 非空
  report    : S -> [implDone]；M -> [04]；L -> [04, 04a]
  kb_update : S/M/L -> [05]
  done      : [kbDone]                              // kbDone = 8.5 完成标记 或 state 记录跳过理由
```

判定顺序：phase 合法性 → skipped 检查 → 证据存在性 → status 检查（waiting_confirm 拒绝）→ 输出。
输出格式：`PASS: <target> 可进入` / `[HARD STOP] 缺少: <具体文件或条件列表>`；退出码 0/1。

## 7. 命令行契约（G1）

```text
node devpilot-guard.js <项目根> <需求标识> check <target>
node devpilot-guard.js <项目根> <需求标识> --apply <target>
node devpilot-guard.js <项目根> <需求标识> --init [S|M|L]
node devpilot-guard.js <项目根> <需求标识> resume
```

- `check`：只读，不改 state
- `--apply`：先跑同参数 check，PASS 才更新 phase + 追加事件；FAIL 输出 HARD STOP 且退出码 1
- `--init`：无 state 时按级别建初始 state（phase=original_req 或 identified）；已有 state 时拒绝（防覆盖）
- `resume`：输出 `phase/level/status/下一动作`；status=waiting_confirm 时提示「等待用户确认 <phase>」

## 8. 双轨防漂移（规划 §1.2 落地）

1. 文档存在性是**唯一事实源**：guard 每次按规则表重新查文件，不信任 state.evidence 缓存值
2. `--apply` 通过时**回写** state.evidence 为实际路径（发现文档被移走则同步修正）
3. state 永不驱动删除/改写文档；检测到 state 指向不存在的文件 → check 报 HARD STOP 并提示人工核对

## 9. 恢复协议（G4 文案，写入 init SKILL 第 3 步）

```text
会话中断后继续：运行 guard resume → 只读输出 + .handoff/{phase}.context.md（法律 L2）
禁止：为恢复而全量生成知识库 / 重读 00–05 全文 / 重跑已完成阶段
```

## 10. 协议接入文案（G3）

- CLAUDE.md 场景1 每阶段箭头处追加：「进入 <阶段> 前：guard check；用户确认产出后 guard --apply」
- cicd-rules §4 步骤链在 ③④ 之间与各阶段推进处插入 guard 调用行
- status SKILL：末尾追加一句「有 state.yaml 的需求以 state.phase 为准，无 state 走推断」

## 11. 接口契约汇总（本需求对外契约面）

| 契约 | 形态 | 锁定 |
|------|------|------|
| state.yaml 字段 | §4 schema | 本版不改；扩字段必须先改本文 |
| 事件日志行 | §5 JSON | append-only |
| guard CLI | §7 四命令 | 退出码 0/1 |
| 规则表 | §6 | 与 DEVPILOT.md 产出路径同名 |
| 无 HTTP/数据库/第三方依赖 | NF1 | — |

## 12. 风险与对策（承接 PRD §6）

| 风险 | 对策（落点） |
|------|------|
| 双轨漂移 | §8 三条机制 |
| 误拦 | §6 输出具体缺失项；路径常量与 DEVPILOT.md 同源 |
| 绕过 guard | §10 协议接入（规则层）；机器级防绕过列非目标 |
| JSONL 并发 | 单会话追加；已知限制记录于脚本头注释 |

## 13. 知识库一致性检查

- [x] 本仓无知识库/PUML；状态机图以 Mermaid 内嵌本文
- [x] 变更后更新对象：规划状态表 + 本需求 CHANGELOG