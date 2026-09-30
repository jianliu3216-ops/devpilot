# DevPilot 全版本规划（中文主线）

> **本文是换 token / 换会话后的唯一接手说明书。**  
> 本文只做规划与设计约束，**不包含本轮代码实现**。  
> 基线核对日期：2026-09-30。基线版本：`VERSION` = **2.2.0**。  
> 开发目录（用户指定）：`L:\jit\devpilot`。  
> 英文公开仓 `L:\jit\placet` **本规划期内禁止并行开发**；中文验证通过后再单向翻译。

---

## 0. 下一会话如何开工（直接复制）

对新会话说：

```text
目标项目：L:\jit\devpilot
先读 docs/DEVPILOT_VERSION_PLAN.md
不要改规划范围。按「当前应做版本」实现，一次只做一个版本。
当前应做版本：2.3.0
需求标识按该版本章节里的建议标识走确认协议。
```

规则：

1. 先读本文，再读 `CLAUDE.md` 触发表、`DEVPILOT.md` 流程事实源。
2. **禁止**一上来全库 Grep、禁止同时开 2.3–2.6。
3. 每个版本先走 DevPilot：建议标识 → 用户确认 → `docs/{标识}/00-原始需求.md` → 分析 → 分级确认 → 再改代码。
4. 中文改通、用一个真实小问题验证后，才允许把同一行为搬到 Placet。
5. `~/.claude/devpilot-framework-path` 当前可能仍指向 `claude-code-autopilot`。改 `L:\jit\devpilot` 时，以用户锁定的目标项目为准；安装脚本回写路径是另一步，不要和功能版本绑死。

---

## 1. 产品判断（必须当成约束，不当成口号）

### 1.1 对外部环境的判断

| 判断 | 结论 | 对规划的含义 |
|------|------|----------------|
| Skill / 工具同质化 | 成立 | 不再增加给人记的 `/jit-*` |
| 公司推 Comet | 成立 | 不正面替代 Comet 的 Skill 平台 / Dashboard / Eval |
| Comet 小问题耗几小时 | 主因是无分级 + 上下文膨胀 + 自动空转，不是「记忆没共享」 | 2.3 先做入口与分级触达，2.4 砍注入，2.5 做硬门禁 |
| 企业最需要历史项目记忆 | **半对** | 要的是「骨架 + 机器索引 + 验真」；人不用读完。见 §2.5 与 2.6.0 |
| 知识库落后、没人维护、全量半天 | 成立 | 不另起一套百科；**改原三层知识库的形态与用法**。2.6 改形态，2.7 绑日常增量 |
| 公司要省 token | 成立 | 省 token 靠少读、少阶段、只注入 pass，不靠再堆 Skill |

### 1.2 对 Comet 只借鉴三样（硬限制）

允许进规划的：

1. 每需求一份**机器可读状态**（阶段、级别、证据路径）
2. **脚本守卫**：证据文件不存在则不准进入下一阶段
3. **可恢复**：中断后读状态，不重扫全库、不复读 00–05 全文

禁止进规划的（除非将来单独开版本并经用户确认）：

- Skill 创作 / 发布市场
- Dashboard / doctor 网页
- Native vs Classic 双工作流
- 默认 `auto_transition` 无人确认就推进
- 用 Comet 的 brief/spec 工件替换 DevPilot 的 00–05 文档内核

原则：**文档仍是人可读事实源；state 只是机器镜像。** 镜像与文档冲突时，以文档文件是否存在为准，由脚本判定，不由模型口述。

### 1.3 目标形态（2.3 起对外承诺）

```text
用户只记一件事：激活 DevPilot
其余全部：自然语言
小问题：自动或半自动走 S，不开会话马拉松
知识库：骨架给人扫一眼 + 索引给机器检索；人不用读完
改代码前：用索引定位，只注入事实门控 pass 的切片
改完：只增量改索引/DETAIL 对应块
```

**不是**「把 10 个 Skill 删掉」。Skill 可以留作实现；**用户菜单和 CLAUDE 对外表只保留 1 个斜杠入口**。自然语言已经存在，2.3 的工作是收口与强制，不是发明第二套关键字。

---

## 2. 基线盘点（2.2.0，必须当事实）

以下为规划时已核对的仓库事实。后续实现若发现不一致，先改本文「基线勘误」再改代码。

### 2.1 已有的用户入口（双轨，这是问题）

**自然语言（触发方式一，已存在，应保留并作为主入口）：**

| 用户说法 | 任务 |
|----------|------|
| `激活DevPilot` / `启动流水线` / `devpilot` | 激活 |
| `需求：` / `需求分析` / `分析需求` | 任务3 |
| `生成PRD` / `PRD` | 任务4 |
| `软件设计` / `架构设计` / `变更策略` | 任务5 |
| `代码实现` / `开始编码` | 任务6 |
| `测试用例` / `回归验证` | 任务7 |
| `测试报告` / `运行测试` | 任务8 |
| `知识库更新` / `更新知识库` | 任务8.5 |
| `知识库验真` / `事实门控` / `准入知识` | 事实门控 |
| `需求变更` / `需求变更：` | 任务9 |
| `生成知识库` / `项目知识库` | 任务2 |
| `环境配置` / `环境检测` | 环境 |

**斜杠 Skill（触发方式二，对外过多）：**

| 目录 | 斜杠名 | 角色 |
|------|--------|------|
| `skills/jit-devpilot-init` | `/jit-devpilot-init` | 激活 + 打印长菜单 |
| `skills/jit-project-knowledge-base` | `/jit-project-knowledge-base` | 全量知识库 |
| `skills/jit-project-knowledge-base-update` | `/jit-project-knowledge-base-update` | 增量知识库 |
| `skills/jit-project-knowledge-fact-gate` | `/jit-project-knowledge-fact-gate` | 事实门控脚本 |
| `skills/jit-project-devpilot-status` | `/jit-project-devpilot-status` | 需求状态扫描 |
| `skills/jit-env-auto-setup` | `/jit-env-auto-setup` | 环境 |
| `skills/jit-ui-ux-pro-max` | `/jit-ui-ux-pro-max` | UI |
| `skills/jit-skill-eval` | `/jit-skill-eval` | Skill 评估 |
| `skills/jit-context-compress` | `/jit-context-compress` | 阶段压缩 |
| `skills/jit-nowTimeAndModel` | `/jit-nowTimeAndModel` | 时间/模型 |

共 **10** 个 `jit-*` Skill。Collective `/van` 不是产品入口。

### 2.2 已经写在规则里、但靠模型自觉的能力（有规则 ≠ 已落地）

| 能力 | 规则位置 | 机器强制？ | 规划位置 |
|------|----------|------------|----------|
| 需求标识确认后才读源码 | `CLAUDE.md` 流程门控 | 否（prompt） | 2.5 用 state/guard 补证据，不替代人确认 |
| S/M/L 分级 | `CLAUDE.md` 变更分级 | 否 | 2.3 激活后对「小修复」默认建议 S |
| 任务3+ 先跑 `verify-kb-facts.js --query` | `CLAUDE.md` + fact-gate SKILL | 否 | 2.4 做成阶段入口脚本，缺切片不准当事实 |
| 阶段推进先 `compress-handoff.js` | `CLAUDE.md` 场景1 | 否 | 2.4 与门控一起做「少读」 |
| 测试报告后必须增量更新知识库 | `CLAUDE.md` 知识库更新规则 | 否 | 2.6 |
| 大项目全量 KB 先 preflight / 问 CodeGraph | 任务2 硬规则 | 部分有脚本 | 2.6 明确「日常禁止全量」 |
| 每需求 `state.yaml` | 仅 `docs/comet-vs-devpilot-borrow-points.md` | **不存在** | 2.5 |
| 阶段 guard 脚本 | 同上，仅借鉴笔记 | **不存在** | 2.5 |

### 2.3 明确不在基线内的东西

- 没有 Web Dashboard
- 没有与 Comet 等价的 run-state / 事务锁
- 知识库三层（BASE / DETAIL / ADMITTED）+ 预言机脚本 **已有**，缺的是默认触发与禁止整本注入
- 英文 Placet 是另一棵树，命令是 `placet-*`，本规划不在 2.3–2.6 改它

### 2.4 当前最大结构性问题（按用户痛点排序）

1. **入口太多**：自然语言其实已经够用，斜杠菜单仍在教用户记 10 个命令。
2. **小问题走完整仪式**：S 级规则有，激活菜单和模型行为没有把它变成默认。
3. **上下文太肥**：规则要求 query 门控和 compress，执行时仍可能贴 BASE 或复读 01–03。
4. **知识库运维失败**：全量半天 + 无 PR 级增量习惯 → 必然落后。
5. **阶段可跳过**：完成条件在 prompt 里，Agent 可口述 done。
6. **知识库写成了给人读的书**：规则里 BASE 已叫「索引层」，实践中仍是长文；需求索引埋在 DETAIL 里；没有给机器用的检索表。任务2 一跑就是半天百科，所以没人维护。

### 2.5 知识库目标形态（原先口头说过、初版规划漏写 —— 以此节为准）

#### 结论先说

**要改原知识库，不要推倒重来，也不要再并联第四套「新百科」。**

现有三层文件名继续用。改的是**职责和生成物**，不是换目录、换品牌。

| 现有文件（2.2.0 已有） | 现在实际经常变成 | 2.6 之后必须变成 |
|------------------------|------------------|------------------|
| `PROJECT_KNOWLEDGE_BASE.md` | 偏长文、常被整本塞进上下文 | **骨架**：技术栈、模块清单、文档指针。人 5–10 分钟能扫完目录，**禁止**当小说读、禁止整本注入 |
| `PROJECT_KNOWLEDGE_DETAIL.md`（及分卷） | 深度手册 + 需求索引混在一起 | **按需下钻**：只在索引命中后打开对应章节。日常禁止全文加载 |
| DETAIL 里的 `## 需求索引` | 有规则、常空、机器不好查 | **提升为独立机器索引的一部分**（见下） |
| `PROJECT_KNOWLEDGE_ADMITTED.md` + `query-admit.md` | 已有，但常不跑 | **唯一可当事实注入的层**（2.4 已要求默认跑） |
| `*.puml` | 流程事实 | 保持；代码变了改图，不重写全书 |
| （缺失） | Agent 用 Grep/读长文代替检索 | **新增机器索引文件**，任务2/8.5 的主产物 |

#### 新增：机器索引（人可以不看）

路径锁定（实现时不要改名）：

```text
{目标项目}/docs/knowledge-base/PROJECT_KNOWLEDGE_INDEX.md
{目标项目}/docs/knowledge-base/PROJECT_KNOWLEDGE_INDEX.json
```

- `.md`：给人偶尔扫一眼、给 status 扫描。
- `.json`：**机器检索主入口**（脚本、事实门控 `--query`、Agent 先读这个再决定打开哪个 DETAIL 章节/哪个源码文件）。

`INDEX.json` 最小字段（2.6 不得无故扩）：

```json
{
  "kb_version": "与 BASE 版本号一致",
  "modules": [
    {
      "id": "auth",
      "title": "认证",
      "paths": ["src/auth/", "src/login.js"],
      "symbols": ["login", "verifyToken"],
      "detail_section": "PROJECT_KNOWLEDGE_DETAIL.md#认证",
      "requirements": ["user-login"]
    }
  ],
  "requirements": [
    {
      "id": "user-login",
      "title": "用户登录",
      "level": "M",
      "modules": ["auth"],
      "docs": "docs/user-login/"
    }
  ]
}
```

检索顺序（跨 2.4 / 2.6 / 2.7，实现后必须遵守）：

```text
用户问题
  → INDEX.json 按关键词/路径命中 1–N 个模块或需求
  → verify-kb-facts.js --query「这些模块/符号」
  → 只把 pass 切片注入上下文
  → 需要时再打开命中的 DETAIL 一节或 1–3 个源码文件
  → 禁止打开整本 BASE / 整本 DETAIL
```

#### 原知识库怎么处理（迁移，不是作废）

| 做法 | 允不允许 |
|------|----------|
| 删除现有 BASE/DETAIL/ADMITTED 另起炉灶 | **禁止** |
| 已有项目再跑一遍「半天全量重生」只为换皮 | **禁止**（除非索引损坏或用户明确要求架构重建） |
| 从现有 BASE/DETAIL **抽出** INDEX，缺的字段标 `unknown` | **必须**（2.6 对存量项目的默认动作） |
| 把 BASE 里超过骨架的长叙述下沉到 DETAIL，BASE 只留目录和指针 | **允许**，按模块逐步，禁止一天重写全书 |
| 需求索引仍只写在 DETAIL、不进 INDEX.json | **禁止**（2.6 起双写：DETAIL 表可留，INDEX.json 为权威检索） |
| CodeGraph / `.codegraph/` | 大项目生成骨架时可用；INDEX 可以引用其符号，但不替代 INDEX 文件 |

#### 和「建骨架知识库 + 索引」原话的对应

当初说的「第一次建骨架 + 索引，人不用读完，机器用来检索」= **任务2 的合格产出定义**，不是再发明一种知识库。

- **骨架** = 变瘦后的 BASE + 模块清单  
- **索引** = `INDEX.md` / `INDEX.json` + 需求索引  
- **人不用读完** = 人只看骨架目录；DETAIL 给机器按命中打开  
- **第一次** = 目标项目还没有 `docs/knowledge-base/` 时跑任务2（preflight，大项目问 CodeGraph）  
- **已有知识库** = 抽 INDEX + 必要时瘦 BASE，**不是**再生成一本新书

---


## 3. 版本总图

版本号与根目录 `VERSION` 对齐。每个版本一个需求标识，**禁止**一个标识覆盖多版本。

| 版本 | 建议需求标识 | 一句话 | 用户可感知结果 | 预估级别 |
|------|----------------|--------|----------------|----------|
| **2.3.0** | `single-nl-entry` | 一个斜杠入口 + 自然语言主触发 | 激活后菜单只剩「一入口 + 一句话怎么说」 | M（文档+规则+init；可能动少量脚本） |
| **2.4.0** | `default-fact-gate` | 默认少注入：query 门控 + 压缩包 + S 不进完整文档链 | 小修复不再把整本知识库/整段流水线文档灌进上下文 | M |
| **2.5.0** | `phase-state-guard` | 机器状态 + 证据守卫 + 可恢复 | 没有 05 就不能口头「去做知识库更新」 | L（新脚本+状态机+设计文档） |
| **2.6.0** | `kb-skeleton-index` | **改原知识库形态**：BASE=骨架，新增 INDEX 给机器检索 | 人不用读完；Agent 先查 INDEX 再下钻 | M |
| **2.7.0** | `kb-incremental-ops` | 日常只增量；全量只允许第一次/架构剧变 | 「弄一次半天」退出日常路径 | M |
| **2.8.0** | （可选）`compat-alias` | 旧 `/jit-*` 只保留兼容提示 | 老用户打旧命令会看到「请改说：…」 | S |
| **3.0.0** | `placet-sync-en` | 中文已验证行为译到 Placet | 英文仓与 2.7 行为等价，不重新设计 | M |

**建议开发顺序不可调换：** 2.3 → 2.4 → 2.5 → 2.6 → 2.7。  
原因：先收口入口 → 再瘦上下文 → 再硬门禁 → **再把原知识库改成骨架+索引** → 最后把增量运维绑死。没有 INDEX 就做增量，只会继续补长文。

**2.8、3.0 在 2.7 验收前不要开工。**
**2.6 不得跳过：** 初版规划漏了「骨架+索引」，本修订已补；不能把 2.6 理解成「只禁全量」而不改形态。

---

## 4. 2.3.0 — 单一入口与自然语言（`single-nl-entry`）

### 4.1 目标

用户激活后只需要：

1. 一个斜杠命令（建议对外名称仍兼容：`/jit-devpilot-init`；文档主推说法：`激活DevPilot` / `devpilot`）
2. 之后全部用自然语言表中的句子

### 4.2 非目标（本版本禁止做）

- 不写 `state.yaml` / guard
- 不改 `verify-kb-facts.js` 算法
- 不改知识库生成耗时
- 不翻译 Placet
- 不删除 Skill 目录（实现仍可被 NL 和流水线内部调用）
- 不把 `/van`、Superpowers 变成第二主入口

### 4.3 用户可见行为（验收用）

激活成功后的菜单 **必须** 满足：

1. 第一行仍有版本号 + 目标项目。
2. **斜杠命令区只列 1 条**：激活（若保留 `/jit-devpilot-init`）。
3. 其余能力全部改写成「你可以说：…」自然语言表（沿用现有关键字，不得发明第二套同义命令导致分裂）。
4. 明确写：**修一个小 bug 请直接说「需求：…」并等待分级；不要主动走完整 PRD。**
5. 内部 Skill（知识库、验真、压缩、status、eval）改为「流水线自动调用；你无需记斜杠名」。需要时仍可用旧斜杠（兼容，2.7 再警告）。

### 4.4 规则层必须改的点

| 文件 | 改什么 |
|------|--------|
| `skills/jit-devpilot-init/SKILL.md` | 第 2 步操作菜单：删掉 8–9 条斜杠清单，改为 NL 表 |
| `CLAUDE.md` | 「触发方式二」改为「兼容入口，非推荐」；推荐只保留方式一 |
| `DEVPILOT.md` | QUICKSTART/入口叙述与上一致 |
| `README.md` / 若存在的快速开始 | 同样收口 |
| 各 Skill 的 YAML `description` | 可保留斜杠触发（给 Claude 发现用），但 description 写明「由流水线内部调用，用户请用自然语言 xxx」 |

### 4.5 路由器行为（设计，不是新 DSL）

不新写 NLP 引擎。2.3 继续用 **已有关键字表**。增量只做三条硬规则：

1. 会话已激活且用户句子匹配方式一 → 直接进对应任务，**禁止**再让用户选 `/jit-xxx`。
2. 用户只说「帮我看看这个空指针」这类模糊句 → **必须**问是否走流水线，并建议标识；不得直接开 10 个 Skill。
3. 用户说「需求：」且描述像修补（单点、无新模块）→ 需求分析阶段 **必须给出 S 级建议** 并等待确认，禁止默认当 M/L。

「识别」= 关键字 + 意图门控，不是训练分类模型。

### 4.6 验收标准

- [ ] 激活输出里，斜杠推荐 ≤ 1
- [ ] 自然语言表覆盖任务 2、3、4、5、6、7、8、8.5、9、事实门控、环境
- [ ] 10 个 Skill 目录仍在，流水线内部仍能找到脚本路径
- [ ] 用一句话 `需求：把超时从 3 秒改成 5 秒` 走标识协议，分析文档建议级别为 S（或明确列出建议 S 的理由）
- [ ] 本版本 **零** 个新的对外斜杠命令

### 4.7 验证方法（中文版）

在 `L:\jit\devpilot` 开新会话：只激活，检查菜单；再发一条小需求，确认没有被引导去 `/jit-project-*`。

---

## 5. 2.4.0 — 默认瘦上下文（`default-fact-gate`）

### 5.1 目标

解决：小问题干很久、token 贵、整本知识库/整份 01–03 被复读。

把「规则里的 MUST」变成 **阶段入口检查清单**（仍可以是文档 + 主会话强制步骤；脚本校验放到 2.5 加强）。

### 5.2 三条注入法律（本版本起不可违反）

1. **禁止**把 `PROJECT_KNOWLEDGE_BASE.md` / `DETAIL.md` 全文贴进上下文。只允许：事实门控 `pass` 切片 + 按需打开的单个源码文件。
2. **禁止**进入下一阶段时全文复读上一阶段文档。必须先跑（或复用）`compress-handoff.js`，只读 `.handoff/*.context.md`。
3. **S 级**跳过 PRD、设计、测试用例文档；代码改完出简要测试报告 + 增量知识库。模型不得「为了质量」自行升到 M。

### 5.3 任务级行为

| 场景 | 必须发生 | 禁止 |
|------|----------|------|
| 任务3 开始 | `verify-kb-facts.js "<项目>" --query "<需求关键词>"`，只引用 pass | 无 query 的全库准入当「本次需求事实」 |
| 小修复（已确认 S） | 打开命中的 1–3 个源码文件 | 生成知识库（任务2）、贴 BASE |
| 阶段推进 | compress-handoff | 把 02-prd 全文再读一遍 |
| 用户说「省 token」 | 执行上述三条 | 换小模型充数（本规划不包含换模型） |

### 5.4 非目标

- 不实现 state 机
- 不禁止任务2（新项目第一次全量仍允许，但必须 preflight；日常路径从文档上划走）
- 不改预言机抽断言算法（除非验收发现 query 切片不可用，另开变更）

### 5.5 验收标准

- [ ] 任务3 agent / CLAUDE 步骤写明：无 `.verified/query-admit.md`（或等价 pass 切片）不得引用知识库路径/符号为事实
- [ ] S 级路径在 `01` 里写死跳过清单，与 `CLAUDE.md` 分级表一致
- [ ] 用「改一个超时常量」走一遍：不应出现全量 KB 扫描、不应出现 02/03 文档
- [ ] 文档明确：Comet 式「简单需求耗时数小时」的对策就是本版本 + 2.3 的 S 建议，不是加记忆共享总线

### 5.6 与 token 的关系（写给领导/自己）

省 token 的优先序：

1. S 级少阶段（最大）
2. 不贴整本知识库（次大）。2.6 有 INDEX 后：先检索 INDEX，再注入 pass 切片
3. handoff 压缩（持续）
4. 事实门控缩小切片（准）

没有「无 CPU/GPU 的本地大模型」项。本规划不包含训模/蒸馏。

---

## 6. 2.5.0 — 阶段状态与证据守卫（`phase-state-guard`）

### 6.1 目标

解决：Agent 口述完成、跳阶段、中断后猜进度。

### 6.2 状态文件（设计）

路径（锁定，实现时不要改来改去）：

```text
{目标项目}/docs/{需求标识}/state.yaml
{目标项目}/docs/{需求标识}/.devpilot/state-events.jsonl
```

`state.yaml` 最小字段（实现不得无故扩字段；要扩必须先改本文）：

```yaml
id: user-login                 # 需求标识
level: S                       # S | M | L，用户确认后写入
phase: requirements            # 见下枚举
status: waiting_confirm        # in_progress | waiting_confirm | blocked | done
evidence:
  original_requirements: docs/user-login/00-原始需求.md
  analysis: docs/user-login/01-requirements-analysis.md
  prd: null                    # S 级允许 null
  design: null
  test_cases: null
  test_report: docs/user-login/05-test-report.md
updated_at: 2026-09-30T00:00:00+08:00
```

阶段枚举与现有流水线对齐，**不要**换成 Comet 的 Shape/Build 名：

```text
identified → original_req → analysis → (prd) → (design) → impl → (test_cases) → report → kb_update → done
```

括号内阶段：S 级在 `state.yaml` 中标记 `skipped: true`，guard 不得要求这些文件存在。

### 6.3 Guard 行为（设计）

建议脚本位置：

```text
skills/jit-devpilot-init/scripts/  不合适（会暗示入口膨胀）
skills/jit-phase-guard/scripts/devpilot-guard.js   # 2.5 允许新增这一个内部 Skill
```

若坚持「2.3 之后不再新增对外 Skill」：脚本可放在 `skills/jit-devpilot-init/scripts/devpilot-guard.js`，**不**注册新的斜杠名，只由流水线内部 `node` 调用。

**推荐：不新增斜杠 Skill。** 脚本挂在现有 init 或 fact-gate 旁的 `scripts/`，自然语言不出现新命令。

守卫规则（与级别相关）：

| 想进入 | S 必须已有文件 | M/L 必须已有文件 |
|--------|----------------|------------------|
| analysis | 00 | 00 |
| prd | （跳过） | 01 |
| design | （跳过） | 02 |
| impl | 01 + 用户已确认级别 | M：03；L：03+03a |
| test_cases | （跳过） | 实现完成证据（见下） |
| report | 实现完成 | 04 |
| kb_update | 05 | 05 |
| done | 8.5 完成或明确跳过理由 | 同左 |

「实现完成证据」2.5 第一刀采用轻量定义：`tests/{标识}/` 存在或用户确认无测。不要做成 Comet 级 Verifier 双 Agent（那是后续可选，不在 2.5 必做）。

失败时：stdout 明确 `[HARD STOP]` + 缺哪个文件。模型不得自行改 `state.yaml` 跳过；只允许运行 `devpilot-guard.js --apply` 在校验通过后更新 phase。

每次成功迁移追加 `state-events.jsonl`（append-only）：时间、from、to、证据路径。

### 6.4 可恢复

中断后续跑：

1. 读 `state.yaml` 的 `phase` / `level`
2. 读 `.handoff` 压缩包（2.4 已要求）
3. **禁止**为了恢复而全量生成知识库或重读全部 00–05

### 6.5 与人工确认的关系

Guard **替代不了**用户确认。  
`waiting_confirm` 时脚本不得 `--apply` 进入下一阶段。  
这是和 Comet 默认自动推进的本质差别，**禁止改掉**。

### 6.6 本版本必出文档（L 级）

因触及跨模块（CLAUDE 协议、每需求目录、新脚本），按框架规则：

- `01-requirements-analysis.md`
- `02-prd.md`
- `03-software-design.md`（含状态机图：phase 跃迁）
- `03a-change-strategy.md`（分批：先 state 字段 → 再 guard → 再接入 CLAUDE 步骤）
- 测试：`04` + `04a`

设计文档必须写清：文档与 state 双轨如何防漂移（guard 以文件存在为准回写 state，不以 state 为准删文档）。

### 6.7 验收标准

- [ ] 缺 00 时无法 `--apply` 到 analysis
- [ ] S 级缺 02 不阻断 impl
- [ ] M 级缺 05 时 kb_update 被 HARD STOP
- [ ] 中断后只读 state + handoff 能说出下一动作
- [ ] 无新的用户斜杠命令

---

## 7. 2.6.0 — 骨架知识库 + 机器索引（`kb-skeleton-index`）

> 本节补上初版规划漏掉的内容。对应口头原话：「建骨架知识库 + 索引。人不用读完，机器用来检索。」  
> **形态总纲见 §2.5。** 本节是落地版本。

### 7.1 目标

让任务2/8.5 的合格产物变成：**瘦 BASE + INDEX.json（机器）+ DETAIL 下钻 + ADMITTED 验真**。  
存量项目走「抽出 INDEX」，不走「再生成一本新知识库」。

### 7.2 原知识库改不改（本版本唯一答案）

**改形态、改生成契约、改检索入口。不删、不换品牌、不另起目录。**

| 文件 | 2.6 动作 |
|------|----------|
| `PROJECT_KNOWLEDGE_BASE.md` | 保留。增加硬限制：只允许骨架章节（项目简介、技术栈、模块表、文档指针、PUML 索引、版本记录）。超长业务叙述迁到 DETAIL |
| `PROJECT_KNOWLEDGE_DETAIL.md` 及分卷 | 保留。需求索引表可保留给人看，但检索权威改为 INDEX.json |
| `PROJECT_KNOWLEDGE_ADMITTED.md` | 保留。预言机逻辑 2.6 不改算法，只增加「query 可来自 INDEX 命中词」 |
| **新建** `PROJECT_KNOWLEDGE_INDEX.md` / `.json` | 2.6 主交付。validate-kb.js 必须检查 INDEX 存在且与 BASE 版本号一致 |
| 任务2 SKILL / 示例 | 改「合格定义」：没有 INDEX 视为任务2 失败；有超长 BASE 无模块表视为失败 |
| 任务8.5 | 本版本至少：改代码涉及的模块必须能更新 INDEX 对应条；全量增量纪律放到 2.7 |

### 7.3 任务2 新合格定义（第一次建库）

目标项目尚无 `docs/knowledge-base/` 时：

1. 仍先 preflight；大项目仍先问 CodeGraph。
2. 产出必须同时有：BASE（骨架）、DETAIL（可先薄）、INDEX.md、INDEX.json、ADMITTED（跑一遍 verify）。
3. **失败条件**：只有一篇超长 BASE、没有 INDEX.json。
4. 人验收只看：模块表能否指向路径；不要求人读完 DETAIL。

### 7.4 存量项目默认动作（已有 BASE/DETAIL）

1. 脚本或一次性转换：从 BASE 模块表 + DETAIL 标题 + 需求索引 **生成 INDEX**，路径/符号抽不出则写 `unknown`（不得编造）。
2. 跑 `verify-kb-facts.js` 刷新 ADMITTED；`unknown` 不得标 pass。
3. 不强制同一天瘦完整本 BASE；可列「BASE 超骨架章节」为后续 8.5 债。
4. **禁止**为了「对齐 2.6」再全仓扫描半天。

### 7.5 非目标

- 不在本版本做 2.7 的「日常禁止任务2」全文（可交叉引用）
- 不把 INDEX 做成向量数据库 / RAG 服务
- 不替换 CodeGraph；大项目可把 CodeGraph 当生成 INDEX 的输入
- 不新增对外斜杠命令（内部 `node` 脚本可以有）

### 7.6 验收标准

- [ ] `validate-kb.js`：缺 INDEX.json 失败
- [ ] 新项目任务2 产物含骨架 BASE + INDEX，人无需读 DETAIL 即可用 INDEX 找到模块路径
- [ ] 存量项目有「只抽 INDEX、不全量重扫」的路径，文档写明
- [ ] CLAUDE/知识库规则写明检索顺序：INDEX → 门控 pass → 下钻源码/DETAIL 一节
- [ ] 原 BASE/DETAIL/ADMITTED 文件仍在，无「新知识库」平行目录

### 7.7 建议需求标识

`kb-skeleton-index`（用户确认前不得建 `docs/kb-skeleton-index/`）

---

## 8. 2.7.0 — 知识库日常增量（`kb-incremental-ops`）

### 8.1 目标

在 **INDEX 已存在** 的前提下，纠正「公司级 = 先生成历史百科」。

正确公式：

```text
第一次（无 knowledge-base/）或架构剧变：任务2（按 2.6 合格定义：骨架+INDEX）
日常 90%：INDEX 检索 → --query 事实门控 → 改 1–3 文件 → 任务8.5 只补 INDEX 对应条 + DETAIL 一节 + 需求索引一行
过期条目：fail 则失去「当事实」的权力，必须下钻源码
```

### 8.2 必须写进规则的禁令

1. **禁止**为单点 bug 跑任务2 全量扫描。
2. **禁止**把「知识库更新」理解成重扫全仓。8.5 只改：INDEX 对应模块/需求条、DETAIL 受影响节、CHANGELOG 锚点、必要时 ADMITTED 刷新。
3. 任务2 仅当：目标项目无 `docs/knowledge-base/`，或用户明确说「架构大变，全量重建」，或 preflight 判定 INDEX 损坏且无法从现有文档抽出。
4. 全量预估超过约定阈值（沿用 `IS_LARGE_PROJECT`）必须先问用户，禁止默默跑半天。
5. 8.5 **禁止**为了「完整」而扩写未命中模块的 DETAIL。

### 8.3 维护责任（流程，不是新部门）

知识库维护者 = **改这段代码的人**。  
status 扫描：本次需求若已有 05，则 INDEX.requirements 必须有对应 `id`，否则报缺。

### 8.4 验收标准

- [ ] status：有 05 无 INDEX 需求行 = 未完成
- [ ] 日常改 bug 路径零「生成知识库」（任务2）
- [ ] 8.5 SKILL 白名单：INDEX 条、DETAIL 命中节、锚点、ADMITTED；禁止重写无关模块
- [ ] 依赖 2.6：无 INDEX 时本版本不得声称完成

---

## 9. 2.8.0 — 旧斜杠兼容（可选）

若 2.3 已把菜单收口但用户仍打 `/jit-project-knowledge-base`：

- Skill 仍执行原功能（且须满足当时已生效的 2.6 合格定义）
- 开头打印一行：`建议改说：生成知识库，目标项目：<路径>`
- 不在激活菜单里出现

可与 2.7 合并，若 token 紧则推迟。

---

## 10. 3.0.0 — 同步英文 Placet

### 10.1 前提

`L:\jit\devpilot` 上 2.3–2.7 均已用中文真实小问题验证。

### 10.2 规则

- 只翻译用户可见字符串、文档、Skill 名（已有 `placet-*` 映射）
- 禁止在翻译时改阶段枚举、guard 语义、S/M/L 表、INDEX 字段名
- 文件名维持 Placet 已定英文：`00-original-requirements.md` 等；知识库英文标题按 Placet 已有（Requirement Index 等），INDEX.json 字段保持英文 key
- 工作目录 `L:\jit\placet`，**禁止**改回 `L:\jit\devpilot` 混提

### 10.3 映射备忘（实现时对照，不要凭记忆发明新名）

| 中文 2.x | Placet |
|----------|--------|
| `/jit-devpilot-init` | `/placet-init` |
| 自然语言「激活DevPilot」 | `activate Placet` / `/placet-init` |
| `verify-kb-facts.js` | 同脚本名，框架路径 `placet-framework-path` |
| `docs/{id}/state.yaml` | 同路径结构 |
| `PROJECT_KNOWLEDGE_INDEX.json` | 同文件名 |

---

## 11. 每个版本的开发纪律（给下一会话的 AI）

1. **目标项目**必须先锁定为 `L:\jit\devpilot`（3.0 除外）。
2. **标识确认前**禁止读业务源码与 `docs/{标识}/`（知识库可读，当事实前要门控）。
3. 一次会话只做一个版本号。做完更新本文「实现状态」表，再停。
4. 不新增对外斜杠 Skill（2.5 的 guard、2.6 的 INDEX 生成脚本除外且无斜杠）。
5. 不把 Collective `/van` 当产品路径。
6. 用户英语弱：中文版报错与文档优先；英文只在 3.0。
7. 发现本文与代码冲突：先在「基线勘误」追加一节，再改代码。
8. 不要在本规划里夹带：本地训模、蒸馏、无 CPU/GPU 推理、做 Comet 克隆。

---

## 12. 实现状态（换会话时改这里）

| 版本 | 状态 | 需求目录 | 备注 |
|------|------|----------|------|
| 2.2.0 | 基线（已发布于本仓库 VERSION） | — | 双轨入口、规则型门控 |
| 2.3.0 | **完成（报告已确认 2026-09-30）** | `docs/single-nl-entry/`（00–05 全套） | 含 R4 三层兜底 + 自定义描述循环；TC13–TC15 运行时冒烟随日常使用验证。下一版本：2.4.0 `default-fact-gate` |
| 2.4.0 | 未开始 | 待确认 `default-fact-gate` | |
| 2.5.0 | 未开始 | 待确认 `phase-state-guard` | L 级 |
| 2.6.0 | 未开始 | 待确认 `kb-skeleton-index` | **补漏：骨架+机器索引，改原知识库形态** |
| 2.7.0 | 未开始 | 待确认 `kb-incremental-ops` | 依赖 2.6 的 INDEX |
| 2.8.0 | 可选 | 待定 | |
| 3.0.0 | 阻塞于 2.7 | Placet | |

**本文产出时未创建任何 `docs/{标识}/00-原始需求.md`。** 下一会话从确认 `single-nl-entry` 开始。

---

## 13. 范围裁剪问答（避免下一会话理解走样）

**Q：是不是做一个 NLP 引擎？**  
A：不是。用现有中文关键字表 + 激活后禁止再推销斜杠。

**Q：Skill 要删光吗？**  
A：不要。删的是用户菜单，不是 `skills/jit-*` 实现。

**Q：和 Comet 比谁全？**  
A：不比全。比「小问题能 S、知识能验真、阶段有证据」。

**Q：知识库还要不要？原知识库改不改？**  
A：要。**改原三层，不推倒。** BASE 收成骨架；新增 INDEX 给机器检索；DETAIL 按需下钻；ADMITTED 仍是唯一可注入事实。禁止另起第四套百科，禁止为换皮再全量扫半天。见 §2.5、2.6.0。

**Q：当初说的「建骨架 + 索引，人不用读完」去哪了？**  
A：初版规划漏写，已补为 §2.5 + 版本 2.6.0（`kb-skeleton-index`）。原 2.6 增量运维顺延为 2.7.0。

**Q：能不能 2.3 和 2.5 一起做？**  
A：不能。token 与评审都会糊。

**Q：能不能先改 Placet？**  
A：不能。用户已指定中文 `devpilot` 验证。

---

## 14. 建议的用户确认词（下一会话）

```text
确认 single-nl-entry，按 docs/DEVPILOT_VERSION_PLAN.md 做 2.3.0，不要做 2.4 及以后。
```

---

## 15. 基线勘误

（实现过程中若发现 2.2.0 与本文第 2 节不符，按时间倒序追加。）

| 日期 | 发现 | 处理 |
|------|------|------|
| 2026-09-30 | 用户指出「骨架+索引」未入初版规划 | 增补 §2.5、2.6.0 `kb-skeleton-index`；原增量运维改为 2.7.0 |
| 2026-09-30 | 初版按仓库 Skill 列表与 CLAUDE.md 触发表核对 | — |

---

## 16. 文档维护

- 路径：`L:\jit\devpilot\docs\DEVPILOT_VERSION_PLAN.md`
- 变更本文视为规划变更：只追加，不静默删约束
- 代码不得与第 1.2、第 2.5 节知识库形态、第 3 节顺序、第 11 节纪律冲突
