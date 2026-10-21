// TODO: cleanup. Superseded in slice 6 by layer2.mjs and layer3.mjs; no longer imported by index.mjs.
// Layer 2 (identity) and layer 3 (self-assessment) metrics, declared only: each names the store
// field that would enable it and returns 'not-adopted' while that data is absent. They are
// implemented in slice 6; until then adopted data gives 'not-implemented', never a number.

const hasColumn = (db, table, column) => db.prepare(`SELECT 1 FROM pragma_table_info('${table}') WHERE name = ?`).get(column) !== undefined;
const hasTable = (db, table) => db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(table) !== undefined;

function unitCommits(sel) {
  const keys = sel.repo ? [sel.repo] : [...new Set(sel.sessions.map((s) => s.repo).filter(Boolean))];
  const q = sel.db.prepare('SELECT 1 FROM commits WHERE repo_key = ? AND unit IS NOT NULL LIMIT 1');
  return keys.some((k) => q.get(k) !== undefined);
}

const stub = (name, layer, definition, enabledBy, adopted) => ({
  name, layer, definition, enabledBy, params: {},
  compute: (sel) => (adopted(sel) ? 'not-implemented' : 'not-adopted'),
});

const sessionUnit = (sel) => hasColumn(sel.db, 'sessions', 'unit');
const logField = (sel) => hasTable(sel.db, 'log_entries');

export const STUBS = [
  stub('commits_per_unit', 2, 'commits per unit of work', 'commits.unit (trailer Unit: <id> or subject suffix (P-...))', unitCommits),
  stub('cost_per_unit', 2, 'cost and tokens per unit of work, its sessions and resumes together', 'sessions.unit (a session-unit link)', sessionUnit),
  stub('resumes_per_unit', 2, 'sessions per unit of work beyond the first', 'sessions.unit (a session-unit link)', sessionUnit),
  stub('outcome', 3, 'units by self-assessed outcome', 'log entry outcome (.tack/log.jsonl)', logField),
  stub('first_shot', 3, 'units never corrected by a later unit', 'log entry corrects (.tack/log.jsonl)', logField),
  stub('cause_tally', 3, 'corrections by cause letter', 'log entry cause (.tack/log.jsonl)', logField),
  stub('regression_rate', 3, 'units that report a regression', 'log entry regressions (.tack/log.jsonl)', logField),
  stub('out_of_scope_rate', 3, 'units that report out-of-scope changes', 'log entry out_of_scope (.tack/log.jsonl)', logField),
];
