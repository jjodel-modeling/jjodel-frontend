# NAV1 — «Data manager» nel picker delle sintassi

**Data**: 2026-09-01
**Prompt**: `docs/prompts/PROMPT_NAV1_data_manager_picker.md`
**Esito**: consegnato. Sonda a schermo `_tmp_nav1_verify.ts` **17/17 ALL GREEN**, zero errori
di pagina. Unita' `dataManagerPicker.test.ts` **18/18**.

---

## 1. Discovery — le due superfici, misurate

Il prompt chiedeva di misurare PRIMA come si apre oggi il manager, e di riusare quella via.

| Domanda | Reperto |
|---|---|
| Dov'e' il select con l'occhio | `components/editor-v2/Toolbar.tsx:620` (prima del cambio), dentro `.toolbar-viewpoint-group` |
| Qual e' il suo vocabolario | «solo viewpoint»: `<option value="">Abstract syntax</option>` + una `<option>` per ogni `DViewPoint` non di sistema, filtrati da `Defaults.isSystemViewpoint` |
| Chi consuma la scelta | `handleViewpointChange` -> `utils/lastViewpoint.activateViewpoint(id \|\| null)`, che scrive la root `state.viewpoint` |
| Come si apre oggi il manager | `DockManager.openManager(LModel)` (`DockManager.tsx:165`). UNICO chiamante di produzione: `pages/components/LeftBar.tsx:380`, l'icona `bi-table` della riga del modello nel rail «Models» |
| Chi costruisce il tab | `TabDataMaker.instanceManager` (`TabDataMaker.tsx:52`), id `mgr_<modelId>` da `instanceManagerModel.managerTabId` |

**Il vocabolario e' «solo viewpoint», quindi «Data manager» e' una voce sintetica.** Come la
distinguo, dichiarato: una **sentinella** `'@data-manager'`, in un modulo suo
(`editor-v2/dataManagerOption.ts`), intercettata in `handleViewpointChange` PRIMA di
`activateViewpoint`. Nessun `DViewPoint` finto nel grafo D, e la sentinella non entra mai in
`state.viewpoint` — asserito a schermo (C2/C3) e in unita'.

La forma `@…` e' scelta contro la collisione: gli id dei viewpoint sono `Pointer_…`.

## 2. La simmetria non e' stata costruita: esisteva gia'

`DockManager.open` (`:96-104`) apre con una guardia: se un tab con quell'id esiste,
`updateTab(id, null, true)` lo ATTIVA e ritorna. L'id del manager e' costruito una volta sola
(`managerTabId`), quindi la porta del rail e la voce del picker convergono **per costruzione**
su un tab solo. Il picker non monta niente di suo: delega, come chiesto.

Misurato (E1/E2): scelta dal picker -> `tabs=1, mounted=1`; poi `openManager` dalla porta del
rail -> ancora `tabs=1, mounted=1`. Nessun secondo montaggio.

## 3. Il ritorno a una sintassi

Il `<select>` resta controllato su `shownViewpointId`: la sentinella **non diventa mai** il
valore del controllo, e al render successivo il select torna sulla sintassi attiva (F1
misurato: `value === store.viewpoint`). Non e' un difetto da correggere — il manager e' un tab
SORELLA del canvas, non una modalita' di esso, e il canvas continua a disegnare la sua sintassi
sotto. Tornare a una sintassi significa attivare il tab del canvas; il tab del manager **resta
aperto** (F2: `tabs=1` dopo la scelta di un viewpoint vero). Il picker non chiude niente —
asserito anche in unita' (`not.toContain('closeTab')`).

## 4. Nessuna assunzione «solo sintassi» violata

Il punto di fermata del prompt («se il picker vive in un componente condiviso col canvas che
scrive sempre un viewpoint attivo») **non e' scattato**: il `return` anticipato lascia il write
path intatto. Il controllo di segno opposto e' D1 — scelto un viewpoint vero, `state.viewpoint`
cambia. Senza D1, il verde di C2 direbbe solo «il picker non scrive piu' niente».

## 5. Due reperti di metodo, entrambi costati un giro rosso

**(a) `visible=true` non basta a scegliere il pane giusto.** Il primo giro della sonda diede
`B2 FAIL` — «Data manager» presente sul metamodello. Falso rosso: rc-dock lascia i pane
inattivi nel DOM, traslati fuori schermo dentro un contenitore ritagliato, con `getClientRects()`
NON vuoto. Misurato: due `select`, quello dell'M1 a `x = -857` e quello dell'M2 a `x = 841`.
Il primo «visibile» era il pane sbagliato. Scoping corretto: `.dock-tabpane-active`. Con quello,
il picker dell'M2 esce a **una** opzione e `disabled=true` — la guardia funziona.

**(b) La fixture `rowviews` non offre viewpoint selezionabili.** Ne esiste uno nello store, ma
e' quello di sistema e il picker lo filtra: la lista usciva a tre voci e l'asserzione «la voce
e' dopo ogni viewpoint» era vera **a vuoto**. La sonda ora semina un viewpoint vero
(`DViewPoint.newVP`, la via di `ProjectEditor.handleCreateViewpoint`) quando il picker non ne
offre, e il controllo positivo 0b e' li' per non far passare di nuovo un ordine non misurato.

`npm run smoke` non poteva essere il gate: i suoi tre stati (progetto vuoto, tab metamodello,
advanced mode) non contengono un M1 col picker, e uno schermo che non puo' contenere il
soggetto da' lo stesso silenzio di un soggetto assente (CLAUDE.md §5).

## 6. Cosa NON e' stato fatto

- L'icona `bi-table` del mock **non** e' nell'`<option>`: una `<option>` nativa rende solo
  testo, e le voci esistenti non ne portano. Il glifo resta quello della porta del rail, dove
  gia' vive. Nessun controllo nuovo inventato.
- `InstanceManagerTab.tsx` / `.scss` **non toccati** (10k in volo). La delega non lo ha
  richiesto: passa tutta per `DockManager` e `TabDataMaker`, gia' esistenti.
- Il separatore e' una `<option disabled>`, non un `<optgroup>`: un optgroup avrebbe
  raggruppato anche le sintassi, cambiando il picker per il caso di sole sintassi. La
  non-regressione A4 e' asserita su questo.
