# 01 需求分析 + 02 PRD + 03 软件设计（合并文档）：知识库日常增量（kb-incremental-ops）

- 日期：2026-09-30
- 级别：M（规划既定；用户授权「全干免确认」，合并文档链以省 token）
- 上游：`00-原始需求.md`；规划 `docs/DEVPILOT_VERSION_PLAN.md` §8
- 事实门控：本仓无知识库，基于下钻文件分析（规则 8/9/10 已为 2.6.0 产物）

## 1. 现状（01）

| 文件 | 现状 | 缺口 |
|------|------|------|
| `KNOWLEDGE_BASE_RULES.md` | 规则 1–10（10=检索顺序，2.6.0 新增） | 无「日常增量禁令」条款 |
| `skills/jit-project-knowledge-base-update/SKILL.md` | 任务8.5 增量更新说明 | 无白名单边界，存在重写无关模块的风险 |
| `skills/jit-project-devpilot-status/scripts/scan-status.js` | 扫 docs/{标识}/ 阶段文件推断状态 | 不检查知识库 INDEX 条目回写 |
| `CLAUDE.md` | 知识库更新规则节（增量、索引、锚点） | 无全量重扫禁令 |

## 2. 用户故事与功能规格（02）

| US | 规格 |
|----|------|
| US1 禁令入规则 | **FR1** KNOWLEDGE_BASE_RULES 新增规则 11：禁单点 bug 全量重扫；任务2 仅三种情形（无 knowledge-base/ / 用户明说架构剧变 / preflight 判定 INDEX 损坏且无法抽出）；IS_LARGE_PROJECT 阈值场景必须先问用户 |
| US2 8.5 白名单 | **FR2** update SKILL 白名单四项：INDEX 对应模块/需求条、DETAIL 受影响节、需求 CHANGELOG 锚点、ADMITTED 刷新；禁改清单：未命中模块 DETAIL、BASE 全文、无关 PUML；禁止为「完整」扩写 |
| US3 status 联动 | **FR3** scan-status.js：需求有 `05-test-report.md` 但 `PROJECT_KNOWLEDGE_INDEX.json` 缺该 requirements 条目 → 状态置 `未完成（缺 INDEX 条目）`；无知识库项目跳过该检查 |
| US4 CLAUDE 对齐 | **FR4** CLAUDE.md 知识库更新规则节补一行禁令（禁全量重扫，任务2 仅三情形） |

## 3. 设计（03）

### 3.1 规则 11 条文骨架

- 日常 90% 路径 = INDEX 检索 → 门控 pass → 改 1–3 文件 → 8.5 白名单回写
- 任务2 触发三情形白名单 + 阈值确认话术（超 IS_LARGE_PROJECT 必须先问）
- fail 条目失去「当事实」权力，下钻源码（衔接规则 8）

### 3.2 scan-status.js 修改点

- 读 `docs/knowledge-base/PROJECT_KNOWLEDGE_INDEX.json`（不存在则跳过，不报错——兼容未做知识库的项目）
- `requirements[].id` 收集成 Set；对每个有 05 的需求目录：不在 Set → 该需求状态输出加 `未完成（缺 INDEX 条目）` 提示行
- 保持现有 STAGE_FILES / detectLevel / parseChangelogStatus 逻辑不变；中文正则 fallback 保留

### 3.3 update SKILL 修改点

- 新增「## 更新白名单（2.7.0 起）」节：四项白名单 + 禁改清单 + 违反即返工
- 流程步骤核对：现有步骤若含「重扫/全量」措辞改为白名单措辞

### 3.4 涉及文件清单

1. `docs/KNOWLEDGE_BASE_RULES.md`（规则 11）
2. `skills/jit-project-knowledge-base-update/SKILL.md`（白名单节）
3. `skills/jit-project-devpilot-status/scripts/scan-status.js`（INDEX 条目检查）
4. `CLAUDE.md`（知识库更新规则节禁令行）

## 4. 验收标准

- [ ] AC1 规则 11 三情形 + 阈值先问齐备
- [ ] AC2 update SKILL 白名单 + 禁改清单齐备
- [ ] AC3 scan-status：有 05 无 INDEX 条 → 报未完成；无知识库项目不误报
- [ ] AC4 CLAUDE.md 禁令行与规则 11 一致
- [ ] AC5 scan-status node --check 通过 + 夹具冒烟
- [ ] AC6 依赖 2.6：无 INDEX 时本版本检查静默跳过（不阻断）

## 5. 风险

| 风险 | 对策 |
|------|------|
| scan-status 误伤未做知识库的项目 | 无 INDEX.json 直接跳过检查（AC6） |
| update SKILL 长文编辑错位 | 定点插入小节，不重排 |
| status 输出格式变化破坏下游 | 只追加提示行，不改现有状态枚举 |

回滚：git revert 单提交。