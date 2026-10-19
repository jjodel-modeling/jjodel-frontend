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
    w(`rows added: sessions ${st.sessionsAdded}, calls ${st.callsAdded}`);
    w(`rows changed: calls updated ${st.callsUpdated}, calls removed by re-read ${st.callsRemoved}, duplicate message ids ${st.duplicates}`);
    const id = identify(db);
    w(`identity: cwds ${id.cwds}; sessions in a repository ${id.inRepo}, missing: ${tally(id.missing)}`);
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
  const table = [['cwd', 'day', 'calls', 'cost', 'ctx peak', 'span min', 'models', 'commit within hour']];
  for (const r of rows) {
    table.push([r.cwd ?? '-', r.day ?? '-', String(r.calls), r.cost_usd === null ? '-' : r.cost_usd.toFixed(2),
      String(r.context_peak), r.span_min === null ? '-' : String(r.span_min), r.models.join(',') || '-', r.commit_within_hour]);
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

const [command, ...rest] = process.argv.slice(2);
if (command === 'check') process.exitCode = check(rest);
else if (command === 'scan') process.exitCode = await scanCmd(rest);
else if (command === 'sessions') process.exitCode = await sessionsCmd(rest);
else if (command === 'repos') process.exitCode = await reposCmd(rest);
else process.exitCode = usage();
