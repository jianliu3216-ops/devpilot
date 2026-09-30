# 02 PRD：骨架知识库 + 机器索引（kb-skeleton-index）

- 本需求因用户指令「全干免确认」采用合并文档链；完整 PRD 内容见 `01-requirements-analysis.md` §2（US/FR）、§4（AC1–AC7）、§5（风险）。

**要点**：FR1 build-index 生成 INDEX.md/.json（unknown 不编造）；FR2 validate-kb 缺 INDEX 即 error；FR3 规则 9/10 固化检索顺序；FR4 存量抽取兼容；FR5 BASE 骨架章节白名单。

验收：AC1–AC7（见 01 §4）。级别：M（规划既定）。