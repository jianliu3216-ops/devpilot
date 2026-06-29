#!/usr/bin/env node
/**
 * DevPilot 项目状态扫描器
 * 用法: node scan-status.js <目标项目路径>
 * 输出: Markdown 状态总览（所有需求）
 */
const fs = require("fs");
const path = require("path");

const projectRoot = process.argv[2];
if (!projectRoot) {
  console.error("用法: node scan-status.js <目标项目路径>");
  process.exit(1);
}

const docsDir = path.join(projectRoot, "docs");
const testsDir = path.join(projectRoot, "tests");

const STAGE_FILES = {
  "00": "00-原始需求.md",
  "01": "01-requirements-analysis.md",
  "02": "02-prd.md",
  "02a": "02a-interface-contract.md",
  "03": "03-software-design.md",
  "03a": "03a-change-strategy.md",
  "04": "04-test-cases.md",
  "04a": "04a-regression-checklist.md",
  "05": "05-test-report.md",
};

function exists(p) {
  return fs.existsSync(p);
}

function readHead(filePath, lines = 40) {
  if (!exists(filePath)) return "";
  return fs.readFileSync(filePath, "utf8").split("\n").slice(0, lines).join("\n");
}

function detectLevel(text) {
  if (!text) return null;
  const patterns = [
    /(?:建议级别|变更级别|级别)\s*\|\s*(S|M|L)/i,
    /(?:建议级别|变更级别|级别)[:：\s|]*\**\s*(S|M|L)\s*\**/i,
    /(?:建议级别|变更级别|级别)[:：\s|]*(S|M|L)\s*[级（(]/i,
    /\b(S|M|L)\s*级/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].toUpperCase();
  }
  return null;
}

function parseChangelogStatus(changelog) {
  if (!changelog) return { status: null, note: "" };
  if (/暂停|暂缓|hold/i.test(changelog) && !/恢复/.test(changelog)) {
    return { status: "paused", note: "CHANGELOG 含暂停标记" };
  }
  if (/变更中|🔄|进行中.*变更/i.test(changelog)) {
    return { status: "changing", note: "CHANGELOG 含未关闭变更" };
  }
  // 变更已完成：CHANGELOG 含「变更...已完成/✅✅/变更完成」且无未关闭变更
  if (/变更.*(?:已完成|✅✅|完成)/i.test(changelog) || /✅✅/.test(changelog)) {
    return { status: "changed", note: "CHANGELOG 含已关闭变更" };
  }
  return { status: null, note: "" };
}

function requiredForLevel(level) {
  switch (level) {
    case "S":
      return ["00", "01", "05"]; // 04 可跳过；测试代码 tests/ 可选
    case "M":
      return ["00", "01", "02", "03", "04", "05"];
    case "L":
      return ["00", "01", "02", "03", "03a", "04", "04a", "05"];
    default:
      return ["00", "01"];
  }
}

function listRequirementDirs() {
  if (!exists(docsDir)) return [];
  return fs.readdirSync(docsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "knowledge-base" && !d.name.startsWith("."))
    .map((d) => d.name)
    .sort();
}

function getKbIndexRows() {
  const detailPath = path.join(docsDir, "knowledge-base", "PROJECT_KNOWLEDGE_DETAIL.md");
  if (!exists(detailPath)) return [];
  const content = fs.readFileSync(detailPath, "utf8");
  const idx = content.indexOf("## 需求索引");
  if (idx < 0) return [];
  const after = content.slice(idx + "## 需求索引".length);
  const nextSection = after.search(/\n## /);
  const section = nextSection >= 0 ? after.slice(0, nextSection) : after;
  const rows = [];
  for (const line of section.split("\n")) {
    if (!line.startsWith("|") || line.includes("需求标识") || line.includes("---")) continue;
    const cols = line.split("|").map((c) => c.trim()).filter(Boolean);
    if (cols.length >= 2 && cols[0] !== "需求标识") {
      const lv = (cols[2] || "").replace(/级/g, "").trim().toUpperCase();
      rows.push({ id: cols[0], name: cols[1], level: /^[SML]$/.test(lv) ? lv : null });
    }
  }
  return rows;
}

function currentStage(reqDir, level, has05) {
  if (has05) return "已完成";
  if (level === "?") {
    if (exists(path.join(reqDir, STAGE_FILES["01"]))) return "进行中 → 下一步: 任务3 分级确认";
    if (exists(path.join(reqDir, STAGE_FILES["00"]))) return "进行中 → 下一步: 任务3 需求分析";
    return "待开始";
  }
  // S 级跳过 PRD/设计/测试用例文档：01 → 05
  const order = level === "L"
    ? ["04a", "04", "03a", "03", "02a", "02", "01", "00"]
    : level === "M"
      ? ["04", "03", "02a", "02", "01", "00"]
      : ["05", "01", "00"];
  for (const key of order) {
    const f = STAGE_FILES[key];
    if (f && exists(path.join(reqDir, f))) {
      const next = {
        "00": "任务3 需求分析",
        "01": level === "S" ? "任务6 编码（S 级跳过 PRD/设计/测试用例）" : "任务4 PRD",
        "02": "任务4.5 接口契约（如需）或任务5 设计",
        "02a": "任务5 设计",
        "03": "任务6 编码", "03a": "任务6 编码(分批)",
        "04": "任务7 测试用例", "04a": "任务7 回归清单",
      };
      return `进行中 → 下一步: ${next[key] || key}`;
    }
  }
  return "待开始";
}

function scanRequirement(reqId, kbLevelMap) {
  const reqDir = path.join(docsDir, reqId);
  const changelog = exists(path.join(reqDir, "CHANGELOG.md"))
    ? fs.readFileSync(path.join(reqDir, "CHANGELOG.md"), "utf8") : "";
  const analysisHead = readHead(path.join(reqDir, STAGE_FILES["01"]));
  const originHead = readHead(path.join(reqDir, STAGE_FILES["00"]));
  const originFull = exists(path.join(reqDir, STAGE_FILES["00"]))
    ? fs.readFileSync(path.join(reqDir, STAGE_FILES["00"]), "utf8") : "";
  const level = detectLevel(analysisHead) || detectLevel(originHead) || kbLevelMap[reqId] || "?";
  const chg = parseChangelogStatus(changelog);

  const required = requiredForLevel(level);
  const missing = required.filter((k) => !exists(path.join(reqDir, STAGE_FILES[k])));
  if (originFull && !/##\s+知识库锚点/.test(originFull)) {
    missing.push("kb-anchor");
  }

  const testDir = path.join(testsDir, reqId);
  const hasTests = exists(testDir);
  const has05 = exists(path.join(reqDir, STAGE_FILES["05"]));

  let status = "🔄 进行中";
  if (chg.status === "paused") status = "⏸️ 暂停";
  else if (chg.status === "changing") status = "🔁 变更中";
  else if (level === "?") status = "⚠️ 待确认级别";
  else if (missing.length === 0 && has05) status = chg.status === "changed" ? "✅✅ 变更完成" : "✅ 已完成";
  else if (!exists(path.join(reqDir, STAGE_FILES["00"])) && !exists(path.join(reqDir, STAGE_FILES["01"]))) status = "⏳ 待开始";

  const stage = currentStage(reqDir, level, has05);

  return {
    id: reqId,
    level,
    status,
    stage,
    missing: missing.map((k) => k === "kb-anchor" ? "00-知识库锚点" : STAGE_FILES[k]),
    tests: hasTests ? "✅ 有" : "—",
    chgNote: chg.note,
  };
}

// --- main ---
const reqDirs = listRequirementDirs();
const kbIndex = getKbIndexRows();
const kbLevelMap = Object.fromEntries(kbIndex.filter((r) => r.level).map((r) => [r.id, r.level]));
const kbIds = new Set(kbIndex.map((r) => r.id));
const allIds = [...new Set([...reqDirs, ...kbIndex.map((r) => r.id)])].sort();

const kbBase = path.join(docsDir, "knowledge-base", "PROJECT_KNOWLEDGE_BASE.md");
const kbDetail = path.join(docsDir, "knowledge-base", "PROJECT_KNOWLEDGE_DETAIL.md");
const codegraphDir = path.join(projectRoot, ".codegraph");

console.log("# 📊 DevPilot 项目状态总览\n");
console.log(`项目路径：\`${projectRoot}\``);
console.log(`扫描时间：${new Date().toISOString()}\n`);

console.log("## 知识库\n");
console.log(`| 文件 | 状态 |`);
console.log(`|------|------|`);
console.log(`| PROJECT_KNOWLEDGE_BASE.md | ${exists(kbBase) ? "✅" : "❌ 缺失"} |`);
console.log(`| PROJECT_KNOWLEDGE_DETAIL.md | ${exists(kbDetail) ? "✅" : "❌ 缺失"} |`);
console.log(`| 需求索引表 | ${kbIndex.length ? `✅ ${kbIndex.length} 条` : "⚠️ DETAIL 无索引表"} |`);
console.log(`| CodeGraph | ${exists(codegraphDir) ? "✅ .codegraph 已存在" : "⚠️ 未发现 .codegraph（大项目建议先运行 codegraph build）"} |\n`);

console.log("## 需求列表（全部）\n");
console.log(`共 ${allIds.length} 个需求标识\n`);

if (allIds.length === 0) {
  console.log("_未发现 docs/ 下需求目录。输入 `需求分析：...` 开始新需求。_\n");
} else {
  console.log("| 标识 | 级别 | 状态 | 当前阶段 | 缺失文档 | 测试代码 |");
  console.log("|------|:--:|:--:|---------|---------|--------|");
  for (const id of allIds) {
    const r = scanRequirement(id, kbLevelMap);
    const inDocs = reqDirs.includes(id);
    const inKbOnly = !inDocs && kbIds.has(id);
    const miss = r.missing.length ? r.missing.join(", ") : (inKbOnly ? "⚠️ 仅有KB索引无docs目录" : "—");
    console.log(`| ${id} | ${r.level} | ${r.status} | ${r.stage} | ${miss} | ${r.tests} |`);
  }
  console.log("");
}

// 仅 KB 有、docs 无
const orphanKb = kbIndex.filter((r) => !reqDirs.includes(r.id));
if (orphanKb.length) {
  console.log("## ⚠️ 知识库索引有但 docs 目录缺失\n");
  for (const r of orphanKb) {
    console.log(`- \`${r.id}\`（${r.name}）`);
  }
  console.log("");
}

// docs 有、KB 无
const orphanDocs = reqDirs.filter((id) => !kbIds.has(id));
if (orphanDocs.length && kbIndex.length) {
  console.log("## ⚠️ docs 存在但知识库索引未登记\n");
  for (const id of orphanDocs) {
    console.log(`- \`${id}\` — 建议任务8.5 更新 DETAIL 需求索引`);
  }
  console.log("");
}

console.log("## 下一步建议\n");
const inProgress = allIds.map((id) => scanRequirement(id, kbLevelMap)).filter((r) => r.status.includes("进行中") || r.status.includes("变更"));
if (inProgress.length) {
  for (const r of inProgress) {
    console.log(`- **${r.id}** [${r.level}级]：${r.stage}`);
  }
} else if (allIds.length) {
  console.log("- 所有需求文档阶段已完成，或输入 `/jit-project-autopilot-status` 刷新");
} else {
  console.log("- `生成知识库，目标项目：<路径>` 或 `需求分析：...`");
}
console.log("\n---\n触发：`/jit-project-autopilot-status` 或 `查看状态，目标项目：<路径>`\n");
