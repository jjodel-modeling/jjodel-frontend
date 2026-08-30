# 2026-08-30 — `missing` sul nodo: la seconda copia della regola, tolta

**Data**: 2026-08-30
**Branch**: `alfonso-frontend-jjtl`
**Prompt**: «Missing sul nodo + delimitazione R-FORM-10», dato in chat e non depositato
in `docs/prompts/`. Due lavori, commit separati: (1) applicare a `decisions.md` la
delimitazione di R-FORM-10 gia' ratificata dal design; (2) far arrivare `missing` al
nodo, come UNA decisione presa nel motore.
**Sonda** (non committata, non in `npm run smoke`):
`frontend/scripts/smoke/_tmp_missing_verify.ts`, due modi (`node`, `table`).
**Esito**: fatto entrambi. Il reperto che ha cambiato il diff sta in §2: la divergenza
non era una mancanza nel nodo, era una **seconda copia della regola** nella tabella.

---

## 1. La delimitazione di R-FORM-10 (commit `eae3af0fa`)

Applicato il testo di §4 di `discovery_2026-08-30_6_rform10_controesempio.md`, ratificato
dal design il 30-08. Quello che e' caduto e' esattamente cio' che il fixture falsifica:

- il titolo («un delete lascia uno slot VUOTO, non un puntatore appeso») e la generalita'
  implicita che portava con se';
- la frase «non c'e' nessun puntatore appeso da rendere», e con essa la contestazione al
  commento del fixture `RowViewSmoke` del 28-08 — che per il **suo** percorso, con il
  proxy avvolto prima della scrittura, era vera.

Quello che resta e' tutto il misurato: la cascata raggiunge `case 'values'`, accorcia
l'array, e lo fa per i soli puntatori presenti nello snapshot su cui il proxy L e' stato
costruito. Restano le due conseguenze gia' ratificate (il «ref rotto» che comprende il
required senza valori; `clear` contro cascata, buco contro accorciamento). Aggiunto il
rimando al referto.

Un file, un commit, nessun sorgente.

## 2. Il reperto: la divergenza era una regola scritta due volte

Il prompt descrive il difetto come una mancanza del nodo — `SlotShape` non porta
`required`, quindi il nodo non puo' sapere. Vero, e non e' tutto. La misura di §5 del
referto del 30-08 diceva anche **dove** la tabella lo sapeva:

```
InstanceManagerTab.tsx:100-107   if (cell.missingRequired) { ... }   ← PRIMA dello switch
instanceTable.ts:208             missingRequired: feature.required && count === 0
                                                  && !broken && !feature.derived
```

La tabella non riceveva la classificazione: se la faceva, con una guardia piazzata davanti
allo switch sul renderer. Il motore ne era all'oscuro. Aggiungere `required` a `SlotShape`
e una guardia nella ladder, lasciando quella dov'era, avrebbe prodotto **due** copie della
stessa regola — che oggi concordano e domani no. Il perimetro e' stato quindi esteso di
due file, con conferma esplicita prima del diff (Regola 19), e ora:

- `detectValueRenderer` e' l'unico posto dove si decide `missingRequired`;
- il nodo la riceve dalla ladder, come `dash` e `brokenRef` (precedente R-STR-6 (B));
- `Cell` la riceve come `case` dello switch, non piu' come guardia;
- `TableCell.missingRequired` sopravvive come campo — la cella lo legge come stato, al
  pari di `broken` — ma e' **letto dalla decisione**, non ricalcolato.

Ratificato in `decisions.md` come **R-FORM-15**.

## 3. Dove entra la guardia, e perche' li'

```
isBroken            → brokenRef
required && vuoto   → missingRequired      ← nuova
vuoto               → dash
isReference         → refPill
molti               → collection
rung 0 (la view) …
```

Sopra `dash` perche' e' la distinzione che la slice esiste per fare. Sotto `isBroken`
perche' **un pointer appeso dice piu' del vuoto che pure e'**: uno slot required che tiene
un puntatore morto va segnalato come rotto, non come mancante — e' l'ordine che la tabella
gia' applicava (`!broken` nella sua condizione), portato nel motore.

`required` arriva dagli adapter, che la cardinalita' ce l'hanno gia' in mano:

| adapter | sorgente | superficie |
|---|---|---|
| `jjomTransformers.ts` | `feature.lowerBound >= 1`, accanto a `isMany` | nodo nativo e nodo IR |
| `instanceTable.ts` | `feature.required` di `jjform/shape.ts` (`lower >= 1`) | tabella del manager |

Entrambi escludono `derived`: una feature calcolata non e' un modello da riparare, e
segnalarla metterebbe un avviso su ogni riga di un metamodello che ne dichiara una. La
regola era gia' nella tabella; e' stata portata nell'adapter del canvas invece che nella
ladder, perche' il motore non deve sapere cosa vuol dire `derived`.

Il nodo IR non e' toccato: `IRNodeContent` chiede la riga a `renderRowValue`, che e' di
`ObjectNode` e passa per la stessa `detectValueRenderer`. Le due rese del canvas non
possono divergere per costruzione.

## 4. Resa

Nodo: `⚠ missing`, glifo `bi-exclamation-triangle-fill` e parola, in
`--color-inode-broken`. Stessa famiglia di `brokenRef` — stesso rosso — e distinta da
esso: triangolo contro cerchio, parola contro nome barrato. Il riferimento e' la colonna
della tabella 2b, che disegna lo stesso glifo accanto alla stessa parola. Stessa line-box
di 20px del pill che sostituisce, quindi uno slot che si svuota non cambia l'altezza del
nodo.

Nessun token nuovo: `--color-inode-broken` esiste in entrambi i fogli
(`_colors-light.scss:464` `#ef4444`, `_colors-dark.scss:361` `#f87171`), quindi il dark
mode e' coperto dalla definizione e non da una seconda dichiarazione. Ritagli catturati in
tema chiaro.

## 5. Misura a schermo — `_tmp_missing_verify.ts`, entrambi i modi ALL GREEN

Setup: `cfg` portata a `lowerBound 1` a runtime **e dichiarato** (senza required la
domanda non ha risposta), due bersagli `Config` freschi, e i tre stati costruiti col
meccanismo che R-FORM-10 ora delimita — `allNine_valued` svuotato da una delete con proxy
fresco, `allNine_broken` lasciato appeso da una delete con proxy stale, `allNine_noref`
mai scritto.

```
stato del D-graph: {"valued":{"len":0,"dangling":0},
                    "broken":{"len":1,"resolves":[null],"dangling":1},
                    "noref":{"len":0,"dangling":0}}

== 1. il nodo NATIVO ==
 allNine_valued: {"renderer":"missingRequired","text":"missing"}
 allNine_broken: {"renderer":"brokenRef","text":"Config_0"}
 allNine_noref : {"renderer":"missingRequired","text":"missing"}

== 4. il nodo IR ==
 allNine_valued: {"renderer":"missingRequired","text":"cfg=missing","compartments":2}
 allNine_broken: {"renderer":"brokenRef","text":"cfg=Config_0","compartments":2}
 allNine_noref : {"renderer":"missingRequired","text":"cfg=missing","compartments":2}

== 6. la TABELLA ==
 allNine_broken: {"cfgText":"broken","cfgClass":"instance-manager__broken"}
 allNine_noref : {"cfgText":"missing","cfgClass":"instance-manager__missing"}
 allNine_valued: {"cfgText":"missing","cfgClass":"instance-manager__missing"}
```

**Il contrasto**, che e' la meta' che rende la misura una misura: si toglie UN campo —
`lowerBound` torna a 0 — e ogni altro ingresso resta identico.

```
== 2. contrasto: cfg torna a 0..1 ==
 allNine_valued: {"renderer":"dash","text":"—"}
 allNine_broken: {"renderer":"brokenRef","text":"Config_0"}
 allNine_noref : {"renderer":"dash","text":"—"}
```

Il trattino torna, e il puntatore appeso **non** si muove: `brokenRef` non dipende dalla
cardinalita', che e' la stessa cosa che la matrice 2x2 del referto precedente aveva
misurato sul D-graph.

**I tre stati nella stessa schermata** (passo 3): `cfg` required-vuoto, `cfg` appeso, e
una terza riga non-required mai scritta. Quale riga sia stato **misurato, non ricordato**:
la sonda prende la prima riga del nodo che sia gia' `dash` e non sia `cfg`, e stampa quale
ha scelto (`notes`). La prima stesura nominava `ref`, che su `AllNine` non e' dichiarata:
la riga non esisteva e il controllo passava a vuoto. E' il reperto di metodo di questa
sonda — un contrasto su una riga assente e' un controllo che descrive se stesso.

**La guardia vince sulla view** (passo 5, estende i contrasti di R-STR-6 (B)): impostato
`widgets.cfg = 'textarea'` sulla demo view IR, le tre righe restano `missingRequired`,
`brokenRef`, `missingRequired`. Una view non puo' dichiarare non-vuoto uno slot vuoto, ne'
non-required uno required.

Zero errori di pagina in entrambe le corse. Ritagli `_tmp_missing_{native,ir,table}.png`.

## 6. Gate

- `npx vitest run`: **2092 passed / 0 failed**, **+10 esatti** sulle 2082, coi 9 file rotti
  all'import = baseline nota. I 10: 6 in `valueRenderer.test.ts` (i tre stati, il contrasto
  non-required, il required che tiene qualcosa, brokenness che vince, stato contro
  annotazione **e** contro view, il `reason`), 4 in `instanceTable.test.ts` (`required`
  derivata dalla cardinalita', il derived mai required, i tre stati fianco a fianco,
  il campo letto dalla decisione).
- `npm run typecheck`: **33 = baseline su output completo**, e nessuno degli errori cade
  nei file toccati (verificato per grep sulla lista intera, non su una finestra).
- `npm run build`: exit 0, solo l'avviso noto sui chunk > 500 kB.
- `npm run smoke`: **12 passed / 0 failed / 3 skipped**, VERDICT GREEN, con il blocco RUN
  VALIDITY della sessione parallela che dichiara la corsa quiescente e un boot per stato.
  **Dichiarato**: quella corsa ha eseguito `run.ts` e `assertions.ts` **modificati e non
  committati** dalla sessione R-SMK-3. Il verdetto vale per l'albero cosi' com'era, non
  per lo smoke a HEAD.

## 7. Cosa NON e' verificato

- **Il dark mode a pixel.** Il token e' definito in entrambi i fogli e non ne sono stati
  aggiunti: la copertura e' per definizione, non per ritaglio.
- **I placeholder di co-evoluzione** (`missingAttributes` in `ObjectNode`). Restano su una
  decisione `dash` costruita a mano, e va bene: `ObjectNode.tsx:220` scarta gia' le
  attributes required (`if (lb > 0) continue`), quindi un placeholder required non esiste
  e non c'e' divergenza da chiudere. Se quel filtro cadesse, questa e' la riga da
  rivedere.
- **`metamodelRenderer`** (l'inspector) non conosce `missingRequired`, e non deve:
  risponde a «cosa ha stabilito il modellatore» su una feature, non «cosa dipinge questo
  slot». Uno stato non e' una scelta di renderer.
- **La finestra fra il preflight e la conferma** e i **67 punti che chiamano `.delete()`**:
  aperti dal referto precedente, non toccati da questa slice.
