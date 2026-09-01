# NAV2 — il picker delle sintassi come listbox custom

**Data**: 2026-09-01
**Prompt**: NAV2 (chat, seriale dopo NAV1), mock su board `Manager Admin Form Bottom.dc.html`
**Esito**: consegnato. Sonda a schermo `_tmp_nav2_verify.ts` **43/43 ALL GREEN**, zero errori
di pagina, chiaro e scuro. Unita' `dataManagerPicker.test.ts` **39/39**.

---

## 1. Il mock citato non e' nel repo

`Manager Admin Form Bottom.dc.html` non esiste sotto `docs/design/` ne' altrove
(`find . -iname "*.dc.html"` da' nove board, nessuna con quel nome). Dichiarato e proceduto
sul resto (RC-10): il prompt porta la specifica in prosa — trigger bianco bordo cyan con
occhio, label e chevron; pannello radius 8; voci con icona a sinistra; selezionata a fondo
`#ecfeff`, testo `#0e7490`, barra inset 3px `#0891b2`, check `bi-check-lg` a destra — e
quella prosa e' stata trattata come normativa. Il referto NAV1 citava la stessa board e non
lo aveva rilevato.

## 2. Il precedente da riusare non era il pannello Columns

Il prompt indicava il pannello Columns di 10i come «il precedente piu' vicino» e chiedeva di
non inventarne un terzo. La misura ne ha trovato uno **piu' vicino ancora**, e gia' condiviso
da tre consumatori:

| Candidato | Cos'e' | Perche' scartato / scelto |
|---|---|---|
| `instance-manager__columns-panel` (10k) | portale su `body` + geometria `fixed` da rect, con `computeColumnsPanelStyle` **suo** e la costante `COLUMNS_PANEL_MAX_W` | e' una lista di checkbox, non un listbox: nessun `role`, nessuna selezione, nessuna tastiera. La sua geometria e' una **seconda** copia dell'idioma |
| `notation-selector__dropdown` | il menu della toolbar accanto | `position: absolute` dentro la barra: e' proprio quello che il rail overlay copre (§4), e non ha ne' selezione ne' tastiera |
| **`InlineEnumSelect` / `InlineObjectSelect` / `ReferencePicker`** | portale su `body`, `role="listbox"` / `role="option"`, frecce, Enter, Esc, `scrollIntoView`, chiusura sui gesti che muovono l'ancora | **scelto**. `computeListStyle` e' esportato da `InlineObjectSelect` ed e' gia' **una** implementazione per tre chiamanti. NAV2 e' il quarto, non una quarta copia |

`computeListStyle` porta con se' il ribaltamento in alto, il clamp al viewport, `position:
fixed` e `z-index: 10000`. La sua `MIN_WIDTH = 140` e' rispecchiata nel foglio come
`min-width: 140px`: se i due divergessero il clamp misurerebbe una scatola diversa da quella
dipinta — l'errore che la costante `COLUMNS_PANEL_MAX_W` esiste per nominare.

## 3. Cosa il `<select>` dava gratis, e come e' stato ripagato

Non e' un elenco di gentilezze: ogni voce mancante sarebbe una **regressione** rispetto al
controllo sostituito.

| Il nativo | Il custom | Asserito |
|---|---|---|
| ruolo e stato | `role="listbox"` + `role="option"` + `aria-selected` | G1, unita' |
| cursore leggibile da AT | `aria-activedescendant` verso id veri | G3 |
| il popup e' annunciato | `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls` | G4 |
| frecce | ArrowUp/ArrowDown di una voce | G6 |
| primo/ultimo | Home / End | G7 |
| **type-ahead** | buffer 700ms; un carattere riparte DOPO il cursore (ripetere una lettera cicla), due o piu' restringono | G8 |
| Esc chiude | Esc chiude **e restituisce il fuoco al trigger** | G9 |
| le frecce aprono | ArrowDown sul trigger apre | G10 |
| il fuoco visibile | `:focus-visible` con `--focus-ring` (3px del DS) | unita' |
| inerte su M2 | `disabled`, e il pannello non apre | B2 |

Il type-ahead e' l'unica di queste che non era nel prompt: e' la sola cosa che un `<select>`
fa e che nessun dropdown custom di questo repo faceva. Su una lista di dieci viewpoint la sua
assenza si sente.

## 4. Il portale risolve, di rimbalzo, il problema del rail

`EditorV2.scss` ancora a destra `.notation-selector__dropdown` dentro
`.toolbar-viewpoint-group` per una ragione misurata: il rail overlay e' `position: fixed`
portato su `<body>`, quindi forma un contesto di impilamento **sopra** quello della barra, e
il suo 900 dipinge sopra un 1000 che vive dentro la toolbar.

Un pannello che sta **anch'esso** su `<body>` e' fratello di quell'overlay, e li' il 10000 di
`computeListStyle` vuol dire quello che dice. Misurato (H1): `elementFromPoint` al centro
dell'ULTIMA voce cade dentro la voce (`hitClass: toolbar-viewpoint-menu__label`), pannello a
`x 824..973, y 87..184` su un viewport 1700x1000, `z-index` calcolato **10000**. La trappola
rc-dock che costo' un giro a NAV1 e al pannello Columns non si ripresenta.

## 5. Due token rifiutati, con la misura in mano

Il prompt autorizzava `--shadow-desk-card` «o il ruolo dropdown se il DS ne dichiara uno». Il
DS ne dichiara uno, `--shadow-dropdown`, e **non e' stato usato**:

- `--shadow-dropdown` e' un alias di `--shadow-lg`, e `--shadow-lg` e' fra i nomi dichiarati
  **sia** da `styles/tokens/_shadows.scss` **sia** da `styles/tokens.css` con valori diversi.
  E' la stessa collisione che `_shadows.scss:57-71` documenta per `--shadow-sm`, misurata a
  schermo il 2026-08-31 sulla card del manager. `tokens.css` la dichiara su un `:root` piatto
  e **senza variante scura**: il token congelerebbe l'ombra chiara anche in scuro.
- `--color-bg-elevated`, il ruolo dichiarato per «Floating panels, dropdowns», in scuro vale
  `rgba(255,255,255,0.04)` — un fondo **traslucido** su un pannello che galleggia sopra la
  tela.

Usati invece: `0 4px 12px var(--color-node-shadow)` (geometria per esteso, colore da un token
che porta la correzione scura e non collide) e `var(--color-form-surface)` (`#ffffff` chiaro /
`#16181a` scuro, opaco su entrambi). Misurato in scuro (J1..J3): pannello
`rgb(22, 24, 26)` opaco, selezione `rgba(6,182,212,0.16)` su testo `#a5f3fc`, barra `#22d3ee`.

La grammatica di selezione e' presa **dai token e non dai letterali del mock**, e in chiaro i
tre risolvono esattamente sui valori nominati: `--color-inode-ref-bg` = `#ecfeff`,
`--color-inode-selected-badge-fg` = `#0e7490`, `--color-selection-bar` = `#0891b2`. Misurato
come pixel calcolato (I3, I4), non letto dal sorgente.

## 6. Il separatore non e' piu' una voce

NAV1 lo aveva fatto `<option disabled>` perche' un `<select>` nativo non ha altro modo di
disegnare un filetto. Nel listbox e' un `<div role="presentation">`: non e' una voce, quindi
non puo' essere evidenziato, non entra negli indici che le frecce percorrono, non ha id e non
ha `aria-selected`. La prova cambia forma con lui (A3, rimappata): non piu' «esiste
un'`<option>` disabilitata» ma «esiste un figlio `role=presentation`, subito prima della voce
del manager, senza id ne' `aria-selected`».

`DATA_MANAGER_SEPARATOR_LABEL` resta in `dataManagerOption.ts` con un `// TODO: cleanup`
(Regola 9): e' il vocabolario che NAV1 ratifico', e la suite unitaria ci asserisce ancora
sopra la forma della sentinella.

## 7. Le asserzioni NAV1, rimappate — e il conteggio corretto

Il prompt parla di «17 asserzioni NAV1». Il numero e' quello del referto NAV1; la sonda
committata ne ha in realta' **22 chiamate a `check`**, 20 delle quali eseguite in un giro
verde (D0 e' condizionale). Dichiarato qui invece che ripetuto.

Nella sonda NAV2 ci sono **tutte**, piu' le nuove: **43 asserzioni, 43 verdi**. Cambiano di
selettore queste, e solo queste:

| # | Prima | Ora | Perche' |
|---|---|---|---|
| SEL | `.dock-tabpane-active … select` | `… .toolbar-viewpoint-trigger` per il trigger; `.toolbar-viewpoint-menu` **senza scoping** per il pannello | il pannello vive su `<body>`, fuori dal pane attivo |
| A1/A2/A4 | `select.options` | i figli `role="option"` del pannello aperto | le voci esistono solo da aperto |
| **A3** | «`<option>` disabilitata prima della voce» | «figlio `role=presentation`, senza id ne' `aria-selected`» | §6 |
| A5 | `select.disabled` | `button.disabled` | — |
| **B2** | «su M2 la voce non e' fra le `option`» | «su M2 il picker e' `disabled` e **non apre**» (click forzato via `.click()` in `evaluate`, che scavalca il puntatore) | con il controllo chiuso non esiste una lista da censire: la prova diventa che la lista non e' raggiungibile |
| C | `selectOption(sentinella)` | apri + click sulla voce | — |
| D | `selectOption(vpId)` | apri + click sulla voce | — |
| F1 | `select.value === store.viewpoint` | `trigger.label !== 'Data manager'` + D2, nuova, che il trigger legga il nome del viewpoint scelto e il wrapper si accenda | un bottone non ha `value` |

Invariati di sostanza: C1..C5 (il gesto e la sentinella fuori dallo store), E1/E2 (la
simmetria con la porta del rail), F2 (il tab del manager non si chiude), D1 (il controllo di
segno opposto). Nuove: C6 (il pannello portato su `<body>` non resta appeso dopo il cambio
tab — il rischio proprio di un portale), G1..G10, H1/H2, I1..I6, J1..J3, D2.

## 8. Due reperti di metodo

**(a) Un campione preso a pannello chiuso non misura lo stato aperto.** Il primo giro dette
`G4 FAIL` con `aria-expanded: "false"`: la sonda leggeva il trigger dallo **step 0**, cioe'
prima del click. Falso rosso, ed e' la stessa classe di errore del `visible=true` di NAV1 —
misurare il soggetto in uno stato che non e' quello asserito.

**(b) Un'attesa troppo corta si scrive come un'assenza.** `F0` uscì rosso con
`present: false` dopo il ritorno al canvas: rc-dock rimonta il pane al cambio tab e i 25s
ereditati da NAV1 non bastavano dopo che il manager era stato attivato due volte. Portata a
45s, verde, con `activePane()` accanto che dichiara **quale** pane e' attivo — perche' un
silenzio su `.dock-tabpane-active` puo' voler dire «tab sbagliato attivo» e non «controllo
assente», e i due si scrivono uguale (CLAUDE.md §5).

## 9. Ampliamento di perimetro dichiarato — `bench_baseline.mjs`

Il perimetro del prompt era «Toolbar.tsx + foglio suo». Un `grep` su
`.toolbar-viewpoint-selector` ha trovato **ventotto** call site: ventisei sono sonde
`_tmp_*` (ignorate da `.gitignore:66`, usa-e-getta per slice), ma **uno e' committato** —
`frontend/scripts/benchmarks/bench_baseline.mjs:199`, che pilota il picker con
`selectOption`.

Peggio: la sua guardia e' `if (await vpSelect.count() > 0)`. Senza intervento sarebbe andata
a zero **in silenzio**, saltando l'attivazione del viewpoint e riportando
`classic_toggle_found: 0` come se il toggle si fosse spostato. Riscritto (apri il trigger,
leggi le voci, clicca), in un commit **separato** perche' sia banale staccarlo se la
decisione e' un'altra.

Le sonde `_tmp_*` non sono state toccate: non sono tracciate, e riscriverle tutte sarebbe
un'espansione senza mandato. Chi ne rianima una trovera' un `count() === 0`.

## 10. Cosa NON e' stato fatto

- **Il bordo cyan a riposo del mock.** Il trigger conserva la grammatica a due stati del
  `<select>`: bordo slate a riposo, bordo cyan + fondo `#f0f9ff` + occhio cyan quando un
  viewpoint e' attivo (`--active`). E' comportamento committato e un segnale vero; il mock
  mostra lo stato acceso. Cambiarlo sarebbe stato un cambio silenzioso di significato
  (Regola 3). Misurato D2: scelto un viewpoint, `activeWrapper: true`.
- **Nessun componente nuovo.** Il controllo vive in `Toolbar.tsx`, come chiedeva il
  perimetro. Un `SyntaxPicker.tsx` sarebbe stato piu' pulito e sarebbe stato un file in piu'
  non richiesto.
- **`InstanceManagerTab.tsx` / `.scss` non toccati** (contesi da 10k/7b). La delega passa
  tutta per `DockManager` e `TabDataMaker`, come in NAV1.
- **`role="combobox"` sul trigger** scartato: il pattern ARIA 1.2 select-only vuole
  `tabindex` e `aria-activedescendant` **sul trigger**, mentre qui il fuoco entra nel
  listbox — che e' l'idioma dei tre controlli gia' in repo. Dichiarare `combobox` senza il
  resto sarebbe stato peggio di `aria-haspopup="listbox"`.
