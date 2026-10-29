-- Tack event store, schema version 6: the Lanes page (slice 8).
-- Additive: no row or column is dropped. Metadata only, plus the prompt's title line and the worktree path.

ALTER TABLE lanes ADD COLUMN kind TEXT;              -- merge, fast, discovery, phase2 from the prompt's Lane: line; null otherwise
ALTER TABLE lanes ADD COLUMN title TEXT;             -- first `# ` line of the prompt header, at most 200 characters
ALTER TABLE lanes ADD COLUMN work_ms INTEGER;        -- sum of the lane's turns (each from its input to its result)
ALTER TABLE lanes ADD COLUMN worktree TEXT;          -- worktree.txt
ALTER TABLE lanes ADD COLUMN resolved INTEGER;       -- 1 when resolved.txt exists (lane-run resolve)
ALTER TABLE lanes ADD COLUMN adoptions INTEGER;      -- items of the "Decisions taken (unattended)" section of the last result; null without one

-- Every lane is read again by the next collection, so that the new columns are filled for exited lanes too.
UPDATE lanes SET cache_key = '';
