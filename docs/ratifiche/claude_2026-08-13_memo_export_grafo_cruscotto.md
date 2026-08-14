# Memo: export del grafo dal cruscotto (PNG e PDF)

**Data**: 2026-08-13
**Stato**: implementato nel bundle pubblicato, verificato headless, **non ancora a registro nel seed**
**Bundle**: `jjodel-tracciabilita` in gallery, seed `p20260813b` invariato

---

## Cosa cambia

Nella vista **Grafo** compaiono due bottoni sopra il disegno: `Esporta PNG` e `Esporta PDF`.
La riga dei bottoni della toolbar principale non è stata toccata: l'export è contestuale
alla vista che esporta, così non serve né disabilitarlo in vista Lista né accoppiarlo allo
stato del toggle.

**PNG**: clona l'SVG del grafo, gli mette `xmlns`, `viewBox`, `font-family` (la costante
`FONT` del bundle) e un rettangolo bianco di fondo, lo serializza in un data URL e lo
rasterizza su canvas. Densità doppia, con un tetto: la scala scende quanto basta perché il
lato lungo non superi 16000 px. Sul grafo attuale, 11318 × 1102, esce un PNG di
16000 × 1558 (scala 1,41) da circa 2,4 MB. Poi apre un overlay con l'anteprima, un link
`Scarica PNG` e il conteggio dei pixel, e prova il download da solo.

**PDF**: monta un host di stampa nel documento con l'SVG dentro, più un foglio
`@media print` che nasconde tutto il resto e dichiara `@page { size: <w>px <h>px; margin: 0 }`,
poi chiama `window.print()`. Il PDF esce **vettoriale**, con il testo selezionabile, e la
pagina è dimensionata sul grafo invece di essere spezzata su A4. L'host e il foglio si
rimuovono su `afterprint`, con una rete di sicurezza a 60 secondi.

## Perché l'overlay

Il cruscotto vive in un iframe sandboxed, e non è dato per certo che i download automatici
siano permessi. L'overlay è DOM normale del documento e c'è sempre: se il click sul link non
scarica, il clic destro sull'immagine sì. Vale come rete anche per il PDF, che se `print()`
viene rifiutato ricade sul percorso PNG.

## Come è stato innestato

Due punti soltanto, entrambi con ancora verificata univoca prima della sostituzione:

1. un declarator in più nella catena `const` del modulo, `tjExportGraph`, inserito subito
   prima di `SEED`;
2. la riga dei bottoni più l'attributo `id="tj-graph"` sull'`<svg>` del grafo.

Controllo eseguito dopo l'innesto: togliendo dal file nuovo esattamente i due testi
inseriti si riottiene il file vecchio byte per byte, quindi nient'altro è cambiato.
**L'array `SEED` è identico**: è una modifica di solo codice, `STORE_KEY` resta
`jjodel-trace-v31` e i dati nei localStorage di chi ha già aperto il cruscotto non vengono
rigenerati.

## Verifica

Headless in Chromium sul bundle vero: passaggio alla vista Grafo, `#tj-graph` presente a
11318 × 1102, i due bottoni al loro posto, click su `Esporta PNG` che produce un raster di
16000 × 1558 con la firma PNG corretta e un download di 2,4 MB, click su `Esporta PDF` che
crea host e foglio di stampa con l'SVG dentro e chiama `print()` una volta, pulizia
completa dopo `afterprint`. Console pulita a parte la richiesta a `fonts.googleapis.com`
che il sandbox blocca, presente identica anche nel bundle precedente.

Nota sui font nell'export: l'SVG serializzato porta `font-family` esplicito ma non incorpora
il font. Sul Mac, dove Inter è caricato, l'export lo usa; in un ambiente senza rete il
fallback è `system-ui`.

## Da fare al prossimo reseed

Aprire la voce nel seed, sotto la milestone «Cruscotto — evoluzione (2026-08-11)»: feature
chiusa, export del grafo in PNG e PDF, con la nota che è la **seconda** modifica di
comportamento scritta a mano dentro il bundle minificato, cioè un altro giro di interessi
sul debito `seed-cruscotto-jsx-sync`.
