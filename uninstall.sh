#!/bin/bash
# Autopilot 智能流水线 - 卸载脚本
# 移除本流水线安装的 Skills 和 Node.js 工具包
#
# 用法：
#   bash uninstall.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILLS_DIR="$HOME/.claude/skills"
TOOLS_DIR="$HOME/.claude/tools/node-libs"

# 退出前等待用户按键，防止窗口闪退
pause_exit() {
    echo ""
    echo "按回车键退出..."
    read -r
    exit "${1:-1}"
}

echo "========================================="
echo "  Autopilot 智能流水线 - 卸载"
echo "========================================="
echo ""

# --- 卸载 Skills（仅删除本项目安装的 4 个） ---
REMOVED=0
for skill_dir in "$SCRIPT_DIR"/skills/*/; do
    skill_name=$(basename "$skill_dir")
    if [ -d "$SKILLS_DIR/$skill_name" ]; then
        rm -rf "$SKILLS_DIR/$skill_name"
        echo "🗑️  已移除 skill: $skill_name"
        REMOVED=$((REMOVED + 1))
    fi
done

if [ "$REMOVED" -eq 0 ]; then
    echo "未找到已安装的 Autopilot Skills"
else
    echo "✅ 已卸载 $REMOVED 个 Skills"
fi

# --- 卸载 Node.js 工具包 ---
echo ""
if [ -d "$TOOLS_DIR" ]; then
    rm -rf "$TOOLS_DIR"
    echo "🗑️  已移除工具包目录: $TOOLS_DIR"
else
    echo "未找到工具包目录，跳过"
fi

echo ""
echo "========================================="
echo "  ✅ 卸载完成"
echo "========================================="
echo ""
echo "注意："
echo "  - 仅删除了本流水线安装的 Skills 和工具包"
echo "  - ~/.claude/skills/ 目录下的其他 Skills 未受影响"
echo "  - 本仓库目录（$SCRIPT_DIR）不会被删除"
echo ""
echo "按回车键退出..."
read -r
