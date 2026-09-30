#!/usr/bin/env node
/**
 * devpilot-guard.js — DevPilot 阶段状态守卫（2.5.0 phase-state-guard）
 *
 * 设计依据：docs/phase-state-guard/03-software-design.md（§4 schema / §5 事件 / §6 规则表 / §7 CLI）
 * 职责：state.yaml 唯一写者；按级别校验证据文件存在性；append-only 审计；恢复输出。
 * 已知限制：单会话追加写（无文件锁）；最小 YAML 解析仅支持本 schema 结构，非法结构报错退出。
 *
 * CLI:
 *   node devpilot-guard.js <项目根> <需求标识> check <target>
 *   node devpilot-guard.js <项目根> <需求标识> --apply <target>
 *   node devpilot-guard.js <项目根> <需求标识> --init [S|M|L]
 *   node devpilot-guard.js <项目根> <需求标识> resume
 *
 * 退出码：0 成功/PASS；1 FAIL/HARD STOP/错误。
 */

"use strict";

const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// 阶段与证据路径常量（§6：与 DEVPILOT.md 产出路径同名，禁止在脚本里加特例字符串）
// ---------------------------------------------------------------------------

const PHASE_ORDER = [
  "identified",
  "original_req",
  "analysis",
  "prd",
  "design",
  "impl",
  "test_cases",
  "report",
  "kb_update",
  "done",
];

// 每个阶段的产物（进入该阶段前必须已存在的证据文件，相对项目根）
const ARTIFACT = {
  "00": "docs/{id}/00-原始需求.md",
  "01": "docs/{id}/01-requirements-analysis.md",
  "02": "docs/{id}/02-prd.md",
  "03": "docs/{id}/03-software-design.md",
  "03a": "docs/{id}/03a-change-strategy.md",
  "04": "docs/{id}/04-test-cases.md",
  "04a": "docs/{id}/04a-regression-checklist.md",
  "05": "docs/{id}/05-test-report.md",
};

// 守卫规则表（§6 REQUIRED[target][level]）
const REQUIRED = {
  analysis: { S: ["00"], M: ["00"], L: ["00"] },
  prd: { S: null, M: ["01"], L: ["01"] }, // null = S 级 skipped
  design: { S: null, M: ["02"], L: ["02"] },
  impl: { S: ["01", "levelConfirmed"], M: ["02", "03"], L: ["02", "03", "03a"] },
  test_cases: { S: null, M: ["implDone"], L: ["implDone"] },
  report: { S: ["implDone"], M: ["04"], L: ["04", "04a"] },
  kb_update: { S: ["05"], M: ["05"], L: ["05"] },
  done: { S: ["05", "kbDone"], M: ["05", "kbDone"], L: ["05", "kbDone"] },
};

// 阶段 -> 其产物的 evidence key（--apply 时回写）
const PHASE_EVIDENCE = {
  analysis: "01",
  prd: "02",
  design: "03",
  test_cases: "04",
  report: "05",
};

// ---------------------------------------------------------------------------
// 最小 YAML 解析（§4：平铺 key + evidence 一层映射 + skipped 一层列表）
// ---------------------------------------------------------------------------

function parseStateYaml(text) {
  const state = { evidence: {}, skipped: [] };
  let currentSection = null;
  for (const rawLine of text.split(/\r?\n/)) {
    if (!rawLine.trim() || rawLine.trim().startsWith("#")) continue;
    const indent = rawLine.match(/^\s*/)[0].length;
    const line = rawLine.trim();
    if (indent === 0) {
      currentSection = null;
      const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
      if (!m) throw new Error(`非法 state 结构（顶层行无法解析）: ${rawLine}`);
      const key = m[1];
      let value = m[2];
      if (key === "evidence") {
        currentSection = "evidence";
        continue;
      }
      if (key === "skipped") {
        const list = value.match(/^\[(.*)\]$/);
        if (list) {
          state.skipped = list[1] ? list[1].split(",").map((s) => s.trim()).filter(Boolean) : [];
        } else if (value === "[]" || value === "") {
          state.skipped = [];
        } else {
          throw new Error(`非法 state 结构（skipped 仅支持一行列表）: ${rawLine}`);
        }
        continue;
      }
      if (value === "null" || value === "~" || value === "") value = null;
      else if (/^-?\d+(\.\d+)?$/.test(value)) value = Number(value);
      else value = value.replace(/^["']|["']$/g, "");
      state[key] = value;
    } else {
      if (currentSection !== "evidence") {
        throw new Error(`非法 state 结构（未知缩进块）: ${rawLine}`);
      }
      const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
      if (!m) throw new Error(`非法 state 结构（evidence 行无法解析）: ${rawLine}`);
      let value = m[2];
      if (value === "null" || value === "~" || value === "") value = null;
      else value = value.replace(/^["']|["']$/g, "");
      state.evidence[m[1]] = value;
    }
  }
  return state;
}

function stateToYaml(state) {
  const lines = [];
  lines.push(`id: ${state.id}`);
  lines.push(`level: ${state.level === null ? "null" : state.level}`);
  lines.push(`phase: ${state.phase}`);
  lines.push(`status: ${state.status}`);
  lines.push(`skipped: [${state.skipped.join(", ")}]`);
  lines.push("evidence:");
  for (const key of [
    "original_requirements", "analysis", "prd", "design",
    "change_strategy", "test_cases", "test_report", "no_test_note",
  ]) {
    const v = state.evidence[key];
    lines.push(`  ${key}: ${v === null || v === undefined ? "null" : v}`);
  }
  lines.push(`updated_at: ${state.updated_at}`);
  return lines.join("\n") + "\n";
}

// ---------------------------------------------------------------------------
// IO
// ---------------------------------------------------------------------------

function statePath(projectRoot, reqId) {
  return path.join(projectRoot, "docs", reqId, "state.yaml");
}
function eventsPath(projectRoot, reqId) {
  return path.join(projectRoot, "docs", reqId, ".devpilot", "state-events.jsonl");
}

function loadState(projectRoot, reqId) {
  const p = statePath(projectRoot, reqId);
  if (!fs.existsSync(p)) return null;
  try {
    return parseStateYaml(fs.readFileSync(p, "utf8"));
  } catch (e) {
    fail(`state.yaml 非法结构，禁止继续（防手改破坏）：${e.message}`);
  }
}

function saveState(projectRoot, reqId, state) {
  state.updated_at = nowIso();
  fs.writeFileSync(statePath(projectRoot, reqId), stateToYaml(state), "utf8");
}

function appendEvent(projectRoot, reqId, event) {
  const p = eventsPath(projectRoot, reqId);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.appendFileSync(p, JSON.stringify(event) + "\n", "utf8");
}

function readEvents(projectRoot, reqId) {
  const p = eventsPath(projectRoot, reqId);
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, "utf8").split(/\r?\n/).filter(Boolean).map((l) => {
    try { return JSON.parse(l); } catch { return { raw: l }; }
  });
}

function nowIso() {
  return new Date().toISOString().replace("Z", "+00:00");
}

function fail(msg) {
  console.error(`[HARD STOP] ${msg}`);
  process.exit(1);
}

function artifactPath(projectRoot, reqId, code) {
  return path.join(projectRoot, ARTIFACT[code].replace("{id}", reqId));
}

// ---------------------------------------------------------------------------
// 条件判定
// ---------------------------------------------------------------------------

function levelConfirmed(state) {
  return state.level === "S" || state.level === "M" || state.level === "L";
}

function implDone(projectRoot, state, reqId) {
  if (state.evidence.no_test_note) return true;
  const testsDir = path.join(projectRoot, "tests", reqId);
  return fs.existsSync(testsDir);
}

function kbDone(projectRoot, state, reqId) {
  // §6：kbDone = 8.5 完成标记（审计日志中有成功进入 kb_update 的记录）或 state 记录跳过理由
  if (state.evidence.no_test_note && state.skipped.includes("kb_update")) return true;
  const events = readEvents(projectRoot, reqId);
  return events.some((e) => e.to === "kb_update" && e.via === "--apply");
}

function evaluateCondition(projectRoot, state, reqId, cond) {
  if (cond === "levelConfirmed") {
    return levelConfirmed(state) ? null : "级别未确认（state.level 为 null）";
  }
  if (cond === "implDone") {
    return implDone(projectRoot, state, reqId)
      ? null
      : `实现完成证据（tests/${reqId}/ 存在或 state.no_test_note 已记录无测理由）`;
  }
  if (cond === "kbDone") {
    return kbDone(projectRoot, state, reqId)
      ? null
      : "知识库更新完成标记（审计日志或 state 跳过理由）";
  }
  // 其余视为证据文件编号
  const p = artifactPath(projectRoot, reqId, cond);
  return fs.existsSync(p) ? null : ARTIFACT[cond].replace("{id}", reqId);
}

// ---------------------------------------------------------------------------
// check / apply
// ---------------------------------------------------------------------------

function nextTargets(state) {
  const idx = PHASE_ORDER.indexOf(state.phase);
  if (idx === -1) fail(`未知 phase: ${state.phase}`);
  const targets = [];
  for (let i = idx + 1; i < PHASE_ORDER.length; i++) {
    const candidate = PHASE_ORDER[i];
    if (candidate === "done") { targets.push(candidate); break; }
    if (state.skipped.includes(candidate)) continue;
    targets.push(candidate);
    if (targets.length >= 2) break; // 直接下一阶段 + done 提示
  }
  if (targets.length === 0) targets.push("done");
  return targets;
}

function check(projectRoot, reqId, target, state) {
  if (!PHASE_ORDER.includes(target)) return { ok: false, missing: [`未知目标阶段: ${target}`] };
  if (state.status === "waiting_confirm") {
    return { ok: false, missing: [`状态为 waiting_confirm（等待用户确认 ${state.phase}），人工确认门控优先，禁止脚本推进`] };
  }
  if (state.status === "done") {
    return { ok: false, missing: ["需求已 done"] };
  }
  const level = state.level;
  if (!levelConfirmed(state)) {
    return { ok: false, missing: ["级别未确认（state.level 为 null），先完成分级确认"] };
  }
  const required = REQUIRED[target] && REQUIRED[target][level];
  if (required === null) {
    return { ok: true, skipped: true, missing: [] };
  }
  if (!required) {
    return { ok: false, missing: [`目标阶段 ${target} 不在规则表中`] };
  }
  const missing = [];
  for (const cond of required) {
    const miss = evaluateCondition(projectRoot, state, reqId, cond);
    if (miss) missing.push(miss);
  }
  // 阶段顺序：target 必须是合法的下一个（或 skipped 后的下一个）阶段
  const legal = nextTargets(state);
  if (!legal.includes(target)) {
    missing.unshift(`阶段顺序不合法：当前 ${state.phase}，合法目标为 ${legal.join(" / ")}`);
  }
  return { ok: missing.length === 0, missing, skipped: false };
}

function apply(projectRoot, reqId, target, state) {
  const result = check(projectRoot, reqId, target, state);
  if (!result.ok) {
    fail(`缺少: ${result.missing.join("; ")}`);
  }
  const from = state.phase;
  state.phase = target;
  state.status = "in_progress";
  // 回写该阶段产物 evidence（存在才写，路径以实际文件为准 —— §8 双轨防漂移）
  const evCode = PHASE_EVIDENCE[target];
  if (evCode) {
    const rel = ARTIFACT[evCode].replace("{id}", reqId);
    if (fs.existsSync(path.join(projectRoot, rel))) state.evidence[evKey(evCode)] = rel;
  }
  if (target === "design") {
    const relA = ARTIFACT["03a"].replace("{id}", reqId);
    if (fs.existsSync(path.join(projectRoot, relA))) state.evidence.change_strategy = relA;
  }
  if (target === "done") state.status = "done";
  saveState(projectRoot, reqId, state);
  appendEvent(projectRoot, reqId, {
    ts: nowIso(), from, to: target, level: state.level,
    evidence: state.evidence, via: "--apply",
  });
  console.log(`PASS: ${from} -> ${target}（state 已更新，审计已追加）`);
  if (result.skipped) console.log(`注意: ${target} 对 ${state.level} 级为 skipped 阶段，本次按跳过处理`);
}

function evKey(code) {
  return { "01": "analysis", "02": "prd", "03": "design", "04": "test_cases", "05": "test_report" }[code];
}

// ---------------------------------------------------------------------------
// init / resume
// ---------------------------------------------------------------------------

function init(projectRoot, reqId, level) {
  if (loadState(projectRoot, reqId)) {
    fail("state.yaml 已存在，拒绝覆盖（--init 仅用于补建缺失状态）");
  }
  if (level && !["S", "M", "L"].includes(level)) {
    fail(`非法级别: ${level}（仅 S/M/L）`);
  }
  const rel00 = ARTIFACT["00"].replace("{id}", reqId);
  const has00 = fs.existsSync(path.join(projectRoot, rel00));
  const state = {
    id: reqId,
    level: level || null,
    phase: has00 ? "original_req" : "identified",
    status: has00 ? "waiting_confirm" : "in_progress",
    skipped: [],
    evidence: {
      original_requirements: has00 ? rel00 : null,
      analysis: null, prd: null, design: null,
      change_strategy: null, test_cases: null, test_report: null,
      no_test_note: null,
    },
    updated_at: nowIso(),
  };
  saveState(projectRoot, reqId, state);
  appendEvent(projectRoot, reqId, { ts: nowIso(), from: null, to: state.phase, level: state.level, evidence: state.evidence, via: "--init" });
  console.log(`PASS: 已补建 state.yaml（phase=${state.phase}, level=${state.level || "未确认"}）`);
}

function resume(projectRoot, reqId, state) {
  const next = nextTargets(state);
  console.log(`id: ${state.id}`);
  console.log(`level: ${state.level || "未确认"}`);
  console.log(`phase: ${state.phase}`);
  console.log(`status: ${state.status}`);
  if (state.status === "waiting_confirm") {
    console.log(`下一动作: 等待用户确认 ${state.phase}；确认后由流水线执行 --apply`);
  } else {
    console.log(`下一动作: 进入 ${next[0]}（先 guard check，产出经用户确认后 --apply）`);
    const handoff = path.join(projectRoot, "docs", reqId, ".handoff", `${state.phase}.context.md`);
    if (fs.existsSync(handoff)) {
      console.log(`恢复上下文: docs/${reqId}/.handoff/${state.phase}.context.md（法律 L2：只读压缩包，禁止复读 00–05 全文）`);
    }
  }
  console.log("禁止: 为恢复而全量生成知识库 / 重读 00–05 全文 / 重跑已完成阶段");
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const [projectRoot, reqId, cmd, ...rest] = args;
  if (!projectRoot || !reqId) {
    fail("用法: node devpilot-guard.js <项目根> <需求标识> <check <target> | --apply <target> | --init [S|M|L] | resume>");
  }
  if (!fs.existsSync(path.join(projectRoot, "docs", reqId))) {
    fail(`需求目录不存在: docs/${reqId}/（先完成标识确认与 00 文件）`);
  }

  if (cmd === "--init") {
    init(projectRoot, reqId, rest[0]);
    return;
  }

  const state = loadState(projectRoot, reqId);
  if (!state) {
    fail("state.yaml 不存在。旧需求可不补建（走推断模式）；如需接入守卫，运行 --init [S|M|L]");
  }

  if (cmd === "resume") {
    resume(projectRoot, reqId, state);
    return;
  }

  if (cmd === "check" || cmd === "--apply") {
    const target = rest[0];
    if (!target) fail(`用法: devpilot-guard.js ${cmd === "check" ? "check" : "--apply"} <目标阶段>`);
    if (cmd === "check") {
      const r = check(projectRoot, reqId, target, state);
      if (r.ok) {
        console.log(`PASS: ${target} 可进入${r.skipped ? "（该阶段对本级别 skipped）" : ""}`);
      } else {
        fail(`缺少: ${r.missing.join("; ")}`);
      }
    } else {
      apply(projectRoot, reqId, target, state);
    }
    return;
  }

  fail(`未知命令: ${cmd}`);
}

main();