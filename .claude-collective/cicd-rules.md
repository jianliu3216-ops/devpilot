# DevPilot 流程核心规则（SessionStart 自动注入）

> 本文件由 .claude/hooks/load-behavioral-system.sh 自动加载到每个会话
> 完整流程详见 README.md

## 触发规则
当用户输入包含以下关键词时，自动调用对应 Skill：

| 关键字 | 自动调用 Skill | 示例 |
|-------|-------------|------|
| `需求分析`、`分析需求` | requirement-analysis | `需求分析：我要做用户登录模块，目标项目：D:\my-app` |
| `生成PRD`、`PRD`、`产品需求文档` | generate-prd | `生成PRD` |
| `软件设计`、`架构设计`、`生成设计文档`、`变更策略` | software-design | `确认PRD，继续软件设计` |
| `代码实现`、`实现代码`、`开始编码` | implement-code | `确认设计，开始代码实现` |
| `测试用例`、`生成测试用例`、`回归验证` | test-cases | `确认代码，生成测试用例` |
| `测试报告`、`生成测试报告`、`运行测试` | test-report | `确认用例，生成测试报告` |
| `知识库更新`、`更新知识库` | test-report 后自动执行 | `更新知识库` |
| `需求变更`、`变更需求` | requirement-change | `需求变更：user-login 增加忘记密码` |
| `生成知识库`、`项目知识库`、`PROJECT_KNOWLEDGE_BASE` | project-knowledge-base | `生成知识库，目标项目：D:\my-app` |
| `/project-autopilot-status`、`查看状态` | project-autopilot-status | `/project-autopilot-status` |

## 输出路径规则（最高优先级）
- **所有文档输出到目标项目目录**，绝不输出到框架目录
- **一个需求一个目录**：`[目标项目]/docs/{需求标识}/`
- 知识库共享：`[目标项目]/docs/knowledge-base/`
- 测试代码：`[目标项目]/tests/{需求标识}/`

## 需求标识规则（任务3强制执行）
1. AI 根据需求描述自动建议英文标识（kebab-case）
2. **必须提示用户确认**：
   ```
   需求【{中文需求}】英文标识建议：{requirement-id}
   是否需要调整？
   ```
3. 用户确认后才创建目录、继续执行

## 变更分级规则（强制执行）
- 用户不指定级别时，AI 必须在任务3或任务9.2自动评估并输出分级建议
- **必须等用户确认级别后才能进入后续阶段**
- 不能跳过分级直接执行
- S级（≤3文件）、M级（4-15文件或2-3模块）、L级（>15文件或跨模块全局变更）

## 知识库锚点规则
- 如果知识库存在，每个文档顶部必须包含知识库锚点（版本、模块域、流程图、预计变更）
- 每个文档末尾必须包含变更记录表（版本、日期、变更范围、说明）

## 流程阶段（严格顺序，每阶段等用户确认）
正常需求：需求分析 → 分级确认 → PRD → 设计 → 代码实现 → 测试用例 → 测试报告 → 知识库更新
需求变更：描述变更 → 影响分析+分级 → 确认范围 → 按级别执行 → 知识库更新

## 按级别适配
| 阶段 | S级 | M级 | L级 |
|------|:---:|:---:|:---:|
| PRD | 跳过 | ✅ | ✅ |
| 设计 | 跳过 | software-design | change-strategy |
| 代码 | 直接改 | TDD | 按策略分批 |
| 测试 | 跳过 | test-cases | regression-checklist |

## 知识库更新（流程闭环）
流程最后一步（测试报告完成）必须执行知识库增量更新，不全量重扫。

## 推荐工具：CodeGraph
- **知识库生成**：`codegraph build` 预生成依赖图 → 提升模块分析准确性和效率
- **变更分析**：`codegraph fn-impact <函数>` 精确计算变更影响半径
- **质量检查**：`codegraph dead-code` 检测死代码、`codegraph check` CI门禁
- 安装：`npm install -g @optave/codegraph`
- 非必装依赖，但有它协同效果更好
