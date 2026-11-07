# DCN L2.3: the `dcn` role group and the system profile «Dynamic classification»

Prompt-ID: P-2026-11-07-0941
Chat: C-2026-11-06-2159
Front: dcn
Status: eseguito 2026-11-07 · lane full · stopped at the context ceiling (RC-51), the code carried to f6b918db1 by P-2026-11-07-1012
Lane: full (extends exported unions of the role catalog and the profiles; visible in the Simulation roles dialog)
Depends: R-DCN-8, R-DCN-10, R-DCN-11, R-SIM-47..55; discovery docs/discovery/discovery_2026-11-06_dcn_foundations.md §3.2 and §6 (lane L2.3)
Worktree: ~/jjodel-w-dcn-l23, branch dcn-l23, from dcn at the commit that adds this prompt (P14 symlink to ~/jjodel/frontend/node_modules, removed at the end)
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (Alfonso 2026-11-07 09:29 «Si»)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean, otherwise stop with Outcome: blocked. Phase 1 is done; this prompt carries the GO for Phase 2. No subagents, no background tasks. Commit as soon as gates are green. Every reply opens with [P-2026-11-07-0941 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test, build or probe log. Before a browser probe check uptime: wait while the 1-minute load is above 20. Rule 11: this prompt authorizes new members of `RoleId`, `RoleGroup`, `ProfileShape` and `SystemProfileId`, and one new exported function.

## Contesto (non rifare l'analisi)

The catalog is one list (`model/simulation/roleCatalog.ts`, `ROLE_IDS`, groups `general | controlFlow | petri | events | data | output`); profiles map every role to a mode (`simProfiles.ts`, `modes: { [K in RoleId]: RoleMode }`), the required set is the closure of the shape (`CLOSURE`), and `OTHER_SHAPE_GROUP` hides the group of the other shape. R-SIM-47: the engine reads the resolved roles, never the profile; the nucleus is picked at `startRun` by which role set is bound (discovery §3.2). Read those two files, their tests, and the roles dialog only where it renders groups and profiles.

## COSA

(1) Roles, group `dcn`, each with its `sim*` bag key (names checked free by grep), kind and dependencies: `staticClass` (class), `viewpoints` (reference, StaticClass to Viewpoint), `dynamicClasses` (reference, Viewpoint to DynamicClass), `invariant` (expressionAttribute of the dynamic class), `operation` (reference to the operations of a class), `precondition` (expressionAttribute), `body` (actionListAttribute), `redefines` (reference), `monitor` (reference to the monitors of a dynamic class), `overlapping` and `complete` (boolean attributes of the viewpoint; add a `boolAttribute` kind only if no existing kind fits, and say so). Labels and one-line descriptions in English, in the style of the catalog. Instance-of is not a role: it is the R-OI binding (`ontoBindings`), read by the nucleus; say so in the group's comment.
(2) `ProfileShape` gains `dcn` with its closure (`staticClass`, `viewpoints`, `dynamicClasses`, `invariant`); under `dcn` both `controlFlow` and `petri` groups are hidden, under the other two shapes the `dcn` group is hidden (`OTHER_SHAPE_GROUP` becomes a list per shape if needed, without changing the behaviour of the two existing shapes). Every existing profile maps the new roles to `off` with a reason, so no existing profile changes its resolved roles.
(3) A system profile `dynamicClassification` («Dynamic classification»), shape `dcn`, the `dcn` group in `edit`, `events` kept as it is for invocations, `data` and `output` off. A pure function `dcnStcFromRoles(bag)` in a new file `model/simulation/dcn/dcnRoles.ts` that returns the resolved DCN roles or `null` when the closure is not met, beside `netStcFromRoles`; it is not called from `startRun` in this lane.
(4) Tests first: the catalog and profile suites unchanged for the existing profiles (resolved roles identical, field for field), the closure of `dcn`, the hidden groups per shape, the new profile resolved on the drone metamodel of `frontend/scripts/probe/dcn-drone-fixture.ts` reproduced as a test bag, and `dcnStcFromRoles` returning null for every incomplete bag. Mutation bench (P5).
(5) The roles dialog: if its rendering of groups or shapes needs a change to show the new profile, make the smallest one in `SimRolesModal.tsx` (or the file that renders the groups); otherwise leave it. Then a browser probe (throwaway in the lane folder, copied under a gitignored `_tmp_` name as P-2026-11-07-0750 did) that opens the dialog on a metamodel, picks «Dynamic classification», and crops the dialog in the light theme; and the same crop for the Petri profile on this branch and on the base, to show it unchanged. Crops in ~/.jjodel-lanes/P-2026-11-07-0941/crops/.
(6) Gates: typecheck at the baseline of CLAUDE.md §17, the simulation and sim suites and the full vitest run at its baseline, `npm run build`, `npm run check:docs`. One code commit. Then hard stop with the log entry in `docs/log-inbox/dcn.md` and the Status flip left uncommitted (RC-17): the chat reads the crops and gives the GO.

## HARD STOP

A change of the resolved roles of any existing profile, a need to touch `startRun` or the engine, or more than six files: stop with Outcome: question.

## NON FARE

No nucleus, no compiler, no change to `netStep.ts`, `netCompile.ts` or `simBridge.ts`, no push, no merge. Public repo: name no partner company.

## RIFERIMENTI

docs/decisions.md R-DCN-8, R-DCN-10, R-DCN-11, R-SIM-47..55; docs/spec/claude_spec_2026-11-06_dcn_metamodel_simulation.md §8; docs/discovery/discovery_2026-11-06_dcn_foundations.md §3.2, §6.
