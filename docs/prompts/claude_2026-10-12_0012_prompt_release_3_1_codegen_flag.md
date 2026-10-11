# Prompt: release 3.1, L3, hide the code generator behind a build flag

Prompt-ID: P-2026-10-12-0012
Chat: C-2026-10-11-1812
Front: release-3-2
Lane: full (build-time gate across codegen, EditorV2 and Settings)
Depends: P-2026-10-11-1812
Request: none (Alfonso, 2026-10-12 00:06, "ok alle raccomandazioni"; D3 of the 1812 report)
Status: eseguito 2026-10-12 · lane rel31-codegen-flag · d7c1f3df3 · hard-stop, partial: orphan runner.worker still emitted; merged 5718511af (visual GO pending)

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply.

Worktree: `~/jjodel-w-rel31-codegen`, branch `rel31-codegen-flag`, created by the chat from `alfonso-frontend-jjtl` at the docs commit that added this prompt, with `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-12-0012 · session <id>]` and ends with an `Outcome:` line (P16). Gates run in the foreground.

## COSA

3.1 ships without the generator: no Settings toggle, no Code pill, no generator chunk in the bundle. 3.2 turns it back on with one env line. Implement §2.7 of `docs/discovery/discovery_2026-10-11_release_3_1_scope.md`, reading the flag as `import.meta.env.VITE_CODEGEN === 'true'` (undefined, hence off, in vitest and in every build that does not set it):

1. `frontend/src/codegen/setting.ts` (`getCodegenEnabled`, ~22-28): returns false when the flag is off.
2. `frontend/src/components/editor-v2/EditorV2.tsx` (~413 and ~5000): the `React.lazy` import of the panel and the `codePill` exist only under the flag literal, so Rollup drops the chunk and the worker.
3. `frontend/src/pages/settings/AdvancedSettings.tsx` (~83-100): the divider and the Experimental group only under the flag.
4. `frontend/src/codegen/__tests__/setting.test.ts`: the «on» cases with `vi.stubEnv('VITE_CODEGEN', 'true')`, plus one «off» case.
5. `frontend/scripts/gates/check-codegen-lazy.ts` (~157-165): a flag-off mode asserting no `src/codegen/` module in any chunk except `setting.ts`; the existing clauses run with `VITE_CODEGEN=true`. Wire both modes into the npm script.

Verify the bundle both ways (`npm run build` with and without `VITE_CODEGEN=true`) and list the codegen chunks found in each. Do not change the CI workflows or `.env.*`: 3.2 adds the env line.

Gates: typecheck 14, vitest, build, smoke on a dev server of this tree on port 3143, check:docs, check:codegen-lazy in both modes. One visual check on 3143: Settings → Advanced shows no Experimental group, the editor has no Code pill; save a crop of each in the lane folder.

Report: `docs/discovery/discovery_2026-10-12_rel31_codegen_flag.md`, with «Decisions taken (unattended)» and «Decisions awaiting Alfonso». Log entry in `docs/log-inbox/release-3-1-codegen.md`. Commit, stop with `Outcome: hard-stop`.

## NON FARE

No push, no merge, no tag. Touch only the five files above, the report and the inbox. Do not delete codegen code or `frontend/public/examples/codegen/*.jjodel` (D8: switched off, not removed). No critical-zone file.

## RIFERIMENTI

`docs/spec/claude_spec_2026-10-10_code_generation_pilot.md` (R-GEN-2), CLAUDE.md §3, §17; PROTOCOL P4, P9, P14, P16.
