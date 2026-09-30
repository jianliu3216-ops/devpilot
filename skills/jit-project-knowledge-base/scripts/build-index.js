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

function detectLevel(text) {
  if (/\bL级\b|级别[：:]\s*L/i.test(text)) return "L";
  if (/\bM级\b|级别[：:]\s*M/i.test(text)) return "M";
  if (/\bS级\b|级别[：:]\s*S/i.test(text)) return "S";
  return "unknown";
}

function extractQuotedTokens(line) {
  return [...line.matchAll(/`([^`]+)`/g)].map((m) => m[1]).filter(Boolean);
}

// Modules: BASE module table rows give paths/symbols; DETAIL headings give sections.
function extractModules() {
  const modules = [];
  const seen = new Set();
  const baseModuleRows = base.split(/\r?\n/).filter((line) => /^\|\s*[^|\s]/.test(line) && /\|/.test(line));
  for (const detail of details) {
    const headingRe = /^##\s+(.+?)\s*$/gm;
    let match;
    while ((match = headingRe.exec(detail.text)) !== null) {
      const title = match[1].trim();
      if (title === "需求索引" || title === "函数与接口变更索引" || title === "更新记录") continue;
      const id = title.toLowerCase().replace(/\s+/g, "-");
      if (seen.has(id)) continue;
      seen.add(id);
      const row = baseModuleRows.find((line) => line.includes(title));
      const tokens = row ? extractQuotedTokens(row) : [];
      const paths = tokens.filter((t) => /[\\/]|\.md$|\.js$|\.ts$|\.py$|\.sh$/.test(t) && !/^#/.test(t));
      const symbols = tokens.filter((t) => !paths.includes(t));
      modules.push({
        id,
        title,
        paths: paths.length ? paths : [],
        symbols: symbols.length ? symbols : [],
        detail_section: `${detail.file}#${title}`,
        requirements: [],
      });
    }
  }
  return modules;
}

function extractRequirements() {
  return listRequirementDirs().map((id) => {
    const reqDir = path.join(projectRoot, "docs", id);
    const analysis = readText(path.join(reqDir, "01-requirements-analysis.md"));
    const original = readText(path.join(reqDir, "00-原始需求.md"));
    const levelSource = analysis || original;
    const levelMatch = levelSource.match(/级别[：:]\s*(S|M|L)\b/i);
    const level = levelMatch ? levelMatch[1].toUpperCase() : detectLevel(levelSource);
    return {
      id,
      title: firstHeading(original || analysis),
      level,
      modules: [],
      docs: `docs/${id}/`,
    };
  });
}

function linkRequirementsToModules(requirements, modules) {
  for (const requirement of requirements) {
    const changelog = readText(path.join(projectRoot, requirement.docs, "CHANGELOG.md"));
    const anchors = extractQuotedTokens(changelog);
    for (const module of modules) {
      const hit =
        anchors.some((token) => module.title.includes(token) || token.includes(module.title)) ||
        anchors.some((token) => module.paths.some((p) => p.includes(token)));
      if (hit) {
        requirement.modules.push(module.id);
        module.requirements.push(requirement.id);
      }
    }
  }
}

function extractKbVersion() {
  const match = base.match(/v\d+\.\d+(\.\d+)?/);
  return match ? match[0].replace(/^v/, "") : "unknown";
}

const modules = extractModules();
const requirements = extractRequirements();
linkRequirementsToModules(requirements, modules);
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
    `- **${m.title}** → ${m.detail_section}${m.paths.length ? `｜路径：${m.paths.join(", ")}` : "｜路径：unknown"}`,
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