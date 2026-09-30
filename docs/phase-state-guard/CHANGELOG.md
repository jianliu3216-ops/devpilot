# CHANGELOG — phase-state-guard

## 知识库锚点

- 关联知识库版本：无（框架仓库自身未生成知识库）
- 关联模块域：状态机层（新）、守卫脚本（新）、会话协议层
- 关联流程图：无（本需求 03 设计内含状态机图）
- 预计变更：新增 state.yaml 契约与 devpilot-guard.js，CLAUDE.md/cicd-rules 阶段推进接入 guard

## 变更记录

| 日期 | 变更 | 说明 |
|------|------|------|
| 2026-09-30 | B1–B5 全部完成：guard 脚本（四命令+规则表+审计+防漂移）、CLAUDE.md/cicd-rules/init/DEVPILOT.md/status 五处协议接入、04+04a+05 | 夹具 11/11、回归 R1–R6 通过；规划状态表已更新 |
| 2026-09-30 | 创建 03a-change-strategy.md | B1–B5 批次、回滚（含 CLAUDE.md 临时回退点）、风险触发器 |
| 2026-09-30 | 创建 03-software-design.md | HLD+LLD 合并：架构图、状态机、state/事件 schema、guard CLI、规则表、双轨防漂移 |
| 2026-09-30 | 创建 02-prd.md | L 级确认后产出：US1–US5、FR1–FR7、AC1–AC9 |
| 2026-09-30 | 创建 00-原始需求.md | 按 docs/DEVPILOT_VERSION_PLAN.md 2.5.0 立项（L 级） |