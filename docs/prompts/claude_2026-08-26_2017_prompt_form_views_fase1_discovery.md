# Prompt Claude Code: Form rendering delle view, Fase 1 (discovery read-only)

**Data**: 2026-08-26 20:17
**Branch**: `alfonso-frontend-jjtl`
**Tipo**: discovery (two-phase, Fase 1). Nessuna modifica al codice sorgente.
**Effort**: xhigh

Leggi `CLAUDE.md`, `PROTOCOL.md` e le ultime entry di `docs/claude-code-log.md` prima di iniziare.

---

## COSA

Preparare l'implementazione del **form rendering delle view**: la stessa view che oggi si rende come simbolo sulla tela deve potersi rendere come form con widget editabili. La specifica visuale è nel design handoff `docs/design/handoff_2026-08-26_form_views/README.md` (con il mockup `Jjodel Form Views.dc.html`; `support.js` va ignorato). Se la cartella non esiste, fermati e chiedi ad Alfonso di scompattare lo zip lì.

Questa fase è **solo discovery**: leggere il codice, rispondere alle domande sotto, mappare i token, proporre il piano di file per la Slice 1 e scrivere il report. Hard stop dopo il report. L'implementazione parte solo dopo il go-ahead in chat.

### Decisioni già prese in chat (non rimetterle in discussione)

1. La form è un **modo di rendere il contenuto della view più un host**, non una shape del registry. La view resta quella di oggi (applies-to, predicato, priorità, label, compartimenti, righe, editabilità); si aggiunge un supplemento opzionale `form?: FormSpec` accanto a `shape`. Una view può avere solo `shape`, solo `form`, o entrambi.
2. `FormSpec` è **additivo e opzionale** su tutte le view IR (vertex, graph vertex, edge per object-as-edge). Nessun bump di `irVersion` se `validateIR` lo consente (da verificare, domanda 11).
3. **I widget di default si derivano dal tipo della feature** nel metamodello (string, number, boolean, enum, riferimento, containment, molteplicità). L'autore sovrascrive solo dove vuole. La "default form" è un fallback esplicito ai sensi della spec IR v1.2 §10.
4. **La validazione è diagnostica, mai bloccante**, ed è una **proiezione del registry `editor-v2/problems/`** sul campo. Nessun secondo validatore. Le molteplicità (lower/upper bound) producono comportamento del widget (marcatore obbligatorio, "Add" disabilitato a limite raggiunto), non regole nuove.
5. **Un solo write path**: la form scrive sugli slot con lo stesso percorso dell'edit inline delle righe (`IRRow`) e del pannello proprietà attuale. Niente percorsi paralleli.
6. Le quattro raccomandazioni del README (§Recommendations) sono accettate: label sopra nel rail, obbligatorietà = punto cyan 4px e molteplicità mono 10px, tema `plain` di default nel rail e `card` nel documento, nodo a widget solo in `compact` con massimo 5-6 campi.
7. **Zero layout shift**: slot messaggi 16px riservato per campo, slot riepilogo 32px riservato in testa. Vincolo duro.

### Ordine delle slice (per orientare il piano, non da implementare ora)

- **Slice 1**: `FormSpec` nell'IR, interprete `IRForm` che rende una `CompiledView` come form, host **rail Properties** per l'elemento selezionato. Copre gli artboard 1a/1b (Basic/Advanced), 2a-2d (quattro temi), 3a (stati di validazione, incluso il reference picker). Ipotesi di lavoro: la form entra come **tab nuovo** nel rail accanto al pannello Properties esistente, non lo sostituisce; lo switch è una slice successiva.
- **Slice 2**: tab `Form` nel pannello di authoring della view (6a/6b).
- **Slice 3**: documento form come tab del workbench (4a).
- **Slice 4**: form dentro il nodo (5a).

## DOVE

Cartelle e file da leggere (path completi nel report). Non modificare nulla al di fuori di `docs/`.

- `frontend/src/components/editor-v2/viewpoint/ir/`: `irTypes.ts`, `irCompile.ts`, `irValidate.ts`, `irResolve.ts`, `irStyle.ts`, `IRNodeContent.tsx`, `IRRow.tsx`, `shapeRegistry.ts`, `useContentSize.ts`
- `frontend/src/components/editor-v2/viewpoint/authoring/`: `VertexAuthoringPanel.tsx`, `FieldCompartmentListEditor.tsx`, `RowAuthoringPanel.tsx`
- `frontend/src/components/editor-v2/problems/`
- Il pannello proprietà del rail destro di editor-v2 (da individuare: partire da `EditorV2.tsx` e dai componenti che leggono la selezione)
- `frontend/src/styles/tokens/` (11 file SCSS) e `frontend/src/styles/tokens.css`
- `frontend/src/common/entityMeta.ts` (scala entity e badge a lettera)
- `frontend/src/components/editor-v2/Select.tsx` e gli altri controlli condivisi del rail (toggle Basic/Advanced, segmented, popover, search)
- `frontend/src/model/` per le L-classi di classe, attributo, riferimento, enum (tipo, molteplicità, containment)
- `frontend/src/components/editor-v2/VersionFixer.tsx` (solo per la domanda 11)
- `docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md` (§5 editabilità, §6 interaction, §9 reattività, §10 fallback), `docs/spec/claude_spec_2026-07-25_ir_row_dispatch_addendum.md`, `docs/spec/claude_spec_2026-07-27_ir_textstyle_addendum.md` (sez. 11-12)

## COME

Rispondi a ciascuna domanda con path, riga e citazione breve del codice. Dove la risposta è "non esiste", dillo e proponi il minimo da aggiungere.

1. **Pannello proprietà attuale.** Quale componente rende le proprietà dell'elemento selezionato nel rail destro di editor-v2? Come riceve la selezione (stato redux, context, custom event)? Come legge i valori (L-proxy, `DValue.values`)? Come scrive (setter, debounce, transazione), e se e dove tocca `isProjectModified`? Ha già un toggle Basic/Advanced e dove vive quello stato?
2. **Write path dell'edit inline.** In `IRRow.tsx`, come viene scritto il segmento `value` editabile? Quale funzione o setter, con quale granularità (per DValue, per slot), e passa da `useJjomSync.ts` o da altra critical zone? La Slice 1 deve riusare esattamente questo percorso: documentalo come contratto.
3. **Stato dell'IR dopo TS2.** Riporta le interfacce attuali di `irTypes.ts` (in particolare `VertexViewIR`, `GraphVertexViewIR`, `EdgeViewIR`, `FieldCompartmentSpec`, `RowViewIR`, `FieldSegment`, `TextStyle`, `ShapeSpec`), la firma di `compileView`, e come `useIRView` costruisce la firma di reattività (snapshot slot più `crossDepsSignature`). Indica dove `form` entrerebbe nel compile senza toccare il resto.
4. **Row dispatch e sorgenti di riga.** Cosa può essere la `source` di un compartimento o di una riga (attributo, riferimento, children, espressione)? Come sono trattate oggi le feature di **riferimento** e di **containment** nelle righe? Serve per decidere se il reference picker e la children list nascono da righe esistenti o da un asse nuovo di `FormSpec`.
5. **Accesso al metamodello per derivare i widget.** Dato un `DObject`/`LObject` selezionato, come si arriva alla sua classe e alle feature con: tipo primitivo, enum e literal, `lowerBound`/`upperBound` (nomi reali dei campi), flag containment, tipo target del riferimento. Elenca le proprietà L-proxy da usare e verifica che la molteplicità sia leggibile senza costi nascosti.
6. **Registry problems.** API di `editor-v2/problems/`: come sono chiavizzati i problemi (oggetto, feature, view?), quali severità esistono, se si possono interrogare **per oggetto e per feature** in modo reattivo, e quale hook o selettore usa il canvas per i badge. Il riepilogo "N errors, N warnings" e i messaggi per campo devono derivare da qui.
7. **Mappa dei token.** Costruisci una tabella handoff → token esistente per ogni valore del README §Design tokens e §Anatomy (colori, dimensioni di font, altezze dei controlli 24/26/28, raggi 3/4/6/8, focus ring, ombra popover, font mono). Segnala: token mancanti da aggiungere, e i casi in cui `tokens/` SCSS e `tokens.css` divergono sullo stesso nome (contesto: 27 nomi sovrapposti, 13 divergenti). Indica quale dei due sistemi usa oggi `irStyle.ts` e i pannelli del rail: la Slice 1 userà quello. Verifica che IBM Plex Mono sia caricato e che i glifi Bootstrap Icons elencati nel README esistano nella versione installata (`package.json`).
8. **Controlli condivisi riusabili.** Esistono già: segmented toggle Basic/Advanced, checkbox stilizzata, popover ancorato, campo di ricerca, chip, number stepper, reference picker (in qualsiasi pannello, anche nel classico)? Per ciascuno: path e se è riusabile così com'è, adattabile, o da scrivere. Ricorda la nota su `Select.tsx:111` (opzione vuota antemessa): ogni `onChange` deve mappare `''` sul default.
9. **Persistenza della modalità.** Il README chiede `mode: 'basic' | 'advanced'` persistito per utente e per view. Dove si persistono oggi preferenze di UI per utente (localStorage, chiave, formato)? Proponi la chiave.
10. **Collisioni di nomi.** `grep -r` su tutto `frontend/src` per: `FormSpec`, `WidgetKind`, `FormHost`, `IRForm`, `IRField`, `useIRForm`, `formSpec`, e per le classi CSS `ir-form`, `ir-field`, `ir-field__`, `ir-field--`, `ir-form__section`, `ir-picker`. Riporta ogni occorrenza. I nomi proposti non vanno usati se già presenti.
11. **validateIR e VersionFixer.** `validateIR` rifiuta chiavi sconosciute sulla view? Se sì, `form` va registrato e il piano deve includerlo. L'aggiunta di un campo opzionale richiede bump di `DState.version.n` o entry in `VersionFixer`? Confronta con il precedente `marker` del 15/8 e con `ShapeSpec.padding` del 25/8.
12. **Critical zone.** Sulla base delle risposte 1, 2 e 6, dichiara se la Slice 1 tocca `useJjomSync.ts` o `portDistribution.ts`. Se sì, indica il punto e fermati lì: servirà il Layer Impact Report prima della Fase 2.

### Proposta da includere nel report (non implementare)

Sulla base dei findings, proponi la forma di `FormSpec` come si inserirebbe in `irTypes.ts`, partendo da questa bozza e correggendola dove il codice suggerisce altro:

```ts
type FormTheme = 'plain' | 'card' | 'compact' | 'inspector';
type WidgetKind = 'text' | 'textarea' | 'number' | 'checkbox' | 'select' | 'reference' | 'link';
type FeatureTreatment = 'inline' | 'list' | 'hidden';

interface FormSpec {
  theme?: FormTheme;                          // default plain
  labelPlacement?: 'above' | 'left';          // default above; left solo in compact
  widgets?: Record<PathExpr, WidgetKind>;     // override del widget derivato dal tipo
  features?: Record<PathExpr, FeatureTreatment>; // riferimenti e children: inline | list | hidden
  basic?: PathExpr[];                         // feature visibili in Basic; assente = euristica (lower >= 1)
}
```

Poi il **piano dei file della Slice 1**: elenco dei file da creare e da toccare, con una riga per ciascuno su cosa cambia, e una stima della diff. Componenti attesi: `IRForm.tsx` (interprete), `IRField.tsx` (campo con label row, widget, slot messaggi), widget elementari, `ReferencePicker.tsx`, `irFormStyle.ts` o SCSS con i quattro temi, hook di derivazione widget dal metamodello, hook di diagnostica per campo, aggancio nel rail. Se qualcosa esiste già (domanda 8), il piano lo riusa.

### Report

Salva il report in **`docs/discovery/discovery_2026-08-26_form_views_slice1.md`** (se esiste già, suffisso `_2`). Struttura obbligatoria: obiettivo; file letti (path completi); findings numerati 1-12; tabella dei token; proposta `FormSpec`; piano dei file della Slice 1; dipendenze e rischi; domande aperte per Alfonso.

Il report è l'unico output. Non creare né modificare file sotto `frontend/`.

### Chiusura

- `git add docs/discovery/discovery_2026-08-26_form_views_slice1.md docs/claude-code-log.md` e commit `docs: discovery for form views slice 1 (properties rail host)`. Mai `git add .`.
- Entry in `docs/claude-code-log.md` nel formato di CLAUDE.md, tipo `docs`, con il nome di questo documento prompt.
- **Hard stop.** Non iniziare la Fase 2.

## RIFERIMENTI

- Handoff: `docs/design/handoff_2026-08-26_form_views/README.md` (spec visuale vincolante, alta fedeltà) e `Jjodel Form Views.dc.html` (artboard 1a-7a).
- Spec IR v1.2 e addendum (row dispatch, edge authoring, TextStyle ir-1.3 sez. 11-12).
- Precedenti additivi sull'IR senza bump: `marker` (15/8), `ShapeSpec.padding` e `ShapeSpec.text` (25/8, commit `0864c8824`, `97c5a65e0`), `RowViewIR.style` (`4962a303a`).
- Bug noti che questa slice non deve peggiorare: `isProjectModified` non aggiornato dalle scritture del rail (todo 2 del 25/8); D15 last-writer-wins tra rail e modal entro i 300 ms di debounce.
- `docs/decisions.md` per il formato delle decisioni, se il report ne propone.
