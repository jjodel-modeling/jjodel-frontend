# Class fixes continuation: S2-L28 (undo of a class-to-class generalization), probes, docs

Prompt-ID: P-2026-11-08-2214
Chat: C-2026-10-25-2159
Front: instance-of
Lane: full (continuation of P-2026-11-08-2146 after its context ceiling; outside the critical zone)
Status: eseguito 2026-11-08 · lane full · 4ee0983ac
Request: https://claude.ai/code/session_01Qd8VK8yfvc2VwsVGG8qQ1S (Alfonso, 2026-11-08 12:25 finding 2; the chat's fix lane of lane 2's defects)
Depends: P-2026-11-08-2146
Corregge: P-2026-11-08-1753
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-rail`, branch `oi-rail`, its tip this prompt's `docs:` commit, whose parent is `a5f657409`.
**Expected state**: two modified files, `frontend/scripts/probe/onto-s2-instantiate.ts` and
`frontend/scripts/probe/onto-s4-links.ts` (lane 2146's uncommitted probe work); anything else uncommitted means stop
with `Outcome: blocked`. Model and tier: heavy, effort `xhigh`. Alfonso's dev server runs from this worktree on port
3005: do not stop it; probe ports outside 3000, 3001, 3005, 3015; probe assets never under `docs/`.

## Lane discipline

Every reply opens with `[P-2026-11-08-2214 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 70 minutes.

- Context economy: windows of at most 40 lines; never a whole file, diff or probe log. Commit each finished step at once.
- `uptime` in a separate call before each probe; start only with the 1-minute load under 20; one probe run per call.
- Product change only for S2-L28 and only if the cause is in lane 2146's files or the class-level drag branch, under 20
  lines; anything in `reducer.ts`, a §3.1/§3.2 file or an exported interface: `Outcome: question` with the evidence.
- No push, no merge.

## Source

`~/.jjodel-lanes/P-2026-11-08-2146/handoff.md` and `handoff.diff`; the 2146 prompt
`docs/prompts/claude_2026-11-08_2146_prompt_onto_class_fixes.md` steps 2 and 3. Naming kept as `property<N>` (R-OI-22).

## COSA

1. **S2-L28**: one Cmd+Z after the class-to-class drag leaves the Generalization (112 objects, 111 expected). The probe
   clicks the edge before undoing. Separate the two causes with a control: (a) undo without clicking the edge; (b) the
   same drag on the trunk's behaviour (a viewpoint at level `both` or the base before `a5f657409`, `git stash` is not
   allowed: use a throwaway worktree or a level switch). If the edge click writes an undo entry (a selection write, like
   the overlay case R-OI earlier), the probe's undo must not click first and the edge-click write is a ticket; if the
   generalization write takes two entries, fix it under the limits above. Report the measures either way.
2. Probes, one run each: the S2 suite with the level block (all green, or S2-L28 explained), `onto-s4-links.ts`
   including the handle-reach measure (how far from a target handle a drop still connects; `connectionRadius={40}` at
   `EditorV2.tsx:5284`), `onto-binding-editor.ts`. Read the three crops of 2146's step 2 (class with its new attribute,
   the generalization edge, its properties panel), to `~/.jjodel-lanes/P-2026-11-08-2214/crops/`. `chore(probe)` commit.
3. Docs commit: one entry in `docs/log-inbox/instance-of.md` for 2146 and this lane (root causes, fixes, S2-L28, handle
   reach); the R-OI-22 amendment line for the generalization owner; flip `Status:` of both prompts. `check:docs` green.

## HARD STOP

After the docs commit with `Outcome: done` and a clean tree. Earlier as stated.

## RIFERIMENTI

`~/.jjodel-lanes/P-2026-11-08-2146/handoff.md`; `docs/decisions.md` R-OI-14, R-OI-22; the overlay click fix entry
(`72ad1753d`) in `docs/log-inbox/instance-of.md`.
