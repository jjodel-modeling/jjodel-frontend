# Diagnosi live-preview Fase B — probe in corso (SUPERSEDE il fix TRANSACTION)

**La root cause "set_ir silenzioso / serve TRANSACTION" era SBAGLIATA.** Correzione di Claude Code, verificata sul codice:

- `SetFieldAction.new(...)` **non** è una scrittura silenziosa: `action.ts:569` chiama `.fire()`, che dispatcha (async, `setTimeout(dispatch,0)`). Quindi `set_ir` (bare, `view.tsx:484`) dispatcha già. Avvolgere `view.ir = draft` in `TRANSACTION` è un **no-op** per questo bug (coerente con "il 2 non funziona comunque"). **Non fare quel fix.**
- Il Template tab si ridisegna **non** per la TRANSACTION ma per il segnale extra `SetRootFieldAction('VIEWS_RECOMPILE_jsxString', …)` dentro `set_jsxString`. Il path IR non lo usa: invalida via `computeIRSignature`.
- Trace statico (view.ir=draft → set_ir → SetFieldAction → reducer `current[key]=draft` nuovo ref → `refToken(draft)` nuovo → `computeIRSignature` nuova stringa → `useIRView` re-render → nuovo `compiled.form` → `ir-shape--ellipse`): **dovrebbe funzionare**. Nessuna ragione statica del fallimento → il runtime diverge in un punto non visibile leggendo → **si osserva** (§5.1).

## Cosa fare (Alfonso, in-app)

Code ha già messo una probe temporanea `[irdiag]` (due file, hot-reload). Nel test bed:
1. Seleziona una vertex view → tab IR.
2. Cambia Shape rect → ellipse.
3. Aspetta ~1s, incolla le righe `[irdiag]` dalla console.

## Il verdetto è nella riga `[irdiag] commit {…}`

- `storedForm` ancora `rect` → il write non ha raggiunto lo store. **GIÀ ESCLUSO**: al reload la forma cambia, quindi il write persiste → `storedForm` sarà `ellipse`.
- `storedForm: ellipse` ma `sigChanged: false` → lo store è aggiornato ma la firma non cambia (trappola refToken/mutazione in-place, o il guard `parts.length > 1` di `computeIRSignature` se il viewpoint attivo ha ≤1 vista IR, o la view editata non è nel viewpoint attivo). Fix qui.
- `sigChanged: true` ma nessun nuovo `[irdiag] IRNodeContent render` con `form: ellipse` → firma cambia ma il nodo non ri-renderizza/ri-risolve (gate React/resolution).
- `sigChanged: true` e un render logga `form: ellipse` → stato+DOM aggiornati → il "bug" è **CSS** (`ir-shape--ellipse` non rende tondo). Fix diverso.

Poi Code scrive il fix corretto e toglie la probe. Niente committato.

## Riferimenti
- `action.ts:569` (`.fire`), `view.tsx:484` (`set_ir`) vs `:682-684` (`set_jsxString` + `VIEWS_RECOMPILE_jsxString`), `viewpoint/ir/irResolveCore.ts` (`computeIRSignature`/`refToken`, guard `parts.length > 1`, filtro `d.viewpoint === state.viewpoint`).
