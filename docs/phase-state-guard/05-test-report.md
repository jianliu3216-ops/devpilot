# 05 测试报告：阶段状态与证据守卫（phase-state-guard）

- 日期：2026-09-30
- 用例来源：`04-test-cases.md` TC1–TC14、`04a-regression-checklist.md` R1–R7

## 1. 结果统计

| 结果 | 数量 |
|------|------|
| 单元用例（TC） | 14/14 通过（夹具序列 11 断言 + 解析/回写/豁免 3 项核验） |
| 回归项（R） | R1–R6 通过；R7 为可选未执行（状态扫描脚本未改动，R3 已覆盖语法） |
| 失败 | 0 |

## 2. 夹具实测记录

临时目录自建 `docs/req-a`、`docs/req-b` 结构，驱动 guard CLI：

```text
PASS AC1 缺00禁入analysis(--init 前置, exit=0)
PASS AC1 缺00禁入analysis(真验) (exit=1, [HARD STOP])
PASS AC2a S级缺01禁入impl (exit=1)
PASS AC2b S级有01可入impl(不查02/03) (exit=0)
PASS AC4 waiting_confirm拒apply (exit=1)
PASS AC5 apply impl成功 (exit=0) + state+审计落盘核验
PASS AC6 resume输出 (exit=0, 含下一动作)
PASS AC3 M级缺05禁入kb_update (exit=1, [HARD STOP] 缺 05)
PASS AC7 init补建(req-b) (exit=0)
PASS AC7b 重复init拒绝 (exit=1)
合计: 11 通过, 0 失败
```

## 3. 回归记录

| 回归项 | 结果 | 证据 |
|--------|------|------|
| R1 语法 | ✅ | node --check exit 0 |
| R2 夹具自测 | ✅ | §2：11/11 |
| R3 既有脚本 | ✅ | 7 个脚本全部 node --check 通过 |
| R4 口径一致 | ✅ | CLAUDE.md「阶段守卫接入」/ cicd-rules §4 引注 / init SKILL §3.7 / DEVPILOT.md S 级纪律后守卫注——四处命令行与行为一致 |
| R5 无新斜杠 | ✅ | 新增仅 guard 脚本 + 本需求文档链，无新 SKILL.md 目录 |
| R6 零依赖 | ✅ | guard 头部仅 require fs/path |
| R7 状态扫描 | ◐ | 未执行（scan-status.js 未改动） |

## 4. 残留风险

1. 模型是否在真实会话中遵循「先 check 再 --apply」属规则层约束（03 设计 §12 已声明机器级防绕过为非目标）；建议下次真实需求冒烟
2. 最小 YAML 解析仅支持锁定 schema；用户手改复杂结构会被拒绝（设计如此，防漂移）
3. JSONL 无并发锁（单会话限制，脚本头注释已记）

## 5. 变更文件清单

- 新增：`skills/jit-devpilot-init/scripts/devpilot-guard.js`、`docs/phase-state-guard/`（00–05、04a、CHANGELOG、.handoff）
- 修改：CLAUDE.md（阶段守卫接入节）、DEVPILOT.md（场景1 注 + 分级表守卫注）、cicd-rules.md（§4 守卫引注）、skills/jit-devpilot-init/SKILL.md（§3.7）、skills/jit-project-devpilot-status/SKILL.md（state 关系提示）