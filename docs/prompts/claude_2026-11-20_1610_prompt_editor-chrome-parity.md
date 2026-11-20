# Editor groups: one chrome for the diagram and the text editor

Prompt-ID: P-2026-11-20-1610
Chat: C-2026-11-20-1610
Front: multi-tab
Status: da eseguire
Lane: full (UI consolidation over two editors, discovery report first, no critical-zone file)
Depends: P-2026-11-19-2236 (active group), merged d29dcd79c, closed 7480c672d
Worktree: ~/jjodel-w-edchrome, branch editor-chrome-parity, created from the trunk at 7480c672d plus this prompt's commit
Request: https://claude.ai/code/session_01DQt9R3rFJe5AMqrdonBxgx (Alfonso 2026-11-20 16:04 and 16:06, «decidi tu»)
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili.

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No subagents, no background tasks. Dev server on a free port (lsof first; never 3000, 3001, 3003, 3061, 3062, 3081, 3087, 3110, 3790, 4700), left running at the hard stop with port and pid. Every reply opens with [P-2026-11-20-1610 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs; never cat a log. Context ceiling: read R-MT rows only from docs/decisions.md, read code by regions, commit each green step, write the handoff first if near the ceiling.

## COSA

Alfonso, looking at an editor area split in two groups (left: the Families metamodel on the diagram canvas; right: the sample-Families model in its textual tab), asked to make the two editors more homogeneous. Today they speak two different grammars:

1. Tab bar. The active tab is styled by artifact kind: violet text on lavender for the metamodel tab, cyan text with an amber icon for the model tab. The active tab therefore looks different in each group.
2. Second row. The canvas has an action toolbar (undo, redo, duplicate, delete, list, grid, layout, visibility, zoom, Split Right, a trailing `M` badge). The textual tab (`codegen/textual/ui/TextualTab.tsx`) has an informational header (artifact name, metamodel name, «Up to date»), then font size, the notation select (C-like), import, export, a panel toggle, a segmented Text | EBNF | Syntax, and a close X.
3. Representation switch. The canvas switches to text through a floating «Code» button at the bottom (`components/editor-v2/EditorV2.tsx` around 503); the textual tab has its own segmented control at the top right.
4. Status. «Up to date» lives in the textual header; «conforms to Families» and the instance count live in the status bar.
5. Outline. The textual tab carries its own instance tree with a filter and a breadcrumb (`Family "March"`); the canvas has a minimap. R-MT (2026-11-08) already put one Instances panel on the left for the whole editor area, following the active group, so the textual tree duplicates it inside one group.
6. Alfonso (2026-11-19): the textual editor of a model is distinct from the definition of its syntax (EBNF, text rules), which belongs to a viewpoint. EBNF and Syntax are syntax definition, so they do not belong in a model's tab.

Decisions (taken by the project chat on Alfonso's «decidi tu», 2026-11-20 16:06). Record them as the next free R-MT rows in `docs/decisions.md`, register grammar, ratified by delegation:

- D1. One active-tab style for every group and every artifact kind: neutral slate text, cyan underline, the same as the existing neutral tab tokens (reuse; do not invent tokens if suitable ones exist). The kind stays visible only through the letter badge (M, m, T, V), unchanged.
- D2. One editor bar under the tab bar, same height and padding for both editors, three zones. Left: editing actions (undo and redo in both; the rest is per editor). Middle: view controls (zoom for the canvas; font size and notation select for the text). Right: a segmented `Diagram | Text` followed by Split Right. Both editors render the bar from one shared component; each passes its own zone contents.
- D3. The segmented `Diagram | Text` replaces both the floating «Code» button on the canvas and the Text entry of the textual segmented. It switches the representation of the same artifact in the same tab, keeping today's behaviour of each path (do not change what the switch does, only where it lives). For a metamodel or model without a textual syntax, `Text` is disabled with a tooltip, not hidden (no layout shift).
- D4. EBNF and Syntax leave the model's textual tab. In their place, next to the notation select, an «Edit syntax…» action opens the syntax definition where it lives (the viewpoint or the existing EBNF/Syntax surface). If no surface outside the textual tab can host EBNF and Syntax today, do not remove them: stop with Outcome: question and the evidence (see stop conditions).
- D5. The close X inside the textual bar goes; the tab's own close stays. The informational header goes; «Up to date» (and its other states) moves to the status bar, next to «conforms to …», for the active group.
- D6. The instance tree and filter of the textual tab are no longer mounted; the textual editor follows the selection of the shared Instances panel (selection is already shared per element across tabs, R-MT). Unmount, do not delete the component files (deletions wait for Alfonso, RC-26). The breadcrumb stays in the text editor and is added to the canvas as a thin row under the bar showing the path of the current selection, same component, same height.
- D7. Backgrounds stay different (dotted canvas, white text): they mark the medium. Borders, inner padding and the separator between bar and content are identical.

Phase 1, discovery, read-only. Save the report as `docs/discovery/discovery_2026-11-20_editor_chrome_parity.md` (objective, files read with full paths, findings, risks, open questions). It must answer: where the tab style is decided by artifact kind (file, selector, tokens) and which neutral tokens exist; the components that render the canvas toolbar and the textual bar, and whether a shared bar component already exists (reuse if so); what the trailing `M` badge in the canvas toolbar is; how «Code» and the Text segmented switch representation today, and whether they are the same path; where EBNF and Syntax could live outside the model tab today (viewpoint panel, `jjtl/views/GrammarTab.tsx`, `codegen/textual/ui/SyntaxForm.tsx`, others) and what «Edit syntax…» would open; where «Up to date» is computed and how the status bar gets per-group information; how the textual tree selection relates to the shared Instances panel, and what is lost by unmounting the tree (state, keyboard navigation, filter); where the breadcrumb is built. List every file Phase 2 will touch. Commit the report (docs only), then continue into Phase 2 in the same session unless a stop condition holds (the Phase 1 hard stop is a session boundary, not a human gate, RC-26).

Stop conditions (Outcome: question, with the evidence and one `Recommended:` answer): D4 finds no surface outside the model tab for EBNF and Syntax; the switch of D3 turns out to be two different behaviours that cannot share a control without changing one; Phase 2 would touch a critical-zone file, an exported interface used outside these editors, or more than ten source files.

## DOVE

Expected, to be confirmed by the report: `codegen/textual/ui/TextualTab.tsx` and its stylesheet; `components/editor-v2/EditorV2.tsx`, `components/editor-v2/Toolbar.tsx` and their stylesheets; the dock tab rendering (`components/abstract/tabs/`, `MyRcDock.tsx` or the file the report names); the status bar component; one new shared bar component under `components/editor-v2/` or `components/abstract/` (name checked with a global grep before creating it, CLAUDE.md); their tests; `docs/decisions.md`; `docs/claude-code-log.md`. Anything else needs a question.

## COME

Slices, each committed when green: S1 tab style (D1); S2 shared bar and its use in both editors with the zones of D2, removal of the X and the header (D5, status moved); S3 representation switch (D3); S4 EBNF and Syntax out of the model tab with «Edit syntax…» (D4); S5 tree unmounted, breadcrumb shared (D6). Pure tests where logic exists (status text per group, `Text` disabled without syntax, breadcrumb path for a canvas selection). Gates: typecheck at baseline, vitest green (the known import failures excepted), build ok, `npm run check:docs`, `scripts/gates/__tests__/decisionsQuery.test.ts` and `docsDigest.test.ts`.

Mouse probe at 1600 and 1280 with real clicks: open the Families metamodel, Split Right, open sample-Families in the right group and switch it to Text. Measure from the DOM: both active tabs have the same computed color, background and underline; both bars have the same height, top offset and padding; the `Diagram | Text` control sits at the same right offset in both groups; no X in the textual bar; «Up to date» shows in the status bar when the textual group is active and disappears or changes when the canvas group is active; no tree in the textual tab; selecting `Member "Jim"` in the Instances panel moves the text editor to it; breadcrumb row present and of equal height in both; `Text` disabled with tooltip on an artifact without textual syntax; «Edit syntax…» opens the syntax definition. No layout shift when switching Diagram and Text (bar geometry identical before and after). No console errors. Crops of both groups, before and after, in the lane folder.

Commit code and docs separately, pathspec only, with the trailers Model: claude-opus-5-5, Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>, Claude-Session: https://claude.ai/code/session_01DQt9R3rFJe5AMqrdonBxgx. Log entry in `docs/claude-code-log.md`. Close the report with «Decisions taken (unattended)» and «Decisions awaiting Alfonso».

HARD STOP for the visual check, dev server running.
