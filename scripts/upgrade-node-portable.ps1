#Requires -Version 5.1
<#
.SYNOPSIS
  用官方 ZIP 安装/升级 Node.js 到 D:\nodejs（无需 MSI）

  用法:
    powershell -ExecutionPolicy Bypass -File scripts\upgrade-node-portable.ps1
    powershell -ExecutionPolicy Bypass -File scripts\upgrade-node-portable.ps1 -Version v22.23.1
#>
param(
    [string]$Version = "v22.23.1",
    [string]$TargetDir = "D:\nodejs"
)

$ErrorActionPreference = "Stop"
$zipName = "node-$Version-win-x64.zip"
$url = "https://nodejs.org/dist/$Version/$zipName"
$tmpZip = Join-Path $env:TEMP $zipName
$extractRoot = Join-Path $env:TEMP "node-$Version-win-x64"

Write-Host "下载 $url"
Invoke-WebRequest -Uri $url -OutFile $tmpZip -UseBasicParsing
Write-Host "解压到 $TargetDir ..."

if (Test-Path $extractRoot) { Remove-Item $extractRoot -Recurse -Force }
Expand-Archive -Path $tmpZip -DestinationPath $env:TEMP -Force

if (-not (Test-Path $TargetDir)) {
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
}
Get-ChildItem $TargetDir -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path "$extractRoot\*" -Destination $TargetDir -Recurse -Force

$nodeExe = Join-Path $TargetDir "node.exe"
Write-Host "Node: $(& $nodeExe -v)"
Write-Host "npm:  $(& (Join-Path $TargetDir 'npm.cmd') -v)"
Write-Host ""
Write-Host "请确认系统 PATH 包含: $TargetDir"
Write-Host "然后运行: powershell -ExecutionPolicy Bypass -File scripts\fix-codegraph.ps1"
