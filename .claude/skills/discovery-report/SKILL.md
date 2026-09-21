---
name: discovery-report
description: Write the discovery report that closes a read-only phase, in docs/discovery/. Clause P4 is injected live from docs/PROTOCOL.md, so this file holds no copy of it.
argument-hint: "[topic-slug]"
allowed-tools: Bash(awk *)
---

Write the discovery report of the phase you just ran read-only. Topic: `$ARGUMENTS` (ask for it if empty).

Clause P4, read live from `docs/PROTOCOL.md`. If the extraction below is empty the skill aborts instead of loading: P4 was renamed or moved, and this skill must be updated with it.

!`awk '/^## P4 /{f=1} /^## P5 /{if(f){d=1;exit}} f{print} END{if(!d)exit 2}' "${CLAUDE_PROJECT_DIR}/docs/PROTOCOL.md"`

What the clause leaves to the writer, from `CLAUDE.md` section 5 and the reports of this repo:

1. Open with the header: the Prompt-ID, the prompt file, the session id, the tree and its HEAD, the executor model as the banner shows it, and the line that the report is a set of hypotheses with evidence.
2. State the hypotheses under test as a list, and answer each one: holds, falsified, or partly, with the evidence next to the verdict.
3. Every finding carries `file:line` and a verbatim quote. Tag each claim as measured (a run in this phase) or read (docs, a file), and say which version a claim was measured on.
4. A read that stopped short is reported as a read of that window, never as a count over the subject. Every claim of absence names the search that supports it and a positive control run through the same tool (section 5, P12).
5. A report already at the chosen path is not rewritten: read it whole, compare point by point, and append a dated addendum with only what it does not cover (R-E/E-1).
6. Questions for the reader are numbered, one line each.
7. The report is written before the hard stop, in a commit of its own: `git add <report>`, then `git commit ... -- <report>`, subject within 72 characters before its ` (P-YYYY-MM-DD-HHmm)` suffix, `Model:` trailer in the body (P6). Docs only (P13). Then stop and report the sha and the questions.
