# DevPilot 在 Claude Code 中的使用指南

> 目标：在**目标项目目录**启动 Claude Code，完整走通 DevPilot 流水线，不依赖框架目录下的 `/van` 与 `@agent` 发现。

---

## 1. 启动方式（统一叙事）

**推荐**：在目标项目目录（或任意目录）启动 Claude Code，首条消息执行：

```
/jit-devpilot-init
```

Skill 会读取 `~/.claude/devpilot-framework-path` 加载 `$FRAMEWORK/CLAUDE.md` 与 `cicd-rules.md`。

**可选**：在框架目录 `claude-code-autopilot` 内启动，同样可用；`/van` 与框架内 Agent 定义在此目录下可 Tab 补全。

| 方式 | 目录 | `/jit-*` Skill | `/van` | 框架 Agent |
|------|------|:--:|:--:|:--:|
| 推荐 | 目标项目 | ✅ | ❌ | 通过 Skill 委派 |
| 可选 | 框架根目录 | ✅ | ✅ | ✅ |

---

## 2. 目标项目会话：Agent 委派协议

在目标项目目录下，**禁止假设** `@requirements-analysis-agent` 等可被 Claude Code 自动发现。

**标准委派模式**（所有流水线阶段通用）：

```
1. 读取 ~/.claude/devpilot-framework-path → $FRAMEWORK
2. 读取 $FRAMEWORK/.claude/agents/{agent-name}.md 全文
3. Task(subagent_type="generalPurpose", prompt="按下列 Agent 规范执行：\n{agent md 全文}\n\n任务上下文：...")
4. 产出写入目标项目 docs/{需求标识}/，禁止写入框架目录
```

> **Claude Code 委派说明**：Claude Code 里 `@agent` 不会被自动发现，**以「读 Agent 文件 + 主会话执行」为准**。`Task(generalPurpose)` 注入 agent md 全文是 Claude Code 的实现方式之一；在 Cursor / 其他 IDE 里可改为直接读文件后由主会话按 agent 规范执行。两种方式都必须严格遵循 agent md 中的规则。

| 任务 | 关键字 | Agent 文件 | Skill 备选 |
|------|--------|-------------|-----------|
| 2 知识库 | `生成知识库` | — | `/jit-project-knowledge-base` |
| 2.5 事实门控 | `知识库验真` / 任务3–9 引用知识库前 | — | `/jit-project-knowledge-fact-gate` |
| 3 需求分析 | `需求分析` | `requirements-analysis-agent.md` | 主会话 + Agent 委派 |
| 4 PRD | `生成PRD` | `prd-generation-agent.md` | 主会话 + Agent 委派 |
| 4.5 接口契约先行 | PRD 确认后高风险项目启用 | `software-design-agent.md` 或主会话 | 主会话 + Agent 委派 |
| 5 设计 | `软件设计` | `software-design-agent.md` | 主会话 + Agent 委派 |
| 6 编码 | `代码实现` | `code-implementation-agent.md` | 主会话 + Agent 委派 |
| 7 测试用例 | `测试用例` | — | 主会话 + Agent 委派 |
| 8 报告 | `测试报告` | — | 主会话 + Agent 委派 |
| 8.5 KB 增量 | `知识库更新` | — | `/jit-project-knowledge-base-update` |
| 9 变更 | `需求变更` | `change-request-agent.md` | 主会话 + Agent 委派 |
| — 状态 | `查看状态` | — | `/jit-project-devpilot-status` |

任务 2（知识库）进入 Skill 后必须先执行 `preflight-kb` 轻量自检，展示源码文件数、项目体积、是否大项目和 CodeGraph 状态；大项目必须先询问用户是否使用 CodeGraph，确认后才可执行 `codegraph build`。生成或增量更新后必须再跑 `verify-kb-facts.js` 刷新准入清单。任务 3/4/5/6/9 把知识库当当前事实前必须带 `--query` 跑事实门控，只引用 pass。

---

## 3. 查看所有需求状态

新开会话或切换项目后，用状态 Skill **恢复上下文并列出全部需求**（不是单个需求摘要）：

```
/jit-project-devpilot-status
```

或：

```
查看状态，目标项目：D:\your-project
```

扫描范围：

| 来源 | 路径 |
|------|------|
| 需求文档 | `{project}/docs/{需求标识}/`（排除 `knowledge-base`） |
| 需求索引 | `docs/knowledge-base/PROJECT_KNOWLEDGE_DETAIL.md` → `## 需求索引` |
| 测试代码 | `{project}/tests/{需求标识}/`（若存在） |

可执行扫描（推荐在 Skill 内调用）：

```bash
node "$FRAMEWORK/skills/jit-project-devpilot-status/scripts/scan-status.js" "D:\your-project"
```

输出为 Markdown 表格：每个需求的级别、状态、当前阶段、缺失文档；并标注 KB 与 docs 不一致的孤儿项。

---

## 4. DevPilot vs Collective 边界

| 路径 | 用途 | 触发 |
|------|------|------|
| **DevPilot** | 需求 → PRD → 设计 → 代码 → 测试 → 报告 | `/jit-devpilot-init` + 自然语言 / `/jit-*` |
| **Collective 研究** | TaskMaster、hub-spoke 实验 | 仅框架目录 `/van` + TaskMaster |

DevPilot 流水线**不依赖** TaskMaster MCP。当前版本仅支持单元测试：任务 6 单元测试由 `code-implementation-agent` 或主会话完成；任务 7 单元测试用例文档、任务 8 单元测试报告由主会话 + Agent 委派完成。集成测试、E2E、Playwright 留到后续版本。

Superpowers 只作为 DevPilot 阶段内增强层使用。委派 Agent 时，如果当前阶段启用 Superpowers，prompt 必须同时带上：

- 当前 DevPilot 阶段和 S/M/L 级别
- 使用的 Superpowers skill 名称
- 允许读取的输入文件
- 必须返回的输出证据，例如边界问题清单、RED/GREEN/REFACTOR、review 处理结果、verification 测试结果

禁止用 Superpowers 触发词绕过 DevPilot 的需求标识确认、人工确认和阶段门禁。

---

## 5. 推荐工作流

```bash
cd D:\your-project
claude
```

```
/jit-devpilot-init
/jit-project-devpilot-status
生成知识库，目标项目：D:\your-project
需求分析：xxx，目标项目：D:\your-project
生成PRD
确认PRD，生成接口契约
软件设计
确认设计，开始代码实现
确认代码，生成测试用例
确认用例，生成测试报告
知识库更新
```

---

## 6. 安装与更新

```bash
cd claude-code-autopilot
bash install.sh          # 安装 Skills + 记录 devpilot-framework-path
bash update-skills.sh    # 更新 Skills + 刷新 framework-path
```

安装后 `jit-*` Skill 位于 `~/.claude/skills/`（含 devpilot-init、project-knowledge-base、project-knowledge-base-update、project-devpilot-status、env-auto-setup、ui-ux-pro-max、nowTimeAndModel 等）。
