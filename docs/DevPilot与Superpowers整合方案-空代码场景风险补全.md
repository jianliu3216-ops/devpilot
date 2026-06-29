# DevPilot × Superpowers 整合方案：空代码场景风险补全

> 版本：v1.1 | 日期：2026-06-29 | 分支：feature_3.0.0.0

---

## 一、DevPilot 在空代码场景的固有风险

| 风险点 | DevPilot 现状 | 后果 |
|--------|--------------|------|
| 需求探索不够发散 | 任务3 偏向"结构化整理" | 容易把客户Excel当圣旨，漏掉隐含需求 |
| 架构设计缺乏验证 | 任务5 出文档即止 | 技术选型没有原型验证，到代码阶段才发现坑 |
| TDD 执行不严格 | 只在规则里提"TDD优先" | 空项目最容易先写代码后补测试 |
| 调试方法论缺失 | 无独立 skill | 空项目早期 Bug 多，靠经验调试容易兜底不足 |
| 代码评审机制弱 | 无独立 skill | 没有历史代码参照，AI 产出质量靠运气 |
| subagent 并行编排弱 | 通过 /van 间接调用 | 空项目脚手架阶段其实可以并行（前端/后端/数据库） |

---

## 二、Superpowers 补全映射

| 阶段 | DevPilot 任务 | 叠加 Superpowers skill | 补的洞 |
|------|:---:|---|---|
| 项目骨架规划 | 任务2前/空项目初始化 | brainstorming + writing-plans | 技术栈、目录结构、共享类型先行 |
| 需求分析 | 任务3 | brainstorming | 发散探索，质疑Excel假设 |
| PRD | 任务4 | 可选 lightweight review | 验收标准和用户故事一致性检查 |
| 接口契约先行 | 任务4.5 | brainstorming | endpoint、DTO、错误码、关键时序边界检查 |
| 软件设计 | 任务5 | brainstorming + writing-plans | 架构方案多轮推演 + 计划文档 |
| 代码实现 | 任务6 | test-driven-development | TDD 严格化（红绿重构） |
| 脚手架搭建 | 任务6前期 | dispatching-parallel-agents | 前端/后端/DB脚手架并行 |
| 调试 | 贯穿 | systematic-debugging | 系统化定位 Bug |
| 代码评审 | 每批次后 | requesting-code-review + receiving-code-review | 独立 review 兜底 |
| 完工前 | 任务8前 | verification-before-completion | 完成前强制验证 |
| 分支管理 | 贯穿 | finishing-a-development-branch | 分支策略 + 合并规范 |

---

## 三、整合后的执行模型

```
DevPilot（项目级骨架）          Superpowers（任务级方法论）
─────────────────────          ─────────────────────────
空项目骨架规划          ←—— brainstorming + writing-plans
    │
    ▼
任务2 知识库生成        ←—— 历史项目独立执行；空项目可后置
    │
    ▼
任务3 需求分析          ←—— brainstorming（发散质疑Excel）
    │
    ▼
任务4 PRD              ←—— 可选 lightweight review（验收标准一致性）
    │
    ▼
任务4.5 接口契约先行    ←—— brainstorming（边界条件和错误码）
    │
    ▼
任务5 软件设计          ←—— brainstorming（架构推演）
    │                    writing-plans（计划文档）
    ▼
任务6 代码实现（脚手架） ←—— dispatching-parallel-agents（前后端并行）
    │                    test-driven-development（TDD红绿重构）
    ▼
任务6 代码实现（业务）   ←—— test-driven-development
    │                    systematic-debugging（Bug定位）
    ▼
每批次完工              ←—— requesting-code-review（评审）
    │                    verification-before-completion（验证）
    ▼
任务7 测试用例          ←—— 无需叠加
    │
    ▼
任务8 测试报告          ←—— verification-before-completion
    │
    ▼
任务8.5 知识库更新      ←—— 无需叠加
    │
    ▼
分支完工               ←—— finishing-a-development-branch
```

---

## 四、具体叠加规则

DevPilot 的 CLAUDE.md 明确规定：

> 外部技能只能在阶段内部被调用：Superpowers 等外部技能只能在 Autopilot 流程的某个阶段内部被调用，作为该阶段的执行工具

整合方式：**DevPilot 管阶段切换，Superpowers 在阶段内兜底执行质量**。不冲突，叠加增益。

### 4.1 三层集成模型

Superpowers 不作为新的流水线入口，而是挂在 DevPilot 阶段内部：

| 层 | 职责 | 禁止事项 |
|----|------|----------|
| Stage Router | 识别当前 DevPilot 阶段和 S/M/L 级别 | 不决定跳过阶段，不替用户确认 |
| Superpowers Adapter | 根据阶段加载对应方法论 | 不把外部 skill 当主入口 |
| Quality Gate | 阶段结束前检查必需动作和产物 | 不绕过人工确认进入下一阶段 |

### 4.2 阶段内调用协议

每次叠加 Superpowers 时必须显式记录四项内容：

1. **触发阶段**：例如任务3、任务5、任务6批次1。
2. **使用 skill**：例如 `brainstorming`、`test-driven-development`。
3. **输入材料**：当前阶段允许读取的需求、PRD、设计、代码或测试结果。
4. **输出证据**：问题清单、方案取舍、失败测试、review 结论、验证结果等。

如果无法形成输出证据，视为未真正使用该 Superpowers 方法论。

### 4.3 S/M/L 分级启用策略

| 级别 | 默认启用 | 说明 |
|------|----------|------|
| S | verification-before-completion（轻量） | 小改动不强制完整 brainstorming/review |
| M | brainstorming、test-driven-development、verification-before-completion | 标准质量增强 |
| L | 全量启用 + 分批 review + 分批 verification | 空项目、跨模块、接口/DB 变更默认按 L 级处理 |

---

## 五、风险对照

| 场景 | 只用DevPilot | DevPilot+Superpowers |
|------|-------------|---------------------|
| Excel需求隐含漏洞 | 容易照单全收 | brainstorming 会质疑 |
| 技术选型踩坑 | 代码期才发现 | 设计期原型验证 |
| TDD 形同虚设 | 规则提到但不强制 | TDD skill 强制红绿重构 |
| 脚手架串行慢 | 一遍遍来 | 前后端并行 |
| Bug 定位靠运气 | 经验主义 | 系统化定位 |
| 代码质量飘忽 | 无独立评审 | 独立 review 兜底 |

---

## 六、调整要点（实际执行时注意事项）

### 6.1 任务2（知识库生成）在空项目中后置

空项目没有代码可扫描，`jit-project-knowledge-base` 扫出来是空的。建议：
- 项目初期 → "项目骨架规划"（技术栈选型、目录结构、共享类型定义）
  - 叠加 brainstorm + writing-plans
- 任务5 之后再正式构建知识库（有了代码后再扫）

### 6.2 dispatching-parallel-agents 的实际限制

25 张表 + B2B 平台，前后端不是完全独立的：
- **API 契约必须先定** — 前后端共享的 DTO/接口签名是串行依赖
- **数据库 schema 先于一切** — ER 图出来后，前后端才能真正并行

建议：`dispatching-parallel-agents` 在**接口契约和 DB schema 确定后**的模块开发阶段才生效。

### 6.3 brainstorming 在需求分析阶段的约束

需求分析阶段 brainstorming 只做三件事：
1. 质疑 Excel 中隐式假设（隐含状态机？隐含权限规则？）
2. 追问非功能需求（并发量？数据量级？安全合规？）
3. 列出"客户没说的已知坑"（多语言？时区？审计日志？）

**不猜测业务逻辑，不自行补充功能。**

### 6.4 接口契约先行（任务4.5）

B2B 平台的核心风险不是代码写不对，而是**接口定义不对**导致上下游对接失败。建议在任务4（PRD）和任务5（设计）之间加一个轻量步骤：

```
任务4.5 "接口契约先行"
  - 所有 API endpoint 列表（自然语言描述即可）
  - 核心 DTO/枚举/错误码
  - 关键业务流程时序（自然语言 + 参与者）
  ← brainstorming 质疑边界条件
```

任务4.5 的产物建议写入 `02a-interface-contract.md`，位于目标项目 `docs/{需求标识}/` 下。该文件不是独立流水线入口，只能由任务4确认后进入；任务5必须引用它，任务6并行实现必须以它为契约基线。

最小模板：

```markdown
# 接口契约先行

## Endpoint 清单
| 方法 | 路径 | 用途 | 权限 | 备注 |
|------|------|------|------|------|

## DTO / 枚举 / 错误码
| 名称 | 类型 | 字段/取值 | 说明 |
|------|------|-----------|------|

## 关键业务时序
- 参与者：
- 主流程：
- 异常流程：

## Superpowers 边界质疑记录
- 隐含状态：
- 边界条件：
- 幂等/重试：
- 兼容性：
```

### 6.5 版本控制策略

空项目前 2-3 周是高频变更期，建议叠加 `using-git-worktrees`，每个大模块一个 worktree 隔离。

### 6.6 阶段质量门禁

| 阶段 | 门禁检查 | 未通过时处理 |
|------|----------|--------------|
| 任务3 需求分析 | 已列出隐式假设、非功能问题、客户未说明风险 | 回到需求澄清，不进入 PRD |
| 任务4 PRD | 用户故事、功能规格、验收标准互相一致 | 修订 PRD，等待用户确认 |
| 任务4.5 接口契约 | endpoint、DTO、错误码、关键时序齐全 | 不进入软件设计 |
| 任务5 软件设计 | 至少有方案取舍、模块依赖、必要接口/DB/时序设计 | 不进入代码实现 |
| 任务6 代码实现 | RED/GREEN/REFACTOR 证据齐全，相关测试通过 | 不进入测试用例阶段 |
| 每批次完工 | review 结论已处理，verification 已通过 | 不合并批次，不进入下一批 |
| 任务8 测试报告 | 测试命令、结果统计、失败分析和残留风险明确 | 不触发知识库更新 |

### 6.7 禁止绕过规则

- 禁止以 Superpowers 关键字绕过需求标识确认。
- 禁止在任务4.5前启动前后端/数据库并行实现。
- 禁止只声明使用 TDD 而没有失败测试记录。
- 禁止 review 发现阻塞问题后继续进入下一阶段。
- 禁止 verification 未执行或失败时标记任务完成。

---

## 七、推荐流程（修订版）

```
① 切换工具路径 → L:\jit\claude-code-autopilot
② 激活 DevPilot → 目标项目路径
③ 项目骨架规划 + brainstorming + writing-plans
④ 任务3 需求分析 + brainstorming 叠加（质疑Excel假设）
⑤ 任务4 PRD
⑥ 任务4.5 接口契约先行 + brainstorming
⑦ 任务5 软件设计 + brainstorming + writing-plans 叠加
⑧ 任务6 脚手架（API契约+DB schema确定后） + dispatching-parallel-agents + TDD 叠加
⑨ 任务6 业务模块 + TDD + systematic-debugging 叠加
⑩ 每批次 requesting-code-review + verification-before-completion
⑪ 任务7-8 测试报告
⑫ 任务8.5 知识库生成 + 更新
⑬ finishing-a-development-branch 收尾
```

---

## 八、验收标准

### 8.1 集成生效标准

| 验收项 | 通过标准 |
|--------|----------|
| 入口门控 | 输入 DevPilot 关键字时，仍先执行 DevPilot 门控，不被 Superpowers 抢占 |
| 阶段映射 | 每个阶段能说明是否启用 Superpowers、启用哪个 skill、输出什么证据 |
| 任务3 | `01-requirements-analysis.md` 包含隐式假设、非功能追问、客户未说明风险 |
| 任务4.5 | 高风险项目可生成 `02a-interface-contract.md`，任务5引用它 |
| 任务5 | `03-software-design.md` 包含方案取舍；L 级 `03a-change-strategy.md` 引用设计章节 |
| 任务6 | 有 RED/GREEN/REFACTOR 记录和测试结果 |
| 批次完工 | review 阻塞问题已处理，verification 已通过 |
| 状态恢复 | status 能识别 `02a-interface-contract.md`，但不把它误判为所有项目必需 |

### 8.2 完成前自检

```markdown
- [ ] 已确认当前 DevPilot 阶段和 S/M/L 级别
- [ ] 已确认 Superpowers 只在阶段内部调用
- [ ] 已记录触发阶段、skill、输入材料、输出证据
- [ ] 阶段质量门禁已通过
- [ ] 未绕过人工确认进入下一阶段
```

---

## 九、总结

空项目 + 客户Excel + 25张表 + B2B 平台 —— 这是典型"L级 + 高风险"场景，DevPilot 单挑确实容易出问题。叠加 Superpowers 后：

- **流程稳定性**：DevPilot 保证不跳步
- **执行质量**：Superpowers 保证每步做到位
- **风险兜底**：brainstorming + code-review + verification 三重保险

> 确认技术栈后再启动任务5的架构推演 brainstorming。
