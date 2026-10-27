/**
 * auto-intake.mjs: the deterministic core of issue-driven unattended lanes
 * (RC-35..RC-39, docs/decisions.md; design in the discovery report of
 * P-2026-10-03-1705, docs/discovery/discovery_2026-10-03_auto_intake.md, section 9).
 *
 * The nightly driver (a chat) calls it through osascript and acts on the last
 * line it prints. It writes only under ~/.jjodel-lanes/auto/ and
 * ~/.jjodel-lanes/pending/ (cut adds one worktree and its branch); it never
 * writes on GitHub, never pushes, never merges. No value from an issue reaches a
 * command through string interpolation: every argument travels as argv. No
 * title or body is ever printed: stdout carries numbers, verdicts, reasons,
 * paths and ids.
 *
 *   queue        open issues with the intake label: a pull request is dropped;
 *                a skip label skips; the latest `labeled` event of the label
 *                must have an allowlisted actor; a title (`renamed` event) or
 *                body (GraphQL lastEditedAt) edited at or after it refuses;
 *                hidden content parks; an attempt already recorded for that
 *                event id refuses; else ready (RC-35). Writes
 *                auto/<night>/queue.json, prints one line per issue.
 *   render <issue> [--out <dir>]
 *                without --out: the issue must be ready in tonight's queue and
 *                unchanged since (body hash); the attempt is recorded in
 *                auto/attempts.json, then the prompt is rendered from
 *                lane-templates/issue-discovery.md into pending/ with a fresh
 *                Prompt-ID (the next free minute) and auto/<night>/issue-<n>/
 *                render.json written. With --out: a dry render into <dir>, no
 *                queue, no attempt, `Status: dry render, not launchable` (which
 *                lane-run start --auto refuses). Hidden content parks instead.
 *                The issue text sits only in the last section, in a fence one
 *                backtick longer than its longest run, cut at dataCap with the
 *                cut stated; the Lane line comes from laneByMode of the mode,
 *                the Front line from front (maintenance when absent; P13, RC-44).
 *   cut <issue>  the worktree ~/jjodel-a-<n> on branch auto/<n>-<slug> of the
 *                render, from the trunk tip; frontend/node_modules linked to the
 *                shared one (P14); the base sha in issue-<n>/base.txt.
 *   admit [--explain]
 *                `admit`, `admit: one light discovery lane (stale reading: ...)`
 *                or `deny: <reason>` by RC-38: trip file, night window (with
 *                the residual minimum before its end), kill switch (trips the
 *                night only when read during it), staleness, pace, ceiling,
 *                reset guard, nightly delta against baseline.json (written once
 *                per night inside the window), lane time, parallel cap.
 *                --explain prints every reading and check first.
 *   guard --predicted <report.md> | guard <worktree> [--base <rev>]
 *                `pass` or `park: <reasons>` on the guarded paths of RC-36: the
 *                predicted DOVE of the report's `Auto-intake:` line, or the
 *                branch against its base (--base, else base.txt of its render,
 *                else the merge base with the trunk), committed, uncommitted,
 *                untracked and ignored files alike.
 *   ledger [--night|--week]
 *                the automatic lanes (auto.json) of the night or of the last 7
 *                days: time, cost and tokens (the last cumulative value of the
 *                session), utilization before and after, GOAHEAD when a
 *                goahead.txt is there.
 *   trip <reason>
 *                writes trip.json of the current night (the next one outside the
 *                window) by hand; works with any configuration.
 *
 * Every subcommand exits 0 with its verdict on stdout, refusals included
 * (`refused: ...`), since an osascript `do shell script` drops the output of a
 * non-zero exit; bad usage exits 2. The configuration is auto-intake.config.json
 * beside this file; "live" mode is refused without ratifiedBy and ratifiedOn.
 *
 * AUTO_INTAKE_NOW=YYYY-MM-DDTHH:mm stands in for the clock, AUTO_INTAKE_LANES_DIR
 * for ~/.jjodel-lanes, AUTO_INTAKE_CONFIG for the configuration, AUTO_INTAKE_REPO
 * for the tree of the trunk (default: the tree of this file), AUTO_INTAKE_GH for
 * gh (default: the PATH, then /opt/homebrew/bin and /usr/local/bin).
 *
 * Plain ES module, nothing outside node:* and the critical-zone hook beside it.
 * Run by: ~/.local/bin/node <tree>/frontend/scripts/auto-intake.mjs <command> ...
 */

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { accessSync, constants, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, renameSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, delimiter, dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CRITICAL_FILES, D_LAYER_CREATORS, SYNC_DIR, SYNC_TOKEN } from './hooks/critical-zone.mjs';

const SELF = fileURLToPath(import.meta.url);
const HERE = dirname(SELF);
const TEMPLATE = join(HERE, 'lane-templates', 'issue-discovery.md');
const DEFAULT_CONFIG = join(HERE, 'auto-intake.config.json');
const PROMPT_ID = /^P-\d{4}-\d{2}-\d{2}-\d{4}$/;
const VERDICT_LINE = /^Auto-intake: verdict=(auto-eligible|needs-design|critical); dove=(-|[^\s,;]+(?:,[^\s,;]+)*)$/;
const SLUG = /^[a-z0-9-]{1,40}$/;
const MINUTE = 60000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MINT_TRIES = 60;
const REASONS_MAX = 20;
const DEFAULT_WINDOW = { start: '01:00', end: '07:00' };
const LIVE_REFUSAL = 'live mode needs ratifiedBy and ratifiedOn in the configuration (RC-39)';

class Usage extends Error {}
class Refused extends Error {}
class GhUnavailable extends Error {}

const usage = (m) => {
    throw new Usage(m);
};
const refused = (m) => {
    throw new Refused(m);
};

// ── small helpers ────────────────────────────────────────────────────────────

const pad2 = (n) => String(n).padStart(2, '0');
const ymd = (d) => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
const hm = (d) => pad2(d.getHours()) + ':' + pad2(d.getMinutes());
const when = (ms) => (Number.isFinite(ms) ? ymd(new Date(ms)) + ' ' + hm(new Date(ms)) : '-');
const f2 = (x) => (typeof x === 'number' && Number.isFinite(x) ? x.toFixed(2) : '-');
/** A path or name for stdout: bare when it holds only safe characters, else JSON-quoted. */
const safe = (s) => (/^[\w./@+-]+$/.test(String(s)) ? String(s) : JSON.stringify(String(s)));
const hashOf = (title, body) => createHash('sha256').update(String(title ?? '') + '\n' + String(body ?? '')).digest('hex');

function readTrim(path) {
    return existsSync(path) ? readFileSync(path, 'utf8').trim() : '';
}

function readJson(path, fallback = null) {
    if (!existsSync(path)) return fallback;
    try {
        return JSON.parse(readFileSync(path, 'utf8'));
    } catch {
        refused(path + ' does not parse');
    }
}

/** JSON written whole or not at all: a temporary file renamed over the target. */
function writeJson(path, value) {
    mkdirSync(dirname(path), { recursive: true });
    const tmp = path + '.tmp-' + process.pid;
    writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n');
    renameSync(tmp, path);
}

function isExecutable(path) {
    try {
        accessSync(path, constants.X_OK);
        return statSync(path).isFile();
    } catch {
        return false;
    }
}

function isAlive(pid) {
    if (!Number.isInteger(pid) || pid <= 0) return false;
    try {
        process.kill(pid, 0);
        return true;
    } catch (err) {
        return err.code === 'EPERM';
    }
}

function option(rest, name) {
    const at = rest.indexOf(name);
    if (at === -1) return null;
    const v = rest[at + 1];
    if (v === undefined || v.startsWith('--')) usage(name + ' needs a value');
    return v;
}

function issueArg(v, cmd) {
    if (!v || !/^[1-9]\d{0,8}$/.test(v)) usage('usage: auto-intake ' + cmd + ' <issue number>');
    return Number(v);
}

/** The local clock, or AUTO_INTAKE_NOW=YYYY-MM-DDTHH:mm. */
export function clock() {
    const v = process.env.AUTO_INTAKE_NOW;
    if (!v) return new Date();
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(v);
    if (!m) usage('AUTO_INTAKE_NOW is not YYYY-MM-DDTHH:mm: ' + v);
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
}

const lanesDir = () => process.env.AUTO_INTAKE_LANES_DIR || join(homedir(), '.jjodel-lanes');
const autoDir = () => join(lanesDir(), 'auto');
const nightDir = (night) => join(autoDir(), night.id);
const attemptsFile = () => join(autoDir(), 'attempts.json');

function git(cwd, args) {
    const r = spawnSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
    if (r.error) refused('git ' + args[0] + ': ' + r.error.message);
    return { status: r.status, out: r.stdout ?? '', err: (r.stderr ?? '').trim() };
}

/** The tree of the trunk: AUTO_INTAKE_REPO, else the git tree this file lives in; null when neither. */
function repoDir() {
    const v = process.env.AUTO_INTAKE_REPO;
    if (v) return resolve(v);
    const r = git(HERE, ['rev-parse', '--show-toplevel']);
    return r.status === 0 ? r.out.trim() : null;
}

// ── configuration ────────────────────────────────────────────────────────────

const CONFIG_KEYS = ['repository', 'trunk', 'intakeLabel', 'skipLabels', 'allowlist', 'nightWindow', 'mode', 'laneByMode', 'dataCap', 'budget', 'ratifiedBy', 'ratifiedOn'];
// Optional keys: `front`, the slug of docs/harness/fronts.json the rendered prompt names (P13, RC-44).
const OPTIONAL_KEYS = ['front'];
const DEFAULT_FRONT = 'maintenance';
const BUDGET = {
    paceMargin: [0, 1], ceiling: [0, 1], resetGuardHours: [0, 168], nightlyDelta: [0, 1], nightMinutes: [1, 1440],
    residualMinutes: [0, 1440], laneLimitMinutes: [1, 1440], parallelCap: [1, 8], fiveHourCeiling: [0, 1], staleHours: [0, 168],
};
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const isStr = (v) => typeof v === 'string' && v.trim() !== '';

/** What is wrong with a configuration: an empty list when nothing is. */
export function configProblems(c) {
    if (!c || typeof c !== 'object' || Array.isArray(c)) return ['not an object'];
    const p = [];
    for (const k of Object.keys(c)) if (!CONFIG_KEYS.includes(k) && !OPTIONAL_KEYS.includes(k)) p.push('unknown key ' + k);
    for (const k of CONFIG_KEYS) if (!(k in c)) p.push('missing key ' + k);
    if ('repository' in c && !(typeof c.repository === 'string' && /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(c.repository))) p.push('repository is not owner/name');
    if ('trunk' in c && !(typeof c.trunk === 'string' && /^[A-Za-z0-9._/-]+$/.test(c.trunk))) p.push('trunk is not a branch name');
    if ('intakeLabel' in c && !isStr(c.intakeLabel)) p.push('intakeLabel is not a label');
    if ('skipLabels' in c && !(Array.isArray(c.skipLabels) && c.skipLabels.every(isStr))) p.push('skipLabels is not a list of labels');
    if ('allowlist' in c && !(Array.isArray(c.allowlist) && c.allowlist.length > 0 && c.allowlist.every((x) => typeof x === 'string' && /^[A-Za-z0-9-]+$/.test(x)))) p.push('allowlist is not a non-empty list of logins');
    if ('nightWindow' in c) {
        const w = c.nightWindow;
        if (!(w && HHMM.test(w.start ?? '') && HHMM.test(w.end ?? '') && w.start !== w.end && Object.keys(w).length === 2)) p.push('nightWindow is not {start, end} in HH:mm');
    }
    if ('mode' in c && !['shadow', 'live'].includes(c.mode)) p.push('mode is neither shadow nor live');
    if ('laneByMode' in c) {
        const l = c.laneByMode;
        if (!(l && typeof l === 'object' && Object.keys(l).length === 2 && ['shadow', 'live'].every((m) => typeof l[m] === 'string' && /^[a-z][a-z-]*$/.test(l[m])))) p.push('laneByMode is not {shadow, live} of Lane values');
    }
    if ('front' in c && !(typeof c.front === 'string' && /^[a-z][a-z0-9-]*$/.test(c.front))) p.push('front is not a front slug');
    if ('dataCap' in c && !(Number.isInteger(c.dataCap) && c.dataCap >= 1000 && c.dataCap <= 100000)) p.push('dataCap is not an integer in 1000..100000');
    if ('budget' in c) {
        const b = c.budget;
        if (!b || typeof b !== 'object') p.push('budget is not an object');
        else {
            for (const k of Object.keys(b)) if (!(k in BUDGET)) p.push('unknown key budget.' + k);
            for (const [k, [lo, hi]] of Object.entries(BUDGET)) {
                const v = b[k];
                if (typeof v !== 'number' || !Number.isFinite(v) || v < lo || v > hi) p.push('budget.' + k + ' is not a number in ' + lo + '..' + hi);
            }
            if (!Number.isInteger(b.parallelCap)) p.push('budget.parallelCap is not an integer');
        }
    }
    if ('ratifiedBy' in c && !(c.ratifiedBy === null || isStr(c.ratifiedBy))) p.push('ratifiedBy is neither null nor a name');
    if ('ratifiedOn' in c && !(c.ratifiedOn === null || (typeof c.ratifiedOn === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(c.ratifiedOn)))) p.push('ratifiedOn is neither null nor YYYY-MM-DD');
    return p;
}

function configPath() {
    return process.env.AUTO_INTAKE_CONFIG ? resolve(process.env.AUTO_INTAKE_CONFIG) : DEFAULT_CONFIG;
}

/** The configuration, validated; live mode only with its ratification (RC-39). */
export function loadConfig() {
    const path = configPath();
    let c;
    try {
        c = JSON.parse(readFileSync(path, 'utf8'));
    } catch (err) {
        refused('the configuration ' + path + ' does not parse: ' + (err && err.message ? err.message : String(err)));
    }
    const p = configProblems(c);
    if (p.length) refused('the configuration: ' + p.join('; '));
    if (c.mode === 'live' && !(isStr(c.ratifiedBy) && isStr(c.ratifiedOn))) refused(LIVE_REFUSAL);
    return c;
}

// ── the night ────────────────────────────────────────────────────────────────

/** The night of a moment: the window it falls in, or the next one; named after the date the window starts. */
export function nightOf(d, win) {
    const [sh, sm] = win.start.split(':').map(Number);
    const [eh, em] = win.end.split(':').map(Number);
    const crosses = eh * 60 + em <= sh * 60 + sm;
    for (const off of [-1, 0, 1]) {
        const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() + off, sh, sm);
        const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + off + (crosses ? 1 : 0), eh, em);
        if (d < end) return { id: 'night-' + ymd(start), start: start.getTime(), end: end.getTime(), inside: d >= start, window: win };
    }
    throw new Error('no night window around ' + d.toISOString());
}

/** The window before a night: the same hours, one day earlier. */
function previousNight(n) {
    const s = new Date(n.start);
    const e = new Date(n.end);
    const start = new Date(s.getFullYear(), s.getMonth(), s.getDate() - 1, s.getHours(), s.getMinutes());
    const end = new Date(e.getFullYear(), e.getMonth(), e.getDate() - 1, e.getHours(), e.getMinutes());
    return { id: 'night-' + ymd(start), start: start.getTime(), end: end.getTime(), inside: false, window: n.window };
}

// ── gh: the one function every GitHub read goes through ──────────────────────

function ghPath() {
    if (process.env.AUTO_INTAKE_GH) return process.env.AUTO_INTAKE_GH;
    for (const d of (process.env.PATH || '').split(delimiter)) {
        if (d && isExecutable(join(d, 'gh'))) return join(d, 'gh');
    }
    return ['/opt/homebrew/bin/gh', '/usr/local/bin/gh'].find(isExecutable) ?? null;
}

/** gh with argv as given; its stdout, or GhUnavailable with the first line of its stderr. */
export function gh(args) {
    const path = ghPath();
    if (!path) throw new GhUnavailable('gh is neither on the PATH nor in /opt/homebrew/bin or /usr/local/bin');
    const r = spawnSync(path, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    if (r.error) throw new GhUnavailable(r.error.message);
    if (r.status !== 0) {
        const line = (r.stderr || '').split('\n').map((x) => x.trim()).find((x) => x !== '');
        throw new GhUnavailable((line || 'gh exited ' + r.status).replace(/[^\x20-\x7e]/g, '?'));
    }
    return r.stdout;
}

function ghJson(args) {
    const out = gh(args);
    try {
        return JSON.parse(out);
    } catch {
        throw new GhUnavailable('gh returned no JSON for ' + args.filter((a) => !a.startsWith('query=')).join(' '));
    }
}

const flatPages = (v) => (Array.isArray(v) ? v.flat() : []);
const listingArgs = (c) => ['api', '--paginate', '--slurp', 'repos/' + c.repository + '/issues?state=open&labels=' + encodeURIComponent(c.intakeLabel) + '&per_page=100'];
const eventsArgs = (c, n) => ['api', '--paginate', '--slurp', 'repos/' + c.repository + '/issues/' + n + '/events?per_page=100'];
const issueArgs = (c, n) => ['api', 'repos/' + c.repository + '/issues/' + n];
const EDITED_QUERY = 'query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){issue(number:$number){lastEditedAt}}}';

/** The body's last edit time from GraphQL (a title edit is a `renamed` event and does not set it). */
function lastEditedAt(c, n) {
    const [owner, name] = c.repository.split('/');
    const r = ghJson(['api', 'graphql', '-f', 'query=' + EDITED_QUERY, '-f', 'owner=' + owner, '-f', 'name=' + name, '-F', 'number=' + n]);
    const issue = r && r.data && r.data.repository ? r.data.repository.issue : undefined;
    if (!issue || !('lastEditedAt' in issue)) throw new GhUnavailable('GraphQL returned no lastEditedAt for #' + n);
    return issue.lastEditedAt;
}

// ── intake (RC-35) ───────────────────────────────────────────────────────────

const HIDDEN = [
    ['HTML comment', /<!--/],
    ['zero-width or invisible character', /[­؜᠎​-‏⁠-⁤﻿]/u],
    ['bidirectional control', /[‪-‮⁦-⁩]/u],
    ['tag character', /[\u{E0000}-\u{E007F}]/u],
    ['control character', /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/u],
];

/** The kinds of content the GitHub page does not show; an empty list when none. */
export function hiddenContent(text) {
    return HIDDEN.filter(([, re]) => re.test(String(text ?? ''))).map(([k]) => k);
}

const eventTime = (e) => [Date.parse(e.created_at) || 0, Number(e.id) || 0];
const later = (a, b) => a[0] > b[0] || (a[0] === b[0] && a[1] > b[1]);
const login = (e) => (e && e.actor && typeof e.actor.login === 'string' ? e.actor.login : 'unknown');

/**
 * The verdict of one listed issue (RC-35). `edited` is called only when the
 * label checks pass, so GraphQL is read for those issues alone.
 */
export function intakeVerdict({ issue, events, edited, config, attempts }) {
    if (issue.pull_request) return { verdict: 'drop', reason: 'pull request', labelEvent: null };
    const labels = (issue.labels || []).map((l) => (typeof l === 'string' ? l : l && l.name));
    const skip = config.skipLabels.find((l) => labels.includes(l));
    if (skip) return { verdict: 'skip', reason: 'label ' + skip, labelEvent: null };
    let last = null;
    for (const e of events) {
        if (e && e.event === 'labeled' && e.label && e.label.name === config.intakeLabel && (!last || later(eventTime(e), eventTime(last)))) last = e;
    }
    if (!last) return { verdict: 'refuse', reason: 'no labeled event for ' + config.intakeLabel, labelEvent: null };
    const labelEvent = { id: Number(last.id), actor: login(last), at: last.created_at };
    if (!config.allowlist.includes(labelEvent.actor)) return { verdict: 'refuse', reason: 'labeled by ' + safe(labelEvent.actor) + ', not in the allowlist (event ' + labelEvent.id + ')', labelEvent };
    const rename = events.find((e) => e && e.event === 'renamed' && later(eventTime(e), eventTime(last)));
    if (rename) return { verdict: 'refuse', reason: 'title edited after the label event ' + labelEvent.id + ' (renamed ' + rename.created_at + ')', labelEvent };
    const at = edited();
    if (at && Date.parse(at) >= Date.parse(last.created_at)) return { verdict: 'refuse', reason: 'body edited after the label event ' + labelEvent.id + ' (' + at + ')', labelEvent };
    const hidden = hiddenContent(String(issue.title ?? '') + '\n' + String(issue.body ?? ''));
    if (hidden.length) return { verdict: 'park', reason: 'hidden content (' + hidden.join(', ') + ')', labelEvent };
    const prior = attempts[String(labelEvent.id)];
    if (prior) return { verdict: 'refuse', reason: 'attempt already made for label event ' + labelEvent.id + ' (' + prior.promptId + ', ' + prior.night + ')', labelEvent };
    return { verdict: 'ready', reason: 'labeled by ' + labelEvent.actor + ' (event ' + labelEvent.id + ')', labelEvent };
}

function cmdQueue(rest) {
    if (rest.length) usage('usage: auto-intake queue');
    const config = loadConfig();
    const night = nightOf(clock(), config.nightWindow);
    const file = join(nightDir(night), 'queue.json');
    const attempts = readJson(attemptsFile(), {});
    const record = { night: night.id, at: clock().toISOString(), repository: config.repository, label: config.intakeLabel, mode: config.mode, items: [] };
    try {
        const list = flatPages(ghJson(listingArgs(config)));
        for (const issue of list) {
            if (!issue || !Number.isInteger(issue.number) || issue.number <= 0) continue;
            const n = issue.number;
            const v = issue.pull_request || config.skipLabels.some((l) => (issue.labels || []).some((x) => (x && x.name) === l))
                ? intakeVerdict({ issue, events: [], edited: () => null, config, attempts })
                : intakeVerdict({ issue, events: flatPages(ghJson(eventsArgs(config, n))), edited: () => lastEditedAt(config, n), config, attempts });
            record.items.push({ number: n, title: String(issue.title ?? ''), bodyHash: hashOf(issue.title, issue.body), labelEvent: v.labelEvent, verdict: v.verdict, reason: v.reason });
        }
    } catch (err) {
        if (!(err instanceof GhUnavailable)) throw err;
        record.error = err.message;
        writeJson(file, record);
        console.log('gh-unavailable: ' + err.message);
        console.log('file: ' + file);
        return 0;
    }
    writeJson(file, record);
    const ready = record.items.filter((x) => x.verdict === 'ready').length;
    console.log('queue: ' + night.id + ', ' + record.items.length + ' issues, ' + ready + ' ready (' + config.mode + ' mode)');
    for (const x of record.items) console.log('#' + x.number + ' ' + x.verdict + ': ' + x.reason);
    console.log('file: ' + file);
    return 0;
}

// ── render ───────────────────────────────────────────────────────────────────

/** The branch slug of a title: [a-z0-9-]{1,40}, `issue` when nothing survives. */
export function slugOf(title) {
    const s = String(title ?? '')
        .normalize('NFKD')
        .replace(/\p{M}+/gu, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40)
        .replace(/-+$/g, '');
    return SLUG.test(s) ? s : 'issue';
}

/** The issue text for the data block: capped (never inside a surrogate pair), and the fence that no backtick run in it can close. */
export function dataBlock(title, body, cap) {
    let text = ('Title: ' + String(title ?? '') + '\n\n' + String(body ?? '')).replace(/\r\n?/g, '\n');
    const total = text.length;
    let cut = null;
    if (total > cap) {
        let n = cap;
        const c = text.charCodeAt(n - 1);
        if (c >= 0xd800 && c <= 0xdbff) n--;
        text = text.slice(0, n);
        cut = { chars: n, total };
    }
    let longest = 0;
    for (const run of text.match(/`+/g) || []) longest = Math.max(longest, run.length);
    return { text, cut, fence: '`'.repeat(Math.max(3, longest + 1)) };
}

/** One pass over the template: a value is never scanned again, so `{{x}}` or `$&` inside the issue text stays literal. */
export function renderTemplate(template, values) {
    return template.replace(/\{\{(\w+)\}\}/g, (_, k) => {
        if (!(k in values)) throw new Error('the template names {{' + k + '}}, which render does not fill');
        return String(values[k]);
    });
}

/** The first free Prompt-ID from `start`, a minute at a time: taken when a prompt file of that minute or a lane folder of that id exists. */
function mintPromptId(start, dirs) {
    const taken = new Set();
    for (const d of dirs) if (d && existsSync(d)) for (const n of readdirSync(d)) taken.add(n);
    for (let i = 0; i < MINT_TRIES; i++) {
        const d = new Date(start.getTime() + i * MINUTE);
        const date = ymd(d);
        const hhmm = pad2(d.getHours()) + pad2(d.getMinutes());
        const id = 'P-' + date + '-' + hhmm;
        const prefix = 'claude_' + date + '_' + hhmm + '_';
        if ([...taken].some((n) => n.startsWith(prefix)) || existsSync(join(lanesDir(), id))) continue;
        return { id, date, hhmm, at: d.getTime() };
    }
    refused('no free Prompt-ID within ' + MINT_TRIES + ' minutes of ' + when(start.getTime()));
}

function cmdRender(rest) {
    const n = issueArg(rest[0], 'render');
    const outArg = option(rest, '--out');
    const dry = outArg !== null;
    const config = loadConfig();
    const now = clock();
    const night = nightOf(now, config.nightWindow);
    const folder = join(nightDir(night), 'issue-' + n);
    let item = null;
    if (!dry) {
        const queue = readJson(join(nightDir(night), 'queue.json'));
        if (!queue) refused('no queue for ' + night.id + ': run queue first');
        item = (queue.items || []).find((x) => x.number === n);
        if (!item || item.verdict !== 'ready') refused('issue #' + n + ' is not ready in the queue of ' + night.id + ' (' + (item ? item.verdict + ': ' + item.reason : 'absent') + ')');
        const prior = readJson(attemptsFile(), {})[String(item.labelEvent.id)];
        if (prior) refused('attempt already made for label event ' + item.labelEvent.id + ' (' + prior.promptId + ')');
    }
    let issue;
    try {
        issue = ghJson(issueArgs(config, n));
    } catch (err) {
        if (!(err instanceof GhUnavailable)) throw err;
        console.log('gh-unavailable: ' + err.message);
        return 0;
    }
    if (!issue || issue.number !== n) refused('gh returned no issue #' + n);
    if (issue.pull_request) refused('#' + n + ' is a pull request');
    if (!dry && hashOf(issue.title, issue.body) !== item.bodyHash) refused('issue #' + n + ' changed since the queue: queue it again');
    const hidden = hiddenContent(String(issue.title ?? '') + '\n' + String(issue.body ?? ''));
    if (hidden.length) {
        const reason = 'hidden content (' + hidden.join(', ') + ')';
        if (!dry) writeJson(join(folder, 'parked.json'), { issue: n, reason, at: now.toISOString() });
        console.log('park: ' + reason);
        return 0;
    }
    const slug = slugOf(issue.title);
    const branch = 'auto/' + n + '-' + slug;
    if (git(HERE, ['check-ref-format', '--branch', branch]).status !== 0) refused('the branch name is not valid: ' + safe(branch));
    const worktree = join(homedir(), 'jjodel-a-' + n);
    const out = dry ? resolve(outArg) : join(lanesDir(), 'pending');
    mkdirSync(out, { recursive: true });
    const repo = repoDir();
    const block = dataBlock(issue.title, issue.body, config.dataCap);
    const lane = config.laneByMode[config.mode];
    const front = config.front ?? DEFAULT_FRONT;
    let minted = null;
    let file = null;
    let text = null;
    let from = now;
    for (let tries = 0; tries < MINT_TRIES && !file; tries++) {
        minted = mintPromptId(from, [repo ? join(repo, 'docs', 'prompts') : null, join(lanesDir(), 'pending'), out]);
        const report = 'docs/discovery/discovery_' + minted.date + '_auto_issue_' + n + '.md';
        text = renderTemplate(readFileSync(TEMPLATE, 'utf8'), {
            issue: n, mode: config.mode, promptId: minted.id, night: night.id, lane, front,
            status: dry ? 'dry render, not launchable' : 'da eseguire',
            worktree: '~/jjodel-a-' + n, branch, trunk: config.trunk, repo: config.repository, report,
            cutNote: block.cut ? 'The text was cut at ' + block.cut.chars + ' of ' + block.cut.total + ' characters. ' : '',
            fence: block.fence, data: block.text,
        });
        const candidate = join(out, 'claude_' + minted.date + '_' + minted.hhmm + '_prompt_auto_issue_' + n + '.md');
        if (!dry && tries === 0) {
            // One label buys one attempt, recorded before the prompt exists (RC-35).
            const attempts = readJson(attemptsFile(), {});
            attempts[String(item.labelEvent.id)] = { issue: n, night: night.id, promptId: minted.id, at: now.toISOString() };
            writeJson(attemptsFile(), attempts);
        }
        try {
            writeFileSync(candidate, text, { flag: 'wx' });
            file = candidate;
        } catch (err) {
            // Taken between the listing and the write: the next minute.
            if (err.code !== 'EEXIST') throw err;
            from = new Date(minted.at + MINUTE);
        }
    }
    if (!file) refused('no free prompt file name');
    if (!dry) {
        writeJson(join(folder, 'render.json'), {
            issue: n, promptId: minted.id, file, slug, branch, worktree, labelEventId: item.labelEvent.id, bodyHash: item.bodyHash,
            lane, mode: config.mode, cut: block.cut, at: now.toISOString(),
        });
    }
    console.log('rendered: ' + file);
    console.log('prompt-id: ' + minted.id);
    console.log('branch: ' + branch);
    console.log('worktree: ' + worktree);
    console.log('lane: ' + lane);
    console.log('cut: ' + (block.cut ? block.cut.chars + ' of ' + block.cut.total + ' characters' : 'none'));
    if (dry) console.log('dry render: not launchable, no attempt recorded');
    return 0;
}

// ── cut ──────────────────────────────────────────────────────────────────────

/** The newest issue-<n> folder that holds a render.json, with the record; null when none. */
function findRender(n) {
    if (!existsSync(autoDir())) return null;
    for (const name of readdirSync(autoDir()).filter((x) => /^night-\d{4}-\d{2}-\d{2}$/.test(x)).sort().reverse()) {
        const folder = join(autoDir(), name, 'issue-' + n);
        const rec = readJson(join(folder, 'render.json'));
        if (rec) return { folder, rec };
    }
    return null;
}

/** The shared node_modules of P14: the trunk tree's own frontend/node_modules (its link target), else the main worktree's. */
function sharedModules(repo) {
    const own = join(repo, 'frontend', 'node_modules');
    if (existsSync(own)) return realpathSync(own);
    const r = git(repo, ['worktree', 'list', '--porcelain']);
    const main = r.status === 0 ? (r.out.split('\n').find((l) => l.startsWith('worktree ')) || '').slice('worktree '.length) : '';
    const there = main ? join(main, 'frontend', 'node_modules') : null;
    return there && existsSync(there) ? realpathSync(there) : null;
}

function cmdCut(rest) {
    const n = issueArg(rest[0], 'cut');
    const config = loadConfig();
    const repo = repoDir();
    if (!repo) refused('no trunk tree: set AUTO_INTAKE_REPO or run from a worktree of the repository');
    const found = findRender(n);
    if (!found) refused('issue #' + n + ' has no render: render it first');
    const { folder, rec } = found;
    const baseFile = join(folder, 'base.txt');
    if (existsSync(baseFile)) refused('issue #' + n + ' is already cut (base ' + readTrim(baseFile) + ')');
    if (typeof rec.branch !== 'string' || !rec.branch.startsWith('auto/' + n + '-') || !SLUG.test(rec.branch.slice(('auto/' + n + '-').length))) refused('render.json of #' + n + ' holds no auto/ branch');
    if (typeof rec.worktree !== 'string' || !isAbsolute(rec.worktree)) refused('render.json of #' + n + ' holds no worktree path');
    const tip = git(repo, ['rev-parse', '--verify', '--quiet', 'refs/heads/' + config.trunk + '^{commit}']);
    if (tip.status !== 0) refused('no branch ' + config.trunk + ' in ' + repo);
    const base = tip.out.trim();
    if (git(repo, ['show-ref', '--verify', '--quiet', 'refs/heads/' + rec.branch]).status === 0) refused('the branch ' + rec.branch + ' exists');
    if (existsSync(rec.worktree)) refused('the worktree path exists: ' + safe(rec.worktree));
    const add = git(repo, ['worktree', 'add', '-q', '-b', rec.branch, rec.worktree, base]);
    if (add.status !== 0) refused('git worktree add: ' + add.err);
    let modules = 'none to link';
    const shared = sharedModules(repo);
    const link = join(rec.worktree, 'frontend', 'node_modules');
    if (shared && existsSync(join(rec.worktree, 'frontend'))) {
        let present = false;
        try {
            lstatSync(link);
            present = true;
        } catch {
            // absent: linked below
        }
        if (present) modules = 'present, left as it is';
        else {
            symlinkSync(shared, link);
            modules = 'linked to ' + shared;
        }
    }
    writeFileSync(baseFile, base + '\n');
    console.log('cut: ' + rec.worktree);
    console.log('branch: ' + rec.branch);
    console.log('base: ' + base);
    console.log('node_modules: ' + modules);
    return 0;
}

// ── readings of the plan window ──────────────────────────────────────────────

function toReading(e) {
    const info = e && e.rate_limit_info;
    const w = info && info.unifiedWindows;
    const sd = w && w.seven_day;
    if (!sd || typeof sd.utilization !== 'number' || typeof sd.resetsAt !== 'number') return null;
    const fh = w.five_hour && typeof w.five_hour.utilization === 'number' && typeof w.five_hour.resetsAt === 'number' ? w.five_hour : null;
    return {
        at: null, atSource: null, status: info.status, type: info.rateLimitType,
        sd: sd.utilization, sdResetsAt: sd.resetsAt * 1000,
        fh: fh ? fh.utilization : null, fhResetsAt: fh ? fh.resetsAt * 1000 : null,
        surpassed: typeof info.surpassedThreshold === 'number' ? info.surpassedThreshold : null,
    };
}

/**
 * The events of a log that the ledger and admission read, in order: readings and
 * results dated by the nearest `assistant` or `user` timestamp of their run
 * (before them, else after, else the log's mtime), and the position of the
 * last `init`. The readings themselves carry no timestamp (report of
 * P-2026-10-03-1705, section 2).
 */
export function logEvents(text, mtimeMs) {
    const out = { readings: [], results: [], lastInit: -1, firstTs: null };
    let lastTs = null;
    let pending = [];
    let i = 0;
    for (const line of text.split('\n')) {
        const isReading = line.includes('"rate_limit_event"');
        const isResult = line.includes('"type":"result"');
        const isInit = line.includes('"subtype":"init"');
        const hasTs = line.includes('"timestamp":"');
        if (!isReading && !isResult && !isInit && !hasTs) continue;
        let e;
        try {
            e = JSON.parse(line);
        } catch {
            continue;
        }
        i++;
        if (e.type === 'system' && e.subtype === 'init') {
            for (const p of pending) Object.assign(p, { at: lastTs ?? mtimeMs, atSource: lastTs !== null ? 'before' : 'mtime' });
            pending = [];
            lastTs = null;
            out.lastInit = i;
            continue;
        }
        if ((e.type === 'assistant' || e.type === 'user') && typeof e.timestamp === 'string') {
            const t = Date.parse(e.timestamp);
            if (Number.isFinite(t)) {
                for (const p of pending) Object.assign(p, { at: t, atSource: 'after' });
                pending = [];
                lastTs = t;
                if (out.firstTs === null) out.firstTs = t;
            }
            continue;
        }
        let item = null;
        if (e.type === 'rate_limit_event') {
            item = toReading(e);
            if (item) out.readings.push(item);
        } else if (e.type === 'result') {
            item = { at: null, atSource: null, cost: typeof e.total_cost_usd === 'number' ? e.total_cost_usd : null, durationMs: Number(e.duration_ms) || 0, modelUsage: e.modelUsage || {}, isError: e.is_error === true };
            out.results.push(item);
        }
        if (!item) continue;
        item.seq = i;
        if (lastTs !== null) Object.assign(item, { at: lastTs, atSource: 'before' });
        else pending.push(item);
    }
    for (const p of pending) Object.assign(p, { at: mtimeMs, atSource: 'mtime' });
    return out;
}

const laneIds = (root) => (existsSync(root) ? readdirSync(root).filter((n) => PROMPT_ID.test(n) && statSync(join(root, n)).isDirectory()) : []);
const parsed = new Map();

function parsedLog(id) {
    const path = join(lanesDir(), id, 'log.jsonl');
    if (!existsSync(path)) return null;
    const mtime = statSync(path).mtimeMs;
    const hit = parsed.get(path);
    if (hit && hit.mtime === mtime) return hit.events;
    const events = logEvents(readFileSync(path, 'utf8'), mtime);
    parsed.set(path, { mtime, events });
    return events;
}

/**
 * The newest reading at or before `before` across every lane log: logs newest
 * mtime first, stopping once a log is older than the best reading found (a log
 * holds nothing newer than its last write).
 */
export function latestReading(before = Infinity) {
    const files = laneIds(lanesDir())
        .map((id) => ({ id, path: join(lanesDir(), id, 'log.jsonl') }))
        .filter((f) => existsSync(f.path))
        .map((f) => ({ ...f, mtime: statSync(f.path).mtimeMs }))
        .sort((a, b) => b.mtime - a.mtime);
    let best = null;
    for (const f of files) {
        if (best && f.mtime < best.at) break;
        for (const r of parsedLog(f.id).readings) {
            if (r.at <= before && (!best || r.at > best.at || (r.at === best.at && best.lane === f.id))) best = { ...r, lane: f.id };
        }
    }
    return best;
}

// ── automatic lanes ──────────────────────────────────────────────────────────

/**
 * The time of a lane (report section 3): the results of earlier runs (dated
 * before started.txt) by their duration_ms, plus the last run on the wall clock,
 * started.txt to the exit.txt mtime or to now while it runs.
 */
export function laneTiming(id, nowMs) {
    const dir = join(lanesDir(), id);
    const started = Number(readTrim(join(dir, 'started.txt'))) || null;
    const exitPath = join(dir, 'exit.txt');
    const exited = existsSync(exitPath);
    const running = !exited && isAlive(Number(readTrim(join(dir, 'pid.txt'))));
    const ev = parsedLog(id) || { readings: [], results: [], lastInit: -1, firstTs: null };
    const logPath = join(dir, 'log.jsonl');
    const end = exited ? statSync(exitPath).mtimeMs : running ? nowMs : existsSync(logPath) ? statSync(logPath).mtimeMs : started ?? nowMs;
    const earlier = started === null ? 0 : ev.results.filter((r) => r.at !== null && r.at < started).reduce((a, r) => a + r.durationMs, 0);
    const last = started === null ? 0 : Math.max(0, end - started);
    return { started, end, exited, running, ms: earlier + last, readingSinceStart: ev.readings.some((r) => r.seq > ev.lastInit), events: ev };
}

/** Lane cost and tokens: the last cumulative values of the session, never a sum over runs (report section 1). */
export function laneCost(events) {
    const last = events.results.length ? events.results[events.results.length - 1] : null;
    const t = { in: 0, out: 0, cache: 0 };
    for (const m of Object.values(last ? last.modelUsage : {})) {
        t.in += Number(m.inputTokens) || 0;
        t.out += Number(m.outputTokens) || 0;
        t.cache += (Number(m.cacheReadInputTokens) || 0) + (Number(m.cacheCreationInputTokens) || 0);
    }
    return { cost: last ? last.cost : null, tokens: t, runs: events.results.length };
}

/** The lane folders started by lane-run start --auto, each with the time of its auto.json. */
function autoLanes(nowMs) {
    const out = [];
    for (const id of laneIds(lanesDir())) {
        const path = join(lanesDir(), id, 'auto.json');
        if (!existsSync(path)) continue;
        let a = null;
        try {
            a = JSON.parse(readFileSync(path, 'utf8'));
        } catch {
            a = {};
        }
        const timing = laneTiming(id, nowMs);
        const at = Number(a && a.at) || timing.started || 0;
        out.push({ id, at, ...timing });
    }
    return out;
}

// ── admit (RC-38) ────────────────────────────────────────────────────────────

const round6 = (x) => Math.round(x * 1e6) / 1e6;

/**
 * The verdict of admission, pure: the first failing check wins. `lanes` are the
 * automatic lanes ({id, at, running, started, ms, readingSinceStart}). Returns
 * the checks made, and the baseline or the trip file to write.
 */
export function admitDecision({ now, config, night, reading, baseline, trip, lanes }) {
    const b = config.budget;
    const t = now.getTime();
    const res = { verdict: 'deny', reason: '', checks: [], writeBaseline: null, writeTrip: null };
    const check = (name, ok, detail) => {
        res.checks.push({ name, ok, detail });
        return ok;
    };
    const deny = (reason) => Object.assign(res, { verdict: 'deny', reason });
    const minutesLeft = Math.floor((night.end - t) / MINUTE);

    if (!check('trip', !trip, trip ? 'trip.json: ' + trip.reason : 'no trip file')) return deny('trip (' + trip.reason + ')');
    if (!night.inside) {
        check('window', false, 'outside ' + night.id);
        return deny('outside the night window (' + night.id + ' runs ' + night.window.start + ' to ' + night.window.end + ')');
    }
    if (!check('window', minutesLeft >= b.residualMinutes, minutesLeft + ' min left in ' + night.id)) return deny('the night window ends in ' + minutesLeft + ' min, under the ' + b.residualMinutes + '-min residual');

    // Kill switch: on windows that have not reset; a trip only from a reading of the night.
    const sevenFresh = reading && reading.sdResetsAt > t;
    const fiveFresh = reading && reading.fh !== null && reading.fhResetsAt > t;
    let kill = null;
    if (reading && reading.status === 'rejected' && (reading.type === 'five_hour' ? fiveFresh : sevenFresh)) kill = 'status rejected (' + reading.type + ')';
    else if (fiveFresh && reading.fh >= b.fiveHourCeiling) kill = 'five-hour ' + f2(reading.fh) + ' at or above ' + f2(b.fiveHourCeiling);
    else if (sevenFresh && reading.type === 'seven_day' && reading.surpassed !== null) kill = 'seven-day surpassedThreshold ' + f2(reading.surpassed);
    if (!check('kill', !kill, kill ? kill : 'no kill condition')) {
        if (reading.at >= night.start) {
            res.writeTrip = { reason: 'kill switch: ' + kill, by: 'admit', at: now.toISOString(), reading };
            return deny('kill switch: ' + kill + ' (trip written)');
        }
        return deny('kill switch: ' + kill + ', read before the night (no trip)');
    }

    const usedMs = lanes.filter((l) => l.at >= night.start && l.at < night.end).reduce((a, l) => a + l.ms, 0);
    const used = Math.ceil(usedMs / MINUTE);
    const timeCheck = () => {
        const left = b.nightMinutes - used;
        return check('lane time', left >= b.residualMinutes, used + ' min used of ' + b.nightMinutes + ' tonight') ? null : 'lane time: ' + left + ' min left of ' + b.nightMinutes + ' tonight, under the ' + b.residualMinutes + '-min residual';
    };
    const windowChecks = (u, resetsAt) => {
        const elapsed = (t - (resetsAt - WEEK)) / WEEK;
        const limit = elapsed - b.paceMargin;
        if (!check('pace', round6(u) <= round6(limit), f2(u) + ' against ' + f2(limit) + ' (elapsed ' + f2(elapsed) + ' minus ' + f2(b.paceMargin) + ')')) return 'pace: seven-day ' + f2(u) + ' above ' + f2(limit) + ' (elapsed ' + f2(elapsed) + ' minus margin ' + f2(b.paceMargin) + ')';
        if (!check('ceiling', round6(u) < round6(b.ceiling), f2(u) + ' against ' + f2(b.ceiling))) return 'ceiling: seven-day ' + f2(u) + ' at or above ' + f2(b.ceiling);
        const toReset = (resetsAt - t) / HOUR;
        if (!check('reset guard', toReset >= b.resetGuardHours, 'resets ' + when(resetsAt) + ', in ' + Math.floor(toReset) + ' h')) return 'the window resets in ' + Math.floor(toReset) + ' h, within the ' + b.resetGuardHours + '-h reset guard';
        return null;
    };

    const running = lanes.filter((l) => l.running);
    const passed = reading && reading.sdResetsAt <= t;
    const old = reading && t - reading.at > b.staleHours * HOUR;
    if (!reading || passed || old) {
        const why = !reading ? 'no reading' : passed ? 'its window reset ' + when(reading.sdResetsAt) : Math.floor((t - reading.at) / HOUR) + ' h old';
        check('stale', false, why);
        if (reading && !passed) {
            // Utilization does not fall inside a window except by an out-of-band reset: a stale value is a lower bound.
            const w = windowChecks(reading.sd, reading.sdResetsAt);
            if (w) return deny(w);
        }
        if (running.length) return deny('stale reading (' + why + ') and ' + running.map((l) => l.id).join(', ') + ' is running');
        const since = reading ? reading.at : -Infinity;
        const used2 = lanes.filter((l) => l.at >= night.start && l.at < night.end && l.at > since);
        if (used2.length) return deny('stale reading (' + why + ') already used by ' + used2.map((l) => l.id).join(', '));
        const tc = timeCheck();
        if (tc) return deny(tc);
        return Object.assign(res, { verdict: 'admit', reason: 'one light discovery lane (stale reading: ' + why + ')' });
    }
    check('stale', true, 'read ' + when(reading.at) + ', ' + Math.floor((t - reading.at) / MINUTE) + ' min ago');

    if (!baseline) res.writeBaseline = { u: reading.sd, resetsAt: reading.sdResetsAt, readAt: reading.at, lane: reading.lane ?? null, at: now.toISOString() };
    const w = windowChecks(reading.sd, reading.sdResetsAt);
    if (w) return deny(w);
    const base = baseline || res.writeBaseline;
    if (!check('baseline window', base.resetsAt === reading.sdResetsAt, 'baseline resets ' + when(base.resetsAt))) return deny('the window changed since the baseline (baseline resets ' + when(base.resetsAt) + ', the reading ' + when(reading.sdResetsAt) + ')');
    const delta = round6(reading.sd - base.u);
    if (!check('nightly delta', delta < b.nightlyDelta, f2(reading.sd) + ' against the baseline ' + f2(base.u) + ' (limit ' + f2(b.nightlyDelta) + ')')) return deny('nightly delta: ' + f2(reading.sd) + ' is ' + f2(delta) + ' above the baseline ' + f2(base.u) + ' (limit ' + f2(b.nightlyDelta) + ')');
    const tc = timeCheck();
    if (tc) return deny(tc);
    const blocked = running.find((l) => l.started !== null && t - l.started > b.laneLimitMinutes * MINUTE);
    if (blocked) {
        check('parallel', false, blocked.id + ' past the lane limit');
        return deny(blocked.id + ' is running past the lane limit (' + Math.floor((t - blocked.started) / MINUTE) + ' min, limit ' + b.laneLimitMinutes + ')');
    }
    if (running.length >= b.parallelCap) {
        check('parallel', false, running.length + ' running');
        return deny('parallel cap: ' + running.length + ' automatic lanes running (cap ' + b.parallelCap + ')');
    }
    const silent = running.find((l) => !l.readingSinceStart);
    if (silent) {
        check('parallel', false, silent.id + ' has no reading yet');
        return deny(silent.id + ' is running and has produced no reading yet');
    }
    check('parallel', true, running.length + ' running, cap ' + b.parallelCap);
    return Object.assign(res, { verdict: 'admit', reason: '' });
}

function describeReading(r) {
    if (!r) return 'none';
    return 'seven-day ' + f2(r.sd) + ' (resets ' + when(r.sdResetsAt) + '), five-hour ' + (r.fh === null ? 'unknown' : f2(r.fh) + ' (resets ' + when(r.fhResetsAt) + ')') +
        ', ' + r.status + '/' + r.type + (r.surpassed !== null ? ', surpassedThreshold ' + f2(r.surpassed) : '') + ', at ' + when(r.at) + ' (timestamp ' + r.atSource + ') in ' + r.lane;
}

function cmdAdmit(rest) {
    if (rest.some((a) => a !== '--explain')) usage('usage: auto-intake admit [--explain]');
    const explain = rest.includes('--explain');
    const config = loadConfig();
    const now = clock();
    const night = nightOf(now, config.nightWindow);
    const folder = nightDir(night);
    const trip = readJson(join(folder, 'trip.json'));
    const baseline = readJson(join(folder, 'baseline.json'));
    const reading = latestReading();
    const lanes = autoLanes(now.getTime());
    const d = admitDecision({ now, config, night, reading, baseline, trip, lanes });
    if (d.writeBaseline && night.inside && !existsSync(join(folder, 'baseline.json'))) writeJson(join(folder, 'baseline.json'), d.writeBaseline);
    if (d.writeTrip && !existsSync(join(folder, 'trip.json'))) writeJson(join(folder, 'trip.json'), d.writeTrip);
    if (explain) {
        console.log('night: ' + night.id + ' (' + night.window.start + ' to ' + night.window.end + '), ' + (night.inside ? 'inside, ' + Math.floor((night.end - now.getTime()) / MINUTE) + ' min left' : 'outside'));
        console.log('reading: ' + describeReading(reading));
        const base = baseline || d.writeBaseline;
        console.log('baseline: ' + (base ? f2(base.u) + ' (resets ' + when(base.resetsAt) + ')' + (baseline ? '' : night.inside ? ', written now' : ', not written outside the window') : 'none'));
        const running = lanes.filter((l) => l.running);
        console.log('lanes: ' + running.length + ' running' + (running.length ? ' (' + running.map((l) => l.id).join(', ') + ')' : '') + ', ' + lanes.filter((l) => l.at >= night.start && l.at < night.end).length + ' tonight');
        for (const c of d.checks) console.log('check ' + c.name + ': ' + (c.ok ? 'ok' : 'FAIL') + ' (' + c.detail + ')');
    }
    console.log(d.verdict === 'admit' ? (d.reason ? 'admit: ' + d.reason : 'admit') : 'deny: ' + d.reason);
    return 0;
}

// ── guard (RC-36) ────────────────────────────────────────────────────────────

const RULE14 = ['frontend/src/common/DV.tsx', 'frontend/src/utils/defaultViewTemplate.ts'];
const DEPENDENCIES = new Set(['package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'npm-shrinkwrap.json', '.npmrc']);
const SOURCE = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
const TEST_FILE = /(^|\/)__tests__\/|\.test\.[jt]sx?$/;
const tokenPattern = (token) => new RegExp('(?<!\\w)' + token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?!\\w)');

/** The guarded class of a repo-relative path, or null (RC-36, report section 9.6). */
export function pathClass(path) {
    const p = path.replace(/\/+$/, '');
    if (CRITICAL_FILES.includes(p)) return 'critical zone';
    if (RULE14.includes(p)) return 'default view (rule 14)';
    const b = basename(p);
    if (b === 'CLAUDE.md' || b === 'AGENTS.md' || p === 'docs/PROTOCOL.md' || p === 'docs/decisions.md') return 'governance';
    if (p === '.claude' || p.startsWith('.claude/')) return '.claude/';
    if (p === '.github' || p.startsWith('.github/')) return '.github/';
    if (p === 'frontend/scripts/hooks' || p.startsWith('frontend/scripts/hooks/') || p === 'frontend/scripts/lane-run.mjs' || p.startsWith('frontend/scripts/auto-intake.') || p === 'frontend/scripts/lane-templates' || p.startsWith('frontend/scripts/lane-templates/')) return 'harness';
    if (DEPENDENCIES.has(b)) return 'dependencies';
    return null;
}

function verdictLine(reasons) {
    if (!reasons.length) return 'pass';
    const shown = reasons.slice(0, REASONS_MAX);
    return 'park: ' + shown.join('; ') + (reasons.length > REASONS_MAX ? '; and ' + (reasons.length - REASONS_MAX) + ' more' : '');
}

/** The first layer of RC-36: the verdict and the predicted DOVE of the report's machine-readable line. */
export function guardPredicted(text) {
    const lines = text.split('\n').filter((l) => l.trimStart().startsWith('Auto-intake:'));
    if (lines.length === 0) return ['no Auto-intake line'];
    if (lines.length > 1) return ['the Auto-intake line appears ' + lines.length + ' times'];
    const m = VERDICT_LINE.exec(lines[0].trimEnd());
    if (!m) return ['malformed Auto-intake line'];
    const reasons = [];
    if (m[1] !== 'auto-eligible') reasons.push('verdict ' + m[1]);
    for (const p of m[2] === '-' ? [] : m[2].split(',')) {
        const parts = p.split('/');
        if (isAbsolute(p) || p.startsWith('~') || parts.includes('..') || parts.includes('.')) reasons.push(safe(p) + ': not a repo-relative path');
        else {
            const c = pathClass(p);
            if (c) reasons.push(safe(p) + ': ' + c);
        }
    }
    return reasons;
}

/** A path of git's C-quoted form ("a\tb"), unquoted; a bare path unchanged. */
function unquote(s) {
    if (!s.startsWith('"')) return s;
    const bytes = [];
    for (let i = 1; i < s.length - 1; i++) {
        const ch = s[i];
        if (ch !== '\\') {
            bytes.push(...Buffer.from(ch, 'utf8'));
            continue;
        }
        const nx = s[++i];
        const map = { a: 7, b: 8, t: 9, n: 10, v: 11, f: 12, r: 13, '"': 34, '\\': 92 };
        if (nx in map) bytes.push(map[nx]);
        else if (/[0-7]/.test(nx)) {
            bytes.push(parseInt(s.slice(i, i + 3), 8));
            i += 2;
        }
    }
    return Buffer.from(bytes).toString('utf8');
}

/** The content checks of the diff against the base: D-layer creators and SetFieldAction added, export lines removed or changed. */
function diffContentReasons(tree, base) {
    const r = git(tree, ['-c', 'core.quotePath=false', 'diff', '-U0', '--no-color', '--no-ext-diff', '--no-renames', base]);
    if (r.status !== 0) refused('git diff: ' + r.err);
    const reasons = new Set();
    let path = null;
    let inHunk = false;
    for (const line of r.out.split('\n')) {
        if (line.startsWith('diff --git ')) {
            path = null;
            inHunk = false;
            continue;
        }
        if (!inHunk) {
            if (line.startsWith('+++ ')) {
                const p = line.slice(4);
                if (p !== '/dev/null') path = unquote(p).replace(/^b\//, '');
            } else if (line.startsWith('--- ') && path === null) {
                const p = line.slice(4);
                if (p !== '/dev/null') path = unquote(p).replace(/^a\//, '');
            } else if (line.startsWith('@@')) inHunk = true;
            continue;
        }
        if (line.startsWith('@@')) continue;
        if (!path || !SOURCE.test(path) || TEST_FILE.test(path)) continue;
        if (line.startsWith('+')) addedReasons(path, line.slice(1)).forEach((x) => reasons.add(x));
        else if (line.startsWith('-') && /^\s*export\b/.test(line.slice(1))) reasons.add(safe(path) + ': removes or changes an export (heuristic)');
    }
    return [...reasons];
}

function addedReasons(path, text) {
    const out = [];
    if (path.startsWith('frontend/src/')) {
        for (const t of D_LAYER_CREATORS) if (tokenPattern(t).test(text)) out.push(safe(path) + ': adds ' + t + ' (D-layer creator, rule 12)');
        if (path.startsWith(SYNC_DIR) && tokenPattern(SYNC_TOKEN).test(text)) out.push(safe(path) + ': adds ' + SYNC_TOKEN + ' in the sync layer');
    }
    return out;
}

/** The base of a guarded worktree: --base, else the base.txt of the render naming it, else the merge base with the trunk. */
function guardBase(tree, baseArg, config) {
    if (baseArg !== null) {
        const r = git(tree, ['rev-parse', '--verify', '--quiet', baseArg + '^{commit}']);
        if (r.status !== 0) refused('not a commit: ' + safe(baseArg));
        return { sha: r.out.trim(), source: '--base' };
    }
    const real = realpathSync(tree);
    if (existsSync(autoDir())) {
        for (const name of readdirSync(autoDir()).filter((x) => /^night-/.test(x)).sort().reverse()) {
            const dir = join(autoDir(), name);
            for (const sub of readdirSync(dir).filter((x) => /^issue-\d+$/.test(x))) {
                const rec = readJson(join(dir, sub, 'render.json'));
                const baseFile = join(dir, sub, 'base.txt');
                if (rec && typeof rec.worktree === 'string' && existsSync(rec.worktree) && realpathSync(rec.worktree) === real && existsSync(baseFile)) {
                    return { sha: readTrim(baseFile), source: 'base.txt' };
                }
            }
        }
    }
    const mb = git(tree, ['merge-base', 'HEAD', 'refs/heads/' + config.trunk]);
    if (mb.status !== 0) refused('no base: no --base, no base.txt for this worktree, no merge base with ' + config.trunk);
    return { sha: mb.out.trim(), source: 'merge-base with ' + config.trunk };
}

/** The second and third layers of RC-36 after the session: the branch against its base, and the untracked and ignored files. */
function guardTree(tree, baseArg, config) {
    if (!existsSync(tree) || git(tree, ['rev-parse', '--show-toplevel']).status !== 0) refused('not a git worktree: ' + safe(tree));
    const base = guardBase(tree, baseArg, config);
    console.log('base: ' + base.sha + ' (' + base.source + ')');
    if (git(tree, ['merge-base', '--is-ancestor', base.sha, 'HEAD']).status !== 0) return ['HEAD does not descend from the base ' + base.sha];
    const reasons = [];
    const ns = git(tree, ['diff', '--name-status', '-M', '-z', '--no-ext-diff', base.sha]);
    if (ns.status !== 0) refused('git diff: ' + ns.err);
    const tok = ns.out.split('\0').filter((x) => x !== '');
    for (let i = 0; i < tok.length;) {
        const status = tok[i++];
        if (/^[RC]/.test(status)) {
            const from = tok[i++];
            const to = tok[i++];
            if (status.startsWith('R')) reasons.push(safe(from) + ': renamed to ' + safe(to));
            for (const p of [from, to]) {
                const c = pathClass(p);
                if (c) reasons.push(safe(p) + ': ' + c);
            }
            continue;
        }
        const p = tok[i++];
        if (status === 'D') reasons.push(safe(p) + ': deleted');
        const c = pathClass(p);
        if (c) reasons.push(safe(p) + ': ' + c);
    }
    reasons.push(...diffContentReasons(tree, base.sha));
    const st = git(tree, ['status', '--porcelain=v1', '-z', '--ignored', '--untracked-files=all']);
    if (st.status !== 0) refused('git status: ' + st.err);
    for (const entry of st.out.split('\0').filter((x) => x !== '')) {
        const code = entry.slice(0, 2);
        if (code !== '??' && code !== '!!') continue;
        const p = entry.slice(3);
        const c = pathClass(p);
        if (c) reasons.push(safe(p) + ': ' + c);
        if (code === '??' && SOURCE.test(p) && !TEST_FILE.test(p)) {
            const abs = join(tree, p);
            if (existsSync(abs) && statSync(abs).isFile()) for (const line of readFileSync(abs, 'utf8').split('\n')) addedReasons(p, line).forEach((x) => reasons.includes(x) || reasons.push(x));
        }
    }
    return [...new Set(reasons)];
}

function cmdGuard(rest) {
    const predicted = option(rest, '--predicted');
    const config = loadConfig();
    if (predicted !== null) {
        if (!existsSync(predicted)) refused('no report: ' + safe(predicted));
        const reasons = guardPredicted(readFileSync(predicted, 'utf8'));
        console.log('predicted DOVE: content checks (D-layer creators, exports) do not apply to a prediction');
        console.log(verdictLine(reasons));
        return 0;
    }
    const tree = rest[0];
    if (!tree || tree.startsWith('--')) usage('usage: auto-intake guard --predicted <report.md> | guard <worktree> [--base <rev>]');
    console.log(verdictLine(guardTree(resolve(tree), option(rest, '--base'), config)));
    return 0;
}

// ── ledger ───────────────────────────────────────────────────────────────────

function cmdLedger(rest) {
    if (rest.some((a) => a !== '--night' && a !== '--week') || rest.length > 1) usage('usage: auto-intake ledger [--night|--week]');
    const config = loadConfig();
    const now = clock();
    const t = now.getTime();
    const week = rest[0] === '--week';
    let night = nightOf(now, config.nightWindow);
    if (!night.inside) night = previousNight(night);
    const inScope = (l) => (week ? l.at >= t - WEEK && l.at <= t : l.at >= night.start && l.at < night.end);
    const issues = new Map();
    if (existsSync(autoDir())) {
        for (const name of readdirSync(autoDir()).filter((x) => /^night-/.test(x))) {
            for (const sub of readdirSync(join(autoDir(), name)).filter((x) => /^issue-\d+$/.test(x))) {
                const rec = readJson(join(autoDir(), name, sub, 'render.json'));
                if (rec && rec.promptId) issues.set(rec.promptId, rec.issue);
            }
        }
    }
    const lanes = autoLanes(t).filter(inScope).sort((a, b) => a.at - b.at);
    console.log('ledger: ' + (week ? 'the last 7 days' : 'night ' + night.id + ' (' + night.window.start + ' to ' + night.window.end + ')') + ', ' + lanes.length + ' automatic lane' + (lanes.length === 1 ? '' : 's'));
    let minutes = 0;
    let cost = 0;
    for (const l of lanes) {
        const c = laneCost(l.events);
        const start = l.at || l.events.firstTs || l.started;
        const before = latestReading(start);
        const own = l.events.readings.length ? l.events.readings[l.events.readings.length - 1] : latestReading(l.end);
        const m = Math.round(l.ms / MINUTE);
        minutes += m;
        cost += c.cost ?? 0;
        const flags = existsSync(join(lanesDir(), l.id, 'goahead.txt')) ? '  GOAHEAD' : '';
        console.log([
            l.id, issues.has(l.id) ? '#' + issues.get(l.id) : '#-', l.running ? 'running' : 'exited', m + ' min',
            (c.cost === null ? '-' : c.cost.toFixed(2)) + ' USD', 'in ' + c.tokens.in + ' out ' + c.tokens.out + ' cache ' + c.tokens.cache,
            'seven-day ' + f2(before ? before.sd : null) + ' -> ' + f2(own ? own.sd : null),
        ].join('  ') + flags);
    }
    console.log('total: ' + lanes.length + ' lane' + (lanes.length === 1 ? '' : 's') + ', ' + minutes + ' min, ' + cost.toFixed(2) + ' USD');
    return 0;
}

// ── trip ─────────────────────────────────────────────────────────────────────

function cmdTrip(rest) {
    const reason = rest.join(' ').trim();
    if (!reason) usage('usage: auto-intake trip <reason>');
    // The kill switch works whatever the configuration says: only the window is read from it.
    let win = DEFAULT_WINDOW;
    try {
        const c = JSON.parse(readFileSync(configPath(), 'utf8'));
        if (c && c.nightWindow && HHMM.test(c.nightWindow.start ?? '') && HHMM.test(c.nightWindow.end ?? '') && c.nightWindow.start !== c.nightWindow.end) win = c.nightWindow;
    } catch {
        // the default window
    }
    const now = clock();
    const file = join(nightDir(nightOf(now, win)), 'trip.json');
    if (existsSync(file)) {
        console.log('trip: ' + file + ' already holds a trip (' + (readJson(file, {}).reason ?? '?') + ')');
        return 0;
    }
    writeJson(file, { reason, by: 'hand', at: now.toISOString() });
    console.log('trip: ' + file);
    return 0;
}

// ── main ─────────────────────────────────────────────────────────────────────

const COMMANDS = { queue: cmdQueue, render: cmdRender, cut: cmdCut, admit: cmdAdmit, guard: cmdGuard, ledger: cmdLedger, trip: cmdTrip };

export function main(argv) {
    const [command, ...rest] = argv;
    try {
        const fn = COMMANDS[command];
        if (!fn) usage('usage: auto-intake queue | render <issue> [--out <dir>] | cut <issue> | admit [--explain] | guard --predicted <report.md> | guard <worktree> [--base <rev>] | ledger [--night|--week] | trip <reason>');
        return fn(rest);
    } catch (err) {
        if (err instanceof Usage) {
            console.error('auto-intake: ' + err.message);
            return 2;
        }
        if (err instanceof Refused) {
            console.log('refused: ' + err.message);
            return 0;
        }
        if (err instanceof GhUnavailable) {
            console.log('gh-unavailable: ' + err.message);
            return 0;
        }
        throw err;
    }
}

const isMain = (() => {
    try {
        return realpathSync(process.argv[1]) === realpathSync(SELF);
    } catch {
        return false;
    }
})();
if (isMain) process.exit(main(process.argv.slice(2)));
