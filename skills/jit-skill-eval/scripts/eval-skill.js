#!/usr/bin/env node
/**
 * DevPilot Skill 评估器
 * 用法:
 *   node eval-skill.js <skill名称或路径> --collect            # 静态检查，输出 JSON，零写文件
 *   node eval-skill.js <skill名称或路径> --quick              # 静态最小项，直接渲染 HTML 报告
 *   node eval-skill.js <skill名称或路径> --smoke '<冒烟JSON>'  # 合并 AI 冒烟结果，渲染最终 HTML
 *
 * 报告输出: <FRAMEWORK>/docs/skill-eval/<skill>-YYYYMMDD.html
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

/* ---------- 路径解析 ---------- */

function resolveFramework() {
  if (process.env.DEVPILOT_FRAMEWORK) return process.env.DEVPILOT_FRAMEWORK;
  const pathFile = path.join(
    process.env.HOME || process.env.USERPROFILE || "",
    ".claude",
    "devpilot-framework-path"
  );
  if (fs.existsSync(pathFile)) {
    const p = fs.readFileSync(pathFile, "utf8").trim();
    if (p && fs.existsSync(p)) return p;
  }
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, "skills")) && fs.existsSync(path.join(cwd, "DEVPILOT.md"))) {
    return cwd;
  }
  return null;
}

function resolveSkillDir(arg, framework) {
  if (!arg) return null;
  const asPath = path.resolve(arg);
  if (fs.existsSync(asPath)) {
    if (fs.existsSync(path.join(asPath, "SKILL.md"))) return asPath;
    if (arg.endsWith("SKILL.md")) return path.dirname(asPath);
  }
  if (framework) {
    const candidate = path.join(framework, "skills", arg);
    if (fs.existsSync(path.join(candidate, "SKILL.md"))) return candidate;
  }
  return null;
}

/* ---------- 工具 ---------- */

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readFirst(files) {
  for (const f of files) {
    if (fs.existsSync(f)) return fs.readFileSync(f, "utf8");
  }
  return "";
}

function parseFrontmatter(md) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w]*)\s*:\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return fm;
}

/* ---------- 静态检查项 ---------- */

function runChecks(skillDir, framework) {
  const skillName = path.basename(skillDir);
  const skillMd = fs.readFileSync(path.join(skillDir, "SKILL.md"), "utf8");
  const checks = [];

  // 1. frontmatter：name + description
  const fm = parseFrontmatter(skillMd);
  const fmNameOk = fm && fm.name && fm.name.trim().length > 0;
  const fmDescOk = fm && fm.description && fm.description.trim().length > 0;
  const fmTriggerOk = fm && fm.description && /[触发|自然语言]/.test(fm.description);
  checks.push({
    id: 1,
    name: "frontmatter 完整性",
    passed: fmNameOk && fmDescOk,
    detail: fm
      ? `name=${fm.name || "缺失"} · description=${fmDescOk ? "有" : "缺失"} · 含触发描述=${fmTriggerOk ? "是" : "否"}`
      : "SKILL.md 无 YAML frontmatter",
  });

  // 2. 必备章节：触发/执行/产出（产出=产出|输出；用法可选）
  const requiredSections = [
    { key: "触发", re: /触发/ },
    { key: "执行", re: /执行/ },
    { key: "产出/输出", re: /产出|输出/ },
  ];
  const missingSections = requiredSections.filter((s) => !s.re.test(skillMd)).map((s) => s.key);
  checks.push({
    id: 2,
    name: "必备章节",
    passed: missingSections.length === 0,
    detail: missingSections.length ? `缺章节: ${missingSections.join("/")}` : "触发/执行/产出 齐全",
  });

  // 3. 引用的 scripts/*.js 存在性（排除跨 skill 引用：skills/<其他>/scripts/…）
  const allScriptRefs = [...skillMd.matchAll(/scripts\/([A-Za-z0-9._-]+\.js)/g)].map((m) => m[1]);
  const crossSkillRefs = [
    ...skillMd.matchAll(/skills\/[A-Za-z0-9_-]+\/scripts\/([A-Za-z0-9._-]+\.js)/g),
  ].map((m) => m[1]);
  const scriptRefs = [...new Set(allScriptRefs.filter((f) => !crossSkillRefs.includes(f)))];
  const missingScripts = scriptRefs.filter((s) => !fs.existsSync(path.join(skillDir, "scripts", s)));
  const scriptsDir = path.join(skillDir, "scripts");
  const allScripts = fs.existsSync(scriptsDir)
    ? fs.readdirSync(scriptsDir).filter((f) => f.endsWith(".js"))
    : [];
  checks.push({
    id: 3,
    name: "脚本引用存在性",
    passed: missingScripts.length === 0,
    detail: `引用 ${scriptRefs.length} 个 · 缺失 ${missingScripts.length} 个 · 目录实际 ${allScripts.length} 个 .js`,
  });

  // 4. node --check 语法
  const syntaxErrors = [];
  for (const f of allScripts) {
    const full = path.join(scriptsDir, f);
    try {
      execSync(`node --check "${full}"`, { stdio: "pipe" });
    } catch (e) {
      const msg = String(e.stderr || e.message).split("\n")[0];
      syntaxErrors.push(`${f}: ${msg}`);
    }
  }
  checks.push({
    id: 4,
    name: "脚本语法 node --check",
    passed: syntaxErrors.length === 0,
    detail: syntaxErrors.length ? syntaxErrors.join(" | ") : `全部 ${allScripts.length} 个脚本语法通过`,
  });

  // 5. 触发词与 CLAUDE.md 一致
  const claudeMd = framework ? readFirst([path.join(framework, "CLAUDE.md")]) : "";
  const triggerWords = (fm && fm.description ? fm.description : skillMd)
    .match(/[一-龥]{2,12}/g)
    .filter((w) => !/技能|能力|用法|触发|命令|评估|压缩|自然|语言|知识库|项目|当前|阶段|开发/.test(w));
  const uniqueWords = [...new Set(triggerWords)].slice(0, 4);
  const foundWords = uniqueWords.filter((w) => claudeMd.includes(w));
  checks.push({
    id: 5,
    name: "触发词与 CLAUDE.md 一致",
    passed: claudeMd === "" || uniqueWords.length === 0 || foundWords.length > 0,
    detail: claudeMd === ""
      ? "未找到 CLAUDE.md（跳过）"
      : uniqueWords.length
        ? `抽取触发词 ${uniqueWords.join("/")} · CLAUDE.md 命中 ${foundWords.length} 个`
        : "description 无明显触发词（建议补充）",
  });

  // 6. 相对路径引用可解析
  const badRefs = [];
  for (const m of skillMd.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const ref = m[1];
    if (/^(https?:|#|\$|~)/.test(ref) || ref.includes("$FRAMEWORK") || ref.includes("<")) continue;
    const target = path.resolve(skillDir, ref);
    if (!fs.existsSync(target)) badRefs.push(ref);
  }
  checks.push({
    id: 6,
    name: "相对路径引用可解析",
    passed: badRefs.length === 0,
    detail: badRefs.length ? `无法解析: ${badRefs.join(", ")}` : "所有相对引用均可解析",
  });

  const passed = checks.filter((c) => c.passed).length;
  return {
    skill: skillName,
    skillPath: skillDir,
    checks,
    rubric: {
      passed,
      total: checks.length,
      score: Math.round((passed / checks.length) * 1000) / 10,
    },
  };
}

/* ---------- 冒烟建议 ---------- */

function smokeSuggestion(skillName, skillDir, framework) {
  const map = {
    "jit-project-knowledge-fact-gate": (s) =>
      `node "${s}/scripts/verify-kb-facts.js" <目标项目> --query "冒烟"`,
    "jit-project-devpilot-status": (s) => `node "${s}/scripts/scan-status.js" <目标项目>`,
    "jit-project-knowledge-base": (s) => `node "${s}/scripts/preflight-kb.js" <目标项目>`,
  };
  if (map[skillName]) return map[skillName](skillDir);
  const scriptsDir = path.join(skillDir, "scripts");
  const scripts = fs.existsSync(scriptsDir)
    ? fs.readdirSync(scriptsDir).filter((f) => f.endsWith(".js"))
    : [];
  if (scripts.length)
    return `node "${path.join(scriptsDir, scripts[0])}" --help（验证脚本可执行、退出码 0）`;
  return `无 scripts/ 目录：检查 SKILL.md 本身是否满足"AI 只读指令"定位`;
}

/* ---------- HTML 渲染 ---------- */

function renderHtml(result, smoke) {
  const d = new Date();
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
  const rows = result.checks
    .map(
      (c) => `<tr>
        <td>${c.id}</td>
        <td>${escapeHtml(c.name)}</td>
        <td class="${c.passed ? "pass" : "fail"}">${c.passed ? "✅ PASS" : "❌ FAIL"}</td>
        <td class="detail">${escapeHtml(c.detail)}</td>
      </tr>`
    )
    .join("\n        ");

  const smokeHtml = smoke
    ? `<h2>LLM 冒烟结果</h2>
      <table class="smoke">
        <tr><td class="${smoke.passed ? "pass" : "fail"}">${smoke.passed ? "✅ 通过" : "❌ 失败"}</td></tr>
        <tr><td><b>执行命令：</b><code>${escapeHtml(smoke.command || "")}</code></td></tr>
        <tr><td><b>耗时：</b>${smoke.duration_ms != null ? smoke.duration_ms + " ms" : "—"}</td></tr>
        <tr><td><b>输出要点：</b><pre>${escapeHtml(smoke.output_head || "—")}</pre></td></tr>
      </table>`
    : `<p class="hint">未执行 LLM 冒烟。运行 <code>--full</code> 流程可补：<code>${escapeHtml(
        result.smokeSuggestion || ""
      )}</code></p>`;

  const advice = result.checks
    .filter((c) => !c.passed)
    .map((c) => `<li>${escapeHtml(c.name)}：${escapeHtml(c.detail)}</li>`)
    .join("\n        ");

  return `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Skill 评估报告 — ${escapeHtml(result.skill)}</title>
<style>
  body { font-family: "Segoe UI", "Microsoft YaHei", sans-serif; max-width: 960px; margin: 24px auto; padding: 0 16px; color: #24292f; }
  h1 { font-size: 22px; border-bottom: 2px solid #eaecef; padding-bottom: 8px; }
  h2 { font-size: 18px; margin-top: 28px; }
  table { border-collapse: collapse; width: 100%; margin-top: 12px; }
  th, td { border: 1px solid #d0d7de; padding: 8px 10px; text-align: left; font-size: 14px; }
  th { background: #f6f8fa; }
  td.detail { color: #57606a; font-size: 13px; }
  .pass { color: #1a7f37; font-weight: 600; }
  .fail { color: #cf222e; font-weight: 600; }
  .score { font-size: 40px; font-weight: 700; color: #0969da; }
  .score-sub { color: #57606a; font-size: 14px; }
  .hint { color: #57606a; font-size: 13px; }
  pre { background: #f6f8fa; padding: 10px; border-radius: 6px; font-size: 12px; overflow-x: auto; }
  code { background: #f6f8fa; padding: 1px 5px; border-radius: 4px; font-size: 13px; }
  ul { font-size: 14px; }
</style>
</head>
<body>
  <h1>Skill 评估报告</h1>
  <p>Skill：<code>${escapeHtml(result.skill)}</code> · 路径：<code>${escapeHtml(result.skillPath)}</code> · 评估日期：${date}</p>
  <p>Rubric 得分率：<span class="score">${result.rubric.score}%</span>
     <span class="score-sub">（${result.rubric.passed}/${result.rubric.total} 项通过，确定性静态检查，零 LLM 成本）</span></p>

  <h2>静态检查明细</h2>
  <table>
    <tr><th>#</th><th>检查项</th><th>状态</th><th>详情</th></tr>
        ${rows}
  </table>

  ${smokeHtml}

  <h2>修复建议</h2>
  ${
    advice
      ? `<ul>
        ${advice}
      </ul>`
      : `<p class="pass">全部检查通过，无需修复。</p>`
  }
</body>
</html>
`;
}

/* ---------- 主流程 ---------- */

function main() {
  const args = process.argv.slice(2);
  const modeArg = args.find((a) => a.startsWith("--"));
  const mode = modeArg ? modeArg.slice(2) : "collect";
  const skillArg = args.find((a) => !a.startsWith("--"));
  if (!skillArg) {
    console.error("用法: node eval-skill.js <skill名称或路径> --collect|--quick|--smoke '<json>'");
    process.exit(1);
  }

  const framework = resolveFramework();
  const skillDir = resolveSkillDir(skillArg, framework);
  if (!skillDir) {
    console.error(`找不到 skill: ${skillArg}`);
    console.error(framework ? `已尝试: ${path.join(framework, "skills", skillArg)}` : "未解析到框架路径");
    process.exit(1);
  }

  const result = runChecks(skillDir, framework);
  result.smokeSuggestion = smokeSuggestion(result.skill, skillDir, framework);

  if (mode === "collect") {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (mode === "quick") {
    const html = renderHtml(result, null);
    writeReport(result.skill, html);
    return;
  }

  if (mode === "smoke") {
    const smokeJson = args[args.indexOf("--smoke") + 1];
    let smoke = null;
    if (smokeJson) {
      try {
        smoke = JSON.parse(smokeJson);
      } catch (e) {
        console.error("--smoke 参数不是合法 JSON:", smokeJson);
        process.exit(1);
      }
    }
    const html = renderHtml(result, smoke);
    writeReport(result.skill, html);
    return;
  }

  console.error(`未知模式: --${mode}`);
  process.exit(1);
}

function writeReport(skillName, html) {
  const framework = resolveFramework();
  if (!framework) {
    console.error("无法解析框架路径，报告未写入");
    process.exit(1);
  }
  const outDir = path.join(framework, "docs", "skill-eval");
  fs.mkdirSync(outDir, { recursive: true });
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}`;
  const outFile = path.join(outDir, `${skillName}-${date}.html`);
  fs.writeFileSync(outFile, html, "utf8");
  console.log(`报告已写入: ${outFile}`);
}

main();
