# CodeGraph 安装指南

> CodeGraph 是 DevPilot 的**可选**加速工具，未安装不影响流程（知识库 Skill 会自动回退为全量扫描）。
> install.sh **不自动安装** CodeGraph，原因：Windows 上 `better-sqlite3` native 编译常失败，自动安装易留下损坏安装。

---

## 1. 作用

- `codegraph build` — 预生成依赖图，知识库扫描上下文消耗减少 70-80%
- `codegraph fn-impact <函数>` — 精确计算变更影响半径（任务9 变更分析）
- `codegraph dead-code` / `codegraph check` — 死代码检测 / CI 门禁

知识库 Skill 在 Phase 0.0 通过 `preflight-kb.sh` 做轻量自检：先展示源码文件数、项目体积、是否大项目和 CodeGraph 状态。若项目较大，必须先询问用户是否使用 CodeGraph；用户确认后才执行 `codegraph build`（以 build 成功为准），成功后使用 `.codegraph/`，否则在文档注明降级原因。

---

## 2. 前置要求

| 项 | 要求 |
|----|------|
| Node.js | >= 22.12.0 |
| 操作系统 | Windows / macOS / Linux |
| Windows 额外 | Visual Studio Build Tools（C++ 工作负载）**或** 能下载预编译包的网络 |

---

## 3. 安装方式

### 方式 A：直接 npm 安装（最简单，优先试）

```bash
npm install -g @optave/codegraph
codegraph --version
```

**若返回版本号** → 安装成功，无需看后续。

**若报错** → 多半是 `better-sqlite3` 的 native 编译失败，见下方方式 B/C。

---

### 方式 B：装 Visual Studio Build Tools 后重装（Windows 编译失败时）

`better-sqlite3` 在 Windows 上若下不到预编译包，会回退到本地编译，需要 VS C++ 工具链。

1. 下载 [Visual Studio 2022 Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
2. 安装时勾选「Desktop development with C++」工作负载
3. 重装 CodeGraph：

```bash
npm uninstall -g @optave/codegraph
npm install -g @optave/codegraph
codegraph --version
```

---

### 方式 C：用框架辅助脚本（Windows，集中处理残留）

框架提供 `scripts/fix-codegraph.ps1`，会清理损坏的 Roaming shim → 卸载 → 重装。

PowerShell（不是 Git Bash）跑：

```powershell
cd L:\jit\claude-code-autopilot
powershell -ExecutionPolicy Bypass -File scripts\fix-codegraph.ps1
```

> 该脚本不保证成功，本质还是 `npm install`，仅多了清理逻辑。若仍失败，回到方式 B。

---

### 方式 D：升级 Node 到 22+（若 Node 版本过低）

若 Node < 22.12.0，需先升级。框架提供 `scripts/upgrade-node-portable.ps1`，用官方 ZIP 升级到 `D:\nodejs`（无需 MSI）：

```powershell
cd L:\jit\claude-code-autopilot
powershell -ExecutionPolicy Bypass -File scripts\upgrade-node-portable.ps1
# 或指定版本
powershell -ExecutionPolicy Bypass -File scripts\upgrade-node-portable.ps1 -Version v22.23.1
```

升级后再跑方式 A。

---

## 4. 验证可用

```bash
codegraph --version          # 应返回版本号
cd 你的项目根目录
codegraph build              # 生成 .codegraph/
ls .codegraph/               # 应有输出文件
```

`codegraph --version` 能跑 ≠ `codegraph build` 能跑。`better-sqlite3` 的 native binding 在某些环境下 `--version` 通过但 `build` 失败。**真正确认可用要看 `codegraph build`**。

---

## 5. 排查清单

| 现象 | 原因 | 解决 |
|------|------|------|
| `codegraph: command not found` | PATH 没含 npm prefix | 重开终端；或把 `npm prefix -g` 加进 PATH |
| `Could not find any Visual Studio installation` | Windows 缺 C++ 工具链 | 方式 B |
| `gyp ERR! configure error` | 同上 | 方式 B |
| `--version` 可用但 `build` 报错 | native binding 损坏 | `npm rebuild better-sqlite3` 或方式 C |
| `npm ls -g` 有但 CLI 不可用 | Roaming 残留 shim | 方式 C |

---

## 6. 卸载

```bash
npm uninstall -g @optave/codegraph
# Windows 清理残留 shim
rm -f "$(npm prefix -g)/codegraph" "$(npm prefix -g)/codegraph.cmd"
rm -rf "$APPDATA/npm/node_modules/@optave/codegraph"
```

卸载后 DevPilot 流程不受影响，知识库 Skill 自动回退全量扫描。

---

## 7. 关于 install.sh 不自动安装的决策

历史版本 install.sh 曾尝试自动安装 CodeGraph，问题：

1. Windows 上 `better-sqlite3` 编译失败率高，自动安装留下损坏安装
2. 用户环境差异大（Node 版本、VS、网络），统一处理反而难
3. CodeGraph 是**可选**工具，不该让 install.sh 因它失败而中断

**决策**：install.sh 只检测不安装，用户按本指南自行安装。三个辅助脚本（`node-detect.sh` / `fix-codegraph.ps1` / `upgrade-node-portable.ps1`）保留作为「用户主动要装时的辅助工具」，不在主流程主动调用。
