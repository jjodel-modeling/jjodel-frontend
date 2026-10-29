// Self-assessment log collector (layer 3): per repository, <main toplevel>/.tack/log.jsonl (source 'repo')
// and ~/.tack/imports/<repo key>/log.jsonl (source 'import', written by `tack import`). Only the lines that
// pass contract v1 (`tack check`) are kept, and of them only the enum and id fields: no title, summary,
// notes, files, finding or detail reaches the store. Read-only; replaced in full on every scan.
import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { validateText } from '../../contract/validate.mjs';
import { importsRoot } from '../../importers/jjodel-log.mjs';

export const LOG_COLUMN_SOURCES = {
  log_entries: {
    repo_key: 'repos.key', source: 'which log file (enum)', line: 'line number', type: 'entry type', date: 'entry date',
    unit: 'entry unit', outcome: 'entry outcome', corrects: 'entry corrects', cause: 'entry cause', regressions: 'entry regressions',
    out_of_scope: 'entry out_of_scope', priority: 'entry priority',
  },
};

/** The clean lines of a log text, each as { line, entry }. */
export function cleanEntries(text) {
  const { violations } = validateText(text);
  const bad = new Set(violations.map((v) => v.line));
  const out = [];
  text.split('\n').forEach((raw, i) => {
    if (raw.trim() === '' || bad.has(i + 1)) return;
    out.push({ line: i + 1, entry: JSON.parse(raw) });
  });
  return out;
}

const mainToplevel = (commonDirs, toplevels) =>
  commonDirs.filter((d) => basename(d) === '.git').map((d) => dirname(d)).find((d) => toplevels.includes(d)) ?? toplevels[0] ?? null;

/** Reads the logs of every repository into log_entries. Returns counts. */
export function collectLogs(db, { imports = importsRoot() } = {}) {
  const st = { repoLogs: 0, imports: 0, entries: 0, rejected: 0 };
  const del = db.prepare('DELETE FROM log_entries WHERE repo_key = ?');
  const ins = db.prepare(`INSERT INTO log_entries (repo_key, source, line, type, date, unit, outcome, corrects, cause, regressions,
    out_of_scope, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  db.exec('BEGIN');
  try {
    for (const r of db.prepare('SELECT key, common_dirs, toplevels FROM repos ORDER BY key').all()) {
      del.run(r.key);
      const top = mainToplevel(JSON.parse(r.common_dirs), JSON.parse(r.toplevels));
      const files = [['repo', top ? join(top, '.tack', 'log.jsonl') : null], ['import', join(imports, r.key, 'log.jsonl')]];
      for (const [source, file] of files) {
        if (!file || !existsSync(file)) continue;
        let text;
        try { text = readFileSync(file, 'utf8'); } catch { continue; }
        st[source === 'repo' ? 'repoLogs' : 'imports']++;
        const clean = cleanEntries(text);
        st.rejected += text.split('\n').filter((l) => l.trim()).length - clean.length;
        for (const { line, entry: e } of clean) {
          ins.run(r.key, source, line, e.type, e.date, e.unit ?? null, e.outcome ?? null, e.corrects ?? null, e.cause ?? null,
            e.regressions ?? null, typeof e.out_of_scope === 'boolean' ? (e.out_of_scope ? 1 : 0) : null, e.priority ?? null);
          st.entries++;
        }
      }
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  return st;
}
