# CLAUDE.md is over the 40k context limit: split into a core plus directory modules

Prompt-ID: P-2026-09-18-1930
Chat: C-2026-09-18-1930
Status: da eseguire
Date: 2026-09-18 19:30 (Europe/Rome)
Type: chore (docs only, four phases, one commit per phase)
Branch: `validation-skeleton` in `/Users/alfonso/jjodel`, measured at `b3c6b6976`
Effort: xhigh (phase 0 is a measurement; phases 1 to 3 touch the normative document)
Lane: harness. This lane owns `CLAUDE.md`, `docs/PROTOCOL.md` and the new nested `CLAUDE.md`
files, and nothing else. No code file is touched in any phase.

## Contesto

Claude Code reported on 2026-09-18: `CLAUDE.md is over the 40.0k-char limit (62.4k chars)`.
Measured at `b3c6b6976`: the file is 62,440 characters, 22,440 over the limit. Four sections carry
56 percent of it: §3 critical zone 12,595, §5 visual bugs 9,381, §6 commit discipline 7,891, §9
object persistence 4,994.

**The first open question is whether the excess is truncated or merely reported.** If it is
truncated, part of the constitution has not been in force and nobody noticed, which would change
the reading of every `Causa` (c) entry in the log. Answering it is phase 0 and it comes before any
edit. Do not assume either answer.

The mechanism for the split already exists here and is not being invented. `scripts/generate-agents.mjs`
is tree-aware: it walks the repo and writes an `AGENTS.md` next to every projectable `CLAUDE.md`,
and its header comment states that nested files' siblings "appear automatically". §12.7 already
relies on a nested file, `frontend/src/jjtl/CLAUDE.md`, which loads when working under that
directory. So one nested module is already in production.

Two things measured while preparing this prompt, both to be treated as findings and not as
incidental notes. First, `scripts/generate-agents.mjs` names a `[CANARY]` smoke-test probe at
`frontend/src/components/editor-v2/CLAUDE.md`; that file does not exist at `b3c6b6976`. The comment
is stale, or the canary was removed without updating it. Second, `.claude/settings.json` pins
`"model": "claude-opus-4-8"` while `CLAUDE.md` §0 declares the agent runs as Claude Opus 5. One of
the two is stale and configuration wins over prose. Neither is in this lane's scope; report both in
the closing summary and leave them.

## Design principle for the whole split

**The rule stays in the core, the rationale and the measurements move to the module.** The
non-negotiable block already carries rules 12, 13 and 14 as one-liners while §3 carries their
elaboration; that division is the model for everything below. A nested module loads when work is
already under its directory, so anything an agent must know *before* deciding to act cannot live
there. When in doubt, the line stays in the core.

## Phase 0: prove that a nested CLAUDE.md is actually in force

Nothing moves until this is measured. §5 requires a positive control before an assertion of
absence, and it applies to the mechanism itself: migrating rules into a file that does not load
would silently repeal them.

**COSA.** Two measurements, both reported with the command that produced them and its exit status.

Measurement 1, the limit. Run a session with `claude --debug` and search the debug log under
`~/.claude/debug/` for the handling of `CLAUDE.md` and of the 40k limit. Report verbatim what the
log says about truncation. If the log does not settle it, say so: an inconclusive measurement is
reported as inconclusive, never as a negative result.

Measurement 2, nested loading. Create `frontend/src/components/editor-v2/CLAUDE.md` containing one
heading and one instruction that is unmistakable, verifiable and harmless, for example a rule that
any closing report for work under that directory must open with a fixed token. Then run two
sessions: one touching a file under `editor-v2/`, one touching a file elsewhere. Report whether the
token appears in the first and is absent in the second. Absent in both means the mechanism does not
load and phases 1 to 3 are cancelled; present in both means it is loaded globally, which changes
nothing about the size problem and must be reported.

**COME.** `npm run gen:agents` then `npm run check:agents` after creating the probe, because a
projectable nested `CLAUDE.md` now produces a sibling `AGENTS.md` and the gate compares byte for
byte. Commit the probe and its generated sibling together (rule 1c).

**HARD STOP.** Report both measurements to Alfonso and wait. Phases 1 to 3 do not start without his
ACK on the results.

## Phase 1: move the layer-specific material out of §3 and §9

**COSA.** §3 is not homogeneous: part of it is about the sync layer, part about D and L layer
semantics, part about persistence migrations. Split it by the layer it governs, and move §9 whole,
since it is L-proxy write semantics.

Stays in the core, unchanged: §3.1 (the critical-zone file table, which is the index that tells an
agent the zone exists) and §3.2 (the Layer Impact Report template, which must be produced *before*
the diff and therefore before any module could have loaded).

Moves to `frontend/src/components/editor-v2/CLAUDE.md`: §3.3 TRANSACTION rules, §3.4 DVoidEdge
race-window guard, §3.5 Step 4 dependency limitation, §3.10 role-aware bucket keys, §3.11 runtime
store access.

Moves to `frontend/src/model/CLAUDE.md`: §3.6 father versus forward-link collections, §3.7
`pkg.__raw.uri` versus `pkg.uri`, §3.8 composition versus containment, §3.12 identity slot to name,
§3.13 L-proxies report the D-layer className, and the whole of §9 object persistence patterns.

Moves to `frontend/src/redux/CLAUDE.md`: §3.9 VersionFixer and jsxString persistence.

**COME.** Verbatim moves. Do not reword, do not summarise, do not "improve" a sentence while moving
it: every measured date and every cited path travels as it is. In the core, each moved subsection
leaves a single line naming what it covered and the file that now holds it. Cross-references that
say "see §3.4" elsewhere in the corpus keep working only if the numbering survives, so keep the
subsection numbers in the module headings.

**Known gap to state in the report, not to solve here.** §3 governs `frontend/src/redux/VersionFixer.tsx`
and `frontend/src/common/DV.tsx`, and the latter sits under neither of the three module directories.
Rule 14 already covers it in the non-negotiable block, which is why this is a gap in the elaboration
and not in the rule. Report it; do not invent a fourth module for one file.

**Verification.** `npm run gen:agents`, `npm run check:agents`, `npm run check:docs` all green.
Report the new character count of the root `CLAUDE.md`.

## Phase 2: trim §5 and relocate §6.4 to §6.6

**COSA.** §5 is method that applies to every task, so it does not move, but 9,381 characters of it
are mostly worked examples: the ugrep measurement of 2026-08-11, the typecheck window of 2026-08-13,
the tree-glyph colour measurement of 2026-08-12, the mutation bench of 2026-09-16 on
`symbolRecognition.ts`. Keep every rule and every sub-rule heading. For each worked example, keep
one sentence stating what it established and the date, and move the full account to the discovery
report or session file that already holds it. Where no such document exists, create one under
`docs/discovery/` rather than deleting the account.

§6.4 (lane concurrency), §6.5 (worktrees and cherry-picks) and §6.6 (where the rules live) are
shared engagement rules, not codebase facts, and §1 already states that shared engagement rules live
in `docs/PROTOCOL.md` as numbered clauses. Move them there as P13, P14 and P15, keeping the text
verbatim, and leave in §6 one line per clause pointing to it. §6.4 is already inscribed as RC-13 in
`docs/decisions.md`; update that entry to cite the new clause number.

**COME.** §6.1, §6.2 and §6.3 stay in the core untouched. The §21.2 entry-format block stays in the
root `CLAUDE.md` and is not touched by anything in this prompt: `frontend/scripts/gates/check-docs.ts`
check A requires it to be byte-identical to `docs/PROTOCOL.md` P9, and that identity is a declared
critical constraint.

**Verification.** The three gates green, plus a re-read of P9 and §21.2 confirming the identity
survived the edit to the same file.

## Phase 3: move the language and design sections

**COSA.** §7 design system to `frontend/src/styles/CLAUDE.md`; §11 JjEL to `frontend/src/jjel/CLAUDE.md`;
§12 JjTL into the existing `frontend/src/jjtl/CLAUDE.md`; §13 JjScript to `frontend/src/jjscript/CLAUDE.md`;
§14 Ecore and XMI to `frontend/src/services/export/CLAUDE.md`.

**Exception, stays in the core.** The language-boundary table and the symbol-ownership list of §12.6
are cross-cutting: they exist to stop a confusion between three languages, and an agent working in
one of the three would load only that one's module. They are compact. Keep them in the core, in a
§12 reduced to that table plus pointers.

**Exception, stays in the core.** Rules 26 to 28 on tokens and legacy CSS are already in the
non-negotiable block and stay there; only §7's elaboration moves.

**Verification.** The three gates green. Report the final character count and the per-file
breakdown.

## Target and acceptance

The root `CLAUDE.md` ends under 40,000 characters with real headroom, expected around 21,000 to
25,000. Acceptance is not the number alone: every moved block must be verbatim, the three gates must
be green at every phase, `## 0.` must still be the heading `generate-agents.mjs` keys on, and the
phase 0 measurement must have shown that nested files load. A phase that cannot meet all four stops
and reports.

## Log and commits

One commit per phase, docs only, never bundled with code (§6.4). Each phase's log entry goes in this
lane's inbox, not in the active log, and carries `Corregge: —` and `Causa: —` unless a phase exists
to remedy an earlier one. The entry records the character count before and after, so the effect of
the split is measurable later rather than reconstructed.
