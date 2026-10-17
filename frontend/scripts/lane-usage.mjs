#!/usr/bin/env node
/**
 * lane-usage.mjs: what a lane spent against the plan limits, read from its
 * folder in ~/.jjodel-lanes (P-2026-10-18-0100, report 2026-10-15 §7.2, §7.3).
 *
 *   node frontend/scripts/lane-usage.mjs <Prompt-ID> [--json] [--write]
 *   node frontend/scripts/lane-usage.mjs --all [--json]
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
 * nothing outside node:*.
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

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
    for (const e of events) {
        if (e.type !== 'assistant' || !e.message || !e.message.usage) continue;
        const model = e.message.model || 'unknown';
        if (model === '<synthetic>') continue;
        const key = e.message.id || 'event-' + calls.size;
        calls.set(key, { model, sub: Boolean(e.parent_tool_use_id), usage: e.message.usage });
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

/** outputTokens per model of the last result event: cumulative over resumes, subagents included; null without a result. */
function resultOutput(events) {
    const results = events.filter((e) => e.type === 'result' && e.modelUsage);
    if (results.length === 0) return null;
    const out = {};
    for (const [m, u] of Object.entries(results[results.length - 1].modelUsage)) out[m] = u.outputTokens ?? null;
    return out;
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
function allIntervals() {
    const out = new Map();
    for (const id of laneIds()) {
        const iv = laneInterval(join(ROOT, id));
        if (iv) out.set(id, iv);
    }
    return out;
}

function overlap(id, intervals) {
    const own = intervals.get(id);
    if (!own) return { lanes: null, alone: null, note: OVERLAP_NOTE };
    const lanes = [...intervals]
        .filter(([other, iv]) => other !== id && iv.start <= own.end && own.start <= iv.end)
        .map(([other]) => other);
    return { lanes, alone: lanes.length === 0, note: OVERLAP_NOTE };
}

/** The usage of one lane folder; throws an Error with a one-line message when the lane or its log is missing. */
function laneUsage(id, intervals) {
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
        skippedLines,
    };
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
    lines.push(`skipped lines ${u.skippedLines}`);
    return lines.join('\n') + '\n';
}

function summary(u) {
    const { series, ...context } = u.context;
    return { ...u, context };
}

function allText(list, missing) {
    const rows = [['id', 'tier', 'model', 'runs', 'calls', 'ctx max', 'input', 'cache_read', 'cache_creation', 'output*', '7d delta', 'alone']];
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
        ]);
    }
    const widths = rows[0].map((_, c) => Math.max(...rows.map((r) => r[c].length)));
    const out = rows.map((r) => r.map((v, c) => v.padEnd(widths[c])).join('  ').trimEnd());
    if (missing) out.push(`${missing} lane folders without log.jsonl left out`);
    out.push('output*: modelUsage of the last result event, all models of the lane; the other classes: main calls only');
    out.push(OVERLAP_NOTE);
    return out.join('\n') + '\n';
}

function fail(message, code = 1) {
    process.stderr.write('lane-usage: ' + message + '\n');
    process.exitCode = code;
}

function main(argv) {
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

main(process.argv.slice(2));
