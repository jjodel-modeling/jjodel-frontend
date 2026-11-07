# DCN: conformance parses DCN bodies in the DCN action mode; W1 message for association-owned ends (R-DCN-24)

Prompt-ID: P-2026-11-08-0010
Chat: C-2026-11-06-2159
Front: dcn
Status: da eseguire
Lane: full (two checkers, no UI path)
Depends: R-DCN-12, R-DCN-24; L3.4 (DCN action mode), L2.4 (`dcnWellFormedness.ts`); tickets in docs/log-inbox/dcn.md (P-2026-11-07-1900)
Worktree: ~/jjodel-w-dcn-conf, branch dcn-conf, from the trunk at the commit that adds this prompt (P14 symlink to ~/jjodel/frontend/node_modules, removed at the end)
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (Alfonso 2026-11-08 00:04 «decidi tu, in caso procedi con /lane auto»)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean, otherwise stop with Outcome: blocked. No subagents, no background tasks. Commit the code as soon as the targeted suites are green, before the full run. Every reply opens with [P-2026-11-08-0010 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a log.

## Contesto (non rifare l'analisi)

Read R-DCN-24 in `docs/decisions.md` (added by the commit before this prompt). Ticket 1: `model/conformance/ConformanceValidator.ts` checks `Action` attributes outside the DCN action mode, so every DCN body like `self.power := 0` gets a `type_mismatch` warning («The target of an action must end in '.[attribute]'», `jjel/parser/parser.ts:165-166`). Ticket 2: W1 in `model/dcn/dcnWellFormedness.ts` reports a read through an association-owned end as an ordinary invisible feature.

## COSA

(1) `ConformanceValidator.ts`: when the metamodel of the checked model binds the DCN roles (the same test `DcnProblemSync` uses: `dcnStcFromRoles` on its bag with the dynamic-classification profile), parse the attributes bound to the dcn `body` role (operation and monitor bodies) in the DCN action mode; everything else, and every non-DCN metamodel, exactly as today.
(2) `dcnWellFormedness.ts`: a W1 read whose name matches an end owned by an association typed toward the reader's class gets the message «<name> is owned by the association <A>, so it is not navigable from self: own it on <Class> (R-DCN-24)».
(3) Tests first: conformance on a DCN body (no warning) and on a non-DCN metamodel with the same text (warning kept); the W1 message on the unmodified drone export shape (`ownedSensors` owned by the association). Mutation bench on the changed lines (P5).
(4) Gates: typecheck at the baseline of CLAUDE.md §17, conformance, dcn and simulation suites, full vitest at its baseline, `npm run build`, `npm run check:docs`. One code commit; log entry in `docs/log-inbox/dcn.md` and Status flip in one docs commit. No visual check is owed. Outcome: done.

## HARD STOP

More than four files of code and tests: stop with Outcome: question.

## NON FARE

No change to the handles, the parser or the fixture, no push, no merge. Public repo: name no partner company.
