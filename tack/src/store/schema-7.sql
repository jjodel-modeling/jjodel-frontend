-- Tack event store, schema version 7: lane closure (slice 8 fix).
-- Additive: no row or column is dropped. Ids and one word only.

-- Every Prompt-ID a commit message names anywhere (subject or body), not only the one unit it is linked to.
CREATE TABLE commit_ids (
  repo_key  TEXT NOT NULL,
  sha       TEXT NOT NULL,
  prompt_id TEXT NOT NULL,
  PRIMARY KEY (repo_key, sha, prompt_id)
);
CREATE INDEX commit_ids_prompt ON commit_ids (prompt_id);

-- First word, lowercased, of the Status: header line of the lane's prompt file read at the repository's HEAD; null when unread.
ALTER TABLE lanes ADD COLUMN prompt_status TEXT;

-- Every repository is read in full once, so that commit_ids is filled for the commits already stored.
UPDATE repos SET tips = '{}';
