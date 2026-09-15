# Arco 3, il form dell'inspector. Consegna della sessione autonoma

**Data**: 2026-08-13, sessione Cowork notturna su mandato di esecuzione.
**Base**: `alfonso-frontend-jjtl` a `d8b2e9e28`, working tree pulito all'inizio.
**Stato**: quattro passi eseguiti, gate verdi, **file scritti e non committati**.
**Specifica**: `docs/redesign/rail/README.md` §7, passi 3 e 4 del build order.
**Discovery**: `docs/discovery/discovery_2026-08-13_form_inspector_griglia_84.md`.

---

## 1. Cosa trovi nel working tree

Due file modificati, nessun file nuovo nel codice:

| file | righe | cosa contiene |
|---|---|---|
| `frontend/src/components/editors/Info.tsx` | +167 / −61 | `MultiplicityControl`, `FlagChip`, `FlagsSection`, le tabelle dei flag, la disclosure Advanced |
| `frontend/src/components/editors/properties-with-tree-view.scss` | +470 | quattro blocchi in coda, uno per passo, più i due blocchi dark |

Più due documenti: il discovery report e questo handover.

**Non ho toccato**: `styles/components/_form-system.scss`, `editors/info-improvements.scss`,
`editors/info.scss`, `ui/JjSelect/JjSelect.tsx`, nulla della critical zone §3.1, nessun
identificatore esistente. `.jj-bounds-row` e `formatMultiplicity` restano dove sono: la prima
non ha più consumatori nel rail, la seconda è riusata dal Custom (Regola 9, niente rimozioni).

## 2. I quattro passi, e cosa è stato misurato per ciascuno

### Passo A, la griglia 84px

Label a destra in colonna da 84px, campo su riga da 30px. Ancora:
`.properties-with-tree-view--rail .properties-fields`, non il solo rail.

**Il motivo dell'ancora stretta è il findings principale della discovery**: dentro il rail rende
anche la superficie di authoring IR, per la via del ramo view (`ViewData.tsx:95,98,133,137`), e
quella usa `.jj-field` come questo form. Scopare al rail avrebbe ristrutturato tredici file
sotto `editor-v2/viewpoint/authoring/`, area che `CLAUDE.md` §2.5 dichiara in sviluppo.
`.properties-fields` esiste solo nel ramo model element in modalità tab (`Info.tsx:1381`): non nel
popup del menu contestuale (`Info.tsx:1412`, e `ContextMenu.tsx:559` lo monta davvero), non nel
ramo view.

| misura | prima | dopo |
|---|---|---|
| `.jj-field` display | `block` | `grid`, colonne `84px 276px` |
| label | 14px, allineata a sinistra, sopra il campo | 12px, a destra, in colonna |
| riga Name | 36px | 30px |
| riga Type | 56px | 30px |
| scroll orizzontale | 0 | 0 |
| colore label light/dark | `rgb(100,116,139)` / uguale | invariato in entrambi |

I 56px della riga Type venivano da `_form-system.scss:1166-1169`, che mette `padding-bottom: 20px`
su `.jj-select` senza commento. Azzerato dentro l'ancora, non nel foglio globale.

Il controllo Type resta `JjSelect` (react-select con stili inline): l'altezza si è potuta portare
a 30px solo con `!important` sul primo div del contenitore, perché `classNamePrefix` non è
impostato e le classi BEM di react-select non esistono. Il componente condiviso non è stato toccato.

### Passo B, multiplicity segmentato

Cinque preset più Custom al posto dei due stepper e della pastiglia read-only.
`role="radiogroup"`, `aria-checked`, IBM Plex Mono 11px, 28px, `flex: 1 1 0` con `min-width: 0`.

**Prova end to end**, non solo di resa: cliccando `[1..*]` la riga del tree passa da
`attr_0: EString [0..1]` a `attr_0: EString [1..*]`. La sequenza completa, misurata:

```
selectAttr  → [0..1]     seg_custom → [0..1] (Custom aperto)
seg_1toN    → [1..*]     lowerPlus  → [1..1]
seg_0to1    → [0..1]     upperPlus  → [1..2]
```

Zero errori di pagina in tutta la sequenza. Larghezza dei segmenti 52px l'uno, overflow della riga
zero: la nota del design sul `min-width: 0` è stata seguita e regge.

Convenzione dei bound letta sul write path (`LModelElement.tsx:1504-1529`): `-1` è l'illimitato,
`lowerBound` clampa a zero, e ogni setter corregge l'altro bound. Il `999` che si legge in
`Info.tsx` è normalizzazione di rendering degli slot M1 e non è entrato nel controllo.

### Passo C, i flag

Chip in Browse, righe switch in Focus, **un solo DOM e due vestiti**: la postura arriva per
cascata dal modificatore `--rail-focus` che il guscio scrive su di sé (R-RAIL-40), quindi nessuna
prop attraversa `Info`.

Come da tua decisione, ogni flag esistente diventa un chip e **tiene il nome e la semantica del
modello**. `Changeable` resta `Changeable`: la mappatura letterale del design lo avrebbe reso
`Read-only`, cioè `changeable = !on`, un'inversione sul write path in cambio della sola aderenza
al testo.

| misura | Browse | Focus |
|---|---|---|
| chip / riga | 26px, radius 99px, fondo bianco | 36px, dentro riquadro 1px radius 9px |
| hint e track | `display: none` | `block` e `flex` |
| knob acceso | — | `translateX(12px)` |
| riepilogo live | `unique · ordered · changeable` | uguale |

Ordine per un attributo, misurato a schermo: ID, Unique, Ordered, Derived, Transient, Changeable,
Volatile, Unsettable, Cross Reference, IoT. I sei del design per primi, gli altri dietro.

**Il gating non è cambiato di una riga.** La sezione non si rende affatto quando la lista è vuota:
un attributo in modalità Basic non mostra flag, esattamente come prima. Un reference in Basic
mostra i suoi due, come prima.

### Passo D, la disclosure Advanced

`ADVANCED STATE` diventa `Advanced`, riga da 30px con caret, eyebrow, filetto e riepilogo a destra
(`default` quando lo stato è vuoto, altrimenti le prime tre chiavi). Dopo il passo C la vecchia
sezione `ADVANCED` non esiste più: i suoi otto flag sono chip.

Il caret sta prima della label per `order` sui figli del flex, non toccando `CollapsibleSection`,
che ha altri undici chiamanti in questo file.

**`NODE` non è entrata**: resta nel guscio, gated su `advanced`, per R-RAIL-12 e per tua decisione.
L'inspector ha due voci, Flags e Advanced, e nessuna «Appearance». È uno scostamento dichiarato
dal design §7 ultimo paragrafo.

## 3. La definition of done, misurata

| criterio del design | esito |
|---|---|
| ≥ 9 controlli visibili senza scroll in preset `2a` | **17** in Focus, **15** in Browse su un attributo, con rail a 400px (più stretto dei 420 richiesti) |
| nessuna scrollbar orizzontale da 360px in su | 0 su ogni stato misurato, riga multiplicity inclusa |
| i due temi | misurati entrambi, per ogni superficie nuova |
| ogni colore e raggio risale a un token | `$pc-slate-*`, `var(--color-*)`, `var(--font-mono)` |

Un caso che va guardato a occhio e che il numero non giudica: **su una classe in postura Browse
solo il campo Name è interamente visibile senza scroll** (i quattro chip cadono sotto la piega,
perché in Browse il tree pane si prende 348px dei 860 del rail). La classe ha in tutto cinque
controlli, quindi la soglia di nove non è raggiungibile per costruzione. Dimmi se la piega ti
disturba: si sposta con l'altezza di default del tree pane, che è del guscio e non del form.

## 4. Gate

| gate | baseline | dopo |
|---|---|---|
| `npx tsc --noEmit` (clone Linux) | 14 | **14** |
| `npm run build` | exit 0, 2m47s | **exit 0**, 2m04s |
| harness Playwright, due temi | — | eseguito su class, attribute, multiplicity, flag, disclosure |

Sul tuo Mac la baseline di typecheck è 33: i 19 di differenza sono gli errori di casing che un
filesystem case-sensitive non produce. Rifallo lì prima di committare.

**Non eseguiti**: `npm run smoke` (P8 non è ancora implementata), `check:docs` e `check:agents`
(nessun documento normativo toccato; il discovery report e questo handover non sono sotto gate).

## 5. Cosa guardare domani, in ordine

1. **Un attributo in modalità Advanced.** È lo stato che tocca tutti e quattro i passi insieme.
   Guarda il ritmo delle righe: Name e Type a 30px, Multiplicity a 28px, poi i chip.
2. **La riga multiplicity a rail stretto.** Trascina il bordo del rail fino al minimo: i cinque
   segmenti devono stringersi, non andare a capo e non sfondare.
3. **Il passaggio Browse → Focus su una foglia.** I chip devono diventare righe switch senza che
   nient'altro si muova; `Escape` torna indietro.
4. **I due temi su tutto quanto sopra.** Le superfici nuove in dark invertono il rapporto
   (acceso = fondo chiaro, testo scuro): è una scelta, dimmi se non ti convince.
5. **Una classe e un reference**, per il gating dei flag: la classe ne ha quattro sempre, il
   reference due in Basic e dieci in Advanced.
6. **Il pannello del menu contestuale** (`Info mode='popup'`): è il controllo negativo, deve essere
   identico a ieri. Se è cambiato, l'ancora ha esondato.

## 6. Domande aperte, che non ho deciso io

1. **Undo del multiplicity**: un preset che muove entrambi i bound costa due passi di undo, perché
   ogni setter apre la propria `TRANSACTION`. Ho tenuto il comportamento identico ai due stepper di
   ieri. Avvolgerle in una transazione esterna è un cambio di due righe, ma annida transazioni.
2. **`[0..0]`**: è legale nel modello e non ha preset, quindi cade su Custom. Va bene, o è uno
   stato illegale da correggere?
3. **Default value, Opposite, Derivation**: il design li vuole dentro Advanced, ma **non esistono
   oggi nel form**. Introdurli è sviluppo nuovo su tre feature EMF, non restyle: non li ho fatti.
4. **Gli asterischi dei campi obbligatori**: il design li toglie e li sostituisce con validazione
   on-blur. Ho tenuto gli asterischi, perché toglierli senza la validazione toglie informazione
   senza darne. La validazione è lavoro nuovo.
5. **La piega su una classe in Browse** (vedi §3).

## 7. Voci di registro proposte

Da iscrivere in `docs/decisions.md` dopo la tua verifica, con i numeri liberi:

- **R-RAIL-44** — L'ancora di una regola di forma nel rail non è il rail. Dentro
  `.properties-with-tree-view--rail` rende anche l'authoring IR, per la via del ramo view, e usa
  le stesse classi `.jj-field*` del form. L'ancora del form è `.properties-fields`, che esiste solo
  nel ramo model element in modalità tab. Nata dalla discovery dell'arco 3, che ha falsificato
  tre ipotesi su cinque.
- **R-RAIL-45** — Un flag tiene il nome e la semantica del modello anche quando il design ne
  propone uno invertito. `Read-only` come vista di `changeable` avrebbe messo un'inversione sul
  write path, che è dove un errore corrompe un modello senza dare errore di compilazione, in cambio
  della sola aderenza letterale.
- **R-RAIL-46** — Due rese della stessa cosa per postura si fanno con un DOM solo e due vestiti,
  non con due rami di markup. Gradino successivo di R-RAIL-40: se la postura arriva per cascata,
  allora anche la forma può.
- **R-RAIL-47** — Conferma di R-RAIL-12 per l'arco 3: `NODE` resta nel guscio, l'inspector non ha
  «Appearance», e lo scostamento dal design §7 è dichiarato invece che silenzioso.
- **Emendamento a R-RAIL-27** — `git bundle create` dal bridge fallisce come le altre scritture:
  `warning: unable to unlink '<file>.lock': Operation not permitted`, e il lock resta. Anche
  `git status --short` lascia un `.git/index.lock` non cancellabile. Sul mount, nessun comando git
  oltre la lettura pura. Il detrito prodotto stanotte è in `.git/_to_delete/` (33 file, era 32).

## 8. Entry di log, da completare dopo la verifica

```
## 2026-08-13 — feat: arco 3, il form dell'inspector
**Prompt**: piano di esecuzione autonoma dell'arco 3 (griglia 84px, multiplicity segmentato,
flag chip/switch, disclosure Advanced), documento «2026-08-12 23:55».
**Files touched**: frontend/src/components/editors/Info.tsx,
frontend/src/components/editors/properties-with-tree-view.scss,
docs/discovery/discovery_2026-08-13_form_inspector_griglia_84.md,
docs/handover/2026-08-13_arco3_form_inspector.md
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown        ← da confermare a schermo
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (P8 non implementata)   ← e la tua verifica va qui
**Notes**: gate su clone Linux, typecheck 14 invariato, build exit 0. Misure e scostamenti
nell'handover.
**Prompt document name**: 2026-08-12 23:55
```

## 9. Come committare

Il working tree ha i due sorgenti e i due documenti. I quattro passi sono etichettati nel codice
(`// ─── Arco 3, passo A/B/C/D ───` nel foglio, commenti corrispondenti nel TSX), quindi si possono
separare, ma richiede staging interattivo: non ho committato niente e non ho patch per passo.

Consigliato, se la verifica passa:

```
git add frontend/src/components/editors/Info.tsx \
        frontend/src/components/editors/properties-with-tree-view.scss
git commit -m "feat(rail): inspector form grid, segmented multiplicity, flag chips"
git add docs/discovery/discovery_2026-08-13_form_inspector_griglia_84.md \
        docs/handover/2026-08-13_arco3_form_inspector.md
git commit -m "docs: arco 3 discovery report and handover"
```

Il branch resta a 4 commit da `origin` da prima di stanotte: il push è ancora da fare.

---

## 10. Due cose trovate guardando gli screenshot, non i numeri

Le misure erano tutte verdi e queste due non le avevano prese. Vale come conferma di R-RAIL-28
nella direzione opposta al solito: una misura giusta su ciò che si è pensato di misurare non
copre ciò a cui non si è pensato.

### (a) Corretta: i flag partivano 14px più a sinistra dei campi

L'eyebrow FLAGS e i chip nascevano a filo del pannello mentre i campi rientrano di 14px, perché
`.props-section__body` dichiara `padding: 4px 14px 12px` e `.properties-fields` no. Misurato:
`.jj-flags` a x=1193 contro il campo Name a x=1207. Corretto con `padding: 0 14px` su `.jj-flags`
e su `.jj-disclosure`; rimisurato, l'eyebrow è ora a x=1207 come il campo. Build rifatta, exit 0,
typecheck sempre 14.

### (b) Non corretta, e non è mia: il valore del Type è invisibile in dark

`ui/JjSelect/JjSelect.tsx:49` fissa `singleValue: { color: '#1e293b' }`. Misurato sul prodotto in
tema scuro: il div che porta «EString» computa `rgb(30, 41, 59)` sopra il pannello scuro, cioè
testo quasi nero su fondo quasi nero. Si vede nello screenshot `adv_dark_2_attr_focus.png`: il
campo Type sembra vuoto, e non lo è.

**Preesiste all'arco 3** e non l'ho toccato: `JjSelect` è condiviso da tutto il pannello e da
`viewapplyto`, quindi il raggio d'azione è l'app e non il rail. È la stessa specie di R-RAIL-42,
la Focus bar che nessuno aveva aperto in dark. Va a debito, e il rimedio è una riga: portare
`singleValue`, `input` e `placeholder` sui token del tema invece che su esadecimali fissi.

### (c) Da guardare, non è un difetto: due stili di intestazione convivono

Il form ha ora due forme di intestazione: `GENERAL` e `TYPE & BOUNDS` con la vecchia
`CollapsibleSection` (titolo grande, chevron a destra), `FLAGS` e `Advanced` con l'eyebrow del
design (label piccola, filetto, riepilogo). Il design §7 non ha affatto `GENERAL` e
`TYPE & BOUNDS`: la sua lista di sostituzione nomina solo `ADVANCED`, `FLAGS`, `ADVANCED STATE`
e `NODE`, quindi le altre due non sono nel perimetro di stanotte.

Uniformarle è un blocco solo, scopato a
`.properties-with-tree-view--rail .properties-fields .props-section`, ma tocca anche `CONTENTS`,
`DEPENDENCIES`, `INHERITANCE`, `SLOTS`, `RETURN` e `VALUE`, che stanno fuori dal form. È la prima
voce che proporrei per un arco 3b, e non l'ho fatta da solo perché il raggio d'azione supera il
mandato.

---

## 11. Giro di correzioni dopo la tua verifica visiva (2026-08-13, mattina)

Tre rilievi tuoi, tutti e tre riprodotti e misurati prima di toccare, tutti e tre corretti.

### (1) Le icone dei chip restavano scure quando il chip era acceso

**Causa**: `styles/style.scss:790` dichiara `i.bi { color: var(--font-color-1) }`. Una
dichiarazione batte l'ereditarietà comunque, quindi il `color: #fff` che il chip acceso mette su
di sé non raggiungeva mai il glifo. **È la stessa trappola di R-RAIL-36**, dove a dipingere era
l'`<i>` e non il contenitore che si stava misurando; nella resa Focus avevo messo il colore
sull'`<i>` e lì funzionava, nei chip me n'ero dimenticato.

**Rimedio**: `.jj-flag > i { color: inherit }`, che vale (0,4,1) contro (0,1,1) e vince anche
sullo `:hover` di `i.bi` senza `!important`. Misurato dopo: chip acceso `rgb(255,255,255)` con
glifo `rgb(255,255,255)`; chip spento `rgb(71,85,105)` con glifo `rgb(71,85,105)`.

**Nota sul mio primo tentativo di verifica**: la misura era finita in postura Focus, dove le
icone a `slate-400` sono corrette per disegno, e avevo letto «già a posto». Selezionare una
foglia porta in Focus: per misurare i chip serve un `Escape` prima. Il probe ora lo fa e
dichiara la postura in cui sta misurando.

### (2) A rail stretto compariva la scrollbar orizzontale invece dell'a-capo

**Causa**: la traccia `1fr` della griglia ha `min-width: auto`, quindi non scende sotto il
min-content del proprio contenuto. Misurato: la seconda colonna restava a **244px fissi** anche
con il campo a 250px, e il corpo del pannello prendeva **74px** di scroll orizzontale a rail 280.

**Rimedio**: `grid-template-columns: 84px minmax(0, 1fr)` più `overflow: hidden` sul segmento.
Misurato dopo, `bodyHScroll` a 0 su 280, 320, 360 e 400, con la colonna che ora segue il campo
(156, 196, 236, 276).

**Quello che succede sotto i 360px**: i segmenti si troncano (`[0..`, `[1..`, `Cust`), invece di
far comparire la scrollbar. Il design chiede zero scrollbar **da 360px in su**, e a 360 le
etichette sono intere (236px / 5 = 47px per segmento). Se vuoi che restino leggibili anche sotto,
la via è una container query sul rail che manda il segmentato a capo su due righe: è lavoro
nuovo, non l'ho fatto.

### (3) Il rail copriva i menu della navbar

**Causa, misurata sulla catena di impilamento**: `.properties-tree-overlay` è
`position: fixed; z-index: 900`; la navbar è `position: relative` con **`style={{zIndex: 99}}`
inline** a `Navbar.tsx:1814`. I dropdown della navbar vivono dentro il contesto di impilamento
della navbar, quindi non possono superare il rail qualunque z-index abbiano: il 200 dichiarato a
`navbar.scss:479` non serve a niente.

Abbassare il rail non è una via: rc-dock arriva a 400 (`rc-dock.css`), e il rail sta a 900 apposta
per stargli sopra.

**Rimedio**: tolto lo z-index inline dalla navbar, e portato `--z-navbar` da `var(--z-sticky)`
(100) a **950** in `styles/tokens/_z-index.scss`, dove la decisione di livello ha la sua casa.
950 tiene la navbar sopra il rail (900) e sotto `--z-dropdown` (1000), il context menu del canvas
e i modali. Misurato dopo: navbar 950, rail 900.

**Questo è l'unico punto in cui sono uscito dal perimetro dell'arco 3**, e sono due file che non
erano nel piano: `pages/components/Navbar.tsx` e `styles/tokens/_z-index.scss`. Il difetto
preesiste all'arco 3 (nasce con il rail flottante dell'arco 1). Tienilo in un commit separato,
così se non ti convince lo lasci cadere senza toccare il resto:

```
git add frontend/src/pages/components/Navbar.tsx frontend/src/styles/tokens/_z-index.scss
git commit -m "fix(navbar): raise navbar above the floating properties rail"
```

### Gate dopo le correzioni

`npx tsc --noEmit` sul clone Linux: 14, invariato. `npm run build`: exit 0. Probe rieseguito sui
tre difetti, tutti e tre chiusi con la misura accanto.
