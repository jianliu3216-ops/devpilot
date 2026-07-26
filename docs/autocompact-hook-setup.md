# Autocompact Hook 用户全局配置指南

## 目标

在用户全局 `~/.claude/` 下配置 **UserPromptSubmit hook**，每次用户提交消息时检查上下文使用率，超阈值提示执行 `/compact`，避免上下文满了任务被停止。

## 前置说明

- **Claude Code 内置 auto-compact**：默认开启，接近上限自动压缩（通常 90%+ 触发）
- **本 hook 是提前提示**：在 70% 使用率时主动提示，不用等到自动压缩
- **自动压缩可能丢细节**：提前手动 `/compact` 更可控
- **作用范围**：用户全局 `~/.claude/`，所有项目生效（包括非 DevPilot 项目）

## ⚠️ 为什么不用 Stop hook？

`Stop` hook 只在**会话结束时**触发（Ctrl+C / `/stop` 命令 / 退出 Claude Code），不是每个回合结束。这无法实现"任务进行中提前提示"的诉求。

**`UserPromptSubmit`** 在每次用户提交消息时触发，正好在"开始下一步前"提示，用户可先 `/compact` 再继续，避免任务中途爆上下文。

## 配置位置

| 系统 | 路径 |
|------|------|
| Windows | `C:\Users\<用户名>\.claude\` |
| Mac/Linux | `~/.claude/` |

---

## 配置步骤

### Step 1: 创建 hooks 目录（如不存在）

```bash
# Git Bash / Mac / Linux
mkdir -p ~/.claude/hooks
```

### Step 2: 创建 hook 脚本

**推荐 PowerShell 脚本**（Windows 原生，无需额外依赖）

文件路径：`C:\Users\LV\.claude\hooks\autocompact-check.ps1`

```powershell
# Autocompact Check Hook
# 每个 Claude 回合结束时检查上下文使用率，超阈值提示 /compact

$thresholdPercent = 70  # 阈值，可调

# 直接写 UTF-8 字节到 stdout，避免 PowerShell 输出编码转换导致的中文乱码
function Write-Utf8Line {
    param([string]$Message)
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($Message + "`n")
    [System.Console]::OpenStandardOutput().Write($bytes, 0, $bytes.Length)
}

try {
    $input | Out-File -FilePath "$env:TEMP\autocompact-input.json" -Encoding utf8
    $hookInput = Get-Content "$env:TEMP\autocompact-input.json" -Encoding utf8 | ConvertFrom-Json
    $transcriptPath = $hookInput.transcript_path
} catch {
    $transcriptPath = $null
}

if (-not $transcriptPath -or -not (Test-Path $transcriptPath)) {
    Write-Utf8Line "autocompact-info: 请评估上下文使用率，如超过 70% 建议执行 /compact"
    exit 0
}

$fileSize = (Get-Item $transcriptPath).Length
$estimatedTokens = [int]($fileSize / 4)
$estimatedPercent = [int]($estimatedTokens * 100 / 200000)

if ($estimatedPercent -ge $thresholdPercent) {
    $fileSizeKb = [math]::Round($fileSize / 1024)
    Write-Utf8Line "autocompact-warn: 上下文使用率约 ${estimatedPercent}%（transcript ${fileSizeKb}KB，约 ${estimatedTokens} tokens）"
    Write-Utf8Line "建议执行 /compact 压缩历史，避免上下文满了任务被停止。"
}

exit 0
```

⚠️ **PowerShell 脚本文件必须以 UTF-8 BOM 保存**，否则 PowerShell 5.x 会用 GBK 解码，导致中文语法解析错误。创建文件后用以下命令加 BOM：

```bash
powershell -Command "& { \$path = 'C:\Users\LV\.claude\hooks\autocompact-check.ps1'; \$content = [System.IO.File]::ReadAllText(\$path, [System.Text.Encoding]::UTF8); \$utf8WithBom = New-Object System.Text.UTF8Encoding \$true; [System.IO.File]::WriteAllText(\$path, \$content, \$utf8WithBom) }"
```

**备选 Bash 脚本**（需要 Git Bash，无需 jq）

文件路径：`C:\Users\LV\.claude\hooks\autocompact-check.sh`

```bash
#!/bin/bash
THRESHOLD_PERCENT=70

input=$(cat)
# 用 sed 解析 JSON（不依赖 jq）
transcript_path=$(echo "$input" | sed -n 's/.*"transcript_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')

if [ -z "$transcript_path" ] || [ ! -f "$transcript_path" ]; then
  echo "autocompact-info: 请评估上下文使用率，如超过 70% 建议执行 /compact"
  exit 0
fi

file_size=$(wc -c < "$transcript_path" 2>/dev/null || echo 0)
file_size_kb=$((file_size / 1024))
estimated_tokens=$((file_size / 4))
estimated_percent=$((estimated_tokens * 100 / 200000))

if [ $estimated_percent -ge $THRESHOLD_PERCENT ]; then
  echo "autocompact-warn: 上下文使用率约 ${estimated_percent}%（transcript ${file_size_kb}KB，约 ${estimated_tokens} tokens）"
  echo "建议执行 /compact 压缩历史，避免上下文满了任务被停止。"
fi

exit 0
```

### Step 3: 修改 `~/.claude/settings.json`

⚠️ **如果 `~/.claude/settings.json` 已有内容，把 UserPromptSubmit hook 加到现有 hooks 对象中，不要覆盖整个文件。**

**PowerShell 版本配置**：

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "powershell -ExecutionPolicy Bypass -File C:\\Users\\LV\\.claude\\hooks\\autocompact-check.ps1"
          }
        ]
      }
    ]
  }
}
```

**Bash 版本配置**：

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash ~/.claude/hooks/autocompact-check.sh"
          }
        ]
      }
    ]
  }
}
```

**已有 hooks 的合并示例**（保留原有 + 新增 UserPromptSubmit）：

```json
{
  "hooks": {
    "原有Hook": [ ... 保留 ... ],
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "powershell -ExecutionPolicy Bypass -File C:\\Users\\LV\\.claude\\hooks\\autocompact-check.ps1"
          }
        ]
      }
    ]
  }
}
```

### Step 4: 测试

1. **重启 Claude Code**（让 settings.json 生效）
2. 进行一段对话（读几个文件、做几个工具调用，让上下文增长）
3. 观察 Claude 回合结束时是否输出 `autocompact-warn` 提示
4. 当提示出现时，执行 `/compact` 测试压缩效果
5. 如果上下文未达 70%，可调低阈值（如改为 50%）测试提示是否出现

---

## 关键字段说明

| 字段 | 说明 |
|------|------|
| `transcript_path` | Claude Code hook 输入 JSON 的字段，指向当前会话 transcript 文件 |
| **如果字段不存在** | 脚本输出通用提示（`autocompact-info`），不会报错 |
| **token 估算** | 用 `transcript 文件大小 / 4` 粗略估算，不准确，仅作提示用 |

---

## 注意事项

1. **阈值可调**：脚本中 `$thresholdPercent = 70` 可改为 60/80 等
2. **依赖**：PowerShell 版本无依赖；Bash 版本无依赖（用 `sed` 解析 JSON，不需要 jq）
3. **路径分隔符**：Windows JSON 中用 `\\` 转义反斜杠
4. **hook 输出会被 Claude 看到**：所以加了 `autocompact-warn:` 前缀，便于识别
5. **不与 DevPilot 冲突**：用户全局配置与 DevPilot 框架配置独立，互不影响
6. **ps1 文件必须 UTF-8 BOM**：PowerShell 5.x 用 BOM 识别编码，无 BOM 会用 GBK 解码导致中文语法错误（见上方加 BOM 命令）
7. **settings.json 必须 UTF-8 无 BOM**：Node.js 严格模式不接受 BOM，会报 `Unexpected token '﻿'` 错误。如已有 BOM，用以下命令去掉：
   ```bash
   powershell -Command "& { \$path = 'C:\Users\LV\.claude\settings.json'; \$bytes = [System.IO.File]::ReadAllBytes(\$path); if (\$bytes[0] -eq 0xEF -and \$bytes[1] -eq 0xBB -and \$bytes[2] -eq 0xBF) { [System.IO.File]::WriteAllBytes(\$path, \$bytes[3..(\$bytes.Length-1)]) } }"
   ```

---

## 排查

| 问题 | 排查方法 |
|------|---------|
| Hook 不触发 | 检查 `settings.json` JSON 语法：`node -e "JSON.parse(require('fs').readFileSync('C:/Users/LV/.claude/settings.json','utf8')); console.log('OK')"` |
| settings.json BOM 错误 | Node.js 报 `Unexpected token '﻿'` → 文件有 BOM，用 `head -c 3 path \| xxd` 检查，如有用上方命令去掉 |
| ps1 语法错误（中文乱码导致）| PowerShell 报"意外的标记 `}`"→ ps1 文件无 BOM，用上方命令加 BOM |
| ps1 中文输出乱码 | 用 `Write-Utf8Line` 函数（已在脚本中），不用 `Write-Output` |
| sh 解析 JSON 失败 | 已用 `sed` 替代 jq（无需安装 jq） |
| 脚本报错 | 手动执行测试：`echo '{}' \| bash ~/.claude/hooks/autocompact-check.sh` |
| 提示不出现 | 估算 percent 未达阈值，临时调低 `THRESHOLD_PERCENT=30` 测试 |
| PowerShell 执行策略报错 | 已用 `-ExecutionPolicy Bypass` 绕过，若仍报错执行 `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| transcript_path 字段为空 | 查看 `$env:TEMP\autocompact-input.json` 实际内容确认字段名 |

### 查看实际 hook 输入

测试时如果想看 hook 收到的实际 JSON，临时在脚本开头加：

```powershell
$input | Out-File -FilePath "C:\Users\LV\.claude\hooks\last-input.json" -Encoding utf8
```

或

```bash
cat > ~/.claude/hooks/last-input.json
```

执行一次后查看该文件，确认字段名。

---

## 进阶（可选）

### 自动触发 /compact（实验性）

当前方案是"提示用户手动 /compact"。如果想**自动触发**：

1. 改用 `UserPromptSubmit` hook（用户提交消息时触发）
2. 脚本输出特定 JSON 格式，让 Claude 自动调用 `/compact`

但这种方式不够稳定（可能干扰正常对话），建议先用提示版本测试。

### 上下文使用率精确估算

当前用文件大小估算 token，不准确。如需精确估算：

1. 用 `tiktoken`（OpenAI）或 Claude tokenizer 统计 transcript 文件实际 token 数
2. 但需要额外依赖，权衡后建议先用粗略估算

---

## 测试后反馈

测试后告诉我以下信息，便于调整方案：

- [ ] 提示是否正常出现
- [ ] 估算的上下文使用率是否合理（如显示 75% 时实际是否接近）
- [ ] 阈值是否需要调整（70% 太早/太晚）
- [ ] 是否需要自动触发版本
- [ ] 是否与现有工作流冲突
