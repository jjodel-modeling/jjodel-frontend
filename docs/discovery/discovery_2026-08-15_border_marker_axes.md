# Discovery: assi di stile bordo e marker sull'IR shape

**Data**: 2026-08-15 (notte del 14)
**Autore**: sessione Cowork (chat di progetto), lettura del working tree via device bridge
**Branch**: `alfonso-frontend-jjtl`, HEAD `3cdeae851`, working tree pulito sui sorgenti
**Obiettivo**: implementare i due assi di stile ratificati come passo 2 della roadmap forme
(sessione 2026-08-14 §6): trattamenti di bordo e marker interni. 36 simboli su 90
dell'inventario si distinguono solo su questi assi. Nessuna critical zone: per
l'invariante I3 gli StyleModifier non toccano il contorno, quindi niente ancore,
hit-testing, `portDistribution`, `DynamicHandles`.

---

## 1. File letti (integrali salvo nota)

- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx`
- `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/irValidate.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/shapeRegistry.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/__tests__/shapeRegistry.test.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/__tests__/ir.test.ts` (helpers, righe 1-90 + grep)
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx`
- `frontend/src/components/editor-v2/nodes/nodeSizing.ts`
- `CLAUDE.md` (§0-2.5, §6-8), `docs/claude-code-log.md` (entry recenti)
- Inventario assi: cruscotto `jjodel-picker-forme` (90 simboli, 14 notazioni)

## 2. Findings

**F1 — Il bordo oggi.** `ShapeSpec.border` e' scalare (non Conditional):
`{ color: string; width: number; style: 'solid' | 'dashed' | 'dotted' }`
(irTypes.ts:118). Consumatori: tre soli. `IRNodeContent.tsx:170` (border inline
sulle forme CSS, valore passato verbatim a `border:`), `:178` (`SVG_BORDER_DASH`
per le forme SVG), `VertexAuthoringPanel.tsx:41,361` (opzioni e cast).
`CompiledView.border.style` e' gia' tipato `string` (irTypes.ts:353): il compiled
non cambia.

**F2 — I sei trattamenti dell'inventario** (normale, sottile, spesso, doppio,
tratteggiato, pieno) si riducono a UN solo valore nuovo di schema: `double`.
Sottile/spesso sono `width` (gia' presente); pieno e' `fill` scuro (gia'
esprimibile); tratteggiato esiste. Quindi l'asse bordo costa: unione estesa con
`'double'` + resa.

**F3 — Resa del doppio.** Forme CSS: `border-style: double` e' nativo, anche su
ellipse/circle (border-radius), ma mostra due linee solo con width >= 3 (CSS
divide la width in linea-gap-linea). Forme SVG (diamond): overdraw a due
polygon — lo stesso path con stroke 3w nel colore del bordo, sopra lo stesso path
con stroke w nel colore del fill. Con `vector-effect: non-scaling-stroke` il gap
resta uniforme a ogni aspect ratio, cosa che un polygon interno inset nel viewBox
0-100 con `preserveAspectRatio="none"` non garantirebbe (inset non uniforme).
Limite dichiarato: con fill semitrasparente il gap del doppio SVG e' anch'esso
semitrasparente.

**F4 — Il marker non esiste in nessuna forma.** Nessuna occorrenza di
`ir-marker` / `markerRegistry` / `MARKER_REGISTRY` / `ShapeMarker` in
`frontend/src` (grep globale, verifica nomi). Precedente di schema per un
vocabolario aperto: `BadgeSpec.icon: Conditional<string>` — stringa aperta, id
sconosciuto = no-op silenzioso al render. Il marker segue lo stesso pattern:
`marker?: Conditional<string>` su `ShapeSpec`, registry come tabella dati
(D10: aggiungere un marker e' un dato in piu', non codice del motore).

**F5 — Stacking, la trappola misurata in sessione.** La regola
`.ir-node-content.ir-shape--diamond > :not(.ir-diamond-svg)` (irStyle.ts:86,
specificita' 0,3,0) impone `position: relative; z-index: 1` a OGNI figlio non-SVG
del rombo: un layer marker a `position: absolute` con regola a (0,2,0) verrebbe
silenziosamente riposizionato. Il `:not()` va esteso con `:not(.ir-marker-svg)`.
Inoltre, senza intervento, un layer marker positioned coprirebbe il testo delle
label sulle forme CSS (positioned z>=0 batte il contenuto inline in-flow):
label e compartment prendono `position: relative; z-index: 1` nel BASE_CSS,
che e' esattamente il piano gia' assegnato loro dentro il rombo dalla regola
(0,3,0). Ordine risultante su ogni forma: paint della forma (bg o SVG, z 0,
DOM-first) < marker (z 0, DOM dopo) < testo (z 1) < badge (z 2) < chip (z 3).

**F6 — Scala del marker.** SVG dedicato `viewBox 0 0 100 100` con
`preserveAspectRatio="xMidYMid meet"`: scala uniforme = min(w,h)/100, centrato.
Glifi disegnati nel box 26-74 → il marker occupa ~48% del lato corto e cresce
con la forma, come nei renderer BPMN. Stroke in unita' di viewBox (scala col
glifo, niente non-scaling): a 40px di lato corto uno stroke 7 rende ~2.8px.
Colore: quello del bordo (`compiled.border?.color ?? var(--border-default)`),
come nelle notazioni; niente asse colore dedicato in v1.

**F7 — Persistenza.** Campo opzionale additivo su `e.ir` (JSON strutturato, non
`jsxString`): nessuna migrazione VersionFixer, nessun bump di `irVersion` —
precedente esplicito `authoringMetaclassPins` (irTypes.ts:139-142). L'hash di
delega `isMigratedDefaultView` non e' toccato: le factory non dichiarano marker.

**F8 — Validazione.** `validateIR` passa dal compile; `marker` compila via
`compileConditional` (predicati → dependencySet automatico). Id fuori registry =
render no-op, coerente col precedente badge. Nessun vocabolario chiuso alla
`VALID_ROUTING_VALUES`: il registry e' la tabella e crescera'.

**F9 — Test esistenti.** `shapeRegistry.test.ts` asserisce chiavi puntuali di
`SVG_BORDER_DASH` (solid/dashed/dotted/inesistente): aggiungere `double:
undefined` non lo rompe. `ir.test.ts` non testa fill/border: nessun test da
aggiornare, i test nuovi vivono in `__tests__/markerRegistry.test.ts`.

## 3. Piano di implementazione (fuori critical zone)

Commit A — motore, default inerti (zero pixel senza valori authored):
1. `irTypes.ts`: `'double'` nell'unione border; `marker?: Conditional<string>`;
   `CompiledView.marker`.
2. `irCompile.ts`: compile del marker.
3. `markerRegistry.ts` (nuovo): 16 marker come dati (x, plus, circle, dot,
   asterisk, envelope, clock, history, history-deep, gear, person, triangle,
   lightning, bars, document, loop), path SVG stroke-only salvo `dot`.
4. `shapeRegistry.ts`: `double: undefined` in `SVG_BORDER_DASH`.
5. `IRNodeContent.tsx`: ramo double per il painter SVG (overdraw), layer marker.
6. `irStyle.ts`: regole `.ir-marker-svg`, z-index su label/compartment,
   estensione del `:not()` del rombo.
7. `__tests__/markerRegistry.test.ts` (nuovo): integrita' registry, fallback,
   compile conditional per istanza, `SVG_BORDER_DASH.double`.

Commit B — authoring: `VertexAuthoringPanel.tsx`: opzione Double (+ HelpText
quando width < 3), sezione Marker con ConditionalEditor + Select dal registry
(None = chiave rimossa), dopo Border.

Commit C — docs: entry nel prompt log.

## 4. Rischi e limiti dichiarati

| Rischio | Mitigazione |
|---------|-------------|
| Marker sopra il testo su label centrate | z-index: testo (1) sopra marker (0); e' comunque una combinazione che l'autore evita nei simboli reali |
| Double CSS invisibile a width < 3 | comportamento CSS nativo, HelpText nel pannello; nessuna riscrittura silenziosa dei valori |
| Gap del double SVG col fill trasparente | limite dichiarato (F3), non bloccante |
| Sessioni concorrenti sul repo | `git status` fra scrittura e staging, add per file esplicito |

## 5. Domande aperte per Alfonso

1. Il marker deve entrare anche nell'override `containment.collapsed`? (v1: no,
   il collassato tiene form/fill/badge come oggi.)
2. Serve un asse colore dedicato del marker, o il colore del bordo basta? (v1:
   colore del bordo.)
3. I preset per notazione (catalogo D10) restano fuori: arrivano con il picker
   a catalogo, dopo verifica dell'inventario sulle specifiche (P5).
