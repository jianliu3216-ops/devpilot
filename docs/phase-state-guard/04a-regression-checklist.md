# 04a 回归验证清单：阶段状态与证据守卫（phase-state-guard）

- 日期：2026-09-30
- 性质：单元测试回归清单（当前版本仅单元测试回归）

## 回归项

| # | 回归项 | 命令/动作 | 通过标准 |
|---|--------|-----------|----------|
| R1 | guard 脚本语法 | `node --check devpilot-guard.js` | exit 0 |
| R2 | AC1–AC7 夹具自测 | 重跑 05 报告 §2 夹具序列 | 11/11 PASS，0 失败 |
| R3 | 既有脚本未破坏 | `node --check` 全部 `skills/*/scripts/*.js`（含 scan-status / verify-kb-facts / compress-handoff / eval-skill / validate-kb / preflight-kb） | 全部 exit 0 |
| R4 | 协议口径一致（AC9） | 对照 CLAUDE.md「阶段守卫接入」/ cicd-rules §4 / init SKILL §3.7 / DEVPILOT.md 场景1 注 | 四处命令行与行为描述一致 |
| R5 | 无新斜杠命令（AC8） | `git status` 新增文件清单 | 仅 `skills/jit-devpilot-init/scripts/devpilot-guard.js` 与文档；无 SKILL.md 新目录 |
| R6 | 零依赖（NF1） | 检查 guard 头部 require | 仅 fs/path/child_process（自测除外） |
| R7 | 状态扫描兼容 | `node scan-status.js <含 state 的项目>`（可选） | 脚本正常退出，无异常 |

## 回归范围说明

- 2.4.0 注入法律条文未改动，仅新增章节；R4 一并覆盖法律与守卫共存
- 批次回退点（03a §3）：CLAUDE.md 场景1 守卫行可单独删除恢复 2.4 行为，回归时验证该行存在且措辞正确即可