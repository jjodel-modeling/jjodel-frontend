# Prompt: F1, no L-proxy stored inside a view's IR (set_ir guard, stringify replacers)
Prompt-ID: P-2026-09-29-2121
Chat: C-2026-09-29-1840
Lane: full (Phase 2; critical zone `viewpoint/ir/`, go-ahead given). Tier: heavy.
Status: da eseguire
Worktree: `~/jjodel-w-noproxy`, branch `no-proxy-ir` (cut by the chat from `alfonso-frontend-jjtl` at `5626b3364`, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run` with `--critical-zone-goahead P-2026-09-29-2121`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-noproxy`, branch `no-proxy-ir`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-29-2121 · session <id>]` and ends with an `Outcome:` line (P16).

## COSA

Alfonso, 2026-09-29, ratified lane F1 of the discovery `docs/discovery/discovery_2026-09-29_ir_authoring_freeze.md` (commit `a50fa6607` on `ir-freeze-disc`; read it with `git show a50fa6607:docs/discovery/discovery_2026-09-29_ir_authoring_freeze.md`) and gave the **critical-zone go-ahead (RC-30)** for it. Mechanism (H1, measured): `Action.fire` refuses only a top-level proxy (`redux/action/action.ts:321`); an L-proxy nested in the value written by `view.ir = draft` is stored as-is; `JSON.stringify` then walks the lazily-built L graph for 0.8 to 62.5 s on one task and ends in «Converting circular structure». Cmd+S (`U.compressedState`, `common/U.tsx:439`) hung the page 5.5 to 232.7 s; `irHash` (`viewpoint/ir/irCompile.ts:335-336`) gave an 820 ms task and the view was silently skipped.

Scope, as ratified: the **local guard only**. No change to `Action.fire` (core, Rule 5): leave it untouched.

1. `set_ir` (`view/viewElement/view.tsx`) deep-maps any nested L object to its `id` before the `SetFieldAction` (a pure helper in a new `frontend/src/model/unproxy.ts`, name checked with a global grep first); a value that cannot be mapped is refused with a clear console error, never stored.
2. `irHash` and `compressedState` stringify with a replacer that maps any `__isProxy` value to its id, so a proxy already stored in an old project can never hang the page again.

## DOVE

- `frontend/src/view/viewElement/view.tsx` (`set_ir` only), `frontend/src/model/unproxy.ts` (new) with its vitest, `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` (`irHash` only), `frontend/src/common/U.tsx` (`compressedState` only).
- Layer Impact Report (CLAUDE.md, critical zone) in a discovery-style file `docs/discovery/discovery_2026-09-29_no_proxy_ir_layer_impact.md`, before the code commit.
- Log entry in `docs/log-inbox/views.md`, this prompt's Status.

## COME

1. Read `CLAUDE.md` (§3.1 critical zone, Rule 5), `docs/PROTOCOL.md` P16, RC-20, RC-21, RC-30, the discovery §0 and §6.
2. Red first: a vitest with a synthetic lazily-infinite proxy (a fresh proxy on every get, a counter that throws at N): today `irHash` reaches N and the `set_ir` path stores it; record it.
3. Layer Impact Report committed (docs), then the fix, minimal diff, no refactor, no renamed identifier.
4. Gates from `frontend/`: typecheck at the §17 baseline, `typecheck:scripts` exit 0, vitest 0 failed (state the expected total first: the tip plus the new tests), build ok. A lane probe (port 3059, never 3001) that writes a draft with a nested proxy through `view.ir =` and then presses Cmd+S: before, the page hangs (use the discovery's `_tmp_irfreeze_proxysave.ts` pattern with a short timeout); after, the save completes in under 1 s and the stored IR holds ids.
5. Commits: the Layer Impact Report (docs); `fix(ir): never store an L-proxy inside a view IR (P-2026-09-29-2121)` with code and tests; one docs commit with the log entry and Status `eseguito <date> · lane no-proxy-ir · <fix sha> · non fuso`. Pathspec after `--`.
6. Stop with `Outcome: hard-stop`, the shas, red/green numbers.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, `Action.fire`, `useJjomSync.ts`, `portDistribution.ts`.

## RIFERIMENTI

- Discovery `a50fa6607` §0 H1 and §6 F1; RC-30; `docs/PROTOCOL.md` P9, P14, P16.
