# 03 软件设计：知识库日常增量（kb-incremental-ops）

- 合并文档链；完整设计见 `01-requirements-analysis.md` §3（规则 11 条文骨架、scan-status 修改点、update SKILL 修改点、文件清单）。

**要点**：scan-status 读 INDEX.json 的 requirements[].id 做 Set 比对，无库跳过；只追加提示行不改状态枚举；update SKILL 定点插白名单节。回滚：git revert 单提交。级别：M（规划既定）。