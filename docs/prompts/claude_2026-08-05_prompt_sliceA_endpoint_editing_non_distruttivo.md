# Slice A — Editing non distruttivo dei capi dell'object-as-edge

> Fase 2, con go-ahead già dato. **Un solo file di prodotto.** Fase 1 chiusa dalla discovery
> `docs/discovery/discovery_2026-08-05_panel_state_lifting.md` §2.4; decisione in
> `claude/ratifiche_2026-08-05_panel_state_lifting.md` R-1.
>
> Non è il sollevamento dello stato (Slice B). Questa slice **non introduce nessun componente
> nuovo** e non tocca gli altri due pannelli.

Leggi `CLAUDE.md` prima di iniziare. Leggi `docs/claude-code-log.md` per il contesto recente.
Leggi §2 del report di discovery citato sopra: contiene la traccia riga per riga del protocollo
che stai per modificare.

## Il bug

Da una object-as-edge **viva e committata** (entrambi i capi nell'`ir`), l'autore svuota il capo
sorgente. `applyEndpoints` (`EdgeAuthoringPanel.tsx:162-176`) entra nel ramo `else` e fa
`delete edge.source; delete edge.target` (`:170-171`). Il draft ora differisce, la validazione
passa, e dopo 300 ms `(view as any).ir = draft` (`:142`) **scrive davvero**: si perde anche il
capo destinazione, che era valido.

Da quel momento `isObjectAsEdge` è falso (`irCompile.ts:391`) e la view è **viva come
reference-as-edge** (`irResolveCore.ts:125`, ramo `false`): non è uno stato neutro, è un'altra
notazione, e sul canvas gli oggetti tornano nodi mentre le loro reference vengono stilate.

L'atomicità non è violata: è applicata a un input che non doveva riceverla. `applyEndpoints` non
distingue *"la coppia non è al momento usabile"* da *"l'autore vuole uscire da object-as-edge"*.

## COSA

### 1. Il ramo `else` non cancella più

In `applyEndpoints` (`EdgeAuthoringPanel.tsx:162-176`): quando **non** vale
`isUsableEndpointExpr(nextSource) && isUsableEndpointExpr(nextTarget)`, l'`ir` **non si tocca**.
Nessun `delete`, nessun `patch`, nessun dirty, nessun commit. Lo stato locale `sourceExpr` /
`targetExpr` continua a muoversi sempre, come oggi (`:163-164`): è lì che vive ciò che l'autore
sta digitando.

Effetto: l'ultima coppia valida resta nell'`ir` finché la coppia digitata non torna usabile, e a
quel punto il ramo `if` la sostituisce come già fa.

**Non toccare** l'early return di `:174` né il ramo `if` di `:166-169`: la scrittura resta
atomica e `applyEndpoints` resta l'unico scrittore dei capi.

### 2. `changeNature` resta la via esplicita per uscire

`changeNature('reference')` (`:193-200`) continua a droppare entrambi i capi. È il gesto con cui
l'autore dichiara di voler cambiare notazione, ed è l'unico che deve avere quell'effetto. Non
modificarlo.

### 3. L'hint sulla divergenza

Il punto 1 crea una divergenza **voluta** fra UI e `ir`: campo vuoto in editor, capo ancora
nell'`ir`. Va resa visibile, altrimenti sostituiamo una perdita muta con uno stato muto.

Quando la coppia digitata **non** è usabile **e** `draft.edge?.source && draft.edge?.target`
sono entrambi presenti, mostra sotto i due `PathBuilder` dei capi un `HelpText` che dica che la
view usa ancora i capi salvati finché la coppia non è completa, e che per rimuoverli si passa a
natura reference.

Usa i componenti già in uso nel file (`HelpText`, `ErrorText` da `ui`), lo stesso stile dei
messaggi vicini (`:457`, `:512`, `:524`). Testo in italiano, coerente con le stringhe presenti
nel file: la traduzione all'inglese è una pass separata già decisa (R-4 delle ratifiche del
2026-08-04), non farla qui.

## DOVE (lista chiusa)

| File | Intervento |
|---|---|
| `frontend/src/components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx` | i punti 1 e 3 |
| `frontend/src/components/editor-v2/viewpoint/authoring/__tests__/edgeAuthoring.test.ts` | i test del punto sotto |

Qualsiasi altro file: **STOP e segnala**. In particolare non toccare `irCompile.ts`,
`irResolveCore.ts`, `irValidate.ts`, `irTypes.ts`, gli altri due pannelli, né alcun file sotto
`ui/`.

## Test

I test esistenti che pinnano l'atomicità **devono restare verdi senza modifiche**:
`edgeAuthoring.test.ts:153`, `:159`, `:165` (un capo solo non produce `isObjectAsEdge`), più il
round-trip verbatim a `:207-236` e `:238-265`. Se uno di questi diventa rosso, la modifica ha
cambiato più di quanto doveva: **fermati e segnala** invece di aggiustare il test.

Aggiungi i casi nuovi:

1. `ir` con coppia valida; `applyEndpoints('', target)` → l'`ir` conserva **entrambi** i capi
   invariati e nessun commit parte.
2. `ir` con coppia valida; `applyEndpoints(sorgenteNonUsabile, target)` (per esempio una stringa
   che termina in `.values`) → stesso esito del caso 1.
3. `ir` senza capi; `applyEndpoints(source, '')` → l'`ir` resta senza capi (comportamento di
   oggi, invariato: non c'era nulla da preservare).
4. `ir` con coppia valida; `applyEndpoints(nuovaSorgente, nuovoTarget)` entrambi usabili → la
   coppia viene sostituita, atomicamente, come oggi.
5. `changeNature('reference')` su una object-as-edge viva → entrambi i capi droppati, come oggi.

## Gate automatici

1. `npx tsc --noEmit`: stesso set di errori della baseline, diff vuoto.
2. `npx vitest run`: tutti verdi.
3. `npm run build`: exit 0.
4. `npm run check:docs`: **è rosso da prima** per due entry del 2026-08-03 (`Corregge` e `Causa`
   in prosa libera). Verifica solo che la **tua** entry passi e che non si aggiungano fallimenti
   nuovi. Non rettificare le due entry vecchie: è un task suo, già ratificato.

## Verifica visiva (la esegue Alfonso, hard stop prima del commit)

1. Object-as-edge funzionante: svuoto il capo sorgente. Sul canvas **non cambia niente** (la
   view resta object-as-edge). Nel pannello compare l'hint del punto 3.
2. Ricompilo il capo sorgente con un path valido: la view continua a funzionare, nessun flash di
   notazione intermedia.
3. Svuoto il capo sorgente, cambio tab, torno: il campo si ripopola dall'`ir` (nulla è andato
   perso).
4. Passo esplicitamente a natura reference: entrambi i capi spariscono e la view diventa
   reference-as-edge, come prima di questa modifica.
5. Object-as-edge creata da zero (nessun capo nell'`ir`): compilo un capo alla volta, nessun
   crash, e la view diventa object-as-edge solo quando entrambi sono usabili.

## Chiusura

Un solo commit dopo la conferma visiva: `fix: keep committed edge endpoints while the pair is
being edited`. Entry in `docs/claude-code-log.md` con tipo `fix`, `Corregge` e `Causa` nella
forma prescritta da §21.3 (il gate le controlla), e:

```
**Nome del documento prompt**: 2026-08-05 13:10 prompt_sliceA_endpoint_editing_non_distruttivo
```

Nessun push senza go-ahead.

## Vincoli

- Zero refactoring opportunistico. Non rinominare identificatori esistenti.
- Non unificare `COMMIT_DEBOUNCE_MS` né `dirtyRef` con gli altri pannelli: è Slice B.
- Non sollevare stato, non introdurre componenti o context nuovi: è Slice B.
- Non toccare `natureOf` (`:65-67`): la proposta di farlo ritornare `'object'` con un capo solo
  è registrata ma **non ratificata**.
- Grep di collisione per ogni nome nuovo, prima di introdurlo.
- Non toccare la critical zone (`useJjomSync.ts`, `portDistribution.ts`); qui non c'è, ma la
  regola resta.

## RIFERIMENTI

Verificati nella discovery del 2026-08-05, riconfermare le righe se il file si è mosso.

- `EdgeAuthoringPanel.tsx:162-176` — `applyEndpoints`, il sito della modifica; `:78-81` —
  `isUsableEndpointExpr`; `:183-201` — `changeNature`; `:136-146` — effetto di commit con
  `validateIR` e timer 300 ms; `:500` — gate della sezione Capi su `isObject`; `:508`, `:520` —
  i due `PathBuilder`; `:65-67` — `natureOf`.
- `irCompile.ts:391` — `isObjectAsEdge: !!(sourceExpr && targetExpr)`.
- `irResolveCore.ts:125` — unico consumatore, decide il bucket.
- `irEdgeViews.ts:185` — il resolver object rifiuta comunque senza entrambi i capi.
- `view.tsx:484` — `set_ir`, whole-object replace.
- La scrittura atomica dei capi è ratificata in
  `claude/ratifiche_2026-08-02_eobj_object_as_edge.md` (R-1 di E-obj) e **va preservata**:
  questa slice cambia cosa succede quando la coppia non è usabile, non l'atomicità.

---
**Nome del documento prompt**: 2026-08-05 13:10 prompt_sliceA_endpoint_editing_non_distruttivo
