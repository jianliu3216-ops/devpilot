---
name: devpilot-init
description: 在任何目录下激活 DevPilot 智能开发流水线。加载完整行为规则和流程引擎。
---

# DevPilot — 智能开发流水线激活

**作用：** 无需 `cd` 到 devpilot 目录，在任何项目目录下输入 `/devpilot-init` 即可激活完整的 DevPilot 流水线。

## 执行步骤

### 第 1 步：加载框架规则

DevPilot 框架目录：`L:\jit\devpilot`

按顺序读取以下文件并**将其规则作为本会话的行为准则**：

1. **读取 CLAUDE.md**：`L:\jit\devpilot\CLAUDE.md` — 这是 DevPilot 流程的唯一行为规则源，包含：
   - 流程触发规则（自然语言关键字 → 自动调用 Skill）
   - 变更分级规则（S/M/L 三级，自动评估 + 用户确认）
   - 按级别自动适配的流程表（哪些阶段跳过、哪些走轻量流程）
   - 知识库更新规则（流程闭环，测试报告完成后必须增量更新）
   - 需求变更规则

2. **读取 cicd-rules.md**：`L:\jit\devpilot\.claude-collective\cicd-rules.md` — 补充规则：
   - 所有文档输出到目标项目目录，绝不输出到框架目录
   - 一个需求一个目录：`[目标项目]/docs/{需求标识}/`
   - 知识库共享：`[目标项目]/docs/knowledge-base/`
   - 测试代码：`[目标项目]/tests/{需求标识}/`

3. **读取 README.md**：`L:\jit\devpilot\README.md` — 完整流程参考（不需要从头读到尾，作为按需参考源）

### 第 2 步：确认目标项目

询问用户目标项目路径。格式：

```
🚀 DevPilot v$(cat L:\jit\devpilot\VERSION) 已激活

请提供目标项目路径，例如：
  D:\projects\my-app

或直接描述需求：
  需求分析：用户登录模块，目标项目：D:\projects\my-app
```

### 第 3 步：进入就绪状态

用户提供目标项目路径后，扫描 `{目标项目}/docs/` 目录：

- 如果已有需求目录 → 输出各需求状态总览（标注 S/M/L 级别）
- 如果没有 → 提示用户输入需求开始新流程

提示格式：
```
📊 DevPilot 就绪

下一步：
  需求分析：<功能描述>     → 开始新需求
  需求变更：<需求ID> <描述> → 变更已有需求
  生成知识库               → 为历史项目生成知识库
```

## 关键规则（强制遵守）

- **所有产出文档输出到目标项目目录**，绝不输出到框架目录 `L:\jit\devpilot`
- **每个阶段完成后必须等待用户确认**，不能自动进入下一阶段
- **用户不指定变更级别时，必须自动评估并等用户确认**
- **流程最后一步（测试报告）完成后，必须执行知识库增量更新**
- **Skills 命令补充**：除了自然语言触发，也可以用 `/requirement-analysis`、`/generate-prd`、`/software-design`、`/implement-code`、`/test-cases`、`/test-report`、`/requirement-change` 直接调用
