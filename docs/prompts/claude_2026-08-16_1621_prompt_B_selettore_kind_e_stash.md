# Slice B: selettore di kind con stash reversibile

> Rigenerazione fedele del prompt `2026-08-16_1621_B_selettore_kind_e_stash.md`, andato perso con il workspace della sessione che lo aveva prodotto. Ricostruito il 2026-08-16 dalle decisioni D6..D13 del checkpoint di sessione (`docs/sessioni/claude_sessione_2026-08-16_2.md`) e riverificato sul codice corrente. La dipendenza dalla slice A (guardia sul flush all'unmount, commit `634bc0ea2`) è soddisfatta. I rami row ed edge della derivazione `appliableTo` sono stati verificati a runtime (test B4 e B6, 2026-08-16).

## Contesto

Una view IR nasce con un `kind` (`vertex` | `row` | `edge`) scelto alla creazione e oggi immutabile. Questo intervento aggiunge un selettore di kind nel corpo `Applies to` dei pannelli di authoring, con conversione reversibile: i campi kind-specifici del kind che si abbandona finiscono in uno stash per-kind sul `DViewElement`, e tornando a quel kind si ritrovano. I campi condivisi (`metaclasses`, `authoringMetaclassPins`, `label`) non si stashano mai: vivono sempre nell'`ir` attivo e sopravvivono a ogni conversione.

La derivazione `ir.kind` -> `appliableTo` esiste già in `set_ir` (`view/viewElement/view.tsx:586`, commit `76b521726`): scrivere il nuovo `ir` attraverso il proxy L è sufficiente, non toccare `appliableTo` a mano.

## Vincoli architetturali (decisioni ratificate, non riaprirle)

- **D6 — Lo stash sta FUORI da `ir`**, come campo fratello `irStash` sul `DViewElement`. `irHash` (`irCompile.ts`) è un hash su `JSON.stringify(ir)` e alimenta la cache di compile e la factory-equality di `irDefaults.isMigratedDefaultView`: una chiave estranea dentro `ir` romperebbe entrambe in silenzio.
- **D7 — I campi condivisi non si stashano mai**: `metaclasses`, `authoringMetaclassPins`, `label` restano nell'`ir` attivo. Solo il resto entra nello slot del kind abbandonato. Tornando a un kind si restaurano i suoi campi specifici ma sulle metaclassi correnti.
- **D8 — Il selettore sta nel corpo `Applies to`**, dentro `IRIdentityFields`: è l'unico tab presente in tutti e tre i kind, quindi dopo lo switch il tab attivo resta valido e non scatta il fallback di `ViewData.tsx`.
- **D9 — Selettore visibile in modalità Basic**, nessun gate su `isAdvancedMode()`.
- **D10 — Nessun modale di conferma.** Il gesto è reversibile grazie allo stash. Al suo posto una riga di stato sotto il selettore, visibile solo quando almeno uno slot dello stash è occupato, con un bottone per scartare lo stash. Lo stash deve essere ispezionabile, non magico.
- I tre pannelli di authoring (`VertexAuthoringPanel`, `RowAuthoringPanel`, `EdgeAuthoringPanel`) **non vanno toccati**: montano già `IRIdentityFields` in cima al proprio corpo `Applies to`.
- `appliableToClasses` è un campo vivo e strutturale (catena di risoluzione dell'identità della metaclasse): **intoccabile**.

## COSA

Tre file, nessun altro.

### 1. `frontend/src/components/editor-v2/viewpoint/ir/irKindConvert.ts` (NUOVO, modulo puro)

Nessun import da React, joiner o store. Esporta:

```typescript
export type AuthorableIRKind = 'vertex' | 'row' | 'edge';

/** Slot per-kind: i campi kind-specifici dell'ir abbandonato (tutto tranne i condivisi). */
export interface IRKindStash {
    vertex?: Record<string, unknown>;
    row?: Record<string, unknown>;
    edge?: Record<string, unknown>;
}

export interface IRKindConversion {
    ir: AnyViewIR;        // il nuovo ir attivo, del kind target
    stash: IRKindStash;   // lo stash aggiornato (slot del kind di partenza scritto, slot del target consumato)
}

export function convertIRKind(
    current: AnyViewIR,
    target: AuthorableIRKind,
    stash: IRKindStash | undefined,
): IRKindConversion
```

Semantica:

- Campi condivisi: `metaclasses`, `authoringMetaclassPins`, `label`. Si estraggono da `current` e si sovrappongono SEMPRE all'ir di arrivo, da qualunque fonte provenga.
- Lo slot del kind di partenza riceve tutti i campi di `current` tranne i condivisi (incluso `irVersion`: al restauro si ripristina quello stashato).
- L'ir di arrivo: se `stash[target]` esiste, si ricompone da quello slot (più i condivisi correnti) e lo slot viene consumato (rimosso dallo stash restituito). Se non esiste, si parte da un seed minimo per kind:
  - `vertex`: `defaultObjectViewIR()` da `irDefaults.ts`;
  - `row`: `{ irVersion: 'ir-1.0', kind: 'row', template: [{ from: 'intrinsic', prop: 'name' }] }` (stesso seed di `EnableIRPanel`: una row senza `template` non compila, `compileRowView` la rifiuta);
  - `edge`: `defaultEdgeViewIR()` da `irDefaults.ts`.
- `target === current.kind` è un no-op: restituire `current` e lo stash invariato.
- La funzione non muta gli argomenti: costruisce oggetti nuovi.

Verificare prima che `irDefaults.ts` sia importabile da un modulo puro (non deve trascinare React o lo store). Se non lo è, replicare i due seed minimi inline con un commento che ne dichiara la provenienza, senza toccare `irDefaults.ts`.

### 2. `frontend/src/view/viewElement/view.tsx` (campo `irStash`)

- Sul `DViewElement`: dichiarare `irStash?: GObject` accanto a `ir`, con il suo `__info_of__irStash` (testo: stash per-kind della conversione reversibile del kind, un oggetto `IRKindStash`; undefined quando vuoto).
- Sul `LViewElement`: `get_irStash` banale e `set_irStash` con `SetFieldAction.new(c.data, "irStash", val, '', false)`. Nessuna TRANSACTION dedicata e nessuna derivazione: la derivazione di `appliableTo` appartiene a `set_ir` e non va duplicata.
- Uno stash vuoto (nessuno slot occupato) si scrive come `undefined`, non come `{}`: tiene pulita la persistenza e rende banale il test "c'è qualcosa da scartare?".

### 3. `frontend/src/components/editor-v2/viewpoint/authoring/irTabs.tsx` (selettore dentro `IRIdentityFields`)

Dentro `IRIdentityFields`, dopo il campo Name e prima di `ViewParentingFields`:

- Un campo `Kind` con il `Select` di `../../../ui` e le stesse tre opzioni di `EnableIRPanel` (`Vertex (node)`, `Row (inline)`, `Edge (line)`), valore corrente `(view as any).ir?.kind`. Renderizzato solo se la view ha un `ir` il cui kind è uno dei tre autorabili; per `graphVertex` o ir assente il selettore non compare. Rispetta `readOnly`.
- Al cambio: `const conv = convertIRKind(ir, nuovoKind, (view as any).irStash)`, poi due scritture via proxy L in quest'ordine: prima `(view as any).irStash = slotOccupati(conv.stash) ? conv.stash : undefined`, poi `(view as any).ir = conv.ir`. La seconda passa da `set_ir`, che deriva `appliableTo` nella stessa TRANSACTION: non scrivere `appliableTo` qui.
- Riga di stato (D10): sotto il selettore, visibile solo quando `irStash` ha almeno uno slot, elenca i kind stashati (es. "Stashed: vertex, edge") e offre un bottone `Discard` che scrive `(view as any).irStash = undefined`. Nessun modale di conferma, né sul cambio né sul discard.
- Stile dei nuovi elementi coerente con i campi esistenti del file (`jj-field`, `jj-field-label`, `InfoTooltip`).

## DOVE

- `frontend/src/components/editor-v2/viewpoint/ir/irKindConvert.ts` (nuovo)
- `frontend/src/view/viewElement/view.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/irTabs.tsx`

Nessun altro file. Se durante il lavoro sembra necessario toccarne un quarto, fermarsi e chiedere.

## COME

1. Leggere per intero `irTabs.tsx` e la zona di `view.tsx` intorno a `ir` / `set_ir` (righe 160..200 per `appliableToForIRKind`, 575..600 per `set_ir`), più `EnableIRPanel.tsx` per i seed e `irTypes.ts` per la partizione dei campi. Se una premessa di questo prompt non regge sul codice reale, fermarsi e segnalare il conflitto invece di adattare in silenzio.
2. Verifica collisioni nomi (obbligatoria prima di creare identificatori): `grep -rn "irKindConvert\|IRKindStash\|convertIRKind\|irStash" frontend/src` deve restituire zero occorrenze preesistenti. Verificato pulito il 2026-08-16, da riconfermare.
3. Implementare nell'ordine: modulo puro, poi campo su `view.tsx`, poi selettore.
4. Build: `npm run build` con exit 0. Typecheck: nessun errore nuovo rispetto alla baseline (33 errori preesistenti al 2026-08-16).
5. Commit singolo, scope stretto: `git add` dei tre file specifici, mai `git add .`. Messaggio: `feat: mutable IR kind with reversible per-kind stash`.
6. Aggiornare `docs/claude-code-log.md` con l'entry del task (dopo conferma visiva di Alfonso, come da protocollo).

## Hard stop

- Dopo il punto 4 (build e typecheck verdi), fermarsi PRIMA del commit e riportare: diff sintetica dei tre file, esito build, esito grep collisioni. Il commit parte solo dopo il go-ahead.
- Non modificare: i tre pannelli di authoring, `EnableIRPanel.tsx`, `irDefaults.ts`, `irCompile.ts`, `irValidate.ts`, `set_ir`, `appliableTo`, `appliableToClasses`, `ViewData.tsx`.
- `useJjomSync.ts` e `portDistribution.ts` sono critical zone: questo task non li riguarda; se un percorso sembra portarci, fermarsi.

## RIFERIMENTI

- Decisioni D6..D13: `docs/sessioni/claude_sessione_2026-08-16_2.md`
- Discovery sul discriminatore: `docs/discovery/discovery_2026-08-16_appliable_to_discriminatore.md`
- Derivazione esistente: `view/viewElement/view.tsx` (`appliableToForIRKind`, `set_ir`)
- Seed per kind: `components/editor-v2/viewpoint/authoring/EnableIRPanel.tsx`, `components/editor-v2/viewpoint/ir/irDefaults.ts`
- Partizione campi: `components/editor-v2/viewpoint/ir/irTypes.ts` (i tre kind autorabili dichiarano tutti `metaclasses`, `authoringMetaclassPins?`, `label?`)

## Smoke test (dopo il go-ahead e il commit, verifica visiva di Alfonso)

Progetto `test_B4_B6` (contiene già una view row "Class" e una edge "Package" prodotte dai test B4/B6):

- B1: view vertex, compilare campi vertex-specifici, switch a row: il pannello diventa row, `appliableTo` diventa `'Field'` (console: `idlookup[id].appliableTo`).
- B2: switch di ritorno a vertex: i campi vertex-specifici tornano, le metaclassi restano quelle correnti.
- B3: la riga di stato compare quando uno slot è occupato e sparisce con Discard.
- B5: reload del progetto: `ir`, `irStash` e `appliableTo` persistiti coerenti.

Attenzione nota: durante i test del 2026-08-16 l'editor si è congelato due volte (dopo "Add view" sulla riga viewpoint e dopo Enable IR edge, a valle della scrittura). Se il freeze si ripresenta durante lo smoke, interrompere e aprire una root cause analysis separata: non è imputabile a questa slice.
