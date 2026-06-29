#!/bin/bash
# 跨平台 Node.js 检测（Git Bash / macOS / Linux）
# 用法: source scripts/node-detect.sh && node_detect_init
#
# Git Bash 常见问题: command -v node 返回 alias node='winpty node.exe'
# 不能当作可执行路径 — 本脚本用 where.exe / node.exe / run_node 规避

strip_crlf() {
    tr -d '\r\n'
}

normalize_path() {
    local p
    p=$(strip_crlf)
    [ -n "$p" ] || return 0
    if command -v cygpath &>/dev/null; then
        case "$p" in
            [A-Za-z]:\\*|[A-Za-z]:/*)
                cygpath -u "$p" 2>/dev/null && return 0
                ;;
        esac
    fi
    echo "$p" | sed 's|\\|/|g'
}

first_existing_where() {
    local name="$1"
    local p
    command -v where.exe &>/dev/null || return 1
    while IFS= read -r p; do
        p=$(printf "%s" "$p" | normalize_path)
        if [ -n "$p" ] && [ -f "$p" ]; then
            echo "$p"
            return 0
        fi
    done < <(where.exe "$name" 2>/dev/null)
    return 1
}

# 实际执行 node（不依赖 alias 字符串路径）
run_node() {
    local p=""

    # Windows: 优先 where.exe 拿到真实 node.exe
    p=$(first_existing_where node)
    if [ -n "$p" ]; then
        "$p" "$@"
        return $?
    fi

    for p in \
        "/d/nodejs/node.exe" \
        "/c/Program Files/nodejs/node.exe" \
        "/c/Program Files (x86)/nodejs/node.exe" \
        "$PROGRAMFILES/nodejs/node.exe" \
        "${PROGRAMFILES:-}/nodejs/node.exe" \
        "${PROGRAMFILES:-} (x86)/nodejs/node.exe"
    do
        if [ -n "$p" ] && [ -f "$p" ]; then
            "$p" "$@"
            return $?
        fi
    done

    # which 返回的必须是文件路径，不能是 alias 文本
    p=$(which node 2>/dev/null | head -1 | normalize_path)
    if [ -n "$p" ] && [ -f "$p" ]; then
        "$p" "$@"
        return $?
    fi

    # Git Bash 常见: alias node='winpty node.exe'
    if command -v winpty &>/dev/null; then
        if command -v node.exe &>/dev/null; then
            winpty node.exe "$@"
            return $?
        fi
        p=$(first_existing_where node.exe)
        if [ -n "$p" ]; then
            winpty "$p" "$@"
            return $?
        fi
    fi

    if command -v node.exe &>/dev/null; then
        node.exe "$@"
        return $?
    fi

    # 最后尝试裸 node（部分环境 alias 在子 shell 仍可展开）
    if type node &>/dev/null; then
        node "$@"
        return $?
    fi

    return 127
}

# 返回用于日志展示的可执行路径（绝不返回 alias 字符串）
resolve_node_cmd() {
    local p=""
    local via=""

    p=$(first_existing_where node)
    if [ -n "$p" ]; then
        echo "$p"
        return 0
    fi

    for p in \
        "/d/nodejs/node.exe" \
        "/c/Program Files/nodejs/node.exe" \
        "/c/Program Files (x86)/nodejs/node.exe" \
        "$PROGRAMFILES/nodejs/node.exe"
    do
        if [ -n "$p" ] && [ -f "$p" ]; then
            echo "$p"
            return 0
        fi
    done

    p=$(which node 2>/dev/null | head -1 | normalize_path)
    if [ -n "$p" ] && [ -f "$p" ]; then
        echo "$p"
        return 0
    fi

    if command -v node.exe &>/dev/null; then
        p=$(first_existing_where node.exe)
        if [ -n "$p" ]; then
            echo "$p"
            return 0
        fi
        echo "node.exe"
        return 0
    fi

    via=$(command -v node 2>/dev/null | normalize_path)
    case "$via" in
        alias\ *)
            # 仅展示，实际执行走 run_node
            echo "node (shell alias)"
            return 0
            ;;
        "")
            return 1
            ;;
        *)
            if [ -f "$via" ] || [ -x "$via" ]; then
                echo "$via"
                return 0
            fi
            echo "node"
            return 0
            ;;
    esac
}

get_node_semver() {
    run_node -p "process.versions.node" 2>/dev/null | strip_crlf
}

# version_ge <current> <required>  —  current >= required
version_ge() {
    local cur="$1" req="$2"
    [ -z "$cur" ] || [ -z "$req" ] && return 1
    run_node -e "
const v='$cur'.split('.').map(n=>parseInt(n,10)||0);
const r='$req'.split('.').map(n=>parseInt(n,10)||0);
for(let i=0;i<3;i++){
  const a=v[i]||0, b=r[i]||0;
  if(a>b) process.exit(0);
  if(a<b) process.exit(1);
}
process.exit(0);
" 2>/dev/null
}

node_detect_init() {
    NODE_CMD=""
    NODE_SEMVER=""
    NODE_MAJOR=""
    NODE_FULL=""

    if ! run_node -e "process.exit(0)" &>/dev/null; then
        return 1
    fi

    NODE_CMD=$(resolve_node_cmd)
    NODE_SEMVER=$(get_node_semver)
    if [ -n "$NODE_SEMVER" ]; then
        NODE_MAJOR=$(echo "$NODE_SEMVER" | cut -d. -f1)
        NODE_FULL="v$NODE_SEMVER"
    fi

    # 确保 npm / 全局包装器与 node 同目录（避免 Roaming 残留 shim 抢 PATH）
    if [ -n "$NODE_CMD" ] && [ -f "$NODE_CMD" ]; then
        NODE_DIR=$(dirname "$NODE_CMD")
        export PATH="$NODE_DIR:$PATH"
    fi
    return 0
}

run_npm() {
    local npm_cmd=""
    if command -v where.exe &>/dev/null; then
        npm_cmd=$(first_existing_where npm.cmd)
    fi
    if [ -z "$npm_cmd" ] || [ ! -f "$npm_cmd" ]; then
        npm_cmd="npm"
    fi
    "$npm_cmd" "$@"
}

# 清理 %APPDATA%\npm 下损坏的 CodeGraph（包在但 cli.js 缺失）
cleanup_roaming_codegraph() {
    local roaming="${APPDATA:-$HOME/AppData/Roaming}/npm"
    roaming=$(printf "%s" "$roaming" | normalize_path)
    local pkg="$roaming/node_modules/@optave/codegraph"
    local cli="$pkg/dist/cli.js"
    if [ -d "$pkg" ] && [ ! -f "$cli" ]; then
        echo "🧹 清理损坏的 Roaming CodeGraph: $pkg"
        rm -f "$roaming"/codegraph "$roaming"/codegraph.cmd "$roaming"/codegraph.ps1 2>/dev/null
        rm -rf "$pkg" 2>/dev/null
    fi
}

resolve_codegraph_cmd() {
    local npm_prefix p

    p=$(first_existing_where codegraph.cmd)
    if [ -n "$p" ]; then
        echo "$p"
        return 0
    fi
    p=$(first_existing_where codegraph)
    if [ -n "$p" ]; then
        echo "$p"
        return 0
    fi

    p=$(which codegraph 2>/dev/null | head -1 | normalize_path)
    if [ -n "$p" ] && [ -f "$p" ]; then
        echo "$p"
        return 0
    fi

    npm_prefix=$(run_npm prefix -g 2>/dev/null | normalize_path)
    if [ -n "$npm_prefix" ]; then
        if [ -f "$npm_prefix/codegraph.cmd" ]; then
            echo "$npm_prefix/codegraph.cmd"
            return 0
        fi
        if [ -f "$npm_prefix/codegraph" ]; then
            echo "$npm_prefix/codegraph"
            return 0
        fi
    fi
    return 1
}

run_codegraph() {
    local p
    p=$(first_existing_where codegraph.cmd)
    if [ -z "$p" ]; then
        p=$(first_existing_where codegraph)
    fi
    if [ -n "$p" ]; then
        "$p" "$@"
        return $?
    fi

    p=$(resolve_codegraph_cmd 2>/dev/null) || true
    if [ -n "$p" ] && [ -f "$p" ]; then
        "$p" "$@"
        return $?
    fi

    if type codegraph &>/dev/null; then
        codegraph "$@"
        return $?
    fi
    return 127
}

# 包是否已安装（npm 有记录 OR cli.js 文件存在）
codegraph_pkg_exists() {
    local npm_prefix cli
    # npm ls -g 判断（容错：Git Bash 下有时 CRLF）
    if run_npm ls -g @optave/codegraph --depth=0 2>/dev/null | grep -q "@optave/codegraph"; then
        return 0
    fi
    # 文件层判断
    npm_prefix=$(run_npm prefix -g 2>/dev/null | normalize_path)
    if [ -n "$npm_prefix" ]; then
        cli="$npm_prefix/node_modules/@optave/codegraph/dist/cli.js"
        [ -f "$cli" ] && return 0
    fi
    return 1
}

# CLI 是否可用（直接用 node 调 cli.js，绕过 .cmd native binding 包装问题）
codegraph_cli_works() {
    local npm_prefix cli
    npm_prefix=$(run_npm prefix -g 2>/dev/null | normalize_path)
    [ -n "$npm_prefix" ] || return 1
    cli="$npm_prefix/node_modules/@optave/codegraph/dist/cli.js"
    [ -f "$cli" ] || return 1
    run_node "$cli" --version &>/dev/null
}

# 真正确认可用要以 build 为准；--version 通过不代表 native binding 可用
codegraph_build_project() {
    local project_dir="${1:-.}"
    [ -d "$project_dir" ] || return 1
    (
        cd "$project_dir" || exit 1
        run_codegraph build
    )
}

codegraph_build_works() {
    local project_dir="${1:-.}"
    [ -d "$project_dir" ] || return 1
    (
        cd "$project_dir" || exit 1
        run_codegraph --version &>/dev/null || exit 1
        run_codegraph build &>/dev/null
    )
}

# 已安装且 CLI 可用
codegraph_installed() {
    codegraph_pkg_exists && codegraph_cli_works
}

# 已安装但 CLI 不可用（残留/损坏）
codegraph_broken_install() {
    codegraph_pkg_exists && ! codegraph_cli_works
}
