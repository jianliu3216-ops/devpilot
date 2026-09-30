# 05 测试报告：单一入口与自然语言触发（single-nl-entry）

- 日期：2026-09-30
- 用例来源：`04-test-cases.md` TC1–TC15
- 测试性质：文档/规则改动的验收核对（无代码运行时测试）

## 1. 结果统计

| 结果 | 数量 |
|------|------|
| 通过 | 12（TC1–TC12） |
| 规则级落位（落点已验，运行时行为待真实会话冒烟） | 3（TC13–TC15） |
| 失败 | 0 |

## 2. 逐条结果

| 用例 | 结果 | 证据 |
|------|------|------|
| TC1 斜杠推荐 ≤1 | ✅ | init SKILL 第 2 步：菜单无斜杠推荐区，仅末尾一行兼容说明 |
| TC2 NL 表覆盖 | ✅ | 菜单表含任务 2/3/4/4.5/5/6/7/8/8.5/9 + 事实门控 + 环境 + 状态 + 快速立项；核心别名在表，冷僻同义词以 CLAUDE.md 为准（单一事实源设计） |
| TC3 Skill 保留 | ✅ | Glob 确认 10 个 `skills/jit-*/SKILL.md` 均在 |
| TC4 S 级建议 | ✅ | CLAUDE.md 会话规则第 5 条 |
| TC5 零新斜杠 | ✅ | git status 仅 15 个文件修改 + 2 个新增目录，无新斜杠注册 |
| TC6 R1–R3 | ✅ | CLAUDE.md 规则第 5 条（R1/R3）+ 第 4 条（模糊确认） |
| TC7 R4 三层兜底 | ✅ | CLAUDE.md 规则第 6 条（T1/T2/T3 + 救援字）+ init 菜单「菜单」提示 |
| TC8 自定义描述循环 | ✅ | CLAUDE.md 规则第 6 条（循环、≤2 候选、两轮上限、点名兜底） |
| TC9 单一事实源 | ✅ | init SKILL 第 2 步声明菜单与 CLAUDE.md 触发方式一一致 |
| TC10 外围口径 | ✅ | README L86 查看进度→NL；快速入门斜杠清单→兼容说明；DEVPILOT.md L139 NL 主入口；GUIDE 表头标注 NL 为主 |
| TC11 description 标注 | ✅ | 10 个 SKILL.md frontmatter 均含「内部调用 + 自然语言」 |
| TC12 旧斜杠兼容 | ✅ | 仅追加标注，未删除任何触发能力 |
| TC13–TC15 运行时契约 | ◐ | 规则文本已落位；真实会话冒烟（输「菜单」、两轮循环）留待用户下次会话验证 |

## 3. 残留风险

1. 菜单表为 CLAUDE.md 表的压缩视图，冷僻别名（如「分析需求」「架构设计」）未全部列出——由 TC9 单一事实源约束兜底
2. TC13–TC15 为协议级行为，依赖模型遵循 CLAUDE.md 规则；建议用户在下次真实使用中冒烟验证
3. 其他引用旧菜单的文档（collective/van 等）未清扫——按设计属兼容层，不在本版本范围

## 4. 变更文件清单

CLAUDE.md、DEVPILOT.md、README.md、快速入门.md、docs/DEVPILOT_CLAUDE_CODE_GUIDE.md、10 个 skills/jit-*/SKILL.md；新增 docs/DEVPILOT_VERSION_PLAN.md、docs/single-nl-entry/（00–05 + CHANGELOG + .handoff）。