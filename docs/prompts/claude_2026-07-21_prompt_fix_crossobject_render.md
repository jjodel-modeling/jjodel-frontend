# Prompt Claude Code — Fix render multi-hop cross-oggetto (Opzione A+, helper condiviso)

**Tipo**: fix. **Branch**: `alfonso-frontend-jjtl`. **Fase 2** (la Fase 1 discovery read-only è GIÀ fatta e salvata: leggila prima). **Critical zone**: nessuna toccata. **LIR**: not-required (dichiararlo nel log).

## Contesto (non ridiscutere, è già ratificato)

Lo smoke in-app del cross-oggetto (spec v1.2 sez. 9) ha mostrato che le label multi-hop `$ref.value.$attr.value` rendono **vuoto**: solo il terminale single-hop `$ref.value` rende. Root cause (discovery Fase 1): l'accessor di `compilePath` naviga gli hop non-terminali col **backend attivo** (default lproxy), che su una reference restituisce nome/proxy invece del pointer id, mentre la reattività (`resolveCrossDeps`) naviga già per id (draw + `toId`). Il render e la reattività fanno la stessa camminata con semantica diversa: questa è l'asimmetria da chiudere.

Decisione ratificata: **A+** — estrarre la navigazione hop in un helper unico condiviso da render e reattività, così non possono più divergere.

## Prerequisito (Alfonso, in-app — pin F5)

Prima del test lproxy, confermare cosa restituisce davvero lproxy `.value` su una reference (proxy-oggetto atteso). Alfonso incolla in console sul progetto sm aperto e riporta l'output; se è un proxy con `.id` usa il mock proxy-oggetto, se è una stringa-nome adatta il mock. **Non blocca il fix** (robusto a entrambi), blocca solo la fedeltà del test lproxy.

## COSA

Implementare l'Opzione A+ in cinque parti additive:

1. **`navigateRefHop(idlookup, currentId, feature, take): string | null`** — funzione pura nuova in `irReadCtx.ts`. NON scriverla da zero: è l'**estrazione verbatim** della risoluzione per-hop che vive già inline in `resolveCrossDeps` (`irCrossDeps.ts` ~:89-98): `findFeatureRaw(idlookup, currentId, feature)` → per `take` `'value'` = `toId(dv.values[0])`, per `take` numero `N` = `toId(dv.values[N])`, per `take` `'values'` (whole-array su hop intermedio) = **dead-end `null`** (identico a oggi, coerente con reattività Q6.2 / OQ-5). DValue assente o `values` vuoto → `null`.

2. **`getRef(elementId, feature, take): string | null`** su `ReadCtx` (interfaccia additiva). Impl in `makeDrawReadCtx` = `navigateRefHop(idlookup, ...)`. In `makeLproxyReadCtx` = **delega a draw** (`draw.getRef(...)`), esattamente come già fa per `getName`/`getMetaclassName`/`isKindOf` (`irReadCtxLproxy.ts:43-45`): la risoluzione di una reference a id è strutturale, non value-coerced.

3. **`compilePath`** (`irCompile.ts` ramo hop non-terminale :117-120): per lo step non-terminale, `currentId = ctx.getRef(currentId, step.feature, step.take)`; se `null` → `return undefined`. Lo step **terminale** resta invariato (getValue/getValues col backend attivo: preserva la coercizione lproxy dove oggi c'è). Single-hop invariato (non entra nel ramo).

4. **`resolveCrossDeps`** (`irCrossDeps.ts`): rifattorizzare per chiamare `navigateRefHop` al posto della camminata inline. **Behavior-preserving**: i 17 test `irCrossDeps.test.ts` devono restare verdi senza modifiche. Correggere anche il commento (~:60-64) che dichiara di "mirror the compiled accessor exactly": ora è vero per costruzione (helper condiviso).

5. **Test** (`__tests__/ir.test.ts`), tre gruppi:
   - **lproxy-simulante (discriminante)**: un `proxyCtx` che su uno slot reference restituisce ciò che lproxy restituisce davvero (proxy-oggetto atteso, vedi pin F5); asserire che `$ref.value.$attr.value` naviga e rende l'attributo del target. Pre-fix: `undefined`. Post-fix: valore. NB: un test con `makeDrawReadCtx` NON cattura il bug (draw funziona già oggi) — il test DEVE usare la semantica lproxy o `getRef` diretto.
   - **`getRef` diretto su entrambi i backend**: draw → pointer id; lproxy → delega → **stesso** id (non il nome). Casi: `'value'`, `values[N]`, feature assente → `null`, reference vuota → `null`, whole-array intermedio → `null`.
   - **non-regressione single-hop**: label single-hop rende identica pre/post.

6. **Spec** (`docs/specs/spec_2026-07-18_ir_schema_v1_2.md`): emendamento in **sez. 12** (nota ReadCtx dual backend): "la navigazione degli hop non-terminali è draw-semantic (per id) su entrambi i backend, via `navigateRefHop`; solo il valore terminale passa dal backend attivo". Cross-ref di UNA riga da sez. 9. Rispettare le regole di scrittura (niente em dash, niente filler).

## DOVE (perimetro esatto, `git add` solo questi)

| File | Modifica |
|------|----------|
| `frontend/src/components/editor-v2/viewpoint/ir/irReadCtx.ts` | `navigateRefHop` (estratto) + `getRef` in interfaccia e `makeDrawReadCtx` |
| `frontend/src/components/editor-v2/viewpoint/ir/irReadCtxLproxy.ts` | `getRef` delega a draw |
| `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` | ramo hop non-terminale usa `ctx.getRef` |
| `frontend/src/components/editor-v2/viewpoint/ir/irCrossDeps.ts` | `resolveCrossDeps` chiama `navigateRefHop` (behavior-preserving) + fix commento |
| `frontend/src/components/editor-v2/viewpoint/ir/__tests__/ir.test.ts` | tre gruppi di test sopra |
| `docs/specs/spec_2026-07-18_ir_schema_v1_2.md` | emendamento sez. 12 + cross-ref sez. 9 |

Se serve toccare altro: **STOP e report**, non allargare.

## COME (vincoli)

- Interfaccia `ReadCtx`: solo **additiva** (`getRef` nuovo). I consumatori che ricevono una `ReadCtx` (irEdgeViews, irResolveCore, IRNodeContent, i tipi `Compiled*` in `irTypes.ts`) ereditano il metodo gratis, nessuna firma cambia. NON toccare `CompiledAccessor`/`CompiledPredicate`/`CompiledConditional` (Opzione B scartata).
- `resolveCrossDeps`: refactor **a comportamento invariato**. Prova = i 17 test `irCrossDeps.test.ts` verdi immutati.
- **F4 (obbligatorio, check di sicurezza)**: il fix rende funzionanti anche i **predicati** multi-hop, che oggi degradano a `undefined`. Un predicato multi-hop in una default/migrated view potrebbe cambiare l'**applicabilità** della view. Fare un grep dei predicati multi-hop (path con più di un `$`) nelle view default/migrate e nel test bed; se ne trovi, **STOP e report** con l'elenco prima di procedere, non cambiare comportamento in silenzio.
- Nessuna nuova dipendenza. Nessuna rinomina di identificatori esistenti. Edit puntuali, diff minimale.
- Verificare nomi nuovi con grep globale prima di crearli (`navigateRefHop`, `getRef`): CLAUDE.md §4.3.

## Discovery report

La Fase 1 è già fatta: leggi `docs/discovery/discovery_2026-07-21_*crossobject_render*` (questa sessione) prima di iniziare. NON rifare la discovery. Questo prompt NON ha una fase esplorativa nuova, quindi non serve un nuovo discovery report; aggiorna solo il log a fine task.

## Gate (tutti verdi prima dello STOP)

- `tsc` typecheck: baseline locale invariata (Δ0 nei file toccati).
- Vitest IR: `ir.test.ts` (nuovi test inclusi) + `irCrossDeps.test.ts` (17/17 immutati) verdi.
- `npm run build` verde (se OOM: `NODE_OPTIONS=--max-old-space-size=4096`).

## HARD STOP + accettazione (Alfonso, in-app)

A gate verdi, **STOP** per la verifica visiva di Alfonso. Criterio (spec sez. 9, smoke discriminante):
1. Transition resa come vertex con label `$src.value.$isInitial.value` → **rende** `isInitial` del target State (oggi vuoto). Acceptance: mostra `true`/`false`, non vuoto.
2. Editando `isInitial` sul target State senza toccare l'osservatore → la label si **aggiorna** nella stessa interazione. Prima volta che la reattività cross-oggetto è osservabile. Acceptance: cambio visibile senza re-select/re-mount.

Solo dopo l'OK visivo: commit `fix: navigate IR multi-hop paths by id on both ReadCtx backends (shared navigateRefHop)` e aggiorna `docs/claude-code-log.md` (tipo fix, file toccati, esito, LIR not-required, nota F4/F5).

## RIFERIMENTI

- Discovery Fase 1 di questa sessione (`docs/discovery/discovery_2026-07-21_*crossobject_render*`).
- `docs/discovery/discovery_2026-07-20_cross_object_reactivity.md` (F2, la limitazione era annotata).
- Siti: `irCompile.ts:107-124` (accessor), `irReadCtxLproxy.ts:22-31,43-45` (lproxy + delega), `irReadCtx.ts:35-48,77-109` (findFeatureRaw, draw), `irCrossDeps.ts:66-108` (walk da estrarre), `irEdgeViews.ts:193-202` (precedente `toId`).
- Decisioni ratificate: A+ (helper condiviso), `getRef` singolo con `take`, multivalore intermedio dormiente, emendamento spec sez. 12.
