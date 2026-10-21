-- Tack event store, schema version 8: the kind of a lane's hard-stop and the auto resumes (stops slice).
-- Additive: no row or column is dropped. Words and counts only; no message text.

-- breakpoint | ceiling | hard-stop for a lane whose last turn ended Outcome: hard-stop; null otherwise.
ALTER TABLE lanes ADD COLUMN stop_kind TEXT;
-- Resume messages of the lane, and how many of them start with [auto].
ALTER TABLE lanes ADD COLUMN resumes INTEGER;
ALTER TABLE lanes ADD COLUMN auto_resumes INTEGER;
-- 1 once the two columns above were computed for the lane (a lane read before schema 8 is scanned once more).
ALTER TABLE lanes ADD COLUMN stop_scanned INTEGER NOT NULL DEFAULT 0;
