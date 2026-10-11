# Digest of the provisional decision rows, ordered by consequence, for Alfonso

Prompt-ID: P-2026-10-11-1430
Chat: C-2026-10-10-1145
Request: https://claude.ai/code/session_01FWUFsDDVN1SMB4MGco19GJ
Front: harness
Lane: fast (docs only: one new file under `docs/ratifiche/` and the log entry; reads `docs/decisions.md`, changes nothing in it). No critical-zone go-ahead.
Depends: none
Status: da eseguire

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-provdigest`, branch `prov-digest`, cut from the trunk tip that carries the docs commit adding
this prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and a clean
`git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-11-1430 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.
Unattended (lane auto): a question with one recommendation inside this lane's perimeter is answered as recommended
(RC-21).

## Context (measured by the chat, do not redo)
The discovery P-2026-10-11-1150 (`docs/discovery/discovery_2026-10-11_insights_more_cards.md`) found that no row of
`docs/decisions.md` adopted under RC-25 has ever been acknowledged through a digest, and that about 60 rows still read
`provisional, unattended`. Alfonso approved its recommendation: one digest for him, ordered by consequence. The
existing generator does not help: `npm run docs:digest -- --all` exits 2 because 49 row headers do not follow the
RC-25..27 grammar (for instance `docs/decisions.md:1515`, `R-IRN-38 (2026-10-02, provisional, unattended; evidence:
measured; reversible: branch)` with semicolons, `:2607` R-SIM-122 with a mixed ratified/provisional header, `:284`
RC-38 `awaiting Alfonso under RC-26`).

## WHAT
1. List every row of `docs/decisions.md` (RC-, R-, any prefix) whose header says `provisional`, whatever its
   grammar. For each: id, date, one-line summary of what it decides, evidence/verified/reversible as written, the
   chat that adopted it, and whether later rows or code depend on it (a quick `grep` of its id in `docs/` and
   `frontend/src`, counting references, is enough).
2. Classify each row by consequence for Alfonso, in three groups: **A** changes what a user or the MODELS demo sees,
   or a public interface, or is hard to undo (reversible: trunk or worse); **B** shapes how the harness or the
   lanes work (RC rows, protocol, tooling); **C** local and cheap to undo (reversible: branch, internal naming,
   test shape). Within a group, rows with more dependants first.
3. For each row, one line: `Recommended: ratify | amend (<what>) | revoke`, with the reason in a few words. Mark
   the rows whose recommendation you are not sure of.
4. A short section listing the 49 headers the generator cannot parse, grouped by the kind of deviation, with the
   minimal header rewrite each kind needs. Do not apply it: changing `docs/decisions.md` is Alfonso's call.
5. Write everything to `docs/ratifiche/claude_ratifiche_2026-10-11_provisional_digest.md`, in English, compact
   tables, ordered A, B, C, ending with the count per group and per recommendation, so that a single reply such as
   «ok alle raccomandazioni, tranne R-XXX» can close it.
6. `npm run check:docs` from `frontend/`. Commit only the new file with an explicit pathspec, as
   `docs(ratifiche): digest of the provisional decision rows, by consequence`; write the log entry in
   `docs/log-inbox/harness.md` uncommitted (RC-17). Stop with `Outcome: hard-stop (digest ready for Alfonso)`.

## DO NOT
- Change `docs/decisions.md`, any digest under `docs/digest/`, or any script.
- Ratify, amend or revoke anything: the digest only recommends.
- Touch `~/.jjodel-lanes/`, port 4700 or other worktrees.

## REFERENCES
- `docs/decisions.md` RC-21, RC-25..RC-28; `docs/digest/README.md`; `docs/PROTOCOL.md` P9, P16; RC-17.
- `docs/discovery/discovery_2026-10-11_insights_more_cards.md` (§ on decisions).
