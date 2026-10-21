// Markdown -> JSONL importer of Jjodel's prompt log (CLAUDE.md §21.2 entries) into contract v1.
// Reads the trunk's docs/log-inbox/*.md, docs/claude-code-log.md and docs/claude-code-log-archive.md with
// `git show <trunk>:<file>` (read-only, as the lane board's logEntries does), splits and parses them with the
// rules of frontend/scripts/gates/log-tools.ts (splitLog, parseFields, entryType: copied and adapted here,
// not imported), maps the fields by discovery 2026-10-19 §5.1 and keeps the lines that pass `tack check`.
// Dropped: Smoke visivo, Layer Impact Report (Jjodel-only), Files touched (paths; optional in v1) and Notes
// (optional; Jjodel notes often exceed the 500-character cap). The output goes outside the repository.
import { existsSync, mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { validateText } from '../contract/validate.mjs';
import { git } from '../collectors/git/run.mjs';

export const DEFAULT_TRUNK = 'alfonso-frontend-jjtl';
export const importsRoot = () => process.env.TACK_IMPORTS || join(homedir(), '.tack', 'imports');

// log-tools.ts: ENTRY_HEADING, FIELD_LINE, TICKET_HEADING, TICKET_LINT_FROM_DATE.
const ENTRY_HEADING = /^## (\d{4}-\d{2}-\d{2})(?: \d{2}:\d{2})? — /;
const FIELD_LINE = /^\*\*([^*]+)\*\*:\s?(.*)$/;
const TICKET_HEADING = /^## \d{4}-\d{2}-\d{2}(?: \d{2}:\d{2})? — ticket: /;
const TICKET_LINT_FROM_DATE = '2026-09-24';

/** The entries of a log text: heading, date, text (log-tools.ts splitLog, the header dropped). */
export function splitLog(text) {
  const lines = text.split('\n');
  const heads = [];
  lines.forEach((l, i) => { if (ENTRY_HEADING.test(l)) heads.push(i); });
  return heads.map((start, k) => ({
    heading: lines[start],
    date: ENTRY_HEADING.exec(lines[start])[1],
    text: lines.slice(start, k + 1 < heads.length ? heads[k + 1] : lines.length).join('\n'),
  }));
}

/** Field lines of one entry, first occurrence wins (log-tools.ts parseFields). */
export function parseFields(text) {
  const fields = new Map();
  for (const line of text.split('\n')) {
    const f = FIELD_LINE.exec(line);
    if (f && !fields.has(f[1])) fields.set(f[1], f[2].trim());
  }
  return fields;
}

/** 'ticket' for the colon heading from 2026-09-24, else 'task' (log-tools.ts entryType). */
export const entryType = (e) => (TICKET_HEADING.test(e.heading) && e.date >= TICKET_LINT_FROM_DATE ? 'ticket' : 'task');

// The lane board's id rules (lane-board.mjs logEntries :1303-1334): a heading (P-...) or the Prompt document
// name's time stamp; a Corregge's first P-id, else a prompt file name, else a time stamp.
const stampPid = (s) => { const m = /(\d{4})-(\d{2})-(\d{2})[ T_](\d{2}):?(\d{2})/.exec(s || ''); return m ? `P-${m[1]}-${m[2]}-${m[3]}-${m[4]}${m[5]}` : ''; };
const filePid = (s) => { const m = /claude_(\d{4}-\d{2}-\d{2})_(\d{4})_/.exec(s || ''); return m ? `P-${m[1]}-${m[2]}` : ''; };
export const entryUnit = (heading, fields) => (/\((P-\d{4}-\d{2}-\d{2}-\d{4})\)/.exec(heading) || [])[1] || stampPid(fields.get('Prompt document name'));
export function correctsUnit(value) {
  const c = (value || '').trim();
  if (c === '' || /^[—-]/.test(c)) return null;
  return (/P-\d{4}-\d{2}-\d{2}-\d{4}/.exec(c) || [])[0] || filePid(c) || stampPid(c) || null;
}

const firstWord = (v) => (v || '').trim().split(/[ .,;(]/)[0].toLowerCase();
const clip = (s, n) => (s.length <= n ? s : s.slice(0, n - 1) + '…');

/** One raw entry -> a contract v1 object (not yet validated), or { skip: rule } when a field cannot be mapped at all. */
export function toContract(raw) {
  const fields = parseFields(raw.text);
  const type = entryType(raw);
  const rest = raw.heading.replace(ENTRY_HEADING, '');
  const km = /^([A-Za-z][\w-]*(?: [a-z]+)?):\s*(.*)$/.exec(rest);
  const kind = km ? km[1] : '';
  const title = clip((km ? km[2] : rest).trim() || rest.trim(), 200);
  const unit = entryUnit(raw.heading, fields) || undefined;
  if (type === 'ticket') {
    const e = { contract: 1, type, date: raw.date, title, ...(unit ? { unit } : {}),
      finding: fields.get('Ticket') ?? '', priority: firstWord(fields.get('Priority')), found_in: (fields.get('Found in') || '').trim() };
    if (fields.get('Detail')) e.detail = fields.get('Detail');
    return e;
  }
  const o = fields.get('Outcome') || '';
  const outcome = o.includes('\u2705') ? 'completed' : o.includes('\u26a0') ? 'partial' : o.includes('\u274c') ? 'problems' : undefined;
  const cause = ((fields.get('Causa') || '').match(/\(([a-g])\)|^([a-g])\b/) || []).slice(1).find(Boolean) || null;
  const reg = firstWord(fields.get('Regressions'));
  const oos = firstWord(fields.get('Out-of-scope changes'));
  const e = {
    contract: 1, type, date: raw.date, title, ...(kind ? { kind } : {}), ...(unit ? { unit } : {}),
    summary: fields.get('Prompt') ?? '',
    ...(outcome ? { outcome } : {}),
    corrects: correctsUnit(fields.get('Corregge')),
    cause,
    ...(fields.has('Regressions') ? { regressions: reg } : {}),
    ...(oos === 'yes' ? { out_of_scope: true } : oos === 'no' ? { out_of_scope: false } : {}),
  };
  return e;
}

/** The raw entries of the trunk, inboxes first, then the active log, then the archive (logEntries' order). */
export function trunkEntries(repo, trunk) {
  const ls = git(['ls-tree', '--name-only', trunk, 'docs/log-inbox/'], { cwd: repo });
  const files = [...(ls.ok ? ls.out.split('\n').filter((p) => p.endsWith('.md')) : []), 'docs/claude-code-log.md', 'docs/claude-code-log-archive.md'];
  const out = [];
  for (const file of files) {
    const r = git(['show', `${trunk}:${file}`], { cwd: repo });
    if (!r.ok) continue;
    out.push(...splitLog(r.out));
  }
  return out;
}

const orderKey = (e) => (e.unit || `P-${e.date}-0000`);

/**
 * Converts raw entries to contract v1 lines, oldest unit first (the order an append-only log has), and drops
 * every line `tack check` rejects, repeating until clean (a dropped line can leave a later corrects unresolved).
 * A unit with several task entries (a lane that wrote more than one) keeps its id on the oldest and gives the
 * later ones the contract's optional suffix, -2, -3, ..., so their corrects are kept rather than rejected as duplicates.
 * Returns { lines, read, converted, rejected: { rule: n } }.
 */
export function convert(raws) {
  const objs = raws.map((r, i) => ({ i, e: toContract(r) }));
  objs.sort((a, b) => (orderKey(a.e) < orderKey(b.e) ? -1 : orderKey(a.e) > orderKey(b.e) ? 1 : b.i - a.i));
  const seen = new Map();
  for (const { e } of objs) {
    if (e.type !== 'task' || !e.unit) continue;
    const n = (seen.get(e.unit) ?? 0) + 1;
    seen.set(e.unit, n);
    if (n > 1) e.unit = `${e.unit}-${n}`;
  }
  let lines = objs.map((o) => JSON.stringify(o.e));
  const rejected = {};
  for (;;) {
    const { violations } = validateText(lines.join('\n'));
    if (!violations.length) break;
    const bad = new Map();
    for (const v of violations) if (!bad.has(v.line)) bad.set(v.line, v.rule);
    for (const rule of bad.values()) rejected[rule] = (rejected[rule] ?? 0) + 1;
    lines = lines.filter((_, k) => !bad.has(k + 1));
  }
  return { lines, read: raws.length, converted: lines.length, rejected };
}

/** The repository key of a work tree: its lowest root commit. */
export function repoKeyOf(repo) {
  if (!existsSync(repo)) return null; // git() throws on a missing cwd
  const r = git(['rev-list', '--max-parents=0', '--all'], { cwd: repo });
  const roots = r.ok ? r.out.split('\n').filter(Boolean).sort() : [];
  return roots[0] ?? null;
}

/** Runs the import: { out, key, read, converted, rejected } or { error }. Never writes inside the repository. */
export function importJjodelLog({ repo = process.cwd(), out = null, trunk = process.env.JJODEL_TRUNK || DEFAULT_TRUNK } = {}) {
  const top = existsSync(repo) ? git(['rev-parse', '--show-toplevel'], { cwd: repo }) : { ok: false };
  if (!top.ok) return { error: `${repo} is not inside a git work tree` };
  const toplevel = realpathSync(top.out.trim());
  if (!git(['rev-parse', '--verify', '-q', `${trunk}^{commit}`], { cwd: toplevel }).ok) return { error: `no ref ${trunk} (set --trunk or JJODEL_TRUNK)` };
  const key = repoKeyOf(toplevel);
  if (!key) return { error: 'repository has no commit' };
  const target = resolve(out ?? join(importsRoot(), key, 'log.jsonl'));
  const commonDir = realpathSync(resolve(toplevel, git(['rev-parse', '--git-common-dir'], { cwd: toplevel }).out.trim()));
  let parent = dirname(target);
  try { parent = realpathSync(parent); } catch { /* created below */ }
  const inside = (d) => parent === d || parent.startsWith(d + sep);
  if (inside(toplevel) || inside(dirname(commonDir))) return { error: `refusing to write inside the repository: ${target}` };
  const res = convert(trunkEntries(toplevel, trunk));
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, res.lines.join('\n') + (res.lines.length ? '\n' : ''));
  return { out: target, key, trunk, ...res };
}
