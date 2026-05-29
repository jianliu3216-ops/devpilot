---
name: project-cicd-status
description: 查看 Autopilot 智能流水线项目当前状态。别名：/project-cicd-status，实际加载 project-autopilot-status 完整内容。
---

# Autopilot 智能流水线 - 状态（CICD 别名）

> 本 Skill 是 `/project-autopilot-status` 的别名，功能完全相同，保留供老用户使用。
> **直接执行 `/project-autopilot-status` 的完整流程**，不需要重复维护两份内容。

## 执行方式

**忽略本文之后的简化内容，改用 `project-autopilot-status/SKILL.md` 的完整步骤执行。**

具体来说：
1. 读取 README.md 和 CLAUDE.md
2. 检查目标项目路径（仅当前会话用户明确提供才算）
3. 扫描项目状态、汇总需求进度
4. 输出自然语言触发示例（需求分析 / 生成PRD / Skill命令），不再使用"开始任务N"格式

用户输入格式：
```
需求分析：功能描述，目标项目：D:\projects\my-app
需求变更：需求标识 变更内容
```
