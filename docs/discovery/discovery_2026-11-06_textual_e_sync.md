# Discovery: textual syntax step E, T10 and synced selection (P-2026-11-06-2337)

Prompt: `docs/prompts/claude_2026-11-06_2337_prompt_textual_e_discovery.md`. Chat C-2026-11-03-1037, front `codegen`.
Branch `textual-e-sync` in `~/jjodel-w-texte`, from `8049bf81b`; HEAD at start `e1d7dc9a1` (this prompt's commit), tree
clean. Read only: no source file changed. Decisions in scope: R-TXT-34 (step E), R-TXT-17..22, RC-51, RC-17.

Every claim below says how it is known: **read** (the code at the cited line), **measured** (a command whose output is
quoted), or **design** (a proposal of this report).

## 1. Objective and hypotheses

Step E of `docs/sessioni/sessione_2026-11-03_textual_ide_plan.md:27`: «T10 and synced selection. Scenario 2 and
selection synced between text and canvas, both ways, checked with a real canvas gesture. If it enters the critical zone:
Layer Impact Report and Alfonso's go-ahead.»

The report answers the seven questions of the prompt: what T10 and scenario 2 are (§3), text to canvas (§4), canvas to
text (§5), loops and timing (§6), the critical zone (§7), verification (§8), and the lane plan with decisions E1..En
(§9). Risks and open questions close it (§10).

Hypotheses at the start, each checked below:

- H1. T10 is not implemented: a diagram edit reprints the whole text and drops comments. **Confirmed** (§3.2).
- H2. Both channels between canvas and the outside already exist as events, so selection sync needs no change under
  `components/editor-v2/`. **Confirmed for nodes**, not for edges (§4.2, §5.1).
- H3. Selection sync needs no model write. **Confirmed**: React Flow's `selected` is local state; the optional
  `_lastSelected` write is a transient root key that never enters the undo history (§4.3).
- H4. No piece of step E touches a file of the CLAUDE.md 3.1 table or a 3.2 trigger. **Confirmed** (§7).

## 2. Files read

Plan, decisions, earlier reports and prompts:

- `/Users/alfonso/jjodel-w-texte/docs/sessioni/sessione_2026-11-03_textual_ide_plan.md` (whole)
- `/Users/alfonso/jjodel-w-texte/docs/sessioni/sessione_2026-11-01_default-textual-notation.md` (lines 105-106)
- `/Users/alfonso/jjodel-w-texte/docs/decisions.md` (R-TXT-17 to R-TXT-22, lines 7003-7040; R-TXT-34, line 7147)
- `/Users/alfonso/jjodel-w-texte/docs/discovery/discovery_2026-11-01_textual_viewpoint.md` (§A.6 and §A.7, lines 782-829)
- `/Users/alfonso/jjodel-w-texte/docs/discovery/discovery_2026-11-03_textual_tolerant_parser.md` (T10 lines 193, 212, 228, 275, by grep)
- `/Users/alfonso/jjodel-w-texte/docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md` (§6 and the §8 table format)
- `/Users/alfonso/jjodel-w-texte/docs/prompts/claude_2026-11-01_2210_prompt_textual_syntax_design_discovery.md` (lines 1-60)

Text tab (`frontend/src/codegen/textual/`):

- `/Users/alfonso/jjodel-w-texte/frontend/src/codegen/textual/ui/TextualTab.tsx` (lines 706-785, 1005-1484)
- `/Users/alfonso/jjodel-w-texte/frontend/src/codegen/textual/ui/textualMonaco.ts` (lines 100-245)
- `/Users/alfonso/jjodel-w-texte/frontend/src/codegen/textual/ui/openTextualTab.tsx` (lines 1-110)
- `/Users/alfonso/jjodel-w-texte/frontend/src/codegen/textual/languageService.ts` (lines 41-110, 450-490)
- `/Users/alfonso/jjodel-w-texte/frontend/src/codegen/textual/printer.ts` (lines 20-50, exports by grep)
- `/Users/alfonso/jjodel-w-texte/frontend/src/codegen/textual/parser.ts` (comments and trivia, by grep: lines 143-180, 234-241, 397-421)
- `/Users/alfonso/jjodel-w-texte/frontend/src/codegen/textual/textDiff.ts` (exports by grep)

Canvas selection and the store:

- `/Users/alfonso/jjodel-w-texte/frontend/src/components/editor-v2/hooks/useJjomSelection.ts` (whole)
- `/Users/alfonso/jjodel-w-texte/frontend/src/components/editor-v2/utils/canvasSelection.ts` (whole)
- `/Users/alfonso/jjodel-w-texte/frontend/src/components/editor-v2/EditorV2.tsx` (lines 1160-1191, 1590-1648, 2795-2816, 3035-3050, 3095-3130)
- `/Users/alfonso/jjodel-w-texte/frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (lines 1040-1061; `onDoubleClick` by grep)
- `/Users/alfonso/jjodel-w-texte/frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` (lines 1195-1229)
- `/Users/alfonso/jjodel-w-texte/frontend/src/codegen/ui/canvasSelection.ts` (whole)
- `/Users/alfonso/jjodel-w-texte/frontend/src/codegen/ui/codeOrigins.ts` (`pickOnCanvas`, lines 84-91)
- `/Users/alfonso/jjodel-w-texte/frontend/src/events/registry.ts` (lines 18-30, 100-103)
- `/Users/alfonso/jjodel-w-texte/frontend/src/redux/reducer/reducer.ts` (lines 1250-1279, 1340-1384)
- `/Users/alfonso/jjodel-w-texte/frontend/node_modules/monaco-editor/esm/vs/editor/editor.api.d.ts` (`ICursorSelectionChangedEvent`, by grep; Monaco 0.52.2)

Probes of earlier lanes (outside every tree), for the verification pattern:

- `/Users/alfonso/.jjodel-lanes/P-2026-11-05-0148/probe.mjs`, `/Users/alfonso/.jjodel-lanes/P-2026-11-06-2041/probe.mjs`,
  `/Users/alfonso/.jjodel-lanes/P-2026-11-02-0057/visual-check.mjs`, `/Users/alfonso/.jjodel-lanes/P-2026-11-02-0235/probe.mjs` (headers and gesture lines, by grep)
