# Canvas v2-flow, C2d: a reference to a nameless target is labelled `: <Class>`

Prompt-ID: P-2026-11-05-0148
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (canvas v2-flow default view, a reader of the L name)
Depends: P-2026-11-04-2321 (core nameless merged), C2 discovery report §3.3 (on the trunk at 04ada9f61)
Worktree: ~/jjodel-w-textc2d, branch v2flow-nameless-ref-label, from 04ada9f61 (own node_modules from npm ci)
Request: none (unattended run; R-TXT-47 D5; Alfonso's GO on the crops is needed before any merge)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of 04ada9f61 and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md §3.1 critical-zone file (in particular not useJjomSync.ts, portDistribution.ts, anything under viewpoint/ir/), no D-layer write path, no new dependency. Every reply opens with [P-2026-11-05-0148 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call. Read docs/discovery/discovery_2026-11-05_textual_c2_syntax_form.md §3.3 and §5 (R4) once, then code. Each item: test red first, its own commit (RC-51).

## COSA

(1) **Confirm R4 first**: useJjomSync.ts and portDistribution.ts (read only) do not read the `features` rows of an object node nor `refTargets[].name` for edges or handles; file:line evidence in the commit body of (2). If one does, stop with Outcome: question.

(2) **The label**: in frontend/src/components/editor-v2/utils/jjomTransformers.ts, next to :369, keep `name: ''` in `refTargets` (namelessRefTarget.test.ts:80 pins it; `rememberRefTargetName` must not remember a label) and add an optional `label` to the target type (types.ts:246, optional property only) set to `: <metaclass name>` for a resolved target with an empty name; `names` takes the label, so the row is a pill row, not a dash. `nodes/RowValue.tsx` paints `t.label ?? t.name` (:322, :331, :335). A deleted nameless target keeps the broken path (:391), unchanged. Tests in utils/__tests__/namelessRefTarget.test.ts, red first; one mutation per new branch.

(3) **Gates**, one tool call each, from frontend/: npm run typecheck; full npx vitest run (3 files red at import are the baseline; a harness test that times out under load is rerun alone); npm run build; npm run check:docs.

(4) **In the app**, on a free port, with the port corpus of the codegen tests (copy the probe of ~/.jjodel-lanes/P-2026-11-04-2255/, it suppresses the banner and the What's new 3.1 modal with jjodel_welcome_3_1_1_seen): the v2-flow canvas of a module whose inputs are three nameless Ports and an output `result` whose `peer` points at a nameless Port: the `inputs` row shows three `: Port` chips, `peer` one chip, nothing struck as broken; a named target still shows its name; deleting a nameless target still shows the broken path. Crops in ~/.jjodel-lanes/P-2026-11-05-0148/, light theme, scale 1. Stop the server.

(5) **Docs**: log entry in docs/log-inbox/codegen.md (Notes under 500 characters; Corregge `2026-11-04 22:55`; Causa (c)), the Status flip of this prompt, left uncommitted (RC-17). No push, no merge. Public repo: name no partner company. Final message: what was verified and how, Decisions taken (unattended), Decisions awaiting Alfonso, then the Outcome.

## DOVE

frontend/src/components/editor-v2/utils/jjomTransformers.ts, frontend/src/components/editor-v2/types.ts (the target type, optional property), frontend/src/components/editor-v2/nodes/RowValue.tsx, frontend/src/components/editor-v2/utils/__tests__/namelessRefTarget.test.ts. Nothing else.

## RIFERIMENTI

docs/discovery/discovery_2026-11-05_textual_c2_syntax_form.md §3.3, §5; docs/decisions.md R-TXT-45, R-TXT-46 (D4), R-TXT-47 (D5); CLAUDE.md §3.1.
