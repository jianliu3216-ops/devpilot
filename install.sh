#!/bin/bash
export TERM=ansi
# DevPilot 智能流水线 - 一键安装脚本
# 兼容：Windows Git Bash / macOS / Linux
#
# 前置要求：
#   - Node.js >= 18（已安装则自动检测）
#   - git（已安装则自动检测）
#   - Claude Code CLI（npm install -g @anthropic-ai/claude-code）
#
# 用法：
#   bash install.sh           # 安装 Skills（默认）
#   bash install.sh --tools   # 安装 Skills + Node.js 基础工具包（docx/xlsx/pdf-parse 等）
#   bash install.sh --tools-only  # 只安装工具包，不安装 Skills

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILLS_DIR="$HOME/.claude/skills"
TOOLS_DIR="$HOME/.claude/tools/node-libs"

# 跨平台 Node 检测库
# shellcheck source=scripts/node-detect.sh
source "$SCRIPT_DIR/scripts/node-detect.sh"

# 基础工具包列表
TOOL_PACKAGES="docx mammoth xlsx pdf-parse markdown-docx officeparser"

# 退出前等待用户按键，防止窗口闪退
pause_exit() {
    echo ""
    echo "按回车键退出..."
    read -r
    exit "${1:-1}"
}

# 解析参数
INSTALL_TOOLS=false
INSTALL_SKILLS=true

for arg in "$@"; do
    case $arg in
        --tools)
            INSTALL_TOOLS=true
            ;;
        --tools-only)
            INSTALL_TOOLS=true
            INSTALL_SKILLS=false
            ;;
    esac
done

echo "========================================="
echo "  DevPilot 智能流水线 - 安装向导"
echo "========================================="
echo ""

# --- 前置检查 ---

# 1. Node.js >= 18（Windows Git Bash 兼容检测）
if ! node_detect_init; then
    echo "❌ 未检测到 Node.js，请先安装 Node.js >= 18"
    echo "   下载地址: https://nodejs.org/"
    echo "   推荐版本: 20.x LTS 或 22.x LTS"
    echo ""
    echo "   Windows 提示: 若已安装但仍检测不到，请确认 node 在 PATH 中"
    echo "   PowerShell 验证: where.exe node && node -v"
    pause_exit 1
fi

echo "   检测路径: $NODE_CMD"

if [ -z "$NODE_SEMVER" ]; then
    echo "⚠️  警告: 无法解析 Node.js 版本号（node -p process.versions.node 失败）"
    run_node -v 2>&1 || true
    echo ""
    echo "   按回车继续安装（假设版本符合要求），或 Ctrl+C 取消..."
    read -r
elif ! version_ge "$NODE_SEMVER" "18.0.0"; then
    echo "❌ Node.js 版本过低: $NODE_FULL，需要 >= 18"
    echo "   推荐升级到: 20.x LTS 或 22.x LTS"
    pause_exit 1
else
    echo "✅ Node.js: $NODE_FULL"
fi

# 2. git
if ! command -v git &> /dev/null; then
    echo "❌ 未检测到 git，请先安装 git"
    pause_exit 1
fi
echo "✅ git: $(git --version)"

# 3. Python 3（jit-ui-ux-pro-max skill 需要，非硬性依赖）
PYTHON3_AVAILABLE=false
PYTHON3_CMD=""
if command -v python3 &> /dev/null; then
    PYTHON3_CMD="python3"
    PYTHON3_AVAILABLE=true
elif command -v py &> /dev/null; then
    py_ver=$(py -3 --version 2>&1 | grep -oE 'Python 3\.' | head -1)
    if [ -n "$py_ver" ]; then
        PYTHON3_CMD="py -3"
        PYTHON3_AVAILABLE=true
    fi
elif command -v python &> /dev/null; then
    py_ver=$(python --version 2>&1 | grep -oE 'Python 3\.' | head -1)
    if [ -n "$py_ver" ]; then
        PYTHON3_CMD="python"
        PYTHON3_AVAILABLE=true
    fi
fi
if [ "$PYTHON3_AVAILABLE" = true ]; then
    echo "✅ Python 3: $($PYTHON3_CMD --version 2>&1)"
else
    echo "⚠️  未检测到 Python 3（jit-ui-ux-pro-max 搜索功能需要）"
    echo "   安装方式：https://www.python.org/downloads/"
    echo "   或: winget install Python.Python.3.12"
    echo ""
fi

# 4. Claude Code（硬性依赖）
# 用 type 检测，避免 command -v claude 触发 TTY 检测输出
if ! type claude &> /dev/null; then
    echo "❌ 未检测到 Claude Code CLI"
    echo ""
    echo "   Claude Code 是本流水线的前置依赖，必须安装后才能继续。"
    echo ""
    echo "   是否现在自动安装？(y/n)"
    read -r INSTALL_CLAUDE
    if [ "$INSTALL_CLAUDE" = "y" ] || [ "$INSTALL_CLAUDE" = "Y" ]; then
        echo "正在安装 Claude Code CLI..."
        run_npm install -g @anthropic-ai/claude-code
        if ! type claude &> /dev/null; then
            echo "❌ Claude Code 安装失败，请手动执行："
            echo "   npm install -g @anthropic-ai/claude-code"
            echo "   安装后重新运行本脚本"
            pause_exit 1
        fi
        echo "✅ Claude Code 安装成功"
    else
        echo ""
        echo "❌ Claude Code 未安装，无法继续。"
        echo "   请手动安装后重新运行本脚本："
        echo "   npm install -g @anthropic-ai/claude-code"
        pause_exit 1
    fi
else
    echo "✅ Claude Code: 已安装"
fi

# --- 安装 Skills ---
if [ "$INSTALL_SKILLS" = true ]; then
    echo ""
    echo "--- 安装 Skills 到 ~/.claude/skills/ ---"
    mkdir -p "$SKILLS_DIR"

    SKILL_COUNT=0
    for skill_dir in "$SCRIPT_DIR"/skills/*/; do
        skill_name=$(basename "$skill_dir")
        if [ -f "$skill_dir/SKILL.md" ]; then
            if [ -d "$SKILLS_DIR/$skill_name" ]; then
                echo "🔄 更新: $skill_name"
            else
                echo "✅ 安装: $skill_name"
            fi
            cp -r "$skill_dir" "$SKILLS_DIR/"
            SKILL_COUNT=$((SKILL_COUNT + 1))
        fi
    done

    if [ "$SKILL_COUNT" -eq 0 ]; then
        echo "⚠️  未找到 Skills 文件，请确认 skills/ 目录结构正确"
        pause_exit 1
    fi
    echo "已安装 $SKILL_COUNT 个 Skills（流水线激活 / 知识库 / 知识库更新 / 状态 / 环境 / UI / 时间模型）"

    # 记录框架路径供 jit-devpilot-init skill 使用
    echo "$SCRIPT_DIR" > "$HOME/.claude/devpilot-framework-path"
    echo "✅ 框架路径已记录: $SCRIPT_DIR"
fi

# --- 检测缺失的工具包（增量更新） ---
# 即使 node_modules 已存在，也检查是否有新增的工具包需要补装
if [ "$INSTALL_TOOLS" = false ] && [ -d "$TOOLS_DIR/node_modules" ]; then
    MISSING_PKGS=""
    for pkg in $TOOL_PACKAGES; do
        if [ ! -d "$TOOLS_DIR/node_modules/$pkg" ]; then
            if [ -z "$MISSING_PKGS" ]; then
                MISSING_PKGS="$pkg"
            else
                MISSING_PKGS="$MISSING_PKGS $pkg"
            fi
        fi
    done
    if [ -n "$MISSING_PKGS" ]; then
        echo ""
        echo "--- 检测到新的工具包 ---"
        echo "已安装的工具包需要更新，以下工具尚未安装："
        for pkg in $MISSING_PKGS; do
            echo "  - $pkg"
        done
        echo ""
        echo "是否现在补装？(y/n)"
        read -r INSTALL_CHOICE
        if [ "$INSTALL_CHOICE" = "y" ] || [ "$INSTALL_CHOICE" = "Y" ]; then
            INSTALL_TOOLS=true
        fi
    fi
fi

# --- 提示安装工具包（如果未指定 --tools 且工具包完全未安装） ---
if [ "$INSTALL_TOOLS" = false ] && [ ! -d "$TOOLS_DIR/node_modules" ]; then
    echo ""
    echo "--- Node.js 基础工具包 ---"
    echo "未检测到 Node.js 工具包（docx、xlsx、pdf-parse、officeparser 等）"
    echo "这些工具包用于："
    echo "  - docx/markdown-docx: 生成 Word 文档"
    echo "  - xlsx: 生成 Excel 文档"
    echo "  - pdf-parse: 解析 PDF 文件"
    echo "  - mammoth: Word 文档转换"
    echo "  - officeparser: Office 文档解析（pptx/docx/xlsx 转文本）"
    echo ""
    echo "是否现在安装？(y/n)"
    read -r INSTALL_CHOICE
    if [ "$INSTALL_CHOICE" = "y" ] || [ "$INSTALL_CHOICE" = "Y" ]; then
        INSTALL_TOOLS=true
    fi
fi

# --- 安装 Node.js 工具包 ---
if [ "$INSTALL_TOOLS" = true ]; then
    echo ""
    echo "--- 安装 Node.js 基础工具包到 $TOOLS_DIR ---"
    mkdir -p "$TOOLS_DIR"

    # 初始化 package.json（如果不存在）
    if [ ! -f "$TOOLS_DIR/package.json" ]; then
        echo '{"name": "claude-code-tools", "version": "1.0.0", "private": true}' > "$TOOLS_DIR/package.json"
    fi

    # 安装工具包
    echo "正在安装: $TOOL_PACKAGES"
    cd "$TOOLS_DIR"
    run_npm install --save $TOOL_PACKAGES 2>&1 | tail -5
    cd "$SCRIPT_DIR"

    # 验证安装
    if [ -d "$TOOLS_DIR/node_modules" ]; then
        echo "✅ 工具包安装完成: $TOOLS_DIR/node_modules"
        echo ""
        echo "验证已安装的包："
        for pkg in $TOOL_PACKAGES; do
            if [ -d "$TOOLS_DIR/node_modules/$pkg" ]; then
                VERSION=$(run_node -e "console.log(require('$TOOLS_DIR/node_modules/$pkg/package.json').version)" 2>/dev/null || echo "?")
                echo "  ✅ $pkg@$VERSION"
            else
                echo "  ❌ $pkg 未安装成功"
            fi
        done
    else
        echo "⚠️  工具包安装失败，可稍后运行 bash install.sh --tools-only 重试"
    fi
fi

# --- CodeGraph 检测（可选，不自动安装） ---
# CodeGraph 是可选加速工具，install.sh 不替用户安装
# 原因：Windows 上 better-sqlite3 native 编译常失败，自动安装会留下损坏安装
# 用户如需安装，见 docs/CodeGraph 安装指南.md
CODEGRAPH_MIN="22.12.0"
echo ""
echo "--- 可选工具：CodeGraph（代码图谱分析） ---"
if codegraph_installed; then
    CG_PREFIX=$(run_npm prefix -g 2>/dev/null | strip_crlf)
    CG_CLI="$CG_PREFIX/node_modules/@optave/codegraph/dist/cli.js"
    CG_VER=$(run_node "$CG_CLI" --version 2>/dev/null | strip_crlf)
    echo "✅ CodeGraph CLI 可用: ${CG_VER:-未知版本}"
    if codegraph_build_works "$SCRIPT_DIR"; then
        echo "   codegraph build 检测通过；知识库生成前会先 preflight，自检为大项目时询问后再 build"
    else
        echo "⚠️  CodeGraph CLI 可用但 build 失败（常见于 Windows better-sqlite3）"
        echo "   知识库将降级为索引优先扫描；修复见 docs/CodeGraph 安装指南.md"
    fi
elif codegraph_broken_install; then
    echo "⚠️  检测到 CodeGraph 已安装但 CLI 不可用（native binding 失败或损坏）"
    echo "   如需修复，见 docs/CodeGraph 安装指南.md"
    echo "   不影响 DevPilot 流程，知识库 Skill 会跳过 codegraph 改用全量扫描"
else
    echo "ℹ️  未安装 CodeGraph（可选加速工具，不安装不影响流程）"
    echo "   作用：知识库生成加速 70-80%、变更影响精确分析、死代码检测"
    echo "   如需安装：npm install -g @optave/codegraph（需 Node >= $CODEGRAPH_MIN）"
    echo "   Windows 安装常见问题见 docs/CodeGraph 安装指南.md"
fi

# --- 完成 ---
echo ""
echo "========================================="
echo "  ✅ 安装完成！"
echo "========================================="
echo ""
echo "使用方式："
echo ""
echo "  方式一（推荐）：任意目录启动 Claude Code，输入 /jit-devpilot-init 激活"
echo ""
echo "  方式二：在框架目录下启动 Claude Code（自动激活）"
echo "    cd $SCRIPT_DIR"
echo "    claude"
echo ""
echo "启动后看到「✅ DevPilot 智能流水线 v$(cat "$SCRIPT_DIR/VERSION") — 就绪」表示成功。"
echo ""
echo "常用触发关键字："
echo "  需求分析：功能描述，目标项目：D:\\my-project"
echo "  /jit-project-devpilot-status        → 查看项目状态"
echo "  /jit-project-knowledge-base          → 生成项目知识库"
echo "  /jit-devpilot-init                   → 激活流水线"
echo "  /jit-env-auto-setup                  → 环境检测与配置"
echo "  ...更多命令见 快速入门.md"
echo ""
echo "⚠️  如果 Claude Code 已在运行，需要重启会话使新 Skills 生效"
echo "     重启方式：在 Claude 中输入 /exit，然后重新运行 claude"
echo ""
echo "补充命令："
echo "  bash update-skills.sh           # 框架升级后同步 jit-* Skills（备份旧版后重装）"
echo "  bash install.sh --tools       # 补装 Node.js 工具包（docx/xlsx 等）"
echo "  bash install.sh --tools-only  # 只装工具包，不动 Skills"
echo "  # CodeGraph 可选安装见 docs/CodeGraph 安装指南.md（install.sh 不自动安装）"
if [ "$PYTHON3_AVAILABLE" = false ]; then
echo ""
echo "⚠️  Python 3 未安装，jit-ui-ux-pro-max 搜索功能不可用"
echo "    安装 Python 3: https://www.python.org/downloads/"
echo "    或: winget install Python.Python.3.12"
fi
echo ""
echo "按回车键退出..."
read -r
