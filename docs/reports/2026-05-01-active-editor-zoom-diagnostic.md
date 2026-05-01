# Diagnostic report — Active editor zoom unification (post-Phase 2)

**Data:** 2026-05-01
**Scope:** diagnosi-only dei tre sintomi riportati dopo l'esecuzione di `2026-05-01_phase2_active_editor_zoom_implementation.md`. Nessuna modifica al codice. Le ipotesi nel prompt diagnostico sono state verificate punto per punto (V1–V6).

---

## Confermato

### Sintomo 1 — barretta slate invece che cyan (Fase A, flow-only)

**Causa accertata:** `--color-accent` è definito come slate **per design**, non cyan.

Evidenze:

- `frontend/src/styles/tokens/_colors-light.scss:118`:
  ```scss
  --color-accent: #{$slate-700};   /* Primary accent */
  ```
  → risolve a `#334155` (slate-700).
- `frontend/src/styles/tokens/_colors-dark.scss:47`:
  ```scss
  --color-accent: #94a3b8;         /* Primary accent - slate-400 */
  ```
- La regola che ho introdotto in `frontend/src/components/editor-v2/EditorV2.scss` usa `background: var(--color-accent, #0ea5e9);` — il fallback `#0ea5e9` viene applicato **solo se la variabile è undefined**. Poiché è definita (slate), il fallback cyan non si attiva mai.
- Coerente con CLAUDE.md ("Token legacy ELIMINATI: `--accent` (usare `--color-accent`)") e con la regola ufficiale del progetto: `--color-accent` è la variabile semantica per il colore primario, che è slate, NON cyan. Il cyan `#0ea5e9` è riservato ad active states / focus / link, non al token semantico generico.

**Conclusione:** la scelta di `var(--color-accent, #0ea5e9)` (decisione D del prompt Fase 2) era basata sull'osservazione errata che `var(--color-accent, #0ea5e9)` apparisse cyan nel codebase. In realtà appare cyan **solo** in pochi file dove `--color-accent` non era ancora migrata a slate (es. `diagram.scss`). Negli altri (es. `style.scss`, `variables.scss`), si vede slate.

### V1 — Registrazione `windoww['ClassicZoomBridge']`

**Posizione:** `frontend/src/components/editor-v2/ActiveEditorContext.tsx:119-120` — top-level del modulo (FUORI da qualunque funzione/componente).

```tsx
(ClassicZoomBridge as any).cname = 'ClassicZoomBridge';
windoww['ClassicZoomBridge'] = ClassicZoomBridge;
```

**Catena di import side-effect** (verificata via grep):
- `EditorSwitch.tsx:4` → `import { ActiveEditorProvider } from '../../editor-v2/ActiveEditorContext';`
- `EditorV2.tsx:36` → `import { useActiveEditor, type ZoomController } from './ActiveEditorContext';`

EditorSwitch è caricato da `MetamodelTab.tsx:27` e `ModelTab.tsx:22`. Quando si apre un tab modello/metamodello, EditorSwitch si monta → `ActiveEditorContext.tsx` viene caricato → la registrazione globale top-level esegue.

**Ordine temporale:**
1. App boots → `joiner/ExecuteOnRead.ts` esegue → loop registra esports di `joiner/components.tsx` su `windoww` (linea 113-119) → `windoww['Zoom']` esiste.
2. Utente apre un modello/metamodello → `MetamodelTab` o `ModelTab` mount → `EditorSwitch` mount → `ActiveEditorContext.tsx` import-eseguito → `windoww['ClassicZoomBridge']` settato.
3. `EditorV2` mount → renderizza `classicSlot` se `editorMode === 'classic'|'split'`.
4. La view template del root graph viene compilata via `redux/reducer/reducer.ts:993-995`: `new Function(paramStr, body)`.
5. Il body viene eseguito al render del root graph → `React.createElement(ClassicZoomBridge, ...)` cerca `ClassicZoomBridge` nello scope globale.

**A questo punto** `windoww['ClassicZoomBridge']` esiste (è stato settato al passo 2). **La registrazione è quindi tempistica corretta.** ✅

### V2 — `windoww` è alias di `window`

**Confermato:**

- `frontend/src/joiner/types.ts:191`:
  ```ts
  export const windoww: typeof window & GObject = window;
  ```
- `frontend/src/joiner/index.ts:18` e `joiner/classes.ts:153`: alias locali `var windoww = window as any;`.
- Lookup nel template engine: `frontend/src/joiner/classes.ts:457` (`windoww[constructor.cname] = constructor`) e `joiner/ExecuteOnRead.ts:113-119` (`windoww[k] = wComponents[k]`).

`windoww` **è** `window`. Quindi `window.ClassicZoomBridge` (verificabile in DevTools console) deve essere `function`.

### V4 — Toolbar globale è sempre montato

**Confermato:** `frontend/src/components/editor-v2/EditorV2.tsx:2885-2919` il `<Toolbar>` è renderizzato **fuori** dal condizionale `editorMode === 'classic' | 'split' | flow-only`. Quindi è SEMPRE presente in tutte e tre le modalità.

Il blocco zoom della toolbar (`Toolbar.tsx:471`) è gated da:
```tsx
{onZoomOut && onZoomIn && onResetZoom && zoomLevel !== undefined && (...)}
```

Le props passate da EditorV2 (linee 2902-2905):
```tsx
zoomLevel={activeController ? activeZoomLevel : undefined}
onZoomIn={activeController ? handleActiveZoomIn : undefined}
onZoomOut={activeController ? handleActiveZoomOut : undefined}
onResetZoom={activeController ? handleActiveResetZoom : undefined}
```

Se `activeController === null`, tutte e quattro sono `undefined` → blocco zoom nascosto. **Comportamento atteso quando classic è attivo ma il controller del classic non è registrato.**

### V6 — Zero altri `<Zoom>` nel sorgente

**Confermato:**

- `grep -rn "<Zoom\b" frontend/src/` → 0 hit
- `grep -rn "Zoom node" frontend/src/` → 0 hit

L'unico hit residuo è `<ClassicZoomBridge node={node}/>` in `DV.tsx:1297` e il commento `// here so \`<ClassicZoomBridge node={node}/>\`` in `ActiveEditorContext.tsx:118`.

**Quindi** se i bottoni `+` / `−` verticali del classic editor sono ancora visibili, il `<Zoom>` deve essere stato istanziato da una fonte diversa dal sorgente: **molto probabilmente una jsxString persistita in un progetto salvato precedentemente**.

---

## Da verificare con utente (DevTools runtime)

### V1.5 — `typeof window.ClassicZoomBridge`

In DevTools console:
```js
typeof window.ClassicZoomBridge
```
Atteso: `'function'`.

Se risulta `'undefined'`:
- Vite ha tree-shaked la registrazione globale (improbabile ma possibile)
- L'utente non ha mai aperto un model/metamodello in questa sessione (EditorSwitch non si è mai montato → modulo non caricato)

### V3.5 — React tree in classic-only mode

In DevTools React Components tab, in modalità classic-only:
1. Cercare `ActiveEditorProvider` → deve essere presente sopra l'editor classic
2. Cercare `ClassicZoomBridge` → **se MANCA, conferma che il template engine non lo monta**
3. Cercare `Zoom` → **se PRESENTE, conferma che il template engine sta usando una jsxString stale (con `<Zoom>` dentro)**

### V5.3 — Computed background del `::before`

Nell'inspector DevTools, selezionare l'elemento con classe `is-active-editor`, poi nel pannello CSS attivare il pseudo-elemento `::before`, e leggere il computed value di `background`. Atteso (data la diagnosi): `rgb(51, 65, 85)` (= `#334155` slate-700) o `rgb(148, 163, 184)` in dark.

---

## Smentito

### Ipotesi "ClassicZoomBridge fallisce a registrarsi su windoww"

La registrazione è top-level nel modulo `ActiveEditorContext.tsx`. Il modulo è importato da `EditorSwitch.tsx` (riga 4). EditorSwitch si monta SEMPRE quando si apre un model/metamodel tab. Quindi al momento del primo render del classic graph, `windoww['ClassicZoomBridge']` è settato. Si potrebbe verificare con V1.5, ma su base teorica la registrazione non può fallire in condizioni normali.

### Ipotesi "EditorV2 non monta in classic-only"

Smentita. Letto `EditorSwitch.tsx:51-65`: in modalità con viewpoint, EditorV2 è renderizzato come unico figlio di `editor-switch-stage`. Riceve `classicSlot={children}` e `editorMode` controllato da React state. EditorV2 è SEMPRE l'host e gestisce la scelta tra flow / classic / split internamente.

### Ipotesi "il provider `ActiveEditorProvider` è in una posizione sbagliata"

Smentita. `EditorSwitch.tsx:39-65` avvolge entrambi i rami (con/senza viewpoint) in `<ActiveEditorProvider>`. Quindi tutti i discendenti (EditorV2 + classicSlot) hanno accesso al context.

---

## Root cause più probabile

### Sintomo 1 (slate stripe) — confidenza ALTA

`var(--color-accent, #0ea5e9)` risolve a slate perché `--color-accent` è definito come slate in entrambi i temi. Il fallback cyan non si attiva mai.

### Sintomi 2 + 3 (bottoni del classic ancora visibili + toolbar zoom block sparisce in classic) — confidenza ALTA

**Le view di Jjodel sono persistite in Redux (e quindi nei progetti salvati) come `jsxString`.** Il flusso:

1. Quando un progetto vecchio viene caricato, le sue `DViewElement` arrivano dal localStorage/file con la jsxString **vecchia** (contenente `<Zoom node={node}/>`).
2. Il meccanismo di refresh si trova in `frontend/src/redux/VersionFixer.tsx:130-139`:
   ```ts
   for (let k in s.idlookup) {
       let e = s.idlookup[k];
       if (cn !== 'DViewElement' && cn !== 'DViewPoint') continue;
       let v: DViewElement|DViewPoint = e as any;
       if (v.className.includes("View") && v.version !== VersionFixer.highestVersion && !v.clonedCounter){
           LViewElement.updateDefaultView(v, s);
       }
   }
   ```
   `updateDefaultView` (in `view/viewElement/view.tsx:1728-1746`) sostituisce la view stale con `Defaults.defaultViewsMap[v.id]` (la fresh, generata da `DV.modelView()` all'avvio).
3. **Ma `updateDefaultView` viene chiamato SOLO se** `v.version !== VersionFixer.highestVersion`. La nostra modifica in `DV.tsx` **NON ha bumpato `highestVersion`**, quindi le view delle vecchie sessioni hanno `v.version === VersionFixer.highestVersion (= 2.210)` → la condizione è falsa → NIENTE refresh.
4. Risultato: la jsxString stale con `<Zoom>` continua a essere usata. Il template engine compila → `React.createElement(Zoom, ...)` → trova `windoww['Zoom']` (registrato via `joiner/components.tsx`) → renderizza i bottoni `+`/`−`. **`<ClassicZoomBridge>` non viene mai istanziato.**
5. Cascading effect:
   - `ClassicZoomBridge` non monta → useEffect interno non esegue → `registerZoomController('classic', ...)` non chiamato → `controllersRef.current.get('classic')` ritorna `undefined`
   - L'utente clicca sull'editor classic → `setActive('classic')` aggiorna `activeEditorId = 'classic'`
   - `getActiveZoomController()` consulta `controllersRef.current.get('classic')` → `undefined`
   - In EditorV2: `activeController = null` → tutte le props zoom passate al Toolbar diventano `undefined` → il blocco zoom della toolbar **scompare** (gated da `{onZoomOut && onZoomIn && onResetZoom && zoomLevel !== undefined && ...}`)

Questo allinea **tutti e due** i sintomi 2 e 3 a una singola root cause: **la jsxString persistita non viene aggiornata perché `VersionFixer.highestVersion` non è stata bumpata**.

**Verifica empirica suggerita all'utente:** creare un progetto NUOVO da zero (non aprirne uno salvato). Aprire un modello con viewpoint, andare in classic-only:
- Se i bottoni `+`/`−` del classic **scompaiono** → conferma definitiva (root cause è view stale)
- Se persistono → cercare altrove (dead code in altre view template stringate, stato persistito di window, ecc.)

### Sintomi 1 + 2 + 3: due root cause indipendenti, NON una sola

Importante: le decisioni Fase 2 erano coerenti con quanto noto al momento, ma due assunzioni si sono rivelate sbagliate dopo lo smoke test:
1. **Color accent**: `var(--color-accent, #0ea5e9)` non garantisce cyan, perché la variabile esiste ed è slate.
2. **View persistence**: il prompt Fase 1 e Fase 2 non hanno menzionato la persistenza delle view template come jsxString in Redux. Una modifica a `DV.tsx` è invisibile finché `VersionFixer.highestVersion` non viene bumpata.

---

## Fix raccomandato

NESSUN fix applicato. Tre alternative proposte (per i sintomi 2+3 — stessa root cause; per il sintomo 1 vedi alla fine).

### Alternative per sintomi 2+3

#### Alternativa A — Bump `VersionFixer.highestVersion` con adapter no-op

**Cosa:** Aggiungere a `frontend/src/redux/VersionFixer.tsx` un metodo:
```ts
private ['2.210 -> 2.211'](s: DState): DState { return s; }
```

L'esistenza del metodo automaticamente bump `highestVersion` a `2.211` (logica in `setup()` linee 79-101). Al primo load, ogni `DViewElement` con `version !== 2.211` triggererà `updateDefaultView`, che rimpiazza la jsxString vecchia con quella fresh da `Defaults.defaultViewsMap` (generata all'avvio da `DV.modelView()` con `<ClassicZoomBridge>`).

**Pro:**
- Meccanismo idiomatico del progetto. Lo stesso pattern usato per le precedenti modifiche al sistema view (8 transizioni `2.20x -> 2.20y` esistenti).
- Side-effect minimo: passa attraverso `updateDefaultView` che preserva `subViews`, `pointedBy`, ecc.
- Gestisce correttamente le view non clonate (`!clonedCounter`). Le view modificate dall'utente restano intatte (decisione esplicita del condizionale in `VersionFixer.tsx:136`).

**Contro:**
- Tocca un file fuori dalla lista di Phase 2. Strict reading del prompt: "fermarsi e riportare prima di procedere" — quindi richiede conferma utente prima del fix.
- Le view clonate (con `clonedCounter`) **non vengono aggiornate**. Per quelle, l'utente ha esplicitamente deciso di customizzare → il classic continuerà a mostrare `<Zoom>` lì. Comportamento accettabile o tradeoff?

#### Alternativa B — Registrare il classic controller direttamente da EditorV2 senza dipendere dal template

**Cosa:** EditorV2 osserva il Redux store per trovare il root graph del modello attivo (per `modelid`), ne estrae il LGraph (o il DGraph), e registra direttamente un `ZoomController` come da Strada B ma senza passare per `ClassicZoomBridge`.

**Pro:**
- Funziona indipendentemente dalla jsxString persistita. Niente da bumpare in VersionFixer.
- Si possono opzionalmente lasciare i bottoni `+`/`−` interni del classic (sono accettabili in classic-only mode visto che la toolbar globale è anch'essa visibile).

**Contro:**
- EditorV2 deve subscrivere a Redux per trovare il root graph del modelid corrente. Non banale (vedi `ModelTab.tsx:64-70` per la query `state.graphs.filter((graph) => { return graph.model === ownProps.modelid && graphStyle !== 'v2-flow' })`).
- Il `node` su cui agire ha la stessa shape di `<Zoom node={node}/>` (DGraphElement con `.zoom: GraphPoint`), ma EditorV2 deve accedervi direttamente — un layer di accoppiamento nuovo non in linea con la struttura attuale.
- I bottoni `+`/`−` interni del classic restano visibili a meno di ulteriori modifiche.

#### Alternativa C — Strategia dual: rimuovere tag dal template + register from EditorV2

**Cosa:** Combinare A e B. Bumpare la version per pulire le jsxString stale (rimuove `<Zoom>` dai vecchi progetti) E registrare il controller da EditorV2 (per evitare dipendenza dal template).

**Pro:**
- Robust: anche se qualcuno usa una jsxString clonata che non viene aggiornata, il classic controller funziona.
- Pulizia visiva: rimuove i bottoni `+`/`−` da tutti i project (clonati esclusi).

**Contro:**
- 2× il lavoro / 2× la superficie di test.
- Doppia complessità a fronte di un beneficio marginale (i project clonati sono rari per la view del root model).

**Raccomandazione:** Alternativa **A** se l'utente accetta di toccare `VersionFixer.tsx` (1 metodo no-op, 1 riga). È il minor delta, segue il pattern del progetto, e l'edge case delle view clonate è già un comportamento atteso e documentato.

### Per il sintomo 1 (colore stripe)

Cambiare in `EditorV2.scss` la regola `.is-active-editor::before`:
- **Opzione 1:** hardcode `background: #0ea5e9;` (cyan literal coerente con CLAUDE.md "cyan accent").
- **Opzione 2:** usare il token cyan esistente `var(--color-cyan-500, #06b6d4)` (definito in `tokens.css:33`). Ma il prompt richiedeva `#0ea5e9` non `#06b6d4`.
- **Opzione 3:** introdurre nel design system token `--color-editor-active-stripe: #0ea5e9` (single source of truth ma 1 file in più toccato — `tokens/_colors-light.scss` + `tokens/_colors-dark.scss`).

**Raccomandazione:** Opzione **1** — hardcode `#0ea5e9` nella regola `.is-active-editor::before`. Coerente con i ~12 hex literal `#0ea5e9` già presenti in `EditorV2.scss` (i quali tutti usano lo stesso pattern hex cyan accent per UI states). 1 sola riga di modifica.

---

## Osservazioni laterali

1. **Inconsistenza nel design system per il "cyan accent"**: `EditorV2.scss` usa `#0ea5e9` come hex literal in 12 punti, mentre `tokens.css` definisce `--color-cyan-500: #06b6d4` (un cyan più scuro). I due valori non sono sinonimi e non sono unificati. Probabile tech debt da affrontare in un audit del design system separato; non bloccante per questo task.

2. **`Zoom` component "morto" residuo**: `frontend/src/components/forEndUser/Panel.tsx:283-329` contiene la copia gemella del `Zoom` di `Control.tsx`. Già notato in Fase 1 come dead code. Nessun consumer attuale. Non rilevante per questi sintomi, ma se l'Alternativa A viene applicata e successivamente il `Zoom` originale viene smesso d'uso completamente, anche `Panel.tsx` si potrà cleanup.

3. **`onFitView` sempre `handleFitView`**: in Fase 2 ho dovuto ripristinare `onFitView={handleFitView}` (non condizionale) perché `Toolbar.tsx` ha `onFitView: () => void` come prop **required**, non opzionale. Effetto: il pulsante "fit-to-view" della toolbar invoca sempre `fitView` di React Flow, anche quando classic è attivo. Probabilmente innocuo (non visibile, perché in classic-only il flow non è renderizzato), ma se in split view l'utente clicca "fit" da classic attivo → fa il fit del flow. Conviene chiarirlo con l'utente in un follow-up.

4. **VersionFixer: tutti i progetti freshly-saved mostrano già il fix?** Da verificare: il prompt Fase 2 ha runnato `npm run build` ma non ha rebuildato il file `Defaults.defaultViewsMap` per progetti già salvati su disk. Quindi smoke test dell'utente potrebbe essere stato fatto su un progetto pre-Phase 2. Suggerire all'utente: testare anche con progetto NUOVO per isolare la variabile.
