# JjEL and JjTL SPEC: where `forall ... do` runs, and the verdict on a literal binding

Prompt-ID: P-2026-11-14-2145
Chat: C-2026-11-12-1346
Front: maintenance
Lane: fast (wording of two SPEC files, after one read-only probe; no behaviour change)
Status: eseguito 2026-11-14 · lane fast · 7fa09dfe3 · verifica visiva passata 2026-11-14 (chat unattended: wording of two SPEC files only, no behaviour change; check:docs and typecheck exit 0 on 7fa09dfe3. Nothing to see in the app.)
Request: https://claude.ai/code/session_01DQt9R4bYnjEzX4r18SudeG Alfonso, chat of 2026-11-14 21:35: yes to correcting the two SPEC lines found by the book review (tickets #936 and #937), and "decidi tu" on whether the code or the SPEC is right about a literal binding; the chat decided for the code
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-spec-do-literal`, branch `spec-do-literal`, cut from `alfonso-frontend-jjtl` at the commit that
adds this prompt. Model and tier as pinned (RC-16). Before anything else: `pwd`, branch, `git log -1` and `git status`
are as stated here. Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-11-14-2145 · session <id>]`; every final message ends with `Outcome: done | hard-stop |
question | blocked`; one `Recommended:` line per question. Time limit 45 minutes. Grep and read the parts you need, never
cat whole large files. If the session nears its context ceiling, write the handoff with the six headings `## Task`,
`## Scope`, `## Decisions taken`, `## Evidence`, `## Current diff`, `## Remaining checks`. No push, no merge. Only the
two SPEC files are edited; the evaluator, the parsers, the executors and the tests are not touched.

## WHAT and WHY

Two SPEC texts disagree with the code. The Jjodel book was corrected today to say what the code does; the SPECs must
say the same.

### 1. `forall ... do` (ticket #936)

`frontend/src/jjel/SPEC.md` says the `do` form of `forall` is "JjTL only" (lines 214, 224, 234, 255-256, 785 as read on
`c32e79c98`). The book lane P-2026-11-14-2100 probed the trunk: `forall x in S do ...` runs only in JjScript; the JjEL
parser and JjTL reject it. Confirm it from the parsers (one probe per language is enough, as a gitignored
`frontend/scripts/smoke/_tmp_*` file, deleted at the end), then correct every place of the JjEL SPEC: the `do` form is
JjScript's; JjTL creates per element with `forall ... -> Class { ... }`. `frontend/src/jjtl/SPEC.md` lists `do {}`
blocks under Phase 4: leave that, and check that no other sentence of the JjTL SPEC presents `forall ... do` as
available today; if one does, correct it the same way.

### 2. A literal in a binding (ticket #937)

`frontend/src/jjtl/SPEC.md:813` says a `Literal` expression is not invertible ("No source to reverse"). The
invertibility analysis answers invertible, and `binding-invertibility.test.ts` pins that answer.

Decision of the chat: the code is right. The verdict exists to say whether a rule can run backwards. A binding whose
value does not depend on the source asks nothing of the backward run: there is nothing of the source to recover, so it
cannot be what makes a rule unidirectional. Calling it not invertible would turn every rule with a constant into a
one-way rule for no reason.

Before writing, probe what the executor does on a backward run with (a) `b := "x"`, (b) `b := a + "suffix"`,
(c) `b := a + 1` with a numeric `a`, (d) `b := 1 + a`: the value written to the source, or nothing. Then:

- Make the table at line 813 and any sentence around it say what the analysis returns for a literal and for a `+` with
  one literal operand, each with one clause on what the backward run does, as probed.
- If the backward run of (c) or (d) does something wrong (for instance it treats a number as a string, or writes
  nothing while the verdict says invertible), do not fix it and do not describe it as correct: write in the SPEC only
  what holds, and report the case in the final message with the probe output, so the chat opens a ticket.

## Gates

The project's docs check (`check:docs`) and typecheck. No new test.

## Closure

One commit with the two SPEC files only (`git add <the two files>`, never `git add .`), subject within 72 characters,
for instance `docs: forall do is JjScript's; a literal binding is invertible (SPEC)`. Entry in the maintenance log per
P16, closing tickets #936 and #937. The Status flip belongs to the closure commit after the chat's GO. Final message:
the diff in words, the probe outputs, gate results.

## REFERENCES

- Book repository, `author/discovery/discovery_2026-11-14_gpt_review_third_part.md` (probes of lane P-2026-11-14-2100)
- `frontend/src/jjtl/executor/` (invertibility analysis), `binding-invertibility.test.ts`
- Tickets #936 and #937 in `docs/log-inbox/maintenance.md`
