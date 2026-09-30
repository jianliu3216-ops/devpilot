# 03 软件设计：骨架知识库 + 机器索引（kb-skeleton-index）

- 本需求因用户指令「全干免确认」采用合并文档链；完整设计见 `01-requirements-analysis.md` §3（INDEX schema、build-index 抽取算法、validate-kb 修改点、规则层条文、涉及文件清单）。

**要点**：INDEX.json 字段锁定（kb_version/modules/requirements）；抽取只扫 BASE/DETAIL 与 docs 目录名（不扫源码）；抽不出写 unknown；validate-kb 缺 INDEX 报 error、版本不一致报 warning；规则 9（机器索引）/规则 10（检索顺序：INDEX 命中 → 门控 pass → 按需下钻）写入 KNOWLEDGE_BASE_RULES 与 CLAUDE.md。

回滚：git revert 单提交。级别：M（规划既定）。