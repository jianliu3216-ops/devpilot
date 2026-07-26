#!/bin/bash
# DevPilot 知识库生成前置自检（Node 跨平台实现的 shell 包装器）
#
# Usage:
#   bash preflight-kb.sh <project-root> [--build] [--rebuild] [--json]
#
# 默认只做轻量自检，不执行 codegraph build。大项目必须先向用户展示
# SOURCE_FILE_COUNT / IS_LARGE_PROJECT / CODEGRAPH_STATUS / RECOMMENDED_ACTION，
# 经用户确认后再追加 --build 执行 CodeGraph。

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_SCRIPT="$SCRIPT_DIR/preflight-kb.js"

if [ ! -f "$NODE_SCRIPT" ]; then
    echo "PREFLIGHT_STATUS=ERROR"
    echo "MESSAGE=preflight-kb.js not found at $NODE_SCRIPT"
    exit 2
fi

exec node "$NODE_SCRIPT" "$@"
