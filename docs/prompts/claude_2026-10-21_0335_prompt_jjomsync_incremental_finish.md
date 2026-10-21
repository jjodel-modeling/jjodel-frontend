# Critical zone: finish the useJjomSync incremental sync (continuation of P-2026-10-21-0155)

Prompt-ID: P-2026-10-21-0335
Chat: C-2026-10-20-0839
Front: maintenance
Lane: full (critical zone: `useJjomSync.ts`, CLAUDE.md §3.1; continuation of a ceiling-stopped lane, RC-51)
Status: da eseguire
Request: https://claude.ai/code/session_01EMpM7yBvFWpBXh3o1TJSRA
Depends: P-2026-10-21-0155
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Critical-zone go-ahead: Alfonso, 2026-10-21 00:13 («Ok» to fix 1), carried by P-2026-10-21-0155; this lane is started
with `--critical-zone-goahead P-2026-10-21-0335`. The LIR is `aad47a12d` and stays valid: the diff is the one it
describes.

Worktree: `~/jjodel-w-jjomsync`, branch `jjomsync-incremental` (same as P-2026-10-21-0155; the code and tests are in
the working tree, uncommitted). Model and tier: heavy, as pinned (RC-16), effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-21-0335 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 60 minutes. Every gate runs in the foreground (P16). No
push, no merge. Keep the context lean: read the handoff, not the whole report again; short probe logs.

## COSA

Read `~/.jjodel-lanes/P-2026-10-21-0155/handoff.md` (and its «Remaining checks»). The edits to `useJjomSync.ts`,
`sync/vertexSnapshot.ts` with its 39 tests and the #67 row in `reducerCopyOnWrite.test.ts` are done; typecheck 0,
build 0, full vitest green except the 9 known import failures (and `criticalZone.test.ts`, which fails only under a
go-ahead variable: run it with the variable unset and state the count). What remains is measurement and commits.

## DOVE

The files listed in the handoff, nothing else: `frontend/src/components/editor-v2/hooks/useJjomSync.ts`,
`frontend/src/components/editor-v2/sync/vertexSnapshot.ts`,
`frontend/src/components/editor-v2/sync/__tests__/vertexSnapshot.test.ts`,
`frontend/src/redux/reducer/__tests__/reducerCopyOnWrite.test.ts`; closure: `docs/log-inbox/maintenance.md` and the
Status lines of P-2026-10-21-0035, P-2026-10-21-0155 and this prompt.

## COME

1. Recreate the temporary `frontend/node_modules` symlink (P14); remove it before the closure.
2. Probe acceptance, three dev runs, `CLICK_STEPS=open,drag,commit,vp,audit` on
   `~/jjodel-papers/2026-sosym-harness-models/jjodel/jjodel.harness.project.jjodel`: name reads per drag ≤ 2,100,
   drag long tasks ≤ 2.7 s median, click, open and viewpoint switch not worse than the report's baseline, audit 0
   stale at rest and after the reference-target rename, BPMN viewpoint 48 nodes and 42 edges.
3. Bench: `Date.now()` back in the deps (run count per drag from the probe); anti-bounce re-run dropped, checked with
   a temporary `_tmp_` probe (select, rename within 100 ms, audit after 1 s), not committed. Revert both.
4. One `fix(editor-v2):` commit with the four files, measurements and mutation table in the body, `git add` by path,
   `Model:` trailer. Closure in one docs commit (RC-17). `Outcome: done`. The visual check is the chat's.

## RIFERIMENTI

`~/.jjodel-lanes/P-2026-10-21-0155/handoff.md` and `handoff.diff`; `docs/lir/lir_2026-10-21_jjomsync_incremental.md`;
`docs/discovery/discovery_2026-10-21_jjomsync_incremental.md`.
