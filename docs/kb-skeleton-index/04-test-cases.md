# 04 测试用例：kb-skeleton-index（当前版本仅单元测试）

## 用例清单（夹具自测，临时目录构造假 BASE/DETAIL/需求目录）

| # | 用例 | 步骤 | 预期 |
|---|------|------|------|
| TC1 | validate-kb 缺 INDEX | 夹具只有 BASE/DETAIL，跑 validate-kb.js | 报缺 INDEX.md/.json 两条 error，exit 1 |
| TC2 | build-index 正常生成 | 跑 build-index.js | exit 0，控制台输出 modules/requirements 计数 |
| TC3 | kb_version 抽取 | BASE 含 `v2.1` | INDEX.json kb_version=2.1（两段式版本兼容） |
| TC4 | 模块节抽取 | DETAIL 有 `## 认证` | modules 含 title=认证、detail_section=PROJECT_KNOWLEDGE_DETAIL.md#认证 |
| TC5 | paths 来自 BASE 表行 | BASE 模块表行含反引号路径 | paths 含 login.js；符号/路径互斥分类 |
| TC6 | requirements 目录抽取 | docs/user-login 存在 | requirements 含 id=user-login、docs=docs/user-login/ |
| TC7 | title 抽取 | 00 首个 `# 用户登录` | title=用户登录 |
| TC8 | level 抽取 | 01 含 `级别：M` | level=M |
| TC9 | 锚点联动 | CHANGELOG 锚点含 `认证` | req.modules 含模块 id，module.requirements 回填 |
| TC10 | 不编造 | 无路径信息 | 缺失字段为空数组/unknown，禁止编造 |
| TC11 | 补齐后通过 | build 后再 validate | Validation passed，exit 0 |
| TC12 | 版本不一致 warning | 手改 kb_version=9.9.9 | validate 输出 does not match BASE version（warning，不阻断） |
| TC13 | 无 KB 降级 | 空 docs 项目跑 build-index | exit 1，提示先跑任务2 |

## 语法检查
- node --check：build-index.js、validate-kb.js（0 退出）

## 边界覆盖
- 正常路径：TC2/TC4/TC6；异常路径：TC1/TC13；边界条件：TC3（两段式版本号）/TC10（unknown 不编造）/TC12（warning 级）