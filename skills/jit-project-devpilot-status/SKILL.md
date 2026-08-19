---
name: jit-project-devpilot-status
description: 扫描目标项目 docs/ 与 tests/ 目录，列出**全部**需求的状态（S/M/L 文档完整性、测试代码、变更中/暂停），输出结构化总览和下一步建议。新会话可替代 init 做恢复。
---

# DevPilot 智能流水线 - 状态

**作用：** 新开会话后一键恢复工作状态；**必须列出当前所有需求的状态**，不得只汇报单个需求。

详细规则见 [reference.md](reference.md)。

## 执行步骤

### 步骤 0：自动激活检测

1. 读取 `~/.claude/devpilot-framework-path` → `$FRAMEWORK`，读取 `$FRAMEWORK/VERSION`
2. 加载 `$FRAMEWORK/CLAUDE.md`、`$FRAMEWORK/.claude-collective/cicd-rules.md`
3. 输出 `🚀 DevPilot v{版本号} 已激活`
4. 确定目标项目路径（会话已指定 / 当前目录非框架目录则提示确认 / 否则询问）
5. 确认后记住路径，本会话后续操作自动使用

### 步骤 1：扫描**全部**需求（强制）

**MUST 执行以下全部项，禁止遗漏：**

1. **运行扫描脚本**（首选）：
   ```bash
   node "$FRAMEWORK/skills/jit-project-devpilot-status/scripts/scan-status.js" "<目标项目绝对路径>"
   ```
2. **枚举 docs 需求目录**：`{project}/docs/*/`（**排除** `knowledge-base`、`.` 开头目录）
3. **读取知识库需求索引**：`docs/knowledge-base/PROJECT_KNOWLEDGE_DETAIL.md` 的 `## 需求索引` 表
4. **合并去重**：docs 目录 + KB 索引两处来源，逐条输出；标注「仅 KB 有 / 仅 docs 有」的孤儿项
5. **对每个需求**按 reference.md 顺序检查：
   - CHANGELOG.md → 暂停 / 变更中
   - `01-requirements-analysis.md` 前 40 行 → S/M/L（**禁止**凭文件数猜级别）
   - `CHANGELOG.md` → 是否包含 `## 知识库锚点`
   - 按级别判 docs 完整性
   - `tests/{需求标识}/` 测试代码目录是否存在
6. **可选但推荐：运行知识库校验脚本**（历史项目 / 大项目建议执行）：
   ```bash
   node "$FRAMEWORK/skills/jit-project-knowledge-base/scripts/validate-kb.js" "<目标项目绝对路径>"
   ```

### 步骤 2：输出状态 + 下一步建议

以脚本输出为骨架，补充 CHANGELOG 变更细节，格式见下方。

## 按级别判断文档完整性

| 级别 | docs 必需 | 测试代码 |
|------|----------|--------|
| **所有级别** | `00-原始需求.md` | — |
| **S** | 00 + 01 + 05 | `tests/{id}/` 可选；跳过 02/03/04 **文档** |
| **M** | 00 + 01 + 02 + 03 + 04 + 05 | `tests/{id}/` 可选；`02a` 接口契约按需 |
| **L** | 00 + 01 + 02 + 03 + **03a** + 04 + **04a** + 05 | `tests/{id}/` 可选；`02a` 高风险/接口变更推荐 |

**L 级 MUST 同时有** `03-software-design.md` 与 `03a-change-strategy.md`（不是二选一）。

S 级缺 02/03/04 **文档**是正常的；但缺 `05-test-report.md` 仍标为进行中。

## 状态定义

| 状态 | 判断条件 |
|------|----------|
| ⏳ 待开始 | 目录存在但无 00/01 |
| 🔄 进行中 | 按级别必需文档不全 |
| ⚠️ 待确认级别 | 已有需求文档但无法从 01/00/KB 索引读取 S/M/L |
| ✅ 已完成 | 按级别 docs 齐全 + `05-test-report.md` |
| ✅✅ 变更完成 | 已完成 + CHANGELOG 含已关闭变更记录 |
| ⏸️ 暂停 | CHANGELOG 或 01 明确标注暂停 |
| 🔁 变更中 | CHANGELOG 有未关闭变更记录 |

## 当前阶段推断

| 最新已有文档 | 下一步 |
|-------------|--------|
| 仅 00 | 任务3 需求分析 |
| 01（S 级） | 任务6 `代码实现`（S 级跳过 PRD/设计/测试用例） |
| 01（M/L 级） | 任务4 `生成PRD` |
| 02 | 任务4.5 `确认PRD，生成接口契约`（如需）或任务5 `软件设计` |
| 02a | 任务5 `软件设计` |
| 03（L 级另需 03a） | 任务6 `代码实现` |
| 04（L 级另需 04a） | 任务7 `测试用例` |
| 05 | 任务8.5 `知识库更新` |

## 状态输出格式（必须含**全部**需求）

```
📊 项目状态总览

项目路径：D:\projects\my-app
知识库：✅ BASE + DETAIL（需求索引 N 条）
CodeGraph：✅ .codegraph 已存在 / ⚠️ 大项目建议先运行 codegraph build

| 标识 | 级别 | 状态 | 当前阶段 | 缺失 | 测试代码 |
|------|:--:|:--:|---------|------|--------|
| user-login | S | ✅ | 已完成 | — | ✅ 有 |
| hw-swl-core | M | 🔄 | 任务7 测试用例 | 05-test-report | ✅ 有 |
| log-print-cleanup | M | 🔄 | 任务6 编码 | 04, 05 | — |
| ...（每一行一个需求，不得省略）... |

⚠️ 孤儿项：
  - KB 有 docs 无：...
  - docs 有 KB 未登记：... → 建议任务8.5 更新索引

下一步建议：
  - log-print-cleanup [M]：确认代码后 `测试用例`
  - ...
```

## Skill 命令列表

```
/jit-devpilot-init                  → 激活流水线
/jit-project-knowledge-base         → 生成知识库（任务2）
/jit-project-knowledge-fact-gate    → 知识库事实门控（注入前验真）
/jit-project-devpilot-status       → 查看状态（本 Skill）
/jit-project-knowledge-base-update  → 知识库增量更新（任务8.5）
/jit-env-auto-setup                 → 环境配置
/jit-ui-ux-pro-max                  → UI/UX 设计
```

自然语言触发：`查看状态`、`项目状态`、`目标项目：<路径> 状态`

## 牢记规则

- 产出写入**目标项目**，禁止写入框架目录
- 每个需求文档在 `docs/{需求标识}/`；测试代码在 `tests/{需求标识}/`
- knowledge-base 共享一份，任务8.5 增量更新
- **本 Skill 的核心职责是「所有需求一张表」**——用户说 status 时期望看到完整列表，不是单个需求的摘要
- 每阶段完成后等待用户确认，不自动进入下一阶段
