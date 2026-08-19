---
name: jit-project-knowledge-fact-gate
description: DevPilot 知识库事实门控。用代码预言机核验知识库可证伪断言，注入上下文前只放行 pass。自然语言：知识库验真 / 事实门控 / 准入知识。
---

# jit-project-knowledge-fact-gate — 知识库事实门控

> 知识库仍可检索。进模型上下文的必须是**代码能证明的断言**。人不当裁判。

## 触发

```
/jit-project-knowledge-fact-gate --project <目标项目路径> [--query "<当前任务关键词>"]
```

自然语言：`知识库验真` / `事实门控` / `准入知识` / `知识库是否为真`

流水线内 **不需要用户手动触发**：任务 3/4/5/6/9 读取知识库当事实前，AI MUST 先跑本脚本（步骤 ③ 创建 00 之后；标识确认前禁止跑，因为预言机要读源码）。

## 做什么

1. 从 `docs/knowledge-base/` 抽出可证伪断言：路径、符号、模块目录、HTTP 路由、环境变量
2. 对照当前源码做确定性核验（无模型）
3. 只把 `pass` 写入可注入上下文；`fail` 视为已证伪，禁止当事实引用
4. 不拦截读源码，不缩小 RAG 检索范围；假条目进不了「当作真」的上下文

不可抽成路径/符号/模块/路由/环境变量的叙述，**不是证明**，只作线索，引用前必须再对照源码。

## 执行（MUST 用工具跑，禁止让用户手工复制）

```bash
node "$FRAMEWORK/skills/jit-project-knowledge-fact-gate/scripts/verify-kb-facts.js" "<目标项目绝对路径>" --query "<当前需求或任务关键词>"
```

Windows PowerShell 同样调用 `node`，路径用绝对路径。

`$FRAMEWORK` 来自 `~/.claude/devpilot-framework-path`。

无 `--query` 时核验全库并刷新准入文件；有 `--query` 时额外写出本次可注入切片。

## 产出（写在目标项目，禁止写框架目录）

| 文件 | 用途 |
|------|------|
| `docs/knowledge-base/PROJECT_KNOWLEDGE_ADMITTED.md` | Agent 引用知识库事实时的唯一准入清单 |
| `docs/knowledge-base/.verified/claims.json` | 全量断言与 pass/fail |
| `docs/knowledge-base/.verified/report.md` | 人可读报告 |
| `docs/knowledge-base/.verified/query-admit.md` | 本次 query 的可注入切片 |

## 流水线硬规则

1. 任务 3/4/5/6/9 把知识库当**当前事实**写入分析前，MUST 先跑本脚本（带上当前任务 `--query`）
2. 只允许把 `status=pass` 的断言当作「项目现在就是这样」
3. `status=fail` 的条目：知识库过期。禁止写进需求/设计/实现依据；需要时 Read/Grep 源码
4. 原始 `PROJECT_KNOWLEDGE_BASE.md` / `DETAIL.md` 仍可检索、仍可阅读结构；**不得绕过门控把其中的路径/符号/模块/路由直接当事实**
5. 知识库不存在：打印 `KB_STATUS=missing`，跳过门控，不强行生成知识库
6. 本门控不限制读取源码；但必须在需求标识确认并创建 00 之后才跑（预言机要扫源码）

## 与任务 2 / 8.5 的衔接

- 任务 2 生成知识库、`validate-kb.js` 结构校验通过后，MUST 再跑本脚本（可无 `--query`）
- 任务 8.5 增量更新后同样 MUST 再跑
- `validate-kb.js` 只检查文档结构；本脚本检查「和代码是否还一致」

## 输出给用户时说什么

- 断言总数、pass/fail
- fail 里和当前任务相关的过期路径/符号（不要整表倾倒）
- 明确：后续分析只使用准入结果；过期条目已忽略
