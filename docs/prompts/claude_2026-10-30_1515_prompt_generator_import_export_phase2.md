# Generator import and export as JSON, Phase 2 (fresh session after the context ceiling)

Prompt-ID: P-2026-10-30-1515
Chat: C-2026-10-30-1430
Front: codegen
Status: to execute
Lane: full (Phase 2 of P-2026-10-30-1430, continued in a fresh session)
Depends: P-2026-10-30-1430 (discovery 26d27c5e9)
Worktree: ~/jjodel-w-genio, branch gen-io (based on cg-generators 87cbac5b7)
Request: none (continuation; Alfonso's request is kept with P-2026-10-30-1430)

No subagents, no background tasks. One probe run per tool call. Commit as soon as the gates are green.
Do not merge, do not push.

## COSA

Implement Phase 2 of P-2026-10-30-1430. The previous session stopped at the soft context ceiling right after
the GO, with no code written. Everything you need is in three files; read them first and in this order:

1. `~/.jjodel-lanes/P-2026-10-30-1430/handoff.md` (scope, decisions 1 to 9 as adopted, the design choices that
   session made, the remaining steps);
2. `docs/discovery/discovery_2026-10-30_generator_import_export.md`;
3. `docs/prompts/claude_2026-10-30_1430_prompt_generator_import_export.md`, with this override: its
   single-list branch and its rule refusing an `entry` other than `main` are void. The multi-generator rules
   of the handoff apply (Replace / Import under a new name / Cancel through `generatorsPatch`, `entry` mapped
   to `root`, `targetProfile` and `files` in the format).

Do not re-run the discovery. Read only the code the handoff names for each step.

### New input: the two acceptance generators

Alfonso sent the two generators of the acceptance case, committed with this prompt:

- `frontend/src/codegen/engine/__tests__/fixtures/generator-smv.json` (metamodel `SyncRTL`, generator `smv`,
  11 templates, `smvModule` in text mode);
- `frontend/src/codegen/engine/__tests__/fixtures/generator-verilog.json` (metamodel `SyncRTL`, generator
  `verilog`, 10 templates, `verilogModule` in text mode).

Both target the same metamodel, so this case is only possible with multi-generator storage. Both are format
1.0 **without** `targetProfile` and `files`: the importer must accept a file that lacks them and fill the
defaults through the codec, as the handoff says (synthetic record through `decodeGenerators`). This is a
required test, not an edge case: these are the first real files of the format.

Tests that use them (in `generatorFile.test.ts`):

- each file decodes and validates with zero errors and zero warnings (every call resolves: `sp`, `expr`,
  `nary`, `impl`, `temporal`, `constLit`, `smvType`, `section`, `spec`, `vRange`, `vPorts`);
- importing both into one metamodel gives two generators, `smv` and `verilog`, with templates, params, modes
  and bodies equal to the files and in file order;
- re-exporting each gives the input file back, except for the keys the format adds (`targetProfile`,
  `files`), which appear with their default values; assert this exact difference, nothing else;
- importing `generator-smv.json` a second time into the same metamodel is a collision (`smv` exists), and
  "Import under a new name" yields `smv 2`.

### Acceptance (generated output)

The hand-entered originals are in a browser project this session cannot read, so byte comparison against them
stays with Alfonso. What this lane does: look for a SyncRTL model the session can read
(`~/Downloads/ArbiterSpec_to_SyncRTL.json` is the first candidate; read-only, do not copy it into the repo
unless it is a plain model with no personal data, and say which). If one is found, generate both outputs from
the imported generators through `generate()` in a test or probe and include the two texts in the report, so
Alfonso can compare them with what his hand-entered generators print. If none is found, say so and skip; the
unit tests above are the gate.

## DOVE

As in the handoff, plus the two fixture files above (already committed, do not edit them).

## COME

The four commits of the handoff, in order, with its gates after each (quiet runner, `tsc`, `vitest src/codegen`;
at the end `npm run build` and `check:codegen-lazy --on`). The closing docs-only commit holds: the log entry,
the `## 0. Answer in brief` section of the discovery report, and the `Status` flip of **both** prompts
(1430 and 1515).

Report closes with «Decisions taken (unattended)» (the design choices listed in the handoff plus any new one),
«Decisions awaiting Alfonso», the generated texts if any, then `Outcome: done | hard-stop | question | blocked`.
If the context ceiling fires again, write the handoff as the hook asks and stop.
