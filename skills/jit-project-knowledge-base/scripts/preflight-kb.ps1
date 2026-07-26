#Requires -Version 5.1
<#
.SYNOPSIS
  DevPilot 知识库生成前置自检（PowerShell 包装器）

.DESCRIPTION
  跨平台核心逻辑在 preflight-kb.js 中。本脚本不依赖 Git Bash。
  默认只做轻量自检，不执行 codegraph build；大项目必须先向用户展示
  SOURCE_FILE_COUNT / IS_LARGE_PROJECT / CODEGRAPH_STATUS / RECOMMENDED_ACTION。

.PARAMETER ProjectRoot
  目标项目根目录绝对路径

.PARAMETER Build
  用户确认后执行 codegraph build

.PARAMETER Rebuild
  强制重新执行 codegraph build

.PARAMETER Json
  输出 JSON
#>
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$ProjectRoot,

    [switch]$Build,
    [switch]$Rebuild,
    [switch]$Json
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$NodeScript = Join-Path $ScriptDir "preflight-kb.js"

if (-not (Test-Path $NodeScript)) {
    Write-Output "PREFLIGHT_STATUS=ERROR"
    Write-Output "MESSAGE=preflight-kb.js not found at $NodeScript"
    exit 2
}

$node = $null
try {
    $node = (& where.exe node 2>$null | Select-Object -First 1)
} catch {
    # where.exe may write to stderr when node is not on PATH
}

if (-not $node) {
    Write-Output "PREFLIGHT_STATUS=ERROR"
    Write-Output "MESSAGE=node not found. Please install Node.js or run /jit-env-auto-setup."
    exit 2
}

$argsList = @($NodeScript, $ProjectRoot)
if ($Build) { $argsList += "--build" }
if ($Rebuild) { $argsList += "--rebuild" }
if ($Json) { $argsList += "--json" }

& $node @argsList
exit $LASTEXITCODE
