# Prompt M1 — Fase 1, discovery read-only: la marcatura come predicato dell'interprete IR

**Corsia**: completa (RC-3). La fetta M1 tocca la critical zone (`editor-v2/viewpoint/ir/`,
CLAUDE.md §3.1): two-phase obbligatorio. Questo prompt è la SOLA Fase 1: read-only, zero
modifiche a file sorgente. L'unico file che questo task scrive, oltre al report, è
`docs/claude-code-log.md`.
**Effort**: xhigh. Se la sessione apre a high, `/effort xhigh` prima di iniziare (CLAUDE.md §0).
**Hard stop**: al report committato. La Fase 2 (implementazione M1) ha un prompt suo, generato
in chat dopo l'analisi del report. Non iniziare alcuna implementazione, nemmeno «preparatoria».

---

## Contesto

La serie **R-MK-1..9** è a registro in `docs/decisions.md` (sezione «Serie R-MK», 2026-08-18).
In sintesi: la marcatura effimera del run-state entra nell'IR come operatore di predicato
`{ op: 'marked'; path?: PathExpr }`, sul precedente di `isKind`; la sorgente è il singleton
`sim/simRunState.ts`, mai il bag `_state`; il dependency set acquisisce una seconda parte, i
**canali dichiarati** (insieme separato dal feature set, primi membri `mark` e `container`);
spec §9 emendata a due parti. La fetta M1 (R-MK-9) è solo interprete: `ReadCtx.isMarked` sui due
backend, l'operatore in `irTypes.ts` + `irCompile.ts`, l'insieme dei canali, l'emendamento §9,
test. **Nessuna UI.**

Questa discovery raccoglie ciò che serve per scrivere la Fase 2 senza premesse non verificate.

Leggi prima, per intero:

- `docs/decisions.md` — sezioni «Serie R-MK» e «Serie R-J» (coordinamento R-MK-4/R-J5 su
  `ReadCtx`), più R-B16 con l'aggiornamento 2026-08-18.
- `docs/ratifiche/claude_2026-08-18_memo_ratifica_marcatura_predicato_ir.md`
- `docs/claude-code-log.md` — ultime 5-10 entry.

**R-E/E-1 — i report esistenti non si riscrivono.** Due report coprono terreno adiacente; vanno
letti per intero e citati per path e sezione, mai ri-derivati:

- `docs/discovery/discovery_2026-08-17_state_attributes_data_node.md` — Q5b (l'IR non risolve
  `state`), Q8 (rischi del bag), e la mappa della reattività IR agganciata alle DValue.
- `docs/discovery/discovery_2026-08-17_sim_slice1_fondamenta.md` — fondamenta del pannello e
  wiring dell'highlight.

## Fatti già verificati in chat — confermare i consumatori, non ri-derivare

- `Predicate` è un'unione taggata chiusa: `irTypes.ts:24-31`; `isKind` compilato in
  `irCompile.ts:154-163`, con `path?` opzionale (target o elemento corrente).
- `compilePredicate` thread-a un solo `deps: Set<string>` (`irCompile.ts:125`); `compileOperand`
  (`:115`) somma i `featureNames` di `compilePath` in `deps`.
- Superficie di compilazione: `compileView` (`irCompile.ts:236`), `compileEdgeView` (`:371`),
  `compileRowView` (`:442`), `clearCompileCache` (`:475`), `irHash` (`:227`).
- `ReadCtx`: 6 metodi, `irReadCtx.ts:17-32`; `IR_READ_BACKEND = 'lproxy'` (`:16`); il backend
  draw esiste ed è da localizzare (Q4).
- `sim/simRunState.ts` (90 righe): `isSimActive`, `getSimActiveIds`, `simReset`, `simApplyStep`,
  `simClear`, `getSimVersion`, `useSimVersion` (su `useSyncExternalStore`).
- `ObjectNode.tsx:195-196` chiama `useSimVersion()` **incondizionatamente** e compone
  ` sim-active` nella className (`:402`, `:457`): oggi ogni bump tocca ogni nodo.
- La grammatica delle espressioni **non si tocca** in M1 (`STEP_RE`, `pathExpr.ts:23`): vietato
  da R-MK-1 e R-J7. Se durante la discovery sembra necessaria un'eccezione, è una domanda aperta
  per Alfonso, non una proposta di design nel report.

## COSA — le domande a cui il report DEVE rispondere

Ogni risposta con citazione file:riga. Ogni asserzione di assenza con controllo positivo
dichiarato in linea, eseguito con lo stesso strumento (CLAUDE.md §5: `command grep`, mai il
wrapper; `--include` solo con `command grep`).

**Q1 — Residenza e consumatori del dependency set compilato.** Mappa il percorso completo del
`deps: Set<string>`: dove nasce in `compileView` / `compileEdgeView` / `compileRowView`, in quale
campo dei tipi `Compiled*` (`irTypes.ts:~325-395`) viene depositato, e **ogni** lettore a valle di
quel campo (firme in `IRNodeContent.tsx:99-151`? `irCrossDeps`? altri?). Deliverable: tabella
origine → deposito → consumatori. Decide: dove vive e fluisce il secondo insieme
`channels: Set<string>` di R-MK-5 senza diventare pseudo-feature.

**Q2 — Meccanica di invalidazione odierna, end-to-end.** Come un cambio di feature diventa
re-render: composizione esatta di `compartmentSig` / `rowChildSig`, cosa entra nella firma, quali
memo la consumano, e come `irCrossDeps` concretizza in id di DValue (chi ricontrolla, quando).
Decide: il punto di innesto esatto dove `channels ∋ 'mark' ? versione : 0` entra nella
ricomputazione — e se esiste un punto che invalida il solo elemento dichiarante o se la firma è
per-nodo.

**Q3 — Meccanica di sottoscrizione al canale.** Il pattern R-SIM-3 oggi: `useSimVersion()`
incondizionato in `ObjectNode` (hook non condizionabili). Verifica se il costo di R-MK-6
(«bump → re-render di tutti i dichiaranti») nella pratica odierna è già «bump → re-render di
TUTTI i nodi» via `ObjectNode.tsx:195`, e cosa lo attenua (memo interni? confronto className?).
Il report distingue: costo di oggi misurabile vs costo dopo M1. Niente ottimizzazioni proposte:
R-MK-6 dichiara la granularità grossa; qui si documenta solo il punto di aggancio.

**Q4 — I due backend `ReadCtx` e tutti gli implementor.** Localizza il backend draw (file, riga),
tutti i siti di costruzione (`makeReadCtx` e simili), e **ogni** implementor strutturale
dell'interfaccia, inclusi i doppi di test: aggiungere un metodo obbligatorio rompe gli implementor
TypeScript. Conta e elenca i file che la crescita `isMarked(elementId): boolean` costringe a
toccare. Se il conteggio supera i limiti di corsia (>5 file), dichiaralo: è un input per il
perimetro della Fase 2, non un permesso di allargarlo.

**Q5 — Tutti i punti che smistano su `Predicate.op`.** Oltre a `compilePredicate`: `irValidate`
(valida la forma dei predicati? un `op` sconosciuto oggi passa o fallisce?), eventuali
serializzatori/funzioni di descrizione, e la lettura del `PredicateBuilder` (M2 è fuori scope, ma serve sapere
cosa fa OGGI il builder aprendo un IR che contiene un op che non conosce: si preserva o si
sanifica? precedente R-B15: mai sanificare).

**Q6 — Forward-compat del ramo `default` di `compilePredicate`.** Il ramo `default`
(`irCompile.ts:167-184`) tratta l'op sconosciuto come comparazione e chiama `compileOperand` su
`left`/`right` che per `{op:'marked'}` sono `undefined`. Verifica a codice cosa succede
(`parsePathExpr(undefined)`? throw a compile? quando?) e chi lo intercetta. Determina l'ordine
dell'edit in Fase 2 (il case `marked` va prima del default) e cosa deve dire `validateIR` per un
IR salvato con `marked` e aperto da un build più vecchio. Solo lettura; è ammesso eseguire la
suite esistente per conferma (`npm run test` mirato), vietato scrivere test nuovi in questa fase.

**Q7 — Cosa sanno fare i path nei predicati, oggi.** `compileOperand` → `compilePath`: i path
dentro i predicati partecipano ai cross-deps (`crossPaths`) o solo alle feature proprie? Un path
multi-hop in un predicato funziona o è single-hop de facto? Decide: cosa può onestamente
promettere `marked.path?` in v1 e con quali vincoli identici a `exists`/`isKind` (R-MK-7: path
che si esaurisce → `false` con diagnostica, mai throw).

**Q8 — Le sezioni di spec da emendare, con testo corrente.** In
`docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md`: il testo esatto di §9 (clausola
restrittiva), §10 (fallback), il punto dove è normato `Predicate` (rinvio alla v1.1 o corpo
proprio), e la rilevanza di §13 se cita il dependency set. Elenca heading e range di righe: la
Fase 2 emenda su bersagli precisi, non a memoria.

**Q9 — Panorama test e import-safety.** File di test esistenti per `irCompile` / `pathExpr` /
`irValidate` (baseline post-2b: 1284 suite intera, 394 subset editor-v2); le convenzioni di
import-safety nell'env vitest node (vedi header di `edgeAuthoring.test.ts`); verifica che
`sim/simRunState.ts` e `irCompile.ts` siano import-safe per test nuovi in Fase 2.

## Fuori scope — dichiarato, non implicito

- M2 (PredicateBuilder) e M3 (migrazione del canale `container`): niente analisi oltre Q5.
  M3 avrà la sua discovery sul sync (critical zone diversa).
- Qualunque modifica a sorgenti, spec, tipi. Qualunque test nuovo.
- Qualunque proposta di granularità fine dell'invalidazione (R-MK-6 la rimanda a una misura).

## DOVE — il report

`docs/discovery/discovery_2026-08-18_m1_marcatura_predicato_interprete.md`

Struttura, sul modello del report del 17/8: sintesi in cinque righe; metodo (disciplina grep,
controlli positivi); file letti con range; Q1..Q9; rischi individuati; **«Materiale per il Layer
Impact Report»** (layer toccati dalla Fase 2, scenari smoke candidati: es. viewpoint con
`marked` su `fill` + step di simulazione → solo colore, mai modello); domande aperte per Alfonso.

## Chiusura del task

1. Entry in `docs/claude-code-log.md` (formato §21.2 pieno: `Corregge` —, `Causa` —,
   `Layer Impact Report` not-required per la fase read-only, `Smoke visivo` non applicabile,
   `Prompt document name`: 2026-08-18 01:50).
2. Gate: `npm run check:docs` (tocchi il log) — atteso 2/2 PASS, 0 warning. Nessun altro gate:
   zero sorgenti toccati.
3. `git add docs/discovery/discovery_2026-08-18_m1_marcatura_predicato_interprete.md
   docs/claude-code-log.md` — mai `git add .` — e commit:
   `docs: M1 marking-as-predicate discovery (phase 1)`. Il report si committa nel task che lo
   produce (P4), mai lasciato untracked.
4. **STOP.** L'analisi avviene in chat; il prompt di Fase 2 arriva dopo, con Layer Impact Report
   obbligatorio prima del diff.
