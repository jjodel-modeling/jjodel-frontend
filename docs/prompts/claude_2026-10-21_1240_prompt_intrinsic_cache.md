# Canvas: cache the intrinsic measure per element and content key, with inherited-CSS invalidation (fix 1 of round 3, second attempt)

Prompt-ID: P-2026-10-21-1240
Chat: C-2026-10-20-0839
Front: maintenance
Lane: full (critical zone: `viewpoint/ir/useContentSize.ts`, CLAUDE.md §3.1 table)
Status: eseguito 2026-10-21 · lane perf-round3 · 1a54325f2 (code committed by P-2026-10-21-1535; LIR e42b8e120) · visual check: measured only (production probe, see the commit body)
Request: https://claude.ai/code/session_01EMpM7yBvFWpBXh3o1TJSRA
Depends: P-2026-10-21-1115
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Critical-zone go-ahead: Alfonso, 2026-10-21 10:07, «procedi», on the round 3 proposal; the chat chose the batched
coordinator first, P-2026-10-21-1115 measured it and it missed the acceptance (drag measure 315 → 228-263 ms only:
the batch still writes `max-content` and pays one forced layout before the paint). The round 3 ablation that saved
1.1 s per drag was the cache, which skips the writes. This lane is the cache, with the invalidation the first LIR
flagged as its risk. Started with `--critical-zone-goahead P-2026-10-21-1240`. A Layer Impact Report amending
`docs/lir/lir_2026-10-21_intrinsic_batch_inset.md` is the first step (RC-30).

Worktree: `~/jjodel-w-perfround3`, branch `perf-round3` (after the trunk merge of P-2026-10-21-1232). Model and
tier: heavy, as pinned (RC-16), effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-21-1240 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 90 minutes. Every gate runs in the foreground (P16). No
push, no merge. Keep the context lean: the round 3 report only §3.4 and §4; the 1115 lane folder's
`measurements.md` for the base numbers; short probe output. Handoff before the AM-8 soft ceiling (RC-51).

## COSA

`measureIntrinsic` (`frontend/src/components/editor-v2/viewpoint/ir/useContentSize.ts`) runs in a `useLayoutEffect`
with no deps: per IR node per commit it writes `max-content` styles, reads `offsetWidth/offsetHeight`, restores. Add
a cache so the measure runs only when something it depends on changed. The key covers what the round 3 ablation
keyed on (`className`, `textContent`, `childElementCount`, `style.cssText`) plus an invalidation epoch that bumps
on every inherited-CSS change the measure depends on: `document.fonts.ready` (already a trigger), a theme change
(find how the theme is applied: a class or data attribute on `html`/`body`, or a CSS variable set; observe it),
the active viewpoint's style/CSS changes (find where viewpoint CSS is injected: a `<style>` element or a class on
the canvas root; observe it), the zoom level if the measure depends on it (check: `offsetWidth` is unscaled, say
so), and a window resize if any node measure depends on the viewport (check the CSS of IR nodes for `vw`/`%`
widths; say what you found). On a cache hit the hook calls its callback with the cached size without touching the
DOM; on a miss it measures as today and stores. Unmount drops the entry. Everything else unchanged: same values,
same callbacks, same guards.

## DOVE

1. `docs/lir/lir_2026-10-21_intrinsic_cache.md` (LIR, docs commit first; it supersedes the intrinsic half of
   `lir_2026-10-21_intrinsic_batch_inset.md` and says so).
2. `frontend/src/components/editor-v2/viewpoint/ir/useContentSize.ts`; the cache and the epoch in one new module
   beside it, `frontend/src/components/editor-v2/viewpoint/ir/intrinsicMeasureCache.ts` (grep the name first).
3. Tests beside the existing ones (`__tests__/useContentSize*.test.ts` are the benches; a new
   `intrinsicMeasureCache.test.ts`); the probe `frontend/scripts/probe/large-model-click-profile.ts` only for an
   opt-in staleness step (apply a theme change through the product's own switch, then compare every node's
   `offsetWidth/offsetHeight` with a fresh measure).
4. Closure: `docs/log-inbox/maintenance.md` and this prompt's Status line.

Nothing else: no change to the IR, EditorV2.tsx, the sync layer, the D-layer or persistence.

## COME

1. LIR. Baseline gates: `npm run typecheck` (0, RC-48), the full vitest count, `npm run build`, through
   `node scripts/run-quiet.mjs` from `frontend/` (temporary `frontend/node_modules` symlink, P14, removed at closure).
2. Tests red first, executing the code (P11): a hit skips the DOM writes and returns the stored size; a content
   change misses; a className change misses; an inline style change misses; a `fonts.ready` resolution, a theme
   change and a viewpoint style change each bump the epoch and miss; unmount drops the entry. Mutation bench:
   (m1) key without `textContent`, (m2) epoch not bumped on theme change, (m3) hit still writes `max-content`,
   (m4) entry kept after unmount; each killed by a named test.
3. Probe acceptance, production build, three runs on a quiet machine (`uptime` before each; wait while the 1-minute
   load is above 16, up to 20 minutes, then run and record the load), `CLICK_PROD=1 CLICK_LAYOUTS=1
   CLICK_STEPS=open,lat,drag,commit,vp` on the harness fixture: ring p50 ≤ 85 ms, move p95 ≤ 100 ms, drag long
   tasks median ≤ 400 ms, open and click not worse than the same-window base of P-2026-10-21-1115 (open 2179,
   click 305/273 at load 6-7), node sizes string-equal to the base, BPMN 48 nodes and 42 edges, the staleness step
   with 0 stale after a theme change and after `fonts.ready`.
4. One `fix(editor-v2):` commit (code, tests, probe step), measurements and mutation table in the body, `git add`
   by path, `Model:` trailer. Closure in one docs commit (RC-17). `Outcome: done`. The visual check is the chat's.

## Rollback

`pre-intrinsic-cache-2026-10-21` on the trunk before this prompt; `lane-run merge` tags again; undo with
`git revert -m 1 <merge sha>`.

## RIFERIMENTI

`docs/discovery/discovery_2026-10-21_large_model_round3.md` §3.4 (ablation `prod-r3b-intrinsic`), §4;
`~/.jjodel-lanes/P-2026-10-21-1115/measurements.md` and `batch.diff` (what not to do); CLAUDE.md §3.1, §3.2, §5.
