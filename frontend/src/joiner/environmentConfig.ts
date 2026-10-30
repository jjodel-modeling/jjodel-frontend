/**
 * environmentConfig — pure read + permission helpers for the #157 stand-alone environments
 * (see docs/discovery/discovery_2026-09-23_157_standalone_configurator.md).
 *
 * ZERO imports on purpose. `joiner/classes.ts` is not importable in the vitest bench
 * (`window is not defined`, like nine other suites — see CLAUDE.md §5), so the logic that
 * must be tested lives here and operates on a plain `idlookup` object, exactly the way
 * `components/abstract/tabs/instanceManagerModel.ts` does. The impure half (resolving the
 * store, creating the entity via `.new()`) stays in `classes.ts` on the D-class statics.
 *
 * The config is a `DEnvironmentConfig` entity whose `father` is the owning project (a
 * back-pointer, so `DProject` gains no field). A project's config is found by scanning
 * `idlookup` for `className === 'DEnvironmentConfig' && father === projectId`.
 *
 * A **profile** (role) restricts which top-level types a stand-alone viewer sees/edits.
 * Named "profile" throughout; the legacy className/field name "DRole"/"roles" (from the
 * Fase 0b draft) is still accepted on read so profiles created before the rename survive.
 */

/** Per-metaclass permission for a profile. Absent override in the profile = {@link DEFAULT_TYPE_PERMISSION}. */
export type EnvPermission = 'hidden' | 'read' | 'edit';

/** No override recorded on the profile means the type is fully editable. */
export const DEFAULT_TYPE_PERMISSION: EnvPermission = 'edit';

/** The D-layer className of the config entity (kept here so the pure scan needs no import). */
export const ENVIRONMENT_CONFIG_CLASSNAME = 'DEnvironmentConfig';
/** The D-layer className of a profile entity. */
export const PROFILE_CLASSNAME = 'DProfile';
/** Legacy className accepted on read (profiles authored before the role→profile rename). */
export const LEGACY_PROFILE_CLASSNAME = 'DRole';

type Idlookup = Record<string, any>;

function isProfile(e: any): boolean {
    return !!e && (e.className === PROFILE_CLASSNAME || e.className === LEGACY_PROFILE_CLASSNAME);
}

/**
 * The `DEnvironmentConfig` owned by `projectId` (`father === projectId`), or null.
 * Total on the empty/absent cases: a project with no config yet reads as null, never throws.
 */
export function findEnvironmentConfig(idlookup: Idlookup, projectId: string): any | null {
    if (!idlookup || !projectId) return null;
    for (const k in idlookup) {
        const e = idlookup[k];
        if (e && e.className === ENVIRONMENT_CONFIG_CLASSNAME && e.father === projectId) return e;
    }
    return null;
}

/** The profile with the given id, or null when the id is absent or points at another entity. */
export function findProfile(idlookup: Idlookup, profileId: string | null | undefined): any | null {
    if (!idlookup || !profileId) return null;
    const e = idlookup[profileId];
    return isProfile(e) ? e : null;
}

/** The ids of a config's profiles, tolerating the legacy `roles` field name. */
export function profileIdsOf(config: any | null | undefined): string[] {
    if (!config) return [];
    const raw = Array.isArray(config.profiles) ? config.profiles
        : Array.isArray(config.roles) ? config.roles
        : [];
    return raw as string[];
}

/** The resolved profile objects of a config, in stored order, skipping dangling ids. */
export function profilesOfConfig(idlookup: Idlookup, config: any | null | undefined): any[] {
    return profileIdsOf(config)
        .map((id) => findProfile(idlookup, id))
        .filter(Boolean);
}

/**
 * Effective permission of a metaclass for a profile. A null/undefined profile (e.g. the
 * language developer, no `?profile` in the URL) is unrestricted; an absent override is 'edit'.
 */
export function resolveTypePermission(profile: any | null | undefined, metaclassId: string): EnvPermission {
    if (!profile) return DEFAULT_TYPE_PERMISSION;
    const perms = profile.typePermissions;
    const p = perms ? perms[metaclassId] : undefined;
    return (p === 'hidden' || p === 'read' || p === 'edit') ? p : DEFAULT_TYPE_PERMISSION;
}

/** A metaclass is visible to a profile unless the profile marks it 'hidden'. */
export function isTypeVisible(profile: any | null | undefined, metaclassId: string): boolean {
    return resolveTypePermission(profile, metaclassId) !== 'hidden';
}

/** A metaclass is editable (create/modify) only when the profile grants 'edit' (the default). */
export function isTypeEditable(profile: any | null | undefined, metaclassId: string): boolean {
    return resolveTypePermission(profile, metaclassId) === 'edit';
}

/**
 * The config's ordered top-level metaclass pointers, filtered to those visible to `profile`.
 * Order is preserved (the developer's ordering is the top-bar order). A null config yields [].
 */
export function visibleTopLevelTypes(config: any | null | undefined, profile: any | null | undefined): string[] {
    const types: string[] = (config && Array.isArray(config.topLevelTypes)) ? config.topLevelTypes : [];
    return types.filter((id) => isTypeVisible(profile, id));
}

/**
 * The metamodel (an M2 `DModel`) a metaclass belongs to, by walking `father` up to the first
 * `DModel` — a class sits under a package, possibly nested, and the package under the model.
 * Null when the chain breaks (a class not in the store yet, a corrupt father). `depthCap` is a
 * cycle belt, not a semantic limit.
 */
export function metamodelOfClass(idlookup: Idlookup, classId: string, depthCap = 64): string | null {
    if (!idlookup || !classId) return null;
    let current = idlookup[classId];
    for (let i = 0; i < depthCap && current; i++) {
        if (current.className === 'DModel') return typeof current.id === 'string' ? current.id : null;
        if (typeof current.father !== 'string') return null;
        current = idlookup[current.father];
    }
    return null;
}

/**
 * The models, among `modelIds`, a metaclass can be instantiated in: the M1 models whose
 * `instanceof` is the class's metamodel, in the order given (the project's order).
 *
 * #157, field test of 2026-09-29: the Configurator used the project's FIRST model for every
 * type, so a type of any other metamodel could not be created (the class is resolved by name
 * inside the model's own metamodel) and its instances never listed. An M1 offers the classes
 * of its own metamodel only, so the model has to be chosen per type. Empty when the project
 * has no model of that metamodel yet.
 */
export function modelsForType(idlookup: Idlookup, modelIds: readonly string[], classId: string): string[] {
    const mm = metamodelOfClass(idlookup, classId);
    if (!mm) return [];
    return (modelIds ?? []).filter((id) => idlookup[id]?.className === 'DModel' && idlookup[id].instanceof === mm);
}

/**
 * Why a metaclass cannot be a top-level type of the Configurator — created on its own at the
 * model root — or null when it can (#157 R3).
 *
 * Reads the class as the L-layer reports it, so a proxy (`LClass`) or a plain object of the same
 * shape both work, and the module keeps its zero imports. The rule is the core's own
 * `LClass.rootable` (`LModelElement.tsx` `get_rootable`): the metamodel's explicit choice when
 * set, otherwise not abstract, not interface, not singleton and not the target of a composition.
 * The other fields only explain a `false`. Measured on 2026-10-01: without this gate «New» on a
 * composed class created a part at the model root, and on an abstract class an abstract instance.
 */
export function topLevelReason(cls: any): string | null {
    if (!cls) return 'unknown metaclass';
    if (cls.rootable) return null;
    if (cls.abstract || cls.interface) return 'abstract, it has no instances of its own';
    const owners: string[] = [];
    for (const r of ((cls.isComposedBy ?? []) as any[])) {
        const name = r?.father?.name;
        if (typeof name === 'string' && name && !owners.includes(name)) owners.push(name);
    }
    if (owners.length) return `created inside ${owners.join(', ')}`;
    if (cls.isSingleton) return 'a singleton';
    return 'not allowed at the model root by its metamodel';
}

/** The reason a profile's delete is refused when it would take with it an element the profile
 *  cannot change. Names no type: one of them may be hidden. */
export const CASCADE_LOCKED_REASON = "It contains elements you can't change with this profile, so it can't be deleted here.";

/**
 * A delete preflight as a profile may see it (#157, 2026-10-04): what the Configurator's
 * confirmation shows and what its plan writes.
 *
 * Measured on `705502f0f`: the confirmation offered a delete that took read and hidden contained
 * elements with it, and named the hidden ones. So:
 * - `blocked` gets {@link CASCADE_LOCKED_REASON} when a descendant is not `edit` (a reason
 *   already there wins: the singleton's comes from the metamodel);
 * - descendants and referrers of a `hidden` type leave the lists. A hidden referrer is therefore
 *   neither reassigned nor cleared by the plan; the core's delete still removes its pointer;
 * - `canReassign` holds only while a referrer is left to reassign.
 *
 * Generic over the entries, so this module keeps its zero imports; the caller spreads the
 * answer over its preflight. `permissionOfInstance` is the profile's rule on the instance's
 * exact class, as everywhere in the Configurator.
 */
export function restrictDeleteForProfile<D extends { id: string }, R extends { instanceId: string }>(
    pre: { blocked: string | null; canReassign: boolean; descendants: D[]; referencedBy: R[] },
    permissionOfInstance: (instanceId: string) => EnvPermission,
): { blocked: string | null; canReassign: boolean; descendants: D[]; referencedBy: R[] } {
    const locked = pre.descendants.some((d) => permissionOfInstance(d.id) !== 'edit');
    const referencedBy = pre.referencedBy.filter((r) => permissionOfInstance(r.instanceId) !== 'hidden');
    return {
        blocked: pre.blocked ?? (locked ? CASCADE_LOCKED_REASON : null),
        canReassign: pre.canReassign && referencedBy.length > 0,
        descendants: pre.descendants.filter((d) => permissionOfInstance(d.id) !== 'hidden'),
        referencedBy,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// #186 «Customize element» (P-2026-10-17-1053, R-CFG-3): the per-role presentation of a type.
//
// A profile may carry `typePresentation`, keyed by metaclass id, created at the first «Done» of the
// popup and absent until then: absent reads as empty, so no migration. Per feature of the type it
// holds a widget of the role's own vocabulary (not the IR's `WidgetKind`, which is persisted and
// definitive under R-B9), a label, whether the type is shown in the title, and CSS declarations for
// the field or, on a component, for its card and its separators. The CSS is stored as the kept
// declarations and filtered again at render (`sanitizeDeclarations`): a hand-edited or imported
// project gets the same filter as the popup.
// ─────────────────────────────────────────────────────────────────────────────

/** The role's widget vocabulary. Persisted identifiers: never renamed. Absent = what the panel
 *  renders without a presentation («Default»). */
export type RoleWidget = 'input' | 'textarea' | 'dropdown' | 'stepper' | 'number-input' | 'number-dropdown';

const ROLE_WIDGET_IDS: readonly RoleWidget[] = ['input', 'textarea', 'dropdown', 'stepper', 'number-input', 'number-dropdown'];

/** One of the six identifiers, and nothing else. */
export function isRoleWidget(v: unknown): v is RoleWidget {
    return typeof v === 'string' && (ROLE_WIDGET_IDS as readonly string[]).includes(v);
}

/** How the role sees one feature of a type. Every key optional: absent means the default. */
export interface FieldPresentation {
    widget?: RoleWidget;
    /** The list of the two dropdowns, one option per entry. */
    options?: string[];
    /** The string dropdown's «Other:» free entry. */
    allowOther?: boolean;
    label?: string;
    /** `false` drops `[Type]` from the title («isTypeShown»); absent shows it. */
    showType?: boolean;
    /** CSS declarations of the field (or of a component's title and box). */
    style?: string;
    /** Components only: the card of each element. */
    cardStyle?: string;
    /** Components only: the separators between its entries («interline»). */
    lineStyle?: string;
}

/** The presentation of one type for one role: per feature name. */
export interface TypePresentation {
    fields?: Record<string, FieldPresentation>;
}

function isPlainObject(v: unknown): v is Record<string, any> {
    return !!v && typeof v === 'object' && !Array.isArray(v);
}

/** The presentation of a metaclass for a profile, or null: no profile (the developer), no field,
 *  no entry for the class, or malformed data. Never throws. */
export function typePresentationOf(profile: any | null | undefined, classId: string): TypePresentation | null {
    const all = profile?.typePresentation;
    if (!isPlainObject(all)) return null;
    const entry = all[classId];
    return isPlainObject(entry) ? (entry as TypePresentation) : null;
}

/** The presentation of one feature inside a type's presentation, or null. */
export function fieldPresentationOf(tp: TypePresentation | null | undefined, featureName: string): FieldPresentation | null {
    const fields = tp?.fields;
    if (!isPlainObject(fields)) return null;
    const f = fields[featureName];
    return isPlainObject(f) ? (f as FieldPresentation) : null;
}

const STRING_WIDGETS: readonly RoleWidget[] = ['input', 'textarea', 'dropdown'];
const NUMBER_WIDGETS: readonly RoleWidget[] = ['stepper', 'number-input', 'number-dropdown'];
/** The numeric types the form renders with its number widget (`widgetForPrimitive`). `EByte` is not
 *  among them: there it derives a text field, so a numeric choice could not render. */
const NUMBER_TYPE_NAMES: ReadonlySet<string> = new Set(['EInt', 'ELong', 'EShort', 'EFloat', 'EDouble']);

/**
 * The widgets a role may choose for an attribute, the default rendering first. A choice that cannot
 * render is not offered: an enum keeps the select its metamodel defines, a boolean its checkbox, a
 * multi-valued attribute its chip input, a read-only field no control at all, and any other datatype
 * the widget it has today. An empty list means «no choice».
 */
export function widgetChoicesFor(f: { typeName: string; isEnum: boolean; isMultivalued: boolean; isReadOnly?: boolean }): RoleWidget[] {
    if (f.isEnum || f.isMultivalued || f.isReadOnly) return [];
    if (f.typeName === 'EString') return [...STRING_WIDGETS];
    if (NUMBER_TYPE_NAMES.has(f.typeName)) return [...NUMBER_WIDGETS];
    return [];
}

// ── The CSS of a presentation ────────────────────────────────────────────────

export const MAX_STYLE_DECLARATIONS = 40;
export const MAX_STYLE_LENGTH = 2000;

/** What `sanitizeDeclarations` keeps and what it drops. */
export interface SanitizedStyle {
    /** For React's `style`: camelCase keys. */
    style: Record<string, string>;
    /** The kept declarations, `prop: value;` one per line: what is stored. */
    text: string;
    dropped: Array<{ declaration: string; reason: string }>;
}

const BLOCKED_PROPERTIES: ReadonlySet<string> = new Set(['behavior', '-moz-binding']);
/** Parts of a value that load a resource, run code, or would close the declaration. */
const BLOCKED_VALUE_PARTS: readonly string[] = [
    'url(', 'image(', 'image-set(', 'cross-fade(', 'element(', 'expression(', 'javascript:',
    '@', '\\', '{', '}', '<', '>',
];
/** `fixed`, `absolute` and `sticky` lift a field out of its box, over the controls around it. */
const KEPT_POSITIONS: ReadonlySet<string> = new Set(['static', 'relative']);
const PROPERTY_NAME = /^-?[a-zA-Z][a-zA-Z0-9-]*$/;

/** Split on `;` and newlines outside quotes and parentheses. */
function splitDeclarations(text: string): string[] {
    const out: string[] = [];
    let cur = '';
    let depth = 0;
    let quote: string | null = null;
    for (const ch of text) {
        if (quote) {
            cur += ch;
            if (ch === quote) quote = null;
            continue;
        }
        if (ch === '"' || ch === "'") quote = ch;
        else if (ch === '(') depth++;
        else if (ch === ')') depth = Math.max(0, depth - 1);
        else if ((ch === ';' || ch === '\n') && depth === 0) {
            out.push(cur);
            cur = '';
            continue;
        }
        cur += ch;
    }
    out.push(cur);
    return out.map((s) => s.trim()).filter(Boolean);
}

/** A property name as CSS spells it: `fontWeight` → `font-weight`, `WebkitX` → `-webkit-x`, `msX` → `-ms-x`. */
function toKebab(prop: string): string {
    const kebab = prop.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()).toLowerCase();
    return kebab.startsWith('ms-') ? '-' + kebab : kebab;
}

/** The key React's `style` takes: `font-weight` → `fontWeight`, `-webkit-x` → `WebkitX`, `-ms-x` → `msX`. */
function toReactKey(kebab: string): string {
    const vendor = kebab.startsWith('-');
    const camel = (vendor ? kebab.slice(1) : kebab).replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
    if (!vendor || camel.startsWith('ms')) return camel;
    return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function declarationsText(kept: ReadonlyMap<string, string>): string {
    return Array.from(kept, ([k, v]) => `${k}: ${v};`).join('\n');
}

/**
 * The author's CSS declarations, filtered: property declarations only, applied inline by the panel,
 * so nothing can reach outside the element it is set on. Dropped, each with its reason: what is not a
 * declaration, a custom property (it would override the design tokens under the element), `behavior`
 * and `-moz-binding`, a value that loads a resource or runs code (`url(`, `image(`, `image-set(`,
 * `cross-fade(`, `element(`, `expression(`, `javascript:`), a value with `@`, a backslash, a brace or an
 * angle bracket, `position` other than `static` or `relative`, and what exceeds
 * {@link MAX_STYLE_DECLARATIONS} declarations or {@link MAX_STYLE_LENGTH} characters. `!important` is
 * stripped (an inline style object cannot carry it); a later declaration of a property wins.
 * Property names are accepted in kebab-case and camelCase. Total: a non-string reads as empty.
 */
export function sanitizeDeclarations(text: unknown): SanitizedStyle {
    const dropped: SanitizedStyle['dropped'] = [];
    const kept = new Map<string, string>();
    if (typeof text !== 'string') return { style: {}, text: '', dropped };
    const source = text.replace(/\/\*[\s\S]*?(\*\/|$)/g, '');
    for (const declaration of splitDeclarations(source)) {
        const drop = (reason: string) => { dropped.push({ declaration, reason }); };
        const colon = declaration.indexOf(':');
        if (colon < 0) { drop('not a declaration'); continue; }
        const prop = declaration.slice(0, colon).trim();
        if (prop.startsWith('--')) { drop('custom properties are not allowed'); continue; }
        if (!PROPERTY_NAME.test(prop)) { drop('not a property name'); continue; }
        const name = toKebab(prop);
        if (BLOCKED_PROPERTIES.has(name)) { drop(`${name} is not allowed`); continue; }
        const value = declaration.slice(colon + 1).replace(/\s*!\s*important\s*$/i, '').trim();
        if (!value) { drop('empty value'); continue; }
        const lower = value.toLowerCase();
        const blocked = BLOCKED_VALUE_PARTS.find((part) => lower.includes(part));
        if (blocked) { drop(`contains ${blocked}`); continue; }
        if (name === 'position' && !KEPT_POSITIONS.has(lower)) { drop(`position: ${lower} is not allowed`); continue; }
        if (!kept.has(name) && kept.size >= MAX_STYLE_DECLARATIONS) { drop(`over the limit of ${MAX_STYLE_DECLARATIONS} declarations`); continue; }
        const tentative = new Map(kept).set(name, value);
        if (declarationsText(tentative).length > MAX_STYLE_LENGTH) { drop(`over the limit of ${MAX_STYLE_LENGTH} characters`); continue; }
        kept.set(name, value);
    }
    const style: Record<string, string> = {};
    for (const [k, v] of kept) style[toReactKey(k)] = v;
    return { style, text: declarationsText(kept), dropped };
}

/** The text properties the panel lets reach the title and the control of a field, in this order. */
const TEXT_STYLE_PROPERTIES: readonly string[] = [
    'color', 'font-family', 'font-size', 'font-style', 'font-weight', 'letter-spacing', 'text-decoration', 'text-transform',
];
const FONT_SHORTHAND_PARTS: readonly string[] = ['font-family', 'font-size', 'font-style', 'font-weight'];

/** The text properties a style object declares (`font` stands for its four parts), for the panel's
 *  scoped rule that lets exactly those reach the title and the control of the field. */
export function textPropsOf(style: Record<string, string> | null | undefined): string[] {
    const declared = new Set<string>();
    for (const key of Object.keys(style ?? {})) {
        const name = toKebab(key);
        if (name === 'font') FONT_SHORTHAND_PARTS.forEach((p) => declared.add(p));
        else declared.add(name);
    }
    return TEXT_STYLE_PROPERTIES.filter((p) => declared.has(p));
}

// ── The dropdowns' lists ─────────────────────────────────────────────────────

const MAX_DROPDOWN_OPTIONS = 200;
const NUMBER_LITERAL = /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/;

function optionsOf(lines: readonly unknown[], numeric: boolean): { options: string[]; dropped: string[] } {
    const options: string[] = [];
    const dropped: string[] = [];
    for (const raw of lines) {
        if (typeof raw !== 'string') continue;
        const line = raw.trim();
        if (!line) continue;
        let option = line;
        if (numeric) {
            if (!NUMBER_LITERAL.test(line)) { dropped.push(line); continue; }
            option = String(Number(line));
        }
        if (options.includes(option)) continue;
        if (options.length >= MAX_DROPDOWN_OPTIONS) { dropped.push(line); continue; }
        options.push(option);
    }
    return { options, dropped };
}

/** A dropdown's list as the popup takes it: one option per line, trimmed, no empty line, no
 *  duplicate, at most 200. `numeric`: decimal numbers only, normalized (`05` → `5`), the rest
 *  reported. */
export function parseOptionList(text: unknown, numeric: boolean): { options: string[]; dropped: string[] } {
    if (typeof text !== 'string') return { options: [], dropped: [] };
    return optionsOf(text.split('\n'), numeric);
}

// ── What «Done» writes ───────────────────────────────────────────────────────

function cleanField(f: unknown): FieldPresentation | null {
    if (!isPlainObject(f)) return null;
    const out: FieldPresentation = {};
    if (isRoleWidget(f.widget)) out.widget = f.widget;
    if ((out.widget === 'dropdown' || out.widget === 'number-dropdown') && Array.isArray(f.options)) {
        const { options } = optionsOf(f.options, out.widget === 'number-dropdown');
        if (options.length) out.options = options;
    }
    if (out.widget === 'dropdown' && f.allowOther === true) out.allowOther = true;
    if (typeof f.label === 'string' && f.label.trim()) out.label = f.label.trim();
    if (f.showType === false) out.showType = false;
    for (const key of ['style', 'cardStyle', 'lineStyle'] as const) {
        const text = sanitizeDeclarations(f[key]).text;
        if (text) out[key] = text;
    }
    return Object.keys(out).length ? out : null;
}

/** A type's presentation reduced to what means something: an unknown widget, the list or «Other» of
 *  a widget that is not a dropdown, an empty label, `showType: true`, the dropped CSS and the entries
 *  left empty go. Null when nothing is left. The input is not changed. */
export function cleanTypePresentation(p: unknown): TypePresentation | null {
    if (!isPlainObject(p) || !isPlainObject(p.fields)) return null;
    const fields: Record<string, FieldPresentation> = {};
    for (const [name, f] of Object.entries(p.fields)) {
        const clean = cleanField(f);
        if (clean) fields[name] = clean;
    }
    return Object.keys(fields).length ? { fields } : null;
}

/** JSON with sorted keys: two presentations equal but for their key order compare equal. */
function canonical(v: unknown): string {
    if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
    if (isPlainObject(v)) return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(',')}}`;
    return JSON.stringify(v ?? null);
}

/**
 * The profile's whole `typePresentation` after «Done» on one class: the draft, cleaned, replaces the
 * class's entry, and an entry left empty removes the key (a write replaces the dictionary, it does not
 * merge into it, measured in the Phase 1 report §4.1). `changed` is false when the cleaned draft
 * equals the cleaned stored entry: the popup then writes nothing. Malformed data starts from nothing,
 * and a malformed entry of another class is not carried over. The input is not changed.
 */
export function nextTypePresentations(all: unknown, classId: string, draft: unknown): { next: Record<string, TypePresentation>; changed: boolean } {
    const next: Record<string, TypePresentation> = {};
    if (isPlainObject(all)) {
        for (const [k, v] of Object.entries(all)) if (isPlainObject(v)) next[k] = v as TypePresentation;
    }
    const stored = cleanTypePresentation(next[classId]);
    const entry = cleanTypePresentation(draft);
    if (entry) next[classId] = entry;
    else delete next[classId];
    return { next, changed: canonical(stored) !== canonical(entry) };
}
