#!/usr/bin/env node
/**
 * DevPilot 阶段间上下文压缩器
 * 用法:
 *   node compress-handoff.js <目标项目路径> <需求标识> <目标阶段>
 *
 * 目标阶段 ∈ {prd, design, build, test, report, kb}
 * 输出: <目标项目>/docs/<需求标识>/.handoff/<目标阶段>.context.md
 * 作用: 用「章节骨架 + 要点 + 路径 + SHA256」压缩包代替全量前序文档，省 token。
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/* ---------- 阶段 → 前序文档前缀映射 ---------- */
const STAGE_PREFIX = {
  prd: 2, // 00, 01
  design: 3, // 00, 01, 02, 02a
  build: 4, // 00, 01, 02, 02a, 03, 03a
  test: 5, // 00..04, 04a
  report: 6, // 00..05
  kb: 6, // 00..05
};

const PREFIX_LABEL = {
  "00": "原始需求",
  "01": "需求分析",
  "02": "PRD",
  "02a": "接口契约",
  "03": "软件设计",
  "03a": "变更策略",
  "04": "测试用例",
  "04a": "回归清单",
  "05": "测试报告",
};

function filePrefix(name) {
  const m = name.match(/^(\d{2}[a-z]?)-/);
  return m ? m[1] : null;
}

function sha256(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function extractSections(md) {
  const lines = md.split(/\r?\n/);
  const sections = [];
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^##\s+(.+?)\s*$/);
    if (m) {
      if (current) sections.push(current);
      current = { title: m[1].trim(), points: [], startLine: i + 1 };
      continue;
    }
    if (current) {
      const t = lines[i].trim().replace(/^[#>*\-\s]+/, "");
      if (t && current.points.length < 2) current.points.push(t.slice(0, 80));
    }
  }
  if (current) sections.push(current);
  return sections;
}

/* ---------- 主流程 ---------- */

function main() {
  const [projectRoot, reqId, stage] = process.argv.slice(2);
  if (!projectRoot || !reqId || !stage) {
    console.error("用法: node compress-handoff.js <目标项目路径> <需求标识> <目标阶段>");
    console.error("目标阶段: prd | design | build | test | report | kb");
    process.exit(1);
  }
  if (!STAGE_PREFIX[stage]) {
    console.error(`未知目标阶段: ${stage}`);
    process.exit(1);
  }

  const reqDir = path.join(projectRoot, "docs", reqId);
  if (!fs.existsSync(reqDir)) {
    console.error(`需求目录不存在: ${reqDir}`);
    process.exit(1);
  }

  const maxPrefix = STAGE_PREFIX[stage];
  const files = fs
    .readdirSync(reqDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => ({ name: f, full: path.join(reqDir, f) }))
    .filter((f) => {
      const p = filePrefix(f.name);
      if (!p) return false;
      const base = parseInt(p.slice(0, 2), 10);
      // 附加文档（02a/03a/04a）按基础序号一并纳入
      return base < maxPrefix;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  if (files.length === 0) {
    console.error(`目标阶段 ${stage} 之前无已完成文档，无法生成压缩包`);
    process.exit(1);
  }

  // 生成每份文档的压缩条目
  const entries = [];
  const fingerprintParts = [];
  for (const f of files) {
    const content = fs.readFileSync(f.full, "utf8");
    const hash = sha256(content);
    fingerprintParts.push(`${f.name}:${hash}`);
    const lines = content.split(/\r?\n/).length;
    const sections = extractSections(content);
    entries.push({
      name: f.name,
      hash,
      lines,
      sections,
    });
  }
  const fingerprint = sha256(fingerprintParts.join("|"));

  // 哈希检测：旧压缩包可复用则提示
  const handoffDir = path.join(reqDir, ".handoff");
  const outFile = path.join(handoffDir, `${stage}.context.md`);
  if (fs.existsSync(outFile)) {
    const old = fs.readFileSync(outFile, "utf8");
    const oldFp = old.match(/fingerprint:\s*([a-f0-9]{64})/);
    if (oldFp && oldFp[1] === fingerprint) {
      console.log(`✅ 前序文档未变化，复用旧压缩包: ${outFile}`);
      return;
    }
  }

  // 渲染压缩包
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(
    2,
    "0"
  )}`;

  const md = [];
  md.push(`# 阶段 handoff 上下文包（${reqId} → ${stage}）`);
  md.push(`> 生成时间：${timestamp} · fingerprint: ${fingerprint}`);
  md.push(`> 使用规则：只读本压缩包恢复上下文，需要细节时按「按需下钻建议」读原文档，不全文复读前序文档。`);
  md.push("");
  md.push("## 前序文档清单");
  for (const e of entries) {
    const prefix = filePrefix(e.name);
    const label = PREFIX_LABEL[prefix] || prefix;
    md.push(`- **${label}** — \`${e.name}\` (sha256: ${e.hash.slice(0, 8)}…) · ${e.lines} 行`);
    if (e.sections.length) {
      const titles = e.sections.map((s) => s.title).join(" / ");
      md.push(`  - 章节: ${titles}`);
      for (const s of e.sections.slice(0, 3)) {
        if (s.points.length) md.push(`  - 「${s.title}」要点: ${s.points.join("；")}`);
      }
    } else {
      md.push(`  - 无 ## 章节（纯文本文档，需按需读原文）`);
    }
  }
  md.push("");
  md.push("## 按需下钻建议");
  for (const e of entries) {
    for (const s of e.sections) {
      md.push(`- 需要「${s.title}」细节 → 读 \`${e.name}\` 第 ${s.startLine} 行附近`);
    }
  }
  md.push("");
  md.push("## 变更记录");
  md.push(`| 版本 | 时间 | 说明 |`);
  md.push(`|------|------|------|`);
  md.push(`| ${timestamp} | 生成 | 基于前序文档哈希 ${fingerprint.slice(0, 12)}… 生成 |`);

  fs.mkdirSync(handoffDir, { recursive: true });
  fs.writeFileSync(outFile, md.join("\n"), "utf8");
  console.log(`✅ 已生成压缩上下文包: ${outFile}`);
  console.log(`   覆盖前序文档 ${entries.length} 份（${fingerprint.slice(0, 12)}…）`);
}

main();
