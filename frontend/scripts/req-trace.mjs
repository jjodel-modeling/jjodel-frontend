/**
 * req-trace.mjs: the requirements of docs/decisions.md traced to the trunk
 * (P-2026-10-05-1720). Read-only over a checkout: it reads docs/decisions.md,
 * docs/prompts/ and docs/goals/ from the working tree and the history of the
 * trunk from git, and writes only its cache, outside the tree.
 *
 *   node req-trace.mjs [--repo <checkout>] [--trunk <ref>] [--with-rc]
 *                      [--cache-dir <dir> | --no-cache] [--seed <n>] [--pretty]
 *
 * Emits one JSON document on stdout:
 *   rows       every R- row of the register (RC rows with --with-rc): id, family,
 *              title (the bold head, else the first sentence), date, status
 *              (ratified | provisional | superseded), evidence, verified; realized
 *              (a feat|fix|refactor|perf commit reachable from the trunk cites the
 *              id in its subject or body), those commits (sha, date, subject,
 *              Prompt-ID), the trunk merge that brought the first one in (null when
 *              it was committed on the trunk itself); the rows that cite it, split
 *              into evolution links (amends, supersedes, refines, renumbered) and
 *              the rest; its cluster and its milestone; its goal-model contributions.
 *   clusters   Louvain (fixed seed) on the co-citation graph of docs/prompts/: an
 *              edge when one prompt cites both rows; merge prompts and prompts
 *              citing more than 25 rows are left out. Key: the smallest member id;
 *              name: docs/goals/cluster-names.json when it maps the key, else the
 *              dominant families and the three most frequent title words. With the
 *              modularity and the share of rows left unclustered (no co-citation).
 *   milestones docs/goals/milestones.json ([{id, name, date}]), else the one
 *              built-in milestone, MODELS freeze 2026-10-07. A realized row goes
 *              to the first milestone on or after the date of its first commit.
 *   goalModel  docs/goals/softgoals.json and contributions.json (conflicts.json
 *              optional), when present: per cluster the help and hurt totals per
 *              softgoal, and the realized rows that pull a softgoal both ways.
 *
 * The git side (the typed commits and their trunk merges) is cached in
 * <cache-dir>/<trunk sha>.json, by default in the system temp folder: a new
 * trunk sha recomputes it, the register and the prompts are read every time.
 *
 * Plain ES module, nothing outside node:*, like lane-run.mjs beside it.
 * Exit codes: 0 done, 2 refused (no register, an unknown trunk).
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, renameSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_TRUNK = 'alfonso-frontend-jjtl';
const CACHE_VERSION = 1;
const MAX_ROWS_PER_PROMPT = 25;
const RANGE_MAX = 40;
const BUILT_IN_MILESTONES = [{ id: 'MODELS', name: 'MODELS freeze', date: '2026-10-07', source: 'built-in' }];
const CODE_TYPE = /^(feat|fix|refactor|perf)(\([^)]*\))?!?:/;
const PROMPT_ID = /P-\d{4}-\d{2}-\d{2}-\d{4}/;
const ROW_START = /^(?:- )?\*\*((?:RC|R)-[A-Za-z0-9/]+(?:-[A-Za-z0-9]+)*)\*\*/;
const ID_TOKEN = /(?<![A-Za-z0-9-])(?:RC|R)-[A-Za-z0-9/]+(?:-[A-Za-z0-9]+)*/g;
const POSITIVE = new Set(['make', 'help', 'some+']);
const NEGATIVE = new Set(['some-', 'hurt', 'break']);

/** Natural order of ids: R-SIM-3 before R-SIM-21. */
export const byId = (a, b) => a.localeCompare(b, 'en', { numeric: true });

/** The family of an id: R-SIM-45 -> R-SIM, R-B15 -> R-B, R-VAL-6-bis -> R-VAL, RC-3 -> RC. */
export function familyOf(id) {
    return id.replace(/-(bis|ter|quater)$/i, '').replace(/-?\d+[a-z]?$/, '') || id;
}

/** Every R-/RC- token of a text, ranges `R-X-1..4` expanded, in order of appearance. */
function idTokens(text) {
    const out = [];
    for (const m of text.matchAll(ID_TOKEN)) {
        const tok = m[0].replace(/[-/]+$/, '');
        out.push({ id: tok, at: m.index });
        const tail = text.slice(m.index + m[0].length);
        const r = /^\.\.(?:(?:RC|R)-[A-Za-z0-9/]+-)?(\d+)\b/.exec(tail);
        const n = /^(.*?)(\d+)$/.exec(tok);
        if (r && n) {
            const from = Number(n[2]), to = Number(r[1]);
            if (to > from && to - from <= RANGE_MAX) for (let k = from + 1; k <= to; k++) out.push({ id: n[1] + k, at: m.index });
        }
    }
    return out;
}

/** A token resolved to a known id: itself, else itself without trailing -segments (R-IRN-12-like -> R-IRN-12). */
function resolveId(tok, known) {
    let t = tok;
    for (;;) {
        if (known.has(t)) return t;
        const cut = t.replace(/-[A-Za-z0-9]+$/, '');
        if (cut === t || !/-/.test(cut.slice(2))) return known.has(cut) ? cut : null;
        t = cut;
    }
}

/** The known ids a text cites, unique, in order of first appearance. */
export function idsIn(text, known) {
    const seen = new Set();
    for (const { id } of idTokens(text)) {
        const k = resolveId(id, known);
        if (k) seen.add(k);
    }
    return [...seen];
}

/** The kind of evolution link a mention carries, read from the clause before it and its sentence; null for a plain citation. */
function linkKind(before, sentence) {
    if (/(superat[ao]|superseded|sostituit[ao]|replaced)\s+(da|by)\s*$/i.test(before)) return 'superseded-by';
    if (/renumber|rinumer/i.test(sentence) && (/renumber|rinumer/i.test(before) || /\b(was|gi[aà]|ex|formerly)\s*$/i.test(before))) return 'renumbered';
    if (/supersed|sostitui|\bsupera\b|replac/i.test(before)) return 'supersedes';
    if (/amend|emend|modific/i.test(before)) return 'amends';
    if (/refin|raffin|complet|precis|extend|estend|delimit/i.test(before)) return 'refines';
    return null;
}

/** The parenthetical right after the id, balanced; '' when there is none. */
function parenthetical(s) {
    const m = /^\s*\(/.exec(s);
    if (!m) return { text: '', rest: s };
    let depth = 0;
    for (let i = m[0].length - 1; i < s.length; i++) {
        if (s[i] === '(') depth++;
        else if (s[i] === ')' && --depth === 0) return { text: s.slice(m[0].length, i), rest: s.slice(i + 1) };
    }
    return { text: '', rest: s };
}

const squash = (s) => s.replace(/\s+/g, ' ').trim();

/** The bold head after the parenthetical, else the first sentence of the body. */
function titleOf(rest) {
    const body = rest.replace(/^[\s.:—–-]+/, '');
    const bold = /^\*\*([\s\S]+?)\*\*/.exec(body);
    if (bold) return squash(bold[1]);
    const first = squash(body.split(/\n\s*\n/)[0]).replace(/\*\*/g, '');
    const s = /^(.+?[.!?])(\s|$)/.exec(first);
    const t = s ? s[1] : first;
    return t.length > 140 ? t.slice(0, 137) + '...' : t;
}

/**
 * The rows of the register. A row opens with a bold id (bullet or paragraph) and
 * runs to a blank line not followed by an indented line, a heading, or the next
 * top-level item. Rows in `## Superate`, rows a later row supersedes, and rows
 * whose head says they were superseded read `superseded`.
 */
export function parseRegister(text, { withRc = false } = {}) {
    const lines = text.split('\n');
    const raw = [];
    const supersededIds = new Set();
    let section = '';
    let cur = null;
    const close = () => { if (cur) { raw.push(cur); cur = null; } };
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/^#{1,6}\s/.test(line)) {
            close();
            if (/^##\s/.test(line)) section = line.replace(/^##\s+/, '').trim();
            continue;
        }
        const start = ROW_START.exec(line);
        const superate = /^superate\b/i.test(section);
        if (superate && /^- /.test(line)) {
            const t = idTokens(line.slice(2, 120))[0];
            if (t && line.slice(2).replace(/^\*\*/, '').startsWith(t.id)) supersededIds.add(t.id);
        }
        if (start) {
            close();
            cur = { id: start[1], line: i + 1, section, lines: [line] };
            continue;
        }
        if (!cur) continue;
        if (line.trim() === '') {
            let j = i + 1;
            while (j < lines.length && lines[j].trim() === '') j++;
            if (j < lines.length && /^\s+\S/.test(lines[j]) && !ROW_START.test(lines[j])) { cur.lines.push(line); continue; }
            close();
            continue;
        }
        if (/^(- |\*\*|\d+\. |\||---)/.test(line)) { close(); continue; }
        cur.lines.push(line);
    }
    close();

    const rows = [];
    const seen = new Set();
    for (const r of raw) {
        const rc = r.id.startsWith('RC-');
        if ((rc && !withRc) || seen.has(r.id)) continue;
        seen.add(r.id);
        const body = r.lines.join('\n').replace(ROW_START, '');
        const p = parenthetical(body);
        const head = p.text;
        const title = titleOf(p.rest);
        const date = (/\d{4}-\d{2}-\d{2}/.exec(head) || /\d{4}-\d{2}-\d{2}/.exec(body) || [null])[0];
        let status = /provisional|provvisori/i.test(head) ? 'provisional' : 'ratified';
        if (/^superate\b/i.test(r.section) || supersededIds.has(r.id)) status = 'superseded';
        if (/(superat[ao]|superseded|withdrawn|ritirat[ao])\b/i.test(head)) status = 'superseded';
        rows.push({
            id: r.id, family: familyOf(r.id), rc, title, date, status,
            evidence: (/evidence:\s*([a-z]+)/i.exec(head) || [null, null])[1],
            verified: (/verified:\s*([a-z]+)/i.exec(head) || [null, null])[1],
            line: r.line, section: r.section, text: r.lines.join('\n'),
            evolves: [], cites: [], citedBy: { evolution: [], other: [] },
        });
    }
    const known = new Set(rows.map((r) => r.id));
    const index = new Map(rows.map((r) => [r.id, r]));
    const addEvolution = (target, source, kind) => {
        const t = index.get(target);
        if (t && !t.citedBy.evolution.some((e) => e.id === source && e.kind === kind)) t.citedBy.evolution.push({ id: source, kind });
    };
    for (const r of rows) {
        const sentences = [];
        const re = /[^.;!?\n]*(?:[.;!?](?=\s|$)|\n|$)/g;
        let m;
        const body = r.text.replace(ROW_START, (x) => ' '.repeat(x.length));
        while ((m = re.exec(body)) && m[0] !== '') sentences.push({ s: m[0], at: m.index });
        for (const { s, at } of sentences) {
            let prev = 0;
            for (const t of idTokens(s)) {
                const id = resolveId(t.id, known) || t.id;
                if (id === r.id) { prev = t.at + t.id.length; continue; }
                const kind = linkKind(s.slice(prev, t.at), s);
                prev = Math.max(prev, t.at + t.id.length);
                if (kind === 'superseded-by') {
                    if (known.has(id)) { addEvolution(r.id, id, 'supersedes'); r.status = 'superseded'; }
                    continue;
                }
                if (kind) {
                    if (!r.evolves.some((e) => e.id === id && e.kind === kind)) r.evolves.push({ id, kind });
                    addEvolution(id, r.id, kind);
                    if (kind === 'supersedes' && index.has(id)) index.get(id).status = 'superseded';
                } else if (known.has(id) && !r.cites.includes(id)) {
                    r.cites.push(id);
                }
            }
            void at;
        }
    }
    for (const r of rows) {
        for (const id of r.cites) {
            const t = index.get(id);
            if (t && !t.citedBy.other.includes(r.id) && !t.citedBy.evolution.some((e) => e.id === r.id)) t.citedBy.other.push(r.id);
        }
    }
    return { rows, byId: index };
}

// ── git ──────────────────────────────────────────────────────────────────────

function git(cwd, args) {
    const r = spawnSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 });
    if (r.status !== 0) throw new Refusal('git ' + args.join(' ') + ': ' + (r.stderr || '').trim());
    return r.stdout;
}

class Refusal extends Error {}

/**
 * The typed commits reachable from the trunk that cite at least one id, and the
 * trunk merge that brought each one in (absent for a commit on the first-parent
 * chain). Independent of the register: ids are kept as raw tokens.
 */
function gitIndex(repo, sha) {
    const out = git(repo, ['log', sha, '--format=%H%x1f%cI%x1f%s%x1f%b%x1e']);
    const commits = [];
    for (const rec of out.split('\x1e')) {
        const [h, date, subject, body = ''] = rec.replace(/^\n/, '').split('\x1f');
        if (!h || !CODE_TYPE.test(subject)) continue;
        const tokens = [...new Set(idTokens(subject + '\n' + body).map((t) => t.id))];
        if (!tokens.length) continue;
        const pid = PROMPT_ID.exec(subject) || PROMPT_ID.exec(body);
        commits.push({ sha: h, date, subject, promptId: pid ? pid[0] : null, tokens });
    }
    const firstParent = new Set(git(repo, ['rev-list', '--first-parent', sha]).split('\n').filter(Boolean));
    const want = new Set(commits.map((c) => c.sha).filter((h) => !firstParent.has(h)));
    const merges = {};
    if (want.size) {
        const list = git(repo, ['log', '--first-parent', '--merges', '--reverse', '--format=%H%x1f%P%x1f%cI%x1f%s', sha]).split('\n').filter(Boolean);
        for (const line of list) {
            const [m, parents, date, subject] = line.split('\x1f');
            const ps = parents.split(' ');
            if (ps.length < 2) continue;
            const brought = git(repo, ['rev-list', ...ps.slice(1), '--not', ps[0]]).split('\n').filter(Boolean);
            for (const c of brought) {
                if (want.has(c)) { merges[c] = { sha: m, date, subject }; want.delete(c); }
            }
            if (!want.size) break;
        }
    }
    return { version: CACHE_VERSION, sha, commits, merges };
}

function cachedGitIndex(repo, sha, cacheDir) {
    const file = cacheDir ? join(cacheDir, sha + '.json') : null;
    if (file && existsSync(file)) {
        try {
            const c = JSON.parse(readFileSync(file, 'utf8'));
            if (c.version === CACHE_VERSION && c.sha === sha) return c;
        } catch { /* rebuilt below */ }
    }
    const idx = gitIndex(repo, sha);
    if (file) {
        try {
            mkdirSync(cacheDir, { recursive: true });
            writeFileSync(file + '.tmp', JSON.stringify(idx));
            renameSync(file + '.tmp', file);
        } catch { /* a cache that cannot be written is only slower */ }
    }
    return idx;
}

// ── clusters ─────────────────────────────────────────────────────────────────

/** A seeded generator (mulberry32): the same seed, the same visiting order. */
function rng(seed) {
    let s = seed >>> 0;
    return () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Louvain (Blondel et al. 2008) on an undirected weighted graph: local moving in
 * a seeded random order, then aggregation, until no node moves. Returns the
 * community of every node (labels numbered by first appearance in `nodes`) and the
 * modularity of the partition on the original graph.
 */
export function louvain(nodes, edges, { seed = 1 } = {}) {
    const idx = new Map(nodes.map((n, i) => [n, i]));
    let adj = nodes.map(() => new Map());
    for (const [a, b, w = 1] of edges) {
        const i = idx.get(a), j = idx.get(b);
        if (i === undefined || j === undefined || !(w > 0)) continue;
        adj[i].set(j, (adj[i].get(j) || 0) + w);
        if (i !== j) adj[j].set(i, (adj[j].get(i) || 0) + w);
        else adj[i].set(i, adj[i].get(i) + w);
    }
    const original = adj;
    let member = nodes.map((_, i) => i);
    const next = rng(seed);
    for (let level = 0; level < 64; level++) {
        const n = adj.length;
        const k = adj.map((m) => [...m.values()].reduce((s, w) => s + w, 0));
        const m2 = k.reduce((s, x) => s + x, 0);
        if (m2 === 0) break;
        const comm = adj.map((_, i) => i);
        const tot = k.slice();
        let movedAny = false;
        for (let pass = 0; pass < 1000; pass++) {
            const order = adj.map((_, i) => i);
            for (let i = n - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
            let moved = false;
            for (const i of order) {
                const ci = comm[i];
                const wTo = new Map();
                for (const [j, w] of adj[i]) if (j !== i) wTo.set(comm[j], (wTo.get(comm[j]) || 0) + w);
                tot[ci] -= k[i];
                let best = ci, gain = (wTo.get(ci) || 0) - (tot[ci] * k[i]) / m2;
                for (const [c, w] of wTo) {
                    const g = w - (tot[c] * k[i]) / m2;
                    if (g > gain + 1e-12) { best = c; gain = g; }
                }
                tot[best] += k[i];
                if (best !== ci) { comm[i] = best; moved = true; movedAny = true; }
            }
            if (!moved) break;
        }
        if (!movedAny) break;
        const label = new Map();
        comm.forEach((c) => { if (!label.has(c)) label.set(c, label.size); });
        member = member.map((c) => label.get(comm[c]));
        const agg = [...label.keys()].map(() => new Map());
        adj.forEach((m, i) => {
            const ci = label.get(comm[i]);
            for (const [j, w] of m) {
                const cj = label.get(comm[j]);
                agg[ci].set(cj, (agg[ci].get(cj) || 0) + w);
            }
        });
        adj = agg;
    }
    // Relabel by first appearance in `nodes`, then measure Q on the original graph.
    const label = new Map();
    member.forEach((c) => { if (!label.has(c)) label.set(c, label.size); });
    const membership = new Map(nodes.map((n, i) => [n, label.get(member[i])]));
    const k = original.map((m) => [...m.values()].reduce((s, w) => s + w, 0));
    const m2 = k.reduce((s, x) => s + x, 0);
    let modularity = 0;
    if (m2 > 0) {
        const inC = new Map(), totC = new Map();
        original.forEach((m, i) => {
            const c = label.get(member[i]);
            totC.set(c, (totC.get(c) || 0) + k[i]);
            for (const [j, w] of m) if (label.get(member[j]) === c) inC.set(c, (inC.get(c) || 0) + w);
        });
        for (const [c, t] of totC) modularity += (inC.get(c) || 0) / m2 - (t / m2) ** 2;
    }
    return { membership, modularity };
}

const isMergePrompt = (text) => /^# Prompt:\s*merge\b/im.test(text.slice(0, 600)) || /^Lane:\s*(full\s*\(\s*)?merge\b/im.test(text.slice(0, 1200));

/** The co-citation graph of a set of prompts: an edge per pair of known rows one prompt cites, weighted by the prompts. */
export function coCitation(prompts, known, { maxRows = MAX_ROWS_PER_PROMPT } = {}) {
    const w = new Map();
    const excluded = [];
    let used = 0;
    for (const p of prompts) {
        const ids = idsIn(p.text, known);
        if (isMergePrompt(p.text) || ids.length > maxRows) { excluded.push(p.name); continue; }
        if (ids.length < 2) continue;
        used++;
        const s = ids.sort(byId);
        for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) {
            const key = s[i] + '\t' + s[j];
            w.set(key, (w.get(key) || 0) + 1);
        }
    }
    const edges = [...w].map(([key, n]) => [...key.split('\t'), n]).sort((a, b) => byId(a[0], b[0]) || byId(a[1], b[1]));
    return { edges, excluded, used };
}

const STOP = new Set(('the and for with from that this into when then than over under only each their there which while what where without ' +
    'della delle degli dello nella nelle nello alla alle allo dalla dalle sono come anche quando dove resta resto senza ogni solo prima dopo ' +
    'perché perche questa questo quella quello sulla sulle sono essere viene vengono tutti tutte stesso stessa fino dentro fuori more less ' +
    'does have must stays stay come una uno gli non per con dell nell sull all ' +
    // the register's own evolution vocabulary says how a row relates, not what it is about
    'amends amend amending emenda emendamento completa completes refines supersedes supera renumbered').split(' '));

function autoLabel(members) {
    const fam = new Map();
    const words = new Map();
    for (const r of members) {
        fam.set(r.family, (fam.get(r.family) || 0) + 1);
        const ws = new Set(String(r.title || '').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((x) => x.length >= 4 && !STOP.has(x) && !/^\d+$/.test(x)));
        for (const x of ws) words.set(x, (words.get(x) || 0) + 1);
    }
    const fams = [...fam].sort((a, b) => b[1] - a[1] || byId(a[0], b[0])).filter(([, n], i) => i === 0 || n >= 0.25 * members.length).slice(0, 2).map(([f]) => f);
    const top = [...words].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 3).map(([x]) => x);
    return fams.join(' · ') + (top.length ? ' — ' + top.join(', ') : '');
}

/** The clusters of the rows: Louvain on the co-citation graph, singletons left unclustered. */
export function clusterRows(rows, prompts, { seed = 1, names = {}, maxRows = MAX_ROWS_PER_PROMPT } = {}) {
    const known = new Set(rows.map((r) => r.id));
    const g = coCitation(prompts, known, { maxRows });
    const ids = rows.map((r) => r.id);
    const { membership, modularity } = louvain(ids, g.edges, { seed });
    const groups = new Map();
    for (const id of ids) {
        const c = membership.get(id);
        if (!groups.has(c)) groups.set(c, []);
        groups.get(c).push(id);
    }
    const index = new Map(rows.map((r) => [r.id, r]));
    const list = [];
    const byRow = new Map();
    let unclustered = 0;
    for (const members of groups.values()) {
        if (members.length < 2) { unclustered += members.length; continue; }
        members.sort(byId);
        const key = members[0];
        const auto = autoLabel(members.map((id) => index.get(id)));
        const families = {};
        members.forEach((id) => { const f = index.get(id).family; families[f] = (families[f] || 0) + 1; });
        list.push({ key, name: names[key] || auto, auto, size: members.length, members, families });
        members.forEach((id) => byRow.set(id, key));
    }
    list.sort((a, b) => b.size - a.size || byId(a.key, b.key));
    return {
        list, byRow, modularity,
        unclusteredShare: ids.length ? unclustered / ids.length : 0,
        unclustered,
        prompts: { total: prompts.length, used: g.used, excluded: g.excluded.length },
        edges: g.edges.length,
    };
}

// ── milestones and the goal model ────────────────────────────────────────────

/** The first milestone on or after the day of the row's first commit; null when not realized or after the last. */
export function assignMilestones(rows, milestones) {
    const ms = milestones.slice().sort((a, b) => a.date.localeCompare(b.date));
    for (const r of rows) {
        const first = r.commits && r.commits.length ? r.commits[0].date.slice(0, 10) : null;
        const m = first ? ms.find((x) => x.date >= first) : null;
        r.milestone = m ? m.id : null;
    }
    return ms;
}

/** The goal model joined to the rows and clusters; `goals` null when its files are absent. */
export function joinGoals(rows, clusters, goals) {
    if (!goals) {
        rows.forEach((r) => { r.contributions = []; });
        return { present: false, softgoals: [], conflicts: [], opposing: [] };
    }
    const byReq = new Map();
    for (const c of goals.contributions || []) {
        if (!byReq.has(c.req)) byReq.set(c.req, []);
        byReq.get(c.req).push({ softgoal: c.softgoal, kind: c.kind, evidence: c.evidence, verified: c.verified, why: c.why });
    }
    rows.forEach((r) => { r.contributions = byReq.get(r.id) || []; });
    for (const cl of clusters.list || []) {
        const totals = {};
        for (const id of cl.members) for (const c of byReq.get(id) || []) {
            const t = totals[c.softgoal] || (totals[c.softgoal] = { help: 0, hurt: 0 });
            if (POSITIVE.has(c.kind)) t.help++;
            else if (NEGATIVE.has(c.kind)) t.hurt++;
        }
        cl.goals = totals;
    }
    const opposing = [];
    const realized = rows.filter((r) => r.realized);
    for (const sg of goals.softgoals || []) {
        const pos = realized.filter((r) => r.contributions.some((c) => c.softgoal === sg.id && POSITIVE.has(c.kind)));
        const neg = realized.filter((r) => r.contributions.some((c) => c.softgoal === sg.id && NEGATIVE.has(c.kind)));
        for (const a of pos) for (const b of neg) if (a.id !== b.id) opposing.push({ a: a.id, b: b.id, softgoal: sg.id });
    }
    return { present: true, softgoals: goals.softgoals || [], conflicts: goals.conflicts || [], opposing };
}

const readJson = (path) => (existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null);

// ── the document ─────────────────────────────────────────────────────────────

/** The whole trace of a checkout, as the CLI prints it. */
export function trace({ repo, trunk = DEFAULT_TRUNK, withRc = false, cacheDir = join(tmpdir(), 'jjodel-req-trace'), seed = 1 } = {}) {
    const regPath = join(repo, 'docs', 'decisions.md');
    if (!existsSync(regPath)) throw new Refusal('no register: ' + regPath);
    const { rows } = parseRegister(readFileSync(regPath, 'utf8'), { withRc });
    const known = new Set(rows.map((r) => r.id));
    const sha = git(repo, ['rev-parse', '--verify', trunk + '^{commit}']).trim();
    const idx = cachedGitIndex(repo, sha, cacheDir);
    const perId = new Map();
    for (const c of idx.commits) {
        const ids = new Set(c.tokens.map((t) => resolveId(t, known)).filter(Boolean));
        for (const id of ids) {
            if (!perId.has(id)) perId.set(id, []);
            perId.get(id).push({ sha: c.sha, date: c.date, subject: c.subject, promptId: c.promptId });
        }
    }
    for (const r of rows) {
        const cs = (perId.get(r.id) || []).sort((a, b) => a.date.localeCompare(b.date) || a.sha.localeCompare(b.sha));
        r.commits = cs;
        r.realized = cs.length > 0;
        r.trunkMerge = cs.length ? idx.merges[cs[0].sha] || null : null;
    }

    const goalsDir = join(repo, 'docs', 'goals');
    const promptsDir = join(repo, 'docs', 'prompts');
    const prompts = existsSync(promptsDir)
        ? readdirSync(promptsDir).filter((n) => n.endsWith('.md')).sort().map((n) => ({ name: n, text: readFileSync(join(promptsDir, n), 'utf8') }))
        : [];
    const clusters = clusterRows(rows, prompts, { seed, names: readJson(join(goalsDir, 'cluster-names.json')) || {} });
    rows.forEach((r) => { r.cluster = clusters.byRow.get(r.id) || null; });

    const msFile = readJson(join(goalsDir, 'milestones.json'));
    const milestones = assignMilestones(rows, msFile ? msFile.map((m) => ({ id: m.id, name: m.name, date: m.date, source: 'docs/goals/milestones.json' })) : BUILT_IN_MILESTONES);

    const softgoals = readJson(join(goalsDir, 'softgoals.json'));
    const contributions = readJson(join(goalsDir, 'contributions.json'));
    const goalModel = joinGoals(rows, clusters, softgoals && contributions ? { softgoals, contributions, conflicts: readJson(join(goalsDir, 'conflicts.json')) || [] } : null);

    const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).stdout.trim() || null;
    const count = (f) => rows.filter(f).length;
    return {
        generated: new Date().toISOString(),
        repo, head, trunk: { ref: trunk, sha },
        counts: {
            rows: rows.length, realized: count((r) => r.realized), ratified: count((r) => r.status === 'ratified'),
            provisional: count((r) => r.status === 'provisional'), superseded: count((r) => r.status === 'superseded'), rc: count((r) => r.rc),
        },
        clusters: {
            modularity: clusters.modularity, unclusteredShare: clusters.unclusteredShare, unclustered: clusters.unclustered,
            edges: clusters.edges, prompts: clusters.prompts, seed,
            list: clusters.list,
        },
        milestones,
        goalModel,
        rows: rows.map(({ text, section, ...r }) => r),
    };
}

function option(argv, name) {
    const at = argv.indexOf(name);
    return at === -1 ? null : argv[at + 1] ?? null;
}

function main(argv) {
    const repo = resolve(option(argv, '--repo') || resolve(dirname(fileURLToPath(import.meta.url)), '..', '..'));
    const doc = trace({
        repo,
        trunk: option(argv, '--trunk') || DEFAULT_TRUNK,
        withRc: argv.includes('--with-rc'),
        cacheDir: argv.includes('--no-cache') ? null : option(argv, '--cache-dir') || join(tmpdir(), 'jjodel-req-trace'),
        seed: Number(option(argv, '--seed') || 1),
    });
    process.stdout.write(JSON.stringify(doc, null, argv.includes('--pretty') ? 2 : 0) + '\n');
    return 0;
}

// Run as a script, also through a symlinked path (/tmp is /private/tmp on macOS): compare real paths.
const isMain = () => { try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); } catch { return false; } };
if (process.argv[1] && isMain()) {
    try {
        // exitCode, not exit(): exit() drops what a pipe has not drained yet (measured: cut at 64 KB under the board).
        process.exitCode = main(process.argv.slice(2));
    } catch (err) {
        console.error('req-trace: ' + (err && err.message ? err.message : String(err)));
        process.exit(err instanceof Refusal ? 2 : 1);
    }
}
