#!/usr/bin/env node
/**
 * DevPilot knowledge-base index builder (2.6.0 kb-skeleton-index).
 *
 * Usage:
 *   node build-index.js <project-root>
 *
 * Extracts a machine index from docs/knowledge-base/ (BASE + DETAIL, including
 * PROJECT_KNOWLEDGE_DETAIL-*.md volumes) and docs/{requirement}/ directories,
 * then writes:
 *   docs/knowledge-base/PROJECT_KNOWLEDGE_INDEX.md
 *   docs/knowledge-base/PROJECT_KNOWLEDGE_INDEX.json
 *
 * Contract (docs/DEVPILOT_VERSION_PLAN.md §2.5):
 * - Fields that cannot be extracted are written as "unknown" — never invented.
 * - Only BASE/DETAIL text and docs directory names are scanned; source code is
 *   never read (fast even on large projects).
 * - Without BASE/DETAIL the script fails with exit 1 and tells the user to run
 *   task 2 (knowledge base generation) first.
 */
const fs = require("fs");
const path = require("path");

const projectRoot = process.argv.slice(2).find((a) => !a.startsWith("-"));
if (!projectRoot) {
  console.error("Usage: node build-index.js <project-root>");
  process.exit(2);
}

const kbDir = path.join(projectRoot, "docs", "knowledge-base");
const basePath = path.join(kbDir, "PROJECT_KNOWLEDGE_BASE.md");
const detailPath = path.join(kbDir, "PROJECT_KNOWLEDGE_DETAIL.md");

if (!fs.existsSync(basePath) || !fs.existsSync(detailPath)) {
  console.error("PROJECT_KNOWLEDGE_BASE.md / PROJECT_KNOWLEDGE_DETAIL.md not found under docs/knowledge-base/.");
  console.error("Run task 2 (knowledge base generation) first, then re-run build-index.js.");
  process.exit(1);
}

const base = fs.readFileSync(basePath, "utf8");
const details = [];
for (const name of fs.readdirSync(kbDir)) {
  if (/^PROJECT_KNOWLEDGE_DETAIL.*\.md$/.test(name)) {
    details.push({
      file: name,
      text: fs.readFileSync(path.join(kbDir, name), "utf8"),
    });
  }
}

function readText(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

function listRequirementDirs() {
  const docsDir = path.join(projectRoot, "docs");
  if (!fs.existsSync(docsDir)) return [];
  return fs.readdirSync(docsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "knowledge-base" && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort();
}

function firstHeading(text) {
  const match = text.match(/^#\s+(.+?)\s*$/m);
  return match ? match[1].trim() : "unknown";
}

// Same patterns as scan-status.js detectLevel, so both scripts agree on a requirement's level.
function detectLevel(text) {
  if (!text) return null;
  const patterns = [
    /(?:建议级别|变更级别|级别)\s*\|\s*\**\s*(S|M|L)/i,
    /(?:建议级别|变更级别|级别)[:：\s|]*\**\s*(S|M|L)\s*\**/i,
    /\b(S|M|L)\s*级/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].toUpperCase();
  }
  return null;
}

function stripMarkup(cell) {
  return cell.replace(/\*\*/g, "").replace(/`/g, "").trim();
}

function splitRow(line) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
}

// Returns { headers, rows } of the first Markdown table after the heading matched by headingRe.
function tableUnderHeading(text, headingRe) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => headingRe.test(l));
  if (start < 0) return null;
  let i = start + 1;
  while (i < lines.length && !lines[i].trim().startsWith("|")) {
    if (/^#{1,2}\s/.test(lines[i])) return null;
    i++;
  }
  if (i >= lines.length) return null;
  const headers = splitRow(lines[i]).map(stripMarkup);
  const rows = [];
  for (i += 2; i < lines.length && lines[i].trim().startsWith("|"); i++) {
    rows.push(splitRow(lines[i]));
  }
  return { headers, rows };
}

// All Markdown tables inside the `##` section matched by headingRe (including its ### subsections),
// skipping fenced code blocks.
function tablesInSection(text, headingRe) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => headingRe.test(l));
  if (start < 0) return [];
  const tables = [];
  let inFence = false;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*```/.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;
    if (/^##\s/.test(line)) break;
    const isTableStart = line.trim().startsWith("|") && /^\s*\|\s*:?-{2,}/.test(lines[i + 1] || "");
    if (!isTableStart) continue;
    const headers = splitRow(line).map(stripMarkup);
    const rows = [];
    let j = i + 2;
    for (; j < lines.length && lines[j].trim().startsWith("|"); j++) rows.push(splitRow(lines[j]));
    tables.push({ headers, rows });
    i = j - 1;
  }
  return tables;
}

function columnIndex(headers, candidates) {
  return headers.findIndex((h) => candidates.some((c) => h.includes(c)));
}

function splitList(cell) {
  return stripMarkup(cell).split(/[,，、;；+]/).map((s) => s.trim()).filter((s) => s && s !== "-");
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Prefer a heading that starts with the module name; otherwise accept the name as a whole token
// (e.g.「3.1 基础设施层（com.jit.platform.basics）」). A name glued to path characters, as in
//「4.4 告警通知脚本 (aiops-system/aiops-system-service/...)」, is only a mention and never matches.
function findDetailSection(name) {
  const escaped = escapeRegExp(name);
  const startsWith = new RegExp(`^(?:\\d+(?:\\.\\d+)*[.、]?\\s*)?${escaped}(?![\\w\\-/.])`, "i");
  const wholeToken = new RegExp(`(?<![\\w\\-/.])${escaped}(?![\\w\\-/.])`, "i");
  const headings = [];
  for (const detail of details) {
    const headingRe = /^#{2,4}\s+(.+?)\s*$/gm;
    let m;
    while ((m = headingRe.exec(detail.text)) !== null) {
      headings.push({ file: detail.file, text: stripMarkup(m[1]) });
    }
  }
  const hit = headings.find((h) => startsWith.test(h.text)) || headings.find((h) => wholeToken.test(h.text));
  return hit ? `${hit.file}#${hit.text}` : "unknown";
}

// 「csp-web (285 files)」→「csp-web」
function cleanModuleName(cell) {
  return stripMarkup(cell).replace(/\s*[（(][^）)]*[）)]\s*$/, "").trim();
}

// Modules come from the tables in the BASE module dictionary section (heading contains 模块,
// numbered or not, tables may be split across ### subsections). DETAIL chapter headings such as
//「API 接口清单」are not modules and are never emitted as such.
function extractModules() {
  const tables = tablesInSection(base, /^##\s+.*模块/)
    .filter((t) => columnIndex(t.headers, ["模块", "组件", "服务", "名称"]) >= 0);
  const modules = [];
  const seen = new Set();
  for (const table of tables) {
    const nameCol = Math.max(0, columnIndex(table.headers, ["模块名", "模块", "组件", "服务", "名称"]));
    const titleCol = columnIndex(table.headers, ["业务含义", "业务描述", "说明", "职责", "定位"]);
    const pathCol = columnIndex(table.headers, ["关键源文件", "关键文件", "路径", "源文件", "文件"]);
    for (const row of table.rows) {
      const name = cleanModuleName(row[nameCol] || "");
      if (!name) continue;
      const id = name.toLowerCase().replace(/\s+/g, "-");
      if (seen.has(id)) continue;
      seen.add(id);
      const paths = pathCol >= 0 && pathCol !== nameCol ? splitList(row[pathCol] || "") : [];
      if (!paths.length && /[\\/]|\.(lua|js|jsx|ts|tsx|java|kt|py|go|rs|c|cc|cpp|h|hpp|sh|vue)$/i.test(name)) paths.push(name);
      const symbols = row
        .filter((_, idx) => idx !== pathCol && idx !== nameCol)
        .flatMap((cell) => [...cell.matchAll(/`([^`]+)`/g)].map((m) => m[1]));
      modules.push({
        id,
        title: titleCol >= 0 && row[titleCol] ? stripMarkup(row[titleCol]) : name,
        paths,
        symbols,
        detail_section: findDetailSection(name),
        requirements: [],
      });
    }
  }
  return modules;
}

function detailRequirementRows() {
  for (const detail of details) {
    const table = tableUnderHeading(detail.text, /^##\s+(?:\d+[.、]\s*)?需求索引/);
    if (!table) continue;
    const idCol = Math.max(0, columnIndex(table.headers, ["需求标识", "标识"]));
    const nameCol = columnIndex(table.headers, ["中文名", "名称"]);
    const levelCol = columnIndex(table.headers, ["级别"]);
    const moduleCol = columnIndex(table.headers, ["涉及模块", "模块"]);
    return table.rows
      .map((row) => ({
        id: stripMarkup(row[idCol] || ""),
        title: nameCol >= 0 ? stripMarkup(row[nameCol] || "") : "",
        level: levelCol >= 0 ? ((row[levelCol] || "").match(/\b([SML])\b/) || [])[1] || null : null,
        modules: moduleCol >= 0 ? splitList(row[moduleCol] || "") : [],
      }))
      .filter((r) => r.id);
  }
  return [];
}

// A docs/ subdirectory counts as a requirement only if it has DevPilot stage files;
// plain document folders (api/, docker/, spec/ ...) are skipped.
function isRequirementDir(id) {
  const reqDir = path.join(projectRoot, "docs", id);
  return ["00-原始需求.md", "01-requirements-analysis.md"].some((f) => fs.existsSync(path.join(reqDir, f)));
}

function extractRequirements(modules) {
  const indexRows = detailRequirementRows();
  const byId = new Map(indexRows.map((r) => [r.id, r]));
  const ids = [...new Set([...indexRows.map((r) => r.id), ...listRequirementDirs().filter(isRequirementDir)])].sort();
  return ids.map((id) => {
    const row = byId.get(id);
    const reqDir = path.join(projectRoot, "docs", id);
    const analysis = readText(path.join(reqDir, "01-requirements-analysis.md")).slice(0, 4000);
    const original = readText(path.join(reqDir, "00-原始需求.md")).slice(0, 4000);
    const level = (row && row.level) || detectLevel(analysis) || detectLevel(original) || "unknown";
    const title = (row && row.title) || firstHeading(original || analysis);
    const moduleNames = row ? row.modules : [];
    const linked = moduleNames.some((n) => /全模块|全部模块/.test(n))
      ? modules.map((m) => m.id)
      : modules.filter((m) => moduleNames.some((n) => n.toLowerCase().includes(m.id) || m.id.includes(n.toLowerCase()))).map((m) => m.id);
    return {
      id,
      title: title || "unknown",
      level,
      modules: linked,
      docs: fs.existsSync(reqDir) ? `docs/${id}/` : "unknown",
    };
  });
}

function linkModulesToRequirements(requirements, modules) {
  for (const requirement of requirements) {
    for (const moduleId of requirement.modules) {
      const module = modules.find((m) => m.id === moduleId);
      if (module && !module.requirements.includes(requirement.id)) module.requirements.push(requirement.id);
    }
  }
}

function extractKbVersion() {
  const labeled = base.match(/知识库版本[^\n]*?v?(\d+\.\d+(?:\.\d+)?)/);
  if (labeled) return labeled[1];
  const match = base.match(/v(\d+\.\d+(?:\.\d+)?)/);
  return match ? match[1] : "unknown";
}

const modules = extractModules();
const requirements = extractRequirements(modules);
linkModulesToRequirements(requirements, modules);
const kbVersion = extractKbVersion();

const indexJson = { kb_version: kbVersion, modules, requirements };
const indexPath = path.join(kbDir, "PROJECT_KNOWLEDGE_INDEX.json");
fs.writeFileSync(indexPath, JSON.stringify(indexJson, null, 2) + "\n", "utf8");

const unknownModules = modules.filter((m) => m.paths.length === 0).length;
const unknownRequirements = requirements.filter((r) => r.level === "unknown").length;
const markdown = [
  "# PROJECT_KNOWLEDGE_INDEX（机器索引骨架）",
  "",
  "> 由 `build-index.js` 生成，请勿手工编辑；抽不出的字段为 `unknown`（禁止编造）。",
  "> 检索顺序：先 INDEX 命中 → `verify-kb-facts.js --query` 门控 pass → 按需下钻 DETAIL 对应节。",
  "",
  `| 字段 | 值 |`,
  `| --- | --- |`,
  `| kb_version | ${kbVersion} |`,
  `| modules | ${modules.length}（paths 抽不出 ${unknownModules} 个） |`,
  `| requirements | ${requirements.length}（level 抽不出 ${unknownRequirements} 个） |`,
  "",
  "## 模块",
  "",
  ...modules.map((m) =>
    `- **${m.id}**（${m.title}）→ ${m.detail_section}${m.paths.length ? `｜路径：${m.paths.join(", ")}` : "｜路径：unknown"}`,
  ),
  "",
  "## 需求",
  "",
  ...requirements.map((r) =>
    `- **${r.id}**（${r.level}）${r.title} → ${r.docs}${r.modules.length ? `｜模块：${r.modules.join(", ")}` : ""}`,
  ),
  "",
].join("\n");
fs.writeFileSync(path.join(kbDir, "PROJECT_KNOWLEDGE_INDEX.md"), markdown, "utf8");

console.log("# DevPilot Knowledge Base Index Build\n");
console.log(`Project: ${projectRoot}`);
console.log(`kb_version: ${kbVersion}`);
console.log(`Modules extracted: ${modules.length} (unknown paths: ${unknownModules})`);
console.log(`Requirements extracted: ${requirements.length} (unknown level: ${unknownRequirements})`);
console.log(`Written: ${indexPath}`);
console.log(`Written: ${path.join(kbDir, "PROJECT_KNOWLEDGE_INDEX.md")}`);
if (!modules.length) {
  console.log("\nWARNING: no module table found in BASE (expected a `## ... 模块 ...` heading followed by a table).");
  console.log("INDEX.modules is empty; add the module dictionary table to BASE, then re-run build-index.js.");
}