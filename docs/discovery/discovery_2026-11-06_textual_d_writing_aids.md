# Discovery: textual syntax step D, writing aids (P-2026-11-06-2040)

- Prompt-ID: P-2026-11-06-2040, prompt `docs/prompts/claude_2026-11-06_2040_prompt_textual_d_discovery.md`
- Chat: C-2026-11-03-1037; session `36c899e9-55a4-4c7a-98eb-812d329e707a`
- Tree: `~/jjodel-w-textd`, branch `textual-d-writing-aids`, HEAD `95c2ec038` (the prompt's commit on `fc79098ad`), clean at start
- Executor: Opus 5.5 (`claude-opus-5-5`)
- Read only. Probes in `~/.jjodel-lanes/P-2026-11-06-2040/` (`probe_expected.ts`, `probe_comment.ts`, their `.out`), bundled with
  the repo's esbuild and run with node on this HEAD.

This report is a set of hypotheses with evidence, not a reference: whoever uses it rereads the real files.

## 1. Objective and hypotheses

Objective: measure what the language service, the parser and the Text tab give step D today (completion, line errors with
quick fixes, safe rename, formatting, R-TXT-37), and cut D into lanes of five files or fewer.

Hypotheses under test, with the verdict (evidence in the sections named):

- H1. The parser exposes an expected set at a cursor that completion can use as is. **Falsified** (§3): it gives only an
  error message string, and the set it names drops the optional parts skipped before the error point.
- H2. Some Monaco provider for completion, code actions, rename or formatting is already wired. **Falsified** (§2): six
  providers, none of those four.
- H3. Conformance and validation results are reachable from the Text tab as line markers. **Partly** (§4): reachable by
  object id through the problems registry or by calling `validateConformance`; nothing in `codegen/` reads them today.
- H4. A rename can go through the text alone and keep identity. **Holds on reading** (§5): spans carried by the editor
  keep the match certain, model references are by id; not measured end to end.
- H5. The printer can serve as the formatter without loss. **Falsified** (§6): the printer prints no comments and no
  parentheses of the text.
- H6. Commenting out one object asks before applying. **Falsified, measured** (§7): one commented port gives one delete,
  no refusal, and the guard returns null, so the pause applies it.

## 2. Files read

Full paths, under `/Users/alfonso/jjodel-w-textd/`:

- `frontend/src/codegen/textual/languageService.ts` (whole, 624 lines)
- `frontend/src/codegen/textual/parser.ts` (windows 1-190, 440-740, 1020-1395 of 1395)
- `frontend/src/codegen/textual/ui/textualMonaco.ts` (whole, 260 lines)
- `frontend/src/codegen/textual/ui/TextualTab.tsx` (windows 255-404, 530-709, 1160-1359 of 2047; greps for providers,
  markers, pause, comments)
- `frontend/src/codegen/textual/printer.ts` (windows 20-78, 275-312; greps)
- `frontend/src/codegen/textual/textDiff.ts` (window 360-420; export grep)
- `frontend/src/codegen/textual/__tests__/portCorpus.ts` (whole), `__tests__/blockTokens.test.ts` (600-616, imports)
- `frontend/src/components/editor-v2/problems/registry.ts` (1-130), `ConformanceProblemSync.tsx` (imports)
- `frontend/src/model/conformance/ConformanceTypes.ts` (36-80), `useConformance.ts` (1-40), `ConformanceValidator.ts` (imports, signature)
- `docs/sessioni/sessione_2026-11-03_textual_ide_plan.md` («Status after step C»), `docs/decisions.md` R-TXT-46..52,
  `docs/log-inbox/codegen.md` (latest entry)

Not read: `concreteGrammar.ts`, `styleCheck.ts`, `annotations.ts`, `textMatch.ts`, `useSyntaxDraft.ts` beyond export
greps; the prompt lists them, and nothing in D's findings below depends on their bodies. Said here so the gap is visible.

## 3. Completion

(pending)

## 4. Diagnostics and quick fixes

(pending)

## 5. Safe rename

(pending)

## 6. Formatting

(pending)

## 7. R-TXT-37, commenting an object out

(pending)

## 8. Lane plan and decisions

(pending)

## 9. Risks and open questions

(pending)
