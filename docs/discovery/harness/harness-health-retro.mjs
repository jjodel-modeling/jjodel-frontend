#!/usr/bin/env node
/**
 * harness-health-retro.mjs: the retrospective backtest of the harness health
 * signals (P-2026-10-18-2220, report
 * docs/discovery/discovery_2026-10-18_harness_health_retrospective.md).
 *
 *   node docs/discovery/harness/harness-health-retro.mjs [--ref <sha>] [--cutoff <ISO>]
 *
 * Reads only: git objects at --ref (default e49ec777e, the commit that added the
 * prompt), the lane folders under JJODEL_LANES or ~/.jjodel-lanes whose exit.txt
 * is older than --cutoff (default 2026-10-18T22:20:12+02:00, the time of --ref),
 * and the incident table of §1 of the report as committed at the freeze commit
 * (--incidents-ref, default the first commit of the report). Writes the CSV files
 * of docs/discovery/harness/harness-health-retro/ and prints their sha256: the
 * only writes. No Date.now, no locale: two runs on the same inputs give the same
 * bytes. Plain ES module, node:* only.
 *
 * The lane-board resume classifier (inputClass) is reimplemented below from
 * frontend/scripts/lane-board/lane-board.mjs:891, which does not export it.
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const OUT = join(REPO, 'docs/discovery/harness/harness-health-retro');
const LANES = process.env.JJODEL_LANES || join(homedir(), '.jjodel-lanes');
const REPORT = 'docs/discovery/discovery_2026-10-18_harness_health_retrospective.md';
const argOf = (name, dflt) => {
    const i = process.argv.indexOf(name);
    return i > 0 ? process.argv[i + 1] : dflt;
};
const REF = argOf('--ref', 'e49ec777e');
const CUTOFF = Date.parse(argOf('--cutoff', '2026-10-18T22:20:12+02:00'));
const SERIES_FROM = '2026-07-27';
const SERIES_TO = '2026-10-18';
const TUNE = ['2026-08-01', '2026-09-30'];
const EVAL = ['2026-10-01', '2026-10-18'];
const LEAD_DAYS = 28;
const TIME_LIMIT_MS = 90 * 60 * 1000;

const git = (...a) => execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8', maxBuffer: 1 << 30 });

/** Many blobs in one process: `git cat-file --batch`, output split by the declared sizes. */
function catFiles(specs) {
    if (!specs.length) return [];
    const buf = execFileSync('git', ['-C', REPO, 'cat-file', '--batch'], { input: specs.join('\n') + '\n', maxBuffer: 2 ** 31 });
    const out = [];
    let at = 0;
    for (let i = 0; i < specs.length; i++) {
        const nl = buf.indexOf(10, at);
        const head = buf.subarray(at, nl).toString();
        if (/ missing$/.test(head)) {
            out.push(null);
            at = nl + 1;
            continue;
        }
        const size = Number(head.split(' ')[2]);
        out.push(buf.subarray(nl + 1, nl + 1 + size).toString('utf8'));
        at = nl + 1 + size + 1;
    }
    return out;
}

// ---------- calendar ----------
const DAY = 86400000;
const dayMs = (d) => Date.parse(d + 'T00:00:00Z');
const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10);
/** The local (Europe/Rome, +02:00 over the whole window) calendar day of an epoch ms. */
const localDay = (ms) => isoDay(ms + 2 * 3600000);
const addDays = (d, n) => isoDay(dayMs(d) + n * DAY);
/** Monday of the ISO week of a day. */
const monday = (d) => addDays(d, -((new Date(dayMs(d)).getUTCDay() + 6) % 7));
function isoWeek(d) {
    const t = new Date(dayMs(d));
    const th = new Date(t.getTime() + (3 - ((t.getUTCDay() + 6) % 7)) * DAY);
    const y = th.getUTCFullYear();
    const w = 1 + Math.round((th.getTime() - Date.UTC(y, 0, 4)) / DAY / 7 - 0.5 + ((new Date(Date.UTC(y, 0, 4)).getUTCDay() + 6) % 7) / 7);
    return `${y}-W${String(w).padStart(2, '0')}`;
}
const DAYS = [];
for (let d = SERIES_FROM; d <= SERIES_TO; d = addDays(d, 1)) DAYS.push(d);
const WEEKS = [...new Set(DAYS.map(monday))];
const weekEnd = (m) => (addDays(m, 6) > SERIES_TO ? SERIES_TO : addDays(m, 6));

// ---------- CSV ----------
const cell = (v) => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(3);
    const s = String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const files = {};
function csv(name, header, rows) {
    files[name] = [header.join(','), ...rows.map((r) => header.map((h) => cell(r[h])).join(','))].join('\n') + '\n';
}
const median = (xs) => {
    if (!xs.length) return null;
    const s = [...xs].sort((a, b) => a - b);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// ---------- incidents (§1 of the report, frozen) ----------
const FREEZE = argOf('--incidents-ref', git('log', '--reverse', '--format=%h', REF + '..HEAD', '--', REPORT).split('\n')[0] || 'HEAD');
const reportAtFreeze = catFiles([`${FREEZE}:${REPORT}`])[0] || '';
const INCIDENTS = [];
for (const line of reportAtFreeze.split('\n')) {
    const m = /^\| (I\d+) \| ([^|]+)\| (\d{4}-\d\d-\d\d)[^|]*\| (\d{4}-\d\d-\d\d)[^|]*\| ([a-z ]+?) \|/.exec(line);
    if (m) INCIDENTS.push({ id: m[1], what: m[2].trim(), started: m[3], noticed: m[4], cls: m[5].trim() });
}

// ---------- prompts at REF ----------
const promptPaths = git('ls-tree', '-r', '--name-only', REF, 'docs/prompts').split('\n').filter((p) => p.endsWith('.md'));
const promptTexts = catFiles(promptPaths.map((p) => `${REF}:${p}`));
const header = (t, k) => {
    const m = new RegExp('^' + k + ':[ \\t]*(.*)$', 'm').exec(t.split(/\n## /)[0]);
    return m ? m[1].trim() : null;
};
const addDates = {};
{
    let date = null;
    for (const l of git('log', REF, '--diff-filter=A', '--name-only', '--format=C %aI', '--', 'docs/prompts').split('\n')) {
        if (l.startsWith('C ')) date = l.slice(2);
        else if (l) addDates[l] = date; // newest first: the last write is the oldest add
    }
}
/** First date a +Status line not saying "da eseguire" enters each prompt path. */
const flipDates = {};
{
    let date = null;
    let path = null;
    for (const l of git('log', REF, '-p', '-U0', '--no-renames', '--format=C %aI', '--', 'docs/prompts').split('\n')) {
        if (l.startsWith('C ')) date = l.slice(2);
        else if (l.startsWith('+++ ')) path = l.startsWith('+++ b/') ? l.slice(6) : null;
        else if (path && l.startsWith('+Status:') && !/da eseguire/.test(l)) {
            if (!flipDates[path] || date < flipDates[path]) flipDates[path] = date;
        }
    }
}
const PROMPTS = new Map();
promptPaths.forEach((p, i) => {
    const t = promptTexts[i] || '';
    const id = header(t, 'Prompt-ID');
    if (!id || !/^P-\d{4}-\d\d-\d\d-\d{4}$/.test(id.split(/\s/)[0])) return;
    const pid = id.split(/\s/)[0];
    const lane = header(t, 'Lane') || '';
    const status = header(t, 'Status') || '';
    PROMPTS.set(pid, {
        pid, path: p, chat: (header(t, 'Chat') || '').split(/[\s,;(]/)[0] || null, front: header(t, 'Front'),
        lane, status, corregge: header(t, 'Corregge'), added: addDates[p] || null,
        flipped: /da eseguire/.test(status) ? null : flipDates[p] || null,
        kind: /merge/i.test(lane) ? 'merge' : /discovery|phase 1/i.test(lane) ? 'discovery' : /fast/i.test(lane) ? 'fast' : lane ? 'full' : 'unknown',
    });
});

// ---------- lanes ----------
function inputClass(text) {
    const t = text.replace(/^\[P-[^\]]*\]\s*/, '');
    const l = t.split('\n').map((x) => x.trim()).find(Boolean) || '';
    const body = t.split(/\n---\s*\n/)[0].slice(0, 1200);
    if (/^(The Mac (went to sleep|lost)|Your (last turn|session) ended|The (previous resume|session) ended|The chat stopped this session)/i.test(l)) return 'recovery';
    if (/^(Rework|Chat check: one fix|Corrections?\b|Two corrections|Fix\b|Redo|Not yet|Failed|The visual check failed)|with one fix before the GO|fails?\b.*before the merge/i.test(l)) return 'corrective';
    if (!/Phase 2/i.test(l) && /\b(one|two|three|\d) (precise )?fix(es)?\b|\bfix(es)? before the GO\b/i.test(body)) return 'corrective';
    if (/^ACK\b/.test(l)) return 'ack';
    if (/^(Answers?\b|Q\d|Recommended answer|Recommendation adopted|Chat decision|.*adopted as recommended|.*ratified as recommended)/i.test(l)) return 'answer';
    if (/^(Visual )?GO\b|^GO[.,:]|Visual GO|Phase 2 GO|^Visual check by the chat/i.test(l)) return 'go';
    if (/^\/status-flip/.test(l)) return 'closure';
    return 'other';
}
const readT = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const LANE_ROWS = [];
let lanesSkipped = { running: 0, afterCutoff: 0, noCalls: 0 };
for (const id of readdirSync(LANES).filter((n) => /^P-\d{4}-\d\d-\d\d-\d{4}$/.test(n)).sort()) {
    const dir = join(LANES, id);
    const started = Number(readT(join(dir, 'started.txt')).trim());
    if (!existsSync(join(dir, 'exit.txt'))) { lanesSkipped.running++; continue; }
    const exitMs = statSync(join(dir, 'exit.txt')).mtimeMs;
    if (exitMs > CUTOFF || !(started > 0)) { lanesSkipped.afterCutoff++; continue; }
    const events = [];
    for (const line of readT(join(dir, 'log.jsonl')).split('\n')) {
        if (!line) continue;
        try { events.push(JSON.parse(line)); } catch { /* counted by lane-usage, not here */ }
    }
    const calls = new Map();
    for (const e of events) {
        if (e.type !== 'assistant' || !e.message?.usage || e.parent_tool_use_id) continue;
        if (e.message.model === '<synthetic>') continue;
        calls.set(e.message.id || 'ev' + calls.size, e.message.usage);
    }
    if (!calls.size) { lanesSkipped.noCalls++; continue; }
    const ctx = [...calls.values()].map((u) => (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0));
    const first = [...calls.values()][0];
    const results = events.filter((e) => e.type === 'result');
    const outcomes = results.map((r) => {
        let last = null;
        for (const l of String(r.result || '').split('\n')) if (l.trim().startsWith('Outcome:')) last = l.trim();
        return last === null ? 'unparsed' : (/^Outcome:\s*(done|hard-stop|question|blocked)\b/.exec(last) || [])[1] || 'unparsed';
    });
    const init = events.find((e) => e.type === 'system' && e.subtype === 'init');
    const names = readdirSync(dir);
    const inputs = names.map((n) => /^input-(\d+)\.md$/.exec(n)).filter(Boolean).map((m) => Number(m[1])).sort((a, b) => a - b);
    const msgs = names.map((n) => /^msg-(\d+)\.md$/.exec(n)).filter(Boolean).map((m) => Number(m[1])).sort((a, b) => a - b);
    const resumeCls = inputs.length > 1
        ? inputs.slice(1).map((k) => inputClass(readT(join(dir, `input-${k}.md`)).slice(0, 1500)))
        : msgs.map((k) => inputClass(readT(join(dir, `msg-${k}.md`)).slice(0, 1500)));
    const turnDays = inputs.length ? inputs.map((k) => localDay(statSync(join(dir, `input-${k}.md`)).mtimeMs)) : [localDay(started)];
    const costs = results.map((r) => r.total_cost_usd || 0);
    const spend = {};
    costs.forEach((c, i) => {
        const d = turnDays[Math.min(i, turnDays.length - 1)];
        spend[d] = (spend[d] || 0) + Math.max(0, c - (i ? costs[i - 1] : 0));
    });
    const util = events.filter((e) => e.type === 'rate_limit_event').map((e) => e.rate_limit_info?.unifiedWindows?.seven_day?.utilization).filter((v) => typeof v === 'number');
    const exitCode = readT(join(dir, 'exit.txt')).trim();
    const finalText = results.length ? String(results[results.length - 1].result || '') : '';
    const ceiling = existsSync(join(dir, 'handoff.md')) || /context ceiling|handoff\.md/i.test(finalText) && outcomes[outcomes.length - 1] === 'hard-stop';
    const overTime = results.some((r) => (r.duration_ms || 0) > TIME_LIMIT_MS);
    const final = outcomes[outcomes.length - 1] || 'none';
    let stop;
    if (ceiling) stop = 'ceiling';
    else if (!results.length || exitCode !== '0' || outcomes.includes('blocked') || overTime || final === 'unparsed') stop = 'unplanned';
    else if (final === 'question') stop = 'question';
    else stop = 'planned';
    const p = PROMPTS.get(id);
    const isDirect = (() => { try { return JSON.parse(readT(join(dir, 'result.json'))).kind === 'direct'; } catch { return false; } })();
    LANE_ROWS.push({
        id, day: localDay(started), kind: isDirect ? 'merge' : p ? p.kind : 'unknown', model: init?.model || 'unknown',
        tier: (readT(join(dir, 'tier.txt')).split(/\s/)[0]) || '', front: p?.front || '', chat: p?.chat || '',
        calls: ctx.length, firstTotal: ctx[0], firstCacheRead: first.cache_read_input_tokens || 0,
        firstCreation: (first.cache_creation_input_tokens || 0) + (first.input_tokens || 0),
        input1Bytes: existsSync(join(dir, 'input-1.md')) ? statSync(join(dir, 'input-1.md')).size : null,
        peak: Math.max(...ctx), runs: results.length, final, stop, overTime: overTime ? 1 : 0, exitCode,
        resumes: resumeCls.length, corrective: resumeCls.filter((c) => c === 'corrective').length,
        goResumes: resumeCls.filter((c) => c === 'go').length, recovery: resumeCls.filter((c) => c === 'recovery').length,
        cost: costs.length ? Math.max(...costs) : 0, spend, utilMax: util.length ? Math.max(...util) : null,
        exitDay: localDay(exitMs), exitMs, promptPath: p?.path || '', corregge: p?.corregge || '',
    });
}

// ---------- log entries (active, archive, inboxes at REF) ----------
const logPaths = ['docs/claude-code-log.md', 'docs/claude-code-log-archive.md',
    ...git('ls-tree', '--name-only', REF, 'docs/log-inbox/').split('\n').filter((p) => p.endsWith('.md'))];
const SENTINEL = /^(—|–|-|none|n\/a|nessun[oa]?|nothing)?\s*\.?$/i;
const ENTRIES = new Map();
catFiles(logPaths.map((p) => `${REF}:${p}`)).forEach((t, i) => {
    for (const part of (t || '').split(/\n(?=## \d{4}-\d\d-\d\d)/)) {
        const m = /^## (\d{4}-\d\d-\d\d)([^\n]*)/.exec(part);
        if (!m) continue;
        const key = m[0] + '|' + ((/\*\*Prompt document name\*\*:\s*(.*)/.exec(part) || [])[1] || '');
        if (ENTRIES.has(key)) continue;
        const ticket = /ticket:/i.test(m[2]);
        const corr = (/\*\*Corregge\*\*:\s*(.*)/.exec(part) || [])[1];
        const causa = (/\*\*Causa\*\*:\s*\(?([a-g])\b/.exec(part) || [])[1] || '';
        const outcome = (/\*\*Outcome\*\*:\s*(\S+)/.exec(part) || [])[1] || '';
        ENTRIES.set(key, { day: m[1], ticket, hasCorrField: corr !== undefined, corr: corr !== undefined && !SENTINEL.test(corr.replace(/[`*]/g, '').trim()), causa, outcome, src: logPaths[i] });
    }
});
const TASKS = [...ENTRIES.values()].filter((e) => !e.ticket);

// ---------- daily git snapshots ----------
function dailyShas(path) {
    const last = {};
    for (const l of git('log', REF, '--first-parent', '--format=%H %aI', '--', path).split('\n')) {
        if (!l) continue;
        const [sha, at] = l.split(' ');
        const d = at.slice(0, 10);
        if (!last[d]) last[d] = sha; // newest first: the first seen is the day's last
    }
    return last;
}
function carryForward(byDay, fn) {
    const out = {};
    let cur = null;
    const keys = Object.keys(byDay).sort();
    let k = 0;
    while (k < keys.length && keys[k] < SERIES_FROM) cur = byDay[keys[k++]];
    for (const d of DAYS) {
        while (k < keys.length && keys[k] <= d) cur = byDay[keys[k++]];
        out[d] = cur === null ? null : fn(cur);
    }
    return out;
}
const logShas = dailyShas('docs/claude-code-log.md');
const logDays = Object.keys(logShas).sort();
const logBlobs = catFiles(logDays.map((d) => `${logShas[d]}:docs/claude-code-log.md`));
const logState = {};
logDays.forEach((d, i) => {
    const t = logBlobs[i] || '';
    logState[d] = { entries: (t.match(/^## \d{4}-\d\d-\d\d/gm) || []).length, bytes: Buffer.byteLength(t) };
});
const logDaily = carryForward(logState, (s) => s);

const decShas = dailyShas('docs/decisions.md');
const decDays = Object.keys(decShas).sort();
const decBlobs = catFiles(decDays.map((d) => `${decShas[d]}:docs/decisions.md`));
const ROW = /^\s*- \*\*([A-Z]+(?:-[A-Z]+)?-\d+(?:-bis)?)\*\*([^\n]*)/gm;
const decState = {};
const registered = {};
decDays.forEach((d, i) => {
    const t = decBlobs[i] || '';
    let provisional = 0;
    const ids = new Set();
    for (const m of t.matchAll(ROW)) {
        ids.add(m[1]);
        if (/provisional/i.test(m[2]) && !/ratified (by digest|by Alfonso)/i.test(m[2])) provisional++;
        if (!registered[m[1]]) registered[m[1]] = d;
    }
    decState[d] = { ids, provisional };
});
// Ids first cited in a memo, session file or prompt, by the add date of the citing file.
const cited = {};
{
    let date = null;
    const added = [];
    for (const l of git('log', REF, '--diff-filter=A', '--name-only', '--format=C %aI', '--', 'docs/ratifiche', 'docs/sessioni', 'docs/prompts').split('\n')) {
        if (l.startsWith('C ')) date = l.slice(2, 12);
        else if (l.endsWith('.md')) added.push([l, date]);
    }
    const blobs = catFiles(added.map(([p]) => `${REF}:${p}`));
    added.forEach(([, d], i) => {
        for (const m of (blobs[i] || '').matchAll(/\b(RC-\d+|AM-\d+)\b/g)) if (!cited[m[1]] || d < cited[m[1]]) cited[m[1]] = d;
    });
}
const regLag = Object.keys(cited).filter((id) => id.startsWith('RC-')).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)))
    .map((id) => ({ id, cited: cited[id], registered: registered[id] || '', lagDays: registered[id] ? Math.max(0, (dayMs(registered[id]) - dayMs(cited[id])) / DAY) : null }));
const decDaily = carryForward(decState, (s) => s);

// ---------- daily series ----------
const lanesByDay = (d) => LANE_ROWS.filter((r) => r.day === d);
const stalePrompts = (d) => {
    const end = dayMs(d) + DAY;
    let n = 0;
    for (const r of LANE_ROWS) {
        const p = PROMPTS.get(r.id);
        if (!p || r.kind === 'merge' || r.exitMs > end - DAY) continue;
        const flip = p.flipped ? Date.parse(p.flipped) : Infinity;
        if (flip > end && (!p.added || Date.parse(p.added) <= end)) n++;
    }
    return n;
};
const DAILY = DAYS.map((d) => {
    const lanes = lanesByDay(d);
    const spend = LANE_ROWS.reduce((a, r) => a + (r.spend[d] || 0), 0);
    const utils = lanes.map((r) => r.utilMax).filter((v) => v !== null);
    const lanesDefined = d >= '2026-09-26';
    return {
        day: d, week: isoWeek(d),
        logEntries: logDaily[d]?.entries ?? null, logBytes: logDaily[d]?.bytes ?? null,
        decisionRows: decDaily[d] ? decDaily[d].ids.size : null, provisionalRows: decDaily[d]?.provisional ?? null,
        rcCitedUnregistered: regLag.filter((x) => x.cited <= d && (!x.registered || x.registered > d)).length,
        stalePrompts: lanesDefined ? stalePrompts(d) : null,
        lanes: lanesDefined ? lanes.length : null, spendUsd: lanesDefined ? spend : null,
        sevenDayUtilMax: utils.length ? Math.max(...utils) : null,
    };
});
csv('daily.csv', Object.keys(DAILY[0]), DAILY);

// ---------- S5: interleaving on a front ----------
const byFront = {};
for (const p of PROMPTS.values()) if (p.front && p.chat && p.added) (byFront[p.front] ||= []).push(p);
const S5 = [];
const sameChatGaps = [];
for (const [front, list] of Object.entries(byFront)) {
    list.sort((a, b) => (a.added < b.added ? -1 : a.added > b.added ? 1 : a.pid < b.pid ? -1 : 1));
    for (let i = 1; i < list.length; i++) {
        const cur = list[i];
        const prev = list[i - 1];
        const gapHours = (Date.parse(cur.added) - Date.parse(prev.added)) / 3600000;
        if (prev.chat === cur.chat) { sameChatGaps.push(gapHours); continue; }
        const backBefore = list.slice(0, i - 1).some((x) => x.chat === cur.chat);
        S5.push({ front, at: cur.added, day: cur.added.slice(0, 10), from: prev.chat, to: cur.chat, gapHours, interleave: backBefore ? 1 : 0, prompt: cur.pid });
    }
}
/** The window of S5b: the median gap between two prompts of the same chat on the same front, its working cadence. */
const S5_WINDOW_H = median(sameChatGaps);
for (const x of S5) x.short = x.gapHours < S5_WINDOW_H ? 1 : 0;
csv('s5_front_switches.csv', ['front', 'at', 'day', 'from', 'to', 'gapHours', 'interleave', 'short', 'prompt'], S5);
const chatsFirstPrompt = {};
for (const p of PROMPTS.values()) if (p.chat && p.added) if (!chatsFirstPrompt[p.chat] || p.added < chatsFirstPrompt[p.chat]) chatsFirstPrompt[p.chat] = p.added;

// ---------- weekly series ----------
const inWeek = (d, m) => d >= m && d <= addDays(m, 6);
const WEEKLY = WEEKS.map((m) => {
    const t = TASKS.filter((e) => inWeek(e.day, m) && e.day >= '2026-08-02');
    const l = LANE_ROWS.filter((r) => inWeek(r.day, m));
    const lm = l.filter((r) => r.kind !== 'merge');
    const cause = {};
    for (const c of 'abcdefg') cause['causa_' + c] = t.filter((e) => e.causa === c).length;
    const days = DAILY.filter((x) => inWeek(x.day, m));
    const maxOf = (k) => { const v = days.map((x) => x[k]).filter((x) => x !== null); return v.length ? Math.max(...v) : null; };
    const lanesDefined = m >= monday('2026-09-26');
    return {
        week: isoWeek(m), monday: m, end: weekEnd(m),
        logTasks: t.length, logCorr: t.filter((e) => e.corr).length, ...cause,
        logBad: t.filter((e) => /❌|⚠/.test(e.outcome)).length,
        lanes: lanesDefined ? l.length : null, lanesNonMerge: lanesDefined ? lm.length : null,
        laneCorrective: lanesDefined ? lm.filter((r) => r.corrective > 0).length : null,
        promptCorregge: lanesDefined ? lm.filter((r) => r.corregge && /P-\d{4}/.test(r.corregge)).length : null,
        stopPlanned: lanesDefined ? l.filter((r) => r.stop === 'planned').length : null,
        stopQuestion: lanesDefined ? l.filter((r) => r.stop === 'question').length : null,
        stopCeiling: lanesDefined ? l.filter((r) => r.stop === 'ceiling').length : null,
        stopUnplanned: lanesDefined ? l.filter((r) => r.stop === 'unplanned').length : null,
        overTime: lanesDefined ? l.filter((r) => r.overTime).length : null,
        firstCtxMedian: lanesDefined ? median(lm.map((r) => r.firstTotal)) : null,
        firstCacheReadMedian: lanesDefined ? median(lm.map((r) => r.firstCacheRead)) : null,
        firstCreationMedian: lanesDefined ? median(lm.map((r) => r.firstCreation)) : null,
        peakMedian: lanesDefined ? median(lm.map((r) => r.peak)) : null,
        peakOver200k: lanesDefined ? lm.filter((r) => r.peak >= 200000).length : null,
        spendUsd: lanesDefined ? days.reduce((a, x) => a + (x.spendUsd || 0), 0) : null,
        sevenDayUtilMax: maxOf('sevenDayUtilMax'),
        logEntriesMax: maxOf('logEntries'), provisionalMax: maxOf('provisionalRows'),
        rcUnregisteredMax: maxOf('rcCitedUnregistered'), stalePromptsMax: maxOf('stalePrompts'),
        s5Switches: m >= monday('2026-10-10') ? S5.filter((x) => inWeek(x.day, m)).length : null,
        s5Interleaves: m >= monday('2026-10-10') ? S5.filter((x) => inWeek(x.day, m) && x.interleave).length : null,
        s5Short: m >= monday('2026-10-10') ? S5.filter((x) => inWeek(x.day, m) && x.short && !x.interleave).length : null,
        newChats: Object.values(chatsFirstPrompt).filter((a) => inWeek(a.slice(0, 10), m)).length,
    };
});
csv('weekly.csv', Object.keys(WEEKLY[0]), WEEKLY);

// ---------- signals: rolling 4 weeks, ratio of sums ----------
/** Sum over the defined weeks of the window (no imputation: an undefined week adds nothing); null when none is defined. */
const roll = (i, k) => { const w = WEEKLY.slice(Math.max(0, i - 3), i + 1).filter((x) => x[k] !== null); return w.length ? w.reduce((a, x) => a + x[k], 0) : null; };
const ratio = (num, den, minN) => (i) => { const d = roll(i, den); const n = roll(i, num); return d === null || n === null || d < minN ? null : n / d; };
const level = (k) => (i) => WEEKLY[i][k];
/**
 * targets: the incident classes a signal is meant to anticipate; its quiet weeks are the weeks clear of those
 * incidents. rule: a threshold fixed by a ratified rule, used as is (never tuned); without one, the threshold is
 * the maximum of the signal over its quiet weeks of the tuning period, so it stays silent there by construction.
 */
const SIGNALS = [
    { id: 'S1a', name: 'log rework share (Corregge filled / task entries), rolling 4w', f: ratio('logCorr', 'logTasks', 10), targets: ['execution', 'governance hygiene'] },
    { id: 'S1b', name: 'non-merge lanes with a corrective resume / non-merge lanes, rolling 4w', f: ratio('laneCorrective', 'lanesNonMerge', 10), targets: ['execution'] },
    { id: 'S2', name: 'unplanned stops / lanes, rolling 4w', f: ratio('stopUnplanned', 'lanes', 10), targets: ['execution', 'cost'] },
    { id: 'S2t', name: 'lanes with a turn over the 90-minute limit, rolling 4w count', f: (i) => roll(i, 'overTime'), targets: ['execution', 'cost'], rule: { value: 0, source: 'RC-20 (90 minutes)' } },
    { id: 'S2c', name: 'ceiling stops / lanes, rolling 4w', f: ratio('stopCeiling', 'lanes', 10), targets: ['harness weight', 'cost'] },
    { id: 'S3a', name: 'weekly median first-call context, non-merge lanes', f: level('firstCtxMedian'), targets: ['harness weight', 'cost'] },
    { id: 'S3b', name: 'non-merge lanes with peak context >= 200k, weekly count', f: level('peakOver200k'), targets: ['harness weight', 'cost'], rule: { value: 0, source: 'RC-51 soft ceiling (200k)' } },
    { id: 'S4a', name: 'active log entries, weekly max', f: level('logEntriesMax'), targets: ['governance hygiene', 'harness weight'], rule: { value: (end) => (end < '2026-08-18' ? 20 : 40), source: 'P9 rotation threshold in force (20, then 40 from 2026-08-18)' } },
    { id: 'S4b', name: 'RC ids cited in a memo, session or prompt and not yet a row of decisions.md, weekly max', f: level('rcUnregisteredMax'), targets: ['governance hygiene'] },
    { id: 'S4c', name: 'provisional decision rows waiting, weekly max', f: level('provisionalMax'), targets: ['governance hygiene'] },
    { id: 'S4d', name: 'prompts still da eseguire more than a day after their lane closed, weekly max', f: level('stalePromptsMax'), targets: ['governance hygiene', 'execution'], rule: { value: 0, source: 'P13 / RC-17 (Status flips in the closing commit)' } },
    { id: 'S5', name: 'front interleavings (a chat emits on a front again after another chat did), rolling 4w', f: (i) => roll(i, 's5Interleaves'), targets: ['coordination'], rule: { value: 0, source: 'RC-33 (one chat per front)' } },
    { id: 'S5b', name: `front switches within the same-chat cadence (gap < ${S5_WINDOW_H === null ? 'n/a' : S5_WINDOW_H.toFixed(2)} h), not interleavings, rolling 4w`, f: (i) => roll(i, 's5Short'), targets: ['coordination'] },
    { id: 'S6', name: 'lane spend USD (list-price weight), rolling 4w', f: (i) => roll(i, 'spendUsd'), targets: ['cost'] },
    { id: 'S6u', name: 'seven-day plan utilization, weekly max of the rate-limit readings of the lanes', f: level('sevenDayUtilMax'), targets: ['cost'] },
];
const MARGIN_BEFORE = 21;
const MARGIN_AFTER = 7;
const nearOf = (targets) => (m) => INCIDENTS.some((inc) => targets.includes(inc.cls) && !(weekEnd(m) < addDays(inc.noticed, -MARGIN_BEFORE) || m > addDays(inc.noticed, MARGIN_AFTER)));
const periodOf = (d) => (d >= TUNE[0] && d <= TUNE[1] ? 'tune' : d >= EVAL[0] && d <= EVAL[1] ? 'eval' : null);
const SERIES = [];
const BACKTEST = [];
const CATALOGUE = [];
for (const s of SIGNALS) {
    const near = nearOf(s.targets);
    const vals = WEEKS.map((_, i) => s.f(i));
    const quiet = WEEKS.map((m) => !near(m));
    const tuneQuiet = WEEKS.map((m, i) => (periodOf(weekEnd(m)) === 'tune' && quiet[i] && vals[i] !== null ? vals[i] : null)).filter((v) => v !== null);
    // Without a quiet tuning week, the fallback is the 75th percentile of the defined tuning weeks (at least three).
    const tuneAll = WEEKS.map((m, i) => (periodOf(weekEnd(m)) === 'tune' ? vals[i] : null)).filter((v) => v !== null).sort((a, b) => a - b);
    const p75 = tuneAll.length >= 3 ? tuneAll[Math.ceil(0.75 * tuneAll.length) - 1] : null;
    const tuned = tuneQuiet.length ? Math.max(...tuneQuiet) : p75;
    const tunedFrom = tuneQuiet.length ? 'max over quiet tuning weeks' : p75 !== null ? 'p75 of tuning weeks (no quiet week)' : 'none: fewer than 3 tuning weeks';
    // A week is a hit when a target incident is noticed within MARGIN_BEFORE days after its end.
    const hitWeek = (m) => INCIDENTS.some((inc) => s.targets.includes(inc.cls) && inc.noticed >= weekEnd(m) && inc.noticed <= addDays(weekEnd(m), MARGIN_BEFORE));
    const thr = (m) => (s.rule ? (typeof s.rule.value === 'function' ? s.rule.value(weekEnd(m)) : s.rule.value) : tuned);
    const fireAt = WEEKS.map((m, i) => vals[i] !== null && thr(m) !== null && vals[i] > thr(m));
    WEEKS.forEach((m, i) => SERIES.push({ signal: s.id, week: isoWeek(m), end: weekEnd(m), value: vals[i], threshold: thr(m), fired: fireAt[i] ? 1 : 0, quiet: quiet[i] ? 1 : 0 }));
    const fires = WEEKS.filter((_, i) => fireAt[i]).map(weekEnd);
    const stat = { tune: { def: 0, quiet: 0, fa: 0, inc: 0, caught: 0, hitWeeks: 0, fireWeeks: 0, fireHits: 0 }, eval: { def: 0, quiet: 0, fa: 0, inc: 0, caught: 0, hitWeeks: 0, fireWeeks: 0, fireHits: 0 } };
    WEEKS.forEach((m, i) => {
        const per = periodOf(weekEnd(m));
        if (!per || vals[i] === null) return;
        stat[per].def++;
        if (hitWeek(m)) stat[per].hitWeeks++;
        if (fireAt[i]) { stat[per].fireWeeks++; if (hitWeek(m)) stat[per].fireHits++; }
        if (!quiet[i]) return;
        stat[per].quiet++;
        if (fireAt[i]) stat[per].fa++;
    });
    for (const inc of INCIDENTS) {
        const per = periodOf(inc.noticed);
        const from = addDays(inc.noticed, -MARGIN_BEFORE);
        const defined = WEEKS.some((m, i) => weekEnd(m) >= from && weekEnd(m) <= inc.noticed && vals[i] !== null);
        const fire = fires.find((f) => f >= from && f <= inc.noticed) || null;
        const target = s.targets.includes(inc.cls);
        if (per && defined && target) {
            stat[per].inc++;
            if (fire) stat[per].caught++;
        }
        BACKTEST.push({ signal: s.id, incident: inc.id, cls: inc.cls, target: target ? 1 : 0, period: per || 'before', defined: defined ? 1 : 0, fired: fire ? 1 : 0, fireDate: fire || '', leadDays: fire ? (dayMs(inc.noticed) - dayMs(fire)) / DAY : null });
    }
    CATALOGUE.push({ signal: s.id, name: s.name, targets: s.targets.join('+'), threshold: s.rule ? (typeof s.rule.value === 'function' ? 'rule (by date)' : s.rule.value) : tuned, thresholdFrom: s.rule ? s.rule.source : tunedFrom,
        tuneWeeksDefined: stat.tune.def, tuneQuietWeeks: stat.tune.quiet, tuneFalseAlarms: stat.tune.fa, tuneTargetIncidents: stat.tune.inc, tuneCaught: stat.tune.caught,
        evalWeeksDefined: stat.eval.def, evalQuietWeeks: stat.eval.quiet, evalFalseAlarms: stat.eval.fa, evalTargetIncidents: stat.eval.inc, evalCaught: stat.eval.caught,
        tuneBaseRate: stat.tune.def ? stat.tune.hitWeeks / stat.tune.def : null, tuneFireWeeks: stat.tune.fireWeeks, tunePrecision: stat.tune.fireWeeks ? stat.tune.fireHits / stat.tune.fireWeeks : null,
        evalBaseRate: stat.eval.def ? stat.eval.hitWeeks / stat.eval.def : null, evalFireWeeks: stat.eval.fireWeeks, evalPrecision: stat.eval.fireWeeks ? stat.eval.fireHits / stat.eval.fireWeeks : null,
        fires: fires.length, firstFire: fires[0] || '' });
}
csv('signal_series.csv', ['signal', 'week', 'end', 'value', 'threshold', 'fired', 'quiet'], SERIES);
csv('backtest.csv', ['signal', 'incident', 'cls', 'target', 'period', 'defined', 'fired', 'fireDate', 'leadDays'], BACKTEST);
csv('catalogue.csv', Object.keys(CATALOGUE[0]), CATALOGUE);

// ---------- stratified tables ----------
const strat = {};
for (const r of LANE_ROWS) {
    const k = [isoWeek(r.day), r.kind, r.model].join('|');
    (strat[k] ||= []).push(r);
}
csv('lanes_by_week_kind_model.csv', ['week', 'kind', 'model', 'n', 'firstCtxMedian', 'firstCacheReadMedian', 'firstCreationMedian', 'peakMedian', 'peakOver200k', 'unplanned', 'ceiling', 'question', 'corrective', 'costMedian'],
    Object.keys(strat).sort().map((k) => {
        const g = strat[k];
        const [week, kind, model] = k.split('|');
        return { week, kind, model, n: g.length, firstCtxMedian: median(g.map((r) => r.firstTotal)), firstCacheReadMedian: median(g.map((r) => r.firstCacheRead)),
            firstCreationMedian: median(g.map((r) => r.firstCreation)), peakMedian: median(g.map((r) => r.peak)), peakOver200k: g.filter((r) => r.peak >= 200000).length,
            unplanned: g.filter((r) => r.stop === 'unplanned').length, ceiling: g.filter((r) => r.stop === 'ceiling').length, question: g.filter((r) => r.stop === 'question').length,
            corrective: g.filter((r) => r.corrective > 0).length, costMedian: median(g.map((r) => r.cost)) };
    }));
csv('lanes.csv', ['id', 'day', 'kind', 'model', 'tier', 'front', 'chat', 'calls', 'firstTotal', 'firstCacheRead', 'firstCreation', 'input1Bytes', 'peak', 'runs', 'final', 'stop', 'overTime', 'exitCode', 'resumes', 'corrective', 'goResumes', 'recovery', 'cost', 'utilMax', 'exitDay'], LANE_ROWS);
csv('rc_registration_lag.csv', ['id', 'cited', 'registered', 'lagDays'], regLag);
csv('incidents.csv', ['id', 'what', 'started', 'noticed', 'cls'], INCIDENTS);
csv('meta.csv', ['key', 'value'], [
    { key: 'ref', value: REF }, { key: 'incidentsRef', value: FREEZE }, { key: 'cutoff', value: new Date(CUTOFF).toISOString() },
    { key: 'lanes', value: LANE_ROWS.length }, { key: 'lanesSkippedRunning', value: lanesSkipped.running }, { key: 'lanesSkippedAfterCutoff', value: lanesSkipped.afterCutoff },
    { key: 'lanesSkippedNoCalls', value: lanesSkipped.noCalls }, { key: 'prompts', value: PROMPTS.size }, { key: 'logEntries', value: ENTRIES.size },
    { key: 'logTasks', value: TASKS.length }, { key: 'incidents', value: INCIDENTS.length },
]);

mkdirSync(OUT, { recursive: true });
let total = 0;
const all = createHash('sha256');
for (const name of Object.keys(files).sort()) {
    writeFileSync(join(OUT, name), files[name]);
    total += Buffer.byteLength(files[name]);
    const h = createHash('sha256').update(files[name]).digest('hex');
    all.update(name + ' ' + h + '\n');
    process.stdout.write(`${h.slice(0, 16)}  ${name}  ${Buffer.byteLength(files[name])} B\n`);
}
process.stdout.write(`total ${total} B  combined sha256 ${all.digest('hex')}\n`);
