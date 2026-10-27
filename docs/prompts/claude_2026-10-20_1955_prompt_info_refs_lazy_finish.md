# Finish the lazy References fix of Info (continuation of P-2026-10-20-1830)

Prompt-ID: P-2026-10-20-1955
Chat: C-2026-10-20-0839
Front: maintenance
Lane: full (continuation of a ceiling-stopped full lane, RC-51; not critical zone)
Status: eseguito 2026-10-20 · lane perf-click-profile · e392e7c68
Request: https://claude.ai/code/session_01EMpM7yBvFWpBXh3o1TJSRA
Depends: P-2026-10-20-1830
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-perfclick`, branch `perf-click-profile` (the same worktree as P-2026-10-20-1830, which stopped
at the AM-8 hard ceiling with the fix written and not committed). Model and tier: heavy, as pinned (RC-16), effort
`xhigh`. Go-ahead for the fix: Alfonso, 2026-10-20 18:27, «procedi con fix se sei ragionevolmente sicuro»; scope
amended by the chat's ACK to P-2026-10-20-1830 (one new component and its test).

## Lane discipline

Every reply opens with `[P-2026-10-20-1955 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 60 minutes. A question carries one `Recommended:` line.
Every gate runs in the foreground (P16). No push, no merge.

## COSA

Read first `~/.jjodel-lanes/P-2026-10-20-1830/handoff.md` and the report
`docs/discovery/discovery_2026-10-20_large_model_click_profile.md` (commit `3c7dc32f9`). Root cause, measured: a
selection click on an object with reference slots builds the target lists of the «References» section of the
Properties panel although the section is closed; each list scans all objects and reads `fullname`, about 14 ms a read
on the 407-object model of «Jjodel harness». The fix moves the section body into `InfoReferenceSlots.tsx`, rendered as
the child of Info's `CollapsibleSection` (which renders children only when open), and reads `validTargetsJSX` once per
slot. It is already in the working tree, uncommitted: `Info.tsx` modified, `InfoReferenceSlots.tsx` and
`__tests__/infoReferenceSlots.test.ts` new; typecheck 0 and the three new tests green (red first on the per-row copy).
Regenerate the diff with `git diff 3c7dc32f9` and review it before going on.

## DOVE

Only the files of the handoff: `frontend/src/components/editors/Info.tsx`,
`frontend/src/components/editors/InfoReferenceSlots.tsx`,
`frontend/src/components/editors/__tests__/infoReferenceSlots.test.ts`, the probe
`frontend/scripts/probe/large-model-click-profile.ts` (an opt-in step only), and in the closure
`docs/log-inbox/maintenance.md` and the Status lines of both prompts. No change to `LModelElement.tsx`, `fullname`,
`get_validTargets`, `proxy.ts` or any interface.

## COME

1. Probe step: an opt-in flag that, after the click, counts `get_validTargets` calls with the section closed (expected
   0) and after opening «References» (expected one per slot). This covers mutation m1 (body evaluated eagerly again),
   which no unit test can reach because `CollapsibleSection` lives in `Info.tsx` and vitest cannot load it
   (`monaco-editor` through the joiner barrel): run m1 once by hand against the probe and record the result.
2. Gates: `npm run typecheck` (0), the full vitest suite with its count, `npm run build`, through
   `node scripts/run-quiet.mjs` from `frontend/`.
3. After measurements: the probe on the BPMN Activity click and the gateway click, three runs each, medians against
   the before numbers of the report (Activity about 6.8 s of long tasks, gateway 1.25 s).
4. One `fix(editor):` commit with the code, the test and the probe step (if the P13 hook refuses the probe with the
   code, the probe goes in its own `chore(probe):` commit), mutation table and medians in the body, `Model:` trailer,
   `git add` by path.
5. Remove the temporary `frontend/node_modules` symlink created by P-2026-10-20-1830 (it is not tracked).
6. Closure (RC-17): one entry in `docs/log-inbox/maintenance.md` naming the m1 gap and the deferred root cause (the
   O(n) `fullname` walk, core, needs discussion), Status flips of P-2026-10-20-1830 and of this prompt, one docs
   commit. `Outcome: done`. The visual check is the chat's after the merge.

## RIFERIMENTI

`~/.jjodel-lanes/P-2026-10-20-1830/handoff.md`; `docs/discovery/discovery_2026-10-20_large_model_click_profile.md`;
CLAUDE.md §5 (untestable files); RC-51 (AM-8 continuation as a new lane).
