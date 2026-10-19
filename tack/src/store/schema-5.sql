-- Tack event store, schema version 5: notifications and the host load meter (slice 7).
-- Additive: no row or column is dropped. Metadata only: ids, enums, counts, times, load figures.

ALTER TABLE lanes ADD COLUMN turns INTEGER;          -- turn-closing result events of log.jsonl
ALTER TABLE lanes ADD COLUMN last_outcome TEXT;      -- Outcome word of the last of them: done, hard-stop, question, blocked, unparsed, none
ALTER TABLE lanes ADD COLUMN log_mtime_ms INTEGER;   -- mtime of log.jsonl, the lane's last activity
ALTER TABLE lanes ADD COLUMN critical INTEGER;       -- 1 when tier.txt names the critical zone or goahead.txt exists
ALTER TABLE lanes ADD COLUMN front TEXT;             -- Front: line of the prompt header (prompt.txt names the file)
ALTER TABLE lanes ADD COLUMN chat TEXT;              -- Chat: line of the prompt header, a C- id
ALTER TABLE lanes ADD COLUMN merge_state TEXT;       -- result.json of a direct merge: merged, red, blocked; null without one
ALTER TABLE lanes ADD COLUMN gates_red INTEGER;      -- gates of result.json that are not ok
ALTER TABLE repos ADD COLUMN unpushed INTEGER;       -- commits on local branches not on a remote-tracking ref; null without a remote

CREATE TABLE notify_events (
  rule         TEXT    NOT NULL,  -- event kind of the catalogue
  unit         TEXT    NOT NULL,  -- stable subject: lane id, session id, repository key, repository:day or host
  transition   TEXT    NOT NULL,  -- once per occurrence: question#3, red, episode@<ms>
  seen_ms      INTEGER NOT NULL,  -- first evaluation that saw it
  closed_ms    INTEGER,           -- episodes of a level condition: when it turned false
  status       TEXT    NOT NULL,  -- baseline, suppressed, stale, queued, delivered, digested, failed
  delivered_ms INTEGER,
  channels     TEXT,              -- JSON array of the channels that accepted it
  urgent       INTEGER NOT NULL,
  PRIMARY KEY (rule, unit, transition)
);

CREATE TABLE notify_baseline (
  rule  TEXT PRIMARY KEY,         -- a rule evaluated at least once: later transitions are new
  at_ms INTEGER NOT NULL
);

CREATE TABLE notify_lease (
  id           INTEGER PRIMARY KEY CHECK (id = 1),
  pid          INTEGER NOT NULL,  -- the process that collects, stores load samples and notifies
  heartbeat_ms INTEGER NOT NULL
);

CREATE TABLE host_load (
  minute_ms     INTEGER PRIMARY KEY, -- start of the minute, epoch ms: one sample per minute
  load1         REAL NOT NULL,
  load5         REAL NOT NULL,
  load15        REAL NOT NULL,
  cores         INTEGER NOT NULL,
  running_lanes INTEGER NOT NULL
);

CREATE INDEX notify_events_open ON notify_events (rule, unit, closed_ms);

-- Every lane folder is read once more so the new columns fill; rows are replaced, none added.
UPDATE lanes SET cache_key = '';
