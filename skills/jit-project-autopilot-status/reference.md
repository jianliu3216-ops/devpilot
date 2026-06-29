# Status Scan Reference

## 触发

```
/jit-project-autopilot-status
查看状态，目标项目：<路径>
```

## 强制：扫描全部需求

**禁止**只报告用户提到的单个需求。MUST：

1. `Glob` 或 `ls` 列出 `{project}/docs/*/`（**排除** `knowledge-base`）
2. 读取 `docs/knowledge-base/PROJECT_KNOWLEDGE_DETAIL.md` 的 **## 需求索引** 表
3. **合并**两处来源，去重后逐条输出（避免遗漏仅存在于 KB 或仅存在于 docs 的需求）
4. 检查 `{project}/tests/{需求标识}/` 测试代码目录是否存在
5. 检查 `00-原始需求.md` 是否包含 `## 知识库锚点`

## 推荐：运行扫描脚本

```bash
node "$FRAMEWORK/skills/jit-project-autopilot-status/scripts/scan-status.js" "<目标项目绝对路径>"
```

将脚本输出作为状态总览基础，再补充 CHANGELOG 变更细节。

## 按级别必需文档

| 级别 | docs 必需 | 测试代码 |
|------|----------|--------|
| **S** | 00, 01, 05（跳过 02/03/04 文档） | `tests/{id}/` 可选 |
| **M** | 00, 01, 02, 03, 04, 05 | `tests/{id}/` 可选；02a 接口契约按需 |
| **L** | 00, 01, 02, 03, **03a**, 04, **04a**, 05 | `tests/{id}/` 可选；02a 高风险/接口变更推荐 |

**L 级 MUST 同时有** `03-software-design.md` 与 `03a-change-strategy.md`（不是二选一）。

## 级别获取

每个需求 **必须先读** `01-requirements-analysis.md` 前 40 行取 S/M/L，**禁止**仅凭文件数量猜级别。

## 状态优先级

1. CHANGELOG 暂停 → ⏸️
2. CHANGELOG 变更中 → 🔁
3. 无法读取 S/M/L → ⚠️ 待确认级别
4. 按级别检查缺失 → 🔄 进行中
5. 必需齐全 + 05-test-report → ✅

## 当前阶段推断（有最高编号文档）

| 已有最新文档 | 下一步 |
|-------------|--------|
| 00 only | 任务3 继续 |
| 01（S 级） | 任务6 编码（S 级跳过 PRD/设计/测试用例） |
| 01（M/L 级） | 任务4 PRD |
| 02 | 任务4.5 接口契约（如需）或任务5 设计 |
| 02a | 任务5 设计 |
| 03 (+03a L级) | 任务6 编码 |
| 04 (+04a L级) | 任务7 `测试用例` |
| 05 | 任务8.5 知识库更新 |
