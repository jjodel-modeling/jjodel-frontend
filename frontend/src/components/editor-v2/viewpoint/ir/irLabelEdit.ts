import type { LabelSpec, TextSource } from './irTypes';
import { singleHopOf } from './pathExpr';

/**
 * Which labels rename the element on the canvas (spec v1.2 sez. 5). One predicate for the compile
 * (`CompiledLabel.editsName`) and the label editor's Editable toggle, so the panel and the canvas
 * cannot disagree. Pure, types only: it loads in the node bench.
 */

/** The sources that can edit the name: the intrinsic `name` and `qualifiedName`. A literal, a
 *  path and the intrinsic `metaclassName` have no name to write back to. */
export function labelCanRename(source: TextSource): boolean {
    return source.from === 'intrinsic' && (source.prop === 'name' || source.prop === 'qualifiedName');
}

/** True when double-click edits the element name: a source that can rename, unless the IR opts out
 *  with `editable: false`. Absent, `true` and the widget object all rename (absent is the default). */
export function labelEditsName(label: Pick<LabelSpec, 'source' | 'editable'>): boolean {
    return labelCanRename(label.source) && label.editable !== false;
}

/**
 * A path label edits one attribute of its own object (R-IRN-41, amending R-IRN-38 on the path case).
 * The IR decides the step shape at compile time (`labelEditsFeature`); the feature's kind, type and
 * multiplicity are known only where the metamodel is, so the panel and the canvas each build a
 * `LabelFeatureInfo` and call the same `labelFeatureEditBlock`.
 */

/** What an absent `editable` means, per source: a path label edits only when the IR opts in, so no
 *  existing view changes; every other source keeps R-IRN-38's «absent = editable». */
export function labelEditableDefault(source: TextSource): boolean {
    return source.from !== 'path';
}

/** `editable` against the per-source default: absent reads the default, `false` opts out, `true` and
 *  the widget object opt in (the widget kind is not read, as on a name label). */
function labelOptsIn(label: Pick<LabelSpec, 'source' | 'editable'>): boolean {
    if (label.editable === undefined || label.editable === null) return labelEditableDefault(label.source);
    return label.editable !== false;
}

/** The feature a path label reads on its own object in one step, `$f` or `$f.value`; null for any
 *  other source, a multi-step path, `.values`, `.values[N]` and an unparsable path. */
export function labelPathFeature(source: TextSource): string | null {
    if (source.from !== 'path') return null;
    const hop = singleHopOf(source.expr);
    return hop && hop.take === 'value' ? hop.feature : null;
}

/** The feature a double-click writes, from the IR alone: a one-step path label that opts in. */
export function labelEditsFeature(label: Pick<LabelSpec, 'source' | 'editable'>): string | null {
    const feature = labelPathFeature(label.source);
    return feature !== null && labelOptsIn(label) ? feature : null;
}

/** What the edit check needs to know of a feature: the panel maps its metaclass descriptor to it,
 *  the canvas the object's slot (`labelFeatureInfoOf`). `type` is the type name, e.g. 'EString'. */
export interface LabelFeatureInfo {
    kind: 'attribute' | 'reference';
    type: string;
    upperBound: number;
}

/** Why a label cannot edit on the canvas; each one has its hint in the label editor. */
export type LabelEditBlock = 'name-only' | 'single-attribute' | 'string-only';

/** The attribute types a label edits (v1). The inline input writes the typed string as is, as the
 *  row value edit does; no other type has a parse on that write path. */
const LABEL_EDIT_TYPES: ReadonlySet<string> = new Set(['EString']);

/** Null when the feature is a single-valued string attribute; otherwise why not. Unknown (no slot,
 *  no metaclass) is blocked: nothing can say it is an attribute. */
export function labelFeatureEditBlock(info: LabelFeatureInfo | null | undefined): LabelEditBlock | null {
    if (!info || info.kind !== 'attribute' || info.upperBound !== 1) return 'single-attribute';
    return LABEL_EDIT_TYPES.has(info.type) ? null : 'string-only';
}

/** Why the Editable toggle is disabled, or null when it is live. `info` describes the feature of a
 *  one-step path and is not read for any other source. */
export function labelEditBlock(source: TextSource, info: LabelFeatureInfo | null | undefined): LabelEditBlock | null {
    if (source.from !== 'path') return labelCanRename(source) ? null : 'name-only';
    if (labelPathFeature(source) === null) return 'single-attribute';
    return labelFeatureEditBlock(info);
}

/** What the toggle reads: the label edits on the canvas. On every non-path label it is
 *  `labelEditsName`; on a path label, nothing blocks it and the IR opts in. */
export function labelEditable(label: Pick<LabelSpec, 'source' | 'editable'>, info: LabelFeatureInfo | null | undefined): boolean {
    return labelEditBlock(label.source, info) === null && labelOptsIn(label);
}

/**
 * The feature `featureName` of an object, read from a plain `idlookup` the way the compartment rows
 * read it (`IRNodeContent.tsx`): the object's DValue slots, each one's `instanceof` feature. A missing
 * type reads 'EString' and a missing bound 1, as the panel's metaclass info reads them. Null when the
 * object has no slot of that name.
 */
export function labelFeatureInfoOf(lookup: Record<string, any> | null | undefined, objectId: string, featureName: string): LabelFeatureInfo | null {
    const slots = lookup?.[objectId]?.features;
    if (!lookup || !Array.isArray(slots)) return null;
    for (const fid of slots) {
        const feat = lookup[lookup[fid]?.instanceof];
        if (!feat || feat.name !== featureName) continue;
        const type = typeof feat.type === 'string' ? lookup[feat.type]?.name : undefined;
        return {
            kind: feat.className === 'DReference' ? 'reference' : 'attribute',
            type: typeof type === 'string' ? type : 'EString',
            upperBound: typeof feat.upperBound === 'number' ? feat.upperBound : 1,
        };
    }
    return null;
}
