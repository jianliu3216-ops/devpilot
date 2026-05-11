# 历史项目分析方法 & 提示词模板

> 用于新接收历史项目时，快速建立项目知识库，提取可复用资产

---

## 目录

- [一、标准分析步骤](#一标准分析步骤)
- [二、完整提示词模板（给AI用）](#二完整提示词模板给ai用)
- [三、精简提示词模板](#三精简提示词模板)
- [四、提示词关键要点](#四提示词关键要点)

---

## 一、标准分析步骤

### 第一步：宏观认知阶段

1. **扫描根目录** → 获取项目整体结构，识别顶级模块
2. **读取主构建文件** → pom.xml / build.gradle，了解技术栈、版本、依赖
3. **识别架构模式** → 判断是Maven多模块还是单模块，分层方式
4. **确定项目领域** → 明确这是什么类型的项目（AIOPS/CRM/ERP等）

### 第二步：模块梳理阶段

1. **模块分类** → 聚合入口 / 业务模块 / 基础模块 / 构建模块
2. **业务标签化** → 给每个模块标注：业务含义、核心功能、优先级
3. **理解命名规范** → 摸清项目的代码组织规律

### 第三步：资产提取阶段

1. **全局搜索工具类** → 按语言约定查找：
   - Java/Kotlin: `*Util*` / `*Helper*` / `*Utils`
   - Go: `*util*` / `*helper*` 包
   - JavaScript/TypeScript: `utils/` / `helpers/` 目录下
   - Python: `utils.py` / `helpers.py` / `*_utils.py`
   - C#: `*Helper` / `*Utility`
2. **按功能分组** → 加密、通知、文件、网络、日志、日期、转换、校验、...
3. **评估复用价值** → 标记哪些是通用工具，可以直接在新项目复用
4. **阅读核心代码** → 验证关键工具的功能正确性

### 第四步：整合阶段

1. **整合已有资产** → 项目中已有的流程图、文档整合进来
2. **理解主业务流程** → 梳理出核心业务链路
3. **识别技术债务** → 发现重复代码、不合理设计，给出建议

### 第五步：输出阶段

输出结构化的 `PROJECT_KNOWLEDGE_BASE.md`，包含：
- 目录导航
- 项目整体概览
- 业务流程图
- 模块字典（表格）
- 工具索引（表格）
- 技术栈清单
- 架构说明
- 重构建议

---

## 二、完整提示词模板（给AI用）

复制粘贴直接用：

```markdown
我新接收了一个历史项目，需要你帮我分析并建立项目知识库。请按照以下步骤进行：

### 任务要求：
1. 首先探索项目整体目录结构，自动识别构建系统，识别主模块划分
2. 如果有README.md，自动整合项目简介；如果有git信息，提取仓库地址
3. 读取项目主构建文件（pom.xml / build.gradle / package.json / go.mod 等），了解技术栈
4. 按照模块逐个分析，说明每个模块的业务含义和核心功能
5. 全局搜索所有工具类/工具函数（按语言约定：Java *Util*/Helper, JS utils/目录, Python utils.py 等），整理成可复用索引
6. 如果项目中有已有的流程图（puml/png/jpg/svg等），请整合进去
7. 输出一份结构化的 PROJECT_KNOWLEDGE_BASE.md 知识库文档

### 输出内容必须包含：
- 项目整体概览（定位、架构、模块统计）
- 业务流程图（如果已有，整合进去）
- 模块业务字典表格（模块名、业务含义、优先级）
- 可复用工具类索引（按功能分类，标记高复用性工具）
- 技术栈版本说明（必须带证据来源）
- 架构设计说明
- 发现的代码问题和重构建议（只写有证据的）
- 分析边界说明（哪些目录无法扫描、哪些假设成立）

### 格式要求：
- 使用 Markdown 格式
- 多用表格展现，方便查阅
- 对每个工具类说明功能和使用场景
- 标记出「高复用性TOP 10」工具，方便后续开发快速取用

请直接开始分析，然后在项目根目录生成 PROJECT_KNOWLEDGE_BASE.md 文件。
```

---

## 三、精简提示词模板

```
请使用 project-knowledge-base Skill 帮我分析当前目录的历史项目，建立项目知识库：

项目根目录：{这里填你的项目绝对路径}
输出中文，允许全量读取，请在项目根目录生成 PROJECT_KNOWLEDGE_BASE.md。
```

### 最简直接用（当前目录）：

```
请使用 project-knowledge-base Skill 分析当前目录，允许全量读取，生成 PROJECT_KNOWLEDGE_BASE.md。
```

---

## 四、提示词关键要点

一定要在提示词中包含这几点，AI才能输出对你有用的结果：

| 要点 | 作用 |
|------|------|
| `按模块说明业务含义` | 避免AI只输出结构不说清楚业务 |
| `提取所有工具类` | 明确告诉AI要找可复用资产 |
| `标记高复用性工具` | AI会帮你筛选，不用你自己逐个找 |
| `输出 PROJECT_KNOWLEDGE_BASE.md` | 明确输出位置和文件名 |
| `多用表格` | 结果清晰易读，方便快速查找 |

---

## 安装配置

### 对于 Cursor：
```bash
# 创建目录（Windows PowerShell）
mkdir -p $env:USERPROFILE\.cursor\skills\project-knowledge-base

# 复制文件
cp project-knowledge-base-skill/* $env:USERPROFILE\.cursor\skills\project-knowledge-base/
```

安装完成后，在任意项目中直接调用：
```
请使用 project-knowledge-base Skill 分析当前项目，生成 PROJECT_KNOWLEDGE_BASE.md
```

### 对于 Claude Code：
无需特殊安装，直接在对话中：
```
请先读取 ./project-knowledge-base-skill/SKILL.md，然后按照这个 Skill 的流程分析当前项目，生成 PROJECT_KNOWLEDGE_BASE.md
```

如果想全局安装：
```bash
# 创建目录
mkdir -p ~/.claude/skills/project-knowledge-base

# 复制文件
cp project-knowledge-base-skill/* ~/.claude/skills/project-knowledge-base/
```

使用时：
```
请读取 ~/.claude/skills/project-knowledge-base/SKILL.md，然后分析当前项目，生成 PROJECT_KNOWLEDGE_BASE.md
```

---

## 使用示例

在当前这个 JIT-AIOPS-Operation 项目，AI 输出结果：

- `PROJECT_KNOWLEDGE_BASE.md` → 项目知识库
- 包含 16个模块业务字典
- 包含 80+ 工具类索引
- 标记出 TOP 10 高复用工具
- 整合了已有的 puml 监控流程图

---

**EOF**
