# Autopilot 框架完整目录结构

> 本文件由 README.md 抽取，供需要了解完整目录结构时参考。
> 日常使用不需要读这个文件，README.md 已包含足够信息。

## 共用框架目录

```
本仓库根目录（claude-code-autopilot）\ (共用框架目录，只放框架，不放项目产出)
├── .claude/
│   ├── agents/                             # Claude Code 自定义 Agent 定义目录
│   │   │                                   # 每个 .md 文件定义一个 Agent 的角色和提示词
│   │   │
│   │   ├── prd-research-agent.md          → 需求调研分析 Agent
│   │   │                                   作用：当你有一个简单需求时，这个 Agent 会帮你深入分析，
│   │   │                                   整理出结构化的需求分析文档，找出模糊点并列出待澄清疑问。
│   │   │
│   │   ├── task-orchestrator.md           → 任务编排路由 Agent
│   │   │                                   作用：作为中央路由器，`/van "xxx"` 命令就是由它自动分发任务给专业 Agent。
│   │   │
│   │   ├── testing-implementation-agent.md → 测试实现 Agent
│   │   │                                   作用：强制遵循 TDD 流程实现功能，先写测试，再写实现，最后重构。
│   │   │
│   │   ├── quality-agent.md               → 代码质量检查 Agent
│   │   │                                   作用：对已实现的代码进行质量审查，检查规范、潜在问题、安全漏洞。
│   │   │
│   │   ├── completion-gate.md             → 完成检查门 Agent
│   │   │                                   作用：任务完成时进行验证，输出标准化的测试结果报告。
│   │   │
│   │   ├── devops-agent.md                → DevOps 部署配置 Agent
│   │   │                                   作用：生成 CI/CD 配置文件（GitHub Actions、GitLab CI 等）。
│   │   │
│   │   ├── behavioral-transformation-agent.md → 行为转换 Agent
│   │   ├── command-system-agent.md        → 命令系统 Agent
│   │   ├── component-implementation-agent.md → 组件实现 Agent
│   │   ├── dynamic-agent-creator.md      → 动态 Agent 创建器
│   │   ├── enhanced-project-manager-agent.md → 增强项目管理 Agent
│   │   ├── enhanced-quality-gate.md      → 增强质量检查门
│   │   ├── feature-implementation-agent.md → 功能实现 Agent
│   │   ├── functional-testing-agent.md   → 功能测试 Agent
│   │   ├── hook-integration-agent.md     → 钩子集成 Agent
│   │   ├── infrastructure-implementation-agent.md → 基础设施实现 Agent
│   │   ├── metrics-collection-agent.md   → 指标收集 Agent
│   │   ├── npx-package-agent.md          → NPM 包创建 Agent
│   │   ├── polish-implementation-agent.md → 打磨实现 Agent
│   │   ├── prd-agent.md                  → PRD 生成 Agent
│   │   ├── prd-mvp.md                    → MVP PRD 生成 Agent
│   │   ├── readiness-gate.md             → 就绪检查门 Agent
│   │   ├── research-agent.md             → 调研 Agent
│   │   ├── routing-agent.md              → 路由 Agent
│   │   ├── task-checker.md               → 任务检查器
│   │   ├── task-executor.md              → 任务执行器
│   │   ├── tdd-validation-agent.md       → TDD 验证 Agent
│   │   ├── van-maintenance-agent.md      → 维护 Agent
│   │   ├── workflow-agent.md             → 工作流 Agent
│   │   └── lib/                           → Agent 依赖库
│   │
│   ├── hooks/                              # Claude Code 钩子脚本目录
│   │   ├── block-destructive-commands.sh → 阻止破坏性命令钩子
│   │   ├── collective-metrics.sh         → 指标收集钩子
│   │   ├── directive-enforcer.sh        → 指令强制执行钩子
│   │   ├── load-behavioral-system.sh    → 加载行为系统钩子
│   │   ├── routing-executor.sh          → 路由执行钩子
│   │   └── test-driven-handoff.sh       → TDD 交接钩子
│   │
│   ├── commands/                           # Claude Code 自定义命令目录
│   └── settings.json                      → Claude Code 项目设置文件
│
├── .claude-collective/                    # 框架核心文件目录
│   ├── CLAUDE.md                         → 框架自身的 Claude 规则
│   ├── DECISION.md                       → 决策记录
│   ├── agents.md                         → Agent 说明文档
│   ├── cicd-rules.md                     → Autopilot 核心规则（SessionStart 注入）
│   ├── hooks.md                          → 钩子说明文档
│   ├── quality.md                        → 质量标准文档
│   ├── research.md                       → 调研文档
│   ├── tests/                             → 框架自身测试
│   └── metrics/                           → 指标数据
│
├── skills/                                    # Autopilot Skill 定义目录
│   ├── jit-devpilot-init/                    → 全局激活流水线
│   ├── jit-env-auto-setup/                   → 环境自动检测与配置
│   ├── jit-project-autopilot-status/         → 查看项目状态
│   ├── jit-project-knowledge-base/           → 生成项目知识库
│   ├── jit-ui-ux-pro-max/                    → UI/UX 智能设计
│   └── jit-nowTimeAndModel/                  → 时间与模型
│
│   流程阶段（需求分析/PRD/设计/代码/测试）通过自然语言触发 /van → Agent 执行
│
├── docs/                                   # 框架文档
│   ├── DIRECTORY_STRUCTURE.md             → 本文件
│   └── KNOWLEDGE_BASE_RULES.md           → 知识库规则
│
├── install.sh                              → 安装脚本
├── uninstall.sh                            → 卸载脚本
├── CLAUDE.md                              → 项目行为规则（SessionStart 不注入，仅本目录生效）
├── README.md                              → 完整使用说明（AI 规则书）
└── 快速入门.md                             → 快速参考
```

## 目标项目产出目录结构

```
你的目标项目/ (比如 D:\projects\your-project)
├── docs/
│   ├── knowledge-base/                     → 历史项目私域知识库（共享，整个项目一份）
│   │   └── PROJECT_KNOWLEDGE_BASE.md
│   │
│   ├── user-login/                         → 需求A：用户登录注册（一个需求一个目录）
│   │   ├── 01-requirements-analysis.md
│   │   ├── 02-prd.md
│   │   ├── 03-software-design.md
│   │   ├── 04-test-cases.md
│   │   ├── 05-test-report.md
│   │   └── CHANGELOG.md
│   │
│   └── message-push/                       → 需求B：消息推送
│       ├── ...
│
├── tests/                                  → 测试代码目录（与 docs 同级，按需求隔离）
│   ├── user-login/
│   └── message-push/
│
└── (项目源代码...)                          → 实际业务代码，不受影响
```
