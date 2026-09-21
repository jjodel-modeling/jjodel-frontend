---
name: log-entry
description: Write the closing prompt-log entry of a lane into docs/log-inbox/<lane>.md in the exact P9 format. The format block is injected live from CLAUDE.md 21.2, so this file holds no copy of it and cannot drift.
argument-hint: "[lane]"
allowed-tools: Bash(awk *)
---

Write the closing entry of the lane `$ARGUMENTS` into `docs/log-inbox/<lane>.md`. If the lane name is empty, ask for it before writing anything.

The format, read live from `CLAUDE.md` section 21.2 (the block that `npm run check:docs` compares byte for byte with `docs/PROTOCOL.md` P9). If the extraction below is empty the skill aborts instead of loading: the heading of 21.2 was renamed, and this skill must be updated with it.

!`awk '/^## YYYY-MM-DD .* type: short description$/{f=1} f{print} f&&/^\*\*Prompt document name\*\*: YYYY-MM-DD HH:mm$/{d=1;exit} END{if(!d)exit 2}' "${CLAUDE_PROJECT_DIR}/CLAUDE.md"`

Rules, in the order they bite:

1. The meaning of `Corregge`, `Causa`, `Regressions`, `Out-of-scope changes` and `Layer Impact Report` is `CLAUDE.md` section 21.3: read it before filling them. When in doubt mark the worse option (`yes`, `unknown`, `skipped`); an honest negative is the point of the fields.
2. The shape `check:docs` enforces once the entry reaches the active log. The inbox itself is not linted, and an entry that fails turns the whole gate red at the fold (measured 2026-09-21: seven entries, ten errors). The heading carries the em dash of the format block above. `Corregge` is the sentinel dash or starts with `YYYY-MM-DD HH:mm`. `Causa` is the sentinel dash or one letter in parentheses, `(c)`, with nothing after it. `Notes` is at most 500 characters: longer reasoning goes in the document it cites. `Prompt document name` is the timestamp of the prompt file name. The authority is `frontend/scripts/gates/check-docs.ts`.
3. Placement: append the entry at the END of the inbox file, below its header and the `---`. The fold inserts each inbox entry above the previous one of the same date, so the last one written ends on top (RC-12, `fold` in `frontend/scripts/gates/log-tools.ts`). Never touch `docs/claude-code-log.md` and never rotate: rotation is an exclusive lane (P13).
4. A ticket is a paragraph after the last field, starting `**Ticket** (`. Never a `## date - ticket` heading: the gate reads that as a task entry.
5. `Files touched` lists what changed in the lane with the shas. Above five files, say so in `Out-of-scope changes` and list them (RC-11).
6. Commit the inbox alone: `git add docs/log-inbox/<lane>.md`, then `git commit ... -- docs/log-inbox/<lane>.md`, with a subject within 72 characters before its ` (P-YYYY-MM-DD-HHmm)` suffix and the `Model:` trailer in the body (P6). Docs and code are never in one commit (P13).
7. Run `npm run check:docs` from `frontend/`. It does not read the inbox: its warning about the lane waiting to be folded is expected.
