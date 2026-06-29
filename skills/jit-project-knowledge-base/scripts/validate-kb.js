#!/usr/bin/env node
/**
 * DevPilot knowledge-base validator.
 *
 * Usage:
 *   node validate-kb.js <project-root>
 *
 * Checks the minimum structure required by DevPilot:
 * - docs/knowledge-base/PROJECT_KNOWLEDGE_BASE.md
 * - docs/knowledge-base/PROJECT_KNOWLEDGE_DETAIL.md
 * - DETAIL sections for requirement index, function/API change index, update records
 * - requirement docs with 00 files containing a knowledge-base anchor
 * - large projects should have a .codegraph directory
 */
const fs = require("fs");
const path = require("path");

const projectRoot = process.argv[2];
if (!projectRoot) {
  console.error("Usage: node validate-kb.js <project-root>");
  process.exit(2);
}

const docsDir = path.join(projectRoot, "docs");
const kbDir = path.join(docsDir, "knowledge-base");
const basePath = path.join(kbDir, "PROJECT_KNOWLEDGE_BASE.md");
const detailPath = path.join(kbDir, "PROJECT_KNOWLEDGE_DETAIL.md");
const codegraphDir = path.join(projectRoot, ".codegraph");

const errors = [];
const warnings = [];

function exists(filePath) {
  return fs.existsSync(filePath);
}

function readText(filePath) {
  return exists(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

function walk(dir, predicate, skip = new Set([".git", "node_modules", "vendor", "dist", "build", ".codegraph"])) {
  if (!exists(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(fullPath, predicate, skip));
    } else if (!predicate || predicate(fullPath)) {
      results.push(fullPath);
    }
  }
  return results;
}

function hasSection(content, title) {
  return new RegExp(`^##\\s+${title}\\s*$`, "m").test(content);
}

function listRequirementDirs() {
  if (!exists(docsDir)) return [];
  return fs.readdirSync(docsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "knowledge-base" && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort();
}

if (!exists(kbDir)) {
  errors.push("Missing docs/knowledge-base directory.");
}
if (!exists(basePath)) {
  errors.push("Missing docs/knowledge-base/PROJECT_KNOWLEDGE_BASE.md.");
}
if (!exists(detailPath)) {
  errors.push("Missing docs/knowledge-base/PROJECT_KNOWLEDGE_DETAIL.md.");
}

const detail = readText(detailPath);
if (detail) {
  for (const section of ["需求索引", "函数与接口变更索引", "更新记录"]) {
    if (!hasSection(detail, section)) {
      errors.push(`PROJECT_KNOWLEDGE_DETAIL.md missing section: ## ${section}`);
    }
  }
}

for (const reqId of listRequirementDirs()) {
  const originPath = path.join(docsDir, reqId, "00-原始需求.md");
  if (!exists(originPath)) {
    warnings.push(`Requirement ${reqId} missing 00-原始需求.md.`);
    continue;
  }
  const origin = readText(originPath);
  if (!/##\s+知识库锚点/.test(origin)) {
    warnings.push(`Requirement ${reqId} missing knowledge-base anchor in 00-原始需求.md.`);
  }
}

const sourceExtensions = new Set([
  ".c", ".cc", ".cpp", ".cs", ".go", ".h", ".hpp", ".java", ".js", ".jsx",
  ".kt", ".lua", ".py", ".rs", ".sh", ".ts", ".tsx", ".vue",
]);
const sourceFiles = walk(projectRoot, (filePath) => sourceExtensions.has(path.extname(filePath).toLowerCase()));
if (sourceFiles.length > 500 && !exists(codegraphDir)) {
  warnings.push(`Large project detected (${sourceFiles.length} source files) but .codegraph is missing. Run codegraph build before full KB generation.`);
}

console.log("# DevPilot Knowledge Base Validation\n");
console.log(`Project: ${projectRoot}`);
console.log(`Source files counted: ${sourceFiles.length}`);
console.log(`CodeGraph: ${exists(codegraphDir) ? "present" : "missing"}\n`);

if (errors.length) {
  console.log("## Errors\n");
  for (const error of errors) console.log(`- ${error}`);
  console.log("");
}

if (warnings.length) {
  console.log("## Warnings\n");
  for (const warning of warnings) console.log(`- ${warning}`);
  console.log("");
}

if (!errors.length && !warnings.length) {
  console.log("Validation passed.");
}

process.exit(errors.length ? 1 : 0);
