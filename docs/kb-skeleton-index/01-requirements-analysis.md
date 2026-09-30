# 01 需求分析 + 02 PRD + 03 软件设计（合并文档）：骨架知识库 + 机器索引（kb-skeleton-index）

- 日期：2026-09-30
- 级别：M（规划 §3 既定；用户已授权「全干免确认」，本文档链合并产出以省 token）
- 上游：`00-原始需求.md`；形态总纲 `docs/DEVPILOT_VERSION_PLAN.md` §2.5、§7
- 事实门控：本仓无知识库，基于下钻文件

> 说明：M 级标准流程为 01/02/03 三份；因用户指令「不用问我了，全干了先」，三份合并且各级别按规划既定值执行，不再逐级征询。内容完整性不缩减。

## 1. 现状（01）

| 文件 | 现状 | 缺口 |
|------|------|------|
| `validate-kb.js` | 校验 BASE/DETAIL 必需 + DETAIL 三节 + CHANGELOG 锚点 + 大项目 CodeGraph | 无 INDEX 检查 |
| 任务2 SKILL（963 行） | 三层定义、需求索引在 DETAIL 初始化 | 无 INDEX 产物要求；BASE 无骨架硬限制 |
| `KNOWLEDGE_BASE_RULES.md` | 规则 1–8（含事实门控） | 无检索顺序、无 INDEX 规则 |
| `CLAUDE.md` | 事实门控 MUST + 必读清单 | 必读清单语义=检索线索（L1 已澄清）；缺 INDEX 首查步骤 |

## 2. 用户故事与功能规格（02）

| US | 规格 |
|----|------|
| US1 机器检索 | **FR1** `build-index.js`：扫描 BASE/DETAIL + `docs/{标识}/` 生成 `PROJECT_KNOWLEDGE_INDEX.md/.json`；字段：kb_version、modules[]{id,title,paths,symbols,detail_section,requirements}、requirements[]{id,title,level,modules,docs}；抽不出的字段写 `unknown`，禁止编造 |
| US2 合格定义 | **FR2** validate-kb.js：缺 INDEX.md/.json → error；INDEX.json kb_version 与 BASE 版本号不一致 → warning |
| US3 规则固化 | **FR3** KNOWLEDGE_BASE_RULES 新增规则 9（机器索引与骨架限制）+ 规则 10（检索顺序）；CLAUDE.md 知识库段加 INDEX 首查 |
| US4 存量兼容 | **FR4** build-index 无 BASE/DETAIL 时报错并提示先跑任务2；有则抽取；`--project` 参数唯一 |
| US5 BASE 骨架 | **FR5** 规则 9 写明 BASE 允许章节（简介/技术栈/模块表/文档指针/PUML 索引/CodeGraph 状态/版本记录）；超长叙述下沉 DETAIL（允许按模块逐步，禁止一天重写） |

## 3. 设计（03）

### 3.1 INDEX.json schema（锁定，扩字段须先改本文与规划 §2.5）

```json
{
  "kb_version": "与 BASE 版本号一致；抽不出则 unknown",
  "modules": [{ "id": "auth", "title": "认证|unknown", "paths": [], "symbols": [], "detail_section": "PROJECT_KNOWLEDGE_DETAIL.md#认证|unknown", "requirements": [] }],
  "requirements": [{ "id": "user-login", "title": "unknown|来自00标题", "level": "S|M|L|unknown", "modules": [], "docs": "docs/user-login/" }]
}
```

### 3.2 build-index.js 抽取算法

1. requirements：遍历 `docs/{非knowledge-base目录}`（对齐 validate-kb 的 listRequirementDirs 逻辑）；title 取 00 首个 `#` 标题；level 用 scan-status 同款 detectLevel 正则（中文兜底）；modules 默认 `[]`
2. modules：从 BASE 的模块表行（`| 模块 |...|` 形态）与 DETAIL `## {章节}` 标题抽取；id=章节 slug；paths/symbols 从模块行内反引号内容抽取；无则 unknown/空
3. detail_section：`PROJECT_KNOWLEDGE_DETAIL.md#{title}`；分卷 `PROJECT_KNOWLEDGE_DETAIL-{域}.md` 一并扫描
4. kb_version：BASE 中 `v\d+\.\d+` 首个匹配，否则 unknown
5. 输出两个文件 + 控制台摘要（modules/requirements 计数、unknown 统计）

### 3.3 validate-kb.js 修改点

- 顶部注释 checks 列表加 INDEX 两行
- 主流程：缺 `PROJECT_KNOWLEDGE_INDEX.md` 或 `.json` → `errors.push`；解析 JSON 失败 → error；kb_version=unknown 或与 BASE 不一致 → warning

### 3.4 规则层条文（FR3 落点）

规则 9（机器索引）：INDEX.md/.json 是任务2/8.5 必产物；.json 为机器检索主入口；需求索引权威在 INDEX.json，DETAIL 表为人读镜像（双写）。
规则 10（检索顺序）：问题 → INDEX 命中 1–N 模块/需求 → verify-kb-facts --query → 只注入 pass → 按需打开 DETAIL 一节/1–3 源码文件；禁止整本 BASE/DETAIL 注入（引用 L1）。
BASE 骨架限制：允许章节白名单；人 5–10 分钟读完目录即为合格。

### 3.5 涉及文件清单

1. 新增 `skills/jit-project-knowledge-base/scripts/build-index.js`
2. 改 `validate-kb.js`（§3.3）
3. 改 `skills/jit-project-knowledge-base/SKILL.md`（合格定义 + INDEX 节 + 验收清单 3 项）
4. 改 `docs/KNOWLEDGE_BASE_RULES.md`（规则 9/10 + 分层表加 INDEX 行）
5. 改 `CLAUDE.md`（事实门控段加 INDEX 首查一行）

## 4. 验收标准

- [ ] AC1 build-index 在无 KB 项目 exit 1 提示先任务2
- [ ] AC2 有 BASE/DETAIL 夹具 → 生成两文件，requirements 含目录 id，抽不出字段为 unknown
- [ ] AC3 validate-kb 缺 INDEX → error exit 1；补齐后通过
- [ ] AC4 kb_version 不一致 → warning
- [ ] AC5 规则 9/10 与 CLAUDE.md 检索顺序一致
- [ ] AC6 原三层文件未删除，无新平行目录
- [ ] AC7 全部脚本 node --check 通过

## 5. 风险

| 风险 | 对策 |
|------|------|
| 中文标题/正则抽取误差 | 抽不出一律 unknown（禁止编造） |
| 大项目抽取慢 | 只扫 BASE/DETAIL 头部与 docs 目录名，不扫源码 |
| SKILL 超长文档编辑错位 | 只做定点小节插入，不重排 |

回滚：git revert 单提交；INDEX 产物为数据文件可手动删。