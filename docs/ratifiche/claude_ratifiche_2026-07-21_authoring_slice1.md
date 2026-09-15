# Ratifiche authoring slice 1 (design doc + 2 aggiunte + Q5)

Data: 2026-07-21. Fonte: design doc slice-1 (Fase 1.5, generato da Claude Code sull'albero locale, con re-verifica degli anchor e correzione §1.9) + `claude/discovery_2026-07-21_authoring_surface.md`. Prima fetta = editor vertex + PathBuilder.

## Decisioni ratificate

- **D1/Q1** — Pannello **dedicato**, keyed su `_lastSelected.view` (non dentro `Info.tsx`, componente da 1400 righe).
- **D2/Q2** — `MetaclassInfo.allAttributes` come **campo nuovo additivo** (non toccare `attributes`, così ogni consumer di `useEditorMode` resta byte-identico); union degli attributi own risalendo la catena `extends` (riuso dell'`extendsMap` che `resolveM1Info` già costruisce); + export di un accessor non-hook. **§1.9 correzione**: `allAttributes` NON esiste (grep vuoto), la fix non è uno swap di un token.
- **D3** — Write immutabile whole-object (`lview.ir = clone+patch` via `set_ir`→`SetFieldAction`), mai mutazione in-place (altrimenti il `refToken` WeakMap non gira e la preview non si aggiorna).
- **D4** — Validazione a 3 tier: (a) PathBuilder previene gli errori semantici per costruzione; (b) `validateIR` = `compileView`-in-try/catch come gate strutturale prima di ogni write; (c) `ErrorText` inline + **write soppresso** in errore.
- **D5** — Draft React locale + commit **debounced** (~250-400ms). **Rifinitura ratificata**: validare **eager** a ogni edit del draft (errore inline immediato + cache warming), committare **debounced** (preview).
- **D6/Q6** — PathBuilder **single-hop** su own+inherited; seed da `defaultObjectViewIR()` al primo edit se `ir` assente; seam multi-hop riservato (non in slice 1).
- **Q3** — `Conditional<T>` NON editati in slice 1, preservati **verbatim** nel commit (regola di round-trip §5: si editano le foglie scalari, si clona il resto).
- **Q5** — Il pannello compare come **sezione nella Properties region** quando una view è selezionata (componente dedicato per D1, collocazione nella Properties).

## Aggiunte (co-design, oltre il doc)

- **A1 (wildcard)** — Le view di default sono `metaclasses:'*'`; il PathBuilder enumera le feature di UNA metaclasse concreta, quindi su una view wildcard non ha nulla da mostrare. I source di tipo path (label, valori) richiedono metaclassi concrete; su view wildcard il PathBuilder resta **disabilitato con hint** ("imposta una metaclasse per abilitare i path sulle feature"), restano attivi intrinsic/literal. Da mettere nel contratto PathBuilder (§4).
- **A2 (re-render scope, watch-item)** — `computeIRSignature` è una firma globale su tutte le view e `useIRView` di ogni nodo ci si sottoscrive: un commit su una sola view può ri-renderizzare TUTTI i nodi. Debounced mitiga. Criterio di accettazione aggiuntivo: autorare una view non deve far churnare l'intero canvas (verificare che il re-render resti circoscritto, o annotarlo). Non blocker per slice 1.

## Perimetro / vincoli

- Nessun file di critical zone. Unico existing file toccato, additivo: `hooks/useEditorMode.ts` (F1 export + F2 `allAttributes`). Nuovi: `components/ui/{Checkbox,ColorPicker,PathBuilder}/`, `editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx`, `editor-v2/viewpoint/ir/irValidate.ts`.
- No VersionFixer migration (`ir` è già campo persistito del DViewElement; §3.9 non scatta, nessuna default-view source cambia).
- Layering: il PathBuilder vive in `components/ui/` (design system) e prende i descrittori di feature come **prop dati piatti** (non importa `useEditorMode`/editor-v2); è il pannello (editor-v2) a mappare `MetaclassInfo` → prop.

## Piano di implementazione (a fasi)

- **Fase A (layer abilitante)**: F1/F2 (`useEditorMode`), F3 Checkbox, F4 ColorPicker, F5 PathBuilder (+ emit puro), F6 `validateIR`. Ognuno unit-testabile, indipendente dalla collocazione UI. Gate = test + typecheck + build (non visivo).
- **Fase B (pannello)**: `VertexAuthoringPanel` come sezione Properties (Q5), field→control map (§5), write immutabile, eager-validate/commit-debounced, round-trip conditional, preview live, error surface. Hard stop visivo + criteri di accettazione (§10 + A2).
