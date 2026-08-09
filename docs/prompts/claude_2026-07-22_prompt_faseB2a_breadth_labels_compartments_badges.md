# Prompt Claude Code — Authoring IR, Fase B2a (breadth: lista label, fieldCompartments, badge, tab Basic/Advanced shell)

**Tipo**: feat. **Branch**: `alfonso-frontend-jjtl`. **Critical zone**: nessuna. **LIR**: not-required. **No** VersionFixer migration.

## Contesto (ratificato, non ridiscutere)

La Fase B (committata) ha consegnato `VertexAuthoringPanel` come fetta verticale centrale: shell + ciclo edit (draft locale, validate eager, commit debounced, write immutabile `view.ir = next`) + `shape.form/fill/border` + **una sola label** (`shape.labels[0]`, via `TextSourceEditor` + `PathBuilder`). Tutto il resto dell'IR veniva preservato verbatim nel round-trip.

Questa **Fase B2a** estende in **ampiezza** lo stesso impianto, senza toccarne il ciclo edit/validate/commit:
1. **Lista label completa** (`shape.labels[]`, non solo l'indice 0): aggiungi/rimuovi/riordina, ciascuna con lo stesso editor già costruito per la label primaria.
2. **`fieldCompartments`**: nuova sezione, lista di compartimenti con editor dei `segments`.
3. **`badges`**: nuova sezione, lista di badge.
4. **Tab Basic/Advanced** (shell): introduce il contenitore a due tab nel pannello. In questa fase **Advanced è un placeholder inerte** (nessun controllo funzionante): la Fase B2b (prompt separato, da ratificare) ci costruirà il Conditional/Predicate builder. Basic contiene tutto quanto sopra (Fase B + B2a).

**Perché la tab ora e vuota**: tutti i nuovi campi qui sotto restano, per i sotto-campi che nello schema sono `Conditional<T>` (es. `label.visible`, `badge.icon`, `badge.visible`, `fieldCompartment.visible`), **non editabili in Basic**: se il valore letto è già un oggetto `Conditional` (`{when,...}` o `{rules,...}`), il Basic mostra un placeholder read-only e lo preserva verbatim (stessa regola di round-trip già usata in Fase B per `shape.form`/`shape.fill` quando erano Conditional). Editarli sarà lo scopo esplicito di B2b via Advanced.

Riferimenti (nel tuo albero): `claude/ratifiche_2026-07-21_authoring_slice1.md`, `claude/discovery_2026-07-21_authoring_surface.md`, il prompt e il codice della Fase B già committata (`VertexAuthoringPanel.tsx`, `TextSourceEditor.tsx`). Schema tipi in `editor-v2/viewpoint/ir/irTypes.ts` (verificato sul branch remoto, riportato sotto per riferimento — se il tuo locale è divergente, quello vince):

```typescript
interface VertexViewIR {
  irVersion: string; kind: 'vertex'; metaclasses: string[] | '*';
  predicate?: Predicate; priority?: number; exclusive?: boolean;
  label?: string; shape: ShapeSpec; fieldCompartments?: FieldCompartmentSpec[];
}
interface ShapeSpec {
  form: Conditional<ShapeForm>; fill?: Conditional<string>;
  border?: { color: string; width: number; style: 'solid'|'dashed'|'dotted' };
  labels?: LabelSpec[]; badges?: BadgeSpec[];
}
interface LabelSpec {
  position: LabelPosition; source: TextSource;
  visible?: Conditional<boolean>;
  editable?: boolean | { widget: 'text'|'textarea'|'select'|'checkbox'|'color' };
}
interface FieldCompartmentSpec {
  id: string; source: { from: 'attributes' } | { from: 'references' };
  rowFormat: { segments: FieldSegment[] }; visible?: Conditional<boolean>; separator?: boolean;
}
type FieldSegment =
  | { kind: 'name' } | { kind: 'type' }
  | { kind: 'value'; editable?: boolean | { widget: 'text'|'textarea'|'select'|'checkbox'|'color' } }
  | { kind: 'literal'; text: string };
interface BadgeSpec {
  icon: Conditional<string>; position: BadgePosition; visible: Conditional<boolean>; tooltip?: string;
}
type Conditional<T> = T | { when: Predicate; then: T; else?: T } | { rules: { when: Predicate; then: T }[]; default?: T };
type LabelPosition = 'top'|'center'|'inside'|'bottom';
type BadgePosition = 'tl'|'tr'|'bl'|'br';
type ShapeForm = 'rect'|'rounded'|'ellipse';
```

## COSA

### 0. Pre-requisito: leggere il codice esistente prima di editare
`VertexAuthoringPanel.tsx` e `TextSourceEditor.tsx` (versione committata di Fase B) vanno letti per intero prima di procedere: la lista label riusa la stessa UI già costruita per `labels[0]`, quindi va **estratta** in un sotto-componente riusabile (non duplicata). Questa estrazione è **richiesta esplicitamente da questo prompt**, non è refactoring opportunistico: fattorizza `LabelEntryEditor` (position + `TextSourceEditor` + eventuale `editable` checkbox) dal codice inline che oggi gestisce solo `labels[0]`.

### 1. Componente generico di lista riordinabile
Nuovo, in `components/ui/`: `ListEditor` — shell presentazionale generica su `T[]` con `onAdd`, `onRemove(index)`, `onMove(index, delta)`, render-prop per la singola riga. Nessuna dipendenza nuova (bottoni su/giù, non drag-and-drop). Riusato dai tre editor sotto (label, compartimenti, badge). Segue la stessa convenzione di `components/ui/*` (presentazionale, prop dati piatti, token `var(--...)`, niente import di `useEditorMode`/editor-v2).

### 2. `LabelListEditor` (sostituisce l'editor inline della sola `labels[0]`)
File: `components/editor-v2/viewpoint/authoring/LabelListEditor.tsx` + `LabelEntryEditor.tsx` (l'estrazione di cui al punto 0).
- Usa `ListEditor` su `draft.shape.labels ?? []`.
- Ogni riga (`LabelEntryEditor`): `position` → `Select` (top/center/inside/bottom); `source` → `TextSourceEditor` (Fase A/B, stessa risoluzione di metaclasse già presente nel pannello); `editable` → `Checkbox` **solo** per la variante booleana; se il valore letto è l'oggetto `{widget:...}`, mostra un badge read-only "editable: widget avanzato" e preserva verbatim (non c'è UI per scegliere il widget in Basic — è materia Advanced/B2b, coerente con `irTypes.ts`).
- `visible` (Conditional<boolean>): se assente, nessun controllo (default = sempre visibile, non impostare nulla). Se presente ed è un booleano literal, **niente controllo diretto in Basic** (la scelta di design è: la visibilità booleana secca non ha un caso d'uso Basic sensato senza un predicate; se serve, il primo controllo utile è comunque il Conditional builder di B2b) — mostra comunque un badge read-only col valore corrente ("sempre visibile" / "mai visibile" / "conditional"). Se è un oggetto Conditional, badge read-only "conditional (Advanced, Fase B2b)".
- Bottone "Aggiungi label" nel footer della lista: crea una nuova entry con default `{ position: 'bottom', source: { from: 'literal', text: '' } }` (append, non seed di `visible`/`editable`).

### 3. `FieldCompartmentListEditor` + `FieldSegmentEditor`
File: `components/editor-v2/viewpoint/authoring/FieldCompartmentListEditor.tsx` + `FieldSegmentEditor.tsx`.
- Usa `ListEditor` su `draft.fieldCompartments ?? []`.
- Ogni riga compartimento: `id` → `Input` (stringa libera; nessun validatore di unicità hand-rolled — se un `id` duplicato produce un errore semanticamente rilevante, lo intercetta `validateIR`/`compileView` come già oggi per gli altri errori strutturali; non introdurre una seconda validazione parallela).
- `source.from` → `Select` a due opzioni fisse (`attributes` | `references`), nessuna configurazione aggiuntiva (lo schema non ne prevede altre).
- `rowFormat.segments` → **lista annidata** (riusa `ListEditor` di nuovo, dentro la riga compartimento) di `FieldSegmentEditor`: `kind` → `Select` (name/type/value/literal); se `kind==='literal'` → `Input` per `text`; se `kind==='value'` → `editable` opzionale, stessa regola della label (`Checkbox` per il booleano, badge read-only + preserva verbatim per la variante `{widget}`); `name`/`type` non hanno sotto-campi.
- `separator` → `Checkbox`.
- `visible` (Conditional<boolean>) → stessa regola del punto 2 (badge read-only, nessun editing diretto in Basic).
- Bottone "Aggiungi compartimento": default `{ id: '', source: { from: 'attributes' }, rowFormat: { segments: [{ kind: 'name' }] } }`.
- Bottone "Aggiungi segmento" dentro ogni compartimento: default `{ kind: 'literal', text: '' }`.

### 4. `BadgeListEditor`
File: `components/editor-v2/viewpoint/authoring/BadgeListEditor.tsx`.
- Usa `ListEditor` su `draft.shape.badges ?? []`.
- `icon` (Conditional<string>, non opzionale): se literal string → `Input` con `HelpText` ("nome classe Bootstrap Icons, es. bi-star-fill" — unica libreria icone ammessa nel progetto); se Conditional → badge read-only, preserva verbatim.
- `position` → `Select` (tl/tr/bl/br).
- `visible` (Conditional<boolean>, **non opzionale**: attenzione, a differenza degli altri `visible` questo campo è sempre presente nello schema): se literal → nessun controllo diretto in Basic (stessa scelta di design del punto 2), ma **non può essere rimosso o lasciato `undefined` al commit** — il draft lo preserva com'è (literal o Conditional) via clone, non serve azione esplicita finché non si tocca il campo.
- `tooltip` → `Input` opzionale.
- Bottone "Aggiungi badge": default `{ icon: 'bi-flag', position: 'tr', visible: true }` (badge sempre visibile finché non lo si edita).

### 5. Tab shell Basic/Advanced in `VertexAuthoringPanel.tsx`
- Aggiungi un toggle a due stati in cima al pannello (riusa `Toggle` da `components/ui/` se si presta a un toggle a 2 opzioni esclusive, altrimenti due `Button` in stile segmented-control — nessuna dipendenza nuova).
- Tab **Basic** (default): tutto il contenuto esistente di Fase B (shape form/fill/border, label primaria — ora sostituita dal nuovo `LabelListEditor` che include comunque la prima label) + i tre editor nuovi (`LabelListEditor`, `FieldCompartmentListEditor`, `BadgeListEditor`).
- Tab **Advanced**: placeholder statico, nessun controllo funzionante. Testo: "Il builder per le regole condizionali (when/then/else, rules) su forma, fill, badge, label e compartimenti arriva nella Fase B2b." Nessuna logica di edit qui, nessuna lettura/scrittura aggiuntiva del draft.
- Il toggle Basic/Advanced è **puro stato UI locale** del pannello (`useState`), non tocca `view.ir` né il draft.

## DOVE (perimetro, `git add` solo questi)

| File | Modifica |
|------|----------|
| `components/ui/ListEditor/ListEditor.tsx` | NUOVO — shell generica riordinabile |
| `components/editor-v2/viewpoint/authoring/LabelEntryEditor.tsx` | NUOVO — estratto dall'inline di Fase B |
| `components/editor-v2/viewpoint/authoring/LabelListEditor.tsx` | NUOVO |
| `components/editor-v2/viewpoint/authoring/FieldCompartmentListEditor.tsx` | NUOVO |
| `components/editor-v2/viewpoint/authoring/FieldSegmentEditor.tsx` | NUOVO |
| `components/editor-v2/viewpoint/authoring/BadgeListEditor.tsx` | NUOVO |
| `components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` | MODIFICA — tab shell + sostituzione editor label inline con `LabelListEditor` + montaggio dei tre editor nuovi |

Se durante la lettura del codice esistente risulta che l'editor della label primaria non è isolabile senza toccare altro (es. è intrecciato col ciclo di commit in modo non ovvio): STOP e report invece di improvvisare un'estrazione rischiosa.

## COME (vincoli)

- **Nessuna modifica al ciclo edit/validate/commit** di Fase B: draft locale, `validateIR` eager, commit debounced, write immutabile `view.ir = next` (whole-object replace). I nuovi editor producono solo patch immutabili del draft, esattamente come i controlli esistenti.
- **Round-trip**: qualunque campo Conditional non editabile in Basic resta byte-identico al commit (clona, non toccare). Verificalo esplicitamente nel criterio di accettazione 6 sotto.
- Riusare le primitive esistenti (`Input`, `Select`, `Checkbox`, `HelpText`, `Field`, `Button`/`Toggle`). Nessuna dipendenza nuova.
- Grep preventivo dei nomi nuovi (`ListEditor`, `LabelEntryEditor`, `LabelListEditor`, `FieldCompartmentListEditor`, `FieldSegmentEditor`, `BadgeListEditor`) prima di crearli.
- Non toccare `TextSourceEditor.tsx`, `irTypes.ts`, `irValidate.ts`, `irDefaults.ts`, `PathBuilder` — questa fase è solo breadth di UI sul pannello, zero cambi allo schema o al layer abilitante.
- Non introdurre editing per nessun campo Conditional in questa fase, nemmeno "a scopo di test": è delimitazione esplicita del perimetro B2a vs B2b.

## Gate (verdi, poi HARD STOP visivo)

- Typecheck: baseline invariata, Δ0 nei file toccati.
- Vitest: suite esistente invariata; se estrai logica pura riusabile (es. helper di default-factory per nuove entry), testala.
- `npm run build` verde.

Criteri di accettazione (HARD STOP per verifica di Alfonso su localhost:3001, hard-refresh):

1. Una vertex view con più label (`shape.labels.length > 1`) le mostra tutte, editabili singolarmente; aggiungere/rimuovere/riordinare una label aggiorna la preview live.
2. Aggiungere un `fieldCompartment` con un segmento `value` sull'attributo `$name` mostra il valore reso nel nodo, senza reload.
3. Aggiungere un badge con icona Bootstrap Icons valida lo mostra in canvas nella posizione scelta (tl/tr/bl/br).
4. Un `Conditional` esistente su `label.visible`, `badge.icon`, `badge.visible` o `fieldCompartment.visible` mostra il badge read-only "conditional" e, ri-salvato senza toccarlo, resta **byte-identico** (verifica: confronto oggetto prima/dopo su quel sotto-campo).
5. Riordinare label/compartimenti/badge non altera nient'altro nell'IR (round-trip sul resto dell'oggetto).
6. Il toggle Advanced mostra il placeholder statico, nessuna scrittura, nessun errore in console.
7. Riapri il progetto → tutto l'IR autorato in questa fase persiste e rende identico.

Solo dopo l'OK visivo: commit `feat: authoring slice-1 breadth — label list, fieldCompartments, badges, Basic/Advanced tab shell (phase B2a)` + entry in `docs/claude-code-log.md`. Poi STOP: la Fase B2b (Conditional/Predicate builder nella tab Advanced) è un prompt separato, da ratificare architetturalmente prima di generarlo.

## RIFERIMENTI

- Design doc slice-1 e ratifiche: `claude/ratifiche_2026-07-21_authoring_slice1.md` (D3 write immutabile, D4 validazione 3-tier, D5 eager-validate/debounced-commit, Q3 round-trip dei Conditional).
- Discovery: `claude/discovery_2026-07-21_authoring_surface.md`.
- Prompt e codice Fase B già committata: `VertexAuthoringPanel.tsx`, `TextSourceEditor.tsx` (pattern da estendere, non da riscrivere).
- Schema IR: `editor-v2/viewpoint/ir/irTypes.ts`, `editor-v2/viewpoint/ir/irDefaults.ts` (`defaultObjectViewIR`).
