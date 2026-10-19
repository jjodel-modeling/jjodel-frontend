#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { validateText } from '../src/contract/validate.mjs';

const NODE_MAJOR = Number(process.versions.node.split('.')[0]);
if (NODE_MAJOR < 24) {
  process.stderr.write(`tack: requires Node >= 24 (node:sqlite), this is ${process.version}\n`);
  process.exit(2);
}

const USAGE = `usage: tack <command>

commands:
  check [file]                          validate a JSON Lines log against contract v1 (default: .tack/log.jsonl)
  scan [--root <dir>] [--store <file>]  ingest Claude Code transcripts (default root: ~/.claude/projects),
                                        then resolve each session cwd to a repository and read its git history
  sessions [--cwd <prefix>] [--json] [--store <file>]
                                        one row per session, main-thread calls only
  repos [--json] [--store <file>]       one row per repository, then the session cwds without one
  metrics [--repo <key|path>] [--since <YYYY-MM-DD>] [--json] [--store <file>]
                                        layer-1 metrics of the selection; layer 2 and 3 listed with
                                        the field that would enable them
  board [--port <n>] [--no-open] [--store <file>] [--root <dir>]
                                        scan, then serve the board on 127.0.0.1 (default port 4710) and open it;
                                        started in a git work tree it preselects that repository

The store defaults to ~/.tack/store.db, or TACK_STORE when set.
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

function check(args) {
  if (args.length > 1) return usage();
  const file = args[0] ?? '.tack/log.jsonl';
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

const tally = (o) => Object.entries(o).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([k, v]) => `${k} ${v}`).join(', ') || 'none';

async function scanCmd(args) {
  const flags = parseFlags(args, ['root', 'store']);
  if (!flags) return usage();
  const { openStore, storePath } = await import('../src/store/open.mjs');
  const { scan, defaultRoot } = await import('../src/collectors/claude-code/collect.mjs');
  const { identify } = await import('../src/collectors/git/identity.mjs');
  const { collectGit } = await import('../src/collectors/git/collect.mjs');
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
    table.push([r.key.slice(0, 12), r.state, r.toplevels.join(','), r.remote_host, String(r.commits), String(r.unit_trailer),
      String(r.unit_suffix), String(r.claude_coauthored), String(r.sessions), String(r.sessions_commit_within_hour)]);
  }
  printTable(table);
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
    const v = m[d.name] === 'not-adopted' ? 'not adopted' : 'adopted, not implemented (slice 6)';
    w(`  ${d.name.padEnd(18)} layer ${d.layer}  ${v.padEnd(34)} enabled by ${d.enabledBy}`);
  }
  return 0;
}

async function boardCmd(args) {
  const flags = parseFlags(args, ['port', 'store', 'root'], ['no-open']);
  if (!flags) return usage();
  const { boardCmd: run } = await import('../src/board/server.mjs');
  return run(flags);
}

const [command, ...rest] = process.argv.slice(2);
if (command === 'check') process.exitCode = check(rest);
else if (command === 'scan') process.exitCode = await scanCmd(rest);
else if (command === 'sessions') process.exitCode = await sessionsCmd(rest);
else if (command === 'repos') process.exitCode = await reposCmd(rest);
else if (command === 'metrics') process.exitCode = await metricsCmd(rest);
else if (command === 'board') process.exitCode = await boardCmd(rest);
else process.exitCode = usage();
