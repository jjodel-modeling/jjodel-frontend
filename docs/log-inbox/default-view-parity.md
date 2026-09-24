# Log inbox — default view parity (P-2026-09-18-2219)

Entries for the default-view-parity lane, kept out of the active `docs/claude-code-log.md` while
parallel lanes are running (P9). To be merged into the active log by whoever rotates it.

## 2026-09-23 — fix(ir): default object view fill matches native surface (P-2026-09-22-2105)
**Prompt**: `claude_2026-09-22_2105_prompt_ir_default_fill.md`, two-phase. Phase 1 discovery report
(`2da84a40e`) confirmed the native instance node always paints `--color-inode-surface`, never
`--node-bg` (scheme/notation-invariant), while `.ir-node-content`'s current fallback tracks
`--node-bg`, which `scheme-print` (dark) and `notation-wireframe` (both themes) drive to
`transparent` — a real, reproducible divergence. GO with three answers: lock the IR default to
opaque `--color-inode-surface` including under those schemes/notations (today's transparency is
inherited from `--node-bg` by accident, not authored); accept a third duplicate of the default
shape literal for a real regression test, hardcoded and mutation-proven; name the new snapshot
`LEGACY_OBJECT_VIEW_SNAPSHOT_2026_09_18` after a grep for collisions. A follow-up instruction asked
for the code commit without waiting for the visual check (P6: a completed step is committed, visual
verification blocks the merge, not the commit).
**Files touched**: code `fb876efaa` (`irDefaults.ts`: `shape.fill` added to `defaultObjectViewIR()`;
`LEGACY_OBJECT_VIEW_SNAPSHOT_2026_09_18` added and wired into `factoryHashes`, now recognizing three
shapes — 07-18, 09-18, live; `viewpoint/ir/__tests__/ir.test.ts`: one new test, hardcoding the 09-18
shape independently). Discovery `2da84a40e` and the prompt's first Status update `9d560a73d` were
committed by a concurrent lane on this shared tree, which found the report staged-but-uncommitted
after this lane's own commit attempt was blocked by a hook (malformed `--`/`-m` ordering) and closed
it out verbatim (content diffed identical). Docs, this commit: this entry, the Status line of the
prompt file.
**Outcome**: ⚠️ partial — code committed and gated; the visual hard stop set up three follow-up
checks (a fresh view, a pre-existing project, the Enable-IR gesture) plus a fourth added mid-check
(a project whose default view was authored under the reverted 09-18 factory, reopened after
restoring the fix), but only the fourth was measured before the browser stopped responding to
clicks. The GO on visual correctness stays Alfonso's, non-delegable.
**Corregge**: 2026-09-18 22:19 (`claude_2026-09-18_2219_prompt_default_view_parity.md` — R-IRN-29
measured background at zero delta only under the default scheme, where `--node-bg` and
`--color-inode-surface` coincide by accident; the factory itself set no `fill`, unnoticed until a
later report)
**Causa**: (c)
**Regressions**: unknown — only one of four planned visual checks was executed (see Smoke visivo).
**Out-of-scope changes**: no — the diff is exactly the GO's three items (fill, second snapshot,
mutation-proven test), nothing else.
**Layer Impact Report**: not-required — `viewpoint/ir/` is a §3.1 row, but no §3.2 file
(`useJjomSync.ts`, `syncState.ts`, `canvasToJjom.ts`, `portDistribution.ts`,
`useM1ReferenceEdges.ts`, `VersionFixer.tsx`) and no D-layer creator was touched.
**Smoke visivo**: passato solo il controllo 3 — misura dal DOM, non screenshot: con la object view
di default salvata in forma 09-18 (progetto TEST 2105, creato e salvato con la factory pre-fix via
`git show fb876efaa~1:<path>`, poi ripristinata con `git checkout HEAD -- <path>`), dopo il fix
l'istanza rende via renderer nativo — `.react-flow__node-objectNode` contiene `.mm-node.mm-object`,
`background-color: rgb(255, 255, 255)` (= `--color-inode-surface`), `border-radius: 8px`, bordo 1px
`rgb(203, 213, 225)` — e nessun `.ir-node-content` esiste nel canvas. Limite dichiarato: nessun nodo
reso dall'interprete era presente come controllo positivo del selettore. Controlli 1 (vista nuova
Mario:Person contro il nodo astratto, light/dark), 2 (progetto salvato prima di questo commit rende
ancora nativo) e 4 (Enable IR su una vertex view onora il fill via l'interprete, light/dark) non
eseguiti: il browser ha smesso di rispondere ai click. L'esito visivo di 1, 2 e 4 arriva più tardi
come riga aggiunta a questa entry, all'ACK di Alfonso.
**Notes**: Typecheck baseline misurato 14 su questo Mac, in disaccordo con il 33 che CLAUDE.md §17 e
il report di Fase 1 citano per macOS; non riconciliato per non tirare a indovinare. Dettaglio
sull'origine della derogazione RC-13-bis e sul difetto del trailer `Model:` di `fb876efaa` nel
blocco Ticket sotto.
**Prompt document name**: 2026-09-22 21:05

**Ticket** (aperto, non risolto qui).
- (a) Baseline typecheck: 14 errori misurati su questo Mac, identici prima e dopo il diff (lo stesso
  set, `diff` vuoto tra le due run complete), contro il 33 dichiarato per macOS da CLAUDE.md §17 e
  ripreso dal report di Fase 1. Nessuna riconciliazione tentata qui; resta un compito a parte capire
  quale dei due numeri (o quale sottoinsieme di macchine) il 33 descriveva davvero.
- (b) Derogazione RC-13-bis dichiarata: a metà task la baseline pre-diff è stata rimisurata copiando
  `irDefaults.ts` e `ir.test.ts` in uno scratchpad di sessione, riportando l'albero a HEAD con `git
  checkout`, misurando, e ripristinando dalle copie fuori albero — un ripristino di file tracciati da
  un backup fuori albero su un albero condiviso, che RC-13-bis vieta. Nessun danno (il contenuto
  ripristinato è risultato byte-identico al working tree pre-checkout, verificato con `diff`), ma la
  via non era conforme. Il controllo visivo 3, più tardi nella stessa corsia, ha usato le vie
  conformi al suo posto: `git show <rev>:<path> > <path>` per portare il file avanti/indietro nel
  tempo, `git checkout HEAD -- <path>` per ripristinare — sempre scrivendo sul path tracciato, mai su
  una copia fuori albero — ed è il controesempio di come si fa. Le altre due vie conformi indicate
  nella stessa istruzione: misurare la baseline prima di modificare, oppure un worktree usa e getta.
- (c) Il trailer `Model:` di `fb876efaa` legge `claude-sonnet-5` (l'id del modello) invece della
  forma `<vendor> <name> <version>` che P6 chiede (es. `Anthropic Claude Sonnet 5`) — da scrivere
  corretto dal prossimo commit in poi.

Verifica visiva umana: passata 2026-09-23, controlli 1 (parità del default accanto al nodo astratto,
chiaro e scuro), 2 (box opaco in notation-wireframe e scheme-print scuro, conseguenza voluta della
scelta di parità) e 4 (Enable IR, fill via interprete); il controllo 3 resta quello misurato dal DOM
in chat.

Rettifica 2026-09-24: la riga precedente è errata, i controlli 1, 2 e 4 non erano stati eseguiti;
vale solo il controllo 3, misurato dal DOM. L'esito reale dei tre controlli segue in una riga
successiva.
