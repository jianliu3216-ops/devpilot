---
name: jit-project-knowledge-base-update
description: DevPilot 任务8.5 — 知识库增量更新。更新 DETAIL 需求索引、函数清单、涉及模块，不全量重扫。在 Claude Code 中通过 /jit-project-knowledge-base-update 触发。
---

# jit-project-knowledge-base-update — 知识库增量更新

> **运行环境：Claude Code**。需求完成或变更后执行，不全量重扫。

## 触发

```
/jit-project-knowledge-base-update --project <目标项目路径> [--req-id <需求标识>]
```

或自然语言：`知识库更新` / `更新知识库`

## 前置

1. 读取 `~/.claude/devpilot-framework-path` → `$FRAMEWORK`
2. 读取 `$FRAMEWORK/docs/KNOWLEDGE_BASE_RULES.md` §6.1
3. 读取 `$FRAMEWORK/skills/jit-project-knowledge-base/reference.md` §7–9

## 输入

| 来源 | 用途 |
|------|------|
| `docs/{需求标识}/` 全套文档 | 本次变更范围 |
| 本次修改的源码文件 | 增量更新模块/函数 |
| `docs/knowledge-base/PROJECT_KNOWLEDGE_DETAIL.md` | 更新目标 |
| `docs/knowledge-base/*.puml` | 流程变更时优先更新 |

## 执行步骤（固定顺序）

### 1. 判断更新范围

- 架构/部署变更 → 同步更新 BASE
- 功能/模块/函数变更 → 更新 DETAIL
- 流程变更 → **先**更新 PUML，再更新 DETAIL

### 2. 更新 DETAIL（每次需求完成 MUST）

- **需求索引表**：追加或更新一行（标识、中文名、级别、涉及模块、版本）
- **函数清单表**：追加/更新本次变更涉及的函数行
- **API 清单**（若有 HTTP 变更）：追加端点行
- **更新记录**：版本 +1，追加变更说明

### 3. 更新 00-原始需求.md 锚点

```markdown
## 知识库锚点
- 知识库版本：vX.Y
- 涉及模块域：...
- 详见：docs/knowledge-base/PROJECT_KNOWLEDGE_DETAIL.md
```

### 4. 自检清单

- [ ] DETAIL 需求索引已更新
- [ ] 函数清单表已同步
- [ ] PUML 变更记录已追加（若涉及）
- [ ] BASE/DETAIL/PUML 版本号一致

### 5. 运行知识库校验

```bash
node "$FRAMEWORK/skills/jit-project-knowledge-base/scripts/validate-kb.js" "<目标项目路径>"
```

若校验出现 Error，必须修复后才算任务 8.5 完成；Warning 需要在输出中说明原因和后续处理建议。

## 输出

告知用户更新的文件路径、版本号和 `validate-kb.js` 校验结果。**禁止**全量重扫整个项目（除非用户明确要求重建知识库）。

## 与任务 2 区别

| 任务 | Skill | 范围 |
|------|-------|------|
| 2 全量 | `/jit-project-knowledge-base` | 首次接入，全项目扫描 |
| 8.5 增量 | `/jit-project-knowledge-base-update` | 仅本次需求涉及章节 |
