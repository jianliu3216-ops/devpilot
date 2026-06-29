---
name: jit-env-auto-setup
description: 自动配置 Node.js 环境变量和工具路径。检测已安装的 node_modules、Python 包、以及其他常用工具，无需每次对话手动确认工具位置。
---

# 环境自动配置（Env Auto Setup）

用于在对话开始时自动检测和配置环境变量，特别是 Node.js 工具路径，避免每次对话都需要手动确认工具安装状态。

---

## 触发时机

在任何需要执行脚本或工具的任务开始前，先执行本 Skill 进行环境检测和配置。

---

## 自动检测流程

### Phase 1 - Node.js 环境检测

**自动执行以下检测：**

1. **检测 Node.js 版本**（使用 `node -p process.versions.node`，避免 Windows CRLF 解析问题）
   ```bash
   node -p "process.versions.node"
   ```

2. **检测 CodeGraph**（知识库/变更影响分析加速）
   ```bash
   source "$FRAMEWORK/scripts/node-detect.sh"
   node_detect_init
   codegraph_installed          # 只表示 CLI --version 可用
   codegraph_build_works "<目标项目路径>"  # 真正确认 build 可用
   ```
   - `codegraph_build_works` 通过 → 输出 `✅ CodeGraph: build 可用`，知识库/变更任务应优先读取 `.codegraph/`
   - 仅 `codegraph --version` 可用但 `build` 失败 → 输出 `⚠️ CodeGraph: CLI 可用但 build 失败`，按大项目降级策略执行
   - `npm ls -g @optave/codegraph` 有记录但 CLI 失败 → 提示残留安装，需 `npm uninstall -g @optave/codegraph` 后重装（需 Node >= 22.12.0，Windows 见 docs/CodeGraph 安装指南.md）

3. **检测预安装的 node_modules 路径**
   - 检查路径：`$HOME/.claude/tools/node-libs/node_modules`
   - 确认 docx、mammoth、xlsx、pdf-parse、officeparser 等常用库是否已安装
   - 如果路径不存在，提示用户运行 `bash install.sh --tools` 安装基础工具包

4. **设置 NODE_PATH 环境变量**
   ```bash
   export NODE_PATH="$HOME/.claude/tools/node-libs/node_modules"
   ```

### Phase 2 - 其他常用工具检测

1. **Python 环境**
   - 检测 Python 版本：`python --version` 或 `python3 --version`
   - 检测 pip 已安装包

2. **其他工具检测**
   - git 版本
   - 其他可能需要的 CLI 工具

### Phase 3 - 环境配置确认

检测完成后，输出环境摘要：

```
✅ 环境检测完成：
- Node.js: v20.20.0
- CodeGraph: build 可用 / CLI 可用但 build 失败 / 未安装
- NODE_PATH: $HOME/.claude/tools/node-libs/node_modules
- 可用库: docx, mammoth, xlsx, officeparser 等
- 可直接运行 Node.js 脚本，无需重复安装依赖
```

---

## 使用方式

在需要执行脚本的对话中，首先调用本 Skill 进行环境配置，然后直接执行后续任务。

**注意**：环境变量设置仅在当前 Bash 会话中有效，每次新的工具调用需要重新设置或在命令前加上环境变量。

---

## 推荐执行方式

执行 Node.js 脚本时，使用以下格式：

```bash
NODE_PATH=$HOME/.claude/tools/node-libs/node_modules node your_script.js
```
