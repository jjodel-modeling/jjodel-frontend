# Discovery — SegmentedControl (D1) per la property card della sintassi astratta

**Data**: 2026-08-08 (Cowork, sessione con accesso diretto al Mac via bridge)
**Obiettivo**: verificare se un pezzo del restyling della property card (fronte congelato,
`claude/2026-08-05_design_property_card_sintassi_astratta.md`) è eseguibile in autonomia,
cioè senza nuove decisioni architetturali, partendo dall'unica decisione ratificata (D1,
segmented control) e dal suo stesso "prossimo passo" dichiarato: *"partendo dal solo
controllo di scelta, che è isolato e verificabile a vista"*.

## File letti/analizzati

- `contesto_progetto.md`, `claude/2026-08-05_design_property_card_sintassi_astratta.md` (project knowledge)
- `frontend/src/components/editors/Info.tsx` (working tree, HEAD `40820fe21` — non da GitHub raw)
- `frontend/src/components/editors/PropertiesWithTreeView.tsx:470-505`
- `frontend/src/components/ui/index.ts`, `Toggle/Toggle.tsx`, `Toggle/Toggle.module.css`, `Button/Button.module.css`
- `frontend/src/styles/tokens.css`
- `frontend/src/joiner/classes.ts` (grep `opposite`, `defaultValue`)
- Verifica assenza di collisione nome: `grep -rn SegmentedControl frontend/src/components/ui` → zero risultati prima della creazione

## Findings

1. **Il project knowledge è indietro rispetto al repo reale.** `contesto_progetto.md`
   (aggiornato 2026-08-07 16:09) riporta HEAD `eea50266f`. Il working tree è invece a
   `40820fe21`, con le voci 3, 4 e 5 della "coda nuova" già landate: drop di `routing:""`
   (`7450eb256`), single-writer di `father` in Applies to (`f5c71d5db`, `65f18ceb1`),
   rimozione del viewpoint workbench irraggiungibile (`1dd464162`), stereotipo singleton
   al posto di underline/diamond (`a96254f87`), fix visited-set nei getter della catena
   father (`ca2b67c0a`, `40820fe21`). Working tree pulito, unico untracked
   `.claude/settings.local.json` (noto, benigno). Non è materia di questa discovery, ma
   vale la pena rigenerare `sessione_CORRENTE.md`/`contesto_progetto.md` alla prossima
   occasione.

2. **Nessun campo "Kind" esiste oggi nel codice.** I due candidati alla conversione sono
   coppie di toggle booleani indipendenti:
   - `Composition` / `Aggregation` su `DReference`, in `builder.reference` (`Info.tsx:490-494`)
   - `Abstract` / `Interface` su `DClass`, in `InheritanceSection` (`Info.tsx:115-119`)

   Confermato a codice il finding MEDIA del design doc: **entrambi gli stati sono
   contemporaneamente accendibili**, lo stato illegale è raggiungibile oggi.

3. **Collassare una di queste coppie in un unico controllo esclusivo è una decisione di
   semantica dati, non solo visiva.** D1 ratifica l'aspetto del controllo ("segmented in
   rilievo": colori, radius, stati, focus ring) — non quali coppie di flag diventano un
   field unico, né cosa succede ai modelli salvati dove oggi entrambi i flag sono `true`
   (comportamento oggi raggiungibile e quindi presumibilmente presente in dati reali).
   Per il modello a tre attori del progetto è una decisione di Alfonso, non di questa
   sessione.

4. **Cardinality non ha ancora un segmented control nel codice**: `Info.tsx:441-453` usa
   due `PropertiesNumberInput` (Lower/Upper) più un badge di sola lettura. Il design doc
   descrive un segmented con preset più un segmento finale "Custom…" che apre gli stepper
   esistenti, ma i preset esatti (quali valori, quanti segmenti) vivono solo nel mockup
   `mockup_property_card_v2.html` consegnato ad Alfonso in una sessione claude.ai
   precedente — file non presente né nella cartella `jjodel` né nel project knowledge di
   questa sessione. Non implementabile senza quel file (o senza che Alfonso ridetti i
   preset), pena inventare una decisione che non è mia.

5. **Due delle quattro domande aperte del design doc, risolte a codice**:
   - **`opposite`** esiste come proprietà tipizzata reale su reference
     (`joiner/classes.ts:3877`: `Property extends "opposite" ? LReference | DReference |
     Pointer<DReference> : ...`) — la bidirezionalità è dichiarabile a livello di modello,
     ma **nessun punto della property card la espone oggi** (zero riferimenti a
     `.opposite` in `Info.tsx`).
   - **La barra `> NODE`** non fa parte della property card: è una sezione fratella,
     resa da `PropertiesWithTreeView.tsx:483-501`, sotto `<Info>` nello stesso
     `.properties-panel-body` scrollabile, visibile solo in modalità Expert/advanced,
     e apre `<NodeEditor />` (editor della sintassi concreta). **Conferma il sospetto del
     design doc**: le due property card (astratta e concreta) convivono nello stesso
     scroll — il confine fra i due filoni resta da decidere prima di un intervento che
     tocchi lo spazio verticale della card.
   - Non risolte da codice, restano aperte: `defaultValue` su `DAttribute` (il nome
     compare in una union generica di property name a `classes.ts:1795`, non isolato se
     sia effettivamente settabile su `DAttribute` in particolare); se la modalità Advanced
     fosse attiva allo screenshot del 5 agosto (fatto che solo Alfonso può confermare).

6. **Token disponibili, spec D1 implementabile 1:1 senza inventare valori**: `tokens.css`
   ha già `--radius-md: 8px` (track), `--radius-base: 6px` (segmento), `--spacing-1: 4px`
   / `--spacing-3: 12px` (padding 4/12), `--font-size-sm: 12px`, `--font-weight-semibold:
   600`, `--color-slate-100/700/900`, `--color-cyan-500`. Il ring di focus slate
   `rgba(51,65,85,.18)` citato dal design doc come "già in uso nel progetto" è confermato:
   stessa famiglia di `--form-input-focus-shadow: rgba(51,65,85,.15)` (`_form-system.scss`)
   e del ring del `Toggle` (`rgba(51,65,85,.3)`), distinto dal `--focus-outline` cyan usato
   da `Button`.

## Dipendenze e rischi

- **Primitivo isolato (eseguito in questa sessione)**: nuovo componente
  `frontend/src/components/ui/SegmentedControl/` (tsx + css module + index) più una riga
  aggiunta al barrel `ui/index.ts`. Zero file esistenti toccati oltre al barrel, zero
  rename, zero modifica a interfacce TS esistenti, zero nuova dipendenza npm. Non wired a
  nessun campo del modello: consuma `options`/`value`/`onChange` generici, i preset e la
  semantica restano a carico del consumatore.
- `npx tsc --noEmit` (comando canonico da CLAUDE.md §17): **0 errori** dopo l'aggiunta.
- `npm run build` (vite): fallisce nell'ambiente isolato del bridge Cowork con
  `Cannot find module @rollup/rollup-linux-arm64-gnu` — errore di risoluzione nativa del
  rollup nella VM del bridge, non riconducibile al diff (nessun import né sintassi nuova
  che possa spiegarlo). Da verificare con `npm run build` diretto nel Terminal del Mac,
  fuori dal bridge.
- **Il rischio si sposta interamente alla fase successiva** (wiring su Kind/Cardinality),
  che dipende dalle due decisioni elencate sotto.

## Domande aperte per Alfonso

1. **Kind sulla reference**: `Composition`/`Aggregation` diventano un unico campo a tre
   valori (`Reference` · `Composition` · `Aggregation`)? Se sì, cosa succede ai modelli
   salvati dove oggi sono entrambi `true`?
2. **Kind sulla metaclasse**: stessa domanda per `Abstract`/`Interface` → un field
   (`Concrete` · `Abstract` · `Interface`)?
3. **Cardinality**: puoi far avere il file `mockup_property_card_v2.html` (o ridettare i
   preset a voce) così la parte "verificabile a vista" del design doc si può eseguire?
4. **`defaultValue` su DAttribute** e **stato di Advanced allo screenshot del 5 agosto**:
   confermi/chiarisci?

Nessuna di queste blocca il primitivo consegnato in questa sessione; bloccano solo il suo
utilizzo dentro la property card.
