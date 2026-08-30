/**
 * shapeDraw — the importless half of the D-graph `ShapeCtx` adapter.
 *
 * Split from `shapeAdapter.ts` for exactly the reason `irReadCtx.ts` is split from
 * `irReadCtxLproxy.ts`, and the split was forced by a test rather than foreseen:
 * `shapeAdapter` imports `store` from the joiner barrel, the barrel reaches monaco,
 * and monaco dereferences `window` at import time, so a unit test that touched any
 * function in that file died at import with `window is not defined` — the same
 * failure the nine already-red suites in this repo die of.
 *
 * Everything here is a pure function of a plain `idlookup` dictionary. `draw` is
 * this codebase's existing word for that (`irReadCtx.makeDrawReadCtx`): the
 * D-layer read directly, without proxies and without the store.
 *
 * The IMPURE half stays next door: `buildMetamodelShape`, which needs
 * `getMetaclassInfo` to walk packages and fold the extends chain, and
 * `makeShapeCtx`, which needs the store.
 *
 * These functions know the D-graph — `className === 'DValue'`, `pointedBy`, the
 * `idlookup.<id>.values.<n>` path form. That is adapter knowledge and it is why
 * none of it lives in `jjform/`, which must stay host-agnostic: `jjform` declares
 * WHAT a shape is, this file knows where jjodel keeps it.
 */

import type { AttrShape, AttrType, EnumShape, IncomingRef, RefShape } from '../../../jjform/shape';
import type { MetaclassAttribute, MetaclassReference } from './useEditorMode';

type Idlookup = Record<string, any>;

/**
 * Type name -> the contract's v0 vocabulary.
 *
 * The primitive names are `widgetForPrimitive`'s switch (`useFormWidgets.ts`),
 * which is itself `Info.value`'s verbatim: one list, read twice, never a third
 * time. `EDate` is classified as `date` here although `widgetForPrimitive`
 * deliberately maps it to a text widget — classification and widget are different
 * questions, and the contract names `date` among its v0 types.
 *
 * Anything unrecognised is `unknown`, NOT `string`: a user-declared datatype is
 * not a string just because nothing better was found, and a renderer told
 * `unknown` falls back to text on purpose rather than by accident.
 */
export function classifyAttrType(typeName: string, isEnum: boolean): AttrType {
    if (isEnum) return 'enum';
    switch (typeName) {
        case 'EString':
        case 'EChar':
            return 'string';
        case 'EInt':
        case 'ELong':
        case 'EShort':
        case 'Byte':
        case 'EFloat':
        case 'EDouble':
            return 'number';
        case 'EBoolean':
            return 'boolean';
        case 'EDate':
            return 'date';
        default:
            return 'unknown';
    }
}

/** `derived` / `readOnly` of a feature, by its D-layer id — hole (b) of the
 *  discovery §2.2. Plain D fields, read the way `useFormWidgets.describeSlot`
 *  reads them off the proxy. An unresolvable feature gets the permissive
 *  defaults the D layer itself declares (`changeable = true`, `derived = false`):
 *  a feature we cannot see is not silently locked. */
export function featureFlags(idlookup: Idlookup, featureId: string): { derived: boolean; readOnly: boolean } {
    const d = idlookup?.[featureId];
    const derived = d?.derived === true;
    return { derived, readOnly: derived || d?.changeable === false };
}

/** The DEnumerator an attribute is typed over, or null — hole (a) of §2.2.
 *  `MetaclassAttribute` carries the type NAME and an `isEnum` flag but not the
 *  type's id, so the literals are unreachable from it; the ATTRIBUTE's id is
 *  carried, and from it `type` leads to the enumerator. */
export function enumeratorOf(idlookup: Idlookup, attrId: string): any | null {
    const attr = idlookup?.[attrId];
    const typeId = typeof attr?.type === 'string' ? attr.type : null;
    if (!typeId) return null;
    const t = idlookup[typeId];
    return t?.className === 'DEnumerator' ? t : null;
}

/** The literals of an enumerator, in declaration order, as `{id, name}` pairs.
 *  Both halves are needed: the editors store an enum slot value as the literal's
 *  POINTER while the XMI importer writes its NAME, and a plain `string[]` could
 *  not tell a reader which convention it was looking at. */
export function enumShapeOf(idlookup: Idlookup, enumerator: any): EnumShape {
    const literals = Array.isArray(enumerator?.literals) ? enumerator.literals : [];
    return {
        id: enumerator?.id,
        name: enumerator?.name,
        literals: literals
            .map((lid: unknown) => (typeof lid === 'string' ? idlookup[lid] : null))
            .filter((l: any) => l && typeof l.name === 'string')
            .map((l: any) => ({ id: l.id, name: l.name })),
    };
}

/** One attribute's shape. Collects its enumeration into `enums` on first sight,
 *  keyed by NAME as `AttrShape.enum` refers to it. */
export function attrShape(
    idlookup: Idlookup,
    a: MetaclassAttribute,
    enums: Record<string, EnumShape>,
): AttrShape {
    const enumerator = a.isEnum ? enumeratorOf(idlookup, a.id) : null;
    if (enumerator && typeof enumerator.name === 'string' && !enums[enumerator.name]) {
        enums[enumerator.name] = enumShapeOf(idlookup, enumerator);
    }

    // `isEnum` is the metamodel's word; `enumerator` is whether it RESOLVED. A
    // flag with no reachable enumeration classifies as unknown rather than as an
    // enum with no literals, which would render an empty select over a live value.
    const isEnum = !!enumerator;
    const flags = featureFlags(idlookup, a.id);
    return {
        key: a.name,
        id: a.id,
        lower: a.lowerBound,
        upper: a.upperBound,
        many: a.upperBound !== 1,
        required: a.lowerBound >= 1,
        derived: flags.derived,
        readOnly: flags.readOnly,
        type: classifyAttrType(a.type, isEnum),
        enum: isEnum ? enumerator.name : undefined,
        typeName: a.type,
    };
}

/** One reference's shape. */
export function refShape(idlookup: Idlookup, r: MetaclassReference): RefShape {
    const flags = featureFlags(idlookup, r.id);
    return {
        key: r.name,
        id: r.id,
        lower: r.lowerBound,
        upper: r.upperBound,
        many: r.upperBound !== 1,
        required: r.lowerBound >= 1,
        derived: flags.derived,
        readOnly: flags.readOnly,
        of: r.targetClassName,
        ofId: r.targetClassId,
        composition: r.containment,
    };
}

/** `idlookup.<id>.values` and `idlookup.<id>.values.<n>` — the only `pointedBy`
 *  sources that mean "someone's slot points here". Measured 2026-08-30 on the
 *  RowViewSmoke fixture (`scripts/smoke/_tmp_pointedby.ts`): the same array also
 *  carries `.father`, `.instances`, `.objects`, `.model` and a bare `objects`
 *  with no prefix at all, none of which are references. Anchored at both ends so
 *  a longer path cannot slip through. */
const VALUE_POINTER = /^idlookup\.([^.]+)\.values(?:\.(\d+))?$/;

/**
 * Every pointer aimed at an instance — hole (c) of §2.2, and the input of the
 * delete preflight (12d).
 *
 * `pointedBy` is maintained unconditionally by the reducer for every pointer
 * value (`reducer.ts:395`), so this is an INDEX LOOKUP, not a scan of the model:
 * the cost is the length of one array, whatever the size of the project.
 *
 * The entry is a PATH, not an id, which is why this is a walk at all: from the
 * DValue the path names, `father` gives the pointing DObject and `instanceof`
 * gives the DReference whose name a person reads. It is the exact inverse of
 * `findFeatureRaw` (`irReadCtx.ts`), which goes from an object and a feature name
 * down to the slot.
 *
 * Entries whose DValue no longer resolves are DROPPED rather than reported as
 * unknown: a stale `pointedBy` is bookkeeping, and a delete dialogue listing
 * ghosts would be worse than one listing nothing.
 */
export function referencedBy(idlookup: Idlookup, instanceId: string): IncomingRef[] {
    const entries = idlookup?.[instanceId]?.pointedBy;
    if (!Array.isArray(entries)) return [];

    const out: IncomingRef[] = [];
    for (const entry of entries) {
        const m = VALUE_POINTER.exec(String(entry?.source ?? ''));
        if (!m) continue;
        const slot = idlookup[m[1]];
        if (slot?.className !== 'DValue') continue;

        const owner = idlookup[slot.father];
        if (owner?.className !== 'DObject') continue;
        const feature = idlookup[slot.instanceof];
        if (!feature) continue;

        out.push({
            instanceId: owner.id,
            instanceName: owner.name ?? owner.initialName ?? '',
            instanceClass: idlookup[owner.instanceof]?.name ?? '',
            featureKey: feature.name ?? '',
            featureId: feature.id,
            composition: feature.composition === true,
            index: m[2] === undefined ? 0 : Number(m[2]),
        });
    }

    // Stable order: pointing instance, then feature, then position.
    out.sort((a, b) =>
        a.instanceName !== b.instanceName ? (a.instanceName < b.instanceName ? -1 : 1)
        : a.featureKey !== b.featureKey ? (a.featureKey < b.featureKey ? -1 : 1)
        : a.index - b.index);
    return out;
}
