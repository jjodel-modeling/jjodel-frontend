# Fase 2 · F5 — Ritiro del width-lock residuo e finalizzazione del gating del cluster

**Tipo:** cleanup scoped (prevalentemente rimozioni). Commit unico.
**Data prompt:** 2026-07-29 (v2: aggiunta Parte D, verifica pointer-events)
**Repo:** `jjodel-frontend` · branch `alfonso-frontend-jjtl`
**Effort consigliato:** xhigh
**Precondizione:** F1, F2, F2-fix, F3, F3-fix committati e verificati a vista. Overlay floating funzionante, canvas full-width, inset attivi.

> Ultimo commit della fase floating. Rimuove la macchineria del width-lock rimasta senza bersaglio e disaccoppia il gating della pill di riapertura dai concetti del dock. È un commit fatto quasi solo di cancellazioni: il rischio non è che qualcosa non compili, è che una regola creduta morta stia ancora reggendo qualcosa. Da qui la §1.

---

## 0. Vincoli di ingaggio

- Leggi `CLAUDE.md` (fonte di verità). Contraddizioni: **segnala e fermati**.
- **Critical-zone:** nessun file coinvolto. Non toccare `EditorV2.tsx`, `useJjomSync.ts`, `portDistribution.ts`, `sync/*`.
- **`git add` scoped** per path espliciti. **MAI `git add .`**. Nel working tree può esserci un WIP TextStyle concorrente: non deve entrare nel commit.
- Zero refactoring opportunistico: si rimuove **solo** ciò che la §1 dimostra morto. Nessuna riscrittura, nessun rename.
- Non toccare comportamento, dimensioni o disposizione dell'overlay: sono assestati e verificati. **Unica eccezione ammessa: la Parte D**, due dichiarazioni CSS al massimo, solo se la verifica ne dimostra l'assenza.

## 1. Regola di ingaggio delle rimozioni (non negoziabile)

Il F2-fix ha mostrato il costo di una regola CSS creduta inerte che trova un bersaglio nuovo. Quindi, **per ogni blocco che intendi rimuovere**:

1. **Prova di morte del writer**: `grep -r` sull'attributo, sulla variabile CSS o sulla classe. Nessuno scrittore residuo nel codice.
2. **Prova di non collateralità**: il blocco non regola **anche** elementi ancora vivi (first-child, divider, toggle, altri layout). Se li regola, **non rimuoverlo**: togli solo la parte morta, lasciando intatto il resto.
3. **Elenca nella risposta**, blocco per blocco, con numeri di riga: rimosso, ridotto, oppure lasciato e perché.

Se una prova non riesce, **quel blocco resta** e lo segnali. Meglio un residuo documentato che una regressione invisibile.

**Attenzione specifica, già nota**: `.collapsed-panel-toggle` **non è morto**. L'elemento continua a essere reso; il suo blocco SCSS va lasciato. Ciò che muore è la costante `COLLAPSED_PANEL_TOGGLE_WIDTH`, se e solo se il suo unico lettore era l'effect del width-lock.

## 2. PARTE A — Width-lock: writer e consumer insieme

Il ritiro va fatto **in un colpo solo**, writer e reader: rimuovere prima i reader lascerebbe scritture inutili, rimuovere prima i writer lascerebbe regole in attesa di un attributo che non arriva.

**Writer (JS), in `PropertiesWithTreeView.tsx`:**
- L'effect del width-lock (storicamente `:257-280`) che scrive su `document.body` `--properties-tree-tab-width`, `data-properties-tree-width-lock`, `data-properties-tree-both-collapsed`. È gated su `mode === 'tab'` e **non esiste più alcun call-site con `mode='tab'`**: verificalo con `grep`, poi rimuovilo interamente.
- La costante `COLLAPSED_PANEL_TOGGLE_WIDTH`: rimuovila solo se il `grep` conferma che l'effect era il suo unico lettore.
- L'attributo `data-properties-tree-dragging` scritto e ripulito dagli handler di resize: **verifica se esiste ancora** dopo le riscritture di F2/F3. Se sì, rimuovi scrittura e pulizia insieme al suo consumer CSS; se è già sparito, annotalo.

**Consumer (CSS), in `abstract/style.scss`** (regione indicata `~1091-1168`, verifica le righe attuali): i blocchi che leggono `body[data-properties-tree-width-lock]`, `body[data-properties-tree-dragging]`, `body[data-properties-tree-both-collapsed]` e la var `--properties-tree-tab-width`. Applica la §1 a ciascuno.

**Non toccare** in questo commit i blocchi di sizing e hide-in-mode già trattati nel F2-fix: sono stati rimossi o ristretti allora e il loro stato attuale è verificato.

## 3. PARTE B — Gating della pill di riapertura

Oggi la pill riusa `showFloatingCluster`, costruito su `bothCollapsed` (i due sub-pannelli entrambi collassati), che è un concetto ereditato dal mondo dock. Nel mondo overlay la semantica corretta è più semplice: **la pill compare quando l'overlay non è visibile**.

- Riconduci il gating a quello stato, riusando ciò che già esiste invece di introdurre nuovo stato: se `bothCollapsed` calcola già esattamente "overlay non visibile", basta **rinominare o ricommentare** perché non si legga più come un concetto del dock. Se dopo l'accordion di F3 non coincide più (es. una card massimizzata e l'altra ridotta non è "nascosto"), allora correggi la condizione perché la pill compaia **solo** a overlay davvero assente, mai in contemporanea con l'overlay.
- Il gate su `activeEditorType ∈ {model, metamodel}` resta.
- **Kill-switch CSS**: `body[data-layout-mode="canvas-only"]` **resta** (`data-layout-mode` è scritto da Navbar e Toolbar, vivo, e nascondere l'overlay in canvas-only è voluto). Il ramo `body[data-active-tab="documentation"]` dipende invece da un attributo scritto dal dock: **verifica se il gate JS su `activeEditorType` copre già il caso documentation**; se sì rimuovilo, se no lascialo e annotalo.

**Requisito**: pill e overlay restano mutuamente esclusivi in ogni combinazione, e da pill si torna sempre all'overlay.

## 4. PARTE C — Orfani del dock (solo se dimostrati tali)

Lasciati intenzionalmente in F2 per tenere la diff leggibile: `groups.editors` e `rightSize` in `Dock.tsx`.

- `groups.editors`: rimuovilo se nessuna tab lo referenzia più.
- `rightSize` / `calculatePanelSizes`: **attenzione**, `calculatePanelSizes` potrebbe essere ancora usato altrove (`getInitialPanelWidth`, ratio in localStorage). Rimuovi **solo** la parte dimostrata morta; se il `grep` mostra lettori vivi, lascia tutto e annotalo.
- Le chiavi localStorage del ratio dock (`jjodel_dock_ratio_*`) sono inerti ma innocue: **non rimuoverle** (toccano dati utente per zero beneficio).

Se questa parte si rivela più intricata del previsto, **spostala fuori dal commit** e segnalalo: le parti A e B sono il valore di F5, la C è un extra.

## 5. PARTE D — Verifica pointer-events del wrapper overlay

Default ratificato (ratifiche 2026-07-29, report C9): `pointer-events: none` sul wrapper dell'overlay e `pointer-events: auto` sulle card, così l'overlay non ruba click al canvas nelle zone trasparenti (gap tra le card, zona sotto la card inferiore quando è corta). Nei riepiloghi di F3 e F3-fix questa regola **non compare**: va verificato se è stata applicata.

1. Individua il wrapper dell'overlay (l'elemento portalato su body, z 900) e verifica nel suo SCSS la presenza di `pointer-events: none` sul wrapper e `auto` sulle card.
2. **Se presente**: annotalo nella risposta e nel log, nessuna modifica.
3. **Se assente**: aggiungi le due dichiarazioni, nello stesso commit. Massimo due righe di CSS, nessun'altra modifica all'overlay. Attenzione a splitter e pill: se vivono nel wrapper fuori dalle card, devono anch'essi avere `pointer-events: auto`, altrimenti la Parte D li rende inerti (sarebbe una regressione peggiore del problema che risolve). Verifica dove sono montati prima di applicare.
4. Verifica visiva dedicata al punto 8 della §8.

## 6. Cosa NON fare

- Non modificare l'overlay: dimensioni, disposizione, resize, accordion, inset. Unica eccezione: Parte D, alle condizioni dette.
- Non toccare `--jj-canvas-right-inset` né i suoi reader (MiniMap, FAB, fitView): è la var nuova, viva e necessaria.
- Non collassare l'union del tipo `mode`: vedi §7, è solo da riportare.
- Non rimuovere `.collapsed-panel-toggle`.
- Non `git add .`.

## 7. Da riportare, senza modificare

Dopo la rimozione dei call-site `tab`, l'union `PropertiesWithTreeViewProps.mode` potrebbe avere un solo valore realmente usato (`floating`), con `popup` e `inline` mai istanziati. Verificalo con `grep` e **riportalo in chat**: rimuovere valori da un tipo esistente non è additivo e va deciso separatamente. **Nessuna modifica al tipo in questo commit.**

## 8. Verifica (la parte che conta davvero)

`npm run build` senza errori, e typecheck alla baseline.

Poi una passata visiva su `localhost:3000` (hard refresh) attraverso **tutti i contesti che le regole rimosse potevano toccare**, perché è lì che una cancellazione sbagliata si manifesta:

1. **Modello** e **metamodello**: overlay presente e corretto, canvas full-width, fit e MiniMap invariati.
2. **Dashboard di progetto (summary)**: si vede, niente schermata bianca (regressione già vista una volta).
3. **Documentation**: si apre come tab canvas, overlay assente.
4. **Layout mode**: `split`, `sidebar`, `canvas-only`, `vertical-console`. In canvas-only l'overlay sparisce; negli altri il canvas resta pieno e nessun pannello fantasma riappare.
5. **Transformation** e **viewpoint**, se raggiungibili: nessuna regressione di larghezza o visibilità.
6. **Pill**: nascondi l'overlay, la pill compare; riclicca, l'overlay torna. Mai entrambi insieme.
7. **Resize e accordion** dell'overlay ancora funzionanti (non dovevano essere toccati).
8. **Pointer events (Parte D)**: click e drag sul canvas nel gap tra le due card e nella zona sotto la card inferiore: selezione e pan devono funzionare. Splitter, resize dal bordo sinistro e pill devono restare cliccabili.

## 9. Chiusura

- Aggiorna `docs/claude-code-log.md` (tipo `refactor`), elencando cosa è stato rimosso, **cosa è stato lasciato con la motivazione**, e l'esito della Parte D (già presente / aggiunto).
- `git add` solo i file toccati, per path esplicito. Controlla `git status`: nessun WIP estraneo staged.
- Commit convenzionale, inglese, una riga. Es: `refactor(panels): retire width-lock machinery left without a target`.
- **Hard stop dopo il commit:** verifica visiva di Alfonso. Con questo la fase floating è chiusa; restano fuori fase il push del branch (molti commit non pushati) e il cleanup dei tag `reconstruct-base-*`.

## 10. Riferimenti

- Report floating `docs/discovery/discovery_2026-07-28_floating_panels_canvas.md`, B8: inventario dei retire-candidate e ordine dependency-safe (writer e reader insieme), più la nota che `.collapsed-panel-toggle` non è morto; C9 per il pointer-events del wrapper.
- Ratifiche 2026-07-29 (`claude/ratifiche_2026-07-29_floating_panels.md`), incluso il finding della collisione `:last-child` e la regola operativa che ne è seguita.
