# Discovery — superficie di authoring IR (cloud read-only, 2026-07-21)

**Tipo**: Fase 1 discovery read-only, eseguita in cloud (clone del branch `alfonso-frontend-jjtl` + agente Explore) sul repo pushato. Nessuna modifica. Base path: `frontend/src/`.
**Obiettivo**: ancorare il design dell'authoring IR (editor strutturati per lo schema IR) alla superficie reale, per la prima fetta = editor vertex + builder di PathExpr.

## Reframe chiave (dal reale)

L'authoring **non sostituisce un editor funzionante**: è **greenfield**. Il TemplateEditor Monaco è **orfano** (definito ma non montato in albero) ed edita `jsxString`, non `ir`. Non esiste oggi alcun editor di `ir`. Il write path per `ir` **esiste ed è pulito** (`LViewElement.set_ir` → `SetFieldAction`) ma non ha consumatori UI. La preview live è **gratis** su scrittura immutabile (replace dell'oggetto). Lo schema IR è una **grammatica chiusa senza buco free-text** (`kind:'raw'` non esiste nemmeno). I blocker sono: costruire pannello + path builder + pochi controlli form + validate-before-write + (dopo) layer di theming, e sistemare la raggiungibilità di MetaclassInfo.

## Findings

### A1. TemplateEditor Monaco — orfano, edita jsxString
`components/editors/viewpoint/TemplateEditor.tsx` edita `dview.jsxString` (scrive via L-proxy `view.jsxString = jsx` on blur, :114-116). SCSS in `StyleEditor.tsx` (`view.css`), predicati in `PredicateEditor.tsx`. Nessuno tocca `ir`. Il cluster ViewpointWorkbench (unico editor Monaco) **non è importato da nessuna parte fuori da `components/editors/viewpoint/`**: definito ma non montato. La superficie viva per una view selezionata è il pannello Properties `components/editors/Info.tsx` (legge `state._lastSelected.view` → `LViewElement.fromPointer`, :1402-1405), editor riflettivi di campi, senza editor `ir`.

### A2. CRUD view/viewpoint
- Crea viewpoint: `ProjectEditor.tsx:1060` `handleCreateViewpoint` → `DViewPoint.newVP`. Attiva viewpoint: `utils/lastViewpoint.ts:46` `activateViewpoint()` → `SetFieldAction(project,'activeViewpoint',...)` (classic) + `SetRootFieldAction('viewpoint', vpId)` (**la chiave su cui l'indice IR di editor-v2 è costruito**, `irResolveCore.ts:54,76`). Selettore UI: `editor-v2/Toolbar.tsx:190,420-439`.
- Crea view: `utils/lastViewpoint.ts` `createBlankViewInViewpoint` (:107), `createViewInWorkbench` (:142) → `DViewElement.new2`. Default in `redux/defaults/views.ts`.
- Seleziona view: scrive `_lastSelected.view` (TreeViewContent, DockManager:194), consumato da `Info.tsx:1402`.

### A3. Write path di `DViewElement.ir` — esiste, zero consumatori UI
`view/viewElement/view.tsx:483-484`: `set_ir(val) { return SetFieldAction.new(c.data, 'ir', val, '', false); }`. Path canonico = `lview.ir = <AnyViewIR>` (replace whole-object, come le scritture attributo). **Nessun caller UI**: oggi tutte le scritture vanno sul D-layer raw (`irDemoFixture.ts:106,112` `(d as any).ir=`; `VersionFixer.tsx:1026` migration; probe AI). L'authoring sarebbe il primo consumatore reale di `lview.ir =`.

### A4. Preview live — funziona su replace, non su mutazione in-place
Catena: `computeIRSignature` (`irResolveCore.ts:53-66`) tagga l'`ir` con un token identità WeakMap (`refToken`, :40-46); un `SetFieldAction` su `'ir'` rimpiazza il riferimento → token e firma cambiano → `getIRIndex` ricostruisce l'indice e ricompila (`compileView`), `useIRView` (`irResolve.ts:45-93`) ri-risolve. **Vincolo**: deve essere replace immutabile; una mutazione in-place (`d.ir.shape.fill=`) mantiene il riferimento e **non** invalida. Nessun trigger UI "edit ir → rerender" esiste oggi, ma la catena scatta su scrittura ref-replacing.

### B1. MetaclassInfo — dati per il path builder
`components/editor-v2/hooks/useEditorMode.ts:43-71`. Shape: `MetaclassInfo{ id, name, isAbstract, attributes: {id,name,type:string(nome),lowerBound,upperBound}[], references: {id,name,targetClassId,targetClassName,containment,aggregation,lowerBound,upperBound}[], concreteSubclasses[] }` + `rootableClasses`. **Asimmetria eredità**: `references` folda le ereditate (`allReferences ?? references`, :358); `attributes` sono **solo own** (:344). Raggiungibilità: `resolveM1Info` (:211) è funzione pura su `store.getState()` ma **module-private**; esportato solo l'hook `useEditorMode` (serve `modelId` + render React). Un pannello authoring o monta l'hook o re-implementa la traversata (dati in `idlookup`, raggiungibili).

### B2. Grammatica PathExpr + validazione
`irCompile.ts` `parsePathExpr` (:41-68). `FORBIDDEN_PATH = /\?\.|\?\?|[?:()]/` (:31); `STEP_RE = /^(\$[A-Za-z_]\w*|value|values(\[\d+\])?)$/` (:33). Accetta step dot-separati `$feature | value | values | values[N]`; single-hop e multi-hop `$ref.value.$attr.value` entrambi parsati. Rigetta (throw): `?.`, `??`, ternari, call, token illegali, `.value` penzolante, expr vuota. `kind:'raw'` **non esiste** nella grammatica (nessun buco free-text). `PathExpr = string`.

### C1. BASE_CSS + theming
`components/editor-v2/viewpoint/ir/irStyle.ts` `BASE_CSS` (:16-44): foglio statico shape-agnostic per i nodi IR (`.ir-node-content`, `.ir-label--*`, `.ir-badge--*`, `.ir-shape--rect/rounded/ellipse`, hull, input inline). Iniettato **una volta, globale**, in `<style id="ir-views-css">` (`ensureStyleTag` :46-56). Regole per-view (border/fill) come `.ir-view-<viewId>` via `ensureViewCss` (:80-87). Conditional form/fill applicati **inline** da IRNodeContent. **Nessun layer token/variabile per le view IR**: slate `#334155` e cyan `#0ea5e9` hardcoded (:36-40), `staticCssFor` emette valori letterali (:62-73). `defaultViewTemplate`/DEFAULT_VIEW_JSX_STRING è pipeline classic separata, non correlata.

### C2. Controlli form riusabili
`components/ui/` (shadcn-inspired, presentazionali, token `var(--...)`): `Button, Input, Select, JjSelect, Textarea, Toggle, Label, HelpText, ErrorText, Field, NumberInput, FormSection, EmptyState`. **Mancano: Checkbox, ColorPicker**, e il path/expression builder. Model-bound (redux, per jsxString) in `components/forEndUser/`. `irTypes.ts:73` già tipizza `widget:'text'|'textarea'|'select'|'checkbox'|'color'` ma nulla lo renderizza.

### D1. Validatore IR — non esiste
Nessun validatore ViewpointIR (grep validate*/isValid). Gate de-facto: throw a compile-time (`parsePathExpr`/`compileView`) + try/catch in `getIRIndex` che **skippa la view malformata con `console.warn`** (`irResolveCore.ts:93-98,124-129`), mai crash. Fallimento **silenzioso e per-view**. L'authoring deve validare prima della scrittura (riuso di `compileView` in try/catch = unico check strutturale) e costruire una error surface.

## Gaps/rischi per l'authoring

1. Nessun write path UI per `ir` (setter esiste, zero caller) → l'authoring è il primo consumatore; scrivere `lview.ir = <obj>` (replace, non mutazione).
2. Nessun editor `ir` oggi (TemplateEditor orfano, edita jsxString) → greenfield.
3. Nessun validatore / error surface → costruirla (compileView-in-try/catch).
4. MetaclassInfo non raggiungibile pulito fuori dal canvas (solo hook esportato) + asimmetria eredità (attributi own-only, reference ereditate foldate).
5. Preview funziona ma fragile allo stile di mutazione: richiede replace immutabile.
6. Nessun layer token/theming per le view IR (irStyle hardcoded).
7. Mancano primitive form (Checkbox, ColorPicker) e il path builder.
8. Due schemi IR: targettare **editor-v2** (`editor-v2/viewpoint/ir/irTypes.ts`), non `ai/viewpointIR` v0.

## Implicazioni di design (prima fetta)

- Pannello authoring nuovo, keyed su `_lastSelected.view` (naturale: estendere Properties `Info.tsx` o pannello dedicato che riusa la stessa selezione). Legge `lview.ir`, edita, riscrive `lview.ir = newObj` (immutabile) → preview live gratis.
- Path builder = controllo di prima classe che emette PathExpr, alimentato da MetaclassInfo; riusato da label, valori compartimento, `visible` badge, `when` conditional, endpoint edge, `childFilter`. È la spina.
- Enabling fixes piccoli: esporre un accessor non-hook per MetaclassInfo (+ flatten attributi ereditati); wrapper validate = compileView-in-try/catch + error surface inline; costruire Checkbox + ColorPicker + PathBuilder in `components/ui/`.
- Theming (token in irStyle.ts) = fetta successiva, non la prima. Seam da riservare.
