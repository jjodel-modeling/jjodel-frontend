# Prompt: the morning ratifications: Guard on in the Petri preset (A3), R-SIM-54 and R-SIM-73 amended, the digest's manual section

Prompt-ID: P-2026-09-27-0935
Chat: C-2026-09-26-1702
Lane: fast (one pure module and its tests; two amendments in the register and the digest's hand-written section, both ratified by Alfonso this morning; no panel change, no critical zone; no visual check)
Status: eseguito 2026-09-27 · lane fast · 7455d0075

Worktree: `~/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, `git log -1` is the commit that adds this file (its parent `cf58f1d98`, or a later docs-only commit: say so and continue), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-27-0935 · session <id>]` and ends with a bare `Outcome:` line (shas on the line above it). Run gates in the foreground.

## COSA

Alfonso answered the night digest (chat, 2026-09-27 morning): point 1 ratified (the visual GOs of C1, enum A, C2, M3 and the four merges, checked by him on 3001: PEST SM × State machine, Cmd+Z back to «Custom · Not checkable», the declarations table with stored | derived); 2, 4, 8 accepted as recommended; **3: amend R-SIM-54 so that Guard is `edit` in the Petri preset**, so b2net and the C1 net stop showing «Set but off: Guard.»; **7: align the text of R-SIM-73 to the implementation** (a derived value out of domain at Reset keeps its value and shows the defect). This lane does the three things: the one-line code change with its tests, the two amendments in the register (an exception, declared here and ratified by Alfonso, to the rule that a lane never edits inside a decision block: the amendment is appended inside the block as an `**Emendata …**` sentence, the original text untouched), and the hand-written section of `docs/digest/2026-09-27.md`.

## DOVE

Code commit:

- `frontend/src/model/simulation/simProfiles.ts`: `SYSTEM_ROWS`, the `petri` row, `active` gains `'guard'` (after `'terminal'`). Nothing else: `systemProfileOf` then gives Guard `{ mode: 'edit' }` for Petri through the existing `on` set.
- `frontend/src/model/simulation/__tests__/simProfiles.test.ts`: the `petri` row of the expectation table gains `'guard'`; add one assertion `sys('petri').modes.guard` equals `{ mode: 'edit' }`.
- `frontend/src/components/editor-v2/sim/__tests__/simRoleStatus.test.ts`: the b2net × Petri case (around lines 291-293): `setButOff` becomes `[]` and the text no longer carries «Set but off: Guard.»; Guard is now `kept` (it was set in the bag) or `bound`, read the fixture and assert the truth. If `profileBinder.test.ts` asserts the set-but-off Guard for b2net, update that assertion too, nothing else.

Docs commit:

- `docs/decisions.md`: inside the R-SIM-54 block, after its last sentence and before the next row, one sentence: `**Emendata il 2026-09-27** (ratifica di Alfonso in chat, C-2026-09-26-1702, punto A3 del digest della notte): nel profilo Petri net (P/T) il ruolo Guard è \`edit\`, non \`off\`, così una rete con una guardia sulla transizione (b2net, la rete della corsia C1) è checkable senza «Set but off: Guard.»; codice \`<code sha>\`.` Inside the R-SIM-73 block, same position: `**Emendata il 2026-09-27** (ratifica di Alfonso in chat, punto 7 del digest): al Reset un derivato fuori dominio o fallito tiene il valore calcolato quando ne ha uno e mostra il difetto di dichiarazione (decisione 5 del report, implementazione \`5060657c5\`); «valore assente» sopra vale solo per un'equazione che non produce un \`SimValue\`.` Both in the register's Italian, no em dashes. No other line of either block changes; no header field changes (the rows stay `provisional`: Alfonso's ratification of the digest is recorded in the digest, RC-26).
- `docs/digest/2026-09-27.md`: replace the stub after `<!-- digest:manual -->` with `## For Alfonso` followed by three short paragraphs in English: **Ratified 2026-09-27 (morning, in chat):** the visual GOs given by the chat unattended during the night (C1 merge `24d8537fd`, enum step A `1b40eacd0`, C2 `fe4e3030b`, M3 `db3e68cde`), checked by Alfonso on 3001 (PEST SM × State machine, one Cmd+Z back to «Custom · Not checkable», the declarations table with stored | derived); points 2, 4, 8 of the digest accepted as recommended (M3 for the demo with four presets, Initial/Final as classes, the in-lane decisions listed in the M3 closure). **Amended:** R-SIM-54 (Guard `edit` in the Petri preset, this lane) and R-SIM-73 (wording aligned to the implementation). **Deviations recorded:** RC-23 first period, every visual GO of the night given by the chat with the session's probe re-run on the chat's own server; ratified above. Then run `npm run docs:digest -- --date 2026-09-27 --write` and confirm the generated part is regenerated and the manual section preserved (`git diff` shows only the manual section and, if any, the header sha).
- `docs/log-inbox/simulation.md`: one entry (fix, the Guard mode; the two amendments named).
- This prompt's Status flip.

Out of scope: `roleCatalog.ts`, `profileBinder.ts`, `SimulationPanel.tsx`, every other row of the register, the digest generator.

## COME

1. Baseline from `frontend/`: `npx vitest run src/model/simulation src/components/editor-v2/sim` count and 0 failed; `typecheck` 14 (§17 set); `check:docs` 4/4.
2. Red first: the new assertion on `sys('petri').modes.guard` fails; then the one-line change; then the two test updates; the suite green with the same count plus one.
3. Gates: typecheck 14; the vitest run of step 1 green; `build` exit 0 (a `src/` file changed); `check:docs` 4/4; `check:scripts` PASS.
4. Code commit, pathspec after `--`, subject `fix(sim): Guard is edit in the Petri preset, R-SIM-54 amended (P-2026-09-27-0935)`; if over 72 once the Prompt-ID is dropped, `fix(sim): Guard on in the Petri preset (P-2026-09-27-0935)`. Body: A3, the ratification, the tests changed, `Model:` trailer.
5. Docs commit as DOVE, pathspec after `--`, `check:docs` 4/4 before it, subject `docs: R-SIM-54 and R-SIM-73 amended, digest manual section (P-2026-09-27-0935)`. Status flip `eseguito 2026-09-27 · lane fast · <code sha>`.
6. `Outcome: done`, both shas on the line above.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, any edit to a decision block other than the two appended sentences, a panel file, push, any other tree.

## RIFERIMENTI

- `docs/decisions.md` R-SIM-54, R-SIM-73, R-SIM-77..79, RC-25, RC-26; `docs/discovery/discovery_2026-09-27_sim_profiles_panel.md` §8 (A3); `docs/discovery/discovery_2026-09-27_sim_derived_attributes.md` §10 decision 5.
- `docs/digest/README.md` (the manual section rule); `docs/log-inbox/simulation.md` (entry shape).
