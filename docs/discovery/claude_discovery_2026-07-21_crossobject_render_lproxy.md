# Finding — cross-object multi-hop label render vuoto sotto lproxy (smoke in-app 2026-07-21)

**Tipo**: finding da smoke in-app (primo test discriminante del cross-oggetto, spec v1.2 sez. 9). Riapre il cantiere cross-oggetto: non è chiuso end-to-end.
**Contesto**: test bed sm reale (Machine -> regions -> Region -> {states -> State, transitions -> Transition}; Transition.src/tgt -> State; State{name, isInitial}). Viewpoint IR installato via snippet console.

## Metodo

Probe viewpoint con la Transition resa come vertex e label a profondità crescente (letto in-app top-to-bottom). Backend attivo: default (IR_READ_BACKEND = 'lproxy').

## Risultati empirici (confermati in-app)

| PathExpr sulla label della Transition | Render |
|---|---|
| `{from:'literal'}` (controllo) | OK (rende) |
| `$src.value` (terminale) | "State_0" = **nome intrinseco** del target (non l'attributo `name`) |
| `$src.value.$isInitial.value` | **vuoto** |
| `$src.values[0].$isInitial.value` | **vuoto** |
| `$src.$isInitial.value` | **vuoto** |
| `$src.$name.value` | **vuoto** |

Nessuna forma multi-hop naviga reference -> attributo del target. Solo il terminale `$ref.value` rende, e rende il nome intrinseco del target.

## Root cause (indicata, da confermare in Fase 1 discovery sul codice)

Da `claude/discovery_2026-07-20_cross_object_reactivity.md` F2: l'accessor compilato di `compilePath` (`irCompile.ts:77-94`) naviga gli hop non-terminali con `ctx.getValue(currentId, feature)` e pretende un **pointer string** (`irCompile.ts:89`, check `typeof out !== 'string'`). Sotto backend **lproxy** (`irReadCtx*Lproxy`, default) `$ref.value` su una reference restituisce il nome/un proxy del target, **non** l'id: il secondo hop non ha un id valido da navigare -> undefined -> label vuota. Il workaround `toId()` è solo negli endpoint object-as-edge (`irEdgeViews.ts:191-193`), **non** nel multi-hop di `compilePath`.

Asimmetria chiave: la **concretizzazione dei dep pair** (reattività) usa già semantica draw / `findFeatureRaw` (id corretto), mentre il **render accessor** usa lproxy (nome, sbagliato per la navigazione). Il cantiere opzione-d ha allineato la reattività ma non il render.

## Impatto

- Il cross-oggetto (spec sez. 9) **non è funzionante end-to-end** nel config di default: la label multi-hop non rende, quindi la reattività non è osservabile (niente da invalidare).
- Aggiorna lo stato del checkpoint `sessione_2026-07-21.md`, che dava il cross-oggetto "CONSEGNATA E APPLICATA, manca solo lo smoke": lo smoke ha trovato il gap. Il cantiere si **riapre** sul render.
- Prerequisito P1 (core interattivo): rilevante. Da chiudere prima del paper.

## Fix proposto (cantiere)

Portare la normalizzazione a id (`findFeatureRaw`/draw + `toId`) sugli **hop intermedi** di `compilePath`, speculare a `irEdgeViews.ts:191-193`, così il multi-hop naviga per id indipendentemente dal backend. Perimetro atteso: `irCompile.ts` (accessor multi-hop), eventualmente `irReadCtx.ts` (helper). **Non** critical zone (modulo ir). Fase 1 discovery read-only obbligatoria (salvare report in `docs/discovery/`) per confermare il sito esatto prima del fix.

Alternativa scartabile a breve: switch globale `IR_READ_BACKEND = 'draw'` — implicazioni più larghe (coercizione upperBound, benchmark comparativo pendente, spec sez. 12); non è il fix chirurgico.

## Verifica

1. Prova diagnostica della root cause: settare temporaneamente `IR_READ_BACKEND = 'draw'` e ri-runnare il probe -> i valori multi-hop devono rendere. Conferma che il render era il problema.
2. Fix in `compilePath` (normalizzazione hop intermedi).
3. Ri-runnare lo smoke discriminante (Transition-vertex osserva `$src....$isInitial`): la label rende E si aggiorna editando `isInitial` sul target senza toccare l'osservatore. Post-fix PASS.

## Riferimenti

- `claude/discovery_2026-07-20_cross_object_reactivity.md` (F2, la limitazione era già annotata come nota per il fix)
- `claude/spec_2026-07-18_ir_schema_v1_2.md` (sez. 9 dependency set/reattività; sez. 12 nota ReadCtx dual backend)
- `claude/sessione_2026-07-21.md` (stato pre-smoke)
- Snippet probe usati: `claude/snippet_2026-07-21_sm_ir_testbed_viewpoint.js` (base install pattern)
