/**
 * lane-tracking.mjs: the front of a lane and its card on GitHub (docs/PROTOCOL.md P13, RC-44).
 *
 * Every prompt in docs/prompts/ names its front with a `Front: <slug>` header
 * line, the slug of a front of docs/harness/fronts.json. The rule lives here
 * once, for its two readers: check-docs.ts (Check E) imports it, and
 * `lane-run start` refuses a prompt that fails it. Lane B of the discovery
 * P-2026-10-10-1330 adds the projection of a lane onto its card: an issue of
 * the board's repo, an item of its Project, the front as its milestone.
 *
 *   loadFronts(repoRoot)                        the fronts of the registry
 *   loadBoard(repoRoot)                         the board of the registry: owner, Project number, repo
 *   parseFrontLine(promptText)                  the slug of the header's `Front:` line
 *   frontProblem(promptText, promptId, fronts)  null, or why the prompt fails, in one line
 *   projectLane(id, observed)                   the card a lane wants, or why it has none (pure)
 *   syncCard(id, wanted, opts)                  applies it with gh, failing open (RC-15)
 *   trackLane(id, observe, opts)                the enable switch, projectLane and syncCard, one line back
 *
 * Importing it reads nothing and writes nothing; everything above syncCard is
 * pure. syncCard and trackLane call gh and write ~/.jjodel-lanes/_tracking/.
 * Plain ES module, nothing outside node:*, like lane-run.mjs beside it.
 */

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, rmdirSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, delimiter, join } from 'node:path';

/**
 * The first prompt of 2026-10-11, once the merge has put the rule in every chat's PROTOCOL.md; it was
 * P-2026-10-10-1500, the lane that made the rule, until P-2026-10-10-1612. Prompts with a lower
 * Prompt-ID are never checked: earlier prompts are not amended (P13).
 */
export const FRONT_FROM = 'P-2026-10-11-0000';

export const FRONTS_FILE = 'docs/harness/fronts.json';

const PROMPT_ID = /^P-(\d{4}-\d{2}-\d{2})-\d{4}$/;

// Merge prompts rendered by lane-run are exempt, by the test lane-run.mjs start
// applies to the `Request:` line (RC-43): the `Lane: full (merge` line both
// templates of lane-templates/ render, so a launch by hand is exempt too.
const MERGE_LANE = /^Lane:\s*full \(merge\b/m;

/** The header: the lines before the first `## ` heading, as lane-run.mjs promptParts reads it. */
function headerOf(text) {
    const lines = text.split('\n');
    const first = lines.findIndex((l) => l.startsWith('## '));
    return (first === -1 ? lines : lines.slice(0, first)).join('\n');
}

/** The fronts of `<repoRoot>/docs/harness/fronts.json`. Throws, naming the file, when it cannot be read or has no fronts list. */
export function loadFronts(repoRoot) {
    let data;
    try {
        data = JSON.parse(readFileSync(join(repoRoot, FRONTS_FILE), 'utf8'));
    } catch (err) {
        throw new Error('cannot read ' + FRONTS_FILE + ': ' + (err instanceof Error ? err.message : String(err)));
    }
    if (!data || !Array.isArray(data.fronts)) throw new Error(FRONTS_FILE + ' has no "fronts" list');
    return data.fronts;
}

/** The `board` block of the registry: { owner, project, repo }. Throws, naming the file, when it is missing or incomplete. */
export function loadBoard(repoRoot) {
    let data;
    try {
        data = JSON.parse(readFileSync(join(repoRoot, FRONTS_FILE), 'utf8'));
    } catch (err) {
        throw new Error('cannot read ' + FRONTS_FILE + ': ' + (err instanceof Error ? err.message : String(err)));
    }
    const b = data && data.board;
    if (!b || typeof b.owner !== 'string' || !Number.isInteger(b.project) || typeof b.repo !== 'string' || !/^[\w.-]+\/[\w.-]+$/.test(b.repo)) {
        throw new Error(FRONTS_FILE + ' has no complete "board" block (owner, project, repo)');
    }
    return { owner: b.owner, project: b.project, repo: b.repo };
}

/** The value of the header's `Front:` line, trimmed; null when the header has none or it is empty. */
export function parseFrontLine(promptText) {
    const m = /^Front:(.*)$/m.exec(headerOf(promptText));
    const slug = m ? m[1].trim() : '';
    return slug || null;
}

/**
 * Why a prompt fails the front rule of P13, in one line; null when it passes.
 * A Prompt-ID below FRONT_FROM and a merge prompt pass unread. Otherwise the
 * header names a front of `fronts`, open, or closed on or after the day of the
 * prompt (a closed front fails only prompts dated after its closedOn).
 * `promptId` is the prompt's own, `fronts` the list loadFronts returns.
 */
export function frontProblem(promptText, promptId, fronts) {
    const id = PROMPT_ID.exec(promptId || '');
    if (!id) return 'not a Prompt-ID (P-YYYY-MM-DD-HHmm): ' + promptId;
    if (promptId < FRONT_FROM) return null;
    if (MERGE_LANE.test(headerOf(promptText))) return null;
    const slug = parseFrontLine(promptText);
    if (!slug) return 'no `Front:` line in the header: P13 asks for the slug of an open front of ' + FRONTS_FILE;
    const front = fronts.find((f) => f.slug === slug);
    if (!front) return 'unknown front "' + slug + '": not a slug of ' + FRONTS_FILE;
    if (front.state === 'open') return null;
    const date = id[1];
    if (front.state === 'closed') {
        if (front.closedOn && date <= front.closedOn) return null;
        return 'front "' + slug + '" closed on ' + (front.closedOn || '(no closedOn)') + ', and the prompt is dated ' + date;
    }
    return 'front "' + slug + '" has state "' + front.state + '", neither open nor closed';
}

/** True when the front rule reads the prompt: a Prompt-ID at or after FRONT_FROM that is not a merge prompt (frontProblem's scope). */
export function inFrontScope(promptText, promptId) {
    return PROMPT_ID.test(promptId || '') && promptId >= FRONT_FROM && !MERGE_LANE.test(headerOf(promptText || ''));
}

// ── the card of a lane (RC-44, lane B) ───────────────────────────────────────

/** The Status options of the board, in board order (Project 2, measured 2026-10-10). */
export const COLUMNS = ['Backlog', 'Ready', 'In progress', 'In review', 'Done'];

/** The labels the projection owns: it adds and removes these, never another. */
export const TRACK_LABELS = ['waiting:phase-2', 'waiting:visual', 'waiting:question', 'blocked', 'outcome:unparsed', 'closure-owed'];

// lane-run.mjs's OUTCOME: one of the four words, a suffix after the word tolerated.
const OUTCOME = /^Outcome:\s*(done|hard-stop|question|blocked)\b/;

// A GO from the chat: `[<Prompt-ID>] GO.` of lane-run go, `[<Prompt-ID>] Phase 2 GO: ...` of a GO file.
const GO_LINE = /^\[P-\d{4}-\d{2}-\d{2}-\d{4}\][^\n]*\bGO\b/;

/** True when a lane input is a GO: its first line opens with `[<Prompt-ID>]` and says GO. */
export function isGoMessage(text) {
    return GO_LINE.test(String(text || '').split('\n')[0]);
}

/** The prompt's title, its first `# ` line in the header; '' when it has none. */
function titleOf(promptText) {
    const m = /^# (.*)$/m.exec(headerOf(promptText || ''));
    return m ? m[1].trim() : '';
}

/**
 * True when the prompt is a discovery: its title or its file name says
 * `discovery`. The Lane line cannot tell (a discovery runs as `Lane: full (...)`,
 * and the `full (Phase 2, visual; ...)` lines name the discovery they follow),
 * and no Outcome line carries a suffix for it (report P-2026-10-10-1330, 4.1.4).
 */
export function isDiscoveryPrompt(promptText, promptFile) {
    return /discovery/i.test(titleOf(promptText)) || /discovery/i.test(basename(promptFile || ''));
}

/**
 * The card a lane wants, from lane-run's own state of it (not the board's
 * kindOf, report 4.2), or { skip } with the reason it has none. `observed`, as
 * lane-run.mjs observeLane fills it:
 *   folder        the lane folder ~/.jjodel-lanes/<id>/ exists: the lane was started
 *   merge         the folder is a direct merge's (direct.json)
 *   state         laneState's running | exited | blocked; null without a folder
 *   outcome       lastOutcome's line; null when there is none, or while a run is live
 *   resolved      laneState's line of resolved.txt (lane-run resolve) when the outcome
 *                 is blocked; null otherwise. A resolved lane projects like a done one.
 *   headerStatus  the prompt's Status: `da eseguire`, or the flipped line
 *   goSeen        a GO reached the lane after its first run (isGoMessage)
 *   promptText, promptFile, and fronts (the registry)
 * The card is { column, labels, milestone, closed }. A hard stop waits for a
 * Phase 2 GO when the prompt is a discovery (isDiscoveryPrompt) and no GO has
 * reached the lane yet; any other hard stop waits for the visual check.
 */
export function projectLane(id, observed) {
    const o = observed || {};
    if (!PROMPT_ID.test(id || '')) return { skip: 'not a Prompt-ID (P-YYYY-MM-DD-HHmm): ' + id };
    if (id < FRONT_FROM) return { skip: 'before ' + FRONT_FROM + ', where the front rule starts (P13)' };
    if (o.merge) return { skip: 'a merge lane gets no card' };
    if (typeof o.promptText !== 'string') return { skip: 'no prompt file found for ' + id };
    if (MERGE_LANE.test(headerOf(o.promptText))) return { skip: 'a merge lane gets no card' };
    const fronts = Array.isArray(o.fronts) ? o.fronts : [];
    const why = frontProblem(o.promptText, id, fronts);
    if (why) return { skip: why };
    const front = fronts.find((f) => f.slug === parseFrontLine(o.promptText));
    const milestone = front && Number.isInteger(front.milestone) ? front.milestone : null;
    const card = (column, labels = [], closed = false) => ({ column, labels, milestone, closed });
    const status = typeof o.headerStatus === 'string' ? o.headerStatus.trim() : '';
    const flipped = status !== '' && status !== 'da eseguire';
    if (!o.folder) return flipped ? card('Done', [], true) : card('Ready');
    if (o.state === 'running') return card('In progress');
    if (o.state === 'blocked') return card('In progress', ['blocked']);
    const m = typeof o.outcome === 'string' ? OUTCOME.exec(o.outcome) : null;
    if (!m) return card('In progress', ['outcome:unparsed']);
    if (m[1] === 'question') return card('In progress', ['waiting:question']);
    // A blocked lane resolved afterwards (P-2026-10-10-2020, report P-2026-10-10-1806 R4) falls through to the done row.
    if (m[1] === 'blocked' && typeof o.resolved !== 'string') return card('In progress', ['blocked']);
    if (m[1] === 'hard-stop') return card('In review', [isDiscoveryPrompt(o.promptText, o.promptFile) && !o.goSeen ? 'waiting:phase-2' : 'waiting:visual']);
    return flipped ? card('Done', [], true) : card('In review', ['closure-owed']);
}

/** The worktree name and branch of the header's `Worktree:` line (`~/jjodel-w-x`, branch `x`); null for each it does not name. */
export function promptWorktree(promptText) {
    const m = /^Worktree:(.*)$/m.exec(headerOf(promptText || ''));
    const tree = m ? /`([^`]+)`/.exec(m[1]) : null;
    const branch = m ? /\bbranch `([^`]+)`/.exec(m[1]) : null;
    return { worktree: tree ? basename(tree[1].replace(/\/+$/, '')) : null, branch: branch ? branch[1] : null };
}

/** The link to a prompt file on its branch, from a GitHub remote URL (https or ssh); null for any other remote. */
export function promptLink(remoteUrl, branch, promptPath) {
    const m = /github\.com[:/]([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/.exec(String(remoteUrl || '').trim());
    if (!m || !branch || !promptPath) return null;
    return 'https://github.com/' + m[1] + '/' + m[2] + '/blob/' + branch + '/' + promptPath;
}

/** The issue title: the Prompt-ID first, the idempotency key a lost card file is healed by. */
export function cardTitle(id, observed) {
    const o = observed || {};
    return id + ' · ' + (titleOf(o.promptText) || basename(o.promptFile || '') || 'lane');
}

/** The issue body (report answer 16): Prompt-ID, title, Lane, front, branch, worktree, Request URL, prompt link; never the words of the request, never the prompt body. */
export function cardBody(id, observed) {
    const o = observed || {};
    const text = o.promptText || '';
    const field = (key) => {
        const m = new RegExp('^' + key + ':(.*)$', 'm').exec(headerOf(text));
        return m ? m[1].trim() : '';
    };
    const row = (key, value) => '- ' + key + ': ' + (value || '-');
    return [
        row('Prompt-ID', id),
        row('Title', titleOf(text)),
        row('Lane', field('Lane')),
        row('Front', parseFrontLine(text)),
        row('Branch', o.branch),
        row('Worktree', o.worktree),
        row('Request', field('Request')),
        row('Prompt file', o.promptLink),
        '',
        'Written by `lane-run track` (RC-44): the card follows the lane, and an edit made here is overwritten.',
    ].join('\n') + '\n';
}

// ── gh, the card file and the lock ───────────────────────────────────────────

class TrackError extends Error {}

const GH_TIMEOUT_MS = 20000;
const LOCK_WAIT_MS = 20000;
const LOCK_STALE_MS = 120000;

const oneLine = (err) => (err instanceof Error ? err.message : String(err)).split('\n')[0].replace(/[^\x20-\x7e·]/g, '?');

/**
 * ~/.jjodel-lanes/_tracking/: the card files <Prompt-ID>.json, the board's
 * cached ids, and config.json, the enable switch. Not a `P-…` folder: every
 * `P-…` folder is a lane to status --all, and chain and merge refuse an id that
 * has one, so a Ready card kept there would be a phantom lane (report 4.1.5).
 */
export function trackingDir(home = homedir()) {
    return join(home, '.jjodel-lanes', '_tracking');
}

/** The enable switch (report answer 13): config.json of the tracking folder, parsed; null when it does not exist. Throws when it does not parse. */
export function trackingConfig(dir = trackingDir()) {
    const file = join(dir, 'config.json');
    if (!existsSync(file)) return null;
    let c;
    try {
        c = JSON.parse(readFileSync(file, 'utf8'));
    } catch (err) {
        throw new TrackError(file + ' does not parse: ' + oneLine(err));
    }
    return c && typeof c === 'object' ? c : {};
}

/** The gh to run: LANE_TRACK_GH (the tests), else config.json's `gh`, else the PATH. No fixed fallback, so a test lab never reaches the real gh. */
function ghBinary(config) {
    if (process.env.LANE_TRACK_GH) return process.env.LANE_TRACK_GH;
    if (config && typeof config.gh === 'string' && config.gh !== '') return config.gh;
    for (const d of (process.env.PATH || '').split(delimiter)) {
        const p = d ? join(d, 'gh') : '';
        if (p && existsSync(p) && statSync(p).isFile()) return p;
    }
    throw new TrackError('gh is not on the PATH and config.json names none');
}

/** gh with argv as given, its stdout; a TrackError naming the call and the first line of its stderr, `missing project scope` for a scope refusal. */
function ghCall(bin, args) {
    const r = spawnSync(bin, args, { encoding: 'utf8', timeout: GH_TIMEOUT_MS, maxBuffer: 16 * 1024 * 1024 });
    const what = 'gh ' + args.slice(0, 2).join(' ');
    if (r.error) throw new TrackError(r.error.code === 'ETIMEDOUT' ? what + ': no answer in ' + GH_TIMEOUT_MS / 1000 + ' s' : what + ': ' + r.error.message);
    if (r.status !== 0) {
        const text = (r.stderr || '') + '\n' + (r.stdout || '');
        if (/missing required scopes?|required scopes|INSUFFICIENT_SCOPES/i.test(text) && /project/i.test(text)) throw new TrackError('missing project scope');
        const line = text.split('\n').map((x) => x.trim()).find((x) => x !== '') || 'exit ' + r.status;
        throw new TrackError(what + ': ' + line);
    }
    return r.stdout;
}

function parseJson(out, args) {
    try {
        return JSON.parse(out);
    } catch {
        throw new TrackError('gh ' + args.slice(0, 2).join(' ') + ' returned no JSON');
    }
}

/** What a dry run prints for a write: the argv, the body left out. */
const describe = (args) => 'gh ' + args.map((a, i) => (args[i - 1] === '--body' ? '<body>' : /\s/.test(a) ? JSON.stringify(a) : a)).join(' ');

/** Reads always run; a dry run records each write in `plan` and answers it with a stand-in. */
function ghRunner(bin, dryRun, plan) {
    const write = (args) => {
        if (!dryRun) return ghCall(bin, args);
        plan.push(describe(args));
        if (args[0] === 'issue' && args[1] === 'create') return 'https://github.com/' + args[args.indexOf('--repo') + 1] + '/issues/(new)\n';
        if (args[0] === 'project' && args[1] === 'item-add') return '{"id":"(new item)"}';
        return '';
    };
    return {
        readJson: (args) => parseJson(ghCall(bin, args), args),
        write,
        writeJson: (args) => parseJson(write(args), args),
    };
}

function readJson(file) {
    try {
        return JSON.parse(readFileSync(file, 'utf8'));
    } catch {
        return null;
    }
}

/** Written whole or not at all: a reader never sees half a card file. */
function writeJson(file, value) {
    const tmp = file + '.tmp-' + process.pid;
    writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n');
    renameSync(tmp, file);
}

const sleepSync = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

/**
 * fn() under the mkdir lock <dir>/<id>.lock (report answer 7): the chat's
 * status or wait, a chain supervisor and start take turns on one card, so two
 * of them never both find no issue and both create one. A lock older than
 * LOCK_STALE_MS is a crashed holder's and is broken; a live one is waited for
 * up to LOCK_WAIT_MS, then the caller gives up, failing open.
 */
function withLock(dir, id, fn) {
    mkdirSync(dir, { recursive: true });
    const lock = join(dir, id + '.lock');
    const end = Date.now() + LOCK_WAIT_MS;
    for (;;) {
        try {
            mkdirSync(lock);
            break;
        } catch (err) {
            if (!err || err.code !== 'EEXIST') throw err;
        }
        let age;
        try {
            age = Date.now() - statSync(lock).mtimeMs;
        } catch {
            continue;
        }
        if (age > LOCK_STALE_MS) {
            try {
                rmdirSync(lock);
            } catch {
                // another caller broke it first
            }
            continue;
        }
        if (Date.now() >= end) throw new TrackError(id + ' is locked by another lane-run (' + lock + ')');
        sleepSync(100);
    }
    try {
        return fn();
    } finally {
        try {
            rmdirSync(lock);
        } catch {
            // already gone
        }
    }
}

const bodyHash = (body) => createHash('sha1').update(body).digest('hex');
const managed = (labels) => (labels || []).map((l) => (l && typeof l === 'object' ? l.name : l)).filter((n) => TRACK_LABELS.includes(n)).sort();

/** The text after `card: `: the issue URL and its column, the waiting labels, closed. */
const cardLine = (url, want) => url + ' · ' + want.column + (want.labels.length ? ' (' + want.labels.join(', ') + ')' : '') + (want.closed ? ', closed' : '');

/**
 * The Project's node id, its Status field and option ids, and the milestone
 * titles of the repo (gh issue takes a milestone by title): looked up once and
 * cached in project.json beside the card files, a milestone not yet cached
 * looked up again.
 */
function boardIds(gh, board, dir, milestone) {
    const file = join(dir, 'project.json');
    let c = readJson(file);
    if (!c || c.owner !== board.owner || c.project !== board.project || c.repo !== board.repo) {
        const p = gh.readJson(['project', 'view', String(board.project), '--owner', board.owner, '--format', 'json']);
        const list = gh.readJson(['project', 'field-list', String(board.project), '--owner', board.owner, '--format', 'json']);
        const status = ((list && list.fields) || []).find((x) => x && x.name === 'Status');
        if (!p || typeof p.id !== 'string' || !status || !Array.isArray(status.options)) throw new TrackError('Project ' + board.project + ' of ' + board.owner + ' has no Status field');
        c = { owner: board.owner, project: board.project, repo: board.repo, projectId: p.id, statusField: status.id, options: Object.fromEntries(status.options.map((x) => [x.name, x.id])), milestones: {} };
        writeJson(file, c);
    }
    if (milestone !== null && !(c.milestones && c.milestones[milestone])) {
        const ms = gh.readJson(['api', 'repos/' + board.repo + '/milestones?state=all&per_page=100']);
        c.milestones = Object.fromEntries((Array.isArray(ms) ? ms : []).map((m) => [m.number, m.title]));
        writeJson(file, c);
        if (!c.milestones[milestone]) throw new TrackError('no milestone ' + milestone + ' in ' + board.repo);
    }
    return c;
}

/** The issue whose title opens with the Prompt-ID, the oldest when there are several; null when none. */
function findIssue(gh, board, id) {
    const list = gh.readJson(['issue', 'list', '--repo', board.repo, '--state', 'all', '--search', '"' + id + '" in:title', '--json', 'number,title,url,state,labels,milestone,body', '--limit', '20']);
    const hits = (Array.isArray(list) ? list : []).filter((i) => i && typeof i.title === 'string' && (i.title === id || i.title.startsWith(id + ' ')));
    return hits.sort((a, b) => a.number - b.number)[0] || null;
}

/**
 * Applies a wanted card with gh only, under the lane's lock. Each step is
 * recorded in the card file <dir>/<id>.json at once (issue number and URL, item
 * id, what was applied), so a later call writes only the difference, and
 * nothing when there is none. The idempotency key is the Prompt-ID that opens
 * the issue title: a lost card file is healed by a search on the title, never
 * by a second create. Fails open (RC-15): a gh error, a missing project scope,
 * no network go to the card file and come back as one line; it never throws.
 * opts: { dir, config, board: { owner, project, repo }, meta: { title, body }, dryRun }.
 * Returns { ok, line } (and the planned writes, `plan`, on a dry run).
 */
export function syncCard(id, wanted, opts = {}) {
    const dir = opts.dir || trackingDir();
    const file = join(dir, id + '.json');
    const plan = [];
    const dry = Boolean(opts.dryRun);
    try {
        return withLock(dir, id, () => {
            const rec = readJson(file) || { v: 1, id, error: null };
            const save = () => {
                if (!dry) writeJson(file, rec);
            };
            try {
                const gh = ghRunner(ghBinary(opts.config), dry, plan);
                const { board, meta } = opts;
                if (!board || !meta) throw new TrackError('no board or no card text');
                const ids = boardIds(gh, board, dir, wanted.milestone);
                const option = ids.options[wanted.column];
                if (!option) throw new TrackError('Project ' + board.project + ' has no Status option "' + wanted.column + '"');
                const want = { column: wanted.column, labels: [...wanted.labels].sort(), milestone: wanted.milestone, closed: wanted.closed, body: bodyHash(meta.body) };
                const milestoneArg = () => ['--milestone', ids.milestones[want.milestone]];
                if (!rec.issue) {
                    const found = findIssue(gh, board, id);
                    if (found) {
                        rec.issue = found.number;
                        rec.url = found.url;
                        rec.applied = { column: null, labels: managed(found.labels), milestone: found.milestone ? found.milestone.number : null, closed: found.state === 'CLOSED', body: bodyHash(found.body || '') };
                        rec.healed = new Date().toISOString();
                    } else {
                        const args = ['issue', 'create', '--repo', board.repo, '--title', meta.title, '--body', meta.body, ...(want.milestone === null ? [] : milestoneArg())];
                        for (const l of want.labels) args.push('--label', l);
                        const url = gh.write(args).trim().split('\n').pop() || '';
                        const n = /\/issues\/(\d+)$/.exec(url);
                        if (!n && !dry) throw new TrackError('gh issue create printed no issue URL');
                        rec.issue = n ? Number(n[1]) : '(new)';
                        rec.url = url;
                        rec.applied = { column: null, labels: want.labels, milestone: want.milestone, closed: false, body: want.body };
                    }
                    rec.item = null;
                    save();
                }
                if (!rec.item) {
                    const item = gh.writeJson(['project', 'item-add', String(board.project), '--owner', board.owner, '--url', rec.url, '--format', 'json']);
                    if (!item || typeof item.id !== 'string') throw new TrackError('gh project item-add returned no item id');
                    rec.item = item.id;
                    rec.applied.column = null;
                    save();
                }
                // Closed or reopened before the column is set, so the column written last is this one.
                if (want.closed !== rec.applied.closed) {
                    gh.write(['issue', want.closed ? 'close' : 'reopen', String(rec.issue), '--repo', board.repo]);
                    rec.applied.closed = want.closed;
                    save();
                }
                if (rec.applied.column !== want.column) {
                    gh.write(['project', 'item-edit', '--id', rec.item, '--project-id', ids.projectId, '--field-id', ids.statusField, '--single-select-option-id', option]);
                    rec.applied.column = want.column;
                    save();
                }
                const edit = ['issue', 'edit', String(rec.issue), '--repo', board.repo];
                const add = want.labels.filter((l) => !rec.applied.labels.includes(l));
                const remove = rec.applied.labels.filter((l) => !want.labels.includes(l));
                if (add.length) edit.push('--add-label', add.join(','));
                if (remove.length) edit.push('--remove-label', remove.join(','));
                if (want.milestone !== rec.applied.milestone) edit.push(...(want.milestone === null ? ['--remove-milestone'] : milestoneArg()));
                if (want.body !== rec.applied.body) edit.push('--body', meta.body);
                if (edit.length > 5) {
                    gh.write(edit);
                    rec.applied = { ...rec.applied, labels: want.labels, milestone: want.milestone, body: want.body };
                    save();
                }
                if (rec.error) {
                    rec.error = null;
                    save();
                }
                if (dry) return { ok: true, plan, line: 'dry run: ' + (plan.length ? plan.join('; ') : 'nothing to write') + ' -> ' + cardLine(rec.url || '(no issue)', want) };
                return { ok: true, line: cardLine(rec.url, want) };
            } catch (err) {
                rec.error = oneLine(err);
                rec.errorAt = new Date().toISOString();
                save();
                return { ok: false, plan, line: 'tracking skipped: ' + rec.error };
            }
        });
    } catch (err) {
        return { ok: false, plan, line: 'tracking skipped: ' + oneLine(err) };
    }
}

/**
 * Closes the milestone of every front the registry marks `closed` (P13: the
 * sync closes it), when GitHub still has it open; one line per milestone
 * closed, none when no front is closed. Fails open, as syncCard.
 * opts: { config, board, dryRun }.
 */
export function closeFrontMilestones(fronts, opts = {}) {
    const closed = (Array.isArray(fronts) ? fronts : []).filter((f) => f && f.state === 'closed' && Number.isInteger(f.milestone));
    if (!closed.length) return [];
    const plan = [];
    try {
        const gh = ghRunner(ghBinary(opts.config), Boolean(opts.dryRun), plan);
        const repo = opts.board.repo;
        const ms = gh.readJson(['api', 'repos/' + repo + '/milestones?state=all&per_page=100']);
        const lines = [];
        for (const f of closed) {
            const m = (Array.isArray(ms) ? ms : []).find((x) => x && x.number === f.milestone);
            if (!m) lines.push('milestone ' + f.milestone + ' (' + f.slug + '): not in ' + repo);
            else if (m.state !== 'closed') {
                gh.write(['api', '-X', 'PATCH', 'repos/' + repo + '/milestones/' + f.milestone, '-f', 'state=closed']);
                lines.push('milestone ' + f.milestone + ' (' + f.slug + ') closed' + (opts.dryRun ? ' (dry run)' : ''));
            }
        }
        return lines;
    } catch (err) {
        return ['milestones: tracking skipped: ' + oneLine(err)];
    }
}

/**
 * One lane, end to end, as lane-run calls it: the enable switch first
 * (tracking runs only when <dir>/config.json exists), then observe() (called
 * only when tracking is on), projectLane, syncCard. Returns { line }, the text
 * after `card: `; never throws. opts: { dir, board (or a function returning
 * it), dryRun }.
 */
export function trackLane(id, observe, opts = {}) {
    const dir = opts.dir || trackingDir();
    try {
        const config = trackingConfig(dir);
        if (!config) return { line: 'tracking off (no ' + join(dir, 'config.json') + ')' };
        const observed = typeof observe === 'function' ? observe() : observe;
        const wanted = projectLane(id, observed);
        if (wanted.skip) return { line: 'none: ' + wanted.skip, skip: wanted.skip };
        const board = typeof opts.board === 'function' ? opts.board() : opts.board;
        return syncCard(id, wanted, { dir, config, board, meta: { title: cardTitle(id, observed), body: cardBody(id, observed) }, dryRun: opts.dryRun });
    } catch (err) {
        return { line: 'tracking skipped: ' + oneLine(err) };
    }
}
