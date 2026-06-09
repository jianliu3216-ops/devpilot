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

