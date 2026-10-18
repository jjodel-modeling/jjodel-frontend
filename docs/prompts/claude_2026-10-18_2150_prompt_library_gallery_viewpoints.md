# Library gallery: derived viewpoints for the five gallery projects (slice S1b)

Prompt-ID: P-2026-10-18-2150
Chat: C-2026-10-18-0110
Front: notation-library
Lane: full (more than 3 files: build script, five packages, test, Templates card)
Status: da eseguire
Request: Alfonso, 2026-10-18 21:49, «non ci sono i viewpoint, possiamo aggiungerli ?» while looking at the gallery on the S1+S2 branch
Depends: P-2026-10-18-1800 (gallery S1+S2, branch `library-gallery`, closure 04b9d9a48)
Corregge: P-2026-10-18-1800 (its S1 step 2 said «add no viewpoint»)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-gallery`, branch `library-gallery` (continues the S1+S2 branch, not merged yet; R-LIB-7), with this prompt cherry-picked onto it by the chat. Before anything else: `pwd`, branch, `git log -2` and `git status` match; otherwise `Outcome: blocked`. A dev server on port 3095 serves this tree for Alfonso: do not stop it; run your probes on another port.

Model and tier: heavy, Opus 5.5 as pinned (RC-16), effort `high`.

## Lane discipline
Every reply opens with `[P-2026-10-18-2150 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`. Unattended (RC-21, RC-25): take the recommended answer outside the RC-26 list and record it. Time limit 75 minutes. Append a section «Gallery viewpoints S1b (P-2026-10-18-2150)» to `docs/discovery/discovery_2026-10-18_notation_library.md`.

## COSA
Each gallery project gets at least one derived viewpoint on its model(s), built with the app's own «Derive viewpoint» path (`createDerivedViewpoint` in `frontend/src/utils/deriveViewpoint.ts`, notations in `components/editor-v2/viewpoint/derive/notations.ts`), never hand-written IR:
- `stateMachineEcore`: the notation `statechart` («State machine (UML statechart)») with the prefilled binding of its profile; if `canDerive` refuses the prefill on this metamodel, complete the class roles from the metamodel (State, Transition, initial, final as the Ecore names them) and record the table you used. Also a `generic` viewpoint.
- `graph`: `generic` (nodes as vertices, edges as edges).
- `library`, `shapes`: `generic`.
- `familiesPersons`: `generic` on each of the two metamodels.
The derived viewpoint names follow the existing rule `<metamodel> / <notation>`. The derived viewpoint is the active one when the project opens, if the project format records an active viewpoint; say which mechanism you used.

## DOVE
`frontend/scripts/library/build-gallery.ts` (derive in the build, through `page.evaluate` or the dialog, after the M1 import and before the export); the five `frontend/public/library/gallery/*.jjodel` regenerated; `frontend/src/library/__tests__/gallery.test.ts` (expected viewpoint counts per project, and that each derived viewpoint carries `derivedFrom` and `derivedNotation` in `_state`); `frontend/src/pages/Templates.tsx` (the card's count line becomes «N metamodels · N models · N viewpoints», the derived ones only). No change to `deriveViewpoint.ts`, `notations.ts` or any editor file: if the derive path cannot run in the build, stop and ask with a recommendation.

## Checks
Typecheck, the gallery test, `npm run build`. The clone probe of P-2026-10-18-1800 re-run (own port, never 3000, 3001, 3003 or 3095): for each project, clone, open, switch to the derived viewpoint, and screenshot the model at 1440×900 light theme into `docs/discovery/assets/library-gallery/viewpoint-<id>.png`; the Templates page screenshot retaken with the new count line. Leave a dev server running for the chat's visual check (RC-23) and give its port.

## Commits (P13), explicit pathspecs
1. `feat(library): derived viewpoints in the gallery projects (S1b, P-2026-10-18-2150)`.
2. Report section, screenshots, log entry in `docs/log-inbox/notation-library.md` and Status flip: left uncommitted for the chat's closure commit after the visual check.

No push, no merge (RC-19). `Outcome: hard-stop` at the end.

## NON FARE
No hand-written IR, no new notation, no change to the derive code or to any editor, no change to the clone code of S2.
