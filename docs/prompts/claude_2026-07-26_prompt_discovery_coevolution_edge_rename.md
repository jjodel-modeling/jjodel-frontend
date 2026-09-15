# Prompt Claude Code: Discovery READ-ONLY — co-evoluzione M2→M1: connect edge fallisce dopo rename della reference

**Data**: 2026-07-26
**Tipo**: discovery / root cause analysis (READ-ONLY sul codice)
**Repo/branch**: jjodel-frontend / `alfonso-frontend-jjtl` (HEAD E0 o successivo)
**Working tree**: WIP noto (lane-separation + report discovery) estraneo a questo task: procedere, scritture ammesse SOLO report + entry di log.
**Hard stop**: dopo il report. Nessuna modifica al codice, nessun fix "già che ci sono".

## Repro osservato da Alfonso (il fatto da spiegare)

Dopo un **rename di una reference a M2** (metamodello editato live), a M1: il drag-connect da un nodo sorgente a un target disegna l'edge sul canvas, la label della reference appare per un attimo, poi l'edge **scompare** e il valore di reference **non risulta esistere a M1**. Nessun errore visibile.

Lettura preliminare (da verificare, non da assumere): edge ottimistico mostrato da React Flow → pass di sync che rigenera gli edge dai valori reali → il valore non c'è (scrittura mai atterrata o irrisolvibile) → edge rimosso. Innesco: risoluzione per NOME stale da qualche parte nel percorso del connect. Prior art della classe di bug: fix feature-picker by-id `4f1ff6aa6`.

## Ipotesi da discriminare (verdetto esplicito nel report)

- **H1 — scrittura che non atterra**: il connect handler identifica la feature da scrivere per nome (o con un dato catturato pre-rename e stale) e la scrittura fallisce in silenzio.
- **H2 — scrittura ok, rigenerazione no**: il valore atterra su uno slot valido (by-id), ma il transformer o un filtro a valle risolve per nome e non rigenera l'edge.
- **H3 — cache non invalidata**: il rename M2 non propaga a una struttura derivata (syncState, memo, derivazione palette/connect) che alimenta il gesto o la rigenerazione.

Il report DEVE aprirsi con il verdetto (H1/H2/H3, o combinazione, o quarta ipotesi emersa dal codice) e l'evidenza `file:riga`.

## Aree da mappare

1. **Connect gesture M1**: `EditorV2.tsx:1730-1744` (creazione edge via drag) e `:1915-1918` (reconnect object-as-edge). Cosa identifica la reference da scrivere: nome? id? `edge.data.referenceId`? Da dove arriva quel dato e QUANDO è stato catturato (closure? props? stato del drag?). Se esiste una derivazione "connect" della palette/InteractionSpec, come risolve la reference.
2. **Write path**: quale azione scrive il valore di reference (via `canvasToJjom`? `syncUpdateFeatureValue`/SetFieldAction?), come risolve la feature target (per id o per nome), e cosa succede quando la risoluzione fallisce: throw? no-op silenzioso? log? (Il silenzio è parte del bug.)
3. **Rigenerazione**: `utils/jjomTransformers.ts` — `jjomEdgeToRFEdge` e i siti M1 (composition `:454-467`, instanceRef `:470-482`): la generazione dell'edge dal valore risolve la feature per id o per nome? `data.referenceName`/`referenceId` da dove vengono letti a ogni pass?
4. **Rename a M2 nel D-layer**: cosa accade al rename di una DRef (e di una DClass): stesso id con `SetFieldAction` sul nome, o entità nuova? Chi reagisce al cambio nome e chi resta stale. Se il rename è by-id-preserving, elencare i siti del percorso connect/rigenerazione che usano il NOME (ognuno è un sospetto).
5. **Ordine degli eventi UI**: dove viene aggiunto l'edge ottimistico al RF state e quale pass lo rimuove: spiega la label che appare e scompare. (`useJjomSync.ts` SOLO lettura: è critical zone.)
6. **Caso di controllo**: dal codice, il connect funzionerebbe su una reference MAI rinominata? (Se anche il caso base è fragile, il rename è solo un amplificatore.) Se utile, indicare ad Alfonso il test manuale di controllo da fare.
7. **Probe console**: produrre uno snippet diagnostico ESATTO (con le vere strutture del D-layer) che Alfonso esegue dopo il gesto per discriminare H1 vs H2: dump dei value slot dell'oggetto sorgente (esiste un valore per la reference rinominata?) + dump della DRef rinominata (stesso id di prima del rename?). Includerlo nel report, pronto da incollare.

## Critical zone
`useJjomSync.ts`, `portDistribution.ts`, `canvasToJjom.ts`: SOLA lettura. Il fix, quando verrà progettato in chat, potrebbe toccarle: per questo il report deve dire con precisione QUALI siti del percorso stanno dentro e quali fuori.

## Report (unica scrittura, oltre al log)
`docs/discovery/discovery_2026-07-26_coevolution_edge_rename.md` con: **verdetto H1/H2/H3 in testa** con evidenza; file letti; findings per area con `file:riga`; il probe console; per il fix, una proposta fasizzata (minima correzione by-id vs bonifica sistematica dei siti by-name nel percorso edge) con l'indicazione esplicita di cosa tocca la critical zone (→ go-ahead + Layer Impact Report); domande aperte per Alfonso.

## COME
- Leggere per intero i file citati prima di riportare findings; niente tour oltre le aree.
- HARD STOP dopo report + entry di log (tipo `chore`, discovery). In chat: verdetto, catena causale in 5 righe, probe, proposta.

## RIFERIMENTI
- Discovery substrato edge: `docs/discovery/discovery_2026-07-26_edge_authoring_substrate.md` (Area 1: transformer, interazione; Q2: provenienza).
- Prior art bug by-name: commit `4f1ff6aa6` (picker resolves metaclass by id + dup-metamodel warning).
- Rischio noto in mappa: "invalidazione al cambio nome, fallimento silenzioso" (finora attribuito ai path delle view; questo repro lo estende al percorso di interazione).
