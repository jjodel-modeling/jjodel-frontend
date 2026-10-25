# Jjodie front: bring the S2 and S6b probes up to the current trunk

Prompt-ID: P-2026-10-25-1120
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: full (probes only, no product change)
Depends: P-2026-10-25-1020
Status: da eseguire
Corregge: 2026-10-24 03:10, 2026-10-24 03:55
Request: Alfonso, 2026-10-25 11:14, in the project chat («falla ripartire»)
Model: claude-opus-5-5

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-jjp-prb`, branch `jjp-prb`, cut from `alfonso-frontend-jjtl` at `952955684` plus the commit that
adds this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the
`frontend/node_modules` symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-25-1120 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25). Time limit: 50 minutes. No subagents, no background tasks. One probe run per tool call. Context
discipline: never `cat` a whole large file or log; probe output through `grep` of its summary lines. Dev server only on
a free port in 3010..3019 (check with `lsof`; other lanes are running), never 3000, 3001 or 3003; stop it at the end.
Subject lines without `(P-...)` suffix, Prompt-ID in the body, `Model:` trailer. Log entry in
`docs/log-inbox/jjodie-ui-prb.md`, and the Status flip of this prompt in the same docs commit. Nothing merges anywhere.

## Read first, and only this

`docs/log-inbox/jjodie-ui-tix.md` (the ticket on the two stale probes). Rows R-JJD-14 and R-JJD-17. The two probes:
`frontend/scripts/probe/jjodie-s2-script-card.ts` and `frontend/scripts/probe/jjodie-s6b-scripts-listing.ts`.

## COSA

1. `jjodie-s2-script-card.ts` fails 8 checks because an M2 reply now has its own card and preview bar (the M2 preview
   lanes). Update its expectations to the current behaviour: count and check the M1 card and the M2 card separately,
   each with its own chips, and keep every check that still describes intended behaviour. Do not weaken a check to
   make it pass: if a check fails because of a product bug, leave it failing and write it as a ticket.
2. `jjodie-s6b-scripts-listing.ts` fails 6 checks that look for the sidebar section «Scripts» and the old node type;
   since R-JJD-14 the section reads «Refactorings» and the megamodel card says «Refactoring». Update the labels and
   selectors; the behaviour checks (listing, open on click, rename) stay.
3. Run both probes on the current trunk tip; both pass, or every remaining failure is a ticket naming the product file.

Gates: `npm run check:scripts`, `npm run check:docs`. Commit (`test(probe): S2 and S6b probes follow M2 cards and
Refactoring labels`), then the docs commit.

## HARD STOP

None: `Outcome: done` with the pass counts of both probes.

## NON FARE

No edit under `frontend/src`. No merge, no push.
