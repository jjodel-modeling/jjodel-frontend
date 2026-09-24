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
2. The shape `check:docs` enforces on the entry, in the inbox as in the active log: a failing entry turns the gate red where it waits, and `npm run log:rotate -- --fold` refuses to fold it (until 2026-09-24 the inbox was not linted and the whole gate went red at the fold: seven entries, ten errors, measured 2026-09-21). The heading carries the em dash of the format block above. `Corregge` is the sentinel dash or starts with `YYYY-MM-DD HH:mm`. `Causa` is the sentinel dash or one letter in parentheses, `(c)`, with nothing after it. `Notes` is at most 500 characters: longer reasoning goes in the document it cites. `Prompt document name` is the timestamp of the prompt file name. The authority is `frontend/scripts/gates/check-docs.ts`.
3. Placement: append the entry at the END of the inbox file, below its header and the `---`. The fold inserts each inbox entry above the previous one of the same date, so the last one written ends on top (RC-12, `fold` in `frontend/scripts/gates/log-tools.ts`). Never touch `docs/claude-code-log.md` and never rotate: rotation is an exclusive lane (P13).
4. A finding that belongs to the lane's own entry is a paragraph after the last field, starting `**Ticket** (`: legal, not linted, no slot of its own. A finding that has to be found on its own is a ticket entry, the type of `CLAUDE.md` 21.2: heading `## YYYY-MM-DD — ticket: short description` and the fields `Ticket`, `Priority` (`high`, `medium`, `low`), `Found in` (a prompt ID or a chat ID) and optional `Detail`, no task fields, at the cost of one of the 40 slots. The colon form is what makes it a ticket: any other heading is read as a task entry.
5. `Files touched` lists what changed in the lane with the shas. Above five files, say so in `Out-of-scope changes` and list them (RC-11).
6. Commit the inbox alone: `git add docs/log-inbox/<lane>.md`, then `git commit ... -- docs/log-inbox/<lane>.md`, with a subject within 72 characters before its ` (P-YYYY-MM-DD-HHmm)` suffix and the `Model:` trailer in the body (P6). Docs and code are never in one commit (P13).
7. Run `npm run check:docs` from `frontend/`. It reads the inbox and lints your entry: fix what it names. Its warning about the lane waiting to be folded is expected.
