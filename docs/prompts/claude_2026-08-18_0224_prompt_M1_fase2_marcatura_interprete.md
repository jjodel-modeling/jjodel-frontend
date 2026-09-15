# Prompt M1 — Fase 2, implementazione: la marcatura come predicato dell'interprete IR

**Corsia**: completa (RC-3). Critical zone: `editor-v2/viewpoint/ir/` (CLAUDE.md §3.1).
**Effort**: xhigh.
**Go-ahead**: questo prompt È il go-ahead di Fase 2: il report di Fase 1
(`docs/discovery/discovery_2026-08-18_m1_marcatura_predicato_interprete.md`, commit `53f9fb65a`)
è stato analizzato in chat e le quattro domande bloccanti sono decise e a registro
(`e41248c99`: emendamenti a R-MK-4/5/7, sigle nuove R-MK-10 e R-MK-11).
**Layer Impact Report: OBBLIGATORIO PRIMA DEL DIFF.** Si parte dalla sezione «Materiale per il
Layer Impact Report» del report di discovery, si verifica durante, si salva secondo la
convenzione di PROTOCOL.md (in mancanza di un path fissato: `docs/reports/`, naming datato).
La deroga alla regola 11 (metodo obbligatorio su `ReadCtx`, interfaccia esportata) va dichiarata
lì, come da R-MK-4 aggiornata.

Leggi prima, per intero: la sezione «Serie R-MK» di `docs/decisions.md` (R-MK-1..11, con gli
aggiornamenti del 2026-08-18); il report di discovery (è la mappa: ogni scelta qui sotto ne cita
i numeri); le ultime entry di `docs/claude-code-log.md`.

---

## Perimetro — regola 19, file per file

La fetta supera i 3 file: l'elenco completo è qui sotto, con il cambiamento atteso per ciascuno.
**Nessun file fuori elenco**; `ObjectNode.tsx` compare per una sola riga di commento, dichiarata.
Prima di introdurre gli identificatori nuovi (`channelSink`, `channels`, `channelsInUse`,
`isMarked`, l'eventuale `irMarked.test.ts`), ricerca globale che il nome non sia in uso.

Il lavoro è in **due commit**, nell'ordine sotto. Il primo è inerte per costruzione (R1 del
report: il deposito senza consumatori non fa nulla); il secondo lo accende. Gate pieni a ogni
commit; verifica visiva unica all'hard stop finale.

### Commit 1 — `feat(editor-v2): marked predicate op, channels sink, isMarked on ReadCtx (M1a)`

1. **`frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts`**
   - `Predicate` (:24-31): ramo nuovo `| { op: 'marked'; path?: PathExpr }`, accanto a `isKind`.
   - `CompiledView` / `CompiledEdgeView` / `CompiledRowView` (~:386 / :330 / :365): campo
     **opzionale** `channels?: string[]` accanto a `dependencySet` (R-MK-5 emendata; precedente
     regola-11 della 2a).

2. **`frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts`**
   - `channelSink` module-scoped sul modello **esatto** di `crossPathSink` (:37-47): stessa
     disciplina install/harvest nei tre compile top-level (`compileView`, `compileEdgeView`,
     `compileRowView`), stesso save/restore difensivo, stesso commento di motivazione (compile
     sincrono e non rientrante).
   - `case 'marked'` in `compilePredicate`, **posizione accanto a `isKind` (:154), prima del
     `default`** (Q6 del report: senza il case, il default produce il TypeError).
     - Senza `path`: `(ctx, id) => ctx.isMarked(id)`.
     - Con `path` (R-MK-10): a compile-time `parsePathExpr(p.path)`; se gli step non sono
       esattamente uno con `feature`, `throw new Error('[ir] marked.path supports a single
       reference hop in v1: ' + p.path)`. La feature entra in `deps`. Closure:
       `(ctx, id) => { const t = ctx.getRef(id, feature, take); return t !== null &&
       ctx.isMarked(t); }`. `getRef` ritorna `null` sui casi di esaurimento (slot assente, array
       vuoto, `values` intero): il fallback di R-MK-7 è soddisfatto per costruzione, nessun throw
       a runtime. **Niente `crossPaths`** per la marcatura del target: la porta il canale globale;
       l'identità del target la porta la feature in `deps` (R-MK-10).
     - In entrambe le forme il case segnala `'mark'` al `channelSink`.
   - Harvest del sink nei tre compile → campo `channels` sui tre `Compiled*` (assente o vuoto se
     nessun canale: un ir senza `marked` compila **identico a oggi**).

3. **`frontend/src/components/editor-v2/viewpoint/ir/irReadCtx.ts`**
   - Interfaccia (:17-32): `isMarked(elementId: string): boolean`, **obbligatorio**, doc-comment
     col contratto (totale: non marcato è `false`, mai `null`).
   - `makeDrawReadCtx(idlookup, isMarked: (id: string) => boolean = () => false)` e la riga
     nell'oggetto ritornato.
   - **Il file resta a zero import.** Se ti trovi a scrivere `import` qui, fermati: stai
     contraddicendo R-MK-4 aggiornata.

4. **`frontend/src/components/editor-v2/viewpoint/ir/irReadCtxLproxy.ts`** — l'**unico** punto di
   iniezione: import di `isSimActive` da `../../sim/simRunState`; `makeReadCtx` inietta la
   funzione in entrambi i backend; `makeLproxyReadCtx` guadagna `isMarked` nel blocco delle
   deleghe strutturali (:45-48 — la marcatura non è un valore coerced dal proxy, stesso criterio
   del commento :42-44). **I 6 siti di chiamata di `makeReadCtx` non si toccano**
   (`irResolve.ts:85,142`, `useIRContainment.ts:123`, `IRNodeContent.tsx:142`,
   `EditorV2.tsx:171,967`).

5. **`frontend/src/components/editor-v2/viewpoint/ir/irValidate.ts`** — regola R-MK-11:
   vocabolario chiuso di `Predicate.op`, camminata **ricorsiva** (argomenti di `and`/`or`/`not`
   inclusi) su ogni predicato raggiungibile dall'ir, compresi i `when` dei `Conditional` e i
   `childFilter`. Implementazione candidata: scan generico del JSON dell'ir per oggetti con
   chiave `op` stringa fuori vocabolario — **prima verifica con grep che in `irTypes.ts` la
   chiave `op` appartenga solo ai rami di `Predicate`**; se compare altrove, ripiega sulla
   camminata mirata per campo. Messaggio: `[ir] unknown predicate operator "<op>"` più il
   contesto disponibile, nello stile dei messaggi esistenti (che sono UI: non riformularli
   altrove). La regola gira **prima** del compile-as-validator, così il TypeError del ramo
   `default` non arriva mai all'autore per questa classe di errore.

6. **Test** (in `ir.test.ts` o file nuovo `irMarked.test.ts` nella stessa cartella di test —
   verifica che il nome non esista): compile di `marked` senza path su `makeDrawReadCtx` con
   stub iniettato (marcato/non marcato); con path single-hop (target marcato, non marcato,
   slot assente → `false`); multi-hop rifiutato a compile col messaggio; `take` `values` intero →
   `false` senza throw; default del draw senza iniezione → sempre `false`; `channels` raccolto su
   tutti e tre i compile e assente per un ir senza `marked`; `validateIR` su op sconosciuto →
   messaggio leggibile, e su un ir con `marked` ben formato → `ok`. **Consapevolezza R1**: i test
   di deposito sono necessari ma non sufficienti; il consumo si testa al commit 2 e a schermo.

**Gate commit 1**: `npx tsc --noEmit` (baseline 33, Δ0); vitest subset editor-v2 (baseline 399 +
i nuovi); suite intera (baseline 1284 + i nuovi); `npm run build` exit 0.

### Commit 2 — `feat(editor-v2): mark channel wired into view resolution and containment (M1b)`

7. **`frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts`** — l'indice espone
   l'unione dei canali dichiarati da tutte le entry compilate (nodi, righe, edge): un
   `channelsInUse: Set<string>` (o ReadonlySet) calcolato al build dell'indice. È il precedente
   «unione a livello di indice» di `oaeSlotsSig` scelto in Q2 del report (lettura naturale di
   R-MK-6, granularità grossa dichiarata).

8. **`frontend/src/components/editor-v2/viewpoint/ir/irResolve.ts`** — `useIRView` e
   `useIRRowView`: sottoscrizione `useSimVersion()` **incondizionata** (rules of hooks; il
   precedente è il commento di `ObjectNode.tsx:191-193`), e il **valore** entra nella
   firma/memo solo quando l'indice dichiara il canale:
   `index.channelsInUse.has('mark') ? markVersion : 0`. È il twin operativo della clausola
   restrittiva di §9: nessun re-render per un canale non dichiarato.

9. **`frontend/src/components/editor-v2/viewpoint/ir/useIRContainment.ts`** — stesso pattern sul
   percorso di decorazione (in `oaeSlotsSig`, :80-111, o come dep aggiuntiva a :189, accanto ai
   precedenti `collapseVersion` / `edgeInteractionVersion`), gated su `channelsInUse`.

10. **`frontend/src/components/editor-v2/nodes/ObjectNode.tsx`** — **SOLO una riga di commento**
    a :195 (R5 del report): quella sottoscrizione è anche il canale gratuito di aggiornamento dei
    `Conditional` su `marked` per la view già risolta; chi ritirerà `sim-active` (fetta futura di
    R-MK-8) deve prima aver verificato che il canale di M1b copra il percorso. Nessun'altra
    modifica al file.

11. **`docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md`** — bersagli esatti dal Q8 del report:
    §3 (righe 38-44): capoverso per l'ottavo ramo di `Predicate`, sul modello della riga 44
    (R-B13); §9 (righe 170-179): il dependency set ha due parti, feature e canali dichiarati,
    clausola restrittiva conservata su **entrambe** (riga 175), riga 177 allineata
    all'aggiornamento R-B16 del 2026-08-18; §10 (righe 181-191): fallback di `marked`
    (R-MK-7 + interpretazione a registro: statico in `validateIR`, esaurimento a runtime senza
    throw). **v1.1 §3.3 non si tocca** (precedente R-B13). §13: nessun intervento.

12. **Test del consumo**: `channelsInUse` unione corretta su indice misto (view con e senza
    `marked`); la firma di risoluzione cambia col bump **solo** quando il canale è dichiarato e
    resta identica quando non lo è (il secondo asserto è la clausola restrittiva, non un
    dettaglio).

**Anti-regressione dovuta prima del commit 2** (dal report, sezione LIR): contare le
compilazioni/risoluzioni per bump su un canvas denso con un `console.time` temporaneo su
`resolveIRView`, **rimosso nel diff committato** (CLAUDE.md §2). `compileCache` regge per
costruzione (R8 del report: memoizza la closure, non il valore): nessuna invalidazione di cache.

**Gate commit 2**: identici al commit 1, più `npm run check:docs` (tocchi il log a fine task).

## Cosa NON fare

- Non toccare `isKind` (R-MK-10: il difetto lproxy è registrato in TECH-DEBT, gate è la verifica
  in console di Alfonso; correggerlo qui cambia comportamento committato fuori mandato).
- Non chiudere il ramo `default` di `compilePredicate` (rischio R2, registrato: fuori M1).
- Niente UI di authoring (`PredicateBuilder` è M2; R-MK-9: M2 dopo M1, non negoziabile).
- Niente `React.memo`, niente ottimizzazioni di granularità (R-MK-6 le rimanda a una misura).
- Niente rinomini, niente refactoring adiacente, diff minima e leggibile.

## Chiusura

1. Entry §21.2 in `docs/claude-code-log.md`: due commit citati, gate in baseline dichiarati,
   `Layer Impact Report: produced` (col path), `Smoke visivo: in attesa` — gli scenari sono i
   cinque della sezione LIR del report di discovery (principe/applicabilità/edge/non-regressione/
   pregresso), eseguiti da Alfonso su http://localhost:3001/ con hard-refresh.
2. Staging per file esplicito, `git add` e `git commit` nella stessa invocazione, mai `git add .`
   (sessioni concorrenti sono la norma).
3. **HARD STOP** dopo il commit 2 + entry di log: niente push, niente fette successive. La parola
   torna ad Alfonso per lo smoke.
