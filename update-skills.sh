#!/bin/bash
# Autopilot Skill 更新脚本
# 作用：备份旧 jit-* Skill → 删除 → 从当前工程重新安装
# 用法：bash update-skills.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILLS_SRC="$SCRIPT_DIR/skills"
SKILLS_DST="$HOME/.claude/skills"
BACKUP_DIR="$HOME/.claude/skills_backup_$(date +%Y%m%d_%H%M%S)"

echo "========================================="
echo "  Autopilot Skill 更新脚本"
echo "========================================="
echo ""

# --- 第 1 步：备份旧 jit-* Skill ---
echo "--- 第 1 步：备份旧 jit-* Skill ---"

shopt -s nullglob
OLD_SKILLS=("$SKILLS_DST"/jit-*/)
shopt -u nullglob

if [ ${#OLD_SKILLS[@]} -gt 0 ]; then
    mkdir -p "$BACKUP_DIR"
    for skill_dir in "${OLD_SKILLS[@]}"; do
        skill_name=$(basename "$skill_dir")
        cp -r "$skill_dir" "$BACKUP_DIR/"
        echo "  📦 备份: $skill_name"
    done
    echo "  备份目录: $BACKUP_DIR"
else
    echo "  无 jit-* Skill 需要备份"
fi

echo ""

# --- 第 2 步：删除旧 jit-* Skill ---
echo "--- 第 2 步：删除旧 jit-* Skill ---"

shopt -s nullglob
OLD_SKILLS=("$SKILLS_DST"/jit-*/)
shopt -u nullglob

if [ ${#OLD_SKILLS[@]} -gt 0 ]; then
    for skill_dir in "${OLD_SKILLS[@]}"; do
        skill_name=$(basename "$skill_dir")
        rm -rf "$skill_dir"
        echo "  🗑️  删除: $skill_name"
    done
    echo "  已删除 ${#OLD_SKILLS[@]} 个旧 Skill"
else
    echo "  无 jit-* Skill 需要删除"
    mkdir -p "$SKILLS_DST"
fi

echo ""

# --- 第 3 步：从当前工程安装新 Skill ---
echo "--- 第 3 步：安装新 Skill ---"

mkdir -p "$SKILLS_DST"

INSTALLED=0
shopt -s nullglob
for skill_dir in "$SKILLS_SRC"/*/; do
    skill_name=$(basename "$skill_dir")
    if [ -f "$skill_dir/SKILL.md" ]; then
        rm -rf "$SKILLS_DST/$skill_name"
        cp -r "$skill_dir" "$SKILLS_DST/"
        echo "  ✅ 安装: $skill_name"
        INSTALLED=$((INSTALLED + 1))
    fi
done
shopt -u nullglob

# --- 刷新框架路径 ---
echo "$SCRIPT_DIR" > "$HOME/.claude/devpilot-framework-path"
echo "✅ 框架路径已更新: $SCRIPT_DIR"

echo ""
echo "========================================="
echo "  ✅ 更新完成：安装 $INSTALLED 个 Skill"
echo "========================================="
echo ""

echo "已安装 Skill:"
for skill_dir in "$SKILLS_SRC"/*/; do
    skill_name=$(basename "$skill_dir")
    [ -f "$skill_dir/SKILL.md" ] && echo "  - $skill_name"
done

echo ""
echo "如 Claude Code 已在运行，请重启会话使新 Skill 生效（/exit → claude）"
