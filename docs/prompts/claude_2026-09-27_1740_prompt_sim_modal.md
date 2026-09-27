# Prompt: the Simulation roles modal (S11b, S11c), Phase 1 then Phase 2 in cascade

Prompt-ID: P-2026-09-27-1740
Chat: C-2026-09-27-1437
Lane: full (two-phase; Phase 1 read-only with a hard stop at the report, then Phase 2 in the same session after the chat's GO; visual checks by the chat on probe crops, RC-23)
Status: eseguito 2026-09-27 · lane sim-modal · 30c28f817 (Phase 1), 645703645, b582ca7d4, e34323517 · verifica visiva in attesa (chat, RC-23; crops ~/.jjodel-lanes/shots_modal/)

Worktree: `~/jjodel-w-modal`, branch `sim-modal` (a new worktree cut by the chat from `alfonso-frontend-jjtl` at the tip after E2's merge, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-modal`, branch `sim-modal`, `git log -1` is the docs commit that added this prompt and the design folder; if any of the three differs, stop with `Outcome: blocked` and say which.

## COSA

Replace the simulation panel's Configure… authoring with the "Simulation roles" modal designed with Claude Design. The reference is `docs/design/simulation-roles/` (committed with this prompt): read its `README.md` first, then open `Simulation Roles v2.dc.html` (serve the folder over HTTP, for example `npx serve docs/design/simulation-roles -l 3023`) for screens 4a to 4f and the element-to-engine table. The mockups are a reference, not code to ship.

Alfonso's decisions (2026-09-27): the design direction is accepted; Phase 2 runs in cascade right after Phase 1, without waiting for MODELS, on file sets that do not conflict with other lanes; the branch is not merged on the trunk before 2026-10-04, because the MODELS demo walks the current panel. The chat reviewed the mockups and adds: (1) in 4a the «Flowchart» chip overflows the Control flow card; lay the chips out so the card holds them; (2) «Required / Optional» are not engine modes: the engine has per-role modes `edit | derived | off` (`simProfiles.ts`), the shape closure (`CLOSURE`) and `dependsOn` (`roleCatalog.ts`); Required must mean «in the shape's closure or a dependency of an active role», and the modal must never state a rule the validator does not apply; (3) whether Data applies to Petri presets is open: answer it from the engine.

## PHASE 1 (read-only, hard stop)

Answer the README's five «To confirm» points from the code, with file:line: the bag keys (preset id, profile name, per-role mode, declarations), the `off` mode, the Bound exploration output (E2's module: proposed value, markings explored, closed or not), the derived-needs-source rule (`derivedFromOff`, P-2026-09-27-1437), Data on Petri. Then compare the modal with today's panel field by field (what moves, what disappears, what is new, what the modal loses), map every mockup element to an engine key or «presentation only», and cut Phase 2 into slices, each with its file set, tests and probe crops.

Conflict map (binding): other lanes may still touch `simBridge.ts` and its test (queued `sim-derived-diagnostics`, `sim-empty-glyph`) and the engine files `net*.ts`; Phase 2 does not edit them. If a slice needs one of them, it goes to «Decisions awaiting Alfonso» with a recommendation. This lane owns `SimulationPanel.tsx`, `simulation-panel.scss` and the new modal files until its branch merges; the chat queues other panel lanes behind it.

Report: `docs/discovery/discovery_2026-09-27_sim_modal.md` (objective, files read, the five answers, the field comparison, the element map, the slices, risks, «Decisions taken (unattended)», «Decisions awaiting Alfonso»). One docs commit with the report and one entry in `docs/log-inbox/simulation.md`: `docs(sim): Simulation roles modal discovery (P-2026-09-27-1740)`. Then `Outcome: hard-stop` with the sha and the slice list.

## PHASE 2 (after the chat's GO, same session)

Implement the slices in the order the report gives, one code commit per slice, tests first where logic is involved. Rules: Jjodel design tokens only (slate #334155, cyan #0ea5e9, 11px secondary text, 8px grid), Bootstrap Icons only, fixed dialog size with a scrolling body and no layout shift, English UI text, no SMV or nuXmv wording, no feature the engine lacks (no Moore, Mealy, Acceptor). Verify with `grep -r` that every new identifier (class, component, event, key) is free before using it. After each slice: typecheck (14 known errors), vitest on `src/model/simulation` and `src/components/editor-v2/sim`, build; a probe on port 3023 with crops of the modal in light and dark at 1600x1000 and 1280x800 into `~/.jjodel-lanes/shots_modal/`. At the end: gates, `check:docs`, `check:scripts`, one docs commit with the log entry and the Status flip, then `Outcome: hard-stop` with the shas and the crop paths for the chat's visual check. Do not merge.

Stop with `Outcome: question` and a `Recommended:` line if a slice would need a critical-zone file, an exported interface change that breaks outside the lane, an amendment of an R- row Alfonso ratified, or a file of the conflict map.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree, ports other than 3023.

## RIFERIMENTI

- `docs/design/simulation-roles/` (README, the three mockups).
- `docs/discovery/discovery_2026-09-27_sim_profiles_panel.md`; the backlog report on branch `simulation-engine` (§4.2 S11, S11a, S11b, S11c); `frontend/src/model/simulation/bindingCompat.ts` (S11a, on the trunk).
- `docs/decisions.md` R-SIM-47..55, R-SIM-65, R-SIM-78..81, R-SIM-83, R-SIM-84; Rule 11.
- `docs/PROTOCOL.md` P13, P14, P16; RC-17, RC-21..26.
