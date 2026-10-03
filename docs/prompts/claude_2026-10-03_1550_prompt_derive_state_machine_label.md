# Prompt: fast fix, the Statechart notation is labelled «State machine (UML statechart)»

Prompt-ID: P-2026-10-03-1550
Chat: C-2026-10-02-2340
Lane: fast (one visible string and its test pins; no IR, no id). Tier: light.
Status: eseguito 2026-10-03 · lane derive-sm-label · 8deddcf0d · verifica visiva passata 2026-10-03

Worktree: `~/jjodel-w-smlabel`, branch `derive-sm-label`, cut by the chat from `alfonso-frontend-jjtl` at `ddf22bd2f`, `frontend/node_modules` symlinked as P14 allows; a fresh session started by `lane-run`. Before anything else: `pwd`, branch and `git log -1` (the docs commit that added this prompt); if any differs, stop with `Outcome: blocked`.

## COSA

Alfonso, 2026-10-03, looking at the «Derive viewpoint» dialog on DemoESM: «tra le sintassi predefinite non c'è state machine, perché?». Since P-2026-10-03-1300 (`c5e879925`) the `stateMachine` notation is hidden and draws as its twin `statechart`, labelled «Statechart (UML)». The simulator names its profiles «State machine» and «Extended state machine», so a user coming from the simulation panel looks for «State machine» and does not find it. Alfonso, same day: «si vai veloce» on the chat's proposal.

1. The visible label of the `statechart` notation becomes `State machine (UML statechart)`. Only the label: the id `statechart`, the hidden `stateMachine` entry, `HIDDEN_TWIN`, the preselection, every persisted name and `ir.generated.notation` stay as they are (R-B9).
2. Wherever the label is shown or derived from (the dialog's select, a derived viewpoint's default name if it is built from the label, a tooltip), it follows the new string. Grep `label` uses of `DERIVED_NOTATIONS` to find them; a viewpoint already saved keeps the name it was saved with.
3. Code comments that name the notation «Statechart (UML)» stay untouched.

## DOVE

Exactly: `frontend/src/components/editor-v2/viewpoint/derive/notations.ts` (line about 94), the pins `frontend/src/components/editor-v2/viewpoint/derive/__tests__/notations.test.ts` (about line 189) and `frontend/src/components/editor-v2/sim/__tests__/DeriveViewpointDialog.test.ts` (about line 66), and any file that builds a visible string from the label (report it). Plus the closure docs: this prompt's Status and `docs/log-inbox/views.md`.

## COME

1. Read `CLAUDE.md`, P16, RC-17, R-VP-21, R-VP-22 and the amendment of P-2026-10-03-1300, and `notations.ts` whole.
2. Gates in the foreground: `npm run typecheck` (no new errors over §17's baseline), the derive and DeriveViewpointDialog suites, `npm run build`.
3. Lane probe at 1600×1000, light theme (`lane-run probe`, port 3074, never 3001; kit `~/.jjodel-lanes/probe-kit/`, scenes `~/jjodel-demo-exports/`, never written): open «Derive viewpoint» on DemoESM and on DemoPEST, read the select's options from the DOM, check the new label, the preselection on DemoPEST, and that no option reads «State machine» twice. One crop of the open select as gitignored `docs/discovery/harness/_tmp_smlabel_select.png`.
4. Commits: code, then the closure docs commit. Stop with `Outcome: hard-stop`, the shas, the option list read from the DOM and the crop path. Never end a turn waiting on a background task.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a file outside DOVE, a critical-zone file.

## RIFERIMENTI

R-VP-21, R-VP-22 (the notations of the dialog), P-2026-10-03-1300 (State machine hidden behind Statechart), R-SIM-47..55 (profile names).
