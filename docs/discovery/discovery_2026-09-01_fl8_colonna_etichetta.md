# FL8 — la colonna etichetta contro le celle del packer

**Data**: 2026-09-01
**Prompt**: `docs/prompts/PROMPT_FL8_rail_label_column.md` — colonna etichetta fissa vs celle
del packer (fix, parallelo a 10j e alla chiusura di ENG1)
**Perimetro**: `frontend/src/components/editor-v2/viewpoint/ir/irFormStyle.scss` + un test
**Esito**: le quattro accettazioni sono verdi. Spedite **entrambe** le leve, (a) e (b), con
la misura che motiva la seconda riportata per intero in §4.

---

## 1. Il reperto, riprodotto sul codice di oggi

STYLE1 §7 non è stato preso per buono (CLAUDE.md §5, «non fidarsi delle fixture a memoria»):
la sonda ricostruisce a runtime la grammatica committata prima di FL8 e la misura di nuovo,
nella stessa pagina in cui misura il dopo.

| preset | controlli < 40px | in overflow | controllo più stretto | tracce del campo a span 3 |
|---|---|---|---|---|
| Comfortable | 0 | 0 | 87.8px | — (`display: flex`) |
| Sectioned | 0 | 0 | 63.3px | — |
| **Compact** | **4** | **2** | **7.8px** | **`72px 7.75px`** |
| **Dense** | **4** | **2** | **7.8px** | **`72px 7.75px`** |

Identico numero per numero a STYLE1 §7. L'aritmetica della cella si chiude: il rail a 400px
dà una riga di 375.2px, dodici colonne con `column-gap: 8px` fanno una colonna da 23.93px, e
una cella da 3/12 è `3×23.93 + 2×8 = 87.8px`. Di quei 87.8, la colonna etichetta fissa ne
prende 72 e il gap 8: al controllo restano **7.75px**.

Chi sborda e chi no, misurato: gli **stepper** non sbordano, si tagliano — hanno
`overflow: hidden`, quindi a 7.8px mostrano un pezzo di bottone e nessun campo numerico. I
due **select** (`tint`, `stroke`) sbordano di 12.3px, perché il loro minimo intrinseco è 20px
e la traccia ne offre 7.75.

## 2. La leva (a): la colonna etichetta è un cap, non una larghezza

```scss
grid-template-columns:
    minmax(0, var(--ir-form-label-col, 72px))
    minmax(min(var(--ir-form-control-min, 48px), 100%), 1fr);
```

La priorità si inverte per costruzione del track sizing: la traccia dell'etichetta ha base 0
e limite di crescita al cap, la traccia del controllo ha base pari al floor. Il riparto dà al
controllo il suo floor e all'etichetta ciò che avanza, fino al cap.

**Il floor non è scelto, è letto dal foglio.** `.ir-field__stepper-btn` è `flex: 0 0 24px`,
due volte: 48px è la chrome dello stepper, sotto la quale non c'è un campo fra i bottoni —
che è il sintomo riportato. 48 è anche sopra i 40px sotto cui un select smette di mostrare il
proprio valore, cioè la soglia di accettazione di STYLE1: un numero solo chiude tutte e due.

**Dove non morde, non cambia niente.** Misurato: il campo `description` a span 6 (cella
183.5px) tiene le tracce `72px 103.5px` prima e dopo, byte per byte. Il cap si raggiunge in
ogni cella da 6/12 e 12/12 — le uniche che esistessero prima che un tema potesse chiedere
l'etichetta a sinistra sotto l'auto-layout — e la skin `compact` conserva i suoi 88px.

## 3. La leva (b): sotto la cella minima il campo si impila

```scss
.ir-form[data-label-placement="left"] .ir-form__cell { container-type: inline-size; }

@container (max-width: 128px) { /* il campo passa a una colonna sola */ }
```

**Soglia derivata, non inventata**, come il prompt chiede: è la somma di ciò che la
disposizione a sinistra richiede — cap dell'etichetta (72px, `LABEL_COLUMN_WIDTH` in
`jjform/themes.ts:211`) + il gap (`--space-2` = 8px) + il floor del controllo (48px) = **128px**.
La span minima della `WIDTH_MAP` di FL1 è 3 (`boolean`, `number`, `color`, `date`,
`enumShort`, `duration`, `datetime`), e nel rail a 400px una cella da 3/12 misura 87.8px:
sotto soglia, si impila. Una cella da 6/12 misura 183.5px: non si impila. Il test lega la
soglia ai tre addendi, quindi cambiarne uno senza l'altro fa rosso.

`@container` e non `@media` perché la grandezza che decide è la **cella**, non il viewport:
lo stesso rail a 400px contiene celle che stanno larghe e celle che non ci stanno.

La containment è dichiarata **solo** sotto `[data-label-placement="left"]`: i due preset a
etichetta sopra non la vedono per costruzione, non per misura. `container-type` porta con sé
`contain: layout`, che rende la cella blocco contenitore per i discendenti in posizione
assoluta: dentro una cella non ce ne sono (il picker è portato su `<body>`, dichiarato dal
commento di `.ir-picker`), quindi non c'è niente da riparentare.

## 4. Perché (b) è stata spedita, e non rimandata

Il prompt ordina le leve: «(b) solo se (a) non basta», e definisce «basta» con un criterio
meccanico. **Con la sola (a) quel criterio è verde**, misurato spegnendo (b) a runtime:

| stato | controlli < 40px | overflow | controllo più stretto | etichette troncate |
|---|---|---|---|---|
| before | 4 | 2 | 7.8px | 0 |
| **solo (a)** | **0** | **0** | **48px** | **2** |
| (a) + (b), spedito | 0 | 0 | **63.5px** | **0** |

E però lo schermo dice un'altra cosa (CLAUDE.md §5: quando la misura e il pixel non
concordano, il pixel è la misura). Con la sola (a) la colonna etichetta scende a 31.75px e
gli scatti `_tmp_fl8_leverA_compact.png` / `_leverA_dense.png` mostrano: il valore del select
finito **sotto la propria freccia** (`Gr…` per `Green`), le etichette `wid…` e `plai…`
troncate, e lo stepper con **un** bottone e nessun campo numerico. Sono i tre sintomi
elencati in testa al prompt: mitigati, non curati.

Con (a)+(b) gli stessi campi si leggono per intero — `Green`, `DASHED`, `240`, `17`,
etichette `widthPx` e `plainCount` intere (`_tmp_fl8_after_compact.png`, `_after_dense.png`).
La scelta è dichiarata qui perché è un cambio di comportamento del tema, come il prompt
avverte, e perché il criterio da solo l'avrebbe assolta.

## 5. Accettazione

Sonda `frontend/scripts/smoke/_tmp_fl8_verify.ts`, **18/18 PASS, exit 0, zero errori di
pagina**. Soggetto `allNine_valued` (14 campi / 3 gruppi / 7 righe) nel rail a 400px,
viewport 1600×2000, le stesse due vie di applicazione di STYLE1 (reale per Comfortable /
Compact / Sectioned, contratto per Dense, che nessuna scrittura dell'app può selezionare).

1. **Zero controlli sotto i 40px** nei quattro preset. ✅ (0/0/0/0)
2. **Zero overflow dalla cella** nei quattro preset. ✅ (0/0/0/0)
3. **Geometria invariata**: `14/3/7` sotto tutti e quattro — il tema non muove un campo. ✅
4. **Comfortable e Sectioned identici al before**: 14 celle, 14 campi, 14 etichette e
   `formH` 811.2 / 914.2 invariati, confrontati rettangolo per rettangolo. ✅

**Before e after nello stesso caricamento.** Non è un vezzo: una sessione **parallela** ha
scritto su `IRForm.tsx` (mtime 09:57:08) e `formAutoLayout.ts` (09:59:27) mentre questa
sonda girava, e due giri separati avrebbero confrontato due codici diversi chiamandoli before
e after. Il primo impianto della sonda faceva esattamente quello ed è stato rifatto. Dentro
un caricamento solo, l'unica cosa che cambia fra le tre misure è il foglio iniettato.

**Controlli di segno opposto**, perché un verde che non può diventare rosso non è una misura:
il confronto before/after **differisce** su Compact (le celle da 40 a 62px di altezza); i due
preset a etichetta sopra non sono schiacciati nel before (lo strumento ha segnale, e non è la
soglia a essere generosa); scrivere `ir.form.theme` cambia il DOM (la view IR risolve
davvero); tolto il foglio iniettato la misura torna a quella spedita.

## 6. Il test, e le sue mutazioni

`frontend/src/components/editor-v2/viewpoint/ir/__tests__/irFormLabelColumn.test.ts`, 18 casi.
Legge il foglio come sorgente, con i commenti spogliati — le misure di FL8 sono citate anche
in prosa lì dentro, e una regex che le trovasse nel commento misurerebbe il commento. Lega il
default del cap a `LABEL_COLUMN_WIDTH` importato da `themes.ts`, il floor ai 24px dichiarati
dal bottone dello stepper, e la soglia della query alla somma dei tre addendi letti (il gap
viene da `styles/tokens/_spacing.scss`, non da un `8` scritto a mano).

Provato con **cinque mutazioni**: cap tornato fisso (2 rossi), floor rimosso (2), soglia a
120px (6), containment sulla cella nuda cioè estesa ai preset a etichetta sopra (2),
`text-align` dell'etichetta impilata rimosso (2). Verde al ripristino in tutte e cinque.

## 7. Quello che resta aperto

- **Il `title` dell'etichetta non porta il nome.** Il prompt cita, dentro la leva (a),
  «etichetta con ellipsis + `title`». L'ellipsis c'è già (`.ir-field__label` dichiara
  `text-overflow: ellipsis`), ma il `title` è occupato: `IRFormField.tsx:449-450` ci scrive
  la molteplicità o `derived`, per una decisione dichiarata nel foglio stesso («the
  multiplicity leaves the row for the label's tooltip»). Cambiarlo è una modifica al TSX, che
  è **fuori dal perimetro** di questa slice, e contraddirebbe quella decisione: va deciso, non
  fatto di sfuggita. Con (b) spedita il caso è comunque raro: nel soggetto misurato le
  etichette troncate passano da 2 a 0.
- **`Dense` resta irraggiungibile** da ogni scrittura dell'app (STYLE1 §4). Qui è misurato
  per via contratto, come là.
- Il residuo visivo dopo (b): a 87.8px lo stepper mostra `24C` per `240` e `DASHED` sfiora la
  freccia. È il limite della cella, non della regola: gli stessi campi in Comfortable, che ha
  la stessa cella, si tagliano allo stesso modo.

## 8. File letti

- `frontend/src/components/editor-v2/viewpoint/ir/irFormStyle.scss` (1078 righe, intero il
  blocco FL4 e le regole del campo)
- `frontend/src/components/editor-v2/viewpoint/ir/IRFormField.tsx` (label row)
- `frontend/src/components/editor-v2/viewpoint/ir/formAutoLayout.ts` (`themeVars`, `LEGACY_SKIN_PRESET`)
- `frontend/src/jjform/layout.ts` (`WIDTH_MAP`, `GRID_COLUMNS`), `frontend/src/jjform/themes.ts`
  (`LABEL_COLUMN_WIDTH`, `PLACEMENT`), `frontend/src/styles/tokens/_spacing.scss`
- `docs/discovery/discovery_2026-09-01_style1_tema_form.md` (§7 e la sonda che lo produsse)
