#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { validateText } from '../src/contract/validate.mjs';

const NODE_MAJOR = Number(process.versions.node.split('.')[0]);
if (NODE_MAJOR < 24) {
  process.stderr.write(`tack: requires Node >= 24 (node:sqlite), this is ${process.version}\n`);
  process.exit(2);
}

const USAGE = `usage: tack <command> | tack --version

commands:
  check [file] [--level user|project|local]
                                        validate a JSON Lines log against contract v1 (default: .tack/log.jsonl);
                                        settings.json, tack.json and tack.local.json against the settings schema
  settings [--repo <dir>] [--json]      the effective value of every setting and the level it comes from
  notify --watch [--store <file>] [--root <dir>]
                                        collect, sample host load and notify without the board (one per store)
  notify test <desktop|ntfy> [--dry-run]
                                        send one test message on a channel; --dry-run prints it instead
  scan [--root <dir>] [--store <file>]  ingest Claude Code transcripts (default root: ~/.claude/projects),
                                        then resolve each session cwd to a repository and read its git history
  sessions [--cwd <prefix>] [--json] [--store <file>]
                                        one row per session, main-thread calls only
  repos [--json] [--store <file>]       one row per repository, then the session cwds without one
  metrics [--repo <key|path>] [--since <YYYY-MM-DD>] [--json] [--store <file>]
                                        layer-1 metrics of the selection; layers 2 and 3 where the store
                                        has the data, else the field that would enable them
  board [--port <n>] [--no-open] [--store <file>] [--root <dir>]
                                        scan, then serve the board on 127.0.0.1 (default port 4710) and open it;
                                        started in a git work tree it preselects that repository
  import jjodel-log [--repo <path>] [--out <file>] [--trunk <ref>]
                                        convert Jjodel's Markdown prompt log (read from the trunk with git show)
                                        to contract v1 JSON Lines, by default ~/.tack/imports/<repo-key>/log.jsonl
  parity jjodel [--days <n>] [--repo <path>] [--lanes <dir>] [--trunk <ref>] [--json] [--store <file>]
                                        compare spend per day and first-shot lanes with Jjodel's lane board
                                        rules over the last n days (default 14); exit 1 on any difference

The store defaults to ~/.tack/store.db, or TACK_STORE when set; the user settings to ~/.tack/settings.json, or TACK_SETTINGS.
`;

function usage() {
  process.stderr.write(USAGE);
  return 2;
}

/** Flags of the form --name value or --name (booleans); null on an unknown flag or a stray argument. */
function parseFlags(args, valued, booleans = []) {
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const name = args[i].startsWith('--') ? args[i].slice(2) : null;
    if (valued.includes(name) && i + 1 < args.length) out[name] = args[++i];
    else if (booleans.includes(name)) out[name] = true;
    else return null;
  }
  return out;
}

async function check(args) {
  const files = [];
  let level = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--level' && i + 1 < args.length) level = args[++i];
    else if (args[i].startsWith('--')) return usage();
    else files.push(args[i]);
  }
  if (files.length > 1 || (level && !['user', 'project', 'local'].includes(level))) return usage();
  const file = files[0] ?? '.tack/log.jsonl';
  const { levelOfFile } = await import('../src/settings/settings.mjs');
  if (level || levelOfFile(file)) return checkSettings(file, level ?? levelOfFile(file));
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch (err) {
    process.stderr.write(`tack check: cannot read ${file}: ${err.code ?? err.message}\n`);
    return 2;
  }
  const { entries, violations } = validateText(text);
  for (const v of violations) process.stdout.write(`${file}:${v.line} ${v.field} ${v.rule}: ${v.message}\n`);
  if (violations.length === 0) {
    process.stdout.write(`${file}: ${entries} entries, no violations\n`);
    return 0;
  }
  return 1;
}

/** tack check on a settings file: settings.json is the user level, tack.json project, tack.local.json local. */
async function checkSettings(file, level) {
  const { checkSettingsText } = await import('../src/settings/settings.mjs');
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch (err) {
    process.stderr.write(`tack check: cannot read ${file}: ${err.code ?? err.message}\n`);
    return 2;
  }
  const { violations } = checkSettingsText(text, level);
  for (const v of violations) process.stdout.write(`${file}: ${v.key} ${v.rule}: ${v.message}\n`);
  if (violations.length === 0) {
    process.stdout.write(`${file}: ${level} settings, no violations\n`);
    return 0;
  }
  return 1;
}

/** tack settings: the effective value of every key and the level it comes from. */
async function settingsCmd(args) {
  const flags = parseFlags(args, ['repo'], ['json']);
  if (!flags) return usage();
  const { effectiveSettings, repoSettingsPaths, userSettingsPath } = await import('../src/settings/settings.mjs');
  const { git } = await import('../src/collectors/git/run.mjs');
  const top = git(['rev-parse', '--show-toplevel'], { cwd: flags.repo ?? process.cwd() });
  const toplevel = top.ok ? top.out.trim() : null;
  const s = effectiveSettings({ user: userSettingsPath(), ...repoSettingsPaths(toplevel) });
  if (flags.json) {
    process.stdout.write(JSON.stringify({ files: s.files, entries: s.entries.map(({ key, value, source, levels }) => ({ key, value, source, levels })), violations: s.violations }, null, 2) + '\n');
    return s.violations.length ? 1 : 0;
  }
  const w = (x) => process.stdout.write(x + '\n');
  for (const l of ['user', 'project', 'local']) w(`${l.padEnd(8)}${s.files[l].path ?? '- (not in a git work tree)'}${s.files[l].path && !s.files[l].exists ? ' (absent)' : ''}`);
  w('');
  const table = [['key', 'value', 'source', 'levels']];
  for (const e of s.entries) table.push([e.key, e.secret && e.value && e.value.token ? JSON.stringify({ ...e.value, token: '***' }) : JSON.stringify(e.value), e.source, e.levels.join('+')]);
  printTable(table);
  for (const v of s.violations) w(`${v.file}: ${v.key} ${v.rule}: ${v.message} (ignored)`);
  return s.violations.length ? 1 : 0;
}

const tally = (o) => Object.entries(o).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([k, v]) => `${k} ${v}`).join(', ') || 'none';

async function scanCmd(args) {
  const flags = parseFlags(args, ['root', 'store']);
  if (!flags) return usage();
  const { openStore, storePath } = await import('../src/store/open.mjs');
  const { scan, defaultRoot } = await import('../src/collectors/claude-code/collect.mjs');
  const { identify } = await import('../src/collectors/git/identity.mjs');
  const { collectGit } = await import('../src/collectors/git/collect.mjs');
  const { collectLayers } = await import('../src/collectors/layers.mjs');
  const path = storePath(flags.store);
  const root = flags.root ?? defaultRoot();
  const db = openStore(path);
  try {
    const st = scan(db, root);
    const w = (s) => process.stdout.write(s + '\n');
    w(`store ${path}`);
    w(`root ${root}`);
    w(`files ${st.files} (read ${st.read}, re-read from 0 ${st.reread}, unchanged ${st.unchanged}; gone from disk, rows kept ${st.gone})`);
    w(`records seen ${st.records}, malformed ${st.malformed}`);
    w(`records used: ${tally(st.used)}`);
    w(`records skipped by type: ${tally(st.skipped)}`);
    w(`rows added: sessions ${st.sessionsAdded}, calls ${st.callsAdded}, model costs ${st.modelCostsAdded}`);
    w(`rows changed: calls updated ${st.callsUpdated}, calls removed by re-read ${st.callsRemoved}, duplicate message ids ${st.duplicates}, model costs updated ${st.modelCostsUpdated}`);
    const id = identify(db);
    w(`identity: cwds ${id.cwds}; sessions in a repository ${id.inRepo}, missing: ${tally(id.missing)}`);
    w(`identity: path-gone linked by branch ${id.inferred.branch}, by sibling ${id.inferred.sibling}; not linked: ${tally(id.unresolved)}`);
    w(`identity: repositories ${id.repos} (clones ${id.clones}), gone ${id.reposGone}; rows added: repos ${id.reposAdded}, links ${id.linksAdded}; links changed ${id.linksChanged}`);
    const g = collectGit(db);
    w(`git: repositories ${g.repos} (unchanged ${g.skipped}, incremental ${g.incremental}, full ${g.full}, errors ${g.errors})`);
    w(`git: rows added: commits ${g.commitsAdded}; commits removed by re-read ${g.commitsRemoved}`);
    const ly = collectLayers(db);
    w(`units: sessions by prompt ${ly.units.prompt}, by reachable commit ${ly.units.commit}, none ${ly.units.none} (commit in the window but no branch ${ly.units.noBranch})`);
    w(ly.lanes.enabled ? `lanes: folders ${ly.lanes.lanes} (read ${ly.lanes.read}, unchanged ${ly.lanes.unchanged}, errors ${ly.lanes.errors})` : 'lanes: no lane-run folder, adapter off');
    w(`logs: repository logs ${ly.logs.repoLogs}, imports ${ly.logs.imports}; entries ${ly.logs.entries}, lines failing contract v1 skipped ${ly.logs.rejected}`);
  } finally {
    db.close();
  }
  return 0;
}

async function sessionsCmd(args) {
  const flags = parseFlags(args, ['cwd', 'store'], ['json']);
  if (!flags) return usage();
  const { openStore, storePath } = await import('../src/store/open.mjs');
  const { listSessions } = await import('../src/store/sessions.mjs');
  const db = openStore(storePath(flags.store));
  let rows;
  try {
    rows = listSessions(db, { cwd: flags.cwd ?? null });
  } finally {
    db.close();
  }
  if (flags.json) {
    process.stdout.write(JSON.stringify(rows, null, 2) + '\n');
    return 0;
  }
  const table = [['cwd', 'day', 'calls', 'cost', 'ctx peak', 'span min', 'models', 'link', 'commit within hour']];
  for (const r of rows) {
    table.push([r.cwd ?? '-', r.day ?? '-', String(r.calls), r.cost_usd === null ? '-' : r.cost_usd.toFixed(2),
      String(r.context_peak), r.span_min === null ? '-' : String(r.span_min), r.models.join(',') || '-', r.link, r.commit_within_hour]);
  }
  printTable(table);
  process.stdout.write(`${rows.length} sessions\n`);
  return 0;
}

function printTable(table) {
  const widths = table[0].map((_, i) => Math.max(...table.map((row) => row[i].length)));
  for (const row of table) process.stdout.write(row.map((c, i) => c.padEnd(widths[i])).join('  ').trimEnd() + '\n');
}

async function reposCmd(args) {
  const flags = parseFlags(args, ['store'], ['json']);
  if (!flags) return usage();
  const { openStore, storePath } = await import('../src/store/open.mjs');
  const { listRepos } = await import('../src/store/repos.mjs');
  const { tableLines, toplevelsCell } = await import('../src/cli/table.mjs');
  const db = openStore(storePath(flags.store));
  let out;
  try {
    out = listRepos(db);
  } finally {
    db.close();
  }
  if (flags.json) {
    process.stdout.write(JSON.stringify(out, null, 2) + '\n');
    return 0;
  }
  const table = [['repo', 'state', 'toplevels', 'remote', 'commits', 'unit trailer', 'unit suffix', 'claude co-authored', 'sessions', 'commit within hour']];
  for (const r of out.repos) {
    table.push([r.key.slice(0, 12), r.state, toplevelsCell(r.toplevels), r.remote_host, String(r.commits), String(r.unit_trailer),
      String(r.unit_suffix), String(r.claude_coauthored), String(r.sessions), String(r.sessions_commit_within_hour)]);
  }
  for (const line of tableLines(table)) process.stdout.write(line + '\n');
  process.stdout.write(`${out.repos.length} repositories\n`);
  for (const m of out.missing) {
    const n = m.cwds.reduce((a, c) => a + c.sessions, 0);
    process.stdout.write(`\nmissing, ${m.reason}: ${m.cwds.length} cwds, ${n} sessions\n`);
    for (const c of m.cwds) process.stdout.write(`  ${c.cwd}  ${c.sessions}\n`);
  }
  return 0;
}

const int = (n) => Math.round(n).toLocaleString('en-US');
const usd = (n) => '$' + n.toFixed(2);
const pct = (x) => (x === null ? '-' : `${(100 * x).toFixed(1)}%`);

async function metricsCmd(args) {
  const flags = parseFlags(args, ['repo', 'since', 'store'], ['json']);
  if (!flags) return usage();
  if (flags.since && !/^\d{4}-\d{2}-\d{2}$/.test(flags.since)) {
    process.stderr.write(`tack metrics: --since takes YYYY-MM-DD, got ${flags.since}\n`);
    return 2;
  }
  const { openStore, storePath } = await import('../src/store/open.mjs');
  const { METRICS, computeAll, loadSelection, resolveRepo } = await import('../src/metrics/index.mjs');
  const db = openStore(storePath(flags.store));
  let out;
  let repo = null;
  try {
    if (flags.repo) {
      const r = resolveRepo(db, flags.repo);
      if (r.error) {
        process.stderr.write(`tack metrics: ${r.error}\n`);
        return 2;
      }
      repo = r.key;
    }
    const sel = loadSelection(db, { repo, since: flags.since ?? null });
    out = { repo, since: flags.since ?? null, days: `local (${Intl.DateTimeFormat().resolvedOptions().timeZone})`, sessions: sel.sessions.length, metrics: computeAll(sel) };
  } finally {
    db.close();
  }
  const declared = METRICS.map((m) => ({ name: m.name, layer: m.layer, definition: m.definition, ...(m.enabledBy ? { enabledBy: m.enabledBy } : {}) }));
  if (flags.json) {
    process.stdout.write(JSON.stringify({ ...out, declared }, null, 2) + '\n');
    return 0;
  }
  const m = out.metrics;
  const w = (x) => process.stdout.write(x + '\n');
  w(`selection: ${repo ? `repository ${repo.slice(0, 12)}` : 'all sessions'}, since ${out.since ?? 'the first session'}, ${out.sessions} sessions; days are ${out.days}`);
  w('');
  w('layer 1, per day');
  const days = [...new Set([...Object.keys(m.sessions_per_day.days), ...Object.keys(m.tokens_per_day.days), ...Object.keys(m.waits.days)])].sort();
  const table = [['day', 'sessions', 'cost', 'cost unknown', 'input', 'output', 'cache read', 'cache write', 'waits', 'wait min', 'overlap']];
  const zero = { input: 0, output: 0, cache_read: 0, cache_creation: 0 };
  for (const d of days) {
    const c = m.cost_per_day.days[d] ?? { usd: 0, unknown: 0 };
    const t = m.tokens_per_day.days[d] ?? zero;
    const wt = m.waits.days[d] ?? { count: 0, ms: 0 };
    table.push([d, String(m.sessions_per_day.days[d] ?? 0), usd(c.usd), String(c.unknown), int(t.input), int(t.output), int(t.cache_read),
      int(t.cache_creation), String(wt.count), int(wt.ms / 60000), String(m.overlap.days[d] ?? 0)]);
  }
  const ct = m.cost_per_day.total;
  const tt = m.tokens_per_day.total;
  table.push(['total', String(m.sessions_per_day.total), usd(ct.usd), String(ct.unknown), int(tt.input), int(tt.output), int(tt.cache_read),
    int(tt.cache_creation), String(m.waits.total.count), int(m.waits.total.ms / 60000), '-']);
  printTable(table);
  if (m.sessions_per_day.undated) w(`(${m.sessions_per_day.undated} sessions without a timestamp are in the total only)`);
  w('');
  w('layer 1, per session');
  const cp = m.context_peak;
  w(`  context_peak       median ${cp.median === null ? '-' : int(cp.median)}, max ${cp.max === null ? '-' : int(cp.max)}; at or above ${int(cp.threshold)}: ${cp.atOrAbove} of ${cp.n} (${cp.noCalls} sessions without a main-thread call)`);
  const cs = m.calls_per_session;
  w(`  calls_per_session  main thread: total ${int(cs.total)}, median ${cs.median ?? '-'}, max ${cs.max ?? '-'} over ${cs.n} sessions`);
  w(`  waits              ${m.waits.total.count} gaps above ${m.waits.gapMs / 60000} min, ${int(m.waits.total.ms / 60000)} min in total, in ${m.waits.sessions.filter((x) => x.count).length} sessions`);
  const pt = m.commit_proximity.total;
  w(`  commit_proximity   commit within ${m.commit_proximity.windowSec / 3600} h (proximity, not authorship): yes ${pt.yes}, no ${pt.no}, share ${pct(pt.share)}; unknown ${pt.unknown}`);
  if (!repo) for (const [k, r] of Object.entries(m.commit_proximity.repos)) w(`                     ${k.slice(0, 12)}  yes ${r.yes}, no ${r.no}, share ${pct(r.share)}, unknown ${r.unknown}`);
  const sc = m.subagent_share;
  w(`  subagent_share     calls ${int(sc.calls.subagent)} of ${int(sc.calls.total)} (${pct(sc.calls.share)}); cost ${usd(sc.cost.subagentUsd)} of ${usd(sc.cost.totalUsd)} (${pct(sc.cost.share)}), unattributed ${usd(sc.cost.unattributedUsd)}, sessions with cost but no model cost ${sc.cost.sessionsWithoutModelCost}`);
  const ov = Object.entries(m.overlap.repos).map(([k, per]) => {
    const [day, max] = Object.entries(per).reduce((a, b) => (b[1] > a[1] ? b : a), ['-', 0]);
    return `${k.slice(0, 12)} max ${max} (first on ${day})`;
  });
  w(`  overlap            ${ov.join('; ') || '-'}${m.overlap.unlinked ? `; ${m.overlap.unlinked} sessions without a repository left out` : ''}`);
  w('');
  w('layers 2 and 3');
  for (const d of declared.filter((x) => x.layer > 1)) {
    const v = m[d.name];
    w(`  ${d.name.padEnd(18)} layer ${d.layer}  ${typeof v === 'string' ? `${'not adopted'.padEnd(12)}enabled by ${d.enabledBy}` : layerLine(d.name, v)}`);
  }
  return 0;
}

const num = (x) => (x === null || x === undefined ? '-' : String(Math.round(x * 100) / 100));

/** One line for a computed layer-2/3 metric. */
function layerLine(name, v) {
  switch (name) {
    case 'commits_per_unit': return `${v.units} units, ${v.commits} commits; median ${num(v.median)}, max ${num(v.max)}`;
    case 'cost_per_unit': return `${v.units} units over ${v.sessions} sessions (by prompt ${v.source.prompt}, by commit ${v.source.commit}; without unit ${v.sessionsWithoutUnit}); ${usd(v.usd)}, median ${v.median === null ? '-' : usd(v.median)}, max ${v.max === null ? '-' : usd(v.max)}`;
    case 'resumes_per_unit': return `${v.units} units, ${v.resumes} resumes; median ${num(v.median)}, max ${num(v.max)}; 0: ${v.histogram[0]}, 1: ${v.histogram[1]}, 2+: ${v.histogram['2+']}`;
    case 'outcome': return `log: completed ${v.log.completed}, partial ${v.log.partial}, problems ${v.log.problems} of ${v.log.entries}` +
      (v.lanes ? `; lanes ${v.lanes.lanes}: ${['done', 'hard-stop', 'question', 'blocked', 'unparsed', 'none', 'running'].map((k) => `${k} ${v.lanes[k]}`).join(', ')}` : '');
    case 'first_shot': return `${v.firstShot} of ${v.n} (${pct(v.share)}) by the ${v.rule} rule` + (v.rule === 'lanes' ? `; rework ${v.rework}, failed run ${v.failedRun}, running ${v.running}` : '');
    case 'cause_tally': return `${v.total} entries with a cause: ${Object.entries(v.causes).map(([k, n]) => `${k} ${n}`).join(', ')}`;
    default: return `yes ${v.yes}, no ${v.no}, unknown ${v.unknown}; share ${pct(v.share)}`;
  }
}

async function importCmd(args) {
  if (args[0] !== 'jjodel-log') return usage();
  const flags = parseFlags(args.slice(1), ['repo', 'out', 'trunk']);
  if (!flags) return usage();
  const { importJjodelLog } = await import('../src/importers/jjodel-log.mjs');
  const r = importJjodelLog({ repo: flags.repo ?? process.cwd(), out: flags.out ?? null, ...(flags.trunk ? { trunk: flags.trunk } : {}) });
  if (r.error) {
    process.stderr.write(`tack import: ${r.error}\n`);
    return 2;
  }
  const w = (x) => process.stdout.write(x + '\n');
  w(`out ${r.out}`);
  w(`trunk ${r.trunk}, repository ${r.key.slice(0, 12)}`);
  w(`entries read ${r.read}, converted ${r.converted}, rejected ${r.read - r.converted}: ${tally(r.rejected)}`);
  return 0;
}

async function parityCmd(args) {
  if (args[0] !== 'jjodel') return usage();
  const flags = parseFlags(args.slice(1), ['days', 'repo', 'lanes', 'trunk', 'store'], ['json']);
  if (!flags) return usage();
  const days = flags.days === undefined ? 14 : Number(flags.days);
  if (!Number.isInteger(days) || days < 1) {
    process.stderr.write(`tack parity: --days takes a positive integer, got ${flags.days}\n`);
    return 2;
  }
  const { openStore, storePath } = await import('../src/store/open.mjs');
  const { traceSource } = await import('../src/collectors/active.mjs');
  const { importsRoot, DEFAULT_TRUNK } = await import('../src/importers/jjodel-log.mjs');
  const { parityJjodel } = await import('../src/parity/jjodel.mjs');
  const db = openStore(storePath(flags.store));
  let r;
  try {
    r = parityJjodel(db, { root: flags.lanes ?? traceSource.root(), repo: flags.repo ?? process.cwd(), trunk: flags.trunk ?? process.env.JJODEL_TRUNK ?? DEFAULT_TRUNK, days, imports: importsRoot() });
  } finally {
    db.close();
  }
  if (r.error) {
    process.stderr.write(`tack parity: ${r.error}\n`);
    return 2;
  }
  if (flags.json) {
    process.stdout.write(JSON.stringify(r, (k, v) => (v === Infinity ? 'Infinity' : v), 2) + '\n');
    return r.ok ? 0 : 1;
  }
  const w = (x) => process.stdout.write(x + '\n');
  const relS = (x) => (x === Infinity ? 'inf' : `${(100 * x).toFixed(2)}%`);
  w(`repository ${r.repo.slice(0, 12)}, last ${r.days.length} days (${r.days[0]} .. ${r.days.at(-1)}), tolerance ${relS(r.tolerance)}`);
  w(`log import: read ${r.import.read}, converted ${r.import.converted}, rejected: ${tally(r.import.rejected)}`);
  w('');
  const table = [['day', 'board', 'tack', 'diff', 'rel', 'ok']];
  for (const d of r.spend) table.push([d.day, usd(d.board), usd(d.tack), usd(d.diff), relS(d.rel), d.ok ? 'yes' : `NO (${d.cause})`]);
  table.push(['total', usd(r.total.board), usd(r.total.tack), usd(r.total.diff), relS(r.total.rel), r.total.ok ? 'yes' : 'NO']);
  printTable(table);
  w('');
  const fb = r.firstShot.board;
  const ft = r.firstShot.tack;
  w(`first-shot: board ${fb.firstShot} of ${fb.lanes} lanes (running ${fb.running}); tack ${ft.firstShot} of ${ft.lanes} lanes (running ${ft.running})`);
  for (const x of r.firstShot.mismatches) w(`  ${x.id}  board ${x.board}  tack ${x.tack}  cause: ${x.cause}`);
  w(r.ok ? 'parity: ok' : 'parity: FAILED');
  return r.ok ? 0 : 1;
}

/** tack notify --watch | tack notify test <desktop|ntfy> [--dry-run]. */
async function notifyCmd(args) {
  const { effectiveSettings, userSettingsPath } = await import('../src/settings/settings.mjs');
  const { testMessage } = await import('../src/notify/notifier.mjs');
  const { defaultTransports, desktopArgs, ntfyRequest } = await import('../src/notify/transports.mjs');
  const user = () => effectiveSettings({ user: userSettingsPath() });
  if (args[0] === 'test') {
    const channel = args[1];
    const rest = args.slice(2);
    if (!['desktop', 'ntfy'].includes(channel) || rest.some((a) => a !== '--dry-run')) return usage();
    const m = testMessage();
    if (rest.includes('--dry-run')) {
      if (channel === 'desktop') process.stdout.write(JSON.stringify({ file: 'osascript', args: desktopArgs(m) }, null, 2) + '\n');
      else {
        const cfg = user().value('channels.ntfy');
        const r = ntfyRequest(m, { ...cfg, topic: cfg.topic ?? '<topic>' });
        if (r.init.headers.Authorization) r.init.headers.Authorization = 'Bearer ***';
        process.stdout.write(JSON.stringify(r, null, 2) + '\n');
      }
      return 0;
    }
    try {
      await defaultTransports(user)[channel].send(m);
    } catch (err) {
      process.stderr.write(`tack notify test: ${channel}: ${err.message}\n`);
      return 1;
    }
    process.stdout.write(`tack notify test: ${channel}: sent\n`);
    return 0;
  }
  const flags = parseFlags(args, ['store', 'root'], ['watch']);
  if (!flags || !flags.watch) return usage();
  const { notifyDisabled, startWatcher } = await import('../src/notify/watch.mjs');
  if (notifyDisabled()) {
    process.stderr.write('tack notify: TACK_NOTIFY=off\n');
    return 2;
  }
  const { openStore, storePath } = await import('../src/store/open.mjs');
  const { defaultRoot } = await import('../src/collectors/claude-code/collect.mjs');
  const { createSampler, runningLanes } = await import('../src/host/load.mjs');
  const path = storePath(flags.store);
  const db = openStore(path);
  const sampler = createSampler({ running: () => runningLanes(db) }).start();
  const log = (x) => process.stderr.write(`${new Date().toISOString()} ${x}\n`);
  const w = startWatcher({ db, root: flags.root ?? defaultRoot(), sampler, transports: defaultTransports(user), log });
  process.stdout.write(`tack notify: watching ${path}\n`);
  const first = await w.tick();
  process.stdout.write(first.leader ? 'tack notify: this process notifies (lease held)\n' : 'tack notify: another process holds the lease; waiting for it to lapse\n');
  const keep = setInterval(() => {}, 1 << 30);
  const stop = () => { clearInterval(keep); w.stop(); sampler.stop(); db.close(); process.exit(0); };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  return undefined;
}

async function boardCmd(args) {
  const flags = parseFlags(args, ['port', 'store', 'root'], ['no-open']);
  if (!flags) return usage();
  const { boardCmd: run } = await import('../src/board/server.mjs');
  return run(flags);
}

const [command, ...rest] = process.argv.slice(2);
const version = () => JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
if (command === '--version' && rest.length === 0) process.stdout.write(version() + '\n');
else if (command === 'check') process.exitCode = await check(rest);
else if (command === 'settings') process.exitCode = await settingsCmd(rest);
else if (command === 'notify') process.exitCode = await notifyCmd(rest);
else if (command === 'scan') process.exitCode = await scanCmd(rest);
else if (command === 'sessions') process.exitCode = await sessionsCmd(rest);
else if (command === 'repos') process.exitCode = await reposCmd(rest);
else if (command === 'metrics') process.exitCode = await metricsCmd(rest);
else if (command === 'board') process.exitCode = await boardCmd(rest);
else if (command === 'import') process.exitCode = await importCmd(rest);
else if (command === 'parity') process.exitCode = await parityCmd(rest);
else process.exitCode = usage();
