# 04 测试用例 + 05 测试报告（合并）：kb-incremental-ops

## 用例（夹具自测，os.tmpdir 构造假项目，跑完自清理）

| # | 用例 | 预期 |
|---|------|------|
| SC1 | 无 INDEX.json 项目跑 scan-status | 检查静默跳过，不报「缺 INDEX 条目」（AC6） |
| SC2 | INDEX.json 含 user-login 条 | 状态「✅ 已完成」 |
| SC3 | INDEX.json 缺 user-login 条（有 05） | 状态「⚠️ 未完成（缺 INDEX 条目）」+ 缺失文档列 INDEX-需求条目 |
| SC4 | INDEX.json 坏 JSON | 不崩溃，按缺条目处理 |
| T5 | node --check scan-status.js | 0 退出 |

## 报告

- 日期：2026-09-30
- 结果：**5/5 通过**（SC1–SC4 + 语法检查）
- 文档层验收：规则 11（三情形+阈值先问）、update SKILL 白名单四项+禁改清单、CLAUDE.md 禁令行 — 均已落位（AC1/AC2/AC4）
- 残留风险：scan-status 下游若依赖 status 精确枚举，「⚠️ 未完成（缺 INDEX 条目）」为新串（仅追加，不改既有枚举）