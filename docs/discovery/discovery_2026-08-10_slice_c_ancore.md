# Discovery 2026-08-10 — verifica ancore della Slice C (C-3 portale, C-1/U-3 titoli, C-2/U-7 label)

**Fase**: 0 del prompt «2026-08-10 10:30» (Slice C della serie U).
**HEAD**: `abc01825c`, working tree pulito all'apertura della sessione.
**Protocollo**: P1..P9. Questo report chiude la Fase 0 e viaggia col Commit 1 (P4).

---

## 0. Obiettivo e ipotesi sotto falsificazione

Le righe citate dal prompt vengono dalla discovery dell'8/8
(`discovery_2026-08-08_uniformazione_card_properties.md`) e sono dichiarate **driftate**:
la voce 6 (`a54f3b7c4`, «refactor(i18n): translate scattered UI strings to English») ha
tradotto in inglese le stringhe dei pannelli, e `ViewData.tsx` si è spostato.

Ipotesi sotto falsificazione, una per commit:

- **H-C3** — il portale di `ViewData` sta ancora dove il prompt dice, e `headerActions`
  contiene **solo** back + help.
- **H-C1** — i siti-titolo `div.jj-field-label` sono ~13, nei soli 4 file elencati.
- **H-C2** — le doppie label sono ~16 coppie più 3 casi label-unica.

Esito sintetico: **H-C3 confermata alla riga**, **H-C1 confermata con conteggio 14 (non
13) più 1 sito fuori perimetro**, **H-C2 falsificata sul conteggio**: le coppie sono
**14**, non 16, e i casi label-unica sono **4**, non 3. Nessuna ancora manca; nessuno
STOP da drift. Resta **una domanda bloccante** su C-3 (§5).

---

## 1. File letti (path completi, tutti a HEAD `abc01825c`)

Sorgenti:

- `frontend/src/components/editors/views/ViewData.tsx` (intero, 298 righe)
- `frontend/src/components/editors/PropertiesWithTreeView.tsx` (:400-509)
- `frontend/src/components/editors/Info.tsx` (:885-902, :1165-1210, :1280-1310)
- `frontend/src/components/editors/viewpoint/properties/ViewpointProperties.tsx` (grep header)
- `frontend/src/components/editors/views/NestedView.tsx` (:493)
- `frontend/src/components/HelpButton.tsx` (intero)
- `frontend/src/components/ui/FormSection/FormSection.tsx` + `FormSection.module.css` (interi)
- `frontend/src/components/ui/Toggle/Toggle.tsx` + `Toggle.module.css` (interi)
- `frontend/src/components/editor-v2/viewpoint/authoring/MatchingSection.tsx` (intero)
- `frontend/src/components/editor-v2/viewpoint/authoring/EnableIRPanel.tsx` (intero)
- `frontend/src/components/editor-v2/viewpoint/authoring/RowAuthoringPanel.tsx` (:240-417)
- `frontend/src/components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx` (:430-765)
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (:285-429)
- `frontend/src/components/editor-v2/viewpoint/authoring/FieldCompartmentListEditor.tsx` (:165-269)
- `frontend/src/components/editor-v2/viewpoint/authoring/LabelEntryEditor.tsx` (:50-110)
- `frontend/src/components/editor-v2/viewpoint/authoring/BadgeListEditor.tsx` (:58-112)

Fogli di stile:

- `frontend/src/components/editors/properties-with-tree-view.scss` (:260-345, :360-445)
- `frontend/src/components/editors/info-improvements.scss` (:860-915)
- `frontend/src/components/editors/views/nestedView.scss` (:3645-3730)
- `frontend/src/styles/components/_form-system.scss` (:940-975)
- `frontend/src/components/commandbar/commandbar.scss` (:15-30, :300-315)

Storia:

- `git show cc1cb51b1` — «style(panels): rework properties card header and form controls»,
  il commit che ha **introdotto** il portale il 31/7. Contiene lo stato pre-portale del
  markup e delle regole SCSS, ed è la fonte più affidabile su «dove torna il back».

Documenti: `docs/decisions.md` (sezione arco U: Q4, Q5, Q7), `docs/PROTOCOL.md`,
`docs/claude-code-log.md` (ultime 6 entry), `discovery_2026-08-08_uniformazione_card_properties.md`
(§D1, §D3, §D6).

**Nota**: `claude/2026-08-10_memo_slice_c_u3_u7.md` **non esiste nel repo** (la cartella
`claude/` non è tracciata qui). Le ratifiche C-1..C-3 sono state ricostruite dal prompt e
da Q4/Q5/Q7 in `docs/decisions.md`, che concordano.

---

## 2. Censimento per il Commit 1 — C-3, portale (Q4)

### 2.1 Le tre ancore del prompt: tutte esatte

| Ancora attesa | Trovata a | Esito |
|---|---|---|
| `useState` di `headerSlot` ~:201 | `ViewData.tsx:201` | ✅ esatta |
| `document.querySelector('.properties-panel-header__actions')` ~:203 | `ViewData.tsx:203` | ✅ esatta |
| `createPortal(headerActions, headerSlot)` ~:223 | `ViewData.tsx:223` | ✅ esatta |
| slot host `PropertiesWithTreeView.tsx` ~:459 | `PropertiesWithTreeView.tsx:459` | ✅ esatta |

### 2.2 Cosa contiene `headerActions` — solo back e help

```tsx
const headerActions = (                                       ViewData.tsx:206-213
    <>
        <CommandBar>
            <Btn icon={'back'} action={() => props.setSelectedView(undefined)} tip={'Back'}/>
        </CommandBar>
        <HelpButton helpKey="properties-panel" />
    </>
);
```

Nient'altro. La condizione di STOP del prompt («se il censimento mostra che
`headerActions` contiene altro, fermarsi e chiedere») **non scatta**.

### 2.3 Chi legge `.properties-panel-header__actions` — un solo lettore

`grep -rn "properties-panel-header__actions" frontend/src` → 3 occorrenze:

- `PropertiesWithTreeView.tsx:459` — la definizione dello slot (`<div … />`, vuoto)
- `properties-with-tree-view.scss:286` — la regola di stile dello slot
- `ViewData.tsx:203` — **l'unico lettore**

Ritirato il portale, lo slot resta senza lettori JS.

### 2.4 Stato pre-portale, dal commit che l'ha introdotto

`git show cc1cb51b1` documenta esattamente la configurazione a cui Q4 vuole tornare per
il back. Markup rimosso da quel commit:

```tsx
<div className="props-header props-header--view">
    <CommandBar>
        <Btn icon={'back'} action={() => props.setSelectedView(undefined)} tip={'Back'}/>
    </CommandBar>
    …path-list… …jj-type-badge…
    <HelpButton helpKey="properties-panel" />        ← ultimo figlio, inline
</div>
```

E SCSS rimosso/spostato dallo stesso commit:

```scss
// PRIMA (sotto .props-header--view)
.props-header--view {
    border-bottom: 1px solid $pc-slate-100;
    .command-bar .tab-btn.back::before { border-color: transparent; }
    …
}
// DOPO (sotto lo slot, con due regole, una delle quali NUOVA)
.properties-panel-header__actions {
    display: inline-flex; align-items: center; gap: 4px;
    .command-bar { margin-bottom: 0; height: 24px; }              ← nuova nel commit
    .command-bar .tab-btn.back::before { border-color: transparent; }  ← spostata
}
```

**Conseguenza operativa non scritta nel prompt**: le due regole SCSS sono attaccate al
**bottone**, non allo slot. Se il back torna inline e le regole restano dove sono:

1. il back **riprende la cornice** (`.tab-btn.back::before` ha
   `border: 1px solid var(--color-bg-tertiary)`, `commandbar.scss:306`) — regressione
   visiva rispetto a oggi;
2. il glifo si alza di ~5px rispetto alla linea di centro, perché `.command-bar` ha
   `margin-bottom: 10px` (`commandbar.scss:23`) dentro una riga
   `.props-header { height:40px; display:flex; align-items:center }`
   (`info-improvements.scss:865-878`): flex centra il margin box (24+10=34px).

Il commit `cc1cb51b1` chiama questo spostamento «the rule follows the button up here».
La proposta è simmetrica: **le regole seguono il bottone giù**, entrambe sotto
`.props-header--view`. Costa un file in più nel diff
(`properties-with-tree-view.scss`), che il prompt non elenca ma che P2 copre come
«strettamente necessario»: senza, il risultato visivo del Commit 1 è peggiore di oggi.
Il punto 2 è in più rispetto al pre-portale (prima della riga 31/7 la neutralizzazione
del margine non esisteva): tenerla è una scelta, e la registro qui.

### 2.5 Il difetto che Q4 cita è reale e ha un effetto osservabile

`ViewData` è montato da **due** host:

- `Info.tsx:1194`, dentro la card Properties (che possiede lo slot);
- `NestedView.tsx:493`, il tab «Viewpoints» del pannello destro, che **non** possiede
  alcuno slot.

Poiché il lookup è `document.querySelector` **globale** con deps `[]`, quando entrambi
sono montati il `ViewData` di `NestedView` **portala back e help dentro la card
Properties**, cioè in un header che non è il suo. Il ritiro del portale corregge questo
di conseguenza, non solo per igiene.

### 2.6 ⚠️ Il rischio vero del Commit 1: help duplicato sulla card astratta

Oggi l'help vive in **due righe diverse a seconda del contenuto della card**
(asimmetria già registrata in §D1 punto 5 della discovery dell'8/8):

| contenuto della card | riga 1 (`PROPERTIES`) | riga 2 |
|---|---|---|
| elemento astratto | slot vuoto | `PropertiesHeader` → `HelpButton` (`Info.tsx:899`) |
| view selezionata | back + help **portalati** | `props-header--view` (nome + badge) |
| viewpoint selezionato | slot vuoto | `ViewpointProperties`: **nessun header, nessun help** |

Q4 dice «l'help va all'host (riga PROPERTIES)». Se l'host rende `HelpButton` in modo
statico nella riga 1, sulla card astratta compaiono **due** help con lo stesso
`helpKey="properties-panel"`, a ~40px di distanza verticale: riga 1 (host) e riga 2
(`Info.tsx:899`). Il gate del Commit 1 chiede «nessun elemento duplicato, **su entrambe
le card**» — quindi il duplicato va evitato, e l'unico modo è togliere anche
`Info.tsx:899`. Vedi la domanda in §5: è l'unico punto che non posso decidere da solo,
perché `Info.tsx` non è nel perimetro dichiarato del prompt.

Effetto collaterale accettabile in ogni caso: con l'help statico nella riga 1, il
viewpoint selezionato **guadagna** un help che oggi non ha. Non è un duplicato ed è
coerente con Q4.

---

## 3. Censimento per il Commit 2 — C-1 opzione (a), titoli (U-3)

### 3.1 Criterio applicato

Sito-titolo = `<div className="jj-field-label">` (elemento `div`, **mai** `label`) che
intesta un gruppo di campi. Label di campo = `<label className="jj-field-label">` dentro
un `.jj-field`. Il criterio del prompt (ruolo nel markup) e la forma del tag coincidono
al 100% su tutti i siti: **nessun caso ambiguo**.

### 3.2 I 14 siti-titolo nei 4 file del prompt (attesi ~13)

| # | file:riga | testo | marginTop inline | cosa intesta |
|---|---|---|---|---|
| 1 | `MatchingSection.tsx:75` | `Matching` | 4 | HelpText + 4 `.jj-field` (metaclassi, condizione, priorità, esclusiva) |
| 2 | `RowAuthoringPanel.tsx:265` | `IR Row view authoring` | 4 | **titolo di pannello**: HelpText + 2 blocchi errore |
| 3 | `RowAuthoringPanel.tsx:284` | `Matching` | 8 | 3 `.jj-field` (metaclassi, condizione, priorità) |
| 4 | `RowAuthoringPanel.tsx:364` | `Template` | 8 | `ListEditor` + 2 `.jj-field` (visible condizionale, label) |
| 5 | `RowAuthoringPanel.tsx:409` | `Source` | 8 | `IRSourceBody` |
| 6 | `EnableIRPanel.tsx:71` | `IR authoring` | 4 | ramo early-return: solo un HelpText |
| 7 | `EnableIRPanel.tsx:111` | `IR authoring` | 4 | **titolo di pannello**: HelpText + errore + 3 `.jj-field` |
| 8 | `EdgeAuthoringPanel.tsx:449` | `IR Edge view authoring` | 4 | **titolo di pannello**: HelpText + 2 blocchi errore |
| 9 | `EdgeAuthoringPanel.tsx:470` | `Matching` | 8 | 3-4 `.jj-field` (metaclasse, reference se non-object, condizione, priorità) |
| 10 | `EdgeAuthoringPanel.tsx:601` | `Endpoints` | 8 | HelpText + 2 `.jj-field` + HelpText finale (**solo ramo `isObject`**) |
| 11 | `EdgeAuthoringPanel.tsx:646` | `Line` | 8 | 4 `.jj-field` (color, width, dash, routing) |
| 12 | `EdgeAuthoringPanel.tsx:706` | `Ends` | 8 | 2 `.jj-field` (start, end) |
| 13 | `EdgeAuthoringPanel.tsx:729` | `Label` | 8 | 1 `.jj-field` (toggle center label + editor) |
| 14 | `EdgeAuthoringPanel.tsx:757` | `Source` | 8 | `IRSourceBody` |

Corrispondenza col censimento dell'8/8: identica come insieme, con il drift atteso di
`+1` su Edge (448→449, 469→470, 600→601, 645→646, 705→706, 728→729, 756→757) e su Row
(264→265, 283→284, 363→364, 408→409); `MatchingSection:75` ed `EnableIRPanel:71,111`
invariati. **Il conteggio corretto è 14, non 13**: il prompt sottostima di uno.

### 3.3 Un 15° sito-titolo, FUORI dai 4 file — non toccato

`frontend/src/components/editors/views/ViewData.tsx:143`

```tsx
<div className="jj-field-label" style={{ marginTop: 4 }}>IR authoring</div>
```

È il ramo di fallback per una `ir.kind` non ancora autorabile. Stesso ruolo, stessa
forma, ma `ViewData.tsx` non è tra i file del Commit 2 → **lasciato invariato** (regola
1). Lo segnalo perché dopo il Commit 2 sarà l'unico titolo del pannello view ancora reso
col vecchio meccanismo. Voce di rifinitura per una slice successiva.

### 3.4 Il wrapping è NON banale in 14 siti su 14 — l'aritmetica

`FormSection` (`ui/FormSection/FormSection.tsx`) non è un titolo: è una **sezione con
figli**.

```tsx
<section className={styles.section}>
  <h3 className={styles.title}>{title}</h3>
  {divider && <div className={styles.divider} />}
  <div className={styles.content}>{children}</div>
</section>
```

`FormSection.module.css`: `.section { margin-top:24px }` (`:first-child` → 0),
`.title { 12px/700/uppercase/0.07em/#64748b; margin:0 0 12px }`,
`.content { display:flex; flex-direction:column; gap:12px }`.

Quindi ogni conversione **sposta i fratelli che seguono il titolo dentro `children`**:
non è una sostituzione di un elemento, è un'incapsulazione. Conseguenza misurabile sul
ritmo verticale, con `.jj-field { margin-bottom:14px }` (`_form-system.scss:945-948`):

| distanza fra due campi consecutivi | oggi | dopo, tenendo `marginTop:8` | dopo, togliendolo |
|---|---|---|---|
| `.jj-field` → `.jj-field` | 14 + 8 = **22px** | 14 + 12 (gap) + 8 = **34px** | 14 + 12 = **26px** |

**Proposta**: togliere il `style={{ marginTop: N }}` **solo** dagli elementi che
diventano figli diretti di `.content`, perché il `gap:12px` è esattamente ciò per cui
quel margine esisteva. Il risultato coincide con il pattern già standard di
`VertexAuthoringPanel` (9 call site: i `.jj-field` dentro `FormSection` **non** portano
`marginTop`, es. `:345`, `:358`, `:399`). Non tocco i `marginTop` annidati più in
profondità (es. `MatchingSection.tsx:103`, `:126`), che non sono figli di `.content`.

Registro che questo è **oltre la lettera** del prompt («sostituire il `div.jj-field-label`
con `FormSection`»): tenerli darebbe +12px di aria per ogni coppia di campi in 14
sezioni, cioè un layout shift che il gate del Commit 2 vieta esplicitamente.

### 3.5 Tre siti sono titoli di PANNELLO, non di sezione (#2, #7, #8)

`IR Row view authoring`, `IR Edge view authoring` e `IR authoring` non intestano un
gruppo di campi dentro un tab: stanno **sopra** i corpi dei cinque tab e restano visibili
su tutti. I loro `children` naturali sono il blocco introduttivo (HelpText + errori), non
i campi. Conversione comunque possibile e coerente col criterio del prompt (intestano
tutto ciò che segue), con l'effetto di portarli a 12px/700/uppercase come gli altri.
Alternativa scartata: lasciarli `jj-field-label`, cioè esattamente il difetto che U-3
corregge (titolo indistinguibile da una label di campo). **Li converto, e lo segnalo.**

### 3.6 Fuori perimetro, per ratifica

- `props-section__title` (`Info.tsx:49`, card astratta) — migra con l'unificazione dei
  pannelli, non qui.
- `VertexAuthoringPanel.tsx` — già conforme, 9 `FormSection`, non toccato.
- Nessun rename di classi CSS (regola 2): `jj-field-label` resta ovunque sia label di
  campo, e le regole di `properties-with-tree-view.scss:372-375` restano invariate.

### 3.7 File toccati dal Commit 2 (regola 19: > 5 file)

Sono **4** file sorgente: `MatchingSection.tsx`, `RowAuthoringPanel.tsx`,
`EnableIRPanel.tsx`, `EdgeAuthoringPanel.tsx` — più questo report e
`docs/claude-code-log.md`. Sotto la soglia della regola 19 per i sorgenti; l'elenco
per-file col dettaglio del cambiamento sta comunque in §3.2.

Import da aggiungere: `FormSection` è esportato da `components/ui`
(`VertexAuthoringPanel.tsx:4` lo importa già da lì) — in tutti e 4 i file va aggiunto
alla import list esistente di `'../../../ui'`. Aggiunta di import in file già nel
perimetro = normale completamento, non out-of-scope (§21.3).

---

## 4. Censimento per il Commit 3 — C-2, doppie label (U-7, policy Q5)

### 4.1 Conteggio: 14 coppie e 4 label-uniche (attese ~16 + 3)

`grep -rn "<Toggle"` sui pannelli di authoring → 17 istanze **tutte con prop `label`**.
Di queste, 14 hanno sopra una `<label className="jj-field-label">` (coppia) e 3 no.
La 4ª label-unica (`ConditionalEditor.tsx:137`) sta in `components/ui/`, fuori dalla
cartella authoring.

Il numero «16» della discovery dell'8/8 non torna: la sua tabella ha 17 righe, di cui 3
dichiarate label-uniche → 14 coppie. **Correzione registrata.**

### 4.2 Classe 1 — ridondanza pura → via la prop `label` (5 casi)

| # | file | label di campo | prop `label` del Toggle | note |
|---|---|---|---|---|
| 1 | `LabelEntryEditor.tsx:78` / `:84` | `Editable` | `editable inline` | toggle diretto |
| 2 | `LabelEntryEditor.tsx:93` / `:97` | `Visible` | `visible` | dentro `ConditionalEditor.renderValue` |
| 3 | `FieldCompartmentListEditor.tsx:251` / `:255` | `Visible` | `visible` | dentro `renderValue` |
| 4 | `BadgeListEditor.tsx:91` / `:95` | `Visible` | `visible` | dentro `renderValue` |
| 5 | `RowAuthoringPanel.tsx:386` / `:390` | `Visible` | `visible` | dentro `renderValue` |

### 4.3 Classe 2 — ridondanza parziale → via la prop, riscrivendo la label di campo (2 casi)

| # | file | label di campo | prop `label` | riscrittura proposta |
|---|---|---|---|---|
| 6 | `FieldCompartmentListEditor.tsx:241` / `:245` | `Separator` | `row separators` | → **`Row separators`** (indicata dal prompt) |
| 7 | `FieldCompartmentListEditor.tsx:194` / `:202` | `Children filter` | `filter by metaclass (isKind)` | → **`Filter by metaclass (isKind)`** |

Sul #7: `Children filter` da solo perde *come* filtra. `children` è già dato dal contesto
(il campo è reso solo se `comp.source.from === 'children'`, `:192`), mentre `(isKind)`
è informazione viva — distingue il filtro base dal ramo `advanced predicate (preserved)`
(`:196`) ed è il predicato realmente scritto (`forPredicateKind('isKind', classNames)`,
`:201`). Perciò la riscrittura assorbe la seconda label invece di scartarla, com'è per
`Separator` → `Row separators`.

### 4.4 Classe 3 — la seconda label porta informazione → NON toccare (7 casi)

`MatchingSection.tsx:84` (`All metaclasses (*)`), `:122` (`Apply only if (predicate)`),
`:157` (`exclusive`); `RowAuthoringPanel.tsx:290`, `:328`;
`EdgeAuthoringPanel.tsx:476`, `:544`.

`exclusive`/`Exclusive` sembra ridondanza pura ma Q4/Q5 e il prompt lo mettono
esplicitamente in classe 3 («wildcard, predicate, exclusive»): **non si tocca**, e
registro qui che la classificazione è per ratifica, non per analisi.

### 4.5 Label-uniche — NON toccare (4 casi, uno in più del prompt)

| file | prop `label` | perché non si tocca |
|---|---|---|
| `FieldSegmentEditor.tsx:70` | `editable inline` | nessuna label di campo sopra |
| `EdgeAuthoringPanel.tsx:734` | `Center label` | il `.jj-field:730` non ha `<label>`; sopra c'è solo il titolo `Label` |
| `ConditionalEditor.tsx:137` | `Include else branch` | primitivo condiviso, nessuna label di campo |
| `VertexAuthoringPanel.tsx:362` | `Resizable` | **non elencato dal prompt**: sta dentro `FormSection "Sizing"`, senza label di campo → è l'unico nome del controllo |

### 4.6 Effetto visivo della rimozione — da guardare al gate

`Toggle.module.css:.wrapper` è `display:flex; justify-content:space-between`. Con la
label, il testo sta a sinistra e l'interruttore all'estremità destra del `.jj-field`.
**Senza** la label l'interruttore resta figlio unico e `space-between` lo appoggia a
**sinistra**, sotto la label di campo. È il risultato voluto da U-7 (interruttore nudo
sotto il proprio nome), ma è uno spostamento orizzontale di ~300px del pallino: va
guardato, non è un no-op. Nessuna regola della skin B4 tocca il primitivo
(`grep -i toggle properties-with-tree-view.scss` → solo `.properties-panel-toggle-btn`
e `.tree-view-toggle-btn`, altra cosa).

Nessun uso nuovo di `description` (prop mai usata in tutto il repo) e nessuna migrazione
a `jj-toggle-row`, come da ratifica C-2.

---

## 5. Domanda aperta (bloccante per il Commit 1)

**Q-C3.1 — l'help della card astratta.** Q4 manda l'help «all'host (riga PROPERTIES)».
Reso statico lì, sulla card astratta convive con quello di `Info.tsx:899`
(`PropertiesHeader`, riga 2): due help identici nella stessa card, contro il gate
«nessun elemento duplicato su entrambe le card».

Le due uscite:

- **(B)** l'host rende `HelpButton` nella riga 1 **e** si toglie `Info.tsx:899` (più
  l'import `HelpButton` a `Info.tsx:19` se resta inutilizzato). Simmetrico, chiude
  l'asimmetria di §D1 punto 5, soddisfa il gate. **Costo: `Info.tsx` non è nel perimetro
  del prompt** → regola 1, serve autorizzazione.
- **(C)** l'help resta dov'è per ciascuna card (view: inline nell'header della view,
  come nel pre-portale; astratta: invariata). Perimetro chiuso, ma contraddice la lettera
  di Q4.

Non decido da solo: (B) esce dal perimetro, (C) esce dalla ratifica.

**Risolta da Alfonso il 10/8, prima del Commit 1: opzione (B).** L'help è reso dall'host
nella riga PROPERTIES per entrambe le card e `Info.tsx:899` viene rimosso.
`frontend/src/components/editors/Info.tsx` entra quindi nel perimetro del Commit 1 come
espansione di scope autorizzata (regola 1) e viene dichiarata nel closing report e nella
entry di log.

**Risolta nella stessa sede: R3 (§3.4) = togliere i `marginTop` dei figli diretti.**
Il Commit 2 rimuove `style={{ marginTop: N }}` dagli elementi che diventano figli diretti
di `.content`, allineandosi ai 9 call site di `VertexAuthoringPanel`.

---

## 6. Rischi e dipendenze

- **R1 — SCSS del back (Commit 1)**: senza spostare le due regole di
  `properties-with-tree-view.scss:286-303` sotto `.props-header--view`, il back inline
  riprende la cornice e si alza di ~5px. Il diff del Commit 1 include quindi un file
  SCSS che il prompt non nomina (§2.4).
- **R2 — commento stale (Commit 1)**: `properties-with-tree-view.scss:285` dice «back +
  help, portaled up by ViewData»; `PropertiesWithTreeView.tsx:455-458` dice lo stesso. Il
  secondo lo aggiorno (file nel perimetro); il primo lo aggiorno **solo** se R1 fa
  entrare quel file nel diff, altrimenti resta stale e lo segnalo.
- **R3 — ritmo verticale (Commit 2)**: §3.4. La proposta di togliere i `marginTop` dei
  figli diretti è la sola che non produce layout shift rispetto a oggi.
- **R4 — `EdgeAuthoringPanel.tsx:601` (`Endpoints`)** vive dentro `{isObject && (<>…</>)}`:
  la `FormSection` va **dentro** il fragment, non attorno alla condizione, o la sezione
  comparirebbe vuota sulle view di natura reference.
- **R5 — nessun file di §3.1** (critical zone) è toccato da nessuno dei tre commit:
  niente sync, niente D/L, niente `VersionFixer`, niente `jsxString`. **Layer Impact
  Report: not-required.**
- **R6 — gate**: `typecheck` (baseline 33, Δ0), `build`, `vitest` sull'area. Nessuno dei
  file toccati ha test dedicati: `grep` in `__tests__` non trova `FormSection`, `Toggle`,
  né i pannelli di authoring. La verifica resta il gate visivo di Alfonso.

---

## 7. Stato

Fase 0 chiusa. Ancore verificate, tre correzioni di conteggio registrate (§3.2, §4.1,
§4.5), nessuno STOP da drift. Il Commit 1 attende la risposta a **Q-C3.1**; i Commit 2 e
3 sono eseguibili come descritti.
