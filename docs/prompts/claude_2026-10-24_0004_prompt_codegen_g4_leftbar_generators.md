# Code generation 3.3, slice G4: the GENERATORS section of the project left bar

Prompt-ID: P-2026-10-24-0004
Chat: C-2026-10-23-2009
Front: codegen
Lane: full (implementation; eager left bar plus the setting module, no critical-zone file)
Depends: P-2026-10-24-0003
Status: da eseguire
Corregge: none
Request: Alfonso, 2026-10-23 23:54, in the project chat (kept locally in the chain folder as `request.md`)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (R-GEN-42 is the specification; the left bar is read in this lane, by ranges). P8 replaced:
the chat runs the visual check on the crops (RC-23).

Worktree: `~/jjodel-w-cggen`, branch `cg-generators`. Before anything else: `pwd`, branch, `git log -1`,
`git status --short` (only the `frontend/node_modules` symlink may show). Otherwise stop.

Model and tier: as `lane-run` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-24-0004 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list. Time limit: 75 minutes. No subagents, no background tasks. Commit as soon as
the gates are green. One probe run per tool call. Dev server: `npm start -- --port 3132 --strictPort`, stopped
before the close.

## Read first, and only this

R-GEN-2, R-GEN-40, R-GEN-42 in `docs/decisions.md`. `frontend/src/pages/components/LeftBar.tsx` around the
TRANSFORMS section (`grep -n "New transform"`, today `:463`) and how that section lists and opens transformations.
`frontend/src/codegen/setting.ts` in full. `frontend/scripts/gates/check-codegen-lazy.ts` around `EAGER_ALLOWED`.

## COSA

1. `setting.ts` (eager, the only codegen file the entry may import): `generatorEntries(lookup, metamodelId)` returns
   `[{ id, name }]` by a key read and a guarded `JSON.parse` of `genGenerators` only (no import from `engine/`);
   the default generator is always first, named «Default» when `genGenerators` gives no name; empty when the
   metamodel has no templates and no generators. Tests in `__tests__/setting.test.ts`.
2. `LeftBar.tsx`: a GENERATORS section right after TRANSFORMS, rendered only when the Experimental setting
   «Code generation» is on and the build has `VITE_CODEGEN`; hidden in consumer mode (R-GEN-23). One row per
   generator, grouped under its metamodel's name when the project has more than one metamodel, styled as the
   TRANSFORMS rows. A click opens the generator tab through a dynamic `import('../../codegen/ui/openTemplateEditor')`.
   A «+ New generator» entry under the section asks the metamodel when there is more than one, then opens the tab
   on a new generator (creation itself happens in the tab's selector code, reached through the same dynamic
   import).
3. Tests for `generatorEntries` (kills: default missing; non-default names dropped; parse error throws instead of
   returning the default) and a render test of the section if the left bar has a test harness; otherwise the probe
   covers it.
4. Probe: on the cloned Turnstile gallery project, setting on: the section lists «Default»; after creating a second
   generator from «+ New generator» it lists two; a click opens the right tab. Setting off: the section is absent.
5. Crops under `~/.jjodel-lanes/P-2026-10-24-0004/crops/`: the left bar with the section (one and two
   generators), the tab opened from it, the left bar with the setting off.

## DOVE

`frontend/src/codegen/setting.ts`, `frontend/src/codegen/__tests__/setting.test.ts`,
`frontend/src/pages/components/LeftBar.tsx` (the new section only), its SCSS if the section needs a rule,
a probe under `frontend/scripts/probe/`, `docs/log-inbox/codegen.md`, this prompt's `Status:` line.

## Gates

From `frontend/`: `npm run typecheck` exit 0; `npm run build`; `npx vitest run src/codegen`;
`npm run check:codegen-lazy -- --on` (the decisive gate: the left bar is eager and must pull no generator module);
the probe green; mutation bench killed/total.

## Close

`feat(codegen): GENERATORS section in the project left bar (P-2026-10-24-0004)`, then the docs commit with the log
entry and the `Status:` flip `eseguito 2026-10-24 · lane codegen · <feat sha> · <bench k/n> · crops in the lane
folder`. `Outcome: done`.

## NON FARE

No other change to the left bar. Nothing in the critical zone. No new dependency. No push, no merge.
