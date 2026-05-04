/**
 * Default jsxString template per le view di default generate dai context menu
 * (vedi `createViewInWorkbench` e `LViewElement.newDefault`).
 *
 * Variante 2.3 — L2 isEdge support (sessione 2026-05-04, Fase 4).
 *
 * Tre rami di rendering controllati al top-level del jsxString:
 *
 *   A) view.isEdge=true ed entrambe le espressioni edge risolvibili:
 *      → ritorna `null`. L'overlay SVG (EdgeOverlay.tsx) disegna l'arco;
 *      la card non viene resa nel DOM. La gate IIFE in cima al template
 *      controlla questo caso e bypassa l'intero `<View>`.
 *
 *   B) view.isEdge=true ma almeno una espressione non risolvibile:
 *      → la card si renderizza con `--edge-like --edge-fallback`. Preview
 *      "S1 → ?" o "? → ?" segnala lo stato edge non collegato. T1 resta
 *      cliccabile per fix dal properties panel — niente user trap.
 *
 *   C) view.isEdge=false (default per progetti pre-L2 e per view non-edge):
 *      → comportamento "minimal clean" 2.2 invariato. Heuristic edge-like
 *      auto-rilevata su 2 reference (associative class binary).
 *
 * Design "Minimal clean" (caso C):
 *   - Nome dell'oggetto come titolo (Input field=name, editabile inline).
 *   - Pill cyan con il nome della classe (data.instanceof.name).
 *   - Smart preview "S1 → S2" per metaclasse con esattamente 2 reference.
 *   - Hint in basso "Customize this view" (nascosto via SCSS quando smart preview attivo).
 *
 * Heuristic edge-like (auto-rilevata): se la metaclasse ha esattamente
 * 2 reference, la card si renderizza compatta E mostra lo smart preview.
 *
 * Trade-off heuristic: falsi positivi su entity con esattamente 2 reference
 * (es. Person con friend + parent). La card appare compatta + preview
 * "John → Mary" anche se Person non è un'associative class. Accettato come
 * limite noto: l'estetica è "fuori contesto" ma funzionalmente nulla si rompe.
 * Distinzione corretta entity-vs-edge richiede campo `representation` esplicito
 * sulla DClass, materia del task strutturato di edge representation (backlog).
 *
 * Nota sull'evoluzione della heuristic: una versione precedente confrontava
 * anche `references[0].type === references[1].type` per restringere a casi
 * "self-loop" (es. Transition con source: State + target: State). Test runtime
 * su TUTTO con `source: Source` + `target: Target` (target classifier diversi)
 * ha mostrato che il proxy L non garantisce `===` su classi diverse, quindi
 * il check escludeva il caso. Rilassato a `length === 2` accettando i falsi
 * positivi sulle entity binary.
 *
 * VINCOLI DEL TEMPLATE ENGINE (verificati in canvas, sessione 2026-05-03/04):
 *   - NIENTE optional chaining `?.` — solo AND-chain esplicita.
 *   - NIENTE nullish coalescing `??` — solo ternary.
 *   - JSX nidificato dentro IIFE NON funziona — IIFE ritorna stringa o
 *     boolean, il `<div>` / `<View>` sta fuori.
 *   - L'espressione del `className` sul `<View>` deve stare su singola riga;
 *     spalmare il ternary su più linee causa `Unexpected token ')'` runtime.
 *   - `data['$' + name]` con `name` runtime FUNZIONA sul proxy L.
 *   - `data.instanceof.references` ritorna l'array delle reference proprie.
 *   - `var` per le variabili IIFE (no `let`/`const` per safety).
 *   - Top-level JS ternary `condition ? null : <View>...</View>` FUNZIONA
 *     (verificato sessione 2026-05-04 contro `graphElement.tsx:1376/1395/1526`:
 *     `null` è gestito pulito dal renderer, niente wrapper DOM residuo).
 *   - Carattere "→" scritto come `→` per safety encoding.
 *
 * Variabili runtime in scope:
 *   - `data` — LObject istanza M1 (può essere null).
 *   - `view` — LViewElement della DV corrente (espone view.isEdge,
 *     view.edgeSource, view.edgeTarget — campi L2 di Fase 1).
 *   - `windoww.evalEdgeExpression(data, expr)` — mini-evaluator L2 per
 *     edgeSource/edgeTarget (vedi `utils/edgeExpressionEval.ts`).
 *   - `decorators` — subview decorator nodes (caso non-exclusive).
 *
 * Naming collision attention: in scope esiste anche un flag locale `isEdge`
 * (boolean, "il nodo corrente è un edge?" — da EdgeOwnProps). Distinto da
 * `view.isEdge` (campo L2 della DV) grazie al prefisso `view.`. SEMPRE usare
 * `view.isEdge` quando si testa il nuovo schema, MAI `isEdge` bare.
 *
 * Lo styling vive in `frontend/src/styles/default-view.scss` (classe BEM
 * `.jjodel-default-view`, modifier `.jjodel-default-view--edge-like` e
 * `.jjodel-default-view--edge-fallback`). Stati interattivi (`:hover`,
 * `&.selected`, `&.selected-by-me`) sono gestiti dallo SCSS, non dal template.
 *
 * Visibilità di hint vs preview:
 *   - Il template renderizza SEMPRE entrambi i `<div>` (preview + hint).
 *   - Lo SCSS nasconde la preview di default; la mostra in modalità --edge-like.
 *   - Lo SCSS nasconde l'hint in modalità --edge-like e --edge-fallback.
 *   - L'IIFE preview ritorna '' (stringa vuota) quando non applicabile;
 *     in quel caso il div preview è block-vuoto ma non visibile (hidden by SCSS
 *     in modalità non-edge-like).
 *
 * Questa costante è importata da:
 *   - frontend/src/utils/lastViewpoint.ts (path 1A)
 *   - frontend/src/view/viewElement/view.tsx (path 1B)
 *   - frontend/src/redux/VersionFixer.tsx (migration 2.211 -> 2.212 e 2.213 -> 2.214)
 */
export const DEFAULT_VIEW_JSX_STRING: string = `(function(){
    if (!view) return false;
    if (view.isEdge !== true) return false;
    if (!windoww.evalEdgeExpression) return false;
    var src = windoww.evalEdgeExpression(data, view.edgeSource);
    var tgt = windoww.evalEdgeExpression(data, view.edgeTarget);
    return src && tgt ? true : false;
}()) ? null :
<View className={'root jjodel-default-view' + (view && view.isEdge === true ? ' jjodel-default-view--edge-like jjodel-default-view--edge-fallback' : ((data && data.instanceof && data.instanceof.references && data.instanceof.references.length === 2 && data.instanceof.references[0] && data.instanceof.references[1]) ? ' jjodel-default-view--edge-like' : ''))}>
    <div className={'jjodel-default-view__header'}>
        {!data ? null :
            <label className={'jjodel-default-view__name'}>
                <Input data={data} field={'name'} hidden={true} autosize={true} placeholder={'unnamed'}/>
            </label>
        }
        {!(data && data.instanceof && data.instanceof.name) ? null :
            <span className={'jjodel-default-view__type'}>{data.instanceof.name}</span>
        }
    </div>
    <div className={'jjodel-default-view__edge-preview'}>{(function(){
        if (view && view.isEdge === true) {
            if (!windoww.evalEdgeExpression) return '? → ?';
            var src = windoww.evalEdgeExpression(data, view.edgeSource);
            var tgt = windoww.evalEdgeExpression(data, view.edgeTarget);
            var srcName = src && src.name ? src.name : '?';
            var tgtName = tgt && tgt.name ? tgt.name : '?';
            return srcName + ' → ' + tgtName;
        }
        if (!data || !data.instanceof || !data.instanceof.references) return '';
        var refs = data.instanceof.references;
        if (refs.length !== 2) return '';
        if (!refs[0] || !refs[1]) return '';
        var srcAcc = data['$' + refs[0].name];
        var tgtAcc = data['$' + refs[1].name];
        var srcName2 = srcAcc && srcAcc.value && srcAcc.value.name ? srcAcc.value.name : '?';
        var tgtName2 = tgtAcc && tgtAcc.value && tgtAcc.value.name ? tgtAcc.value.name : '?';
        return srcName2 + ' → ' + tgtName2;
    }())}</div>
    <div className={'jjodel-default-view__hint'}>Customize this view</div>
    {decorators}
</View>`;

/**
 * Marker testuale presente nel placeholder OBSOLETO. Usato dalla migration
 * `'2.211 -> 2.212'` per detectare le view stale e sostituire il jsxString.
 *
 * NON modificare questa stringa: deve continuare a matchare i jsxString
 * salvati prima del redesign. Se in futuro si aggiunge un nuovo redesign,
 * aggiungere un nuovo marker, non modificare questo.
 */
export const LEGACY_PLACEHOLDER_MARKER: string = 'To add information here,';

/**
 * Marker per detectare il template v2.2 (pre-isEdge) durante la migration
 * `'2.213 -> 2.214'`. La frase 'Customize this view' è presente sia nel v2.2
 * che nel v2.3 (è l'hint statico, mantenuto invariato per UX). Per
 * disambiguare, la migration controlla anche l'ASSENZA di 'view.isEdge'
 * nel jsxString — presente solo nel v2.3 (Fase 4 in poi).
 *
 * Non modificare questa stringa: deve continuare a matchare il jsxString
 * v2.2 salvato nei progetti esistenti.
 */
export const V2_2_TO_V2_3_DETECT_MARKER: string = 'Customize this view';
