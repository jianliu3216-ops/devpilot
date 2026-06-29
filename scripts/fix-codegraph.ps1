#Requires -Version 5.1
<#
.SYNOPSIS
  修复 / 安装 CodeGraph（无需 MSI，适配 npm prefix=D:\nodejs）

  用法（PowerShell 5.1，不要用 && 连接两条命令）:
    powershell -ExecutionPolicy Bypass -File scripts\fix-codegraph.ps1
#>
$ErrorActionPreference = "Stop"

function Find-NodeExe {
    $candidates = @(
        "D:\nodejs\node.exe",
        "$env:ProgramFiles\nodejs\node.exe",
        "${env:ProgramFiles(x86)}\nodejs\node.exe"
    )
    foreach ($c in $candidates) {
        if (Test-Path $c) { return $c }
    }
    $w = (& where.exe node 2>$null | Select-Object -First 1)
    if ($w -and (Test-Path $w)) { return $w }
    throw "未找到 node.exe，请先运行 scripts\upgrade-node-portable.ps1"
}

function Invoke-NpmQuiet {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
    $old = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    & $script:npmCmd @Args 2>&1 | ForEach-Object { Write-Host $_ }
    $exit = $LASTEXITCODE
    $ErrorActionPreference = $old
    if ($exit -ne 0) { throw "npm 失败 (exit $exit): $($Args -join ' ')" }
}

$nodeExe = Find-NodeExe
$nodeDir = Split-Path $nodeExe -Parent
$script:npmCmd = Join-Path $nodeDir "npm.cmd"
if (-not (Test-Path $script:npmCmd)) { throw "未找到 npm.cmd: $script:npmCmd" }

$env:PATH = "$nodeDir;$env:PATH"

Write-Host "Node: $(& $nodeExe -v)"
Write-Host "npm prefix: $(& $script:npmCmd prefix -g)"

$minVersion = "22.12.0"
$semver = & $nodeExe -p "process.versions.node"
$parts = $semver.Split(".") | ForEach-Object { [int]$_ }
$ok = ($parts[0] -gt 22) -or ($parts[0] -eq 22 -and $parts[1] -ge 12)
if (-not $ok) {
    Write-Host "警告: CodeGraph 需要 Node >= $minVersion，当前 v$semver"
}

# 清理 Roaming 下损坏的全局 shim（PATH 里常有 Roaming\npm，cli.js 缺失会导致永远失败）
$roaming = Join-Path $env:APPDATA "npm"
$broken = Join-Path $roaming "node_modules\@optave\codegraph"
if (Test-Path $roaming) {
    $cliBroken = Join-Path $broken "dist\cli.js"
    if ((Test-Path $broken) -and -not (Test-Path $cliBroken)) {
        Write-Host "清理损坏的 Roaming 安装: $broken"
        Remove-Item (Join-Path $roaming "codegraph*") -Force -ErrorAction SilentlyContinue
        Remove-Item $broken -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "卸载旧版 @optave/codegraph ..."
Invoke-NpmQuiet uninstall -g @optave/codegraph

Write-Host "安装 @optave/codegraph ..."
Invoke-NpmQuiet install -g @optave/codegraph

$cg = Join-Path $nodeDir "codegraph.cmd"
if (-not (Test-Path $cg)) {
    $cg = (& where.exe codegraph.cmd 2>$null | Select-Object -First 1)
}
if (-not $cg -or -not (Test-Path $cg)) { throw "未找到 codegraph.cmd" }

$cli = Join-Path $nodeDir "node_modules\@optave\codegraph\dist\cli.js"
if (-not (Test-Path $cli)) { throw "cli.js 缺失: $cli" }

$ver = & $cg --version 2>&1
Write-Host "CodeGraph: $ver"
Write-Host ""
Write-Host "完成。新开终端执行: codegraph --version"
