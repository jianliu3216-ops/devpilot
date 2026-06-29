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
3. `$FRAMEWORK/docs/KNOWLEDGE_BASE_RULES.md`（知识库贯穿与增量更新规则）
4. `$FRAMEWORK/docs/DEVPILOT_CLAUDE_CODE_GUIDE.md`（Claude Code 委派协议）
5. `$FRAMEWORK/README.md`（按需查阅关键章节）

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
| `生成知识库，目标项目：<路径>` | 任务2：扫描项目，生成知识库 |
| `查看状态，目标项目：<路径>` | 查看需求进度和文档完整性 |
| `需求分析：<功能描述>，目标项目：<路径>` | 任务3：需求分析 + S/M/L 分级（requirements-analysis-agent） |
| `生成PRD` | 任务4：产品需求文档 |
| `确认PRD，生成接口契约` | 任务4.5：接口契约先行（高风险 / L 级推荐） |
| `软件设计` / `变更策略` | 任务5：软件设计 |
| `代码实现` / `开始编码` | 任务6：TDD 代码实现 |
| `测试用例` / `回归验证` | 任务7：测试用例文档 |
| `测试报告` / `运行测试` | 任务8：测试报告 |
| `知识库更新` / `更新知识库` | 任务8.5：/jit-project-knowledge-base-update |
| `需求变更：<需求标识> <变更描述>` | 任务9：变更影响分析 |
| `/jit-env-auto-setup` | 检测 Node/Python/git 环境 |
| `/jit-project-knowledge-base-update` | 知识库增量更新 |
| `/jit-ui-ux-pro-max` | UI/UX 智能设计引擎 |
| `/jit-nowTimeAndModel` | 查看日期时间与模型信息 |

**目标项目目录**：Agent 在 `$FRAMEWORK/.claude/agents/`，通过读取 agent md + Task 委派，见 DEVPILOT_CLAUDE_CODE_GUIDE.md。

---

### 第 3 步：激活后会话行为协议（YOU MUST FOLLOW FOR ENTIRE SESSION）

**本协议在 Autopilot 激活后持续生效，直到会话结束。每个用户消息都必须经过以下门控检查。**

#### 3.1 需求/变更检测门控（FLOW GATE — 最高优先级）

当用户消息涉及以下任一情况时，**必须先执行需求标识确认，再执行任何代码探索或文件操作**：

| 用户意图 | 触发模式 | 第一步动作 |
|---------|---------|-----------|
| 新需求/功能 | 描述功能改动、新增逻辑、参数变更、字段追加等 | ① 建议需求标识 → ② 等待用户确认 |
| 需求变更 | 提到已有需求标识 + 改动描述 | ① 确认变更范围 → ② 等待用户确认 |
| 需求文档修改 | 提到 docs/ 下需求目录的文件 | ① 确认是变更还是新增 → ② 等待用户确认 |

#### 3.2 需求标识确认协议（MANDATORY SEQUENCE，不可调换顺序）

```
检测到需求意图
    │
    ▼
① 建议需求标识（kebab-case 英文短标识）
    │  示例：需求【管理帧密钥缓存追加AP真实MAC标识】英文标识建议：mgmt-ap-real-mac-id
    │  规则：AI 根据需求描述自动建议，必须提示用户确认
    │
    ▼
② 用户确认标识（用户可能调整，必须等用户回复）
    │
    ▼
③ 创建 docs/{标识}/00-原始需求.md + CHANGELOG.md
    │  （在目标项目目录下，先于一切分析工作）
    │
    ▼
④ 进入需求分析 / 变更影响分析
    │
    ▼
⑤ 🔴 分级评估 → 用户确认级别 → 按级别进入后续阶段
```

#### 3.3 禁止行为（ANTI-PATTERNS — 绝对不可做）

| 禁止行为 | 说明 | 错误示例 |
|---------|------|---------|
| ❌ 先读代码再确认标识 | 在需求标识确认前，**禁止**读取任何源码文件 | 用户说"追加唯一标识"，AI 直接去读 `.lua` 文件 |
| ❌ 先读文档再确认标识 | 在需求标识确认前，**禁止**读取 docs/ 下的需求文档 | 用户说"改需求"，AI 先去读 `00-原始需求.md` |
| ❌ 跳过标识直接分析 | 无论需求看起来多简单，**禁止**跳过标识确认 | 用户说"加个日志"，AI 直接改代码 |
| ❌ 同时做多件事 | 标识确认阶段，**禁止**同时探索代码、git log 等 | 用户说需求，AI 一边建议标识一边读代码 |
| ❌ 替用户决定标识 | **禁止**不提示用户就直接使用某个标识 | AI 直接创建 `docs/xxx/` 目录 |

**唯一例外**：用户已在本会话中明确指定了需求标识（如 `需求变更：mgmt-unicast-key-derivation xxx`），此时标识已确认，可直接进入变更分析。

#### 3.4 正确行为示例（FOLLOW THIS PATTERN）

```
用户: 需求日志中追加唯一标识，暂定为AP真实mac

AI: 需求标识建议：mgmt-ap-real-mac-id
    中文名：管理帧密钥缓存追加AP真实MAC唯一标识
    请问这个标识是否可以？或者你想调整？

用户: 可以

AI: [创建 docs/mgmt-ap-real-mac-id/00-原始需求.md 和 CHANGELOG.md]
    [然后进入需求分析...]
```

#### 3.5 意图模糊时的处理

如果用户意图模糊（如"检查下"、"看看"、"完善工具"等），**先确认意图再行动**：
- 判断是否涉及需求/变更 → 是则走门控，否则按常规处理
- 不确定时 → **向用户确认**："这个改动是作为新需求走 Autopilot 流程，还是直接修改？"

#### 3.6 Superpowers 阶段内增强协议

Superpowers 不作为 DevPilot 主入口，只能在阶段内部增强执行质量。每次使用必须记录：

| 字段 | 说明 |
|------|------|
| 触发阶段 | 任务3 / 任务4.5 / 任务5 / 任务6 / 任务8前等 |
| 使用 skill | brainstorming、test-driven-development、systematic-debugging 等 |
| 输入材料 | 当前阶段允许读取的文档、代码或测试结果 |
| 输出证据 | 问题清单、方案取舍、RED/GREEN/REFACTOR、review 处理、verification 结果 |

门禁未通过时必须停留当前阶段，不得进入下一阶段。
