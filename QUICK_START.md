# Autopilot 智能流水线 — 快速开始指南

## 前置要求

| 依赖 | 最低版本 | 检查命令 |
|------|---------|----------|
| Node.js | >= 18 | `node -v` |
| git | 任意版本 | `git --version` |
| Claude Code CLI | 最新版 | `npm install -g @anthropic-ai/claude-code` |

## 安装

```bash
# 1. 克隆仓库
git clone <本仓库地址> claude-code-autopilot
cd claude-code-autopilot

# 2. 一键安装（Skills + 基础工具包）
bash install.sh --tools

# 可选：补充安装 Node.js 工具包（docx/xlsx/pdf-parse 等）
bash install.sh --tools-only

# 可选：安装 CodeGraph（代码图谱分析，辅助知识库生成和影响分析）
npm install -g @optave/codegraph
```

## 启动

```bash
# 必须在框架目录下启动 Claude Code
cd claude-code-autopilot
claude
```

启动后看到 `✅ Autopilot 智能流水线 v1.5 — 就绪` 即表示成功。

## 新会话恢复

每次新开 Claude Code 会话后，先用以下命令恢复工作状态：

```
/project-autopilot-status 目标项目路径
```

或（老用户习惯）：

```
/project-cicd-status 目标项目路径
```

两个命令功能完全相同，AI 会自动扫描目标项目的已有产出文档，总结各需求的完成进度。

## 触发方式（三种，选择你最习惯的）

### 方式一：自然语言关键字（推荐，无需记编号）

直接描述你要做什么，AI 自动识别进入对应流程：

```
需求分析：我要做用户登录模块，支持手机号验证码登录，目标项目：D:\projects\my-app
```

```
生成PRD
```

```
确认设计，开始代码实现
```

| 说这个 | 进入 |
|-------|------|
| `需求分析：xxx` | 任务3 — 分析需求，评估变更级别 |
| `生成PRD` | 任务4 — 生成产品需求文档 |
| `软件设计` / `变更策略` | 任务5 — 软件架构设计或变更策略 |
| `代码实现` / `开始编码` | 任务6 — TDD 代码实现 |
| `测试用例` / `回归验证` | 任务7 — 测试用例或回归验证清单 |
| `测试报告` / `运行测试` | 任务8 — 执行测试，生成报告 |
| `知识库更新` | 任务8.5 — 增量更新知识库 |
| `需求变更：xxx` | 任务9 — 分析变更影响，增量重做 |
| `生成知识库` | 任务2 — 为历史项目生成知识库 |

### 方式二：Skill 命令（/ 开头，Tab 可发现）

```
/project-autopilot-status   → 查看项目状态（会话恢复）
/project-cicd-status        → 同上（老用户别名）
/project-knowledge-base     → 任务2：生成项目知识库
/requirement-analysis       → 任务3：需求分析
/generate-prd               → 任务4：生成PRD
/software-design            → 任务5：软件/策略设计
/implement-code             → 任务6：代码实现
/test-cases                 → 任务7：测试用例
/test-report                → 任务8：测试报告
/requirement-change         → 任务9：需求变更
```

### 方式三：传统任务编号（向后兼容，老用户可用）

```
开始任务3，目标项目：D:\projects\my-app，需求：xxx
执行任务4，确认需求分析，继续生成 PRD
执行任务9，需求标识：user-login，需求变更：xxx
```

## 完整流程示例

```
👤 用户: 需求分析：我要做用户登录注册模块，支持手机号验证码登录和密码登录，目标项目：D:\projects\my-app

🤖 AI:  需求【用户登录注册模块】英文标识建议：user-login
        是否需要调整？

👤 用户: 没问题

🤖 AI:  [读取 README.md 流程规则]
        [生成 01-requirements-analysis.md]
        📊 变更级别评估：M 级（约8个文件，涉及2个模块）
        后续流程：标准6阶段
        是否调整级别？

👤 用户: 确认

🤖 AI:  ✅ 需求分析完成：D:\projects\my-app\docs\user-login\01-requirements-analysis.md

👤 用户: 生成PRD

🤖 AI:  [自动带上需求分析文档]
        [生成 02-prd.md]
        ✅ PRD 完成：D:\projects\my-app\docs\user-login\02-prd.md

👤 用户: 确认PRD，继续软件设计

🤖 AI:  [自动带上需求分析 + PRD]
        [生成 03-software-design.md]
        ✅ 软件设计完成：D:\projects\my-app\docs\user-login\03-software-design.md

👤 用户: 开始代码实现

🤖 AI:  [自动带上知识库 + 需求分析 + PRD + 软件设计]
        [TDD：先写测试 → 再写实现 → 重构]
        📂 测试代码目录确认：D:\projects\my-app\tests\user-login\
        是否需要调整？

👤 用户: 不用

🤖 AI:  [代码实现完成，测试全部通过]
        ✅ 代码已生成到 D:\projects\my-app\

👤 用户: 生成测试用例

🤖 AI:  [生成 04-test-cases.md]
        ✅ 测试用例完成

👤 用户: 生成测试报告

🤖 AI:  [运行测试套件]
        [生成 05-test-report.md]
        ✅ 测试报告完成：通过 12/12
        [自动触发知识库增量更新]

🤖 AI:  知识库已增量更新（v1.2 → v1.3，更新了登录模块域章节）
        🎉 本批次开发流程正式结束
```

## 变更级别速查

| 级别 | 文件数 | 特点 | 流程 |
|------|:---:|------|------|
| **S** | ≤3 | 小改动 | 简要分析 → 直接改 → 简要报告 |
| **M** | 4-15 | 新功能/模块 | 完整6阶段标准流程 |
| **L** | >15 | 框架升级/重构 | 策略文档 → 分批执行 → 回归验证 |

不指定级别时 AI 自动评估并建议。

## 目标项目目录结构

```
目标项目/
├── docs/
│   ├── knowledge-base/              # 项目知识库（共享，增量更新）
│   │   └── PROJECT_KNOWLEDGE_BASE.md
│   ├── user-login/                  # 需求A：独立目录
│   │   ├── 01-requirements-analysis.md
│   │   ├── 02-prd.md
│   │   ├── 03-software-design.md
│   │   ├── 04-test-cases.md
│   │   ├── 05-test-report.md
│   │   └── CHANGELOG.md
│   └── message-push/               # 需求B：完全隔离
│       └── ...
├── tests/
│   ├── user-login/                  # 需求A的测试代码
│   └── message-push/               # 需求B的测试代码
└── (项目源代码...)
```

## 推荐工具：CodeGraph

[CodeGraph](https://www.npmjs.com/package/@optave/codegraph) 是代码图谱分析工具，可与 Autopilot 流程协同使用：

| 流程阶段 | CodeGraph 辅助 |
|----------|---------------|
| 知识库生成 | `codegraph build` 自动生成依赖图和模块关系，替代手动扫描 |
| 需求分析 | `codegraph query` 快速了解代码结构和复杂度 |
| 变更分析 | `codegraph fn-impact <func>` 精确计算变更影响半径 |
| 质量门禁 | `codegraph dead-code`、`codegraph check` 自动检测问题 |

安装和使用：
```bash
npm install -g @optave/codegraph
cd your-project && codegraph build
codegraph query MyFunction    # 查询函数调用关系
codegraph fn-impact MyFunc    # 分析修改影响
```

## 常见问题

**Q: 我可以跳过某些阶段吗？**
A: 可以。直接说需求然后说"一次性生成需求分析、PRD、设计文档，我一起评审"。

**Q: 新开会话后 AI 忘记了之前的状态怎么办？**
A: 输入 `/project-autopilot-status 目标项目路径`（或 `/project-cicd-status 目标项目路径`）即可恢复状态。

**Q: 项目已有产出文档，需求变更需要从头来吗？**
A: 不需要。使用"需求变更：xxx"，AI 自动分析影响范围，只重做受影响的部分。

**Q: 流程中的"确认"是必须的吗？**
A: 是的，每个阶段产出都需要你确认。这是质量保障机制，防止方向跑偏。

**Q: 知识库每次都要重新生成吗？**
A: 不需要。首次生成是全量扫描，后续都是增量更新，只改变更涉及的部分。
