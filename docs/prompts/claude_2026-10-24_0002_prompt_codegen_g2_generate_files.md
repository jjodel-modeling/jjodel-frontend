# Code generation 3.3, slice G2: generation per file, with the generator's target

Prompt-ID: P-2026-10-24-0002
Chat: C-2026-10-23-2009
Front: codegen
Lane: full (implementation; engine, no critical-zone file)
Depends: P-2026-10-24-0001
Status: da eseguire
Corregge: none
Request: Alfonso, 2026-10-23 23:54, in the project chat (kept locally in the chain folder as `request.md`)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (`docs/discovery/discovery_2026-10-23_codegen_generator_viewpoint.md`). P8 does not apply.

Worktree: `~/jjodel-w-cggen`, branch `cg-generators`. Before anything else: `pwd`, branch, `git log -1`,
`git status --short` (only the `frontend/node_modules` symlink may show). Otherwise stop.

Model and tier: as `lane-run` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-24-0002 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list. Time limit: 75 minutes. No subagents, no background tasks. Commit as soon as
the gates are green. One probe run per tool call.

## Read first, and only this

The report: §1.3, §1.4, §1.5, §2, §8 (row G2). R-GEN-33..R-GEN-36 and R-GEN-41 in `docs/decisions.md`. The G1
commit on this branch (`engine/generatorCodec.ts`). `engine/generate.ts` in full (123 lines), `engine/text.ts`
and `engine/origin.ts` around the origin types.

## COSA

1. New `frontend/src/codegen/engine/generateFiles.ts`: `generateGenerator(globals, lookup, modelId, generator,
   options)` returns `{ generatorId, files: [{ path, entry, result }] }`, one `GenerateResult` per declared file,
   each produced by today's `generate` with that file's entry over the generator's template list. `target` comes
   from the generator: `js` builds `jsTarget` as `generate.ts:93` does today; `none` passes `target` null. Today's
   `generate` keeps its signature; if it needs a target parameter, add it as optional with today's behaviour as
   default.
2. Every origin that names a template must name it in every fragment kind the panel can click, so R-GEN-41 can
   lead from a fragment to its template. Measure first which origin kinds carry `template` today (`text.ts:46,49`
   and the model origin). If the model origin lacks it, add `template?: string` as an optional field filled by the
   engine where the fragment is emitted; report the file:line. Additive only.
3. Tests in `engine/__tests__/generateFiles.test.ts`: the default generator of the turnstile and petri examples
   produces code, map and errors sha256-identical to today's `generate` with the same entry (kills: root fallback
   changed); a generator with target `none` has `target` null in its context (kills: `jsTarget` always built); a
   generator with two files produces two results with their own entries (kills: one entry for all files); every
   model fragment of the turnstile output carries a template name (kills: the field not filled), if item 2 added it.

## DOVE

New `frontend/src/codegen/engine/generateFiles.ts` and its test; `engine/generate.ts`, `engine/text.ts`,
`engine/origin.ts` only where item 1 or 2 needs them (additive); `docs/log-inbox/codegen.md`; this prompt's
`Status:` line.

## Gates

From `frontend/`: `npm run typecheck` exit 0; `npm run build`; `npx vitest run src/codegen src/jjel`;
`npm run check:codegen-lazy -- --on`; the oracle tests unchanged and green. Mutation bench for item 3, killed/total.

## Close

`feat(codegen): generation per file with the generator's target (P-2026-10-24-0002)`, then the docs commit with the
log entry and the `Status:` flip `eseguito 2026-10-24 · lane codegen · <feat sha> · <bench k/n>`. `Outcome: done`.

## NON FARE

No UI change. No change of an existing exported signature (optional additions only). Nothing in the critical
zone. No new dependency. No push, no merge.
