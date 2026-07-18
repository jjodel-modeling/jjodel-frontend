# Discovery — fallback della palette IR quando l'intersezione con le rootable è vuota

**Data**: 2026-07-18
**Branch**: `cloud/ir-editorv2` @ `dabeac79a`
**Tipo**: discovery breve read-only, propedeutica a fix scoped (Fase 2 pre-autorizzata salvo hard-stop)

## Obiettivo

Localizzare il punto unico dove EditorV2 calcola l'intersezione tra le metaclassi
dichiarate dalle view IR del viewpoint attivo (`paletteMetaclasses`) e le metaclassi
rootable, per introdurre il fallback normativo: intersezione vuota → palette completa
+ notice. Verificare che il filtro non tocchi file critical-zone e che esista un solo
punto di iniezione.

## Nota preliminare — discrepanza HEAD del prompt

Il prompt cita HEAD `18a08cc0f` (bundle v6). Quel commit **non esiste** nel repo.
Verifica eseguita: `git bundle list-heads ~/Downloads/cloud-ir-editorv2-v6.bundle`
restituisce `dabeac79a...` = HEAD locale corrente di `cloud/ir-editorv2`. Il bundle v6
**è già applicato**; l'hash citato nel prompt è semplicemente errato/stale. La base di
lavoro è quella intesa — nessun blocco.

## File letti (path completi)

- `frontend/src/components/editor-v2/viewpoint/ir/irInteraction.ts` (intero, 73 righe) — derivazione pura del plan.
- `frontend/src/components/editor-v2/viewpoint/ir/useIRContainment.ts` (intero) — `useIRInteractionPlan()` alle righe 50-57.
- `frontend/src/components/editor-v2/panels/PalettePanel.tsx` (intero, 265 righe) — rendering della palette M1.
- `frontend/src/components/editor-v2/EditorV2.tsx` — righe 1-40 (import), 1220-1244 (hook plan), 3550-3600 (wiring JSX).
- `frontend/src/components/editor-v2/viewpoint/ir/__tests__/ir.test.ts` (intero, 540 righe) — sede dei test Fase 3.
- `frontend/src/components/editor-v2/EditorV2.scss` — righe 700-880 (blocco `.editor-v2-palette--m1`, convenzioni testo secondario).
- `docs/specs/spec_2026-07-18_ir_schema_v1_2.md` — sez. 6 (righe 88-112) e mappa delle sezioni.
- `docs/claude-code-log.md` — ultime entry per contesto.
- `git show 876339c72 --stat` — perimetro del commit Fase 3.

## Findings

1. **Punto unico del filtro**: `EditorV2.tsx:3574-3576`. L'intersezione è un ternario
   inline nella prop `rootableClasses` di `<PalettePanel>`:
   `irInteractionPlan?.paletteMetaclasses ? modeInfo.rootableClasses.filter(c => plan.paletteMetaclasses!.includes(c.name)) : modeInfo.rootableClasses`.
   Grep globale su `paletteMetaclasses`: gli unici altri riferimenti sono la definizione
   (`irInteraction.ts:29,69`) e i test. **Nessun secondo punto di iniezione** → il
   go-ahead pre-concesso per la Fase 2 resta valido.
2. **Provenienza del plan**: `useIRInteractionPlan()` (`useIRContainment.ts:50-57`),
   memoizzato sulla firma IR; la derivazione è il modulo puro `irInteraction.ts`
   (`deriveIRInteraction`). `paletteMetaclasses` è `null` quando il viewpoint non
   dichiara view con metaclassi esplicite (wildcard-only) — mai array vuoto
   (`irInteraction.ts:69`).
3. **Palette M1**: `PalettePanel.tsx:117-141`, blocco `.palette-instances`. Empty state
   esistente: `palette-empty` → "No rootable classes found" (riga 123-124). È qui che
   atterra il caso limite osservato nello smoke.
4. **Nessun file critical-zone** (§3.1 CLAUDE.md) è coinvolto: il filtro non tocca
   `canvasToJjom.ts`, `useJjomSync.ts`, `portDistribution.ts`, né write-path D-layer.
   La palette è puro read/render; il write path resta l'API canonica a valle del drop.
5. **Convenzioni SCSS per la notice**: nel blocco `.editor-v2-palette--m1`
   (`EditorV2.scss:766+`) il testo secondario usa `font-size: 11px; color: var(--text-muted);`
   (cfr. `.palette-empty:827`). NB: `.palette-card__title:857` usa il token legacy
   `var(--accent)` — residuo noto (§7.2), da NON propagare nella notice.
6. **Identificatori nuovi — grep di collisione eseguito**: `applyIRPaletteFilter`,
   `palette-notice`, `irPaletteFallback` → zero occorrenze in `frontend/src/`. Liberi.
7. **Test**: i test Fase 3 vivono in `viewpoint/ir/__tests__/ir.test.ts`
   (`describe('irInteraction (Fase 3)')`). Il prompt chiede il test nel "modulo dove
   vive la logica del filtro": oggi l'intersezione è inline in EditorV2 (non unit-testabile);
   per testarla senza duplicazione va estratta come funzione pura in `irInteraction.ts`.
8. **Spec sez. 6**: il paragrafo normativo esistente termina con "Dettagli finali dopo
   la micro-discovery write path (Fase 3)." — il paragrafo di fallback va inserito
   subito dopo, prima di `## 7`.

## Piano di modifica (Fase 2)

- `irInteraction.ts`: nuova funzione pura `applyIRPaletteFilter<T extends {name: string}>(rootable, plan)`
  → `{ classes: T[]; fallback: boolean }`. Intersezione non vuota → filtrata,
  `fallback: false`. Intersezione vuota → tutte le rootable, `fallback: true` (solo se
  ci sono rootable da mostrare: con zero rootable il fallback è indistinguibile dal
  no-filter e la notice sarebbe contraddittoria con l'empty state). Plan null /
  `paletteMetaclasses` null → pass-through.
- `EditorV2.tsx`: il ternario inline (3574-3576) diventa una chiamata memoizzata a
  `applyIRPaletteFilter`; nuova prop `irPaletteFallback` verso `PalettePanel`. Nessuno
  state nuovo (`useMemo`, già importato a riga 1).
- `PalettePanel.tsx`: prop opzionale `irPaletteFallback?: boolean`; notice
  `palette-notice` dentro `.palette-instances`, sopra la lista, solo nel caso fallback.
  Testo: "Active viewpoint declares no views for creatable root classes. Showing all."
- `EditorV2.scss`: `.palette-notice` nel blocco `--m1`, 11px `var(--text-muted)`, stile
  coerente con `.palette-empty`.
- `ir.test.ts`: nuovo `describe` per `applyIRPaletteFilter` (4 casi: filtro attivo,
  fallback, plan null, rootable vuote). Test esistenti intatti.
- Spec sez. 6: paragrafo verbatim dal prompt.

## Dipendenze e rischi

- **Rischio basso**: il filtro è puro render-side; il write path (drop → `canvasToJjom`)
  non cambia. Il drop su canvas è già gated su `mi.rootableClasses` (EditorV2.tsx:1747-1749)
  che NON è filtrato dal plan IR — il fallback non allarga nulla lato write.
- L'estrazione della funzione pura sposta la logica ma non la duplica: l'unico consumer
  resta il punto JSX di EditorV2.
- `PalettePanelProps` non è esportata; l'aggiunta di una prop opzionale è comunque
  conforme alla regola 11 (solo proprietà opzionali).

## Domande aperte

- Nessuna bloccante. Unica nota: la condizione `fallback` è stata rifinita per il caso
  "zero rootable in assoluto" (notice soppressa, resta "No rootable classes found") —
  interpretazione coerente con "identica al comportamento senza filtro"; segnalata qui
  per trasparenza.
