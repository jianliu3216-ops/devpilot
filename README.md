# DevPilot

**面向 Claude Code 的文档驱动 AI 开发流水线**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Skill%20%2B%20Agent-1f6feb)](https://github.com/jianliu3216-ops/devpilot)
[![Version](https://img.shields.io/badge/version-1.0.5.5-informational)](VERSION)

Spec-driven AI development pipeline for Claude Code: one sentence in, requirements → PRD → design → TDD → tests → knowledge base out. Every stage waits for human confirmation.

用一句话驱动完整研发流程：需求分析 → PRD → 软件设计 → TDD 编码 → 测试用例 → 测试报告 → 知识库更新。每个阶段人工确认后再进入下一阶段。

仓库：[github.com/jianliu3216-ops/devpilot](https://github.com/jianliu3216-ops/devpilot)

---

## 它解决什么问题

直接让 AI 写代码，常见后果是：需求没对齐、设计不可追溯、改完没人知道影响了哪。DevPilot 把研发过程收成**可恢复、可分级、可归档**的流水线：

| 能力 | 说明 |
|------|------|
| 文档驱动 | 每个需求独立目录：`00` 原始需求 → `01` 分析 → `02` PRD → `03` 设计 → `04` 用例 → `05` 报告 |
| 人工门控 | 阶段完成必须确认，禁止 AI 自行跳阶段 |
| S / M / L 分级 | 小改直接改代码，中改走完整流程，大改加变更策略与回归清单 |
| 项目知识库 | 先理解现有代码，再开发；后续阶段复用知识库，不必反复全库扫描 |
| 目标项目隔离 | 框架目录只放流水线；产出写到你的业务项目 `docs/` 与 `tests/` |

---

## 30 秒上手

```bash
git clone https://github.com/jianliu3216-ops/devpilot.git
cd devpilot
bash install.sh --tools    # Windows 请用 Git Bash 或 WSL
```

然后在**目标项目**目录启动 Claude Code：

```text
/jit-devpilot-init
需求分析：我要做用户登录模块
```

AI 会建议英文需求标识（如 `user-login`），等你确认后创建 `docs/user-login/00-原始需求.md`，再评估 S/M/L 并往下走。

完整命令与 FAQ 见 [快速入门.md](快速入门.md)。

---

## 流水线

```text
激活 DevPilot
    ↓
生成知识库（历史项目建议先做）
    ↓
需求分析  →  确认级别 S / M / L
    ↓
PRD（S 级跳过）
    ↓
软件设计（S 级跳过；L 级另出变更策略）
    ↓
代码实现（M/L 走 TDD）
    ↓
测试用例（S 级跳过）
    ↓
测试报告
    ↓
知识库增量更新
```

需求中途变了，说 `需求变更：user-login 增加忘记密码`。AI 只重做受影响的阶段，未受影响的文档和代码保持不动。

| 你想做什么 | 这样说 |
|-----------|--------|
| 让 AI 理解现有项目 | `生成知识库`（首次需指定目标项目） |
| 开始一个新需求 | `需求分析：功能描述` |
| 生成 PRD | `生成PRD` |
| 软件设计 | `软件设计` |
| 写代码 | `代码实现` |
| 生成测试用例 | `测试用例` |
| 跑测试出报告 | `测试报告` |
| 修改已有需求 | `需求变更：<标识> <描述>` |
| 查看进度 | `/jit-project-devpilot-status` |

---

## 变更分级

不指定级别时，AI 在需求分析阶段自动评估并请你确认。

| 级别 | 规模 | 流程 |
|:----:|------|------|
| **S** | ≤3 文件 | 简要分析 → 直接改 → 简要测试报告 → 知识库更新 |
| **M** | 4–15 文件或 2–3 模块 | 完整阶段：分析 → PRD → 设计 → TDD → 用例 → 报告 → 知识库 |
| **L** | >15 文件或跨模块 | 完整阶段 + 变更策略分批执行 + 回归清单 |

---

## 目标项目产出

```text
你的业务项目/
├── docs/
│   ├── knowledge-base/          # 项目知识库（全项目共享，增量更新）
│   └── user-login/              # 单个需求（互不覆盖）
│       ├── 00-原始需求.md
│       ├── 01-requirements-analysis.md
│       ├── 02-prd.md
│       ├── 03-software-design.md
│       ├── 04-test-cases.md
│       ├── 05-test-report.md
│       └── CHANGELOG.md
└── tests/user-login/            # 该需求的单元测试
```

---

## 文档怎么读

| 文件 | 给谁 | 作用 |
|------|------|------|
| [README.md](README.md) | 人类 / GitHub | 本文件：产品介绍与安装 |
| [快速入门.md](快速入门.md) | 人类 | 30 秒上手、常用口令、FAQ |
| [DEVPILOT.md](DEVPILOT.md) | AI / 维护者 | **流水线流程事实源**（阶段、产出、质量标准） |
| [CLAUDE.md](CLAUDE.md) | AI | 行为规则、门控、触发关键字 |
| [docs/DEVPILOT_CLAUDE_CODE_GUIDE.md](docs/DEVPILOT_CLAUDE_CODE_GUIDE.md) | AI | Agent 委派协议 |
| [docs/定制与拓展.md](docs/定制与拓展.md) | 维护者 | 如何改流程、加 Skill、加 Agent |
| [升级指南.md](升级指南.md) | 维护者 | 框架升级 |
| [docs/github-repo-settings.md](docs/github-repo-settings.md) | 维护者 | GitHub About / Topics / 默认分支填写说明 |

> 以前根目录 `README.md` 同时承担「产品介绍」和「AI 规则书」，容易让 GitHub 访客看到一份 1000+ 行内部规程。现已拆开：`README.md` 给人看，`DEVPILOT.md` 给 Agent 看。

---

## 环境要求

| 依赖 | 版本 | 说明 |
|------|------|------|
| Node.js | >= 18 | `node -v` |
| git | 任意 | `git --version` |
| Claude Code | 最新 | `npm install -g @anthropic-ai/claude-code` |
| CodeGraph | 可选，Node >= 22.12.0 | 大项目知识库扫描加速，见 [安装指南](docs/CodeGraph%20安装指南.md) |

Windows 下 `install.sh` / `update-skills.sh` 需 **Git Bash 或 WSL**。框架升级后执行 `bash update-skills.sh` 补装新 Skill。

---

## 许可证

本项目采用 [MIT License](LICENSE)。

部分能力参考并集成 [claude-code-collective](https://github.com/claude-code-collective/claude-code-collective)，相关组件遵循其原许可证。
