---
name: jit-project-knowledge-base-update
description: DevPilot 任务8.5 — 知识库增量更新。更新 DETAIL 需求索引、函数清单、涉及模块，不全量重扫。由 DevPilot 流水线内部调用；用户请使用自然语言：知识库更新 / 更新知识库。
---

# jit-project-knowledge-base-update — 知识库增量更新

> 💡 兼容提示（2.8.0）：自然语言已是主入口，本斜杠命令保留兼容。建议改说：**更新知识库**

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

### 0. 更新白名单（2.7.0 起，硬边界）

任务8.5 **只允许改四类内容**，白名单之外一行不动：

| 白名单 | 动作 |
|--------|------|
| `PROJECT_KNOWLEDGE_INDEX.json/.md` | 刷新本次需求对应条目（`build-index.js` 重跑即可） |
| `PROJECT_KNOWLEDGE_DETAIL*.md` | 只改本次需求命中的模块节 + 需求索引行 + 更新记录 |
| `docs/{需求标识}/CHANGELOG.md` | 知识库锚点 |
| `PROJECT_KNOWLEDGE_ADMITTED.md` | 事实门控刷新 |

**禁改清单（违反即返工）**：

- 未命中模块的 DETAIL 章节（禁止为「完整」扩写）
- BASE 全文重写（BASE 只在架构剧变时按任务2 更新）
- 与本次需求无关的 PUML（禁止删掉重写）
- 禁止为单点 bug 跑任务2 全量重扫（规则 11；任务2 仅三情形：无 knowledge-base/ / 用户明说架构剧变 / INDEX 损坏无法抽出）

### 1. 判断更新范围

- 架构/部署变更 → 同步更新 BASE
- 功能/模块/函数变更 → 更新 DETAIL
- 流程变更 → **先**更新 PUML，再更新 DETAIL

### 2. 更新 DETAIL（每次需求完成 MUST）

- **需求索引表**：追加或更新一行（标识、中文名、级别、涉及模块、版本）
- **函数清单表**：追加/更新本次变更涉及的函数行
- **API 清单**（若有 HTTP 变更）：追加端点行
- **更新记录**：版本 +1，追加变更说明

### 3. 更新 CHANGELOG.md 锚点

在 `docs/{需求标识}/CHANGELOG.md` 的 `## 知识库锚点` section 中写入（**唯一写入位置**，不在 00/01/02/03 等开发文档内重复）：

```markdown
## 知识库锚点
- 知识库版本：vX.Y
- 涉及模块域：...
- 详见：docs/knowledge-base/PROJECT_KNOWLEDGE_DETAIL.md
```

### 4. 自检清单

- [ ] DETAIL 需求索引已更新
- [ ] INDEX 条目已刷新（`build-index.js` 重跑）
- [ ] 函数清单表已同步
- [ ] PUML 变更记录已追加（若涉及）
- [ ] BASE/DETAIL/PUML 版本号一致
- [ ] 白名单外文件零改动

### 5. 重建机器索引并校验

```bash
node "$FRAMEWORK/skills/jit-project-knowledge-base/scripts/build-index.js" "<目标项目路径>"
node "$FRAMEWORK/skills/jit-project-knowledge-base/scripts/validate-kb.js" "<目标项目路径>"
```

`build-index.js` 从当前 BASE/DETAIL/需求目录全量重建 INDEX（秒级，不扫源码），所以步骤 2 更新的 DETAIL 需求索引行会自动进入 INDEX，无需手改 JSON。

若校验出现 Error，必须修复后才算任务 8.5 完成；Warning 需要在输出中说明原因和后续处理建议。

### 6. 刷新事实门控

```bash
node "$FRAMEWORK/skills/jit-project-knowledge-fact-gate/scripts/verify-kb-facts.js" "<目标项目路径>" --query "<本次需求标识或变更关键词>"
```

向用户报告 pass/fail。fail 表示刚写入的知识库仍有与源码不一致的可证伪字段，应修正 DETAIL 后重跑，或在输出中标明这些条目不得当事实。

## 输出

告知用户更新的文件路径、版本号、`validate-kb.js` 校验结果和事实门控 pass/fail。**禁止**全量重扫整个项目（除非用户明确要求重建知识库）。

## 与任务 2 区别

| 任务 | Skill | 范围 |
|------|-------|------|
| 2 全量 | `/jit-project-knowledge-base` | 首次接入，全项目扫描 |
| 8.5 增量 | `/jit-project-knowledge-base-update` | 仅本次需求涉及章节 |
