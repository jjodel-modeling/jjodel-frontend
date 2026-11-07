# DCN L2.5: the drone object diagram on R-OI, dormant slots created and not orphan; class-owned ends (R-DCN-24)

Prompt-ID: P-2026-11-08-0011
Chat: C-2026-11-06-2159
Front: dcn
Status: da eseguire
Lane: full (probe; R-OI S2/S3a/S3b are on the trunk since cbc392c69)
Depends: R-DCN-3, R-DCN-19, R-DCN-20, R-DCN-24; L2.1, L2.2 (`frontend/scripts/probe/dcn-drone-fixture.ts`); discovery docs/discovery/discovery_2026-11-06_dcn_foundations.md §6 (lane L2.5)
Worktree: ~/jjodel-w-dcn-l25, branch dcn-l25, from the trunk at the commit that adds this prompt (P14 symlink to ~/jjodel/frontend/node_modules, removed at the end)
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (Alfonso 2026-11-08 00:04 «decidi tu, in caso procedi con /lane auto»)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean, otherwise stop with Outcome: blocked. No subagents, no background tasks. Every reply opens with [P-2026-11-08-0011 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; grep only MEAS, PASS, FAIL lines of a probe log. Before each probe run check uptime: wait while the 1-minute load is above 20.

## Contesto (non rifare l'analisi)

Read R-DCN-24 in `docs/decisions.md`, the fixture `frontend/scripts/probe/dcn-drone-fixture.ts`, and on the trunk only the R-OI entry points it needs: the creation path of `components/editor-v2/hooks/instantiate.ts` (synthesis, «Sync slots») and the `instantiation` problems producer. L2.1 put the dynamic-class attributes in the feature closure through `featureSources`, so S2 synthesis should create their slots and S3a should not call them orphan.

## COSA

(1) Fixture: per R-DCN-24 make `ownedSensors` (and the `WAU` end) class-owned ends (`Class.ownedAttributes` with `Property.association`), and give `Charging` one attribute of its own (`chargeRate`, Integer 0..10, default 1) so the drone has a real dormant slot; set the metamodel's `simProfile` to the dynamic-classification profile as the roles dialog writes it.
(2) Object level through the R-OI surfaces, not by hand: create `dji : Drone` (distance 0, speed 0, battery 80), `wau1 : WeatherAssessmentUnit` and the two sensors with the S2 creation path, link them through the class-owned ends.
(3) Measures (MEAS): the slots S2 synthesized for `dji`, with `chargeRate` among them; zero `instantiation` problems on every instance (no orphan, no missing after «Sync slots»); zero `dcn` problems on the class level; the conformance warnings left (expected: the DCN bodies, until P-2026-11-08-0010 lands; list them, do not fix). Export the project with GV_SAVE as `dcn-drone-objects.jjodel`. One screenshot of the object diagram (light theme) in ~/.jjodel-lanes/P-2026-11-08-0011/crops/.
(4) Commit the fixture and its measures in one code commit; the log entry in `docs/log-inbox/dcn.md` and the Status flip in one docs commit. No visual check is owed beyond the screenshot the chat reads. Outcome: done.

## HARD STOP

A need to edit any file under `frontend/src/`: stop with Outcome: question.

## NON FARE

No source changes, no push, no merge. Public repo: name no partner company.
