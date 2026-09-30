# 知识库贯穿规则（完整版）

> 核心原则：知识库 = 可检索的项目记忆；**进上下文的当前事实 = 代码预言机准入结果**。所有开发阶段都必须「先检索知识库，再经事实门控，再写知识库」。

---

## 规则 1：PUML 流程图的标准格式与变更记录

所有 PUML 文件必须包含标准元数据头：

```plantuml
@startuml
' 项目：{项目名称}
' 流程图类型：{主业务流程/协议处理/OTA升级等}
' 生成时间：{YYYY-MM-DD}
' 激活标签：{对应特征标签}
'
' 变更记录（倒序排列，最新在最上面）：
' v{版本号} - {日期} - {变更内容描述}
'
skinparam backgroundColor #FEFEFE
skinparam BackgroundColor #E8F4FD
skinparam BorderColor #2196F3
skinparam NoteBackgroundColor #FFF9C4
skinparam NoteBorderColor #FBC02D
skinparam ArrowColor #555555

title {流程图标题}

@enduml
```

**强制要求**：不能缺失任何元数据头部、版本号必须和知识库一致、每次修改流程图必须追加变更记录、使用统一的 skinparam 样式。

---

## 规则 2：需求变更阶段必须参考知识库

- **读**：读取相关模块的 DETAIL 文档 + 对应 PUML 流程图，评估变更影响范围
- **写**：变更完成后，增量更新受影响的知识库章节，追加变更记录
- **禁止**：不看已有实现就凭空设计变更方案

---

## 规则 3：需求分析 / PRD 阶段必须建立知识库锚点

- **读**：读取 BASE.md 整体架构 + 技术栈约束
- **读**：参考同领域已有 PUML 流程图，复用已验证的实现模式
- **写**：在 `CHANGELOG.md` 的 `## 知识库锚点` section 中写入锚点（**唯一位置**，不在 01/02/03 等开发文档内重复）

锚点格式：
```markdown
## 知识库锚点
- 关联知识库版本：PROJECT_KNOWLEDGE_BASE.md @ v2.1
- 关联模块域：加密模块域、升级模块域
- 关联流程图：ota_flow.puml、security_flow.puml
- 预计变更：将修改 ota_flow.puml 第 3-5 节点，新增降级流程
```

---

## 规则 4：软件设计阶段强制引用 PUML 流程图

- ✅ 必须引用已有 PUML 流程图作为基准，不能脱离已实现的代码架构
- ✅ 修改流程的设计文档必须标注「此设计修改了 `{文件名}.puml` 中第 X 节点」
- ✅ 新增流程的设计评审通过后必须生成新的 `*.puml` 文件并入知识库
- ❌ 禁止设计和已实现代码完全脱节
- ❌ 禁止只写设计文档不更新知识库

---

## 规则 5：CHANGELOG.md 必须包含「知识库锚点」

每个需求目录的 `CHANGELOG.md` 必须包含 `## 知识库锚点` section（格式同规则3）。这是知识库锚点的唯一写入位置，01/02/03/05 等开发文档不再各自重复写锚点。

---

## 规则 6：增量更新机制（禁止全量重写）

任何变更完成后，禁止全量重写整个知识库，按三层同步更新：

| 知识库文件 | 更新触发 | 更新方式 |
|-----------|---------|---------|
| `PROJECT_KNOWLEDGE_BASE.md` (BASE) | 新增模块 / 架构重大调整 / 技术栈变更 | 只更新版本号、变更记录索引、受影响模块摘要 |
| `PROJECT_KNOWLEDGE_DETAIL-*.md` (DETAIL) | 业务逻辑变更 / 接口变更 / 配置变更 | 只修改受影响模块域章节 |
| `docs/knowledge-base/*.puml` | 代码流程变了就必须更新 | 只修改有变化的节点/箭头，禁止删掉重写 |

---

## 规则 7：设计评审必须包含「知识库一致性检查」

设计评审 checklist：
- [ ] 设计是否引用了对应的知识库 PUML 流程图？
- [ ] 预计的知识库变更范围是否明确？
- [ ] 设计和已有实现是否存在冲突？
- [ ] 变更完成后谁负责更新知识库？

---

## 规则 6.1：测试报告完成后的知识库更新 SOP

测试报告确认通过后，48小时内按以下顺序执行：

**Step 1：更新 PUML 流程图**（优先级最高）
1. 找出需要更新的 .puml 文件
2. 只修改有变化的节点/箭头
3. 文件头部变更记录追加一行
4. 在线渲染验证

**Step 2：更新 DETAIL 文档**
只修改受影响模块域的章节，追加变更记录

**Step 3：更新 BASE 文档**
版本号 +1，更新变更历史、受影响模块摘要、PUML 索引

**Step 4：一致性校验**
- [ ] BASE、DETAIL、PUML 三者版本号完全一致
- [ ] 所有变更的 PUML 都追加了变更记录
- [ ] 代码中的流程编号和 PUML 节点可对应
- [ ] 在线渲染所有更新的 PUML

---

## 知识库分层总结

| 文件 | 定位 | 更新频率 | 优先级 |
|------|------|---------|-------|
| `docs/knowledge-base/*.puml` | 流程事实标准 | 实时，代码流程变了必须先更图 | P0 |
| `PROJECT_KNOWLEDGE_INDEX.json/.md` | 机器索引主入口（2.6.0） | 每次知识库生成/增量更新后由 `build-index.js` 重建 | P0（检索入口） |
| `PROJECT_KNOWLEDGE_DETAIL-*.md` | 深度备查手册 | 中频，核心模块变更时更新 | P1 |
| `PROJECT_KNOWLEDGE_BASE.md` (BASE) | 快速入门索引 | 低频，重大架构变更时更新 | P2 |
| `PROJECT_KNOWLEDGE_ADMITTED.md` | 代码预言机准入清单 | 每次生成/更新知识库后、每次注入上下文前刷新 | P0（引用事实时） |

---

## 规则 8：事实门控（注入上下文前 MUST）

知识库 Markdown 仍是检索语料，**不是自动为真的事实**。Agent 把知识库内容当作「项目现在就是这样」之前，MUST 运行：

```bash
node "$FRAMEWORK/skills/jit-project-knowledge-fact-gate/scripts/verify-kb-facts.js" "<目标项目路径>" --query "<当前任务关键词>"
```

硬规则：

- 只允许引用 `PROJECT_KNOWLEDGE_ADMITTED.md` / `query-admit.md` 中的 **pass** 断言
- **fail** 已被当前源码证伪：禁止当事实；需要时下钻源码
- 抽不出路径/符号/模块/路由/环境变量的叙述只作线索，引用前必须对照源码
- 本规则不限制读取源码，不缩小知识库检索范围
- 任务 2 生成后、任务 8.5 更新后也必须刷新准入文件

---

## 规则 9：机器索引与 BASE 骨架限制（2.6.0）

**机器索引**：任务2 / 任务8.5 必须产出并刷新 `PROJECT_KNOWLEDGE_INDEX.md/.json`（`build-index.js` 生成）。

- `INDEX.json` 为机器检索主入口：`kb_version` + `modules[]{id,title,paths,symbols,detail_section,requirements}` + `requirements[]{id,title,level,modules,docs}`
- 抽不出的字段写 `unknown`，**禁止编造**
- 需求索引权威在 `INDEX.json`；DETAIL `## 需求索引` 表为人读镜像（双写，两处同步）
- validate-kb.js：缺 INDEX 即 error；kb_version 与 BASE 不一致报 warning

**BASE 骨架限制**：BASE 只允许骨架章节——项目概览、技术栈表、模块摘要表、文档/PUML 索引、CodeGraph 状态、版本记录；超长叙述一律下沉 DETAIL（可按模块逐步下沉，禁止一次性重写）。BASE 合格标准：人 5–10 分钟读完目录。

---

## 规则 10：统一检索顺序（INDEX → 门控 → 下钻）

任何阶段查知识库，一律按固定顺序：

1. **INDEX 命中**：先查 `PROJECT_KNOWLEDGE_INDEX.json`，定位 1–N 个候选模块/需求（拿到 `detail_section` 与 `paths`）
2. **事实门控**：`verify-kb-facts.js --query "<当前任务关键词>"`，只取 pass
3. **按需下钻**：只打开命中的 DETAIL 对应节 + 1–3 个源码文件

禁止：整本 BASE / DETAIL 贴入上下文（引用 CLAUDE.md 注入法律 L1）；跳过 INDEX 直接翻 DETAIL 找章节。

---

## 规则 11：日常增量禁令（2.7.0）

**日常 90% 路径**：INDEX 检索 → `--query` 事实门控 → 改 1–3 文件 → 任务8.5 白名单回写（INDEX 条 + DETAIL 命中节 + CHANGELOG 锚点 + ADMITTED 刷新）。

硬禁令：

1. **禁止**为单点 bug 修复跑任务2 全量扫描
2. **禁止**把「知识库更新」理解为重扫全仓；任务8.5 只改白名单四项
3. 任务2（全量）**仅三种情形**：目标项目无 `docs/knowledge-base/`；用户明确说「架构大变，全量重建」；preflight 判定 INDEX 损坏且无法从现有文档抽出
4. 全量预估超 `IS_LARGE_PROJECT` 阈值必须先问用户并展示 preflight 数据，禁止默默跑半天
5. 任务8.5 **禁止**为「完整」扩写未命中模块的 DETAIL；未命中模块一行不动

知识库维护者 = 改这段代码的人。fail 条目失去「当事实」权力，必须下钻源码（衔接规则 8）。
