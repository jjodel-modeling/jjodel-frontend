# Prompt: Phase 2, slice C3, ports of IR edges (first free handle, per-side cap, the grey dot)

Prompt-ID: P-2026-09-29-2351
Chat: C-2026-09-29-2230
Lane: Phase 2 (critical zone: `irEdgeViews.ts`, §3.1, Layer Impact Report required). Tier: heavy.
Status: da eseguire
Worktree: `~/jjodel-w-irports`, branch `ir-edge-ports` (cut by the chat from `alfonso-frontend-jjtl` at `62f4ac3fc`, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-irports`, branch `ir-edge-ports`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked`.

## COSA

Slice C3 of `docs/discovery/discovery_2026-09-29_derived_viewpoint_notations.md` (on branch `viewpoint-notations`, commit `ee7206d0c`; read it with `git show ee7206d0c:docs/discovery/discovery_2026-09-29_derived_viewpoint_notations.md`), §1 rows 11 and 12. On a derived turnstile (DeoPEST-like: states `locked` (Initial), `unlocked`, `off` (Terminal); transitions `locked -coin-> unlocked`, `unlocked -push-> locked`, `locked -push-> locked`, `unlocked -coin-> unlocked`, `locked -stop-> off`) Alfonso saw three arrowheads landing on one point of `locked`, and a grey port dot visible at the end of the `stop` edge on `off`.

Hypothesis from the discovery (not reproduced): `freeHandleIndex` in `irEdgeViews.ts:81-91` is documented as «first free handle index» but returns a count, so two edges can share an index; `MAX_HANDLES_PER_SIDE = 4` (`portDistribution.ts:520`) may drop a fifth edge on a side. The grey dot had no cause found by reading.

The chat's decision (Alfonso delegated IR and critical-zone decisions that keep existing semantics, 2026-09-29): fix to the documented behaviour (first free index, respecting the cap) only if the reproduction confirms the hypothesis; the change may move the ports of existing derived IR edges, which is accepted; it must not change the four demo scenes in the default viewpoint.

## DOVE

`frontend/src/components/editor-v2/.../irEdgeViews.ts` (§3.1) and its tests; `DynamicHandles` or the anchor CSS only if the DOM measure of the grey dot points there (then ask first, with the evidence); a report `docs/discovery/discovery_2026-09-29_ir_edge_ports.md` holding the reproduction, the Layer Impact Report and the measures; this prompt's Status; a log entry in `docs/log-inbox/` (the inbox that fits).

## COME

1. Read `CLAUDE.md` (§3.1, §5 «reproduce first», §6), `docs/PROTOCOL.md` P16, RC-20..RC-34, `frontend/src/components/editor-v2/CLAUDE.md`, R-VP-15..18.
2. Reproduce: a failing unit test on `freeHandleIndex` (and on the cap) with the turnstile's five transitions; a DOM probe (`lane-run probe`, a free port, not 3000/3001/3003) on a derived turnstile built by a console builder, measuring the arrowhead end points on `locked` and the computed style (opacity, size, colour) of every handle near the end of `stop` on `off`. If the hypothesis is false, stop with `Outcome: question` and the evidence.
3. Layer Impact Report in the report, before the code: layers touched, invariants (`CLAUDE.md` rules on the critical zone, R-IRN-32/33), tests.
4. Fix, with a mutation bench on the fix (report the score). Gates: typecheck (the known 14), full vitest (the known 9 red at import), build exit 0, `check:docs`, `check:addonly`.
5. Visual: crops of the derived turnstile before and after (light, `sips -Z 600`, `frontend/scripts/smoke/_tmp_*`), and the four demo scenes in the default viewpoint pixel-identical to the trunk readings (`~/.jjodel-lanes/probe-kit/trunk_readings_2026-09-29b.txt` procedure).
6. Commits: `fix:` for code and tests, `docs:` for report, log entry, Status; stage by explicit path. Stop with `Outcome: hard-stop`, the shas, the crops' paths.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a call to an AI model, any §3.1 file other than `irEdgeViews.ts`.

## RIFERIMENTI

Discovery `ee7206d0c` §1 rows 10 to 12; `handlePosition.ts:248`; `portDistribution.ts:520`; `EditorV2.scss:1706-1720`.
