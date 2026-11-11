#!/usr/bin/env node
/**
 * lane-usage.mjs: what a lane spent against the plan limits, read from its
 * folder in ~/.jjodel-lanes (P-2026-10-18-0100, report 2026-10-15 §7.2, §7.3).
 *
 *   node frontend/scripts/lane-usage.mjs <Prompt-ID> [--json] [--write]
 *   node frontend/scripts/lane-usage.mjs --all [--json]
 *   node frontend/scripts/lane-usage.mjs --objective <ID> [--json]
 * Objective totals require explicit links, session identity and reconciled inputs;
 * absent architect provenance and overlapping intervals remain incomplete.
 *
 * For one lane: the model of the first and last run, the runs, the tier; the
 * tokens per model and per class of the main session and, apart, of the
 * subagents; the main context of every call, with the AM-8 thresholds; the
 * first and last rate-limit reading; the other lanes whose interval overlaps.
 * --json prints the same as JSON, with the full per-call series. --write saves
 * that JSON as usage.json in the lane folder: the only write of this script.
 * --all prints one row per lane folder, newest first (--json: an array of the
 * per-lane summaries without the series).
 *
 * JJODEL_LANES overrides the root, as in lane-board.mjs. Plain ES module,
 * nothing outside node:*. The lane board imports laneUsage, summary,
 * allIntervals and overlap (P-2026-10-18-1045); the CLI runs only when the
 * file is the script, not when it is imported.
 */

import { existsSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readObjective } from './lane-objective.mjs';

const ROOT = process.env.JJODEL_LANES || join(homedir(), '.jjodel-lanes');
const PROMPT_ID = /^P-\d{4}-\d{2}-\d{2}-\d{4}$/;
/** AM-8 thresholds, memo docs/ratifiche/claude_2026-10-17_memo_harness_front_fable_trial.md §2. */
const THRESHOLDS = [200000, 250000];
const OVERLAP_NOTE = 'interactive sessions are not visible to lane-run: overlap is a lower bound';

/** The lines of log.jsonl as events; a line that is not JSON is skipped and counted, never fatal. */
function readEvents(path) {
    const events = [];
    let skippedLines = 0;
    for (const line of readFileSync(path, 'utf8').split('\n')) {
        if (!line.trim()) continue;
        try {
            events.push(JSON.parse(line));
        } catch {
            skippedLines++;
        }
    }
    return { events, skippedLines };
}

const readText = (path) => (existsSync(path) ? readFileSync(path, 'utf8').trim() : null);

const emptyClasses = () => ({ calls: 0, input: 0, cacheRead: 0, cacheCreation: 0, output: 0 });

function addClasses(into, u) {
    into.calls++;
    into.input += u.input_tokens || 0;
    into.cacheRead += u.cache_read_input_tokens || 0;
    into.cacheCreation += u.cache_creation_input_tokens || 0;
    into.output += u.output_tokens || 0;
}

/**
 * The API calls of the log, one per message.id, in the order of their first
 * event. stream-json emits one assistant event per content block, each
 * repeating the message's usage, so the events are not the calls; the last
 * event of a message carries its final usage. Synthetic messages (no API call,
 * model <synthetic>) are left out.
 *
 * The per-call usage is the only source here: result.usage is per invocation
 * and modelUsage is cumulative over resumes (report §2.4, §4.2), so neither
 * gives the context of a single call.
 *
 * Measured on P-2026-10-16-1000: the input classes summed here agree with the
 * last modelUsage within 1%, the output does not (2703 against 129271): the
 * output_tokens of an assistant event is the count at the start of the stream.
 * The output total is therefore read from modelUsage too, see resultOutput.
 */
function apiCalls(events) {
    const calls = new Map();
    for (const { event: e, session } of sessionEvents(events)) {
        if (e.type !== 'assistant' || !e.message || !e.message.usage) continue;
        const model = e.message.model || 'unknown';
        if (model === '<synthetic>') continue;
        const key = JSON.stringify([session, e.message.id || 'event-' + calls.size]);
        calls.set(key, { session, model, sub: Boolean(e.parent_tool_use_id), usage: e.message.usage });
    }
    return [...calls.values()];
}

function median(values) {
    if (values.length === 0) return null;
    const s = [...values].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

function reading(e) {
    const r = e.rate_limit_info || {};
    const w = r.unifiedWindows || {};
    return {
        fiveHourUtilization: w.five_hour?.utilization ?? null,
        sevenDayUtilization: w.seven_day?.utilization ?? null,
        sevenDayResetsAt: w.seven_day?.resetsAt ?? null,
        status: r.status ?? null,
        isUsingOverage: r.isUsingOverage ?? null,
        overageStatus: r.overageStatus ?? null,
    };
}

/** Preserve session boundaries; old logs with no identity retain one legacy scope. */
export function sessionEvents(events) {
    let current = null;
    return events.map(event => {
        if (event.type === 'system' && event.subtype === 'init') current = event.session_id || event.sessionId || null;
        return { event, session: event.session_id || event.sessionId || current || 'legacy' };
    });
}

/** Final cumulative result per distinct session, including resumes only once. */
export function sessionResults(events) {
    const latest = new Map();
    const expected = new Set();
    for (const { event: e, session } of sessionEvents(events)) {
        if ((e.type === 'system' && e.subtype === 'init') || e.type === 'assistant') expected.add(session);
        if (e.type !== 'result' || e.origin?.kind === 'task-notification' || (e.num_turns === 0 && !e.result)) continue;
        expected.add(session);
        latest.set(session, e);
    }
    return { latest, expected };
}

/** Sum final session output; missing counters in any session stay unknown. */
export function resultOutput(events) {
    const { latest, expected } = sessionResults(events);
    if (!expected.size || [...expected].some(s => !latest.get(s)?.modelUsage)) return null;
    const out = {};
    for (const e of latest.values()) for (const [m, u] of Object.entries(e.modelUsage)) {
        if (!Number.isSafeInteger(u.outputTokens) || u.outputTokens < 0) return null;
        out[m] = (out[m] || 0) + u.outputTokens;
        if (!Number.isSafeInteger(out[m])) return null;
    }
    return out;
}

/** Require stream input to agree with final CLI counters before an objective claims complete observed usage. */
function inputReconciles(events) {
    const { latest, expected } = sessionResults(events);
    if (!expected.size || expected.has('legacy')) return false;
    const sums = new Map();
    const streamKeys = ['input_tokens', 'cache_read_input_tokens', 'cache_creation_input_tokens'];
    const cliKeys = ['inputTokens', 'cacheReadInputTokens', 'cacheCreationInputTokens'];
    for (const c of apiCalls(events)) {
        const value = sums.get(c.session) || [0, 0, 0];
        for (let i = 0; i < streamKeys.length; i++) {
            const n = c.usage[streamKeys[i]] ?? 0;
            if (!Number.isSafeInteger(n) || n < 0) return false;
            value[i] += n;
        }
        sums.set(c.session, value);
    }
    for (const session of expected) {
        const models = latest.get(session)?.modelUsage;
        if (!models || !Object.keys(models).length) return false;
        for (let i = 0; i < cliKeys.length; i++) {
            const values = Object.values(models).map(u => u[cliKeys[i]]);
            if (values.some(n => !Number.isSafeInteger(n) || n < 0)) return false;
            const n = values.reduce((a, b) => a + b, 0);
            if (!Number.isSafeInteger(n) || n !== (sums.get(session) || [0, 0, 0])[i]) return false;
        }
    }
    return true;
}

/** Runtime is invocation work, not wall time to acceptance; notifications are not invocations. */
function runtime(events) {
    let ms = 0;
    let count = 0;
    const seen = new Set();
    for (const { event: e, session } of sessionEvents(events)) {
        if (e.type !== 'result' || e.origin?.kind === 'task-notification' || (e.num_turns === 0 && !e.result)) continue;
        const key = e.uuid ? JSON.stringify([session, e.uuid]) : null;
        if (key && seen.has(key)) continue;
        if (key) seen.add(key);
        if (!Number.isFinite(e.duration_ms) || e.duration_ms < 0) return null;
        ms += e.duration_ms;
        count++;
    }
    return count ? ms : null;
}

const diff = (a, b) => (typeof a === 'number' && typeof b === 'number' ? Math.round((b - a) * 1e6) / 1e6 : null);

/** started.txt (epoch ms) to the mtime of exit.txt, or now while the lane runs; null without started.txt. */
function laneInterval(dir) {
    const started = Number(readText(join(dir, 'started.txt')));
    if (!Number.isFinite(started) || started <= 0) return null;
    const exitPath = join(dir, 'exit.txt');
    const running = !existsSync(exitPath);
    return { start: started, end: running ? Date.now() : statSync(exitPath).mtimeMs, running };
}

function laneIds() {
    if (!existsSync(ROOT)) return [];
    return readdirSync(ROOT)
        .filter((n) => PROMPT_ID.test(n) && statSync(join(ROOT, n)).isDirectory())
        .sort()
        .reverse();
}

/** The interval of every lane folder, read once per invocation. */
export function allIntervals() {
    const out = new Map();
    for (const id of laneIds()) {
        const iv = laneInterval(join(ROOT, id));
        if (iv) out.set(id, iv);
    }
    return out;
}

export function overlap(id, intervals) {
    const own = intervals.get(id);
    if (!own) return { lanes: null, alone: null, note: OVERLAP_NOTE };
    const lanes = [...intervals]
        .filter(([other, iv]) => other !== id && iv.start <= own.end && own.start <= iv.end)
        .map(([other]) => other);
    return { lanes, alone: lanes.length === 0, note: OVERLAP_NOTE };
}

/**
 * The architect's share of a lane, from architect.json in the lane folder (schema 1, written by the project chat,
 * never by this script or the board; P-2026-10-18-1155). state: 'none' (no file), 'unreadable' (not JSON or not
 * schema 1), 'open' (no close yet: the delta is not known), 'ok'. delta falls back to close minus launch when absent.
 */
export function architectOf(id) {
    const path = join(ROOT, id, 'architect.json');
    if (!existsSync(path)) return { state: 'none', chat: null, model: null, delta: null };
    try {
        const a = JSON.parse(readFileSync(path, 'utf8'));
        if (!a || a.schema !== 1 || !a.launch || typeof a.launch !== 'object') throw new Error('schema');
        const chat = typeof a.chat === 'string' ? a.chat : null;
        const model = typeof a.model === 'string' ? a.model : null;
        if (!a.close) return { state: 'open', chat, model, delta: null };
        const num = (v) => typeof v === 'number' && Number.isFinite(v);
        const keys = ['calls', 'input', 'cacheRead', 'cacheCreation', 'output', 'totalIn'];
        let d = a.delta;
        if (!d || !num(d.totalIn) || !num(d.output)) {
            if (!keys.every((k) => num(a.close[k]) && num(a.launch[k]))) throw new Error('delta');
            d = Object.fromEntries(keys.map((k) => [k, a.close[k] - a.launch[k]]));
        }
        return { state: 'ok', chat, model, delta: d };
    } catch {
        return { state: 'unreadable', chat: null, model: null, delta: null };
    }
}

/** The usage of one lane folder; throws an Error with a one-line message when the lane or its log is missing. */
export function laneUsage(id, intervals) {
    const dir = join(ROOT, id);
    if (!PROMPT_ID.test(id) || !existsSync(dir)) throw new Error('no lane folder ' + id + ' in ' + ROOT);
    const logPath = join(dir, 'log.jsonl');
    if (!existsSync(logPath)) throw new Error('no log.jsonl in ' + dir);
    const { events, skippedLines } = readEvents(logPath);

    const inits = events.filter((e) => e.type === 'system' && e.subtype === 'init');
    const models = inits.map((e) => e.model || 'unknown');
    const tierLine = (readText(join(dir, 'tier.txt')) || '').split('\n')[0] || null;

    const main = {};
    const subagents = {};
    const series = [];
    for (const c of apiCalls(events)) {
        const block = c.sub ? subagents : main;
        addClasses((block[c.model] ||= emptyClasses()), c.usage);
        if (!c.sub) series.push((c.usage.input_tokens || 0) + (c.usage.cache_read_input_tokens || 0) + (c.usage.cache_creation_input_tokens || 0));
    }

    const readings = events.filter((e) => e.type === 'rate_limit_event').map(reading);
    const first = readings[0] || null;
    const last = readings.length > 1 ? readings[readings.length - 1] : null;

    const iv = intervals.get(id) || null;
    const arch = architectOf(id);
    return {
        id,
        tier: tierLine ? tierLine.split(/\s+/)[0] : null,
        tierLine,
        session: readText(join(dir, 'session.txt')),
        model: { first: models[0] ?? null, last: models.length > 1 && models[models.length - 1] !== models[0] ? models[models.length - 1] : null },
        runs: inits.length,
        started: iv ? iv.start : null,
        ended: iv && !iv.running ? iv.end : null,
        running: iv ? iv.running : null,
        main,
        subagents,
        resultOutput: resultOutput(events),
        sessions: [...sessionResults(events).expected],
        runtimeMs: runtime(events),
        inputReconciled: inputReconciles(events),
        context: {
            calls: series.length,
            max: series.length ? Math.max(...series) : null,
            last: series.length ? series[series.length - 1] : null,
            median: median(series),
            atOrAbove200k: series.filter((v) => v >= THRESHOLDS[0]).length,
            atOrAbove250k: series.filter((v) => v >= THRESHOLDS[1]).length,
            series,
        },
        rateLimit: {
            readings: readings.length,
            first,
            last,
            delta: last ? { fiveHour: diff(first.fiveHourUtilization, last.fiveHourUtilization), sevenDay: diff(first.sevenDayUtilization, last.sevenDayUtilization) } : null,
            note: readings.length < 2 ? 'fewer than two readings: no delta' : null,
        },
        overlap: overlap(id, intervals),
        architect: arch.state === 'ok' || arch.state === 'open' ? { chat: arch.chat, model: arch.model, delta: arch.delta } : null,
        architectOpen: arch.state === 'open',
        architectUnreadable: arch.state === 'unreadable',
        skippedLines,
    };
}

/** An explicit objective, with incomplete/overlapping accounting never presented as a complete total. */
export function objectiveUsage(id) {
    const objective = readObjective(ROOT, id);
    if (!objective.links.length) throw new Error('objective has no linked lanes: ' + id);
    const lanes = [];
    const issues = [];
    const owners = new Map();
    let tokens = 0;
    let runtimeMs = 0;
    let architectTokens = 0;
    const architectIntervals = [];
    for (const link of objective.links) {
        let u;
        try { u = laneUsage(link.lane, new Map()); } catch (err) {
            issues.push({ lane: link.lane, code: 'missing_lane_usage', detail: err.message });
            continue;
        }
        lanes.push({ ...link, usage: summary(u) });
        for (const session of u.sessions) {
            if (session === 'legacy') issues.push({ lane: link.lane, code: 'session_identity_missing' });
            else if (owners.has(session)) issues.push({ lane: link.lane, code: 'duplicate_session', session, other: owners.get(session) });
            else owners.set(session, link.lane);
        }
        if (u.skippedLines) issues.push({ lane: link.lane, code: 'unreadable_events' });
        if (!u.inputReconciled) issues.push({ lane: link.lane, code: 'input_not_reconciled' });
        const input = total(u.main).input + total(u.main).cacheRead + total(u.main).cacheCreation +
            total(u.subagents).input + total(u.subagents).cacheRead + total(u.subagents).cacheCreation;
        if (!u.resultOutput) issues.push({ lane: link.lane, code: 'output_missing' });
        else tokens += input + Object.values(u.resultOutput).reduce((a, b) => a + b, 0);
        if (u.runtimeMs === null) issues.push({ lane: link.lane, code: 'runtime_missing' });
        else runtimeMs += u.runtimeMs;
        // A delta alone has no interval/provenance and cannot prove a disjoint architect contribution.
        let a = null;
        try { a = JSON.parse(readFileSync(join(ROOT, link.lane, 'architect.json'), 'utf8')); } catch { /* absent stays unknown */ }
        const start = typeof a?.launch?.at === 'number' ? a.launch.at : Date.parse(a?.launch?.at);
        const end = typeof a?.close?.at === 'number' ? a.close.at : Date.parse(a?.close?.at);
        const d = u.architect?.delta;
        if (!a?.chat || !a?.model || typeof a?.source !== 'string' || !a.source.trim() || !Number.isFinite(start) || !Number.isFinite(end) || end <= start ||
            !Number.isSafeInteger(d?.totalIn) || d.totalIn < 0 || !Number.isSafeInteger(d?.output) || d.output < 0) {
            issues.push({ lane: link.lane, code: 'architect_coverage_missing' });
        } else {
            if (architectIntervals.some(v => v.chat === a.chat && start < v.end && end > v.start)) issues.push({ lane: link.lane, code: 'architect_overlap' });
            architectIntervals.push({ chat: a.chat, start, end });
            architectTokens += d.totalIn + d.output;
        }
    }
    const technicalIssues = issues.filter(i => !i.code.startsWith('architect_') && i.code !== 'runtime_missing');
    if (!Number.isSafeInteger(tokens) || tokens < 0) technicalIssues.push({ code: 'invalid_counter' });
    const complete = lanes.length === objective.links.length;
    const technicalTokens = complete && !technicalIssues.length ? tokens : null;
    const architectComplete = complete && !issues.some(i => i.code.startsWith('architect_')) && Number.isSafeInteger(architectTokens);
    return { objective, lanes, technicalTokens,
        runtimeMs: complete && !issues.some(i => ['runtime_missing', 'duplicate_session', 'session_identity_missing'].includes(i.code)) ? runtimeMs : null,
        architectTokens: architectComplete ? architectTokens : null,
        totalTokens: technicalTokens !== null && architectComplete ? technicalTokens + architectTokens : null,
        coverage: technicalTokens === null ? 'partial' : 'observed', issues: [...issues, ...technicalIssues.filter(i => i.code === 'invalid_counter')] };
}

/** The classes of every model of a block, summed. */
function total(block) {
    const t = emptyClasses();
    for (const c of Object.values(block)) for (const k of Object.keys(t)) t[k] += c[k];
    return t;
}

const n = (v) => (v === null || v === undefined ? 'n/a' : String(v));
const classes = (c) => `calls ${c.calls}  input ${c.input}  cache_read ${c.cacheRead}  cache_creation ${c.cacheCreation}  output ${c.output}`;
const readingText = (r) =>
    `5h ${n(r.fiveHourUtilization)}  7d ${n(r.sevenDayUtilization)}  7d resets ${n(r.sevenDayResetsAt)}  status ${n(r.status)}  overage ${n(r.isUsingOverage)} (${n(r.overageStatus)})`;

function laneText(u) {
    const lines = [];
    const model = u.model.last ? `${n(u.model.first)} then ${u.model.last}` : n(u.model.first);
    lines.push(`${u.id}  tier ${n(u.tier)}  model ${model}  runs ${u.runs}  session ${n(u.session)}`);
    const mains = Object.entries(u.main);
    if (mains.length === 0) lines.push('main  no calls');
    for (const [m, c] of mains) lines.push(`main  ${m}  ${classes(c)}`);
    const subs = Object.entries(u.subagents);
    if (subs.length === 0) lines.push('subagents  none');
    for (const [m, c] of subs) lines.push(`subagents  ${m}  ${classes(c)}`);
    const ro = u.resultOutput ? Object.entries(u.resultOutput).map(([m, v]) => `${m} ${n(v)}`).join('  ') : 'n/a (no result event)';
    lines.push(`output from modelUsage, all runs  ${ro}  (the per-call output above is the count at stream start)`);
    const x = u.context;
    lines.push(`context per call  calls ${x.calls}  max ${n(x.max)}  last ${n(x.last)}  median ${n(x.median)}  >=200k ${x.atOrAbove200k}  >=250k ${x.atOrAbove250k}`);
    const r = u.rateLimit;
    if (r.first) lines.push(`rate limit first  ${readingText(r.first)}`);
    if (r.last) lines.push(`rate limit last   ${readingText(r.last)}`);
    lines.push(r.delta ? `rate limit delta  5h ${n(r.delta.fiveHour)}  7d ${n(r.delta.sevenDay)}  (${r.readings} readings)` : `rate limit  ${r.readings} readings: ${r.note}`);
    const o = u.overlap;
    lines.push(o.lanes === null ? 'overlap  n/a (no started.txt)' : `overlap  alone ${o.alone}${o.lanes.length ? '  with ' + o.lanes.join(', ') : ''}`);
    lines.push(o.note);
    if (u.architectUnreadable) lines.push('architect  unreadable');
    else if (u.architectOpen) lines.push('architect  open');
    else if (u.architect) lines.push(`architect  calls ${n(u.architect.delta.calls)}  in ${u.architect.delta.totalIn}  out ${u.architect.delta.output}  (chat ${n(u.architect.chat)})`);
    else lines.push('architect  none');
    lines.push(`skipped lines ${u.skippedLines}`);
    return lines.join('\n') + '\n';
}

export function summary(u) {
    const { series, ...context } = u.context;
    return { ...u, context };
}

function allText(list, missing) {
    const rows = [['id', 'tier', 'model', 'runs', 'calls', 'ctx max', 'input', 'cache_read', 'cache_creation', 'output*', '7d delta', 'alone', 'arch']];
    for (const u of list) {
        const t = total(u.main);
        rows.push([
            u.id,
            n(u.tier),
            u.model.last ? `${n(u.model.first)}>${u.model.last}` : n(u.model.first),
            String(u.runs),
            String(u.context.calls),
            n(u.context.max),
            String(t.input),
            String(t.cacheRead),
            String(t.cacheCreation),
            u.resultOutput ? String(Object.values(u.resultOutput).reduce((a, v) => a + (v || 0), 0)) : 'n/a',
            u.rateLimit.delta ? n(u.rateLimit.delta.sevenDay) : 'n/a',
            n(u.overlap.alone),
            u.architectOpen ? 'open' : u.architect ? String(u.architect.delta.totalIn + u.architect.delta.output) : 'n/a',
        ]);
    }
    const widths = rows[0].map((_, c) => Math.max(...rows.map((r) => r[c].length)));
    const out = rows.map((r) => r.map((v, c) => v.padEnd(widths[c])).join('  ').trimEnd());
    if (missing) out.push(`${missing} lane folders without log.jsonl left out`);
    out.push('output*: final modelUsage per distinct session, all models of the lane; the other classes: main calls only');
    out.push('arch: the architect\'s totalIn + output over the lane (architect.json), open while the chat has not closed it, n/a without the file');
    out.push(OVERLAP_NOTE);
    return out.join('\n') + '\n';
}

function fail(message, code = 1) {
    process.stderr.write('lane-usage: ' + message + '\n');
    process.exitCode = code;
}

function main(argv) {
    if (argv[0] === '--objective') {
        if (!argv[1] || argv.slice(2).some(a => a !== '--json')) return fail('usage: lane-usage.mjs --objective <ID> [--json]', 2);
        try { process.stdout.write(JSON.stringify(objectiveUsage(argv[1]), null, 2) + '\n'); }
        catch (err) { fail(err.message); }
        return;
    }
    const flags = new Set(argv.filter((a) => a.startsWith('--')));
    const ids = argv.filter((a) => !a.startsWith('--'));
    const unknown = [...flags].filter((f) => !['--all', '--json', '--write'].includes(f));
    const all = flags.has('--all');
    if (unknown.length || (all ? ids.length !== 0 || flags.has('--write') : ids.length !== 1)) {
        return fail('usage: lane-usage.mjs <Prompt-ID> [--json] [--write] | --all [--json]', 2);
    }
    const intervals = allIntervals();
    if (all) {
        const list = [];
        let missing = 0;
        for (const id of laneIds()) {
            if (!existsSync(join(ROOT, id, 'log.jsonl'))) {
                missing++;
                continue;
            }
            list.push(summary(laneUsage(id, intervals)));
        }
        process.stdout.write(flags.has('--json') ? JSON.stringify(list, null, 2) + '\n' : allText(list, missing));
        return;
    }
    let u;
    try {
        u = laneUsage(ids[0], intervals);
    } catch (err) {
        return fail(err.message);
    }
    const json = JSON.stringify(u, null, 2) + '\n';
    if (flags.has('--write')) writeFileSync(join(ROOT, u.id, 'usage.json'), json);
    process.stdout.write(flags.has('--json') ? json : laneText(u));
}

// Also through a symlinked path; never when the board imports this file.
const MAIN = (() => { try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); } catch { return false; } })();
if (MAIN) main(process.argv.slice(2));
