# 02 — Coder spec (Claude Code)

Prerequisito: `decisions-symbol-editor-1b.md` (v3, 2026-09-15), in questa stessa cartella. La spec è allineata alle decisioni chiuse:
**D1 per asse** (non D1a), D2 nessun default persistito, D3 rules-always con `{rules:[], default}` persistito, D4a, D5 scalare con **assente ≠ 0**, D6 solo nodi (Obstacle = parallelogram), D7 `keepRules` **senza** iniezione di `default`, D8 istanze reali (**slice 5**). Dove una slice cambia rispetto alla prima versione di questa spec, il motivo sta nella decisione citata.

Mockup di riferimento: `Symbol Editor 1b - All Sections.dc.html` (id 2a–2i) e `Symbol Editor Variants.dc.html#1b`.

Convenzioni repo: leggere `CLAUDE.md` root e `docs/CLAUDE_DEVELOPMENT_GUIDE.md` prima di toccare `editor-v2/viewpoint`. Test con vitest accanto ai sorgenti (`__tests__/`). `editor-v2/viewpoint/authoring/` e `editor-v2/viewpoint/ir/` sono critical zone (CLAUDE.md §3.1).

Percorsi: `ir/…` e `authoring/…` sono relativi a `frontend/src/components/editor-v2/viewpoint/`; `ui/ConditionalEditor/…` è relativo a `frontend/src/components/`.

---

## Slice 1 — Rules editor (Fill, Marker) · mockup 2b, 2i
**Obiettivo**: `ConditionalEditor` edita la forma `rules[]`; il chip "not yet editable" scompare.

File:
- `ui/ConditionalEditor/ConditionalEditor.tsx` — nuovo ramo `isRules`: tabella `RulesTable<T>` con colonne `⋮⋮ | WHEN | → | THEN | ✕`, riga finale "Otherwise → default", bottone "+ Add rule", drag-reorder (riuso della lib già in repo per le liste, es. `authoring/LabelListEditor.tsx`), stato vuoto (2i) con CTA "Add first rule".
- `ui/ConditionalEditor/conditional.ts` — **esiste già** (17 righe, puro, ospita `isConditionalValue`): si estende, non si crea. Aggiungere `toRules(c: Conditional<T>): {rules, default}` (normalizza scalare/when-then-else), `fromRules(...)`, `formatPredicate(p: Predicate): string` (pretty-print stabile, es. `state.isFinal`, `kind == "parallel"`, `not empty(regions)`). Resta puro: solo import di tipo da `irTypes`. I test importano questo file direttamente, non la barrel `ui`, che riesporta componenti React.
- `formatPredicate` (D4) è l'unica sorgente del testo in riga, delle caption della preview (slice 5) e dei chip "Suggested:". Totale sull'unione, `marked` e `literal` inclusi; su un `op` sconosciuto ritorna un placeholder neutro e **non lancia**.
- Il segmented `None | Solid | Conditional` (mockup) sostituisce `Fixed | Conditional`: `None` rimuove l'asse (D2: assente ≡ `''`), `Solid` scalare, `Conditional` `{rules:[], default}`. Il passaggio Solid→Conditional porta il valore scalare in `default`.
- Persistenza (D3): `{rules:[], default: X}` quando l'utente ha scelto Conditional e c'è un default. Senza regole **e** senza default si riscrive lo scalare o si toglie l'asse: `{rules:[]}` da solo è indistinguibile dall'assenza in compile (`ir/irCompile.ts:258-263`).
- Cella WHEN: read-only `formatPredicate`, click apre il `PredicateBuilder` esistente in popover (D4a).
- Cella THEN: riusa il `renderValue` già passato al `ConditionalEditor` (ColorPicker per fill, Select marker per marker).
- `allowConditional` resta il gate (modalità Advanced).

Accettazione:
- Con 2 regole + default, l'IR salvato è `{rules:[{when,then},{when,then}], default}`; `irCompile` produce lo stesso risultato di prima per il caso 1 regola.
- Riordino cambia l'ordine di `rules` e il canvas si aggiorna live.
- Rimuovere tutte le regole con un default presente lascia `{rules:[], default}` e mostra lo stato 2i; senza default l'asse torna scalare o assente.
- Test: round-trip `toRules/fromRules`; `formatPredicate` su ogni `op`, **incluso `marked`** e **un `op` sconosciuto** (placeholder, nessuna eccezione).

## Slice 2 — Border condizionale per asse · mockup 2c
Dipende da **D1** (per asse, non D1a).
- `ir/irTypes.ts`: `border?: { color?: Conditional<string>; width?: Conditional<number>; style?: Conditional<'solid'|'dashed'|'dotted'|'double'> }`. Stessa forma di `EdgeViewIR.line` (`irTypes.ts:538-542`) più `'double'`. Additive: `{color, width, style}` scalare resta un valore valido; nessun `irVersion` bump, nessun VersionFixer.
- `ir/irTypes.ts:718`, `ir/irCompile.ts:307`: `CompiledView.border` diventa `borderColor`, `borderWidth`, `borderStyle`, ciascuno `CompiledConditional<…> | null`, copia di `compileEdgeView` (`irCompile.ts:505-507`).
- `ir/IRNodeContent.tsx:333-371`: border CSS inline, stroke SVG, dash, overdraw `double`, colore del marker letti per istanza dagli accessor compilati `(readCtx, objectId)`.
- `ir/symbolRecognition.ts:61-69`: `style` e `width` passano per la sentinella `scalarOf` esistente, come `form`/`fill`/`marker`: un asse condizionale = nessun match di preset. **Non** riconoscere sul `default`.
- `ir/notationCatalog.ts` `applyPresetToShape` (`:137-146`): il preset scrive width/style scalari e preserva il colore dell'autore, come oggi. `keepRules` in slice 4.
- `authoring/SymbolEditorModal.tsx` `currentAxesPreset` (`:93-105`): `border.style`/`.width` "scalare o omesso", come già per `marker` e `fill`. `:283-284` è già protetto (`typeof === 'string'`): nessun cambio.
- `authoring/SymbolCard.tsx:35` (card del rail): colore del bordo scalare o `DEFAULT_BORDER_COLOR`, stessa guardia di `SymbolEditorModal.tsx:283-284`.
- `authoring/VertexAuthoringPanel.tsx`: sezione Border = base (colore, width con unità "px", style) + tabella OVERRIDES. `border` e `patchBorder` (`:341`, `:350`) oggi espandono la base come oggetto scalare: vanno sostituiti. Una riga OVERRIDES è **un predicato + il sottoinsieme di assi che sovrascrive**, scritta come una regola in ciascuno di quegli assi; non è un BorderSpec completo con un filtro di chip sopra. Il chip "+ color" aggiunge una regola a `border.color`. In lettura: raggruppare gli assi per uguaglianza strutturale di `when`; predicati che non coincidono tra assi → una riga per asse, e il panel lo dice (D1).
- `irStyle.ts`: nessun cambio, non legge il border dell'IR (solo la base CSS).
- Preview 2c: caption `base` / predicato, consegnata dalla slice 5.

Accettazione: preset ER "Weak entity" continua a essere riconosciuto; una vista con border scalare salvata prima del cambiamento si apre identica; un border con `width` condizionale non è riconosciuto come alcun preset e si disegna per istanza.

## Slice 3 — Corner radius · mockup 2a
Dipende da **D5**.
- `ir/irTypes.ts`: `ShapeSpec.cornerRadius?: number` (px). **Assente ≠ 0**: assente = raggio base di oggi (`rect` 4px, `irStyle.ts:72`; `rounded` 10px, `:82`; poligoni 0). Un valore scritto, **0 incluso**, lo sostituisce e si persiste. Nessuna migrazione.
- Forme che onorano l'asse, gate **per forma** e non per tipo di painter: `rect`, `rounded` (inline `border-radius`, che batte la regola di classe), `diamond`, `hexagon`, `parallelogram` (path arrotondato). Ignorano l'asse: `ellipse`, `circle`, `stadium` (CSS, ma la loro rotondità *è* il border-radius, `irStyle.ts:94, 98, 116`: applicare r li squadrerebbe), `cylinder` e `cloud` (`svgPath`). Documentarlo nel doc comment di `ShapeSpec`.
- `ir/shapeRegistry.ts`: nuova `roundedPolygonPath(points: string, r: number, w: number, h: number): string` — per ogni vertice, accorcia i due lati adiacenti di `r` (clamp a metà del lato più corto) e collega con `Q` sul vertice. I punti sono in viewBox 0–100 con `preserveAspectRatio="none"`: **convertire in coordinate reali (w,h)** prima di arrotondare, altrimenti il raggio si distorce; quindi il painter svg per r>0 emette `<path d>` con viewBox `0 0 w h`.
- `ir/IRNodeContent.tsx`: `rect`/`rounded` → `border-radius: r` solo se l'asse è scritto; `diamond`/`hexagon`/`parallelogram` con r>0 → path arrotondato; l'overdraw del border `double` segue lo stesso path.
- Clamp a `min(w,h)/4` al render; il numero autorato si salva come digitato. Nessun ricalcolo di anchor o content rect per r ≤ 12px.
- `ir/irValidate.ts`: guardia numerica su `cornerRadius` (finito, ≥ 0), accanto al controllo di `shape.padding` (`:120-125`).
- `ir/symbolRecognition.ts`: `cornerRadius` **non** è un asse di riconoscimento (un task BPMN con r=6 deve restare riconosciuto).
- `authoring/SymbolPreview.tsx`: il raggio arriva come **prop opzionale**, passata solo se scritta, non come campo di `SymbolPreset.values`. Tile del catalogo e card del rail non la passano. `authoring/SymbolBoxPreview.tsx`: stessa `roundedPolygonPath` (una sola funzione condivisa).
- Panel 2a: stepper "Corner radius · all vertices" + 3 glifi inline (rect, diamond, hexagon arrotondati) come feedback; ad asse assente mostra il raggio base della forma come placeholder, e un reset rimuove la chiave. Testo help "Rounds every vertex… 0 keeps sharp corners" (vero: 0 è un valore scritto).
- `components/DynamicHandles.tsx` (unico lettore di `insetFractionAt`/`handleInsetAt`): nessun cambio in v1; aggiungere TODO con riferimento a questa spec. `edgeEndpoints.ts` non c'entra: gestisce espressioni di endpoint, non geometria.

Accettazione: hexagon con r=8 renderizza path chiuso senza spike; r maggiore del lato viene clampato; test snapshot del `d` per diamond 100×60 r=6; un `rect` salvato senza `cornerRadius` si disegna identico (4px); un `circle` con `cornerRadius` resta un cerchio; un preset con `cornerRadius` scritto resta riconosciuto.

## Slice 4 — Famiglia Goal + popover catalogo · mockup 2h
Dipende da **D6, D7**.
- `ir/irTypes.ts`: `ShapeForm` += `'cloud'` (Softgoal).
- `ir/shapeRegistry.ts`: descriptor `cloud` **completo**, non solo il painter: painter `svgPath` (path, non polygon, come il cilindro), `insetFractionAt`, `sizing`, politica di resize. Content rect: inset ~18% su tutti i lati. Estendere il test di equivalenza in `ir/__tests__/shapeRegistry.test.ts`.
- `ir/notationCatalog.ts`: `CatalogFamily` += `'Goal'`, in coda a `CATALOG_FAMILIES` (l'ordine è l'ordine delle sezioni); preset con `notation` `'i*' | 'KAOS' | 'GRL'`:
  - `goal-goal` Goal → stadium
  - `goal-softgoal` Softgoal → cloud
  - `goal-task` Task → hexagon
  - `goal-resource` Resource → rect
  - `goal-actor` Actor → circle
  - `goal-agent` Agent → circle + marker `bar-top`
  - `goal-role` Role → circle + marker `bar-bottom`
  - `goal-belief` Belief → ellipse
  - `goal-obstacle` Obstacle (KAOS) → **parallelogram** (non diamond: `diamond` + border semplice è già la relationship ER, e il modal titola con `matches[0]`, D6)
- `ir/markerRegistry.ts`: `bar-top` `M30,22 L70,22`, `bar-bottom` `M30,78 L70,78`.
- `authoring/VertexAuthoringPanel.tsx` `FORM_OPTIONS` += Cloud; `defaultResizableForForm` (in `editor-v2/nodes/nodeSizing.ts`) per cloud come ellipse.
- `SymbolCatalogPicker`: `variant='popover'` (2h) che riusa il percorso `'column'` invariato (recents D18, search-first, sezioni D24): search + select notazione, lista famiglie a sinistra con conteggi, griglia 3 colonne, footer con checkbox "Keep my Fill / Border rules when switching" (default on) e link "Manage presets…" (placeholder disabled, oppure omesso).
- `authoring/SymbolEditorModal.tsx`: header 1b — sottotitolo "View for X", chip `[glifo] Rectangle [preset·modified] Change…` che apre la popover; la colonna catalogo sparisce. Il body diventa `nav sezioni (170px) | panel`: la nav elenca Symbol / Fill / Border / Padding / Marker / Sizing / Text con badge conteggio. Fill e Marker: `rules.length` quando Conditional. **Border**: numero di righe OVERRIDES distinte, cioè predicati distinti sui tre assi. Cliccare scrolla/mostra la FormSection corrispondente del panel ri-ospitato (non forkare il panel: passare `activeSection` come prop aggiuntiva che imposta il filtro di visibilità delle FormSection, come oggi `activeTab`).
- `applyPresetToShape(shape, preset, {keepRules: boolean})` (D7): con `keepRules`, un asse corrente `Conditional` (`fill`, `marker`, `border.color`/`width`/`style`) resta **intatto**, e **nessun valore del preset va in `default`** (D2). Gli assi scalari seguono il preset. Senza `keepRules`, comportamento identico a oggi: colore del bordo preservato, `fill` preservato salvo che il preset lo dichiari, `marker` rimosso quando il preset non ne dichiara.
- Footer 1b: `Revert to preset` (già esiste come "Reset to preset" in header → spostarlo nel footer) + `Done`.

Accettazione: 56 preset, 5 famiglie; `catalogFamilySections` ritorna Goal con 9; snapshot test del popover; switch preset con `keepRules` lascia intatto un fill a 2 regole **e non scrive `default`**; con `keepRules` spento il risultato è identico a oggi.

## Slice 5 — Preview multi-istanza · mockup 1b shell, caption di 2b/2c
Dipende da **D8**, e da slice 1 (`formatPredicate`).
- `authoring/useCanvasNodeBox.ts`: `useCanvasNodeBoxes(viewId, max)` ritorna l'array dei box, in ordine DOM, solo nel dock pane attivo (la query di `:50-58` li trova già tutti e tiene il primo). `useCanvasNodeBox` resta come elemento 0: i chiamanti esistenti non si muovono.
- `ir/irCompile.ts`: esportare `matchIndexOf<T>(c: Conditional<T>, ctx: ReadCtx, id: string): number | null`, `null` = default/base. Additivo: nessun cambio a `CompiledConditional` né ad alcun percorso di render.
- `authoring/SymbolEditorModal.tsx`: costruisce il `ReadCtx` con `makeReadCtx(idlookup)` (`ir/irReadCtxLproxy.ts:62`), risolve `form`/`fill`/`border`/`marker` per ciascuna istanza (max 3), e la caption: `formatPredicate(rules[i].when)` della regola vincente; `otherwise` se `null` in Fill e Marker, `base` se `null` in Border.
- `authoring/SymbolBoxPreview.tsx`: resta una replica pura; riceve i valori risolti + la caption. Non diventa un render IR vero in questo giro.
- 0 istanze: la striscia resta la replica simbolica di oggi. Il segmented "On canvas / Sample" non va nel DOM.

Accettazione: con 3 istanze che soddisfano regole diverse, tre caption diverse e corrette; con 0 istanze la striscia è identica a oggi; test di `matchIndexOf` su scalare, `undefined`, `when/then/else` e `rules` (prima regola vera vince, nessuna → `null`).

---

## Fuori scope (non fare)
- Edge goal-modeling (contribution/decomposition/dependency) — ticket separato su `EdgeViewIR.terminations`.
- Parser testuale delle espressioni (D4b).
- Preview "Sample" con istanze sintetiche (D8).
- **Marker multipli (2e)**: il mockup mostra una lista di marker, ciascuno con predicato, posizione e colore, "all matching rules show". L'IR ha `marker?: Conditional<string>`: un glifo, vince la prima regola, niente posizione, colore del bordo (`ir/IRNodeContent.tsx:371`). In questo giro la sezione Marker è la tabella ridotta della slice 1 (when → glifo, first-match-wins, niente colonne posizione/colore). La lista multipla è una decisione nuova (D9), da prendere prima di affrontarla.
- Sezioni Padding custom 4 lati (2d) e Sizing min/max (2f): il mockup li mostra, ma `PaddingToken` e `resizable` restano com'è in questo giro. Aprire ticket.
- Secondary lines del Text (2g) oltre quanto già fa `LabelListEditor`.
- Chip "Notations" e "Also used for" (2a): nessun supporto nel modello (esistono solo `metaclasses[]` e `authoringMetaclassPins`).
- "Manage presets…" nel footer della popover: placeholder disabled o omesso (D7).

## Screen map
| Mockup | Componenti toccati |
|---|---|
| 1b shell, 2a | `SymbolEditorModal.tsx/.scss`, `VertexAuthoringPanel.tsx` (prop `activeSection`) |
| 2b, 2i | `ui/ConditionalEditor/*` |
| 2c | `irTypes`, `irCompile`, `IRNodeContent`, `notationCatalog`, `symbolRecognition`, `SymbolEditorModal` (`currentAxesPreset`), `SymbolCard`, panel Border |
| 2a radius | `irTypes`, `shapeRegistry`, `IRNodeContent`, `irValidate`, `SymbolPreview` (prop), `SymbolBoxPreview`, `DynamicHandles` (solo TODO) |
| 2h | `SymbolCatalogPicker` (popover), `notationCatalog`, `markerRegistry`, `shapeRegistry` (cloud), `nodeSizing` (`defaultResizableForForm`) |
| 2e | riuso Slice 1 su `marker`, sezione ridotta (when → glifo); lista multipla = D9, fuori scope |
| preview multi-istanza | `useCanvasNodeBox`, `irCompile` (`matchIndexOf`), `SymbolEditorModal`, `SymbolBoxPreview` |
