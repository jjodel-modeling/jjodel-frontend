# Prompt Claude Code — Layout per viewpoint, slice 1a, Fase 1 (discovery read-only)

**Corsia completa (RC-3), effort xhigh. Fase 1 di un two-phase: SOLO discovery, hard stop, nessuna
modifica ai sorgenti, nessuna proposta di diff.** La Fase 2 arriverà con un prompt suo dopo
l'analisi in chat. Leggere `CLAUDE.md` e `docs/decisions.md` a inizio sessione; se questo prompt li
contraddice, segnalare il conflitto e fermarsi.

## COSA

La slice 1a del layout per viewpoint (R-LAY-14..17, ratificate il 2026-08-24) introdurrà: il campo
opzionale `layoutByViewpoint` su `DVertex`, e un modulo puro con i due resolver
`writeVertexLayout` / `readVertexLayout`, testato senza DOM, senza toccare nessun call site.
Questa Fase 1 risponde alle domande D1..D7 sotto, con citazione `file:riga` per ogni finding,
e produce il discovery report. Niente altro.

## DOVE

Sola lettura su `frontend/src/**`. Unico file nuovo ammesso: il report
`docs/discovery/discovery_2026-08-24_layout_slice1a_sede_resolver.md` (creare `docs/discovery/`
se manca; se un report con questo nome esiste già, regola R-E/E-1: leggerlo per intero e
aggiungere un addendum in coda, non riscriverlo). A fine task: entry in `docs/claude-code-log.md`
e commit con `git add` dei soli file citati (report + log), mai `git add .`.

## COME — le domande

**D1 — Sede del modulo resolver.** Il modulo serve sia editor-v2 (`canvasToJjom.ts`,
`jjomTransformers.ts`, nella slice 1b) sia il classico (`MetamodelTab.tsx:138-139`, override
`LVoidVertex` in `GraphDataElements.tsx:1403-1425`). Candidate:
`components/editor-v2/viewpoint/ir/` (dove vivono i moduli puri dell'IR) o una sede neutra tipo
`joiner/` / `common/`. Misurare: esiste già un import dal classico verso `editor-v2/**`? (grep
mirato, con controllo positivo). Se sì citarne uno; se no, dire quale sede evita di aprire quel
verso di dipendenza.

**D2 — Import-safety del modulo e del suo test.** Vincolo R-LAY-16: modulo puro, zero dipendenze
dal joiner, test senza DOM (le 9 suite rosse `window is not defined` sono la baseline da non
allargare). Il tipo di record è il `GraphSize` di `Geom.ts:677` più `isResized`, ma la Fase 1b ha
misurato che importare `Geom.ts` a runtime nei test muore su `monaco-editor`/`jquery`. Misurare se
un `import type { GraphSize } from ...Geom` (type-only, erased al compile) lascia il test verde, o
se il tipo `VertexLayout` va dichiarato nel modulo senza import. Riportare la prova eseguita, non
l'aspettativa.

**D3 — Idioma di dichiarazione del campo su `DVertex`.** A `GraphDataElements.tsx:1662` e
dintorni: come sono dichiarati i quattro scalari `x/y/w/h/isResized` e i due precedenti a
dizionario (`isSelected` per utente, `ghostOffsets` per `refId`)? Decoratori, default statici,
macchineria `DPointerTargetable`? Elencare TUTTO ciò che la dichiarazione di un campo persistito
nuovo richiede di toccare (default in `classes.ts`? allowlist di serializzazione? adapter?).
Aspettativa da R-LAY-14: niente migrazione, il dizionario nasce assente e i progetti esistenti
sono già conformi. Confermarla o smentirla a codice letto, citando il percorso di serializzazione.

**D4 — Forma della scrittura sul dizionario.** Come vengono scritti oggi `isSelected` e
`ghostOffsets`? `SetFieldAction` con path annidato (`campo.<chiave>`)? Citare action e reducer.
Misurare se una scrittura `layoutByViewpoint.<vpId>` con un intero record come valore è
esprimibile con l'idioma esistente in **una** action (serve per R-LAY-15: materializzazione del
record completo più patch, senza stati intermedi parziali), e cosa fa l'undo su quel genere di
scrittura.

**D5 — Input del resolver: viewpoint attivo ed esclusività.** Citare l'espressione esatta con cui
`irResolveCore.ts:139` legge il viewpoint attivo, e dove vive il predicato di esclusività
(`isExclusiveView`?). Il resolver è puro: riceverà `activeExclusiveVpId: string | null` già
calcolato. Individuare dove dovrebbe vivere il piccolo adapter impuro che lo calcola (un punto
solo, R-LAY-11: nessuna seconda lettura dell'attivazione) e se esiste già una utility che fa
questo lavoro.

**D6 — Precedente di test senza DOM.** Indicare il test esistente più vicino per forma (modulo
puro, vitest, zero DOM; i test di `viewpoint/ir/__tests__/` sono i candidati) da usare come
modello nella Fase 2. Riprodurre le baseline: `npx vitest run` e `npx tsc --noEmit` (attesi:
1315+ passed con le 9 suite rosse note; 33 errori tsc, lista byte-identica alla baseline).

**D7 — Grep di collisione.** `layoutByViewpoint`, `VertexLayout`, `writeVertexLayout`,
`readVertexLayout`: attesi 0 in `frontend/src` (nota: `layoutByViewpoint` compare in `docs/**`,
va escluso dallo scope o dichiarato). Controllo positivo con la stessa forma di comando su un
nome che esiste (`ghostOffsets`).

## COME — il report (OBBLIGATORIO)

`docs/discovery/discovery_2026-08-24_layout_slice1a_sede_resolver.md`, naming standard
`discovery_<data>_<descrizione>.md`. Contenuto minimo: obiettivo, file letti con path completi,
findings D1..D7 con citazioni `file:riga`, dipendenze e rischi, domande aperte per Alfonso.
**L'hard stop di Fase 1 non è completo finché il report non è scritto e committato**: l'analisi
in chat parte dal report, non dalla memoria della sessione.

## HARD STOP

Dopo il commit del report e della entry di log: fermarsi. Nessuna modifica a sorgenti, nessun
diff proposto, Fase 2 solo su go-ahead esplicito dopo l'analisi in chat.

## RIFERIMENTI

- `docs/decisions.md`: R-LAY-14..17 (le righe ratificate che questa slice implementa), R-LAY-6,
  R-LAY-8, R-LAY-11, R-LAY-13; RC-3 (corsia completa), R-E/E-1.
- `docs/ratifiche/claude_2026-08-24_memo_ratifica_layout_slice1.md` (verbale, con i tre
  emendamenti) e `claude_2026-08-24_memo_proposta_layout_slice1.md` (la proposta, §2-§5).
- `docs/discovery/discovery_2026-08-24_layout_d1_d8_d10.md` (censimento D1..D8, D10) e
  `discovery_2026-08-24_layout_fase1b_storesize_runtime.md` (perché i test non hanno DOM).
- Baseline: tsc 33 errori, 9 suite rosse `window is not defined`, `npm run build` exit 0.
