# Discovery: textual syntax step F, embedded JjEL and tracing (P-2026-11-06-2357)

- Prompt-ID: P-2026-11-06-2357, prompt `docs/prompts/claude_2026-11-06_2357_prompt_textual_f_discovery.md`
- Chat: C-2026-11-03-1037; session `e90eed04-44e4-4de6-83fb-e6fd9286d519`
- Tree: `~/jjodel-w-textf`, branch `textual-f-jjel-tracing`, HEAD `6b38a1318` (the prompt's commit on `65852b291`), clean at start
- Executor: Opus 5.5 (`claude-opus-5-5`)
- Read only. One probe in `~/.jjodel-lanes/P-2026-11-06-2357/` (`probe_jjel.ts`, bundled to `probe_jjel.mjs` with the repo's
  esbuild, output `probe_jjel.out`), run with node on this HEAD. Three read-only explorer passes did part of the reading;
  every claim below that the report relies on was re-read or re-run in this session unless tagged otherwise.

This report is a set of hypotheses with evidence, not a reference: whoever uses it rereads the real files.

## 1. Objective and hypotheses

Objective: find where JjEL lives in a model the Text tab prints, what the Text tab and the JjEL modules give for
highlighting, checking and completion inside such a string, what the codegen pipeline keeps for a trace from a generated
line back to the model, what T8 is, and cut step F into lanes of five files or fewer.

Hypotheses under test, with the verdict (evidence in the sections named):

- H1. The Text tab already knows which attributes hold JjEL. **Falsified** (§3): `TextAttribute.type` is a name string,
  and the only JjEL marker in the core is the primitive's id (`Pointer_EXPRESSION`, `Pointer_ACTION`), which the textual
  metamodel does not carry.
- H2. A JjEL value survives the print and re-parse of the textual notation, and its offsets can be mapped back to the
  document. **Holds, measured** (§4.2): nine values in three styles, quotes, backslashes and a newline included.
- H3. The JjEL parser gives errors with offsets and recovers. **Falsified** (§4.1): one error, line and column only, no
  end, no recovery; the AST nodes carry offsets.
- H4. A JjEL checker that resolves names against a metaclass exists. **Falsified** (§4.1): syntax checks only, plus
  run-time `undefined-identifier`; the nearest static name check is the template completion's class model.
- H5. The codegen pipeline keeps no origin per output line. **Falsified** (§5.1): origins per fragment, a line and
  column map per output, click-to-canvas and canvas-to-code already ship in the generator tab.
- H6. A click on a generated line can reveal the object in the Text tab with what exists. **Partly** (§5.3): the ids
  match on reading and step E's canvas-to-text listener would carry it through the canvas, but the Text tab has no entry
  point of its own.
- H7. T8 is defined in the docs. **Holds** (§6): `discovery_2026-11-01_textual_viewpoint.md:812`, re-import of an exported
  file; half of its cascade exists in `textMatch.ts`.

## 2. Files read

Windows read in this session (paths under `/Users/alfonso/jjodel-w-textf/`); the explorer passes read more of the same
files and their claims are re-read where the report uses them.

- `docs/sessioni/sessione_2026-11-03_textual_ide_plan.md` (whole, 56 lines)
- `docs/decisions.md` 1955-1962 (R-SIM-44), 7000-7040 (R-TXT-17..22), the injected R-TXT-34, RC-51, RC-17
- `docs/discovery/discovery_2026-11-01_textual_viewpoint.md` 745-844 (the cascade, the plan table A.7, the questions A.9)
- `docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md` 1-30, 316-385 (format of the lane plan)
- `docs/discovery/discovery_2026-11-06_textual_e_sync.md`, read from branch `textual-e-sync` (`34035b3a0`), 189-256 and
  423-472: it is not on this branch
- `docs/log-inbox/codegen.md` 2289-2301 (D1 entry)
- `frontend/src/codegen/textual/parser.ts` 216-242 (tokens); `languageService.ts` 190-200, 540-585;
  `ui/textualMonaco.ts` 175-200; `ui/TextualTab.tsx` 150-194; `metamodel.ts` 9-22; `baseGrammar.ts` 45-50
- `frontend/src/codegen/ui/templateCompletion.ts` 1-30, 35-70, 339-382; `codeOrigins.ts` 40-52;
  `frontend/src/codegen/engine/text.ts` 36-44
- `frontend/src/model/conformance/ConformanceValidator.ts` 15-30, 236-262; `model/validation/validationTypes.ts` 186-191;
  `model/simulation/netTypes.ts` 56-58, 154-166; `common/Defaults.ts` 38-42, 84-88; `joiner/classes.ts` 1185-1188
- `frontend/src/jjel/lexer/index.ts`, `jjel/parser/index.ts` (export lines); `jjel/lexer/lexer.ts` 37-42
- Read by an explorer pass and cited as such, not re-read: `jjel/index.ts`, `jjel/parser/parser.ts` 1040-1143,
  `jjel/types/ast.ts`, `jjel/autocomplete/`, `codegen/engine/{generate,generateFiles,origin}.ts`,
  `codegen/ui/{GeneratorPane.tsx,canvasSelection.ts,codeLines.ts,templateLanguage.ts,templateMarkers.ts}`,
  `events/registry.ts`, `components/editor-v2/EditorV2.tsx` 1167-1188, `textual/textMatch.ts`, `textual/ui/TextConfirmPanel.tsx`,
  `docs/discovery/discovery_2026-10-31_codegen_origins_through_concat.md`
