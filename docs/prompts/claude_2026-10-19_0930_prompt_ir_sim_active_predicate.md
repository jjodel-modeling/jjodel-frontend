# IR predicate «a run shows this element's model», and the Petri example's tokens hidden under it

Prompt-ID: P-2026-10-19-0930
Chat: C-2026-10-18-2254
Front: notation-library
Lane: full (IR type, compiler, both backends, predicate editor, tests, gallery rebuild)
Status: eseguito 2026-10-19 · lane notation-library · 50ab1d74c, 15fac4bfa, e1bb5db65 · verifica visiva passata 2026-10-19 16:41 (Alfonso, RC-23)
Request: Alfonso, 2026-10-19 09:20, «ok con la prima» (the chat's option 1: an IR predicate added next to `marked`)
Depends: P-2026-10-19-0300 (example viewpoints, `18ce5cdf1`, its decision awaiting Alfonso on the token marking)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-gallery`, branch `library-gallery`, HEAD `18ce5cdf1` plus this prompt cherry-picked by the chat. Expected dirty state at start, left by P-2026-10-18-2300 and P-2026-10-19-0300 for their closures: modified `docs/discovery/discovery_2026-10-18_notation_library.md`, `docs/log-inbox/notation-library.md`, the two prompts' Status lines (`claude_2026-10-18_2300_…`, `claude_2026-10-19_0300_…`), PNGs under `docs/discovery/assets/library-gallery/` (modified and untracked). Do not commit, revert or edit them except to append your own report section and inbox entry. Anything else dirty: `Outcome: blocked`. Port 3095 serves this tree for Alfonso: do not stop it.

Model and tier: heavy, Opus 5.5 as pinned (RC-16), effort `xhigh` (IR semantics on two backends). Time limit 90 minutes.

## Lane discipline
Every reply opens with `[P-2026-10-19-0930 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; every question with a recommendation carries `Recommended: <one line>`. Unattended (RC-21, RC-25): outside the RC-26 list take the recommended answer and record it. Append a section «IR predicate for a running simulation (P-2026-10-19-0930)» to `docs/discovery/discovery_2026-10-18_notation_library.md`. Two phases with a hard stop between them are not required: the design below is decided; but if discovery shows it cannot hold as written, stop and ask before coding.

## The problem (measured by P-2026-10-19-0300)
The `Petri net` viewpoint of `petri-producer-consumer@1` draws a place's `tokens` (the model's initial marking) as dots. During a run the simulator shows its own live marking in a corner pill and never reads `tokens`. The view hides its dots under `not marked`, but a place the run has emptied (`ready` after `produce`) is not marked and keeps its initial dot next to the pill's «0» (`docs/discovery/assets/library-gallery/petri-producer-consumer-sim.png`). No IR predicate today tells that a run is showing the model.

## COSA
1. **Discovery, short, in the report.** How `ctx.isMarked` reaches the IR (`viewpoint/ir/irCompile.ts:219`, the `'mark'` channel of R-MK-5), where the simulator publishes its run state, which backends evaluate predicates («draw semantics on both backends» in the `marked` case), and every place a predicate `op` is enumerated (types `ir/irTypes.ts:47`, compiler, `validateIR`, `components/ui/ConditionalEditor/conditional.ts:170` and the editor's choice list, serialisation, tests). Grep the new name before using it.
2. **The predicate.** Add `{ op: 'simActive' }` (name to confirm by grep; no path in v1): true for an element when a simulation run is active on the model that element belongs to, from the run's start (Reset included) until it is stopped; false otherwise, and false on every element when no run exists. It is an addition: no existing predicate, type member or behaviour changes. It declares the same `'mark'` channel as `marked` (or a channel of its own if the run's start and stop are not already signalled on `'mark'`; record which, with the evidence), so a view re-resolves when a run starts or stops. Both backends implement it identically.
3. **Authoring surface.** The predicate is offered in the conditional editor next to `marked`, with the display text `sim active` and the same "Reads state" grouping; `validateIR` accepts it.
4. **Tests.** Unit tests on the compiler (true and false cases; another model's run does not make it true; stop returns it to false), on both backends, on the editor's display text, and an IR round trip (serialise and parse). A mutation bench on the new branch of the compiler (in place, restored).
5. **Use it.** In `build-gallery.ts`, the Place view of the `Petri net` viewpoint draws its tokens under `not simActive` instead of `not marked`. Rebuild `petri-producer-consumer@1` with `GAL_REWRITE` (still unpublished). Nothing else in the gallery changes.

## DOVE
`frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts`, `ir/irCompile.ts` and the backend and validation files your discovery names; `frontend/src/components/ui/ConditionalEditor/conditional.ts` and the editor component that lists the predicates; their tests; `frontend/scripts/library/build-gallery.ts`; `frontend/public/library/gallery/petri-producer-consumer/1.jjodel`; `docs/library/catalog.json` and `frontend/public/library/catalog.json` (sha256); `frontend/scripts/probe/library-gallery-clone.ts` (the check below). If discovery puts a needed change in `useJjomSync.ts`, `portDistribution.ts`, the reducer or the simulator's engine: stop, `Outcome: question` with Recommended (critical zone or core outside this go-ahead).

## Checks
Typecheck at baseline, build, `check:scripts`, the IR and editor test suites, the gallery and codegen example tests. Codegen output of both examples byte-identical to `18ce5cdf1` (as 0300 measured it). Clone probe, own port, `CLONE_ONLY=petri-producer-consumer`: before the run, every place shows its initial tokens; during a run (Reset and three steps), no place shows drawn tokens and every place shows the simulator's pill, `ready` included; after Stop, the initial tokens are back. Bench the probe check on the pre-change package (it must fail on `ready`). Screenshots `petri-producer-consumer-sim.png` (retaken) and `petri-producer-consumer-stopped.png`. Then the probe once on all seven entries.

## Commits (P13), explicit pathspecs
1. `feat(ir): simActive predicate, true while a run shows the element's model (P-2026-10-19-0930)` (IR, backends, editor, tests). 2. `docs(library): catalog sha256 of petri-producer-consumer@1 (P-2026-10-19-0930)`. 3. `fix(library): Petri example tokens hidden while a run is active (P-2026-10-19-0930)`. Report section, screenshots, inbox entry and this prompt's Status uncommitted for the chat's closure. No push, no merge (RC-19). `Outcome: hard-stop` at the end.
