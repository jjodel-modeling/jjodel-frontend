-- Tack event store, schema version 1 (PRAGMA user_version).
-- Metadata only: ids, timestamps, model ids, versions, token counts, cost, the session cwd and the
-- transcript path. No column is fed from message content; test/privacy.test.mjs holds the list.

CREATE TABLE ingest (
  id        INTEGER PRIMARY KEY,
  path      TEXT    NOT NULL UNIQUE,   -- transcript file
  kind      TEXT    NOT NULL,          -- 'main' or 'subagent'
  session_id TEXT   NOT NULL,
  size      INTEGER NOT NULL,          -- size at the last read
  mtime_ms  REAL    NOT NULL,          -- mtime at the last read
  offset    INTEGER NOT NULL           -- bytes consumed: the end of the last complete line
);

CREATE TABLE sessions (
  id                 TEXT PRIMARY KEY, -- sessionId, equal to the transcript file stem
  file_id            INTEGER NOT NULL, -- ingest.id of the main transcript
  cwd                TEXT,             -- exact cwd recorded in the transcript, the project key
  first_ts           TEXT,             -- ISO 8601, earliest record timestamp
  last_ts            TEXT,             -- ISO 8601, latest record timestamp
  models             TEXT NOT NULL DEFAULT '[]', -- JSON array, every model of the session's calls
  cli_version        TEXT,             -- record `version`, the last one read
  cost_usd           REAL,             -- max cost-state.totalCostUSD
  cost_known         INTEGER NOT NULL DEFAULT 0,
  cost_unknown_model INTEGER NOT NULL DEFAULT 0 -- some cost-state had hasUnknownModelCost
);

CREATE TABLE calls (
  message_id     TEXT PRIMARY KEY,     -- message.id: one row per API call
  session_id     TEXT    NOT NULL,
  file_id        INTEGER NOT NULL,     -- ingest.id of the file the call was read from
  ts             TEXT,                 -- timestamp of the call's first record
  model          TEXT,
  sidechain      INTEGER NOT NULL,     -- 1 for subagent calls, excluded from main-thread counts
  input          INTEGER NOT NULL,
  output         INTEGER NOT NULL,
  cache_read     INTEGER NOT NULL,
  cache_creation INTEGER NOT NULL,
  context        INTEGER NOT NULL      -- input + cache_read + cache_creation
);

CREATE INDEX calls_session ON calls (session_id);
CREATE INDEX calls_file ON calls (file_id);
CREATE INDEX sessions_cwd ON sessions (cwd);
