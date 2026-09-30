# CHANGELOG — kb-skeleton-index

## 知识库锚点

- 关联知识库版本：无（框架仓库自身未生成知识库）
- 关联模块域：知识库 Skill 层、校验脚本层、规则层
- 关联流程图：无
- 预计变更：新增 INDEX 契约与 build-index.js；validate-kb 增 INDEX 检查；规则层固化检索顺序

## 变更记录

| 日期 | 变更 | 说明 |
|------|------|------|
| 2026-09-30 | 创建 00-原始需求.md | 按 docs/DEVPILOT_VERSION_PLAN.md 2.6.0 立项（M 级，规划既定，用户授权免逐级确认） |
| 2026-09-30 | 01/02/03 产出 | 用户指令「全干免确认」：01/02/03 合并文档链（01 含分析+PRD+设计全文，02/03 为指针），完整性不缩减 |
| 2026-09-30 | 代码实现 | 新增 scripts/build-index.js；validate-kb.js 增 INDEX 检查与版本 warning；SKILL.md 合格定义+INDEX 规格+验收 3 项；KNOWLEDGE_BASE_RULES 规则 9/10；CLAUDE.md 必读清单首查 INDEX |
| 2026-09-30 | 测试 | 夹具自测 13/13 通过 + node --check；产出 04/05 |
| 2026-09-30 | 知识库更新 | 框架仓无知识库文档（无库可更）；增量更新体现为规则层文件本身 + 规划 §12 状态表 |
| 2026-09-30 | 规划核对补漏 | 按规划 §7.2「超长 BASE 无模块表视为失败」补 validate-kb 模块表检查（warning）+ SKILL 验收项；夹具验证通过 |