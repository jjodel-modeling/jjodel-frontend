---
name: status-flip
description: Flip the Status line of a prompt file, at lane end or after the human visual check. Only the user invokes it. The wording is the P13 clause, injected live from docs/PROTOCOL.md.
argument-hint: "closing|visual-passed|visual-failed <prompt-file> [lane] [sha]"
disable-model-invocation: true
allowed-tools: Bash(awk *)
---

Flip the Status line of a prompt file. Arguments: `$ARGUMENTS`.

The clause, read live from `docs/PROTOCOL.md` (P13). Its wording is the only source of the two forms: do not paraphrase them. If the extraction below is empty the skill aborts instead of loading: the clause was renamed or moved, and this skill must be updated with it.

!`awk '/^- \*\*Every prompt file carries a Status line/{f=1} /^## P14 /{if(f){d=1;exit}} f{print} END{if(!d)exit 2}' "${CLAUDE_PROJECT_DIR}/docs/PROTOCOL.md"`

The three operations. Each one is a single-line edit of the prompt file with the Edit tool; touch nothing else in it.

- `closing <prompt-file> <lane> <sha>`: replace the Status line with the closing form of the clause: today's date, the lane name, and the sha you were given. The sha is the last code commit of the lane, or the report commit for a docs-only lane. If any of the three is missing, ask; never guess a sha.
- `visual-passed <prompt-file>` and `visual-failed <prompt-file>`: only when the line already holds the closing form and no visual suffix yet. Append the suffix of the clause with today's date. Refuse otherwise, and say which precondition failed. This is the flip that follows Alfonso's ACK in the chat: your being invoked is that ACK, so do not invoke it yourself.

Commit: the closing flip normally rides in the closing docs commit of the lane, in which case do not commit here. Otherwise commit the prompt file alone: `git add <prompt-file>`, then `git commit ... -- <prompt-file>`, subject within 72 characters before its ` (P-YYYY-MM-DD-HHmm)` suffix, `Model:` trailer in the body (P6). Docs only (P13).
