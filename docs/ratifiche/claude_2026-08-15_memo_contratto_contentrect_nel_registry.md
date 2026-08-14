# Memo: il contratto `contentRect` / `boxForContent` è nel registry

**Data**: 2026-08-15 (notte del 14)
**Branch**: `alfonso-frontend-jjtl`
**Commit**: `3f918cd1f` — `feat(editor-v2): add the content rectangle contract to the shape registry`
**File**: `shapeRegistry.ts` (+254), `__tests__/shapeRegistry.test.ts` (+170), `docs/claude-code-log.md`. Nessun altro.

---

## Cosa è entrato

D9 è implementata. `contentRect(desc, boxW, boxH, contentH)` risponde a «dato questo box,
dove può stare un contenuto alto così» e restituisce un rettangolo **con la propria
posizione**; `boxForContent(desc, contentW, contentH, sizing?)` è l'inversa e realizza D8.
`boxForContentNumeric` è la stessa inversa per bisezione: assume solo la monotonia, mai una
forma chiusa.

Entrambe sono **a banda**, cioè prendono l'altezza del contenuto e non solo quella del box.
È la correzione che la misura ha imposto: il rettangolo inscritto statico è dimensionato per
la banda peggiore, mentre una riga singola occupa quella migliore.

Nessun consumatore è collegato. Il commit non può cambiare un pixel, ed è verificabile:
le tre funzioni non sono importate da alcun file di produzione.

---

## Decisioni prese

**D11 (2026-08-15). `H_min` ratificato a 64.** Alfonso, sul confronto visivo della sessione
precedente: a 48 un rombo a riga singola esce 225x48 e legge come un nastro, 64 dà 204x64,
80 dà 193x80 e spreca altezza. La costante è `GEOMETRIC_MIN_BOX_HEIGHT`, e vale per ellisse,
cerchio e rombo. Su `rect` e `rounded` il pavimento resta 40, quello già in `irStyle.ts`.

I test golden **restano a 48** e passano la policy esplicitamente: registrano una misura presa
con quel valore, mentre la costante registra una decisione, e le due cose sono libere di
divergere. Ricontrollati dopo il cambio: 22 su 22 verdi, typecheck fermo a 14.

**I quattro parametri di taglia stanno per forma, non in una policy globale.** `heightFactor`,
`minBoxWidth`, `minBoxHeight`, `minAspect` sono un campo `sizing` su ogni descriptor. Su `rect`
e `rounded` valgono `1 / 140 / 40 / 0`, cioè i pavimenti già in `irStyle.ts`, e la regola
degenera nell'identità come D8 dichiarava. Con una policy unica a `H_min` 64 anche un nodo
rettangolare avrebbe cambiato altezza, che non è quel che D8 diceva.

**`insetFractionAt` resta obbligatoria.** Renderla opzionale adesso richiederebbe un ripiego
in `DynamicHandles`, che ne è l'unico consumatore, e nessuna forma asimmetrica esiste ancora.
Il commento la dichiara precondizione (come D9 chiedeva) e indica quando il campo diventerà
opzionale: all'arrivo della prima forma della famiglia `pathTemplate`.

---

## Cosa provano i test

Dieci test nuovi, 22 in tutto sul modulo.

Gli **otto casi misurati sull'app viva** si riproducono al pixel (ellisse e rombo, tre
lunghezze di etichetta più il caso a due righe), con `minBoxHeight` 48 passato esplicitamente.
`heightFactor` è verificato contro l'argmax numerico di `v · avail(v)` sul profilo della forma,
quindi non è un numero scelto ma geometria. Forma chiusa e inversa numerica devono dare lo
stesso identico box su nove coppie di dimensioni e cinque forme. Il contenimento è verificato
a valle, arrotondando sempre per eccesso.

**Controllo positivo**: con `heightFactor` dell'ellisse portato da √2 a 1,5 cadono due test su
dieci (fattore geometrico e casi misurati), mentre contenimento e accordo fra le due inverse
restano verdi. Esito atteso: 1,5 sta fra √2 e 2, quindi contiene ancora ma non è più il
rettangolo di area massima. Le proprietà sono complementari, non ridondanti.

---

## Gate

Container Linux, `git archive` di `eaed495f6` più `npm ci` (831 pacchetti, 15 s).

| gate | esito |
|------|-------|
| `npm run typecheck` | 14 errori, baseline invariata, zero nei file toccati |
| `npx vitest run` | 1179 passed, 0 failed (1169 di baseline più i 10 nuovi) |
| `npm run build` | exit 0, 2m 08s |

Verifica di trasferimento: `sha256` dei file nel container (dove i gate sono girati) e sul
disco di Alfonso (dove il commit è stato fatto) coincidono, sia prima sia dopo l'amend.

---

## Prossimo passo

Collegare la misura in `IRNodeContent`: `ResizeObserver` su un wrapper a `width: max-content`,
perché su un box shrink-to-fit le percentuali di padding valgono zero nel calcolo intrinseco e
il box non cresce attorno al contenuto. Quello è il commit che cambia l'aspetto dei nodi
geometrici esistenti, quindi vuole il GO visivo.

Resta dopo il ritaglio a banda (difetto 3), terzo consumatore dello stesso profilo.

---

## Note di superficie

Sul repo lavora una **sessione concorrente**: durante questa sessione sono comparsi commit
(`c3854314c`, `eaed495f6`) e file untracked (`docs/prompts/`, `docs/ratifiche/`,
`docs/sessioni/`) non miei. Staging sempre per file esplicito, `git status` letto fra la
scrittura e lo staging, mai `git add .`.

Sul mount del bridge **git non riesce a cancellare i propri lock**, quindi ogni comando ne
lascia uno che blocca il successivo. Vanno spostati in `_to_delete/git-locks/` prima di ogni
invocazione, non solo all'inizio della catena.

In `_to_delete/gate-archive/` è rimasto il tar del working tree (33 MB) usato per portare il
repo nel container. Da cancellare a mano insieme al resto di `_to_delete/`.
