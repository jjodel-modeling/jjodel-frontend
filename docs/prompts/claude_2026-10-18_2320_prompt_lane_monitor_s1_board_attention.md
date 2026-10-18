# Lane monitor menu bar app, slice S1: `/api/attention` and `/l/<id>` on the board

Prompt-ID: P-2026-10-18-2320
Chat: C-2026-10-18-2225
Front: harness
Lane: phase2 (slice S1 of 5 of the plan in the P-2026-10-18-2255 report; one slice per session, RC-52; board module, its README and one new test file; no critical zone, no exported interface of the app)
Status: da eseguire
Depends: P-2026-10-18-2255
Corregge: —
Request: Alfonso, 2026-10-18 23:00: «Tauri va bene», «procedi nella maniera più automatica possibile con /lane auto e non ti fermare, procedi con l'implementazione». The chat writes the slices from the committed report (RC-26, RC-52).

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply (the discovery is the committed report). P8 applies to the board page only through the `/l/<id>` landing check below.

Worktree: `~/jjodel-w-menubar`, branch `menubar-disc`, at `f2c178b4f` (the Phase 1 report commit) or later commits of this chat. Before anything else: `pwd`, branch, `git log -1`, `git status` clean; otherwise `Outcome: blocked`.

Model and tier: as `lane-run start` assigns; no critical zone.

## Lane discipline
Every reply opens with `[P-2026-10-18-2320 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`. Unattended (RC-21, RC-25) outside the RC-26 list; record the choices in the entry. Time limit 75 minutes. Context ceiling RC-51. Tests through `run-quiet.mjs`. Read `lane-board.mjs` (about 1864 lines) with Read and `offset`/`limit`, never whole.

## Context (do not redo the analysis)
The specification is the committed report `docs/discovery/discovery_2026-10-18_lane_monitor_menubar_app.md`: §Q1 «The rule (decision taken)» (attention-relevant, closed by (a) (b) (c), waiting ≤ 72 h, stale otherwise, `ATTENTION_STALE_H = 72`), §Q2 (the `/api/attention` shape and field sources, cost and memoisation, placement before `/api` on `url.pathname`; `/l/<Prompt-ID>` strict, the hand-off page with the 1.5 s fallback, per-lane anchoring `/#lane=<id>` with `data-id` on the `<tr>`), §Q2 «Tests Phase 2 adds», §Q3 (first-line rule, 60 characters, `recommended` as a second field), §Q7 row S1. Implement what those sections say; where they leave a choice, take the simplest and record it. The report's measurement at 23:04 is 1 waiting, 12 stale, 173 closed over 186 candidates.

## COSA
1. Tests first in `frontend/scripts/hooks/__tests__/laneBoardAttention.test.ts` (new): the tests listed in §Q2, on pure exported functions (`attentionOf` or equivalent over rows and closure inputs, `firstLineOf`, the `/l/` id matcher), with fixtures, no real `~/.jjodel-lanes`.
2. `lane-board.mjs`: the functions, `GET /api/attention`, `GET /l/<id>`, `#lane=<id>` anchoring in the Lanes tab (select the Lanes tab, scroll to and highlight the row; a lane not in the table shows one line saying so), `data-id` on rows, `Corregge:` parsed beside `Depends:` in `header()`. Existing `req.url ===` routes untouched.
3. README `frontend/scripts/lane-board/README.md`: the two routes, the waiting/stale rule with its three closures and the 72 h constant, the JSON shape, and that the app (`tools/lane-monitor-app/`, slices S2..S5) is its client.

## DOVE
`frontend/scripts/lane-board/lane-board.mjs`, `frontend/scripts/lane-board/README.md`, `frontend/scripts/hooks/__tests__/laneBoardAttention.test.ts` (new), `docs/log-inbox/harness.md`, this prompt's Status line. Anything else: stop and ask with a recommendation.

## Checks
`laneBoard*.test.ts` and the `scripts/hooks` suite green at their count plus the new tests; `typecheck:scripts` 0; `check:scripts` PASS; `check:docs` PASS on the docs commit. Then start a board from this worktree on port 4712 with `LANE_BOARD_CACHE=/tmp/menubar/board/timeline-cache.json` (never the shared cache, never touch 4700), `curl -s localhost:4712/api/attention` and report `waiting`, `blocked`, `running`, `staleCount` and the ids, and compare with the report's rule applied by hand to the same moment; `curl -s -o /dev/null -w '%{http_code}' localhost:4712/l/P-2026-10-18-2255` is 200, `/l/foo` is 404. Leave the board on 4712 running for the chat's check of `/l/<id>` and `/#lane=<id>` in the browser (RC-23): `Outcome: hard-stop`. After the GO (a resume): code commit and docs commit (Status flip, P9 entry), then `Outcome: done`.

## Commits (P13, RC-17), explicit pathspecs, no push
Code commit: `feat(lane-board): /api/attention and /l/<id> for the menu bar app (P-2026-10-18-2320)`, the three code and test files. Docs commit: Status flip and the entry. Trailer `Model:` (P6) on each.

## NON FARE
No change to `stripKey`, `STRIP`, the strip pills, other tabs or columns; no CORS header; no new dependency; no restart or edit of the shared board on 4700, its plist or cache; no app code (S2).

## RIFERIMENTI
The P-2026-10-18-2255 report (§Q1, §Q2, §Q3, §Q7); `docs/prompts/claude_2026-10-18_1750_prompt_lane_board_cost.md` (board on a second port with a private cache); `frontend/scripts/hooks/__tests__/laneBoardStrip.test.ts` (fake `LANE_RUN` pattern).
