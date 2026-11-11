# Containment panel: expose `containment.layout.frame` (hull / self) as a «Frame» control

Prompt-ID: P-2026-11-11-1110
Chat: C-2026-11-11-1056
Front: graphvertex
Lane: full (discovery with hard stop, then Phase 2 after GO; outside the critical zone: `viewpoint/authoring/` only)
Status: da eseguire
Request: https://claude.ai/code/session_01DQt9R5SCzZiKCPw8vWw73h

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-gvframe`, branch `gv-frame-control`, HEAD at the commit that adds this prompt. Before anything
else: `pwd` is that worktree, `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`. Otherwise stop
with `Outcome: blocked`. Model and tier as pinned, effort `xhigh`.

## Lane discipline

Every reply, including interim ones, opens with `[P-2026-11-11-1110 · session <id>]`; final message ends with
`Outcome: done | hard-stop | question | blocked`; one `Recommended:` line per question. Gates through
`node scripts/run-quiet.mjs`, in the foreground. Read only the files you change and the lines a step names. The closing
log entry goes to `docs/log-inbox/graphvertex.md` (skill `log-entry`), the discovery report through the skill
`discovery-report`.


Rules for this lane: no subagents and no background tasks; one probe run per call; `git add <specific files>` only, never `git add .`; commit as soon as gates are green; all code, comments, UI strings, commit messages and docs in English. Read `CLAUDE.md` first.

## COSA (what)

R-GV-15 gave `containment.layout` the field `frame: 'hull' | 'self'` (free layout only, absent = `hull`). The engine supports it, but the Structure tab of a graphVertex view offers no control for it, and the Source tab is read-only. As a result, a view such as «View for Page» can only render the hull: a dashed frame around the owner node and its children, with the owner node drawn a second time inside the frame. Users cannot make the owner node itself the container.

Goal: add a «Frame» control to the Containment section of the Structure tab so the user can pick `self`.

## DOVE (where)

Already checked by the project chat (2026-11-11, read-only): the engine honours `frame: 'self'` end to end (`irCompile.ts:447`, `irContainment.ts:643` and `:726`, `IRContainmentHulls.tsx:42`, `elkContainers.ts:202`, tests in `ir.test.ts:2599-2603` and `irValidate.test.ts:705-710`); `ContainmentSection.tsx` has no `frame` control. The discovery confirms and completes this. Expected touch points:
- the Containment section of the Structure tab (the component that renders «Layout», «Channel edges», «Header band», «Padding», «Membership», «Collapsible»; grep for those strings);
- the writer used by that section for `containment.layout.*` (the same path that writes `mode`, `header`, `padding`);
- only if needed: the IR type of `containment.layout` and `validateIR`.

Out of scope: the renderer and anything under the critical zone (`useJjomSync.ts`, `portDistribution.ts`). If the discovery shows the renderer does not honour `frame: 'self'`, stop: that is a different lane.

## Fase 1: discovery (read-only, hard stop)

Save the report as `docs/discovery/discovery_2026-11-11_containment_frame_control.md` (add `_2` if the name exists). The hard stop is not complete until the report is written and committed (`git add` of that file only).

The report must answer:
1. File and component of the Containment section; how `mode`, `header`, `padding` are read and written (writer function, undo grouping).
2. Whether `frame` is already in the IR type and in the spec addendum §11, and where the renderer reads it (file:line). Positive control: show the read site of `header` or `padding` found by the same search.
3. How the partitions-only field `separator` is handled in the panel (shown only in Partitions? removed when switching mode?). The new control mirrors that pattern.
4. What happens today to an existing `frame` key when the user switches Layout from Free to Partitions.
5. Whether `validateIR` or the authoring seed mention `frame`.
6. Exact list of files Phase 2 will touch.
7. Open questions for Alfonso, if any.

Then stop and wait for a GO quoting this Prompt-ID.

## Fase 2: implementation (only after GO)

COME (how):
- In the Containment section, add a row «Frame», placed right after «Layout», visible only when Layout = Free. Segmented control in the style of the «Layout» and «Channel edges» rows, two options:
  - «Around children»: maps to `hull`; selecting it removes the `frame` key (absent = `hull`), so no new key appears in existing views.
  - «This node»: writes `frame: 'self'`.
- Hint text under the row, one line per state:
  - hull: «A frame is drawn around this node and its children.»
  - self: «This node is the container: its children are drawn inside its box. Padding is the margin to the border.»
- Switching Layout to Partitions removes `frame` in the same undo entry: `validateIR` rejects it there ('containment.layout.frame applies to free only', `irValidate.test.ts:709`). Report in finding 3 how `separator` is handled in the opposite direction; change `separator` handling only if Alfonso says so.
- One gesture equals one undo entry, through the same writer as the neighbouring rows.
- No change to the seed, no VersionFixer bump: the field is optional and absent keeps today's rendering.
- Verify every new identifier (CSS class, function, constant) with a global grep before introducing it.

Gates: typecheck with no new errors over the baseline, `npm run build`, existing containment probes or tests green. Add a unit test or extend the existing panel test: toggling «This node» writes `frame: 'self'`, toggling back removes the key.

Visual check (Alfonso, http://localhost:3001/, hard refresh): in the Page viewpoint, «View for Page» → Structure → Frame = «This node», Header band = Top, Padding = 16, and in Text the name label «In the header band». Expected: one box for Page_0, title in the top band, Content_0 and Content_1 inside it, no dashed frame and no second Page_0 node.

Closing: entry in `docs/log-inbox/graphvertex.md` (type `feat`), commit `feat: expose containment frame (hull/self) in the Structure tab`, report the commit hash.
