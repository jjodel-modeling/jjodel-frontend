-- Tack event store, schema version 4: layer 2 (identity), layer 3 (self-assessment) and the lane-run adapter.
-- Metadata only: unit ids, enums, counts, times and costs. No message text, log text, subject, author or
-- path is stored; test/privacy.test.mjs holds the list.

ALTER TABLE sessions ADD COLUMN unit TEXT;        -- unit id of the session (layer 2)
ALTER TABLE sessions ADD COLUMN unit_source TEXT; -- 'prompt' (the leading id of the first user message) or 'commit'
ALTER TABLE commits ADD COLUMN reverts TEXT;      -- sha named by a revert ("This reverts commit <sha>"), else null

CREATE TABLE lanes (
  id          TEXT PRIMARY KEY,  -- lane folder name, a unit id
  repo_key    TEXT,              -- repository of worktree.txt (resolved in memory) or of the lane's session
  session_id  TEXT,              -- session.txt
  started_ms  INTEGER,           -- started.txt
  end_ms      INTEGER,           -- mtime of exit.txt, null while the lane runs
  live        INTEGER NOT NULL,  -- 1 when there is no exit.txt and pid.txt names a live process
  tier        TEXT,              -- first word of tier.txt (heavy, light)
  runs        INTEGER NOT NULL,  -- lines of runs.jsonl
  outcome     TEXT NOT NULL,     -- last Outcome: line of log.jsonl: done, hard-stop, question, blocked, unparsed or none
  blocked_run INTEGER NOT NULL,  -- a result event whose Outcome is blocked
  over_time   INTEGER NOT NULL,  -- a result event longer than 90 minutes
  corrective  INTEGER NOT NULL,  -- a resume input classed corrective
  cost_usd    REAL,              -- max total_cost_usd of the result events, null without one
  cache_key   TEXT NOT NULL      -- sizes and mtimes of the files read, to skip an unchanged folder
);

CREATE TABLE lane_spend (
  lane_id TEXT NOT NULL,
  seq     INTEGER NOT NULL,      -- order of the cost event in log.jsonl
  at_ms   INTEGER NOT NULL,      -- end of the turn the event closes
  usd     REAL NOT NULL,         -- increase over the previous cost event (a decrease: the value itself)
  PRIMARY KEY (lane_id, seq)
);

CREATE TABLE log_entries (
  repo_key     TEXT NOT NULL,
  source       TEXT NOT NULL,    -- 'repo' (<toplevel>/.tack/log.jsonl) or 'import' (~/.tack/imports/<key>/log.jsonl)
  line         INTEGER NOT NULL,
  type         TEXT NOT NULL,    -- task or ticket
  date         TEXT NOT NULL,
  unit         TEXT,
  outcome      TEXT,             -- completed, partial, problems
  corrects     TEXT,             -- unit id or null
  cause        TEXT,             -- a..g or null
  regressions  TEXT,             -- yes, no, unknown
  out_of_scope INTEGER,          -- 0 or 1
  priority     TEXT,             -- tickets: high, medium, low
  PRIMARY KEY (repo_key, source, line)
);

CREATE INDEX lanes_repo ON lanes (repo_key);
CREATE INDEX log_entries_unit ON log_entries (repo_key, unit);

-- Main transcripts are read again from 0 once so sessions gain their prompt unit, and every repository is
-- re-read in full once so commits gain reverts; rows already stored are matched, not added.
UPDATE ingest SET size = 0, mtime_ms = 0, offset = 0 WHERE kind = 'main';
UPDATE repos SET tips = '{}';
