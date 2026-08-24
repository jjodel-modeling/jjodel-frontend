# GO Fase B — slice 1b del layout per viewpoint (risposte al LIR del 2026-08-24)

**GO esplicito di Alfonso, 2026-08-24, sulle tre domande del LIR
`docs/reports/2026-08-24-lir-layout-slice1b.md` §domande al GO.** Questo documento integra il
prompt `claude_2026-08-24_1522_prompt_layout_slice1b_call_sites.md`: dove i due divergono,
prevale questo.

## Le tre risposte

**1. Letture: tutti e sette i siti di `jjomTransformers.ts`**, inclusi i tre trovati dalla
riverifica (`objectVertexToRFNode:346-348`, taglia del package `:243-244`,
`computeOptimalHandles:404-413`). Ragione: il read-through è per-record ovunque nel file o la
geometria diventa mista (nodi sul record, handle sugli scalari, archi ancorati dal lato
sbagliato).

**2. `LVoidVertex:1398-1425` resta sugli scalari**, opzione (a). Nessun arco
`model/` → `editor-v2/`, nessun instradamento di un insieme di consumatori non enumerabile per
grep. Si dichiara con un commento di una riga sul sito, nella stessa classe di `set_size`: il
percorso L-proxy legge e scrive la sintassi astratta qualunque sia il viewpoint attivo.
L'emendamento a R-LAY-16 che mette questa dichiarazione a registro lo fa la chat a chiusura
della 1b, non Claude Code.

**3. Osservabilità: opzione (c).** La 1b consegna la **persistenza** del layout per viewpoint;
la resa reattiva al cambio di viewpoint è una **slice 1c** dedicata, con prompt e LIR propri su
`useJjomSync.ts`. Il diff della 1b **non tocca** `useJjomSync.ts`.

**Regola 19: confermati i 6 file** — `vertexLayoutAdapter.ts` (nuovo), `canvasToJjom.ts`,
`jjomTransformers.ts`, `MetamodelTab.tsx`, `lastViewpoint.ts` (solo il commento `:64-68`),
`docs/claude-code-log.md`.

## Verifica visiva riscritta (sostituisce la sezione del prompt delle 15:22)

Finding C del LIR: un cambio di viewpoint non ri-trasforma i nodi, quindi l'osservabile della
1b è il **reload**, non il cambio a schermo. Su `http://localhost:3001/`, hard refresh, un
modello, due viewpoint esclusivi `A` e `B`:

1. **Persistenza e divergenza**: sposta un nodo sotto `A`, salva; attiva `B`, salva,
   `location.reload()` → il nodo è dov'era in sintassi astratta (read-through); spostalo sotto
   `B`, salva; attiva `A`, salva, reload → è dove l'ha lasciato `A`; disattiva tutto, salva,
   reload → la sintassi astratta non si è mai mossa.
2. **Primo gesto di solo drag** (emendamento R-LAY-15): sotto `B` sposta senza ridimensionare,
   salva, reload → la taglia resta quella efficace, nessun collasso.
3. **⌘Z**: subito dopo lo spostamento sotto `A` (prima del reload), undo → il nodo torna.
4. **Regressione zero**: senza viewpoint esclusivo attivo tutto identico a prima, nessun reload
   richiesto.
5. **Non-obiettivi dichiarati, attesi e non regressioni**: (i) il cambio di viewpoint **senza**
   reload non sposta i nodi a schermo — arriva con la 1c; (ii) resize via proxy L (`set_size`)
   e letture/scritture via `LVoidVertex` vanno sulla sintassi astratta qualunque sia il
   viewpoint attivo.

La entry di log dichiara (i) esplicitamente, con rinvio alla 1c, perché nessuno lo scambi per
un difetto della 1b.
