/**
 * simStateUsage — what a row of the State page is, and what writes and reads it
 * (R-SIM-103, R-SIM-102 in the dialogs, P-2026-10-03-0041;
 * docs/discovery/discovery_2026-10-02_sim_state_ui.md §3).
 *
 * - The row: its kind as nuXmv names it (`VAR`, `DEFINE`, `IVAR`, from
 *   `declarationForm`), its access path (`model.[x]`, `self.[x]`, `node.[x]`),
 *   and E-NODE before Apply: `compileDerived` on the draft, the check the run
 *   makes at Reset (R-SIM-18).
 * - «Written by» and «Read by»: the texts of the bound Guard, Action, Entry and
 *   Exit features on the objects of the models (as the bridge reads them:
 *   `guardTexts`, `siteTexts`), parsed by the engine's own compilers
 *   (`compileGuard`, `compileAction`), and the equations `compileDerived`
 *   compiles. One walk collects the `StateAccess` nodes of an AST.
 *
 * The dialog is authoring: there is no frozen M, so an access is matched by
 * name, the root qualifying it (report §3). `model.[x]` is the model's σ; in a
 * global's equation `self` is the model too and `node` its presentation; any
 * other root (`self`, `event`, a path, a lambda variable) is an element's σ,
 * and `node.[x]` an element's presentation. A defective equation is never
 * evaluated, so it reads nothing here; its row carries the flag if it is E-NODE.
 *
 * Computed on row selection only, never in a selector (report §3: 0.009–0.013
 * ms per full scan on the demo scenes).
 *
 * Pure: no React, no store, no import from the joiner, so it runs under the
 * node test bench (sim/__tests__/simStateUsage.test.ts).
 */

import { compileAction } from '../../../model/simulation/actionEvaluator';
import { compileDerived } from '../../../model/simulation/derivedEvaluator';
import { compileGuard } from '../../../model/simulation/guardEvaluator';
import { objectSlotValues } from '../../../model/simulation/objectSlots';
import { roleValues } from '../../../model/simulation/roleCatalog';
import { STATE_RESERVED } from '../../../jjel/stateReserved';
import { collectModelObjectIds } from './simBridge';
import { declarationForm } from './simInputs';
import type { DeclarationForm } from './simInputs';
import type { StateAttributeDecl } from '../../../model/simulation/netTypes';
import type { StateAttributeRecord } from '../../../model/simulation/stateAttributesCodec';

type Lookup = Record<string, any>;

// ---------------------------------------------------------------------------
// The row
// ---------------------------------------------------------------------------

/** An attribute's kind as nuXmv names it (R-SIM-102). */
export type DeclarationKind = 'VAR' | 'DEFINE' | 'IVAR';

export const DECLARATION_KIND: Readonly<Record<DeclarationForm, DeclarationKind>> = { stored: 'VAR', derived: 'DEFINE', input: 'IVAR' };

export function declarationKind(row: StateAttributeRecord): DeclarationKind {
    return DECLARATION_KIND[declarationForm(row)];
}

/** How an expression reaches the row: `node.[x]` for presentation, `model.[x]` for a global, `self.[x]` otherwise. */
export function stateAccessPath(row: Pick<StateAttributeRecord, 'name' | 'metaclass' | 'space'>): string {
    const root = row.space === 'presentation' ? STATE_RESERVED.presentationRoot : row.metaclass === null ? 'model' : 'self';
    return `${root}.[${row.name}]`;
}

/** A row as `compileDerived` reads it: the equation, the space, the name; the initial is not its business. */
function declOf(row: StateAttributeRecord): StateAttributeDecl {
    return {
        name: row.name, metaclass: row.metaclass, space: row.space, domain: row.domain,
        ...(row.equation !== undefined ? { equation: row.equation } : {}),
        ...(row.input === true ? { input: true as const } : {}),
    };
}

/**
 * E-NODE on its row before Apply (R-SIM-103): the message of every row whose
 * equation `compileDerived` rejects as E-NODE, by row index. `context` are the
 * declarations in scope outside the table (a model's dialog: the metamodel's,
 * `modelDeclarationScope`), whose presentation names count; they are never flagged.
 */
export function stateRowFlags(rows: readonly StateAttributeRecord[], context: readonly StateAttributeRecord[] = []): ReadonlyMap<number, string> {
    const out = new Map<number, string>();
    for (const d of compileDerived([...rows, ...context].map(declOf)).defects) {
        if (d.index !== null && d.index < rows.length && d.code === 'subset' && d.message.startsWith('E-NODE')) out.set(d.index, d.message);
    }
    return out;
}

/**
 * The metamodel's declarations a model's rows leave in scope (R-SIM-94,
 * `mergeDeclarations`): a global of the same name is shadowed, a metaclass
 * attribute never is.
 */
export function modelDeclarationScope(
    rows: readonly StateAttributeRecord[], metamodel: readonly StateAttributeRecord[],
): StateAttributeRecord[] {
    const shadowed = new Set(rows.map(r => r.name));
    return metamodel.filter(d => d.metaclass !== null || !shadowed.has(d.name));
}

// ---------------------------------------------------------------------------
// The walk
// ---------------------------------------------------------------------------

/** The root of an access: one of the reserved four, or a path (a member chain, a lambda variable, a name). */
export type StateRoot = 'model' | 'self' | 'node' | 'event' | 'path';

export interface StateAccessRef {
    readonly attr: string;
    readonly root: StateRoot;
    /** The object as written, `self.target`; `…` for anything but a name or a member chain. */
    readonly via: string;
}

/** A name or a member chain as written; `…` otherwise. */
function written(e: any): string {
    if (e?.type === 'Identifier') return e.name;
    if (e?.type === 'MemberAccess') return `${written(e.object)}.${e.property}`;
    if (e?.type === 'NullSafeMemberAccess') return `${written(e.object)}?.${e.property}`;
    return '…';
}

/** Every `StateAccess` node of an AST (an expression, or an action: target, then value), in pre-order. */
export function stateAccesses(node: unknown, out: StateAccessRef[] = []): StateAccessRef[] {
    if (node === null || typeof node !== 'object') return out;
    if (Array.isArray(node)) {
        for (const x of node) stateAccesses(x, out);
        return out;
    }
    const e = node as Record<string, any>;
    const self = accessOf(e);
    if (self) out.push(self);
    for (const [key, child] of Object.entries(e)) if (key !== 'location') stateAccesses(child, out);
    return out;
}

/** One `StateAccess` node as an access, `null` for any other node. */
function accessOf(e: Record<string, any>): StateAccessRef | null {
    if (e.type !== 'StateAccess' || typeof e.attribute !== 'string') return null;
    const o = e.object;
    const root = o?.type === 'Identifier' && STATE_RESERVED.roots.includes(o.name) ? o.name as StateRoot : 'path';
    return { attr: e.attribute, root, via: written(o) };
}

// ---------------------------------------------------------------------------
// The texts
// ---------------------------------------------------------------------------

export type UsageSite = 'guard' | 'action' | 'entry' | 'exit';

/** One text of a bound feature on one object. */
export interface UsageText {
    /** The model's name, '' when it has none. */
    readonly model: string;
    /** The object's name, its id when it has none. */
    readonly element: string;
    readonly site: UsageSite;
    readonly text: string;
}

/** The M1 models of a metamodel, in lookup order (`modelsOf`, modelMarkings.ts). */
export function metamodelModels(lookup: Lookup, metamodelId: string): string[] {
    const out: string[] = [];
    for (const id in lookup) {
        const m = lookup[id];
        if (m?.className === 'DModel' && m.instanceof === metamodelId) out.push(id);
    }
    return out;
}

const SITE_KEYS: ReadonlyArray<readonly [UsageSite, string]> = [['guard', 'simGuard'], ['action', 'simAction'], ['entry', 'simEntry'], ['exit', 'simExit']];

const nameOf = (lookup: Lookup, id: string) => (typeof lookup[id]?.name === 'string' && lookup[id].name !== '' ? lookup[id].name : id);

/**
 * The texts the run would compile, on the objects of `modelIds`, for the
 * features `bag` binds (a run bag: `runBag`, so a role turned off has no key).
 * A guard is the first value of each Guard feature, blank and `else` left out
 * (`guardTexts`); an action, an entry or an exit is every value (`siteTexts`),
 * blank left out. Objects in lookup order, features in bag order.
 */
export function usageTexts(lookup: Lookup, bag: Readonly<Record<string, unknown>>, modelIds: readonly string[]): UsageText[] {
    const out: UsageText[] = [];
    const sites = SITE_KEYS.map(([site, key]) => [site, roleValues(bag[key])] as const).filter(([, fs]) => fs.length > 0);
    if (sites.length === 0) return out;
    for (const modelId of modelIds) {
        const model = typeof lookup[modelId]?.name === 'string' ? lookup[modelId].name : '';
        for (const id of collectModelObjectIds(lookup, modelId)) {
            const element = nameOf(lookup, id);
            for (const [site, features] of sites) {
                for (const f of features) {
                    const values = objectSlotValues(lookup, id, f);
                    for (const v of site === 'guard' ? values.slice(0, 1) : values) {
                        const text = String(v);
                        if (text.trim() === '' || (site === 'guard' && text.trim() === 'else')) continue;
                        out.push({ model, element, site, text });
                    }
                }
            }
        }
    }
    return out;
}

// ---------------------------------------------------------------------------
// The uses
// ---------------------------------------------------------------------------

/** One access of one text or equation, qualified as the run would resolve its root. */
export interface StateUse {
    readonly attr: string;
    /** The model's state (a global), or an element's. */
    readonly owner: 'model' | 'element';
    readonly space: 'semantic' | 'presentation';
    /** The access as written: `model.[coins]`, `self.target.[visits]`. */
    readonly access: string;
    readonly site: UsageSite | 'equation';
    /** The element whose text it is, or the declaration whose equation it is. */
    readonly by: string;
    /** The model of the text; '' for an equation. */
    readonly model: string;
    /** The source text. */
    readonly text: string;
    readonly write: boolean;
}

/** An access qualified (report §3): in a global's equation `self` and `node` are the model's. */
function qualify(a: StateAccessRef, onModel: boolean): Pick<StateUse, 'owner' | 'space'> {
    if (a.root === 'model') return { owner: 'model', space: 'semantic' };
    if (a.root === 'node') return { owner: onModel ? 'model' : 'element', space: 'presentation' };
    if (a.root === 'self') return { owner: onModel ? 'model' : 'element', space: 'semantic' };
    return { owner: 'element', space: 'semantic' };
}

/**
 * Every write and read of the texts and of the equations of `declarations`
 * (the table's rows, with the declarations in scope beside them). A text that
 * does not parse contributes nothing; a guard or an action with a subset defect
 * still does, since its accesses are written. An equation contributes when
 * `compileDerived` compiles it.
 */
export function stateUses(texts: readonly UsageText[], declarations: readonly StateAttributeRecord[]): StateUse[] {
    const out: StateUse[] = [];
    const push = (a: StateAccessRef, onModel: boolean, rest: Pick<StateUse, 'site' | 'by' | 'model' | 'text' | 'write'>) =>
        out.push({ attr: a.attr, ...qualify(a, onModel), access: `${a.via}.[${a.attr}]`, ...rest });
    for (const t of texts) {
        const rest = { site: t.site, by: t.element, model: t.model, text: t.text };
        if (t.site === 'guard') {
            for (const a of stateAccesses(compileGuard(t.text).expr)) push(a, false, { ...rest, write: false });
            continue;
        }
        const action = compileAction(t.text)?.action;
        if (!action) continue;
        // The target is written; an access inside its path (`model.[cur].[x]`) is read, as the value is.
        const target = accessOf(action.target);
        if (target) push(target, false, { ...rest, write: true });
        for (const a of [...stateAccesses(action.target.object), ...stateAccesses(action.value)]) push(a, false, { ...rest, write: false });
    }
    for (const eq of compileDerived(declarations.map(declOf)).order) {
        const rest = { site: 'equation' as const, by: eq.decl.name, model: '', text: eq.decl.equation ?? '', write: false };
        for (const a of stateAccesses(eq.expr)) push(a, eq.decl.metaclass === null, rest);
    }
    return out;
}

export interface RowUsage {
    readonly written: readonly StateUse[];
    readonly read: readonly StateUse[];
}

/** The uses that name `row`, by name with the owner and the space qualifying it; one per site and element. */
export function rowUsage(uses: readonly StateUse[], row: Pick<StateAttributeRecord, 'name' | 'metaclass' | 'space'>): RowUsage {
    const owner = row.metaclass === null ? 'model' : 'element';
    const seen = new Set<string>();
    const written: StateUse[] = [];
    const read: StateUse[] = [];
    for (const u of uses) {
        if (u.attr !== row.name || u.owner !== owner || u.space !== row.space) continue;
        const key = `${u.write}\u0000${u.site}\u0000${u.model}\u0000${u.by}`;
        if (seen.has(key)) continue;
        seen.add(key);
        (u.write ? written : read).push(u);
    }
    return { written, read };
}

/** `tc action`, `tp guard`, `equation of paid`. */
export function usageLabel(u: StateUse): string {
    return u.site === 'equation' ? `equation of ${u.by}` : `${u.by} ${u.site}`;
}
