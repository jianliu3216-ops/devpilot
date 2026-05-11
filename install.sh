#!/bin/bash
export TERM=ansi
# CICD 智能流水线 - 一键安装脚本
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

# 基础工具包列表
TOOL_PACKAGES="docx mammoth xlsx pdf-parse markdown-docx"

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

# 获取 Node.js 版本的函数（兼容 Git Bash）
get_node_version() {
    # 方法1: 直接执行 node -v
    local version=$(node -v 2>&1 | grep -oE 'v[0-9]+' | head -1 | sed 's/v//')
    
    # 如果方法1失败，尝试方法2
    if [ -z "$version" ]; then
        version=$(node --version 2>&1 | grep -oE 'v[0-9]+' | head -1 | sed 's/v//')
    fi
    
    # 如果还是失败，尝试方法3：通过 which 找到 node.exe 直接执行
    if [ -z "$version" ]; then
        local node_path=$(which node 2>/dev/null)
        if [ -n "$node_path" ] && [ -f "$node_path" ]; then
            version=$("$node_path" -v 2>&1 | grep -oE 'v[0-9]+' | head -1 | sed 's/v//')
        fi
    fi
    
    echo "$version"
}

# 获取完整版本号的函数
get_node_full_version() {
    local version=$(node -v 2>&1 | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    if [ -z "$version" ]; then
        version=$(node --version 2>&1 | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    fi
    echo "$version"
}

echo "========================================="
echo "  CICD 智能流水线 - 安装向导"
echo "========================================="
echo ""

# --- 前置检查 ---

# 1. Node.js >= 18
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js，请先安装 Node.js >= 18"
    echo "   下载地址: https://nodejs.org/"
    echo "   推荐版本: 20.x LTS 或 22.x LTS"
    pause_exit 1
fi
# 获取 Node.js 版本
NODE_MAJOR=$(get_node_version)
NODE_FULL=$(get_node_full_version)

if [ -z "$NODE_MAJOR" ]; then
    echo "⚠️  警告: 无法自动检测 Node.js 版本号"
    echo "   检测到的输出:"
    node -v 2>&1
    
    echo ""
    echo "   请手动确认 Node.js 版本 >= 18"
    echo "   当前命令: node -v"
    echo ""
    echo "   按回车继续安装（假设版本符合要求），或 Ctrl+C 取消..."
    read -r
elif [ "$NODE_MAJOR" -lt 18 ] 2>/dev/null; then
    echo "❌ Node.js 版本过低: $NODE_FULL，需要 >= 18"
    echo "   推荐升级到: 20.x LTS 或 22.x LTS"
    pause_exit 1
else
    echo "✅ Node.js: ${NODE_FULL:-v$NODE_MAJOR.?.?}"
fi

# 2. git
if ! command -v git &> /dev/null; then
    echo "❌ 未检测到 git，请先安装 git"
    pause_exit 1
fi
echo "✅ git: $(git --version)"

# 3. Claude Code（硬性依赖）
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
        npm install -g @anthropic-ai/claude-code
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
    echo "已安装 $SKILL_COUNT 个 Skills"
fi

# --- 提示安装工具包（如果未指定 --tools 且工具包未安装） ---
if [ "$INSTALL_TOOLS" = false ] && [ ! -d "$TOOLS_DIR/node_modules" ]; then
    echo ""
    echo "--- Node.js 基础工具包 ---"
    echo "未检测到 Node.js 工具包（docx、xlsx、pdf-parse 等）"
    echo "这些工具包用于："
    echo "  - docx/markdown-docx: 生成 Word 文档"
    echo "  - xlsx: 生成 Excel 文档"
    echo "  - pdf-parse: 解析 PDF 文件"
    echo "  - mammoth: Word 文档转换"
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
    npm install --save $TOOL_PACKAGES 2>&1 | tail -5
    cd "$SCRIPT_DIR"

    # 验证安装
    if [ -d "$TOOLS_DIR/node_modules" ]; then
        echo "✅ 工具包安装完成: $TOOLS_DIR/node_modules"
        echo ""
        echo "验证已安装的包："
        for pkg in $TOOL_PACKAGES; do
            if [ -d "$TOOLS_DIR/node_modules/$pkg" ]; then
                VERSION=$(node -e "console.log(require('$TOOLS_DIR/node_modules/$pkg/package.json').version)" 2>/dev/null || echo "?")
                echo "  ✅ $pkg@$VERSION"
            else
                echo "  ❌ $pkg 未安装成功"
            fi
        done
    else
        echo "⚠️  工具包安装失败，可稍后运行 bash install.sh --tools-only 重试"
    fi
fi

# --- 完成 ---
echo ""
echo "========================================="
echo "  ✅ 安装完成！"
echo "========================================="
echo ""
echo "下一步："
echo "  1. cd $SCRIPT_DIR"
echo "  2. 启动 claude"
echo "  3. 输入 /project-cicd-status 开始使用"
echo ""
echo "⚠️  如果 Claude Code 已在运行，需要重启会话使新 Skills 生效"
echo "     重启方式：在 Claude 中输入 /exit，然后重新运行 claude"
echo ""
echo "补充命令："
echo "  bash install.sh --tools       # 补装 Node.js 工具包（docx/xlsx 等）"
echo "  bash install.sh --tools-only  # 只装工具包，不动 Skills"
echo ""
echo "按回车键退出..."
read -r
