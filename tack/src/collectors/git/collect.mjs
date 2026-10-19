// Git collector: `git log --all` of every present repository -> commits. Per commit it keeps the
// sha, parent count, author and commit time, numstat totals, the unit id with the form that
// matched, and whether a Co-Authored-By trailer names Claude. The message is parsed in memory and
// dropped; no subject, body, author, email or path reaches the store.
//
// Incremental: the refs and their tips (plus every worktree HEAD) are remembered per clone. A
// repository whose tips did not move is skipped. Otherwise, for a single clone, only the commits
// not reachable from the old tips are read, then the stored count is checked against
// `git rev-list --all --count`: a mismatch means history was rewritten or a ref was deleted, and
// the repository is re-read in full. A repository with several clones is always re-read in full.
import { unitLinkFromCommit } from '../../contract/linkage.mjs';
import { git } from './run.mjs';

/** Every store column of schema 2 and the git field it is fed from. */
export const GIT_COLUMN_SOURCES = {
  repos: {
    key: 'rev-list --max-parents=0 (lowest)', roots: 'rev-list --max-parents=0', common_dirs: 'rev-parse --git-common-dir',
    toplevels: 'rev-parse --show-toplevel', remote: 'remote get-url origin (normalised)', state: 'file stat',
    tips: 'for-each-ref %(objectname) %(refname), worktree list HEAD',
  },
  session_repo: {
    session_id: 'sessions.id', repo_key: 'repos.key', missing: 'file stat, rev-parse exit',
    link_method: 'rev-parse, or inference: sessions.git_branch against ref names and merged branch names, worktree list (enum)',
    link_reason: 'inference outcome',
  },
  commits: {
    repo_key: 'repos.key', sha: '%H', parents: '%P (count)', author_time: '%at', commit_time: '%ct',
    files: 'numstat (row count)', insertions: 'numstat (added)', deletions: 'numstat (deleted)',
    unit: 'unit id parsed from the Unit trailer or the (P-...) suffix', unit_form: 'which linkage form matched',
    claude_coauthor: 'Co-Authored-By trailer names Claude (boolean)',
    reverts: 'sha named by a "This reverts commit <sha>" line',
  },
};

// One record per commit: \0 sha \0 parents \0 author time \0 commit time \0 message \0, then numstat lines.
const FORMAT = '--format=%x00%H%x00%P%x00%at%x00%ct%x00%B%x00';
const LOG = ['log', '--all', '--numstat', '--no-renames', '--diff-merges=off', '--no-ext-diff', '--no-textconv',
  '--no-color', '--no-notes', '--no-show-signature', FORMAT];
const CLAUDE_COAUTHOR = /^co-authored-by:[^\n]*\bclaude\b/im;
const REVERTS = /This reverts commit ([0-9a-f]{40})/;
const NUMSTAT = /^(\d+|-)\t(\d+|-)\t/;

/** Parses the output of LOG into commit rows; messages are read here and not returned. */
export function parseLog(out) {
  const t = out.split('\0');
  const commits = [];
  for (let i = 1; i + 4 < t.length; i += 6) {
    const message = t[i + 4];
    const link = unitLinkFromCommit(message);
    let files = 0;
    let ins = 0;
    let del = 0;
    for (const line of (t[i + 5] ?? '').split('\n')) {
      const m = NUMSTAT.exec(line);
      if (!m) continue;
      files++;
      if (m[1] !== '-') ins += Number(m[1]);
      if (m[2] !== '-') del += Number(m[2]);
    }
    commits.push({
      sha: t[i], parents: t[i + 1].split(' ').filter(Boolean).length,
      authorTime: Number(t[i + 2]), commitTime: Number(t[i + 3]), files, ins, del,
      unit: link?.unit ?? null, form: link?.form ?? null, claude: CLAUDE_COAUTHOR.test(message) ? 1 : 0,
      reverts: REVERTS.exec(message)?.[1] ?? null,
    });
  }
  return commits;
}

const gd = (dir) => ['--git-dir', dir];

/** Sorted "<sha> <ref>" for every ref and every worktree HEAD of a clone, or null on a git error. */
export function tipsOf(commonDir) {
  const refs = git([...gd(commonDir), 'for-each-ref', '--format=%(objectname) %(refname)']);
  const wts = git([...gd(commonDir), 'worktree', 'list', '--porcelain']);
  if (!refs.ok || !wts.ok) return null;
  const heads = wts.out.split('\n').filter((l) => l.startsWith('HEAD ')).map((l) => `${l.slice(5)} HEAD`);
  return [...refs.out.split('\n').filter(Boolean), ...heads].sort();
}

function readLog(commonDir, exclude = null) {
  const args = [...gd(commonDir), ...LOG];
  if (!exclude) {
    const r = git(args);
    return r.ok ? parseLog(r.out) : null;
  }
  const r = git([...args, '--stdin'], { input: exclude.map((s) => `^${s}\n`).join('') });
  return r.ok ? parseLog(r.out) : null;
}

/** Reads the commits of every present repository into db. Returns counts. */
export function collectGit(db) {
  const st = { repos: 0, skipped: 0, full: 0, incremental: 0, errors: 0, commitsAdded: 0, commitsRemoved: 0 };
  const q = {
    repos: db.prepare("SELECT key, common_dirs, tips FROM repos WHERE state = 'present' ORDER BY key"),
    // A stored commit is kept and only gains its reverts (schema 4 re-reads every repository once).
    ins: db.prepare(`INSERT INTO commits (repo_key, sha, parents, author_time, commit_time, files, insertions,
      deletions, unit, unit_form, claude_coauthor, reverts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (repo_key, sha) DO UPDATE SET reverts = excluded.reverts WHERE reverts IS NOT excluded.reverts`),
    has: db.prepare('SELECT 1 FROM commits WHERE repo_key = ? AND sha = ?'),
    shas: db.prepare('SELECT sha FROM commits WHERE repo_key = ?'),
    del: db.prepare('DELETE FROM commits WHERE repo_key = ? AND sha = ?'),
    count: db.prepare('SELECT COUNT(*) AS n FROM commits WHERE repo_key = ?'),
    tips: db.prepare('UPDATE repos SET tips = ? WHERE key = ?'),
  };
  const insert = (key, commits) => {
    let n = 0;
    for (const c of commits) {
      const known = q.has.get(key, c.sha) !== undefined;
      q.ins.run(key, c.sha, c.parents, c.authorTime, c.commitTime, c.files, c.ins, c.del, c.unit, c.form, c.claude, c.reverts);
      if (!known) n++;
    }
    return n;
  };

  for (const repo of q.repos.all()) {
    st.repos++;
    const dirs = JSON.parse(repo.common_dirs);
    const old = JSON.parse(repo.tips);
    const cur = {};
    for (const d of dirs) cur[d] = tipsOf(d);
    if (dirs.some((d) => cur[d] === null)) {
      st.errors++;
      continue;
    }
    if (JSON.stringify(cur) === JSON.stringify(old)) {
      st.skipped++;
      continue;
    }
    db.exec('BEGIN');
    try {
      let done = false;
      if (dirs.length === 1 && Array.isArray(old[dirs[0]])) {
        const d = dirs[0];
        const exclude = [...new Set(old[d].map((l) => l.split(' ', 1)[0]))];
        const fresh = exclude.length ? readLog(d, exclude) : null;
        const total = git([...gd(d), 'rev-list', '--all', '--count']);
        if (fresh && total.ok) {
          const added = insert(repo.key, fresh);
          if (q.count.get(repo.key).n === Number(total.out.trim())) {
            st.commitsAdded += added;
            st.incremental++;
            done = true;
          } else {
            db.exec('ROLLBACK');
            db.exec('BEGIN');
          }
        }
      }
      if (!done) {
        const read = new Map();
        for (const d of dirs) {
          const commits = readLog(d);
          if (!commits) throw new Error(`git log failed in ${d}`);
          for (const c of commits) read.set(c.sha, c);
        }
        st.commitsAdded += insert(repo.key, [...read.values()]);
        for (const { sha } of q.shas.all(repo.key)) {
          if (!read.has(sha)) st.commitsRemoved += Number(q.del.run(repo.key, sha).changes);
        }
        st.full++;
      }
      q.tips.run(JSON.stringify(cur), repo.key);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      if (!/^git log failed/.test(err.message)) throw err;
      st.errors++;
    }
  }
  return st;
}
