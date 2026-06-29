# Reference - Field Standards

## 1) Module Dictionary Field Definition

| Field | Required | Description |
|---|---|---|
| Module Name | Yes | Actual module/folder name |
| Module Type | Yes | Aggregation / Business / Foundation / Build |
| Business Meaning | Yes | Business responsibility in one sentence |
| Core Functions | Yes | 2-5 key capabilities |
| Upstream Dependencies | No | Who calls this module |
| Downstream Dependencies | No | What this module depends on |
| Priority | Yes | High / Medium / Low |
| Notes | No | Risks, migration, ownership hints |

## 2) Util/Helper Full Index Field Definition

| Field | Required | Description |
|---|---|---|
| Class Name | Yes | Utility class name |
| File Path | Yes | Full project-relative path |
| Category | Yes | Security / File / Network / DateTime / Convert / Validate / Log / Other |
| Function Summary | Yes | What it does (short) |
| Usage Scenario | Yes | Typical invocation context |
| Reuse Level | Yes | High / Medium / Low |
| Dependency Complexity | Yes | Low / Medium / High |
| Risk Level | Yes | Low / Medium / High |
| Called By Count | No | Number of references in codebase |
| Notes | No | Constraints or migration tips |

## 3) Tech Stack Field Definition

| Field | Required | Description |
|---|---|---|
| Layer | Yes | Language / Framework / Database / Cache / MQ / Build Tool |
| Technology | Yes | Name |
| Version | Yes | Exact version from source file |
| Source Evidence | Yes | File + key entry |
| Comment | No | Optional interpretation |

## 4) Diagram Asset Index Field Definition

| Field | Required | Description |
|---|---|---|
| Asset Name | Yes | File name |
| Type | Yes | PUML / PNG / SVG / JPG |
| Path | Yes | Project-relative path |
| Related Domain | Yes | Which business area |
| Flow Summary | Yes | 1-3 lines plain-language summary |

## 5) Refactoring Suggestion Field Definition

| Field | Required | Description |
|---|---|---|
| Issue ID | Yes | Unique identifier |
| Finding | Yes | Problem statement |
| Evidence | Yes | Path/symbol/reference |
| Impact | Yes | Risk if unchanged |
| Recommendation | Yes | Actionable fix |
| Priority | Yes | High / Medium / Low |
| Estimated Effort | No | S / M / L |

## 6) Script & Configuration Asset Index Field Definition

| Field | Required | Description |
|---|---|---|
| File Name | Yes | File name |
| File Type | Yes | Script / Config / Deployment / Archive |
| Relative Path | Yes | Project-relative path |
| Function Summary | Yes | What this file does (one sentence) |
| Execution Context | Yes | When/where it runs (Zabbix probe / K8s startup / backup etc.) |
| Dependencies | No | Required runtime (Python 3 / Bash / etc.) |
| Notes | No | Special notes or warnings |

## 7) Requirement Index Field Definition

The requirement index is maintained in `docs/knowledge-base/PROJECT_KNOWLEDGE_DETAIL.md`.
Create this section during the first knowledge-base generation even when there are no requirements yet.

| Field | Required | Description |
|---|---|---|
| Requirement ID | Yes | Kebab-case id matching `docs/{requirement-id}/` |
| Chinese Name | Yes | Human-readable requirement name |
| Level | Yes | S / M / L |
| Related Modules | Yes | Modules, domains, or files changed by the requirement |
| Completed Version | Yes | Knowledge-base version after completion |
| Status | No | In Progress / Completed / Changed / Paused |
| Notes | No | Linked requirements, risks, or follow-up work |

Template:

```markdown
## 需求索引

| 需求标识 | 中文名 | 级别 | 涉及模块 | 完成版本 | 状态 | 备注 |
|---------|-------|:--:|---------|:--:|------|------|
```

## 8) Function / API Change Index Field Definition

Use this section for task 8.5 incremental updates. Only update rows for modules touched by the current requirement.

| Field | Required | Description |
|---|---|---|
| Module | Yes | Module or domain name |
| Symbol / Endpoint | Yes | Function, method, class, endpoint, config key, or message type |
| File Path | Yes | Project-relative source path |
| Change Type | Yes | Added / Modified / Deleted / Renamed |
| Summary | Yes | Short behavior or contract summary |
| Called By / Consumers | No | Main callers, API consumers, jobs, or UI pages |
| Risk | Yes | Low / Medium / High |
| Requirement ID | Yes | Requirement id that introduced or changed this symbol |
| Version | Yes | Knowledge-base version after update |

Template:

```markdown
## 函数与接口变更索引

| 模块 | 符号/接口 | 文件路径 | 变更类型 | 摘要 | 调用方/消费者 | 风险 | 需求标识 | 版本 |
|------|----------|----------|----------|------|---------------|------|----------|------|
```

## 9) Knowledge Base Update Record Field Definition

Both BASE and DETAIL must contain an update record. DETAIL is updated for every completed requirement; BASE is updated only for architecture, deployment, or tech-stack changes.

| Field | Required | Description |
|---|---|---|
| Version | Yes | Incremented knowledge-base version, e.g. v1.1 |
| Date | Yes | YYYY-MM-DD |
| Requirement ID | No | Requirement id, or `initial` / `architecture` |
| Change Scope | Yes | Modules, documents, PUML files, or config areas updated |
| Summary | Yes | What changed and why |
| Updated Files | No | Knowledge-base or PUML files touched |

Template:

```markdown
## 更新记录

| 版本 | 日期 | 需求标识 | 变更范围 | 说明 | 更新文件 |
|------|------|----------|----------|------|----------|
| v1.0 | YYYY-MM-DD | initial | 全量创建 | 初始知识库 | BASE, DETAIL |
```

