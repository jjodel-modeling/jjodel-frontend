# Discovery — R-STR-7: il gradino 0 e il ramo IR di ObjectNode

**Data**: 2026-08-29
**Corsia**: completa (RC-3) — tocca un'interfaccia esportata e supera i 3 file
**Oggetto**: sciogliere R-STR-7 montando il `RendererInspector` anche sul ramo IR

> Nota di processo (RC-10). Questo file non esisteva quando il prompt di Fase 2 lo ha
> citato: `ls` exit 1, con controllo positivo a 317 voci nella stessa directory. E' stato
> scritto in apertura di Fase 2 con le misure della Fase 1, che vivevano solo in chat.
> Le tre ratifiche non poggiavano su di esso — stanno nel prompt — quindi si e' proceduto.

---

## 1. Il fatto misurato

`ObjectNode.tsx:728` e' un `return` anticipato: il ramo IR
(`if (irResolution && !irDelegated)`) esce prima del corpo nativo. Il `RendererInspector`
e' montato a `:1271`, **dopo** quel return. Sul ramo IR non e' quindi mai in albero.

## 2. Due correzioni alla formulazione di R-STR-7

R-STR-7 attribuiva l'irraggiungibilita' a `viewWidget` «sempre `undefined`». La misura
sposta la causa.

**(a) `viewWidget` legge gia' la sorgente giusta.** A `:1281-1284` il mount fa
`irResolution?.compiled.formSpec?.widgets?.[featureName]`, con un commento che dichiara
la scelta di leggere dalla view risolta e non dallo store, «perche' sarebbe una seconda
sorgente per una chiave». Non c'e' nessun mirror da costruire. E' `undefined` sul ramo
nativo perche' li' `irResolution` o e' `null`, o e' una default view migrata, che non
porta `formSpec`.

**(b) La causa vera e' l'assenza di un punto d'ingresso.** `inspecting` e' lo stato che
monta il pannello, e gli unici due call site di `openInspector` sono `:1204` (Alt+click
sulla cella) e `:1236` (bottone `bi-sliders`), **entrambi dopo il return di 728**.
Controllo positivo sulla stessa grep: 24 occorrenze di `irResolution`, quindi la ricerca
ha segnale. Montare il pannello sul ramo IR senza un ingresso aggiunge un componente che
non si apre mai.

## 3. Perche' non e' un fix di superficie

Le righe del ramo IR le disegna `IRNodeContent`, con un modello dati suo
(`CompartmentRowData`, `IRNodeContent.tsx:100` — chiave = id del **DValue**, non della
metafeature) e gesture proprie gia' occupate: doppio click per editare
(`:549-556`), doppio click per il select dei singleton (`:512-518`).
`openInspector` vuole invece un `SlotRow`. Servono quindi: una prop nuova
sull'interfaccia **esportata** `IRNodeContentProps` (`:92`), un'affordance nella riga IR
che oggi non esiste, il ponte nome-feature -> `SlotRow` in `ObjectNode`, e lo stile.

**Ostacolo strutturale non previsto dal prompt.** `resetViewWidget` (`:969`) e
`openInspector` (`:983`) sono definiti **dopo** il return di 728: il ramo IR non puo'
chiamarli come sono. Vanno risaliti sopra il return. E' una rilocazione pura — le loro
dipendenze (`irResolution` :106, `metaclassName` :133, `liveFeatureIdMap` :154,
`slotRows` :615) stanno tutte gia' sopra 728.

## 4. Prerequisito: `slotRows` sul ramo IR — VERDE

Il ponte ratificato (lookup per nome su `slotRows`) regge solo se `slotRows` e' popolato
anche quando la riga la disegna l'interprete. `slotRows` (`:615`) e' un `useMemo` di
livello superiore su `data.features`, indipendente dalla view, ma il ramo IR non ne
mostra nulla nel DOM: non e' osservabile a schermo.

Misurato con `_tmp_slotrows_ir.ts` (fuori commit) leggendo il **fiber React** dell'elemento
`.mm-object[data-viewid]` — i props reali di quell'`ObjectNode`, senza toccare il sorgente
e senza instrumentazione:

```
nodes on canvas: {"total":7,"ir":2}
viewid: Pointer_IRDemoFlagView_AllNine   depth: 1
featuresIsArray: true   featureCount: 13
sample: ["tint:attribute","stroke:attribute","visible:attribute","locked:attribute"]
instanceOfClassId: Pointer1788013829949_USER_25
```

4/4 PASS, zero errori di pagina. Il ponte regge.

**Ostacolo di fixture, causa (g)**: `__jjodelInstallIRDemo` *installa* il viewpoint ma non
lo attiva — il suo stesso messaggio dice «Activate it from the viewpoint selector». Senza
l'attivazione dal `<select>` reale (`Toolbar.tsx:614`) il canvas resta in sintassi astratta
e il ramo IR non gira mai: la prima esecuzione della sonda dava `ir: 0` e quattro FAIL.
Ogni sonda futura sul ramo IR deve attivare il viewpoint, non solo installarlo.

## 5. Decisioni ratificate (prompt di Fase 2)

1. **Entry point**: doppia gesture. Alt+click sulla riga = acceleratore, identico al ramo
   nativo. Bottone `bi-sliders` a destra, `opacity: 0` -> `1` all'hover della riga,
   150ms ease-out. Nessuna collisione coi due doppio-click esistenti. Copy inglese (R-4):
   `Why this renderer`.
2. **Ponte**: `IRNodeContent` alza **solo il nome della feature**; prop nuova opzionale su
   `IRNodeContentProps` (Regola 11: aggiunta opzionale, consentita). `CompartmentRowData`
   intatta. `ObjectNode` risolve il `SlotRow` per nome e apre l'inspector esistente.
3. **Reset e sorgenti non si toccano**: `viewWidget` (`:1281`) e `resetViewWidget`
   (`:969`) sono gia' corretti e condivisi col Form tab.

## 6. Micro-voci fuori perimetro

Due, entrambe registrate e non toccate. Chiuse in giri successivi.

**(a) Residuo R-4 sull'affordance nativa. Sciolta il 2026-08-29.** Il `title` e l'`aria-label`
del bottone `bi-sliders` del ramo nativo erano in italiano, sopravvissuti al giro sulle
stringhe inglesi dello stesso giorno. Ora sono `Why this renderer` e
`Why this renderer for ${row.name}`, **identici** al gemello IR
(`IRNodeContent.tsx:596-597`), che era la referenza. Nessun test asseriva su quelle stringhe.

Nota sulle coordinate: la voce citava `ObjectNode.tsx:1227-1228`, ma alla chiusura le righe
erano `1284-1285` — le estrazioni di `a18fe1468` (`inspectorEl`, `openInspectorAt`) hanno
spostato il blocco. Un numero di riga in un documento invecchia; la stringa no.

**Residuo censito e NON corretto**, da giro dedicato: `ObjectNode.tsx:1201` porta
``title={`${metaclassName} e' singleton: questa e' la sua unica istanza`}``. Cercato su tutta
`editor-v2/nodes/` con due passate — accenti in `title=`/`aria-label=` (zero, controllo
positivo a 21 `title=` su 5 file) e parole italiane senza accento in attributi e in testo JSX
visibile (questa sola occorrenza).

**(b) Il footer della ladder va a capo male.** Misurato sul ritaglio
`scripts/smoke/_tmp_rstr7_rung0_button.png` (2026-08-29): con un override di view attivo il
footer rende «Green · on the canvas» spezzato su tre righe — `Green ·` / `on the` / `canvas`.

Coordinate per la prossima sonda:
- pannello: `.inode-inspector`, footer `.inode-inspector__footer`
  (`RendererInspector.tsx:243`);
- il pezzo che rompe: `<span className="inode-inspector__result-scope">· on the canvas</span>`
  (`RendererInspector.tsx:253`), dentro `.inode-inspector__result`, accanto al `RowValue`;
- si manifesta **solo** quando `viewOverride` e' vero: lo span non e' reso altrimenti, quindi
  una sonda sullo stato `auto`/`declared` non lo vede. Il ritaglio `_tmp_rstr7_rung0_afterreset.png`
  e' proprio quel caso e non mostra il difetto.

Preesistente a questa sessione — lo span e' di `25a707036`, non toccato qui.

**Misurato il 2026-08-29 (`_tmp_footer_measure.ts`), e la misura decide: e' larghezza, non
proprieta' flex.** Geometria del footer con `viewOverride` vero, pannello largo 1217px:

| elemento | left | right | width |
|---|---|---|---|
| `__result` (il padre) | 835 | 900 | **65** |
| `__result-scope` (il figlio) | 884 | 971 | **86** |
| `__action` «Back to the metamodel renderer» | 910 | 1094 | 184 |
| `__action` «Change renderer» | 1104 | 1201 | 97 |

Il figlio (86) e' piu' largo del padre (65) e sborda di 71px, fin dentro la prima azione che
comincia a 910. Il footer e' `display: flex`, `gap: 10px`, `flex-wrap: nowrap`. Sommando il
contenuto — RowValue + 86 + 184 + 97 piu' due gap — servono ~430px in una fascia che ne offre
~366: **mancano una sessantina di pixel, il contenuto non ci sta.**

**Tentativo fatto e revocato.** `flex: none; white-space: nowrap` su `__result-scope` toglie
l'andata a capo ma la converte in una **sovrapposizione**: lo scope smette di cedere e si
stampa sopra «Back to the metamodel renderer» (ritaglio catturato in sessione). Peggio del
difetto di partenza, quindi revocato: `rendererInspector.scss` e' tornato byte-identico a HEAD.

**Sciolta (2026-08-29), verso: accorciare la copy del Reset.** La decisione e' stata presa sul
proposal (Turno 7, mock 7c aggiornato il 2026-08-29) e non nel CSS, come la misura chiedeva.
La copy che sborda non e' lo scope ma **l'azione**: «Back to the metamodel renderer» (184px)
diventa **«Reset»** (32px), con la stringa lunga conservata nel `title`. Sono i ~150px che
mancavano, e in piu' allinea il lessico — il Reset del Form tab
(`FormAuthoringBody.tsx:585`) usa gia' quella parola per la stessa scrittura, e due superfici
che condividono una chiave non devono divergere nemmeno nel lessico.

`flex: none; white-space: nowrap` resta su `__result-scope` come **cintura**, non come fix:
con la copy corta i pixel rientrano da soli, ma lo scope non deve mai poter tornare a
spezzarsi parola per parola. Nulla d'altro in `__footer`/`__action` e' cambiato.

Geometria dopo, stessa sonda: `__result` 835→971 contiene il suo scope invece di essere
sbordato (prima il padre finiva a 900 e il figlio a 971), `Reset` occupa 1062→1094 — 91px di
franco invece di una sovrapposizione — e tutto sta su una riga (altezze 15/16px).
