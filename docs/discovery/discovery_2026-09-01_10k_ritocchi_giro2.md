# 10k — i nove ritocchi del manager, giro 2

**Data**: 2026-09-01
**Prompt**: `docs/prompts/PROMPT_10k_ritocchi_giro2.md`
**Sonda**: `frontend/scripts/smoke/_tmp_10k_verify.ts` — **before 20/29, after 49/0**, stesso
strumento su entrambi i lati, zero errori di pagina.
**Ricognizione**: `frontend/scripts/smoke/_tmp_10k_recon.ts` (§8).

---

## 0. Che cosa e' stato misurato, e con che cosa

Il prompt descrive nove difetti su uno screenshot di `sample-StateMachine`. La fixture della
sonda **non e' quello screenshot**: e' `frontend/src/__tests__/fixtures/xmi-m1/StateMachine.ecore`
ricostruito feature per feature, **nell'ordine dichiarato dal file**, piu' l'M1 di
`sample-StateMachine.xmi`. L'ordine non e' un dettaglio di comodo — e' cio' che produce il difetto
del punto 5, e la suite ratificata `formAutoLayout.test.ts:96` usa un ordine diverso (`depth`
prima di `entryAction`) in cui il difetto **non esiste**. Una fixture presa da li' avrebbe dato un
before verde su un difetto reale.

Il before e' stato girato **due volte**: la prima con una sonda a 42 asserzioni, l'ultima — quella
citata, 20/29 — con lo strumento finale, dopo aver messo in stash i sei sorgenti (`git stash push
-- <sei path>`, poi `pop`). Un before misurato con uno strumento diverso dall'after non e' un
before: e' un'altra misura.

### La tabella dei nove

| # | Difetto | Misura before | Misura after |
|---|---------|---------------|--------------|
| 1 | checkbox nativo | `20x20`, `appearance: auto`, raggio `0px`, bordo `0px` | `16x16`, `none`, `4px`, `1px rgb(203,213,225)`; spuntato `rgb(51,65,85)` |
| 2 | testata dentro la card | card `top 63`, testata `top 78` (dentro) | testata `[63, 108]`, card `top 120` (fuori, sopra) |
| 3 | header form senza banda | `background: rgba(0,0,0,0)`, raggi `0px`, banda `[768,1572]` vs card `[754,1587]` | `rgb(248,250,252)`, raggi `12px`, banda `[754,1586]` |
| 4 | NAME doppio | `ths: ["","name","name","isHistory",…]`, riga `["","Idle","—",…]` | `ths: ["","name","isHistory",…]`, riga `["","—",…]`, indicatore «5 columns hidden» |
| 5 | `entryAction` a tutta larghezza | span **9**, `stretched: true`, **583px** vs `timeout` 189px | span **6**, `stretched: false`, 386px vs 189px |
| 6 | CHILDREN + ADD CONTAINED | 3 voci: `Children` (IRForm), `states` (inline), `Add contained` | 1 voce: `Children` |
| 7 | owner attaccato all'arco | gronda **12px** (`d = "M 66 40 L 84 52"`) | gronda **24px** |
| 8 | copy del sottotitolo | «Created from its container's form (StateMachine)» | «Contained in StateMachine» |
| 9 | stati che scattano | `transition: all 0s`, hover `rgb(241,245,249)` | `background-color 150ms ease-out`, hover `rgb(233,239,246)` |

Screenshot per punto, nel giro before e nel giro after:
`_tmp_10k_{before,after}_{1_full,2_contained,3_slick,4_checkboxes,5_ego_owner,6_children}.png`.

---

## 1. Tre reperti che rettificano il testo del prompt

Il prompt nomina tre token. Due non fanno cio' che dice, il terzo non esiste.

**`--color-border` non esiste nel sistema.** Misurato: `getComputedStyle(document.documentElement)
.getPropertyValue('--color-border')` risponde stringa vuota. Slate-300 esiste sotto due nomi —
`--color-border-primary` (`_colors-light.scss:90`) e `--color-border-secondary` (`tokens.css:124`)
— che sono fra i 15 dichiarati **due volte con valori diversi**: il primo vale `$slate-300` in un
file e `#e2e8f0` nell'altro. Il nome con cui questo foglio chiama slate-300, e con cui lo chiama
ogni suo controllo dal 7a in poi, e' **`--color-form-border-strong`**, scritto per esteso proprio
per non dipendere dall'ordine di cascata. E' quello usato.

**`--color-bg-secondary` (punto 3) e' un altro dei 15.** `_colors-light.scss:81` dice `#ffffff`,
`tokens.css:117` dice `#f8fafc`. A runtime risolve `#f8fafc`, cioe' lo slate-50 che il prompt
voleva — ma **per via del duplicato**, non per dichiarazione, e su una card bianca l'altro valore
sarebbe una banda invisibile. Usato `--color-form-panel` (`$slate-50`, `#f8fafc`), che e' il token
con cui 10d ha gia' dipinto il desk e che il sistema commenta «panel under the cards».

**`--shadow-sm` (punto 9) e' il caso gia' arbitrato da 10d.** Dichiarato sia in
`tokens/_shadows.scss:42` (`0 1px 2px rgba(0,0,0,0.05)`) sia in `tokens.css:192`
(`0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)`); misurato a runtime dipinge il
secondo. Il ruolo dichiarato per queste card e' `--shadow-desk-card`, ed e' rimasto. Il commit di
10d lo motiva e `instanceManager10d.test.ts` lo pinna con un `not.toContain('var(--shadow-sm)')`:
spedire il prompt alla lettera avrebbe rotto quell'asserzione **e** cambiato l'ombra a schermo.

**Nessun lift hover sulle card.** Il prompt lo chiede «dove il DS lo prevede». Il DS non lo prevede
qui: le due card del manager non sono superfici interattive — non si cliccano, non si trascinano,
non si aprono — e un'elevazione che cambia al passaggio del mouse su una superficie inerte promette
un gesto che non c'e'. Non fatto, dichiarato.

**«radius 12px uniformi» era gia' vero.** Misurato: `--radius-card` = `--radius-lg` = `12px`, ed
entrambe le card lo portano da 10d. Gli altri raggi del foglio (4px sui controlli, 6px sui popover,
16px sui dialoghi) sono gradini diversi della scala per ruoli diversi; portarli a 12 avrebbe
appiattito il vocabolario di elevazione invece di uniformarlo. Non toccati.

---

## 2. Punto 1 — il checkbox, e il quarto che non c'e'

Tre `<input type="checkbox">` in tutto il tab, contati: la testata (select-all), la riga, e le voci
del pannello Columns di 10i. La regola li elenca per nome, e la suite conta i `type="checkbox"` del
sorgente perche' un quarto non entri in silenzio fuori dalla regola.

**`ISHISTORY` in riga NON e' lo stesso componente**, ed e' la dichiarazione che il prompt chiedeva.
Misurato: `I.bi bi-check-square instance-manager__bool` — un glifo Bootstrap reso da `Cell`, non un
input. Portarlo al DS sarebbe stato ridisegnare una cosa che non e' un controllo.

`appearance: none` e' la sola via: il checkbox nativo non accetta bordo ne' raggio, e `accent-color`
cambia il riempimento lasciando la misura. La spunta e' un `::before` in `clip-path` — dentro un
input non si puo' mettere un figlio.

**Il difetto trovato dal primo after.** Il ring del focus e il riempimento erano giusti, ma il
bordo di una casella spuntata **sotto il puntatore** leggeva `rgb(148,163,184)` (slate-400) invece
dello slate-700: `&:hover:not(:disabled)` pesa (0,3,0) e `&:checked` (0,2,0), quindi l'hover
vinceva su ogni ordine di sorgente. Chiuso con `:not(:checked)`. Una casella piena non ha bisogno
di hover: il riempimento e' gia' lo stato piu' forte che ha.

Il focus porta **due** anelli: l'`outline: 2px --color-border-focus` che ogni altro controllo di
questa barra gia' porta, piu' il ring `3px --color-accent-subtle` che il prompt chiede. Misurato,
`--color-accent-subtle` vale `rgba(51, 65, 85, 0.06)`: da solo, al 6% su bianco, non sarebbe un
indicatore di focus accessibile.

---

## 3. Punto 5 — l'emendamento A2 alla regola 2 di FL1

Il difetto **non e' nel manager**. `State` di `StateMachine.ecore` dichiara, in quest'ordine:
`name`(6) `kind`(3) `isHistory`(3) `timeout`(3) `entryAction`(6) `tags`(6, multi) `depth`(3,
derived). La prima riga chiude a 12; la seconda si chiude perche' `tags` non ci sta; e la
**regola 2 di FL1** — «l'ultimo scalare scrivibile di una riga corta si estende a riempirla» —
porta `entryAction` da 6 a 9. La riga e' 75/25 contro un `timeout` che il metamodello aveva
dichiarato largo quanto ogni altro numero.

`packRows` e' condiviso da ogni form dell'app, e la regola e' ratificata con la spec del
31-08-2026. **Il cap e' stato scelto da Alfonso**, fra tre vie proposte (cap in `packRows` con
spec emendata; cap in `autoLayoutRows` a valle; punto lasciato aperto): via 1.

`STRETCH_MAX = 6`. Poiche' ogni span base e' 3, 6 o 12 e ogni `free` e' multiplo di 3,
l'emendamento si riduce a due frasi: **un campo da un quarto di riga cresce ancora, e cresce fino a
meta'; un campo da meta' riga non cresce piu'.** Un campo che PARTE a 12 (`text`, `richtext`) la
tiene: A2 e' un tetto allo stretch, non a `baseSpan`.

Quattro asserzioni ratificate riscritte in `layout.test.ts`, ciascuna con il valore di prima nel
commento:

| test | prima | dopo |
|------|-------|------|
| `extends the last SCALAR of a short row` | `span 12, baseSpan 6, stretched: true`, `free 0` | `span 6, stretched: false`, `free 6` |
| `gives the whole row back to a lone scalar` | `span 12, baseSpan 3` | `span 6, baseSpan 3`, `free 6` |
| `still stretches a writable scalar that FOLLOWS a read-only one (A1)` | `[3, 9]`, `free 0` | `[3, 6]`, `free 3` |
| `breaks before a field that does not fit` | `[[6,6] free 0], [[12] free 0]` | `[[6,6] free 0], [[6] free 6]` |

Quattro asserzioni nuove nella sezione A2, fra cui il caso `entryAction` dello screenshot e
un'esaustiva su ogni combinazione di base e di riga precedente. `formAutoLayout.test.ts` non e'
stato toccato: la sua fixture usa l'ordine con `depth` prima, che chiude la riga a 12 e non stira.

**Raggio d'azione dichiarato**: ogni form dell'app (manager, rail del canvas, dialogo di create),
non il solo manager. Misurato a schermo sui quattro campi del soggetto: `entryAction` 583px -> 386px,
`timeout` invariato a 189px, gli altri sette invariati span per span.

---

## 4. Punto 4 — il doppione dei nomi, e perche' passa dal canale delle vuote

`tableFeatures` restituisce ogni attributo, `name` compreso, e in un metamodello che dichiara
`name : EString` la tabella lo stampa due volte: la colonna fissa, che nessuno puo' spegnere, e la
feature accanto. Il commento di `columnToggles` lo dichiarava «difetto noto, fuori dal perimetro di
10i». Qui si chiude.

Si chiude **per coincidenza e non per nome**: `duplicateNameColumnKeys` nasconde la colonna quando
ogni riga ripete davvero il proprio nome, e la lascia quando anche una sola diverge — li' porta
un'informazione che la fissa non ha (uno slot mai scritto, un rename applicato a meta'). `count ===
1` e' parte del confronto: uno slot multivalore che per caso comincia col nome e' una collezione,
non un doppione.

**Il canale e' quello di `emptyColumnKeys`**, come il prompt chiedeva di verificare: le chiavi
entrano nello stesso `hiddenColumnKeys`, quindi l'override del pannello vince sul doppione
esattamente come vince sulle vuote, `autoHiddenColumnKeys` lo conta come auto-nascosto finche'
l'utente tace, e `shownColumnsWith` — che 10i pinna testualmente — non cambia firma. Due array
avrebbero voluto dire due posti in cui una colonna puo' sparire.

**La parola «empty» non poteva restare, e non poteva nemmeno andarsene.** L'indicatore diceva «N
empty columns hidden» e `instanceManager10i.test.ts:317` piu' `10c.test.ts:444` pinnano quella
stringa letterale. Ma dire «empty» di una colonna piena di nomi e' la nota che mente al posto della
colonna che spariva in silenzio. Risolto tenendo **entrambi i rami**: la frase con «empty» quando
le auto-nascoste sono tutte vuote (misurato: e' il caso comune, e 10i resta verde senza toccarne
una riga), e la frase generale quando c'e' un doppione fra loro. Il `title` porta le due ragioni su
righe separate. A schermo, dopo: «**5 columns hidden**» con `Empty on every instance: kind, tags,
depth, outgoing` / `Same as the name column: name`.

`ColumnToggle` guadagna `duplicate?: boolean` — **opzionale**, perche' l'interfaccia e' esportata e
la Regola 11 ammette solo aggiunte opzionali. `empty` resta cio' che era, e la voce del pannello
dice «same as name» invece di «empty».

---

## 5. Punto 6 — tre voci diventano una

Misurato sul soggetto `Heater`, dove il difetto e' raggiungibile (vedi §8): a schermo parlavano dei
figli **tre** intestazioni, non due —

1. `Children`, la sezione che `IRForm` rende con i valori dello slot;
2. `states` + il tipo, l'occhiello del blocco inline del manager (`__inline-slot`);
3. `Add contained`, l'occhiello della barra della create.

Il prompt chiede di far sparire la terza. Fatto, e **solo** l'intestazione: la barra resta dov'e',
perde il proprio titolo e il proprio filetto superiore, e si legge come la coda della sezione sopra
— «i figli, e come aggiungerne uno». La CTA continua a nominare la metaclasse figlia, che e' la
sola parola che l'occhiello portava e che serviva davvero.

**`IRForm` non e' toccato**, ed e' la cucitura di 2a: la sezione `Children` e' sua, la monta anche
il rail del canvas, e darle una CTA vorrebbe dire infilare una callback per `IRForm` ->
`IRFormField` -> `ListWidget`, tre componenti che questo tab ospita invariati. E' la stessa ragione,
gia' scritta nel commento della barra, per cui la barra esiste come barra.

La seconda voce (`states`) resta: il prompt nomina l'occhiello `ADD CONTAINED`, e togliere anche
quello dell'inline sarebbe stato decidere al posto suo su una superficie che non ha chiesto.
**Punto aperto, dichiarato.**

---

## 6. Punto 7 — la gronda dell'owner, e perche' il difetto si vede solo su alcune righe

`egoLayout` centra il soggetto su `bodyH = max(inH, outH, EGO_SUBJECT_H)`. Con due uscenti `bodyH`
sale a 92 e il soggetto **scende da se'**: sul primo soggetto provato (`Running`, due `substates`)
la gronda misurava gia' 34px e il difetto non c'era. Si vede sul **vicinato minimo**, dove `bodyH`
resta `EGO_SUBJECT_H` e la gronda e' tutta e sola la banda. Il soggetto della misura e' quindi
`Off` — contenuto in `Heater`, nessun altro vicino.

Li' la gronda era **12px**, cioe' `EGO_ROW_GAP`, il gap fra due scatole **affiancate della stessa
colonna**, fra cui non passa niente. Fra owner e soggetto passa `ownerLink`, e la geometria e'
obliqua: la retta esce dal centro basso dell'owner e arriva 74px piu' a destra, mentre la scatola
dell'owner continua per 66px oltre il punto d'uscita. Su quel tratto la retta e' ancora **sotto**
la scatola, a `gap * 66/74` da essa — cioe' **10.7px**, rasente all'etichetta «owner» che sta
proprio li'.

`EGO_OWNER_GAP = 24`, costante nuova e propria: il doppio, sulla griglia da 8 del DS. La stessa
misura diventa **21.4px**. A schermo la gronda passa da 12 a 24 e `d` da `M 66 40 L 84 52` a
`M 66 40 L 84 64`.

---

## 7. Punto 8 — il copy, e il ramo che non esisteva

«Created from its container's form (Final, Initial, State, StateMachine)» faceva due giri: nominava
un **gesto** («la form del contenitore») e metteva la risposta fra parentesi, dove si legge come
una nota a piede. Il criterio: questa riga sta sotto una testata che ha appena tolto il «New» —
chi la legge ha gia' capito che non si crea di qui, e quel che gli manca e' il nome del contenitore.
Ora: **«Contained in StateMachine»**.

Il prompt lascia aperta la scelta «per le rootable la riga attuale puo' restare o semplificarsi».
**Il ramo non esiste**: per una rootable `newInstanceReason` risponde `null` e il bottone c'e'. Non
c'era una riga da semplificare, e la scelta era fra due cose di cui una non era sullo schermo.

Il caso degenere — ne' rootable ne' contenuta da nessuno — tiene la voce di prima meno il giro di
parole: «Created from its container». Li' un nome da dire non c'e', e inventarne uno sarebbe
peggio del giro di parole.

**Punto aperto**: `jjform/outline.ts:119` cita la frase vecchia dentro un commento di
documentazione. File fuori perimetro, non toccato; la citazione e' ora stantia.

---

## 8. La ricognizione: perche' `substates` non era un figlio

Il giro before non raggiungeva i punti 4, 6 e 7. Tre cause, tutte della fixture, e ciascuna
misurata invece che indovinata.

**(a) Lo slot `name` era vuoto.** `DObject.new(cls, m1, DModel, nome)` scrive `DObject.name`, non lo
slot. Con lo slot vuoto la colonna `name` finiva fra le sei auto-nascoste **per vuotezza** e il
doppione non era a schermo. Il modello dell'utente arriva da XMI, dove `name` e' popolato: e' quel
caso che va riprodotto, e la sonda ora scrive `l.$name.value` e lo asserisce.

**(b) `substates` non era una composizione.** Ricognizione dedicata (`_tmp_10k_recon.ts`), che legge
i flag dove stanno invece di dedurli dalla superficie. Due reperti:

- scrivere `containment = true` **dopo** `composition = true` riporta `composition` a **false**.
  Misurato: `states` (sola `composition`) legge `{composition: true, L.containment: true}`;
  `substates` (entrambe) legge `{composition: false, containment: false}`. La grafia legacy di §3.8
  non e' solo sconsigliata — **disfa** la scrittura canonica. Il tentativo di scriverle entrambe
  era mio, ed era il difetto.
- ma anche con la sola `composition`, `substates` resta `false`: e' un **auto-riferimento**
  (`State -> State`), e la `composition` di un auto-riferimento non si scrive.
  `useEditorMode.ts:421` costruisce `containment: !!(ref.composition)`, quindi la shape non vede il
  figlio, `subjectShape.children` e' vuota e la barra non si rende. Una sessione parallela ha
  chiuso indipendentemente il ramo di verita' di questo comportamento (`b7d9c4c10`, *set_containment
  tells the truth when it refuses a self-composition*), il che conferma il reperto per altra via.

Conseguenza sul perimetro: **su `State` il difetto del punto 6 non e' raggiungibile in questa
fixture**. E' stato misurato su `StateMachine`/`Heater`, dove `states` e `transitions` puntano ad
altre metaclassi e la `composition` si scrive. Il meccanismo — sezione `Children` di `IRForm` piu'
barra `Add contained` del manager sullo stesso slot — e' lo stesso.

**(c) Il pannello Columns si chiude al click sulla tabella.** Nel primo giro after la sonda leggeva
zero voci su un pannello che aveva davvero aperto: `tickRow` girava **prima** di `openColumns` e il
click esterno lo chiudeva. Un silenzio della sonda, non del codice — e la ragione per cui il
blocco 1 porta ora un controllo positivo (`1f`) che fallisce se il pannello non e' aperto.

---

## 9. Verifiche

- `npm run typecheck`: **33**, baseline invariata, conteggio su output **completo**.
- `npx vitest run`: **2885 passati / 0 falliti**; 9 file rossi in raccolta, tutti il noto
  `window is not defined`.
- Suite nuova `instanceManager10k.test.ts`, **37 casi**, provata con **otto** mutazioni — hover che
  vince su `:checked`, hover di riga tornato a `bg-tertiary`, pannello che non marca il doppione,
  eyebrow `Add contained` rimesso, doppione fuori dal canale, `STRETCH_MAX` a 12, banda dell'owner
  tornata a `EGO_ROW_GAP`, copy tornato alla frase vecchia. Rosse rispettivamente 1/1/2/1/1/6/2/2,
  verdi al ripristino in tutte e otto.
- Sonda: **before 20/29, after 49/0**, zero errori di pagina, stesso strumento su entrambi i lati.
- Non regressioni asserite **nello stesso giro** e verdi in entrambi: 10i (maiuscolo dal CSS con la
  stringa del metamodello intatta, pannello Columns montato con 9 voci), 10j (la card abbraccia il
  contenuto — 382px su un desk di 916), DS3.

## 10. Punti aperti

1. L'occhiello del blocco inline (`states`/`substates`) resta accanto a `Children`: e' la seconda
   delle tre voci del §5, e il prompt ne nominava una sola.
2. `jjform/outline.ts:119` cita la frase di copy che il punto 8 ha sostituito.
3. Il difetto del punto 6 su un **auto**-riferimento resta non riproducibile finche' la
   `composition` di un auto-riferimento non si scrive (§8b).
4. `--shadow-sm`, `--color-bg-secondary` e `--color-border-primary` restano fra i 15 nomi
   dichiarati due volte con valori diversi. Questa slice li ha aggirati, non chiusi.
