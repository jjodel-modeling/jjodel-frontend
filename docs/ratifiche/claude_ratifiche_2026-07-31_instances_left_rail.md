# Ratifiche 2026-07-31 — Fase INSTANCES / rail sinistro

Analisi in chat sul report `docs/discovery/discovery_2026-07-31_instances_left_rail.md` (HEAD `07cee5219`). Decisioni prese da Alfonso, tutte sulla raccomandazione proposta.

## Contesto dell'analisi

Il report ha cambiato il taglio della fase su tre punti. Primo: il rail (`LeftBar.tsx`) è FUORI da rc-dock, fratello del dock nella grid del Dashboard; la fase può non toccare mai il dockbox, quindi il rischio R2 (regressione `:last-child` di F2-fix) si evita per costruzione. Secondo: il rail è funzionalmente mezzo morto (scrittura `?section=` senza lettori vivi: tre «+ New» su quattro e i click sugli item Transform non fanno nulla; Share senza listener; niente delete/rename; componenti e SCSS morti): la fase è prima ricostruzione del contratto, poi skin. Terzo: R1 confermato a codice verbatim (`key={''+advanced}` su PinnableDock, `ret.advanced = state.advanced`); il 12/12 della verifica notturna NON lo smentisce, perché la card destra vive nell'overlay e legge Redux, e il gate `activeEditorType` è sticky: i punti della checklist potevano essere verdi anche con la tab editor che si chiudeva in silenzio.

## Decisioni

1. **Semantica INSTANCES**: il rail resta a livello artefatti (metamodelli, modelli M1, trasformazioni, viewpoint). Gli oggetti M1 (DObject) restano nel Tree View destro e nel canvas. Niente doppio albero da sincronizzare.
2. **Contratto azioni**: item aprono via DockManager (`open2` / `openTransformation` / `openViewpoint`); i «+ New» diventano CustomEvent del registry gestiti da ProjectEditor (pattern vivo di `OPEN_MEGAMODEL`, con attivazione della tab summary e scroll dove serve); le scritture `?section=` si ritirano; la voce Share si rimuove finché il modal non esiste.
3. **Rail dentro gli editor**: resta nascosto (status quo `isEditorTab`). Un overlay sinistro on-demand resta possibile come passo successivo, senza toccare il dockbox.
4. **R1**: fix in C0 (key stabile; la key era il vestigio del gruppo `editors` morto, oggi nessun contenuto montato dal dock consuma `advanced`). CONFERMATO A RUNTIME da Alfonso il 2026-07-31: con una tab M1 aperta, il toggle Basic↔Advanced chiude la tab e mostra la dashboard di progetto (dock rimontato da `defaultLayout`, sola tab `project_summary`). Bug pre-esistente a B5; B5 ha reso il trigger sempre visibile. Verifica post-C0: il toggle non deve più chiudere le tab.
5. **Bonifica e token**: bonifica sì, commit `chore` dedicato (C1) con lista esplicita; da preservare `.psb-item.active` e `.item-count`. Passaggio ai token di `.leftbar--project` in C3 (comparirà il dark mode: passata dark dedicata). Skin in C4 col metodo replica HTML.

## Piano della fase

- **Serie A** (prompt `2026-07-31_prompt_instances_serieA_C0_C1_C2.md`, in KB): C0 `fix(dock)` key stabile; C1 `chore(leftbar)` bonifica; C2 `feat(leftbar)` contratto vivo. Hard stop dopo ogni commit.
- **C3** struttura + token, **C4** skin: attendono il mockup del rail / vista INSTANCES. Metodo consolidato: replica HTML approvata, poi one-shot a valori letterali.

## Backlog aggiornato (dal report §7 e §2)

- Dashboard.ProjectCatalog: due bottoni «Duplicate» con handler vuoto (`Dashboard.tsx:437`, `:458`).
- `getInitialPanelWidth` `@deprecated` importato da `Navbar.tsx:51` e mai chiamato; orfani `layoutMode` nel Navbar (`:896–916`) confermati senza JSX.
- `DockManager.openViewpoint` può aprire il primo metamodello e nascondere il rail come effetto collaterale (`:227–231`).
- File morti in zona dock: `abstract/DockLayout.tsx` (288/289 righe commentate), `abstract/tabs/PersistanceTab.tsx`, `abstract/tabs/TestTab.tsx` (zero import).
- Gap Tree View noto: `.tree-row__content--selected` senza regola CSS (nessuna pill di selezione sulle istanze M1).
- Persistenza layout rc-dock (`PinnableDock.load/save`) esiste e non è mai invocata: dopo C0 un reload continua a ripartire dal solo summary (comportamento attuale, non regressione).

## Nota di metodo

La verifica visiva resta su `localhost:3000` con hard refresh. Le due lezioni della notte precedente restano valide, con la correzione già registrata: `button[role="checkbox"]` esiste eccome (`ui/Checkbox.tsx:57`, tab IR); il report B4-fix nel claude-code-log porta la rettifica.
