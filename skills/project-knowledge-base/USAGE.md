# 使用说明：`project-knowledge-base` Skill

> 目标：把“历史项目”沉淀为结构化的 `PROJECT_KNOWLEDGE_BASE.md`（可复用、可查阅、可交接）。

---

## 1) 这个 Skill 文件夹里每个文件的用途

请把以下文件放在同一个目录中（缺一不可的只有 `SKILL.md`，其余为强烈推荐配套）：

| 文件 | 是否必须 | 用途 | 什么时候看/用 |
|---|---|---|---|
| `SKILL.md` | 必须 | **执行流程主说明**：阶段划分、强约束、交付物结构、质量门槛 | 你要“跑流程”时看它；它决定助手怎么做事 |
| `reference.md` | 推荐 | **字段标准**：模块字典/工具索引/技术栈/图资产/重构建议的字段定义 | 你想统一团队口径、避免文档字段飘忽时看它 |
| `examples.md` | 推荐 | **通用结构示例**：展示 `PROJECT_KNOWLEDGE_BASE.md` 应该长什么样（不绑定业务） | 你想快速对齐输出长相、给新人示例时用它 |
| `USAGE.md` | 推荐 | **如何触发与如何对话**：配置位置、对话模板、常见缺失项 | 你想把 Skill 当“私域 SOP”教给团队时用它 |

---

## 2) 放置位置（让 AI 助手能识别）

### 对于 **Cursor**：
二选一即可：

1. **个人私域 Skill**：`~/.cursor/skills/project-knowledge-base/`（**推荐，一次安装全项目可用**）
   - Windows 完整路径：`C:\Users\你的用户名\.cursor\skills\project-knowledge-base\`
   - macOS/Linux 完整路径：`~/.cursor/skills/project-knowledge-base/`
2. **项目私域 Skill**：`.cursor/skills/project-knowledge-base/`（仅当前项目可用）

> 只要该目录里存在 `SKILL.md`，Cursor 就能在对话中自动识别并应用该 Skill。

### 对于 **Claude Code**：
Claude Code 没有内置 Skill 目录机制，有两种用法：

1. **手动读取方式**（简单直接）：  
   在对话中直接告诉 Claude：`请先读取 project-knowledge-base-skill/SKILL.md，然后按照这个 Skill 的流程分析我的项目`

2. **保存到固定位置**（方便重复使用）：  
   保存在你的用户目录下，例如：
   - Windows: `C:\Users\你的用户名\.claude\skills\project-knowledge-base\`
   - macOS/Linux: `~/.claude/skills/project-knowledge-base/`  
   使用时：`请读取 ~/.claude/skills/project-knowledge-base/SKILL.md，然后分析当前项目`

---

## 3) 对话时你需要提供什么？（最少三要素）

为了减少来回确认，建议你一次性提供：

1. **项目根目录绝对路径**
2. **是否允许全量读取/检索**（默认：允许）
3. **输出文件路径**（默认：项目根目录生成 `PROJECT_KNOWLEDGE_BASE.md`，可指定 `docs/PROJECT_KNOWLEDGE_BASE.md`）
4. **期望深度**（可选，默认：`标准完整`）：
   - `快速骨架` → 仅概览+模块字典，快
   - `标准完整` → 概览+模块+工具+流程图+技术栈+建议，够用
   - `尽量详尽` → **增加入口分析+API清单+配置分析+数据层分析**，细节丰富

推荐一句话直接给齐：

> 请使用 `project-knowledge-base` Skill。项目根目录：`E:/my-project`。输出中文。允许读取全仓。期望深度：尽量详尽。请在项目根目录生成 `PROJECT_KNOWLEDGE_BASE.md`。

---

## 4) 可选补充（让结果更贴合你的期望）

- **你最关心的方向**：架构 / 复用 / 接口 / 数据 / 安全 / 重构
- **项目领域背景**：一句话（可选）
- **主构建文件**：如果项目有多个构建文件，可指定哪一个为主

---

## 5) 常见“术语/字段”对照（避免上下文不一致）

### 5.1 模块类型对照

在 `SKILL.md` 中常用中文分类；在 `reference.md` 字段里可能用英文枚举。对应关系如下：

| 中文（SKILL） | 英文（reference） |
|---|---|
| 聚合入口 | Aggregation |
| 业务模块 | Business |
| 基础/通用模块 | Foundation |
| 构建/部署模块 | Build |

### 5.2 工具类索引要点（强约束）

- **必须全量列举**所有 `*Util*` / `*Helper*`（不是抽样）
- **TOP 10 只是快速入口**（可选），不能替代全量索引

---

## 6) Skill 会自动做什么？（你不需要逐条指挥）

按 `SKILL.md` 固定流程，助手会：

- 扫描目录与模块划分
- 读取主构建文件提取技术栈与版本证据
- 输出模块业务字典表
- 全量索引 `*Util*` / `*Helper*` 并分类统计
- 整合现成流程图资产（若存在）并文字化解释
- 输出架构说明与“有证据”的问题/重构建议
- 生成最终 `PROJECT_KNOWLEDGE_BASE.md`

---

## 7) 你可能需要补充的缺失项（被问到就按一句话补）

最常见三类：

- 项目根目录绝对路径
- 允许读取范围/权限边界
- 输出落盘位置（默认项目根目录）

---

## 8) 验收点（你拿到 KB 后快速检查）

- 是否包含：模块业务字典表
- 是否包含：Util/Helper **全量索引表**
- 是否包含：分类统计（每类数量）
- 是否包含：技术栈版本证据与架构说明
- 是否包含：有证据的重构建议

