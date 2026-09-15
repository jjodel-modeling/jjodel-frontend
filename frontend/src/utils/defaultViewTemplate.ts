/**
 * FROZEN LEGACY (v2.3). The constant `DEFAULT_VIEW_JSX_V2_3_LEGACY` immediately below is the
 * historical default template that embedded edge rendering (the `isEdge` top-level gate, the
 * `--edge-fallback` branch) and the `length === 2` "edge-like" heuristic INSIDE the jsxString.
 *
 * It is FROZEN and kept for ONE purpose: migration `'2.223 -> 2.224'` uses it (together with the
 * marker `V2_3_TO_V3_DETECT_MARKER`) to detect and rewrite persisted v2.3 jsxStrings. Do not
 * modify it and do not wire it into rendering.
 *
 * The ACTIVE default template is the simplified `DEFAULT_VIEW_JSX_STRING` further down. Edge
 * rendering NO LONGER lives in any template: it is handled in TS BEFORE template evaluation —
 * `graphElement.tsx` `renderView` resolves the two edge endpoint expressions and renders either
 * `null` (the SVG overlay `EdgeOverlay.tsx` draws the arc) or a native `EdgeFallbackCard`
 * (`components/edgeOverlay/EdgeFallbackCard.tsx`). The `length === 2` heuristic is removed entirely.
 */
export const DEFAULT_VIEW_JSX_V2_3_LEGACY: string = `(function(){
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
 * Substring unique to the v2.3 template: present in `DEFAULT_VIEW_JSX_V2_3_LEGACY`, absent from
 * both the v2.2 template and the simplified v3 `DEFAULT_VIEW_JSX_STRING`. Consumed by migration
 * `'2.223 -> 2.224'` to detect still-default v2.3 jsxStrings. Never modify.
 */
export const V2_3_TO_V3_DETECT_MARKER: string = 'jjodel-default-view--edge-fallback';

/**
 * Simplified v3 default template for context-menu Default views — consumed by
 * `createViewInWorkbench` (`utils/lastViewpoint.ts`), `LViewElement.newDefault`
 * (`view/viewElement/view.tsx`), and the `Defaults` map that `updateDefaultView` regenerates from,
 * plus migration `'2.223 -> 2.224'` (rewrite target). Header (inline-editable name Input + type
 * pill) + hint + decorators. NO edge logic: edge views are handled in TS before template
 * evaluation (`graphElement.tsx` renderView -> `EdgeFallbackCard`); see the FROZEN LEGACY note above.
 *
 * TEMPLATE ENGINE CONSTRAINTS (still apply to anyone authoring a jsxString, verified 2026-05-03/04):
 *   - no optional chaining `?.` — explicit AND-chains only.
 *   - no nullish coalescing `??` — ternary only.
 *   - JSX nested inside an IIFE does NOT work — an IIFE returns a string/boolean; the `<View>` stays outside.
 *   - the `className` expression on `<View>` must stay on a single line.
 *   - `data['$' + name]` with a runtime `name` works on the L proxy.
 *   - `var` only inside IIFEs (no `let`/`const`).
 *   - a top-level JS ternary `condition ? null : <View>...</View>` is handled cleanly by the renderer.
 */
export const DEFAULT_VIEW_JSX_STRING: string = `<View className={'root jjodel-default-view'}>
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

// ============================================================
// Classic-editor M1 Default views — v3 (visual parity with flow editor)
//
// These three templates redesign the Default-viewpoint M1 views rendered by
// the CLASSIC editor (DefaultView.object/value/singleton in DV.tsx) so they
// read like the editor-v2 flow node, including automatic adoption of the
// active custom palette. The Object body lists attribute slots visibly and
// renders reference slots in a height:0 anchor container (references show as
// edges, not rows; the container keeps each reference DValue's GraphElement
// alive with a live DOM node so M1 reference edges can resolve their source
// endpoint — see impl_get_suggestedEdgesM1 in LModelElement.tsx). Styling lives
// in `frontend/src/styles/classic-object-view.scss` (BEM `.jjodel-classic-*`),
// consuming the SAME palette CSS variables (and fallbacks) the flow node uses.
//
// TEMPLATE ENGINE CONSTRAINTS (see top-of-file note, verified 2026-05-03/04):
// no `?.`, no `??`, IIFEs return strings only, `var` only inside IIFEs,
// hook-free, `className` ternary on a SINGLE line.
//
// Migration `2.222 -> 2.223` (VersionFixer) rewrites stale persisted jsxStrings
// to these constants. Detection pairs a stable substring kept from the legacy
// template (`object-children` / `values_str` / `singleton`) with the ABSENCE
// of the v3 marker below — the new templates intentionally keep that substring,
// so the marker is what prevents re-firing.
// ============================================================

/** v3 marker — present only in the comment, NOT in the `.jjodel-classic-object`
 *  className (which omits the ` v3` suffix). Do not modify across redesigns. */
export const CLASSIC_OBJECT_VIEW_MARKER = 'jjodel-classic-object v3';
export const CLASSIC_VALUE_VIEW_MARKER = 'jjodel-classic-value v3';
export const CLASSIC_SINGLETON_VIEW_MARKER = 'jjodel-classic-singleton v3';

// ============================================================
// TOOL-GENERATED DEFAULT FAMILIES — recognition markers
// ============================================================
// The three markers above cover only the classic M1 object/singleton/value
// family. Everything else Jjodel generates by itself was invisible to
// `isKnownDefault` in the inverse migration `2.225 -> 2.226`, so it fell into
// the "custom jsxString" branch and got marked `irLegacyClassic`: on the real
// saved projects that was 1315 views out of 1550 (census 2026-08-04), of which
// the most frequent are not authored notation at all.
//
// These markers close that gap. Each is an `includes` fragment, NOT a whole
// template: the same view exists in several historical versions and an equality
// test would miss almost all of them. Each fragment is emitted verbatim by
// `common/DV.tsx` (the generator) and is specific enough not to catch authored
// notation that merely happens to reuse a CSS class.
//
// Deliberately NOT covered: `<section className="overlap">` of
// DV.semanticErrorOverlay (DV.tsx:1085,1089). `overlap` alone is too generic to
// qualify as a marker, and the anchor overlay below is matched on its own
// distinctive className instead.

/** Edge relation views (DV.tsx:870): the class-list prefix is identical for
 *  every mode name (Association / Aggregation / Composition / Extension), which
 *  is appended after it. Largest single family in the census (381 occurrences). */
export const CLASSIC_EDGE_RELATION_MARKER = 'edge hoverable hide-ep clickthrough fullscreen';

/** Head comment stamped on the generated abstract-syntax views (DV.tsx:1219 and
 *  others). Stable across v2.0 / v2.2 / v2.3 — the version digits follow it, so
 *  the fragment stops before them on purpose and one marker covers all three. */
export const JJODEL_ABSTRACT_SYNTAX_MARKER = 'Jjodel Abstract Syntax Specification';

/** Edge-point view (DV.tsx:592-595). */
export const CLASSIC_EDGEPOINT_VIEW_MARKER = 'className={"edgePoint"}';

/** Anchor overlay (DV.tsx:585-589). Keyed on the inner anchor className, not on
 *  the outer `overlap` wrapper, which is too generic (see note above). */
export const CLASSIC_ANCHOR_OVERLAY_MARKER = 'anchor draggable resizable';

/** "Shapeless element" placeholder shown when nothing matched (DV.tsx:1332). */
export const CLASSIC_VOID_VIEW_MARKER = 'void model-less';

export const CLASSIC_OBJECT_VIEW_JSX: string = `
/* jjodel-classic-object v3 */


<View className={'root object jjodel-classic-object'}>
    <div className={'jjodel-classic-object__header'}>
        <span className={'jjodel-classic-object__title'}>
            <span className={'jjodel-classic-object__name'}>
                {data.$name ?
                    <Input data={data.$name} field={'value'} hidden={true} autosize={true} placeholder={'name'} /> :
                    <Input data={data} field={'name'} hidden={true} autosize={true} placeholder={'name'} />
                }
            </span>
            <span className={'jjodel-classic-object__separator'}> : </span>
            <span className={'jjodel-classic-object__type'}>{data.instanceof ? data.instanceof.name : 'Object'}</span>
        </span>
    </div>
    <div className={'jjodel-classic-object__body object-children'}>
        {level >= 2 && data.attributeFeatures.map(f => <DefaultNode key={f.id} data={f} />)}
        <div className={'jjodel-classic-object__ref-anchors'}>
            {level >= 2 && data.referenceFeatures.map(f => <DefaultNode key={f.id} data={f} />)}
        </div>
    </div>
    {decorators}
</View>`;

export const CLASSIC_VALUE_VIEW_JSX: string = `
/* jjodel-classic-value v3 */


<View className={'root value d-flex jjodel-classic-value' + (valuesString === '' ? ' jjodel-classic-value--empty' : '')}>
    {instanceofname && <label className={'d-block ms-1 name jjodel-classic-value__name'}>{instanceofname}</label>}
    {!instanceofname && <Input className='name jjodel-classic-value__name' data={data} field={'name'} hidden={true} autosize={true} />}
    <span className={'jjodel-classic-value__sep'}>=</span>
    <label className={'d-block ms-1 values_str jjodel-classic-value__value'}>{valuesString}</label>
    {decorators}
</View>`;

export const CLASSIC_SINGLETON_VIEW_JSX: string = `
/* jjodel-classic-singleton v3 */


<View className={'singleton jjodel-classic-singleton'}>
    <div className={'jjodel-classic-object__header jjodel-classic-singleton__header'}>
        <span className={'jjodel-classic-object__name'}>{data.name}</span>
    </div>
</View>`;
