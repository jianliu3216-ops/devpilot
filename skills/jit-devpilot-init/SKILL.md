---
name: jit-devpilot-init
description: 在任何目录下激活 Autopilot 智能开发流水线。加载完整行为规则和流程引擎，无需 cd 到框架目录。执行后必须输出完整操作菜单。
---

# Autopilot — 智能开发流水线激活

**YOU MUST 在完成框架加载后，将下方操作菜单完整输出给用户。禁止跳过、禁止概括、禁止只说"已激活"。**

## 执行步骤

### 第 1 步：定位并加载框架

读取 `~/.claude/devpilot-framework-path` 获取框架路径（记为 `$FRAMEWORK`），然后按顺序读取：

1. `$FRAMEWORK/CLAUDE.md`
2. `$FRAMEWORK/.claude-collective/cicd-rules.md`
3. `$FRAMEWORK/README.md`（按需查阅关键章节）

### 第 2 步：输出操作菜单

加载完成后，如有历史项目路径则顺带确认，**然后必须逐字输出以下内容**：

```
🚀 Autopilot v$(cat $FRAMEWORK/VERSION) 已激活
📂 目标项目：{路径或"未指定"}

💡 建议优先执行（如已完成可跳过）：
  /jit-project-knowledge-base       → 扫描项目代码，生成结构化知识文档
  /jit-project-autopilot-status     → 查看各需求进度和文档完整性
```

| 输入方式 | 说明 |
|---------|------|
| `生成知识库，目标项目：<路径>` | 扫描项目代码，生成结构化知识文档 |
| `查看状态，目标项目：<路径>` | 查看各需求进度和文档完整性 |
| `需求分析：<功能描述>，目标项目：<路径>` | 分析需求，评估 S/M/L 级别（通过 /van → Agent 执行） |
| `生成PRD` | 生成产品需求文档（通过 /van → Agent 执行） |
| `软件设计` / `变更策略` | 软件架构设计或变更策略（通过 /van → Agent 执行） |
| `代码实现` / `开始编码` | TDD 代码实现（通过 /van → Agent 执行） |
| `测试用例` / `回归验证` | 测试用例或回归验证清单（通过 /van → Agent 执行） |
| `测试报告` / `运行测试` | 执行测试，生成报告（通过 /van → Agent 执行） |
| `需求变更：<需求标识> <变更描述>` | 分析变更影响，增量重做（通过 /van → Agent 执行） |
| `/jit-env-auto-setup` | 检测 Node/Python/git 环境，检测完即可用读取或生产文件 |
| `/jit-ui-ux-pro-max` | UI/UX 智能设计引擎 |

禁止扫描 docs 目录、禁止调用 project-autopilot-status。
