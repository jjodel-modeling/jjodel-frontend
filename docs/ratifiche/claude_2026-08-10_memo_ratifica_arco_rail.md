# Memo di ratifica: arco "rail destro" (R-RAIL-1..R-RAIL-5)

**Data**: 2026-08-10 16:05
**Base**: `README.md` + `Jodel Side Panel.dc.html` di claude design (oggi esistono solo
come upload di chat); checkpoint `claude/sessione_2026-08-10_2.md`, sezione "Review
design"; verifiche dirette su `origin/alfonso-frontend-jjtl` a `abc0182` tramite clone
shallow fatto in questa sessione.
**Perimetro**: apertura dell'arco. Nessun prompt implementativo prima delle ratifiche;
dopo le ratifiche esce il prompt di discovery Fase 0.

---

## 0. Fatti verificati in questa sessione

Il checkpoint dava tutte le claim del README per non verificate e le rimandava alla
Fase 0. Buona parte è già decidibile adesso, perché sta su origin: sotto ci sono gli
esiti, con ancora. Questo cambia il contenuto di due ratifiche su cinque (R-RAIL-4 e
R-RAIL-5 non sono più questioni aperte, sono conferme) e alleggerisce la Fase 0, che
resta necessaria solo per quello che vive nel working tree locale.

| # | Claim del README | Esito | Ancora su `abc0182` |
|---|---|---|---|
| 1 | il codice sta sotto `frontend/src/` | vero | la root del repo contiene `frontend/`, non `src/` |
| 2 | i token SCSS stanno in `frontend/src/styles/tokens/` | vero, ma parziale | 10 file + `index.scss` (1500 righe) **più** un secondo sistema `frontend/src/styles/tokens.css` (293 righe, 80 custom property) |
| 3 | `entityMeta.ts` esiste | vero | `frontend/src/common/entityMeta.ts` (non sotto `styles/`) |
| 4 | il cyan di selezione è già un token | **vero, ed è esattamente quello del mock** | `_colors-light.scss:352-353`: `--color-selection-bg: #e0f7fa`, `--color-selection-bar: #0891b2` |
| 5 | quel cyan è "il cyan di selezione del canvas" | **falso** | il canvas usa `--color-canvas-accent: #06b6d4` (`_colors-light.scss:205`) |
| 6 | Bootstrap Icons è già dipendenza | vero | usato ovunque; il mock punta al CDN 1.13.1 |
| 7 | Inter e IBM Plex Mono sono già in casa | vero come **dichiarazione**, falso come **caricamento** | `_typography.scss:13,16` definiscono `--font-sans` e `--font-mono`; `@fontsource-variable/inter@^5.2.6` è in `package.json` ma **non è importato da nessuna parte**; nessun `@font-face` per le due famiglie; `index.html` carica da Google solo JetBrains Mono (per Monaco) |
| 8 | "ogni valore è già un token" | non verificabile in blocco | il mock usa **zero** `var(--...)`: 32 valori esadecimali distinti, tutti letterali inline. La corrispondenza va fatta a mano, valore per valore |

Anagrafica del rail attuale, utile a tutte le ratifiche:

- `frontend/src/components/editors/PropertiesWithTreeView.tsx` (648 righe) +
  `properties-with-tree-view.scss` (1375 righe). Montato una volta sola, in
  `Dashboard.tsx:627` come `<PropertiesWithTreeView mode='floating'/>`.
- Card PROPERTIES: header (`:449-459`, con lo slot `properties-panel-header__actions`
  che C-3 ritira) e body (`:477`) che contiene `<Info>` **più** la sezione NODE, resa
  solo in advanced, con `<NodeEditor/>` dentro.
- Card TREE VIEW: header (`:548`) e body (`:568`) con `<TreeViewContent/>`.
- Pannelli di view authoring: `editor-v2/viewpoint/authoring/{Vertex,Row,Edge}AuthoringPanel.tsx`
  e `EnableIRPanel.tsx`, importati e montati da `editors/views/ViewData.tsx:28-30`.
- Il toggle Basic/Advanced è di `ModeSystem/ModeToggle.tsx`; `PropertiesWithTreeView`
  ne è già consumatore (la sezione NODE è gated su `advanced`).
- `docs/redesign/` esiste già e contiene `JJODEL-UI-MASTER-SPEC.md`. Il checkpoint
  proponeva `docs/design/rail/`: meglio non aprire una seconda cartella.

Resta alla Fase 0 solo ciò che origin non può dire: lo stato del working tree locale
(Slice C, vedi sotto), la corrispondenza puntuale dei 32 letterali del mock coi token
esistenti, e quale dei due sistemi di token (SCSS in `tokens/` o custom property in
`tokens.css`) sia quello da consumare in un componente nuovo.

## Nota di stato: la coda di push non è quella del checkpoint

Nel tuo messaggio i placeholder sono rimasti da compilare. Quello che si vede su origin,
a differenza di quello che dava il checkpoint:

- `origin/alfonso-frontend-jjtl` è a `abc0182` e **contiene** `ab90ed0` (fix
  `allPossibleParentViews`) e `5c6c2f3` (rotazione log, settimo lotto), con i loro hash
  originali. Sopra ci sono altri quattro commit di docs del 10/8: `3dc2774` (verdetto
  smoke del guard), `03363ce` (fusione delle due copie della spec ViewpointIR v1.2),
  `b0292b8` (ritiro di `docs/specs/`), `abc0182` (rotazione, ottavo lotto).
- **Nessuno dei commit di Slice C è su origin**: nessun `refactor(properties)` in
  cronologia, e gli hash `6b8e91d73`, `473813c5f`, `47603c613`, `a801403ba` non
  esistono nella storia remota. Quindi Commit 1, Commit 2 e Commit 3 sono ancora solo
  sul Mac.
- Ne segue anche che gli hash "rebasati" annotati nel checkpoint non hanno prodotto
  riscrittura su origin: `ab90ed0` e `5c6c2f3` sono lì com'erano. Il conteggio della
  coda locale va rifatto con
  `git log origin/alfonso-frontend-jjtl..HEAD --oneline` dopo un `git fetch`.

Non è materia di ratifica, ma il prompt di discovery deve partire da uno stato dichiarato
giusto: se Slice C è a HEAD locale non pushato, la Fase 0 del rail lo vedrà e va detto in
anticipo, altrimenti è il quarto context drift della serie.

---

## Decisioni da ratificare

### R-RAIL-1. Sorte della card di view authoring nel nuovo rail

Il README ridisegna un solo inspector: quello dell'elemento di metamodello (Name, Type,
Multiplicity, Flags, Advanced, Appearance). Ma il body della card PROPERTIES oggi è
polimorfo: renderizza `<Info>`, e nel contesto viewpoint ospita i pannelli
Vertex/Row/Edge authoring montati da `ViewData.tsx`. Se l'arco non decide dove finiscono,
finiscono per default fuori, e ci si ritrova due rail.

Tre strade:

**(a) Rail come guscio, inspector come slot polimorfo.** L'arco consegna il guscio
(header, tree pane, identity block, posture Browse/Focus, footer, scrolling) più **un
solo** renderer di corpo, quello dell'elemento di metamodello descritto dal README. I
pannelli di authoring entrano nello stesso slot **così come sono**, senza redesign
interno, ereditando guscio e scroll. Diff contenuta, i pannelli restano quelli che Slice
C sta uniformando.

**(b) Rail solo per il metamodello, authoring nella card vecchia.** Le due superfici
convivono. Da scartare: reintroduce esattamente il problema che il redesign risolve
(due card, due header, due ombre nello stesso rail), e lo rende permanente.

**(c) Ridisegnare anche i pannelli di authoring nello stesso arco.** Vertex + Row + Edge
+ EnableIR + Matching. Esplosione di scope, e collisione frontale con Slice C che è
ancora in volo.

**Raccomandazione: (a).** Identity block, footer e posture sono preoccupazioni di
contenitore, ortogonali a cosa c'è nel form: modellarle come guscio è la scelta che non
si paga due volte. Due corollari da ratificare insieme, perché sono il punto dove (a) può
rompersi:

- **C1.1**: nell'arco 1 i pannelli di authoring **non si toccano**, oltre al minimo per
  ospitarli (montaggio e larghezza). La mappatura `ADVANCED`+`ADVANCED STATE` → Advanced,
  `FLAGS` → Flags, `NODE` → Appearance del README §7 vale **solo** per il renderer di
  metamodello. Da notare che `NODE` non sta in `<Info>`, sta in `PropertiesWithTreeView`
  stesso ed è gated su advanced: spostarlo dentro l'inspector è un cambio reale, non un
  rename.
- **C1.2**: l'identity block deve essere calcolabile anche per una view, altrimenti il
  guscio degrada proprio dove serve. Proposta: per le view il badge e il nome vengono
  dalla view, il "kind" è la natura IR (Vertex / Row / Edge) e il chip di firma porta la
  metaclasse di applicazione. Se il dato non è disponibile a quel livello, la Fase 0 lo
  dice e il guscio rende l'identity block opzionale invece di renderlo sbagliato.

### R-RAIL-2. Superamento in prospettiva di U-2 (breadcrumb)

Il README §7 dice: l'identity block sostituisce title row **e** breadcrumb, e in postura
Browse non si rende alcun breadcrumb. U-2 (chiuso il 9/8) aveva introdotto il breadcrumb
di "Applies to". Letta di traverso, sembra una contraddizione. Non lo è, perché i due
breadcrumb non dicono la stessa cosa:

- il breadcrumb **posizionale** (dove sta l'elemento selezionato nell'albero) è ridondante
  quando l'albero è visibile: è quello che il README elimina in Browse, e che
  **reintroduce** come barra §6 quando il tree pane è collassato, cioè quando la posizione
  non è più leggibile altrove. La regola sottostante è coerente: breadcrumb solo in
  assenza dell'albero;
- il breadcrumb **di "Applies to"** non è posizionale, è semantica della view (a quale
  metaclasse si applica). Non cade sotto la regola del README, e per R-RAIL-1 vive dentro
  il renderer di authoring, che l'arco 1 non tocca.

**Proposta di ratifica**: registrare U-2 come *superato in prospettiva e solo per la parte
posizionale*, non come contraddetto, con una nota in `docs/decisions.md` (arco U) da
scrivere all'apertura dell'arco rail, così una sessione futura non legge U-2 come violato.
C-1/U-3 resta valido e anzi guadagna: con un unico `FormSection` la migrazione futura alle
eyebrow row del README §7 è un solo primitivo da cambiare.

### R-RAIL-3. Scope dei preset

**Proposta: solo `2a` nell'arco 1**, come da checkpoint. Gli step 1-5 del build order del
README producono `2a` completo, e `2a` è sia il layout di Basic sia il default di
Advanced: è l'unico preset che serve per avere un pannello finito e usabile. `1a` e `1b`
sono lo stesso componente con due booleani, ma ognuno aggiunge una riga alla matrice di
verifica visiva, e la verifica visiva è il collo di bottiglia del progetto, non il codice.
`3a` (Recent) ha l'unico requisito dati nuovo (uno store di cronologia con dedup e cap a
5) e va per ultimo, in un arco suo.

Tre corollari:

- **C3.1**: niente gear e niente popover nell'arco 1. Il preset non è ancora una
  preferenza, quindi non si brucia una chiave di storage per un valore che ha un solo
  valore possibile. La persistenza entra con i preset, non prima.
- **C3.2**: il componente si scrive comunque parametrico, ma senza rami morti. Un tipo
  `RailPreset` e una costante `PRESET_2A` consumata dal componente bastano a rendere
  additivo l'arco successivo; i rami `tabs` e `recent` **non** si scrivono adesso. È il
  compromesso tra "poi è una riscrittura" e over-engineering.
- **C3.3**: il segmented Basic/Advanced **resta nella top bar**. Il README stesso offre
  questo fallback, e sposta il problema: spostarlo è una decisione di livello app che
  cambia anche l'aritmetica dell'header (il README calcola ~155px per il titolo a 420px
  proprio perché ce lo mette dentro). Senza il segmented l'header respira, e il bottone
  Focus/Browse può tenere la label testuale invece di essere icon-only, che è meglio per
  la scopribilità. Il pannello continua a reagire alla modalità come descritto.

### R-RAIL-4. Cyan di selezione `#0891b2` contro accent `#0ea5e9`

Non è più una questione aperta: i due colori hanno ruoli diversi e sono **entrambi già
token**. In `_colors-light.scss:349-353` c'è, con tanto di commento:

```scss
/* Selection (cyan family — distinto da --color-info che è blu informazionale)
   TODO: questi token sono attualmente usati solo da .tree-row--selected;
   estendere alle altre selezioni del progetto in un task futuro. */
--color-selection-bg: #e0f7fa;
--color-selection-bar: #0891b2;
```

Il mock usa esattamente quella coppia. Il redesign del rail *è* il "task futuro" nominato
nel TODO. `--color-sky-500: #0ea5e9` (`tokens.css:42`, chiuso con Slice A3-bis) è l'accent
interattivo del design system, un ruolo diverso: non c'entra con la selezione e nel rail
non va usato.

**Proposta di ratifica**: il rail consuma `var(--color-selection-bg)` e
`var(--color-selection-bar)` per selezione in tree e Recent, mai letterali (oggi `#0891b2`
compare 23 volte come letterale nel codice, il rail non deve diventare la ventiquattresima).
Nessuna unificazione col sky.

Con due precisazioni da mettere a verbale, perché il README è impreciso e la sua
motivazione verrebbe copiata nei prompt:

- la frase "the existing canvas-selection cyan; keep the tree and canvas selection in
  sync" è sbagliata: il canvas usa `--color-canvas-accent: #06b6d4` (cyan-500), il
  pannello `#0891b2` (cyan-600). Oggi pannello e canvas **non** sono sincronizzati;
- in circolazione ci sono quindi tre cyan con tre ruoli (`#06b6d4` canvas, `#0891b2`
  selezione nei pannelli, `#0ea5e9` accent DS). **Proposta: lasciare la discrepanza
  com'è** per l'arco (è in produzione da sempre, e allinearla tocca il canvas, che è
  fuori scope) e registrare "unificazione dei tre cyan" come voce di design system, dove
  si somma al debito DS-10 dei letterali `#0ea5e9`, che oggi sono 257, non 197.

### R-RAIL-5. Font IBM Plex Mono e Inter

Anche qui la domanda cambia forma alla luce dei fatti. **Non c'è nessuna dipendenza nuova
da introdurre**, perché entrambe le famiglie sono già dichiarate nei token:

```scss
--font-sans: 'Inter Variable', 'Inter', -apple-system, ... , sans-serif;
--font-mono: 'IBM Plex Mono', 'Monaco', 'Consolas', ... , monospace;
```

e `@fontsource-variable/inter@^5.2.6` è già in `package.json`. Il problema è un altro, ed
è preesistente al rail: **nessuna delle due è caricata davvero**. Il pacchetto di Inter non
è importato da nessun file di `src/`, non esistono `@font-face` per le due famiglie,
`public/fonts/` contiene solo icomoon, e `index.html` carica da Google soltanto JetBrains
Mono per Monaco. Oggi, sul tuo Mac, `--font-sans` cade su `-apple-system` e `--font-mono`
cade su Monaco.

**Proposta di ratifica**, in tre punti:

- **C5.1**: il rail consuma `var(--font-sans)` e `var(--font-mono)` e non nomina mai una
  famiglia. Le 51 occorrenze letterali di `'IBM Plex Mono', monospace` nel mock sono da
  tradurre in token, non da copiare.
- **C5.2**: l'arco del rail **non cambia il caricamento dei font**. Va aperta una voce di
  design system separata: "Inter e IBM Plex Mono sono dichiarate nei token ma non
  caricate". Sistemare Inter costa una riga di import (pacchetto già installato, zero
  dipendenze nuove); sistemare IBM Plex Mono richiede o un pacchetto nuovo
  (`@fontsource/ibm-plex-mono`) o l'auto-hosting in `public/fonts/`, e quello **è**
  dipendenza nuova, quindi passa da te per convenzione. Va deciso fuori dall'arco anche
  perché cambia l'aspetto di tutto ciò che oggi usa `--font-mono` (27+ siti) e si merita
  un hard stop visivo suo.
- **C5.3**: conseguenza sulla definition of done, ed è il motivo per cui questa non è una
  questione cosmetica. Le metriche del README ("9 proprietà sopra la piega", "nessuno
  scroll orizzontale da 360px in su", il segmented della multiplicity che non trabocca)
  sono state misurate con IBM Plex Mono che rende davvero. Con Monaco in fallback le
  larghezze cambiano, e Monaco è più largo a parità di px. La DoD va verificata **col
  font che rende effettivamente sul tuo Mac**, e la riga della multiplicity va scritta
  con il `flex: 1 1 0; min-width: 0` che il README prescrive, che è esattamente la
  guardia contro questo caso.

---

## Due questioni operative, fuori ratifica ma da decidere

1. **Dove salvare i due file di design.** Il checkpoint proponeva `docs/design/rail/`, ma
   `docs/redesign/` esiste già e ospita `JJODEL-UI-MASTER-SPEC.md`. Proposta:
   `docs/redesign/rail/` con dentro `README.md` e `Jodel Side Panel.dc.html`.
2. **Il mock è incompleto.** L'HTML fa riferimento a nove fogli di stile in
   `_ds/jjodel-design-system-<uuid>/tokens/*.css` che non sono nell'upload: aperto in un
   browser rende senza il suo design system. Il danno è limitato (il mock ha tutti i
   valori inline, zero `var()`), ma i font e lo `styles.css` di base mancano. O si chiede
   a claude design l'export del bundle, o si accetta il render degradato e lo si annota
   accanto al file.

## Cosa serve da te

Ratifica di:

- **R-RAIL-1**: strada (a), più i corollari C1.1 e C1.2.
- **R-RAIL-2**: registrazione del superamento parziale di U-2.
- **R-RAIL-3**: solo `2a`, più C3.1 (niente gear), C3.2 (parametrico senza rami morti),
  C3.3 (segmented Basic/Advanced resta nella top bar).
- **R-RAIL-4**: coppia `--color-selection-*`, nessuna unificazione, discrepanza dei tre
  cyan registrata come voce DS.
- **R-RAIL-5**: consumo dei token tipografici, caricamento dei font fuori arco, DoD
  verificata col font reale.

Più le due questioni operative. Col tuo ok genero il prompt di discovery Fase 0 per Claude
Code: verifica dei residui non decidibili da origin (stato locale di Slice C, mappatura
puntuale dei 32 letterali del mock sui token, quale dei due sistemi di token consumare,
ancore di montaggio per lo slot polimorfo), con report obbligatorio in `docs/discovery/`
e naming `discovery_2026-08-10_rail_fase0.md`.
