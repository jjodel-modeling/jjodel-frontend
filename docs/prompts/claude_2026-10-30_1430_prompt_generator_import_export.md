# Generator import and export as JSON (Templates tab and project dashboard)

Prompt-ID: P-2026-10-30-1430
Chat: C-2026-10-30-1430
Front: codegen
Status: to execute
Lane: full (new exported module, new dashboard section, two-phase)
Depends: none (branch based on cg-generators 87cbac5b7, not yet merged into the trunk)
Worktree: ~/jjodel-w-genio, branch gen-io
Request: none (typed in the project chat on 2026-10-30; kept locally)
Supersedes: P-2026-10-29-1650 (file lost before commit, never executed)

Before anything else: check that `P-2026-10-30-1430` does not already exist in `~/.jjodel-lanes/` or
`docs/prompts/`, and that no `claude_2026-10-29_1650_*` prompt was ever committed (`git log --all -- 'docs/prompts/*2026-10-29_1650*'`).
If either exists, stop and report.

No subagents, no background tasks. One probe run per tool call. Commit as soon as the gates are green.

## COSA

Templates exist only inside the app. The Templates tab has no import or export, and the `.ecore` export drops
the `_state` bag, templates included. Moving templates between projects, between the hosted app and a local
build, or from a file written outside the app means re-entering every name, parameter list, mode and body by
hand; one wrong character in a body shows up only when the generator runs.

Add import and export of generators as JSON, from two places that share one implementation:

1. the Templates tab of a metamodel (`TemplateEditorTab`), for that metamodel's generator;
2. a new GENERATORS section in the project dashboard (`ProjectEditor`), listing every generator of the
   project with its metamodel and template count, with Export per row, Export all and Import in the header.

### File format

One generator:

```json
{
  "format": "jjodel-generator",
  "formatVersion": "1.0",
  "metamodel": "<metamodel name>",
  "generator": "<generator name>",
  "entry": "main",
  "templates": [
    { "name": "main", "params": [], "mode": "expression", "body": "..." },
    { "name": "expr", "params": ["e", "L"], "mode": "expression", "body": "..." },
    { "name": "smvModule", "params": ["m", "L"], "mode": "text", "body": "...", "target": "smv" }
  ]
}
```

"Export all" writes a JSON array of such objects in one file; import accepts either a single object or an array.

Rules for the format, fixed here:

- `mode` is always written on export (`modeOf(record)`), so the file is explicit. On import, `expression`
  is stored with no `mode` field (R-GEN-25: nothing writes `mode` for an expression) and `text` is stored as
  `mode: "text"`. This keeps stored bytes identical across a round trip.
- `target` is written when the record has one and read back when present. It is not in the shape the request
  showed, but dropping it would break the round trip.
- Bodies are written verbatim (newlines, quotes, backslashes, `${...}`), relying on `JSON.stringify`; no
  escaping of our own. Files are pretty-printed with 2-space indentation.
- Template order in the file is the stored order, and import keeps it.
- Unknown top-level and per-template fields are ignored on import (forward compatibility), and reported once
  as a note, not as an error.
- File name: `<metamodel>.<generator>.generator.json` for one, `<project>.generators.json` for all.

### Base branch

This lane runs on `gen-io`, branched from `cg-generators` (87cbac5b7, 55 commits ahead of the trunk, visual GO
from Alfonso, not merged). `cg-generators` rewrites `TemplateEditorTab.tsx`, `openTemplateEditor.ts` and
`LeftBar.tsx` (generator tabs, GENERATORS entry): build on its version of those files, not on the trunk's. Do not
merge `gen-io` or `cg-generators` into the trunk; that is a separate decision.

### What a "generator" is today (resolve in discovery, do not invent)

On the public branch `alfonso-frontend-jjtl` (tip 3addb64, 2026-10-27) there is no generator entity: each
metamodel stores one flat template list in `_state.genTemplates` (`codegen/engine/templateCodec.ts`, `{"v":1,"templates":[...]}`).
Several generators per metamodel is the planned 3.3 storage change (generators on the metamodel, one dock tab
per generator, GENERATORS section in the left bar), owned by the codegen front and not part of this lane.

Phase 1 must establish which storage the local trunk has. Then:

- **If the trunk still has one list per metamodel** (expected): one metamodel has at most one generator. Its
  name is the metamodel name (there is no stored generator name), its entry is `main`. On import:
  - target metamodel chosen by the user (in the dashboard: a select of the project's metamodels, preselected
    by the file's `metamodel` field when a metamodel of that name exists; in the Templates tab: that tab's
    metamodel);
  - if the target metamodel has no templates, the generator is written;
  - if it already has templates, a ConfirmDialog offers **Replace** or **Cancel**. "Import under a new name"
    is not offered, because a second generator cannot be stored on the same metamodel; the dialog says so in
    one line. Never merge template by template;
  - a file whose `entry` is not `main` is refused with a message naming the entry, since 3.2 storage has no
    entry field and the Code panel and preview look for `main`;
  - an array with two generators for the same target metamodel is refused as a whole, nothing written.
- **If the trunk already stores several generators per metamodel**: stop at the hard stop and report the
  storage shape; the collision rule becomes Replace / Import under a new name / Cancel, and the chat will
  answer with the adjusted Phase 2.

### Validation on import

Everything below runs before any write, on every generator of the file, and every problem is reported at
once, each with generator name and template name:

- `format` is `jjodel-generator` and `formatVersion` has major version 1 (a `1.x` minor is accepted);
- `entry` names a template of the generator;
- template names are unique in the generator;
- template names are valid template names under the engine's own rule: reuse the check in
  `codegen/engine/templates.ts` (not a JjEL identifier, or the name of a JjEL builtin) and add JjEL keywords
  (`not`, `and`, `or`, `implies`, and the rest of `JJEL_KEYWORDS` in `jjel/lexer`) if that check does not
  already cover them. One source of truth: do not hand-copy a keyword list;
- `params` is a list of strings, `body` is a string, `mode` is `expression` or `text`, `target` when present
  is a string (the same checks as `decodeTemplates`, reused, not duplicated);
- each body parses in its mode (`parseTemplateBody`); a parse error is reported with line and column;
- every template called from a body exists in the generator. Resolve calls statically by walking the parsed
  body for calls whose callee is a bare identifier that is neither a parameter, a JjEL builtin nor a template
  of the generator. Unresolved calls are **warnings**: listed, and the import still proceeds after the user
  confirms. Every other problem is an **error** and nothing is written.

Errors and warnings appear in one dialog, errors first. A file that is not JSON is one error.

### Write path

Import writes through the existing path only: `templatesPatch` and the metamodel's `state` setter, one
`SetFieldAction`, one undo step, exactly as «Save» in the Templates tab does. A replace is the same single
write. If the Templates tab of the target metamodel is open with unsaved drafts, import into it is refused
with "Save or discard the drafts in the Templates tab first"; an open tab with no drafts follows the store as
it already does.

## DOVE

Files expected to be touched (confirm in discovery, list any change to this list in the report):

- new `frontend/src/codegen/engine/generatorFile.ts`: pure. Types of the file format, `encodeGeneratorFile`,
  `decodeGeneratorFile` (single object or array), `validateGenerator` (errors and warnings), and the record
  conversion (explicit mode out, implicit expression in). Imports only from the engine and `jjel`.
- new `frontend/src/codegen/engine/__tests__/generatorFile.test.ts`.
- new `frontend/src/codegen/ui/generatorTransfer.ts`: download (Blob plus anchor, as the existing model
  export does) and upload (hidden file input, as `handleImportXmi` does in `ProjectEditor.tsx`), the
  collision dialog, the problems dialog, and the write through `templatesPatch`.
- `frontend/src/codegen/ui/TemplateEditorTab.tsx` (+ `.scss` if needed): Import and Export buttons in the tab
  header, next to «Save». Export exports the stored list, not the drafts; if drafts exist, the button's title
  says so.
- `frontend/src/components/project/ProjectEditor.tsx` (+ `project-editor.scss` if needed): a GENERATORS
  section after TRANSFORMATIONS, built with the existing `SectionHeader`. Rows: generator name, metamodel,
  template count, Export and Open (opens the Templates tab via `openTemplateEditor`). Header: Import, Export
  all (disabled with a title when there is nothing to export). Empty state like the other sections ("No
  generators yet").
- `frontend/src/pages/components/LeftBar.tsx`: only if the dashboard sections already have a sidebar entry
  each; then add GENERATORS the same way. If the 3.3 GENERATORS entry already exists, reuse it.
- `docs/claude-code-log.md`, this prompt's `Status` line.

Out of scope: `.ecore` export/import (stays as it is), any change to `_state.genTemplates` storage or its
`v`, multi-generator storage, `VersionFixer.tsx`, the Code panel, the oracle, the docs site.

Critical zone: none of the files above. If any change seems to need a critical-zone file
(`useJjomSync.ts`, `canvasToJjom.ts`, `jjomTransformers.ts`, `portDistribution.ts`, `handlePosition.ts`,
`DV.tsx`, `VersionFixer.tsx`), stop and ask.

## COME

### Phase 1: discovery (read-only), then hard stop

Read CLAUDE.md and the last entries of `docs/claude-code-log.md`. Then establish, with file and line:

1. the storage of templates on the trunk (one list per metamodel, or generators), per the section above;
2. where the entry template is chosen in the Code panel and in the preview (`main` convention or a field);
3. the name check in `templates.ts` and whether it covers JjEL keywords; where `JJEL_KEYWORDS` is exported;
4. how to walk a parsed body for call nodes (AST node type for calls, an existing walker such as the guard
   subset checker's, reusable or not);
5. the existing download and upload helpers in the codebase, to reuse rather than write a new one;
6. how `ProjectEditor` builds a section (`SectionHeader`, empty state, menus) and whether `LeftBar` links
   sections;
7. where the two acceptance generators are (nuXmv SMV, 10 templates; Verilog, 9 templates): branch, file or
   project. State whether they belong to the same metamodel. If they do and storage is one list per
   metamodel, acceptance as written cannot hold in one metamodel: report it.
8. a grep for every new identifier you plan to introduce (module names, exported functions, CSS classes such
   as `generators-section`), proving none is in use.

Save the report as `docs/discovery/discovery_2026-10-30_generator_import_export.md` (objective, files read with
full paths, findings, risks, open questions). The hard stop is not complete until the report is written and
committed (`git add` that file only).

Hard stop. End with `Outcome: hard-stop`.

### Phase 2: implementation (after GO)

Order of commits, each with its tests green:

1. `generatorFile.ts` and its tests (pure, no UI).
2. `generatorTransfer.ts` and the Templates tab buttons.
3. The GENERATORS dashboard section (and LeftBar entry if applicable).
4. Docs commit: log entry and `Status` flip.

Gates after each commit: `npx tsc --noEmit`, `npx vitest run src/codegen`, and `npm run build` at the end.

### Tests (in `generatorFile.test.ts` unless noted)

- Round trip on a generator of at least ten templates, including text-mode bodies with `${...}`
  interpolation, double and single quotes, backslashes (`\\`, `\n` inside string literals), and a multi-line
  `map(...).join("\n")`; one template with `target`. `decode(encode(g))` equals `g`, and
  `templatesPatch(raw, imported)` returns `null` against the original stored string (byte identity).
- Mode normalization: an expression record with no `mode` exports `"mode": "expression"` and imports with no
  `mode`; a text record keeps `mode: "text"`.
- Import errors, each reported with its template name and nothing written: missing entry, duplicate name,
  keyword as name (`not`, `implies`), builtin as name, unknown mode, body that does not parse, wrong
  `format`, `formatVersion` 2.0, non-JSON file. One file with several errors reports all of them.
- Unresolved call is a warning, not an error.
- Array import: two generators for two metamodels pass; two for the same metamodel fail as a whole.
- Write path (in `codegen/ui/__tests__`): import into an empty metamodel is one `SetFieldAction` and one undo
  step; replace is one write; import is refused while the open tab has drafts.
- Existing Templates tab and codegen tests stay green.

### Visual check (by the chat, built-in browser)

Templates tab: Import and Export visible in the header, aligned with «Save», no layout shift when drafts
appear. Dashboard: GENERATORS section consistent with TRANSFORMATIONS and VIEWPOINTS (header, count, empty
state, row actions). Import a file with two errors and one warning: one dialog lists all three.

## Acceptance

The nuXmv SMV generator (10 templates) and the Verilog generator (9 templates) of the test case, exported from
the project where they were entered by hand, are imported into a fresh project and produce output identical to
the hand-entered generators on the same model (byte comparison of the generated text). If the test-case files
are not found in discovery, Phase 2 still ships with the unit tests above and acceptance waits for Alfonso's
files.

## RIFERIMENTI

- `frontend/src/codegen/engine/templateCodec.ts` (storage, `decodeTemplates`, `templatesPatch`)
- `frontend/src/codegen/engine/templates.ts` (`TemplateRecord`, `modeOf`, `parseTemplateBody`, name checks)
- `frontend/src/codegen/ui/TemplateEditorTab.tsx`, `openTemplateEditor.ts`, `templateDrafts.ts`
- `frontend/src/components/project/ProjectEditor.tsx` (`SectionHeader`, MODELS import menu, `handleImportXmi`)
- R-GEN-3, R-GEN-12, R-GEN-25 in `docs/decisions.md`
- Codegen front decisions of 2026-10-23 (multi-generator storage planned for 3.3)

## Lane discipline

`git add <specific files>` only. Conventional commit messages in English, one line, suffix `(P-2026-10-30-1430)`.
Log entry in `docs/claude-code-log.md` at the end. Replace `Status: to execute` with date, lane, branch and sha
in the same docs-only commit as the log entry. Report closes with «Decisions taken (unattended)» and
«Decisions awaiting Alfonso», then `Outcome: done | hard-stop | question | blocked`.
