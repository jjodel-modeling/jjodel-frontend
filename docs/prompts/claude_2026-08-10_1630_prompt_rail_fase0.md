# Prompt Claude Code: Fase 0 (discovery read-only) dell'arco "rail destro"

**Nome canonico del documento prompt**: `2026-08-10 16:30`
**Tipo**: discovery read-only. Nessuna modifica a `frontend/src/`.
**Ratifiche a monte**: R-RAIL-1..R-RAIL-5 con i corollari C1.1, C1.2, C3.1, C3.2, C3.3,
C5.1, C5.2, C5.3, ratificate da Alfonso il 2026-08-10. Memo di riferimento:
`docs/ratifiche/` se già migrato, altrimenti il Project Knowledge
`claude/2026-08-10_memo_ratifica_arco_rail.md`. Le ratifiche non si rimettono in
discussione qui: se un accertamento le contraddice, il report lo segnala e si ferma.

---

## 0. Contesto

Si apre l'arco di redesign del rail destro del project editor. Oggi il rail è
`PropertiesWithTreeView.tsx`: due card flottanti sovrapposte (PROPERTIES e TREE VIEW),
con header, ombra e bordo ciascuna. Il redesign le fonde in un rail unico e continuo.

L'arco 1 consegna **solo il preset `2a`** ("Adaptive rail"): tree pane che collassa
quando si mette a fuoco un elemento, inspector sempre visibile, nessun gear, nessun
picker di layout, nessuna lista Recent, nessun tab. `2a` è sia il layout della modalità
Basic sia il default di Advanced, quindi copre entrambe le modalità senza rami
condizionali.

**Questa fase non scrive codice.** Serve a stabilire cinque cose che nessuno può dare per
scontate: cosa c'è nel working tree locale, quale sistema di token consumare, quali valori
del design hanno davvero un token, dove si innesta l'inspector polimorfo, e da dove
arrivano i dati che il rail deve mostrare. Il prompt di implementazione esce dopo, in
chat, a partire dal report.

---

## 1. COSA

Sette accertamenti (D1..D7), un report scritto su file, hard stop.

Il report va in `docs/discovery/discovery_2026-08-10_rail_fase0.md`. Se la data di
esecuzione è diversa dal 2026-08-10, usa la data di esecuzione nel nome. Se esiste già un
file con quel nome, aggiungi il suffisso `_2`.

**L'hard stop non è raggiunto finché il report non è scritto.** L'analisi in chat parte
dal file salvato, non dal tuo output di terminale.

---

## 2. DOVE

Perimetro di lettura. Le ancore sono già state verificate su `origin/alfonso-frontend-jjtl`
a `abc0182`: sono riportate qui perché tu non le riscopra bruciando context, ma vanno
riverificate sul tuo HEAD, che può essere avanti.

**Rail attuale**

- `frontend/src/components/editors/PropertiesWithTreeView.tsx` (648 righe su `abc0182`)
- `frontend/src/components/editors/properties-with-tree-view.scss` (1375 righe)
- montato una volta sola: `frontend/src/pages/components/Dashboard.tsx:627`,
  come `<PropertiesWithTreeView mode='floating'/>`

**Contenuto delle due card**

- card PROPERTIES: header a `:449-459` (lo slot `properties-panel-header__actions` a
  `:459` è quello che C-3 ritira), body a `:477` con `<Info>` **più** la sezione NODE
  (`properties-node-section`, resa solo se `advanced`, contiene `<NodeEditor/>`)
- card TREE VIEW: header a `:548`, body a `:568` con `<TreeViewContent/>`
- `frontend/src/components/editors/Info.tsx` (la card astratta; `props-section__title`
  vive a `:49`)
- `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx`

**Pannelli di view authoring** (per R-RAIL-1, da NON modificare)

- `frontend/src/components/editors/views/ViewData.tsx` (importa i pannelli a `:28-30`,
  portale a `:203` e `:223`)
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/RowAuthoringPanel.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/EnableIRPanel.tsx`

**Token e metadati**

- `frontend/src/styles/tokens/` (11 file SCSS, ~1500 righe)
- `frontend/src/styles/tokens.css` (293 righe, 80 custom property `--color-*`)
- `frontend/src/common/entityMeta.ts` (270 righe)
- `frontend/src/styles/tokens/_typography.scss:13,16` (`--font-sans`, `--font-mono`)
- `frontend/src/styles/tokens/_colors-light.scss:205` (`--color-canvas-accent`),
  `:349-353` (blocco Selection)

**Modalità**

- `frontend/src/components/ModeSystem/ModeToggle.tsx`

---

## 3. COME: i sette accertamenti

### D1. Stato del working tree e della coda locale

Origin è a `abc0182` e **non contiene nessun commit di Slice C**: gli hash
`6b8e91d73`, `473813c5f`, `47603c613`, `a801403ba` citati nel checkpoint non esistono
nella storia remota, e non c'è nessun `refactor(properties)` in cronologia. Contiene
invece `ab90ed0` e `5c6c2f3` coi loro hash originali, più quattro commit di docs del 10/8.

Riporta, senza modificare nulla:

- `git fetch` seguito da `git log origin/alfonso-frontend-jjtl..HEAD --oneline`
- `git status --short` (stato sporco preesistente, se c'è)
- quali dei commit di Slice C (Commit 1 titoli/FormSection, Commit 2, Commit 3 label dei
  toggle) sono a HEAD locale e quali no

Perché conta: Slice C tocca `ViewData.tsx` e, per C-3, anche
`PropertiesWithTreeView.tsx:459`. Sono gli stessi file che l'arco del rail riscrive. Se
Slice C è in volo e non pushata, l'ordine dei due archi è una decisione, non un dettaglio.
Il report deve dire quale dei due tocca per primo quali file.

### D2. Quale sistema di token si consuma

Ci sono due sistemi in casa: `frontend/src/styles/tokens/*.scss` e
`frontend/src/styles/tokens.css`. Stabilisci, con le ancore:

- chi importa cosa, e in quale ordine di cascata
- se i due definiscono le stesse custom property con valori diversi, e dove
- **qual è la regola per un componente nuovo**: cosa deve importare un file SCSS scritto
  oggi per avere accesso ai token, e con quale sintassi (`var(--x)` o `$x`)

Deliverable: una regola in una frase, più il file da importare. Se la regola non è
deducibile dal codice (per esempio perché entrambi i sistemi sono vivi e nessuno vince),
dillo esplicitamente: è una decisione per la chat, non una da prendere in autonomia.

### D3. Mapping dei valori del design sui token esistenti

È il deliverable centrale della Fase 0. Il documento di design afferma che ogni valore
esiste già come token. In chat è già emerso che **non è vero per tutti**: il tuo compito è
quantificare esattamente il buco.

Produci una tabella con una riga per valore, quattro colonne:
`valore del design` | `token esistente` | `file:riga` | `classificazione`.

Classificazione, tre soli valori ammessi:

- `token` (esiste, si consuma)
- `snap` (non esiste, ma esiste un valore vicino sulla scala: indica quale e di quanto si
  discosta)
- `nuovo` (non esiste e non c'è niente di vicino: servirebbe un token nuovo)

Valori da mappare, presi dalla sezione "Design Tokens" del documento di design:

**Colori (15)**: `#ffffff`, `#f8fafc`, `#fcfdfe`, `#f1f5f9`, `#eef2f7`, `#e2e8f0`,
`#cbd5e1`, `#94a3b8`, `#64748b`, `#475569`, `#334155`, `#0f172a`, `#e0f7fa`, `#0891b2`,
`#22c55e`.

Due sono già accertati: `#e0f7fa` è `--color-selection-bg` e `#0891b2` è
`--color-selection-bar`, entrambi in `_colors-light.scss:352-353`. Conferma e completa
gli altri tredici.

**Raggi (7)**: 4, 6, 7, 9, 10, 12, 99px. La scala in `_radius.scss` è 0 / 4 / 8 / 12 / 16
/ 24 / 9999: quattro dei sette raggi del design (6, 7, 9, 10) cadono fuori scala.
Conferma, e per ciascuno proponi `snap` (a quale gradino) oppure `nuovo`.

**Ombre (4)**: `0 4px 16px rgba(15,23,42,0.07)` (rail), `0 12px 32px rgba(15,23,42,0.16)`
(popover, non serve nell'arco 1 ma mappalo), `0 0 0 3px rgba(51,65,85,0.06)` (anello di
focus), `0 1px 2px rgba(15,23,42,0.2)` (knob dello switch). I token in `_shadows.scss`
sono costruiti su `rgba(0,0,0,·)`, non su slate: verifica se esiste una famiglia
slate-tinted altrove prima di classificarle tutte `nuovo`.

**Tipografia**: 19 / 14 / 13 / 12 / 11px sans, 12 / 11 / 10px mono, pesi 500 / 600 / 700,
eyebrow 11px/600 uppercase con `letter-spacing: 0.08em`. Verifica cosa di questo esiste in
`_typography.scss` come scala.

**Altezze di riga**: 26 (tree), 28 (multiplicity), 30 (campo del form, disclosure), 34
(footer, breadcrumb), 36 (filtro), 44 (header). Verifica se `_spacing.scss` ha una scala
di altezze di controllo o solo di spaziatura.

**Motion**: 150ms e 250ms su `cubic-bezier(0,0,0.2,1)`. Verifica `_transitions.scss`.

**Coppie entity**: il design usa le coppie di `entityMeta.ts` (metamodel violet, package
blue, class red, attribute green, reference cyan, operation indigo, enum amber). Verifica
coppia per coppia contro `ENTITY_META` e segnala le divergenze. Una nota già emersa da
riportare nel report: `#0891B2` è **sia** `--color-selection-bar` **sia**
`entityMeta.reference.badgeText` (`entityMeta.ts:161`), quindi su una riga Reference
selezionata la barra di selezione e il testo del badge coincidono di colore. Non è un bug,
ma va deciso consapevolmente.

Chiudi la tabella con tre conteggi: quanti `token`, quanti `snap`, quanti `nuovo`.

### D4. Ancore per l'inspector polimorfo (R-RAIL-1, strada (a))

La ratifica dice: il rail è un guscio (header, tree pane, identity block, posture, footer)
e l'inspector è uno slot che dispaccia sul tipo di selezione. L'arco 1 scrive un solo
renderer, quello dell'elemento di metamodello; i pannelli di authoring entrano nello
stesso slot **così come sono**.

Accerta e riporta:

- cosa attraversa oggi il confine fra `PropertiesWithTreeView` e ciò che renderizza:
  props (`mode`, `overrideSelected`, `onInternalNavigate`, pin), custom DOM event
  (`JjodelEvents.PROPERTIES_PIN_VIEW` e ogni altro che passa di lì), il portale di
  `ViewData.tsx`, le chiavi di `localStorage` (`jjodel_property_panel_visible`,
  `jjodel_property_panel_width`, e ogni altra)
- **chi decide oggi quale corpo mostrare**: la logica di dispatch su tipo di selezione,
  dove sta e su cosa discrimina
- quali di questi contratti sopravvivono a un rail unico e quali no (in particolare: due
  larghezze e due visibilità separate diventano una sola; dillo esplicitamente con le
  ancore)

### D5. Dati per il tree e per l'identity block

Il design chiede al tree cose che oggi il tree potrebbe non avere. Per ciascuna, dì se il
dato è già disponibile a `TreeViewContent` o va risalito:

- **suffisso di tipo in mono** sulla riga (`": EString [0..1]"`): esiste già come dato, o
  oggi è una label inline diversa?
- **conteggio elementi** per la riga del filtro ("16 items", "4 of 16")
- **filtro** che appiattisce a depth 0: esiste già una ricerca nel tree?
- **corsivo per i classificatori astratti**: il flag è disponibile sulla riga?
- **badge lettera** per tipo: già da `entityMeta`, o da una mappa locale del tree?

Per l'identity block (corollario C1.2), accerta se per un elemento di metamodello e per
una view sono disponibili: badge/lettera, nome, "kind" (per le view: la natura IR Vertex /
Row / Edge), e la firma da mettere nel chip (per un feature tipato `EString [0..1]`; per
una view, la metaclasse di applicazione). Se per le view il dato non è raggiungibile a
quel livello, dillo: l'alternativa ratificata è rendere l'identity block opzionale, non
inventarlo.

### D6. Selezione e sincronia col canvas

- chi è la sorgente di verità della selezione, e come la si legge da un componente del rail
- quali eventi la propagano, e se la propagazione è bidirezionale (canvas → pannello e
  pannello → canvas)
- dove sta oggi `.tree-row--selected`, l'unico consumatore dichiarato dei token di
  selezione (vedi il TODO in `_colors-light.scss:350-351`)
- se esiste già un concetto di "elemento a fuoco" distinto da "elemento selezionato"

Serve perché la postura Focus di `2a` si attiva sulla selezione di una foglia: senza
sapere da dove arriva l'evento di selezione, la postura non è implementabile.

### D7. Modalità Basic / Advanced

Il segmented **resta nella top bar** (corollario C3.3): non va spostato. Ma il pannello
deve continuare a reagire alla modalità. Accerta:

- come si legge oggi la modalità da dentro il pannello (`PropertiesWithTreeView` la usa
  già per gating della sezione NODE: da dove arriva?)
- se è hook, context o store, e qual è l'API esatta
- quali altre parti del rail sono già gated su `advanced`

---

## 4. Vincoli

**Read-only su `frontend/src/`.** Nessun edit, nessun rename, nessuna creazione di file
sorgente. Gli unici due file che puoi scrivere sono il report di discovery e l'entry di log.

**Niente `git add .`.** Se committi, committi esattamente:

```
git add docs/discovery/discovery_2026-08-10_rail_fase0.md docs/claude-code-log.md
```

e nient'altro, con messaggio `docs: fase 0 discovery for the right-rail redesign arc`.
Se `git status --short` mostra lavoro non committato preesistente (probabile: vedi D1),
**non committare affatto**: lascia i due file non tracciati, dillo nel report e fermati.
Un commit sopra Slice C in volo è peggio di nessun commit.

**Entry in `docs/claude-code-log.md`.** Il gate `check:docs` valida il formato: riproduci
il template esattamente come lo trovi nelle entry esistenti, **inclusi i trattini lunghi
nelle intestazioni e nei campi**. Sono formato validato da `frontend/scripts/gates/check-docs.ts`,
non stile: non "correggerli". Campi attesi per questa entry:

- intestazione `## 2026-08-10 — docs: fase 0 discovery dell'arco rail destro`
- `**Corregge**: —` e `**Causa**: —`
- `**Layer Impact Report**: not-required` (nessun file di §3.1: né `useJjomSync.ts` né
  `portDistribution.ts` sono nel perimetro)
- `**Smoke visivo**: non applicabile` (nessuna modifica di resa)
- `**Prompt document name**: 2026-08-10 16:30`

**Gate**: esegui `npm run check:docs` prima di chiudere. Nessun altro gate serve, non
avendo toccato sorgenti.

**Il documento di design potrebbe non essere nel repo.** I due file (`README.md` e
`Jodel Side Panel.dc.html`) oggi vivono solo come upload di chat; la destinazione decisa è
`docs/redesign/rail/`. Questo prompt è autocontenuto: tutti i valori che ti servono sono
sopra. Se trovi i file in `docs/redesign/rail/` puoi leggerli, ma non ne dipendi, e
soprattutto **non ricavare requisiti dalle sezioni `1a`, `1b`, `3a` del mock**: sono
esplorazione, non specifica.

**Non proporre implementazioni nel report.** Il report accerta e misura. Le scelte di
disegno che emergono (in particolare cosa fare dei raggi e delle ombre senza token) si
prendono in chat, dopo.

---

## 5. RIFERIMENTI

Ancore verificate su `abc0182`, da riverificare sul tuo HEAD:

| Fatto | Ancora |
|---|---|
| il codice sta sotto `frontend/` | la root del repo non ha `src/` |
| coppia di selezione | `_colors-light.scss:352-353`, `--color-selection-bg: #e0f7fa`, `--color-selection-bar: #0891b2`, col TODO a `:350-351` |
| accent del canvas, hue diverso | `_colors-light.scss:205`, `--color-canvas-accent: #06b6d4` |
| accent interattivo DS | `tokens.css:42`, `--color-sky-500: #0ea5e9` |
| famiglie tipografiche dichiarate | `_typography.scss:13` (`--font-sans`), `:16` (`--font-mono`) |
| font non caricati | `@fontsource-variable/inter@^5.2.6` in `frontend/package.json` ma zero import in `src/`; nessun `@font-face` per Inter o IBM Plex; `frontend/index.html` carica da Google solo JetBrains Mono; `public/fonts/` contiene solo icomoon |
| scala dei raggi | `_radius.scss:12-18`, 0 / 4 / 8 / 12 / 16 / 24 / 9999 |
| ombre su nero puro | `_shadows.scss:33-37` |
| coppie entity | `entityMeta.ts:60-200`, `ENTITY_META` |
| doppio ruolo di `#0891B2` | `entityMeta.ts:161` (reference badgeText) e `_colors-light.scss:353` (selection bar) |
| montaggio del rail | `Dashboard.tsx:627` |
| slot del portale | `PropertiesWithTreeView.tsx:459`, consumato da `ViewData.tsx:203,223` |

Specifica di `2a` che il report deve poter dare per nota (non serve rileggerla dal mock):

- rail 420px di larghezza (usabile da 360px), fondo bianco, bordo `0.5px`, raggio 12,
  ombra `0 4px 16px rgba(15,23,42,0.07)`, `overflow: hidden`, colonna flex
- zone dall'alto: header 44px, tree pane, barra breadcrumb 34px (solo in postura Focus),
  inspector, footer 34px. Scorrono solo il tree pane e il corpo dell'inspector
- tree pane: 392px in postura Browse, 0px con `opacity: 0` in Focus, transizione 250ms
- righe del tree 26px, indent `8px + depth * 13px`, badge lettera 16×16, nome 13px/500,
  suffisso di tipo in mono 11px, selezione con fondo `--color-selection-bg` e
  `box-shadow: inset 2px 0 0 var(--color-selection-bar)`
- inspector: identity block (badge 22×22 in Browse, 34×34 in Focus; titolo 14px / 19px;
  kind in maiuscoletto nel colore fg dell'entity; chip di firma in mono), poi corpo con
  `display: grid; grid-template-columns: 84px 1fr; align-items: center; gap: 8px 10px`,
  label 12px allineate a destra, campi da 30px
- multiplicity: un solo segmented a cinque bottoni (`[0..1]` `[1..1]` `[0..*]` `[1..*]`
  `Custom`), ciascuno `flex: 1 1 0; min-width: 0; padding: 0 2px`, 28px di altezza. La
  regola di flex non è cosmetica: senza, le label in mono non si stringono e sfondano il
  rail sotto i 420px
- postura: doppio click sull'header, bottone Focus/Browse, o selezione di una foglia
  (attributo, reference, operation, literal). `Escape` torna sempre a Browse. Anima solo
  l'altezza del tree pane
- il footer porta lo stato di salvataggio reale e un suggerimento di scorciatoia

---

## 6. Definition of done della Fase 0

1. `docs/discovery/discovery_2026-08-10_rail_fase0.md` esiste e contiene: obiettivo, file
   letti con path completi, i sette accertamenti D1..D7 con le ancore, la tabella di
   mapping di D3 coi tre conteggi finali, rischi individuati, domande aperte per Alfonso.
2. Nessun file sotto `frontend/src/` risulta modificato (`git status --short` lo dimostra
   nel report).
3. `npm run check:docs` passa.
4. Entry in `docs/claude-code-log.md` col formato validato.
5. **Hard stop**: ti fermi qui e riporti in chat. Nessun prompt di implementazione parte
   da te.
