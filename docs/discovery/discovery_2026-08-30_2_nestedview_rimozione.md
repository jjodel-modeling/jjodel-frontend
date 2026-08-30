# Discovery 2026-08-30 — `NestedView`, la rimozione

**Data**: 2026-08-30
**Branch**: `alfonso-frontend-jjtl`, HEAD `04a42079c`
**Prompt**: slice di sola rimozione, ratificata a valle di due censimenti concordi
**Base**: `discovery_2026-08-23_nestedview_ui_morta.md` (R-LAY-12),
`discovery_2026-08-23_perimetro_rimozione_nestedview.md` (R-DEAD-1..6),
`discovery_2026-08-30_nestedview_censimento_riverifica.md` (riverifica su HEAD)
**Esito**: **rimosso**. 11 siti su 5 file, zero residui in `src`. `nestedView.scss` intatto,
con verdetto misurato sui selettori che restano orfani. Smoke visivo **byte-identico**.

Strumento: `command grep` (BSD grep), mai il wrapper `ugrep --ignore-files` a cui `grep`
risolve in questa shell. Ogni asserzione di assenza porta il proprio controllo positivo.

---

## 1. Il grep prima — il conteggio è ancora quello

Forma **corretta** del censimento (non il `wc -l` sui file cercati, errore metrologico
registrato in §5 del report di riverifica):

```
command grep -rn "NestedView" --include="*.ts" --include="*.tsx" --include="*.scss" src
    → exit 0, 11 righe su 5 file
```

Identico al 2026-08-30 mattina, riga per riga, con gli stessi numeri di riga. **Nessuna
crescita**, quindi nessuna ragione di fermarsi. Sweep allargato, a chiudere il perimetro:

```
command grep -rn "NestedView" src                                      → 11 (nessun filtro di estensione: stesso insieme)
command grep -rl "NestedView" . (esclusi node_modules, .git, src, docs) → 1 file, ./frontend/dist/assets/index-DqhmTX2C.js
    → artefatto di build, gitignorato (.gitignore:60). Non è un sito.
```

### Il test che i censimenti non avevano visto? non esiste

Il prompt chiede di fermarsi se una prova nomina `NestedView`. Non ce n'è:

```
command grep -rln "NestedView" src --include="*.test.ts" --include="*.test.tsx"   → exit 1, 0 file
    controllo positivo, STESSA forma di comando:
    command grep -rln "describe(" src --include="*.test.ts" --include="*.test.tsx"  → 86 file
    (i file di prova sotto src sono 87; l'86 è segnale, non silenzio)
```

Zero prove da rimuovere, come il prompt anticipava.

---

## 2. I siti rimossi

| # | Sito | Natura | Azione |
|---|---|---|---|
| 1 | `abstract/tabs/TabDataMaker.tsx:9` | commento | nome tolto, la frase resta |
| 2 | `abstract/tabs/TabDataMaker.tsx:64` | commento | nome tolto, la frase resta |
| 3 | `abstract/Dock.tsx:22` | import **commentato**, verso un path inesistente | riga cancellata |
| 4 | `editors/index.ts:8` | re-export dal barrel | riga cancellata |
| 5-9 | `editors/views/NestedView.tsx:41,558,561,563,565` | il file che parla di sé | **file cancellato**, 566 righe |
| 10 | `editors/views/ViewData.tsx:198` | commento | nome tolto, la ragione resta |
| 11 | `editors/views/ViewData.tsx:220` | commento | nome tolto, la ragione resta |

**Nota sui quattro commenti.** Non sono stati cancellati: nominavano `NestedView` dentro una
frase che spiega *perché* il codice è come è, e quella ragione sopravvive al componente. In
`ViewData.tsx:198` la ragione è che il filtro sull'evento serve perché il pannello può essere
montato più di una volta; in `:220` è che il `showBack` di default esiste per un ospite privo
di Tree. Entrambe sono state riscritte senza nome e **senza toccare una riga di codice**: il
`showBack = props.showBack !== false` resta identico. Cancellare il commento avrebbe tolto la
ragione insieme al nome.

Misura di contorno, per onestà sulla frase riscritta: dopo la rimozione l'**unico** mount JSX
di `ViewData` è `Info.tsx:1394`, la Properties card. Il commento riscritto dice «più di una
istanza *può* essere montata», che resta vero come vincolo di progetto — e
`FormAuthoringBody.tsx:389`, fuori perimetro e non toccato, lo afferma già per conto suo.

---

## 3. Il grep dopo

```
command grep -rn "NestedView" --include="*.ts" --include="*.tsx" --include="*.scss" src  → exit 1, 0 righe
command grep -rn "NestedView" src                                                        → exit 1, 0 righe
    controllo positivo, stessa forma: command grep -rn "ViewData" … src                  → 34 righe
```

**Zero residui in `src`.** Gli unici che restano nel repo sono in `docs/`: i tre report di
discovery e le entry di log, cioè esattamente i due luoghi che il prompt ammette.

### Il bundle, che è la prova più forte

`npm run build` (exit 0) ricostruisce `dist/`. Nel bundle **fresco**:

```
command grep -rl "NestedView" dist/                → exit 1, 0 file
    controllo positivo: command grep -rl "view-editor-root" dist/
    → dist/assets/index-BzJZbJmQ.css, dist/assets/index-L3RxnBPO.js
```

Il bundle **stale** lo conteneva ancora (il barrel è importato da `Dock.tsx` e
`ContextMenu.tsx`, quindi il simbolo veniva impacchettato pur non essendo mai reso). Ora non
c'è più, e il controllo positivo prova che la ricerca nel bundle ha segnale.

---

## 4. Verdetto su `nestedView.scss` — non toccato, e i suoi orfani sono contati

Il foglio **non è stato toccato**, come il prompt dispone. Il suo unico importatore ora è
`ViewData.tsx:24`, che è vivo: `command grep -rn "nestedView.scss" src` → una riga sola.

Misura degli orfani (137 token di classe estratti dai selettori del foglio, confrontati con
il testo di ogni `.ts/.tsx/.js/.jsx/.scss/.css` sotto `src` con e senza `NestedView.tsx`):

- **48 token restano senza consumatore per effetto di questa rimozione.** Sono la UI del
  pannello morto: `.viewpoint-box*` (8), `.view-entry*` (11), `.viewpoints-header*` (4),
  `.vp-toggle*` (2), `.viewpoint-radio*` (2), `.viewpoint-checkbox`, `.viewpoint-badge`,
  `.viewpoint-active-toggle`, `.exclusive-vp`, `.overlay-vp`, `.expansion-line`,
  `.feature-badge*` (2), `.priority-booster`, `.priority-clear`, `.single-view-content`,
  `.view-editor-fullsize-content`, `.btn-new`, `.ex-icon`, `.ocl-icon`, `.hover-stuff`,
  `.left-stuff`, `.right-stuff`, `.right-content`, `.inline-row`, `.ps-2`.
- **21 token erano già orfani prima**, e restano tali: `.tree-*` (10), `.breadcrumb-type-badge`,
  `.chevron-holder`, `.mid-stuff`, `.priority-field`, `.vertical-centering`,
  `.view-header-breadcrumb-band`, `.viewpoint-checkbox__custom`, e altri.

Nessuno dei due gruppi è stato rimosso: **è un'altra slice**, e questo report la dichiara
invece di eseguirla.

Due riserve di metodo su questa misura, dichiarate perché la cifra non venga presa per più
di quel che è. (a) Il confronto è per **sottostringa** su tutto il testo dei sorgenti: è
generoso verso la vita, quindi «orfano» qui significa che la stringa non compare da nessuna
altra parte in `src` — un limite superiore alla vita, non una stima. (b) L'estrazione legge i
selettori scritti per esteso; un `&__row` annidato non produce token, quindi il conteggio dei
48 è **per difetto**, non per eccesso. Chi eseguirà la slice del foglio riparte da una misura
sua, sul foglio aperto.

`.ps-2` merita una riga a parte: è una utility Bootstrap, e la sua regola nel foglio è un
override. Resta senza consumatore in `src`, ma la classe continua a esistere nella libreria.

---

## 5. I tre orfani della cascata restano orfani

Fuori perimetro per prompt, e non allargato: `GenericTree` (`forEndUser/Tree.tsx`),
`InternalToggle` (`widgets/Widgets.tsx`), `LockedFeature` (`ModeSystem/LockedFeature.tsx` +
riga 11 di `ModeSystem/index.ts`) perdono con questa rimozione il loro unico consumatore.
R-DEAD-3 resta valida parola per parola, **inclusa la parte che conta**: i file che li ospitano
non si cancellano, perché `Widgets.tsx` tiene `HRule` e `ModeSystem/index.ts` riesporta
`isAdvancedMode`, gate vivo di `ContextMenu.tsx:486`.

---

## 6. Gate

| Gate | Esito |
|---|---|
| `npm run typecheck` | **33 = baseline**, su output completo (`grep -c "error TS"`, non una finestra). `diff` fra la lista di errori prima e dopo: **identica**, riga per riga |
| `npx vitest run` | **1956 passed / 0 failed**, coi 9 file rotti all'import = baseline nota (`window is not defined`, monaco/`PerformanceMetrics`). Invariata rispetto alla slice 2c |
| `npm run build` | **exit 0**, solo il chunk-warning preesistente |
| `npm run smoke` | **12 passed / 0 failed / 3 skipped** = baseline |

---

## 7. Smoke visivo — before/after byte-identico

Lo smoke di `run.ts` non apre il pannello che conta: i suoi tre stati si fermano al canvas.
La resa a rischio è quella di `ViewData`, unico consumatore vivo di `nestedView.scss`, montato
da `Info.tsx` quando si seleziona una view nella Tree View. Sonda dedicata
`scripts/smoke/_tmp_nestedview_removal.ts` (non committata), eseguita **due volte sullo stesso
albero**: una col diff applicato (`after`), una su HEAD ripristinato via `git stash`
(`before`), con l'md5 del diff verificato identico prima dello stash e dopo il pop
(`11241df03fe64721437c22fa69d2a6cb`).

Ancore della misura, scelte per misura e non per intuito: `.view-editor-tabs` e
`.view-entity-header` sono le **due sole** classi emesse da `ViewData.tsx` che
`nestedView.scss` stila in esclusiva (nessun altro `.scss` sotto `src` le nomina). Se il foglio
smettesse di caricarsi cadrebbero ai default — `display: block`, padding a zero.

| Misura | before (HEAD) | after (diff) |
|---|---|---|
| `.view-editor-root` | flex, `rgb(255,255,255)`, 399.0×542.0 | **identico** |
| `.view-editor-tabs` | flex / column, 395.0×502.0 | **identico** |
| `.view-entity-header` | flex, 395.0×40.0 | **identico** |
| tab resi | `Applies to, Structure, Symbol, Form, Source` | **identico** |
| altezza `.view-editor-tab-content` | 458.0 | **identico** |
| controllo negativo: `.viewpoint-box`, `.view-entry`, `.viewpoints-header`, `.single-view-content` nel DOM | 0, 0, 0, 0 | 0, 0, 0, 0 |
| errori di pagina | 4 (boot noto: `init_dash`, `wrong project setup in navbar`) | **gli stessi 4** |

Ritaglio del pannello: `_tmp_nestedview_removal_before.png` e `_tmp_nestedview_removal_after.png`,
**md5 identico** `9c64489c3db9c3af5a4b8b7cda0f6f69`, 37 920 byte entrambi. Non è una schermata
vuota: il pannello rende l'intera Applies to di «IR State base» — nome, Kind, breadcrumb del
viewpoint, Parent view, la sezione MATCHING con la metaclasse `State`.

Il controllo negativo sulle quattro classi vale **0 anche prima**: è coerente col censimento
(il componente non era montato da nessuno) e per questo non è il gate — il gate è l'identità
byte a byte dello screenshot. Il controllo negativo dice solo che la sonda guardava il posto
giusto senza trovarci il morto in nessuno dei due stati.
