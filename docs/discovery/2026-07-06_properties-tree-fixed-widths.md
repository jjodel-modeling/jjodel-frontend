# Discovery — Larghezze fisse e indipendenti per Properties + Tree View

**Data**: 2026-07-06
**Tipo**: Fase A discovery (read-only) — HARD STOP alla fine
**Branch**: `alfonso-frontend-jjtl`
**Prompt**: 2026-07-06 01:31 — Larghezze fisse e indipendenti (two-phase)

---

## 0. TL;DR — cosa è emerso di decisivo

1. **La regola width-lock va spostata PIÙ IN ALTO nel file** rispetto all'attuale rail-only.
   Oggi `data-properties-tree-rail-only` è a `style.scss:1211`, **dopo** le regole di
   hide `data-editor-type` (summary/transformation/viewpoint) e **prima** di canvas-only.
   Con il rail-only questo è innocuo perché si attiva solo nel caso raro "entrambi chiusi".
   Con la **width-lock sempre attiva** questa posizione diventa un BUG: la width-lock
   vincerebbe (source-order) sulle hide-rule → il pannello Properties **riapparirebbe alla
   sua larghezza fissa in dashboard / transformation / viewpoint mode**. Fix: inserire la
   regola width-lock a **~riga 1109** (subito dopo le media-query responsive, prima di
   `data-active-tab="documentation"` a 1111). Così: responsive/split/sidebar → width-lock
   vince (corretto: la width computata deve battere i min/max responsive); documentation /
   summary / transformation / viewpoint / **canvas-only** → vincono loro (corretto: hide
   batte width-lock). **Precedenza risultante: canvas-only > width-lock > responsive.** ✅

2. **Il lock è sull'intero dock-panel destro** (`.dock-panel:last-child`), che ospita TUTTI
   i tab del gruppo `editors` (Properties, Metadata, Node, Console, Languages, Logger).
   Con la width-lock sempre attiva, cambiare tab (es. Console) **blocca anche quel tab alla
   larghezza computata da Properties**. Oggi (modello fluido) questo accade SOLO nel caso
   56px both-collapsed (raro). ⚠️ Questa è la decisione #1 da confermare al go-ahead
   (§1 + §8-D1).

3. **La "riga verticale full-height" di img2** non è prodotta dai toggle collassati (già
   button 24px flottanti, senza bordo). I candidati reali sono: (a) `.dock-divider`
   (splitter rc-dock, `border-left:1px` full-height, `style.scss:582`) al confine
   canvas↔tab; (b) il **background bianco full-height** di `.properties-with-tree-view`
   (`#fff`, scss:35) + `.dock-panel` (`var(--color-bg-primary)`, scss:504). Va confermato a
   runtime quale sia il "bordo", ma la strategia R2 è: in stato both-collapsed rendere il
   background del container trasparente così le due icone "flottano" (§4 + §8-D3).

4. **Splitter rc-dock inerte sotto il lock** — CONFERMATO dal comportamento attuale del
   rail-only 56px: `flex/min/max-width !important` battono lo stile inline (senza
   `!important`) che rc-dock scrive sul drag → il pannello torna alla larghezza lockata.
   Nessun layout rotto, solo drag "inerte" (accettabile per il prompt). §3.

5. **A.7 (consumer che leggono la larghezza del tab): pulito.** Nessun `offsetWidth`/
   `clientWidth`/media-query interna in Info/TreeViewContent che assuma il modello fluido
   (solo un clamp `window.innerWidth` in un ContextMenu, irrilevante). L'unico override
   width-dipendente è `maxWidth:'none'` interno al componente (A.6, §6).

---

## 1. A.1 — Altri tab nello stesso dock panel (gruppo `editors`)

**Stato attuale**
- Il gruppo `editors` (Dock.tsx:288) contiene, in ordine: **Properties** (`structure`),
  Metadata, Node (advanced), Console, Languages/MTM (advanced), Logger (advanced)
  (Dock.tsx:295–355). `tabLocked:true` disabilita il riordino drag.
- `PropertiesWithTreeView mode="tab"` vive dentro il tab **Properties** (Dock.tsx:295).
  rc-dock **cache-a i contenuti dei tab**: il componente resta MONTATO anche quando un
  altro tab del gruppo è attivo → i suoi `useEffect` continuano a girare e dispatchano.
- Oggi `Dock.tsx:268–282` ascolta `PROPERTIES_TREE_RAIL_ONLY_ENTER/EXIT` e setta/rimuove
  `body[data-properties-tree-rail-only]`. **Non c'è alcun rilascio del lock al cambio tab**:
  se collassi entrambi i sub-panel e poi passi a Console, il dock-panel resta a 56px e
  Console è schiacciata a 56px. → **Oggi il lock RESTA locked al cambio tab.**

**Rilevazione tab attivo — disponibile ma non banale**
- `ACTIVE_TAB` viene dispatchato ad ogni cambio tab del pannello (Dock.tsx:376) con
  `detail:{ activeId, tabType }`. **MA** il tab Properties ha `id()` generato dinamicamente
  e nessun `data-type` sul titolo → `tabType` è `null` e `activeId` non è un identificatore
  stabile "properties". Per gate-are su "Properties attivo" servirebbe catturare l'id del
  tab `structure` (fattibile: è creato in Dock.tsx:295) e confrontarlo in
  `handleLayoutChange`. Complessità aggiuntiva reale.

**Implicazione per il modello sempre-lock**
- Con la width-lock sempre attiva, il dock-panel è bloccato a `W_props(+tree)` **anche
  mentre l'utente guarda Console/Metadata/Node**. Nel modello fluido di oggi quei tab
  usano i min/max responsive (400–710px) e sono ridimensionabili col divider.
- **La frase del prompt "se già oggi resta locked, la semantica non peggiora" è vera solo
  per il caso 56px both-collapsed** (che oggi già resta locked). Per il caso comune (almeno
  un pannello aperto) oggi il lock è INATTIVO → gli altri tab sono fluidi; con la width-lock
  sempre attiva diventerebbero fissi. Questo è un cambiamento reale → **decisione D1** (§8).

**Opzioni (per il go-ahead)**
- **D1-A (minimale, RACCOMANDATA come default coerente col prompt)**: il lock resta sempre
  attivo; gli altri tab del gruppo convivono con la larghezza computata da Properties.
  Zero logica di active-tab. Coerente con il meccanismo descritto nel prompt (un solo evento
  `PROPERTIES_TREE_TAB_WIDTH` + data-attr di attivazione).
- **D1-B (più corretto, +complessità)**: gate-are la width-lock su "tab Properties attivo":
  Dock cattura l'id del tab `structure`, in `ACTIVE_TAB` setta il data-attr solo se
  `activeId === structureId`, lo rimuove altrimenti (gli altri tab tornano responsive). Al
  rientro su Properties, ri-applica l'ultima width (Dock deve memorizzarla, perché il
  componente non ri-dispatcha se resta montato). +~15 righe in Dock.tsx.

---

## 2. A.2 — Interplay con le modalità su `body` + precedenza

Regole che targettano **lo stesso selettore** `.dock-hbox > .dock-panel:last-child`
(tutte stessa specificità, tutte `!important` sulle proprietà chiave → **vince la SOURCE
ORDER**):

| # | Riga | Selettore body | Effetto sul pannello dx |
|---|------|----------------|--------------------------|
| 1 | 1042 | `data-layout-mode="split"` | min 300/400, max 710 |
| 2 | 1057 | `data-layout-mode="sidebar"` | min 350, max 550 |
| 3 | 1075–1108 | `:not([data-layout-mode])` (media) | min/max responsive per risoluzione |
| 4 | 1111 | `data-active-tab="documentation"` | **hide** (w:0) |
| 5 | 1135 | `data-editor-type="summary"` | **hide** (w:0) |
| 6 | 1159 | `data-editor-type="transformation"` | **hide** (w:0) |
| 7 | 1183 | `data-editor-type="viewpoint"` | **hide** (w:0) |
| 8 | **1211** | `data-properties-tree-rail-only` | 56px (**da rimuovere**) |
| 9 | 1223 | `data-layout-mode="canvas-only"` | **hide** (w:0) |

**Nota chiave**: NON esiste hide-rule per `data-editor-type="model"` / `"metamodel"`
(l'editing normale in cui Properties DEVE mostrarsi). Quindi durante l'editing normale
nessuna hide 4–7 è attiva → la width-lock deve solo battere le regole di sizing 1–3.

**Precedenza proposta (confermata corretta): inserire la regola width-lock a ~riga 1109**
(subito dopo il blocco media responsive #3, prima di documentation #4).
- Regole **1–3** (prima) → width-lock (dopo) **vince** ✅ (indispensabile: nel caso
  both-collapsed la width 56px deve scendere sotto il min-width 400 responsive; oggi il
  rail-only lo fa proprio perché piazzato dopo le responsive).
- Regole **4–7, 9** (dopo) → **vincono loro** ✅ (hide batte width-lock: dashboard /
  documentation / transformation / viewpoint / canvas-only nascondono il pannello).
- **canvas-only (9) > width-lock**: soddisfatta (9 è dopo 1109). La proposta del prompt
  "canvas-only > width-lock" è così rispettata **e** in più si guadagna
  "editor-type-hide > width-lock" che il rail-only attuale NON garantisce.

**Regressione latente odierna corretta gratis**: oggi rail-only@1211 vince su
summary@1135 → both-collapsed + dashboard mostrerebbe un rail 56px. Spostando la regola a
1109 questo caso si risolve.

**Meccanica canvas-only vs width-lock** (verifica flexbox): canvas-only setta
`width/min-width/max-width:0 !important` ma NON `flex`. La width-lock setta `flex:0 0
var(...) !important` + `width/min/max:var(...) !important`. Essendo canvas-only DOPO,
i suoi `width/min/max:0 !important` battono quelli della width-lock → item clampato a 0 →
nascosto. Il `flex` residuo della width-lock è irrilevante col max-width:0. ✅ (stesso
meccanismo per cui oggi canvas-only batte rail-only.)

---

## 3. A.3 — Splitter rc-dock sotto `flex !important`

**CONFERMATO inerte** — evidenza dal rail-only attuale:
- `.dock-divider` (style.scss:578) è lo splitter tra canvas e pannello dx (`.dock-hbox >
  .dock-divider`, cursor `ew-resize`, riga 610).
- Sul drag, rc-dock scrive dimensioni **inline** sul dock-panel (`style="..."`, **senza**
  `!important`). La regola width-lock `flex/width/min/max-width !important` batte l'inline →
  il pannello **torna** alla larghezza lockata: il drag non produce effetto visibile.
- Questo è esattamente ciò che accade oggi col tab 56px both-collapsed (il divider non
  ridimensiona il 56px). Nessun glitch: drag "inerte" (snap-back), non layout rotto.
- **Documentato/accettato dal prompt**: con le larghezze interne resizable (handle propri),
  lo splitter inerte è OK. Da confermare al visual gate che il drag non lasci artefatti
  transitori (in teoria no: `!important` vince ad ogni frame).

---

## 4. A.4 — Origine della riga full-height (R2)

**I toggle collassati NON sono il colpevole**: `CollapsedPanelToggle` è un `<button>`
`flex:0 0 24px`, `background:transparent`, `border:none` (scss:224–257). Le classi legacy
`.properties-panel-collapsed` (scss:189) e `.tree-view-collapsed` (scss:497) — con bordo
full-height — sono **DEAD**: grep in TSX/TS = 0 occorrenze. Non renderizzate. (Da lasciare
com'è, §2 preservation; non toccarle in questa task.)

**Candidati reali della "riga verticale che scende fino al footer"** (both-collapsed = tab
56px):
1. **`.dock-divider`** (style.scss:578–587): `border-left:1px solid #e2e4e8`, `flex:0 0
   1px`, full-height (stretch), al confine canvas↔tab. È lo splitter rc-dock — presente in
   TUTTI gli stati, ma nel 56px both-collapsed, affiancato dallo strip bianco vuoto, legge
   come "bordo di un rail".
2. **Background full-height**: `.properties-with-tree-view { background:#fff; height:100% }`
   (scss:30–36) + `.dock-panel { background: var(--color-bg-primary) }` (style.scss:504).
   Nel 56px both-collapsed è un blocco bianco 56px × full-height = "il rail".
3. (dark) `.properties-with-tree-view { background:#1e1e1e }` (scss:754).

**Strategia R2** (da confermare a runtime quale elemento sia il "bordo" in img2 — §5.1
sub-rule "verify before assuming"): rendere **trasparente il background** di
`.properties-with-tree-view` (e non disegnare bordi) **nello stato both-collapsed**, così i
due button 24px flottano senza blocco pieno. Rilevare both-collapsed **dentro il componente
SCSS** senza nuovo body-attr, es.:
```scss
.properties-with-tree-view:not(:has(.properties-panel-container)):not(:has(.tree-view-panel-container)) {
  background: transparent;
}
```
(`:has()` supportato nei browser correnti; nessun nuovo attributo su body.)
- Il **`.dock-divider`** resta (è lo splitter): se Alfonso lo considera ancora fastidioso
  nel 56px, si può neutralizzarne il `border-left` via la regola width-lock quando la width
  è 56 — ma serve distinguere il caso both-collapsed (decisione D3, §8). Raccomando:
  partire con lo strip trasparente (fix minimale) e valutare il divider al visual gate.

---

## 5. A.5 — Handle sinistro Properties vs splitter rc-dock

**Layout nel nuovo modello (entrambi aperti)**:
`[.dock-divider][ Properties container (W_props) ][ tree resize handle ][ Tree (W_tree) ]`
→ il bordo SINISTRO del Properties container coincide col bordo interno-sinistro del
dock-panel, **adiacente al `.dock-divider`** (splitter canvas↔tab).

**Rischio collisione (reale)**:
- L'handle esistente del tree (`.tree-view-panel-resize-handle`, scss:343) sta al confine
  **interno** Properties|Tree (`left:-3px`, hit-zone 6px, `z-index:10`) → nessuna collisione
  con il divider (è lontano dal bordo del panel).
- Un handle sul **bordo sinistro del Properties** sarebbe invece sopra/accanto al
  `.dock-divider` (cursor `ew-resize`, `z-index:1`; nota: `.dock-panel-drag-size` è
  `z-index:300` ma sono gli angoli, non il divider laterale). Due handle col-resize
  sovrapposti = confusione.
- **Mitigante**: sotto il lock il divider è inerte (§3) → l'handle Properties fa il lavoro
  reale (drag → ricalcola W_props → ridispatcha width → tab cresce, canvas cede). Se
  l'handle protrude 3px a sinistra (come il tree handle) invade la zona del divider;
  valutare `left:0` o protrusione a destra per non pescare l'`ew-resize` del divider.
- **Da confermare al visual gate**: hit-zone e cursore nell'area di confine; `z-index`
  dell'handle Properties ≥ del divider così cattura lui il drag.

**Semantica handle Properties**: come il tree handle ma sul lato opposto. Il tree handle usa
`startWidth - delta` (bordo sx del tree, trascinare a sx allarga). Per Properties, handle sul
bordo SINISTRO del container: trascinare a sinistra deve **allargare** Properties →
`startWidth - delta` (identico), con clamp 400–700 + NaN guard. Ad ogni move va
**ridispatchato** `PROPERTIES_TREE_TAB_WIDTH` (live-drag, R "aggiornata live").

---

## 6. A.6 — `maxWidth:'none'` su view selezionata

**Stato attuale**: `.properties-panel-container` è `flex:1 1 0` **senza** `max-width` nello
SCSS (i cap 300/450 del modello F1 furono rimossi, cfr. commento scss:47–52). L'inline
`style={effectiveViewSelected ? { maxWidth:'none' } : undefined}`
(PropertiesWithTreeView.tsx:231) sovrascrive un max-width **che non esiste più** → **oggi è
già in gran parte inerte** (residuo del modello fluido F1). Serviva quando il container
aveva `max-width:450px` e una view doveva allargarlo.

**Nel modello a larghezza fissa**: il container diventa `width:W_props; min-width:W_props;
max-width:W_props` (come il tree). Un `maxWidth:'none'` inline **confliggerebbe** col
`max-width` esplicito che dobbiamo settare → non si possono avere entrambi. Quindi:
- L'override `maxWidth:'none'` va **rimosso** (inerte/dannoso nel nuovo modello).
- Di conseguenza `effectiveViewSelected` (tsx:172) e `viewSelected` (tsx:111) — usati SOLO
  per quel maxWidth (grep confermato: nessun altro consumer) — diventano **morti** e
  possono essere rimossi. ⚠️ `effectiveViewSelected` è codice pin-era: rimozione da
  documentare, ma è additiva e locale (nessun'altra dipendenza).
- **La leggibilità delle Monaco di ViewData non regredisce**: l'altezza è gestita dal
  ramo SCSS indipendente `.properties-panel-container ... :has(.view-editor-root)`
  (scss:75–81), che resta; Monaco auto-layout-a alla larghezza del container. Con W_props
  fino a 700px (resizable) c'è spazio. **Decisione D2** (§8): se Alfonso vuole che la
  selezione di una view **allarghi automaticamente** Properties oltre la sua width fissa,
  è un'aggiunta esplicita (non nel modello-tabella del prompt); raccomando di NON farlo
  (l'utente allarga a 700 se serve) e rimuovere l'override come inerte.

---

## 7. A.7 — Consumer che assumono il modello fluido

**Pulito.** Grep su Info.tsx / TreeViewContent.tsx / (ViewData non esiste a quel path;
ViewData è renderizzato via Info): nessun `offsetWidth`/`clientWidth`/
`getBoundingClientRect`/media-query interna che dipenda dalla larghezza del tab. Unica
occorrenza: `TreeViewContent.tsx:469` clamp `window.innerWidth` per il posizionamento di un
ContextMenu → indipendente dalla larghezza del pannello, **nessun impatto**.
Nessuna modifica ai contenuti (Info/TreeViewContent) richiesta da A.7.

---

## 8. Decisioni aperte per il go-ahead

| ID | Decisione | Opzioni | Raccomandazione |
|----|-----------|---------|-----------------|
| **D1** | Lock su tutto il dock-panel: cosa fanno gli altri tab (Console/Node/…) | **A** lock sempre attivo, altri tab condividono la width computata (minimale, coerente col prompt) · **B** gate su "tab Properties attivo" via `ACTIVE_TAB` + id del tab `structure` (+~15 righe Dock) | **A** per il primo giro (matcha il meccanismo del prompt). Passare a **B** se dà fastidio all'uso. |
| **D2** | View selezionata + larghezza Properties fissa | rimuovere `maxWidth:'none'` (inerte) e `viewSelected`/`effectiveViewSelected` · oppure auto-widen su view | **Rimuovere** l'override; niente auto-widen (fuori dal modello-tabella). Confermare che rimuovere `effectiveViewSelected` (pin-era) è OK. |
| **D3** | Riga full-height in both-collapsed (R2) | background trasparente del container via `:has()` (dentro scss componente) · + eventuale neutralizzazione `.dock-divider` in 56px (serve segnalare both-collapsed a Dock) | Partire con **background trasparente** (fix minimale nel file del componente); valutare il divider al visual gate. **Confermare a runtime quale elemento è il "bordo" in img2 prima di scrivere il fix.** |

---

## 9. File confermati per la Fase B

1. `frontend/src/components/editors/PropertiesWithTreeView.tsx`
   - nuovo stato `propsWidth` persistito (`jjodel_property_panel_width`, 400–700, default
     440, clamp + NaN guard come il tree);
   - handle sinistro Properties (semantica `startWidth - delta`, clamp, live-drag);
   - Properties container passa da `flex:1` a `width/min/max = W_props` (fisso);
   - `useEffect` che calcola la width desiderata del tab (tabella del prompt: entrambi
     `W_props+W_tree`; solo props `W_props+28`; solo tree `W_tree+28`; entrambi chiusi `56`)
     e dispatcha `PROPERTIES_TREE_TAB_WIDTH {width}` su cambi di visibilità **e** widths
     **e** durante il drag di entrambi gli handle;
   - **rimozione** del dispatch rail-only (tsx:193–198) e del modifier `tree-only-expanded`
     (tsx:225) + `onlyTreeExpanded`/`bothRails` non più necessari;
   - **D2**: rimozione `maxWidth:'none'` + `viewSelected`/`effectiveViewSelected`.
2. `frontend/src/components/abstract/Dock.tsx`
   - listener `PROPERTIES_TREE_TAB_WIDTH` → set `body.style.setProperty('--properties-tree-tab-width', width+'px')` + data-attr di attivazione (es. `data-properties-tree-width-lock="true"`); cleanup su unmount;
   - **rimozione** del listener rail-only (tsx:263–282);
   - (**D1-B** opzionale: gate su tab attivo).
3. `frontend/src/components/abstract/style.scss`
   - nuova regola width-lock **inserita a ~riga 1109** (dopo le media responsive, prima di
     `data-active-tab="documentation"`): `body[data-properties-tree-width-lock="true"]
     .dock-hbox > .dock-panel:last-child { flex:0 0 var(--properties-tree-tab-width)
     !important; width/min/max-width:var(--properties-tree-tab-width) !important;
     transition: width 200ms ease, flex-basis 200ms ease; }`;
   - **rimozione** della regola rail-only (scss:1206–1220).
4. `frontend/src/events/registry.ts`
   - `PROPERTIES_TREE_TAB_WIDTH: 'jjodel:properties-tree-tab-width'`;
   - **rimozione** coppia `PROPERTIES_TREE_RAIL_ONLY_ENTER/EXIT` (grep conferma: unici
     consumer = Dock.tsx + PropertiesWithTreeView.tsx, entrambi modificati). ✅
5. `frontend/src/components/editors/properties-with-tree-view.scss`
   - Properties container width fissa; handle sinistro Properties (speculare al tree);
   - **R2**: background trasparente in both-collapsed (`:has()`), niente bordo/height sulle
     colonne collassate; dark mode nei blocchi `[data-theme="dark"]` esistenti.
6. `docs/claude-code-log.md` — entry a fine task.

**Grep di sicurezza già eseguiti**: `PROPERTIES_TREE_TAB_WIDTH` e
`--properties-tree-tab-width` non esistono altrove (nessuna collisione). `data-properties-
tree-rail-only`/`tree-only-expanded` consumer = solo i file sopra.

---

## 10. Rischi / hazard per la Fase B

- **Precedenza CSS**: la regola width-lock DEVE stare a ~1109 (non a 1211). Sbagliare la
  posizione = il pannello riappare in dashboard/viewpoint/transformation. (§2)
- **Coerenza costante 28px**: l'ingombro renderizzato del toggle collassato deve valere
  **28px** per matchare i `+28`/`56` della formula JS. Oggi `.collapsed-panel-toggle` è
  24 + margini 4/4 = 32, con override `--properties`/`--tree` a 8. Tarare i margini così che
  il totale reale = 28 (o allineare la costante JS al valore reale). Mismatch = tab
  leggermente più largo/stretto della somma. (§ modello prompt)
- **Live-drag performance**: dispatch ad ogni `mousemove` su entrambi gli handle → il
  custom-property update su body è cheap (no re-render React del Dock se si usa
  `body.style.setProperty`), ma verificare che non causi thrash. Transizione 200ms sulla
  regola: durante il drag può dare lag → valutare disabilitare la transition durante il drag
  (come già fatto per il tree: la transition width fu rimossa dal container per il drag).
- **Splitter inerte**: confermato non rompe, ma il visual gate deve verificare l'assenza di
  jitter al drag del divider sotto lock. (§3)
- **`:has()` background trasparente**: verificare che non "buchi" il pannello quando UNO è
  aperto (in quel caso il container aperto disegna il suo background e va bene; la regola
  `:has()` both-collapsed non matcha). (§4)

---

**HARD STOP** — nessun file sorgente modificato in Fase A. In attesa di go-ahead e delle
risposte a D1/D2/D3 prima di procedere alla Fase B.
