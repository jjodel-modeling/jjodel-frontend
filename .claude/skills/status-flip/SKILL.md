---
name: status-flip
description: Flip the Status line of a prompt file, once, for the lane's closure commit. Only the user invokes it. The wording is the P13 clause, injected live from docs/PROTOCOL.md.
argument-hint: "closing <prompt-file> <lane> <sha> [passata|fallita]"
disable-model-invocation: true
allowed-tools: Bash(awk *)
---

Flip the Status line of a prompt file. Arguments: `$ARGUMENTS`.

The clause, read live from `docs/PROTOCOL.md` (P13). Its wording is the only source of the two forms: do not paraphrase them. If the extraction below is empty the skill aborts instead of loading: the clause was renamed or moved, and this skill must be updated with it.

!`awk '/^- \*\*Every prompt file carries a Status line/{f=1} /^## P14 /{if(f){d=1;exit}} f{print} END{if(!d)exit 2}' "${CLAUDE_PROJECT_DIR}/docs/PROTOCOL.md"`

The one operation, a single-line edit of the prompt file with the Edit tool; touch nothing else in it.

- `closing <prompt-file> <lane> <sha> [passata|fallita]`: replace the Status line with the full closing form of the clause: today's date, the lane name, the sha you were given and, for a lane with a human visual check, the visual suffix with the outcome of Alfonso's GO and today's date. No outcome given: no suffix, the form of a lane without a visual check. The sha is the last code commit of the lane, or the report commit for a docs-only lane. If the file, the lane or the sha is missing, ask; never guess a sha or an outcome.

Commit: none here. The flip rides only in the lane's closure commit, with the log or inbox entry (P13, RC-17).
