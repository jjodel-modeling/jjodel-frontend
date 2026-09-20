Read-only analysis. Do not modify, create or delete any file.

Goal: measure how much CLAUDE.md and AGENTS.md at the repository root duplicate each other, to decide how to slim CLAUDE.md (it is loaded at the start of every session and is about 62 KB).

Steps:
1. Report the size in bytes and lines of CLAUDE.md and AGENTS.md (use Read; count lines).
2. List the top-level sections (## headings) of each file, in order.
3. For each section of CLAUDE.md, classify it as: DUPLICATE (substantially the same content exists in AGENTS.md, name the matching section), PARTIAL (overlaps but adds Claude-specific material, say what), or UNIQUE.
4. Estimate the bytes of CLAUDE.md that are DUPLICATE and PARTIAL.
5. Run `git log --oneline -5 -- CLAUDE.md AGENTS.md` and report the output, so we know whether the two files are edited together.

Output: a plain table for step 3, then five lines of summary with the byte estimates. Maximum 80 lines. No recommendations on how to rewrite the files.
