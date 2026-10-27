-- Tack event store, schema version 2: repository identity and git history.
-- Metadata only: commit ids, counts, times and parsed unit ids. No subject, body, author name,
-- email or changed-file path is ever stored; test/privacy.test.mjs holds the list.

CREATE TABLE repos (
  key         TEXT PRIMARY KEY,         -- lowest root commit sha of the repository
  roots       TEXT NOT NULL,            -- JSON array, sorted root commits (rev-list --max-parents=0 --all)
  common_dirs TEXT NOT NULL,            -- JSON array, git common dirs (realpath) of the present clones
  toplevels   TEXT NOT NULL,            -- JSON array, every work-tree toplevel (realpath) ever seen
  remote      TEXT,                     -- normalised origin URL, credentials stripped, null when none
  state       TEXT NOT NULL,            -- 'present' or 'gone' (no clone left on disk; commits kept)
  tips        TEXT NOT NULL DEFAULT '{}' -- JSON {common dir: sorted ["<sha> <ref>"]} at the last read
);

CREATE TABLE session_repo (
  session_id TEXT PRIMARY KEY,
  repo_key   TEXT,                      -- repos.key, null when missing
  missing    TEXT                       -- reason when missing: no-cwd, path-gone, not-a-git-work-tree, no-commits, git-error
);

CREATE TABLE commits (
  repo_key        TEXT    NOT NULL,
  sha             TEXT    NOT NULL,
  parents         INTEGER NOT NULL,     -- number of parents
  author_time     INTEGER NOT NULL,     -- unix seconds
  commit_time     INTEGER NOT NULL,     -- unix seconds
  files           INTEGER NOT NULL,     -- numstat rows (renames off, merges: none)
  insertions      INTEGER NOT NULL,
  deletions       INTEGER NOT NULL,
  unit            TEXT,                 -- unit id, from the trailer `Unit:` or the subject suffix `(P-...)`
  unit_form       TEXT,                 -- 'trailer' or 'suffix', null when no unit
  claude_coauthor INTEGER NOT NULL,     -- 1 when a Co-Authored-By trailer names Claude
  PRIMARY KEY (repo_key, sha)
);

CREATE INDEX commits_time ON commits (repo_key, commit_time);
CREATE INDEX session_repo_key ON session_repo (repo_key);
