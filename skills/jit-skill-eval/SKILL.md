---
name: jit-skill-eval
description: DevPilot Skill 科学评估。静态确定性检查 + 可选 LLM 冒烟，输出 HTML 报告到 docs/skill-eval/。自然语言：评估技能 / skill评估 / skill eval。
---

# jit-skill-eval — Skill 科学评估

> 让 jit-* Skill 的演进有证据：改之前跑一次，改之后跑一次，用 Rubric 得分率判断变好还是变坏。

## 触发

```
/jit-skill-eval <skill名称或路径> [--collect|--quick|--full]
```

自然语言：`评估技能` / `skill评估` / `评估 jit-project-xxx`

## 三档模式（成本从低到高，全部手动触发，不自动跑）

| 模式 | 命令 | 做什么 | 成本 |
|------|------|--------|------|
| 静态检查 | `<skill> --collect` | 只做确定性静态检查，输出 JSON，**不写文件** | 0 |
| 快速报告 | `<skill> --quick` | 静态最小项（frontmatter + 脚本存在 + node --check），直接渲染 HTML | 0 |
| 完整评估 | `<skill> --full` | 静态全项 + 1 个真实 LLM 冒烟任务，渲染最终 HTML | 1 次 LLM 调用 |

## 执行步骤

### 步骤 1：确定框架路径与 skill 位置

读取 `~/.claude/devpilot-framework-path` → `$FRAMEWORK`。skill 名在 `$FRAMEWORK/skills/<skill名>/` 下解析；也支持直接传绝对路径。

### 步骤 2：按模式执行

**--collect（零成本静态检查）**
```bash
node "$FRAMEWORK/skills/jit-skill-eval/scripts/eval-skill.js" <skill名> --collect
```
输出 JSON：6 项静态检查的 pass/fail + Rubric 得分率 + 推荐冒烟命令。

**--quick（零成本快速报告）**
```bash
node "$FRAMEWORK/skills/jit-skill-eval/scripts/eval-skill.js" <skill名> --quick
```
在 `$FRAMEWORK/docs/skill-eval/<skill>-YYYYMMDD.html` 生成报告。

**--full（静态 + LLM 冒烟）**
1. 先跑 `--collect` 看静态结果和推荐冒烟命令
2. 执行脚本输出的**推荐冒烟命令**（对真实目标项目跑 1 个最小任务），验证 skill 可跑通；记录 `{passed, duration_ms, command, output_head}`
   - 冒烟目标项目：会话已指定的目标项目；未指定则用 `$FRAMEWORK` 自身
   - 冒烟原则：只验证"能跑通、有输出、退出码 0"，不深入业务
3. 合并结果渲染最终 HTML：
```bash
node "$FRAMEWORK/skills/jit-skill-eval/scripts/eval-skill.js" <skill名> --smoke '<JSON>'
```
`<JSON>` 形如：`{"passed":true,"duration_ms":1200,"command":"node ...","output_head":"..."}`

## 静态检查项（6 项，确定性、零 LLM）

| # | 检查项 | 说明 |
|---|--------|------|
| 1 | frontmatter 完整性 | SKILL.md 有 name + description + 触发描述 |
| 2 | 必备章节 | 含 触发 / 用法 / 执行 / 产出 |
| 3 | 脚本引用存在性 | SKILL.md 引用的 scripts/*.js 都存在 |
| 4 | node --check 语法 | 所有 scripts/*.js 语法通过 |
| 5 | 触发词与 CLAUDE.md 一致 | description 触发词能在 CLAUDE.md 命中 |
| 6 | 相对路径引用可解析 | SKILL.md 内相对链接目标存在 |

## 产出

| 文件 | 用途 |
|------|------|
| `$FRAMEWORK/docs/skill-eval/<skill>-YYYYMMDD.html` | 人可读评估报告（检查项表 + Rubric 得分率 + 冒烟结果 + 修复建议） |

报告写在**框架仓库**（评估对象是框架 skill，属框架自身资产）；不进目标项目。

## 评估闭环建议

- **改 Skill 前后各跑一次 `--full`**：得分率升 = 改动进步；跌 = 回滚或修复
- 新 Skill 上线前 MUST 至少跑一次 `--quick`（零成本）确认结构合规
- 定期（如每次框架发版前）对所有 jit-* Skill 跑 `--collect` 汇总，定位结构漂移

## 牢记规则

- **手动触发**：本 Skill 不接 hook，不自动运行，完全由用户按需调用
- `--collect` / `--quick` 零 LLM 成本；`--full` 才花 1 次 LLM 调用
- 冒烟只做"可跑通"验证，不做业务深度验证
