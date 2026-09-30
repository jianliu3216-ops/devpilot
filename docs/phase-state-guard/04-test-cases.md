# 04 测试用例：阶段状态与证据守卫（phase-state-guard）

- 日期：2026-09-30
- 级别：L
- 测试范围：当前版本仅单元测试（脚本单元级验证）
- 上游：`02-prd.md` AC1–AC9、`03-software-design.md` §6–§8

## 1. 单元测试用例

| # | 用例 | 类型 | 输入/前置 | 期望 |
|---|------|------|-----------|------|
| TC1 | 缺 00 禁入 analysis（AC1） | 正常路径 | --init 后删 state，`check analysis` | exit 1，`[HARD STOP]` |
| TC2 | S 级缺 01 禁入 impl | 正常路径 | S state, phase=analysis, 无 01 | exit 1，缺 01 |
| TC3 | S 级有 01 可入 impl（AC2） | 正常路径 | S state（skipped: prd/design/test_cases），有 01 | exit 0；不检查 02/03 |
| TC4 | waiting_confirm 拒 --apply（AC4） | 异常路径 | status=waiting_confirm | exit 1，拒绝原因含人工确认 |
| TC5 | --apply 成功（AC5） | 正常路径 | 合法 S 路径 analysis→impl | exit 0；state.phase=impl；events 含 to=impl |
| TC6 | 重复 --init 拒绝 | 异常路径 | state 已存在 | exit 1，拒绝覆盖 |
| TC7 | M 级缺 05 禁入 kb_update（AC3） | 异常路径 | M state, phase=report, 无 05 | exit 1，缺 05 |
| TC8 | resume 输出（AC6） | 正常路径 | 任意 state | exit 0；含 phase/level/status/下一动作 |
| TC9 | --init 补建（AC7） | 正常路径 | req-b 无 state | exit 0；phase=identified（无 00） |
| TC10 | 非法 state 结构报错 | 异常路径 | 手改出未知缩进块 | exit 1，非法结构提示 |
| TC11 | 阶段顺序校验 | 异常路径 | phase=analysis 直接 check impl（M 级） | exit 1，顺序不合法 |
| TC12 | YAML 最小解析 | 边界 | skipped: [prd, design] 一行列表 | 正确解析为列表 |
| TC13 | evidence 回写 | 边界 | --apply design 且 03a 存在 | evidence.design 与 change_strategy 均回写 |
| TC14 | 无测理由豁免 implDone | 边界 | no_test_note 非空 | implDone 条件通过 |

## 2. 验证方法

夹具脚本（临时目录自建需求结构）驱动 guard CLI，逐条断言退出码与落盘内容；运行记录见 05 报告。脚本位于本会话临时目录，不留存仓库（避免污染）。

## 3. 覆盖声明

- 覆盖：PRD AC1–AC7 的脚本级验证、schema 解析、审计追加、恢复输出
- 未覆盖（当前版本范围外）：多会话并发写（已知限制）、真实 Claude 会话内模型遵循度（运行时冒烟，随日常使用验证）