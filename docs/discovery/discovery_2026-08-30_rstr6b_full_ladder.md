# Discovery — R-STR-6 (B): la ladder completa sul ramo IR, e il suo blast radius contato

Data: 2026-08-30. Sonde: `frontend/scripts/smoke/_tmp_rstr6b_blast.ts` (passo 0, il
conteggio) e `_tmp_rstr6b_verify.ts` (verifica, 16/16), nessuna delle due committata.
Fixture: `RowViewSmoke` + il viewpoint `IR Demo` su `AllNine`.

Chiude il costo dichiarato di (A) (`2a3e408c0`): sul ramo IR il gradino 0 dipingeva,
il gradino 1 e i gradini tipo/nome no — `guard` (`@renderer=code`) rendeva `code` sul
ramo nativo e testo piatto su quello IR.

---

## 1. Il blast radius, contato prima del diff

Il prompt lo chiede come dato per la ratifica di prudenza. **Come si conta senza
scrivere una seconda ladder**: la resa che il ramo NATIVO già produce per la stessa
istanza *è* la previsione, perché dopo il diff il segmento `value` fa esattamente
quella chiamata. Le due liste si appaiano per nome della feature — il ponte di
R-STR-7. Attribuzione per gradino dai fatti del metamodello letti da `idlookup`
(annotazione presente, tipo dichiarato, enum, reference), cioè gli stessi input che
la ladder consulta.

**Misura, su `AllNine` con il viewpoint IR Demo attivo:**

```
righe IR esaminate      : 24        (12 feature × 2 istanze)
senza riga nativa pari  : 0
righe che CAMBIANO resa : 24        → il 100%
per gradino:
  tipo                    12
  ladder colore / enum     4
  nome / pavimento         4
  gradino 1 (annotazione)  2
  guardia di stato         2
```

Dettaglio per feature: `tint`→swatch, `stroke`→enumChip, `visible`/`locked`→boolean,
`widthPx`/`plainCount`→numberUnit, `created`→date, `ratio`→progress,
`description`→truncatedText, `guard`→code, `notes`→dash, `tags`→enumChip.

**Il 100% è la misura vera, e va letto per quello che è**: oggi il segmento `value`
non rende NULLA della libreria, quindi ogni riga che la libreria sappia disegnare
cambia. Non è il 100% dei progetti reali — è il 100% del campione, che è l'unico
campione di view IR che il repo contiene (i tre stati di `npm run smoke` sono
progetti vuoti, senza view IR). Il limite è dichiarato, non aggirato: nessuna misura
qui dice quante view IR esistano nei progetti salvati degli utenti.

**Verifica dopo il diff, con la stessa sonda**: `righe che CAMBIANO resa : 0`, e i
renderer distinti sul ramo IR passano da `["none"]` a
`["swatch","enumChip","boolean","numberUnit","date","truncatedText","progress","code","dash"]`.
Le 24 righe previste sono esattamente le 24 cambiate: la previsione era la misura.

## 2. Nessun feature flag, e perché

Il prompt lo ammette «se serve prudenza», per UN giro, mai come fork della decisione.
Non è stato usato. Ragione: un flag acceso cambia tutto lo stesso, e uno spento
spedirebbe al buio proprio la cosa che il prompt chiede di chiudere. La prudenza che
il flag comprerebbe è già comprata dalla misura del §1, che è ciò che la ratifica
aspettava, e da un rollback che è un revert di un commit solo.

**Nessuna chiave IR nuova**, come il vincolo impone: la scelta resa/testo non è
per-view, è il comportamento del prodotto. Nulla è stato scritto sull'IR, quindi la
questione del VersionFixer (R-B9) non si pone.

## 3. Il diff

Due file, e il secondo è una condizione tolta.

1. **`nodes/ObjectNode.tsx`** — `renderViewWidget` diventa `renderRowValue` e perde
   la sua unica guardia: `if (!row?.slot.viewRenderer) return null` diventa
   `if (!row) return null`. Il ponte per nome resta quello di R-STR-7; la decisione
   resta l'unica `detectValueRenderer` che il ramo nativo fa per la stessa riga.
2. **`viewpoint/ir/IRNodeContent.tsx`** — la prop cambia nome e contratto: risponde
   per OGNI feature, non solo per quelle con un widget dichiarato. `null` ora
   significa «non ho una riga con quel nome», e il segmento rende il proprio testo:
   è il fallback che tiene in vita un compartimento che il lato nativo non modella.

Il motore **non è stato toccato**: l'ordine dei gradini è quello che (A) ha già
scritto in `detectValueRenderer` (guardie di stato → gradino 0 → gradino 1 → tipo →
nome), e questa slice si limita a farlo arrivare a schermo. Una sola decisione, mai
un secondo `detect` nel componente — il vincolo esplicito del prompt.

**Le due gesture della riga sopravvivono per costruzione**: il select delle reference
e l'input di edit intercettano PRIMA del segmento reso, e lo span che ospita la resa
conserva classe e `onDoubleClick`. Verificato che nessuna riga resta vuota (12 righe,
0 vuote): la resa sostituisce il testo, non lo cancella.

## 4. I test attesi, tutti passati (16/16)

- **coerenza fra i rami**: `guard` (`@renderer=code`) rende `code` su ENTRAMBI —
  è il test che (A) non poteva passare, ed è la ragione d'essere di (B);
- **gradino 1 → gradino 0 → Reset**: annotazione sola → `code`; annotazione +
  override → il gradino 0 vince; Reset → **torna a `code`, non al testo**. Quest'ultimo
  è esattamente ciò che distingue (B) da (A);
- **la mappa R-STR-3 sul gradino 0**: `textarea`→code, `select`→enumChip,
  `text`/`color`→truncatedText (`color` su una frase lunga non è dipingibile e degrada,
  come farebbe il gradino 1 — stesso `decide`, quindi non possono divergere);
- **gradini tipo/nome**: `tint`→swatch, `ratio`→progress, `visible`→boolean,
  `created`→date, `widthPx`→numberUnit, `stroke`→enumChip, ognuno confrontato con la
  resa nativa della stessa feature;
- **guardie di stato**: `notes` (slot vuoto) rende `dash`, e **continua** a renderlo
  dopo che gli si annota `jjodel/renderer=swatch` — la guardia vince sull'annotazione.

## 5. Cosa NON è verificato

- **`brokenRef` sul ramo IR**: la view IR Demo dichiara un solo compartimento, di
  sorgente `attributes`, quindi nessuna riga di reference è a schermo e la guardia
  `brokenRef` non è esercitabile su quel ramo con questo fixture. È coperta dal test
  unitario dell'ordine dei gradini e sul ramo nativo, non a schermo sul ramo IR.
- **Dark mode** e **`property.render = edge-label`**: fuori scope per prompt.
- **Fronte manager**: fuori scope. `instanceTable.ts` chiama `detectValueRenderer` per
  la tabella di 2b ed è la terza superficie viva della libreria, invariata da questa
  slice perché il motore non è stato toccato.
- **Le view IR nei progetti salvati**: vedi §1, il campione è quello che il repo ha.
