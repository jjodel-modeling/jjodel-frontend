-- Tack event store, schema version 3: link inference for deleted work trees, per-model session cost.
-- Metadata only: a branch name is a ref name, not content; a model cost is a number.

ALTER TABLE sessions ADD COLUMN git_branch TEXT;  -- first gitBranch of the transcript other than HEAD
ALTER TABLE session_repo ADD COLUMN link_method TEXT; -- direct, branch, sibling or none
ALTER TABLE session_repo ADD COLUMN link_reason TEXT; -- why an inference for a path-gone cwd found none

CREATE TABLE session_models (
  session_id TEXT NOT NULL,
  model      TEXT NOT NULL,                   -- key of cost-state.modelUsage
  cost_usd   REAL NOT NULL,                   -- max cost-state.modelUsage.<model>.costUSD
  PRIMARY KEY (session_id, model)
);

-- Main transcripts are read again from 0 once, so sessions ingested at version 2 gain their branch
-- and their model costs; rows already stored are matched, not added.
UPDATE ingest SET size = 0, mtime_ms = 0, offset = 0 WHERE kind = 'main';
