import { describe, it, expect } from 'vitest';
import {
    findEnvironmentConfig,
    findProfile,
    profileIdsOf,
    profilesOfConfig,
    resolveTypePermission,
    isTypeVisible,
    isTypeEditable,
    visibleTopLevelTypes,
    DEFAULT_TYPE_PERMISSION,
    metamodelOfClass,
    modelsForType,
    topLevelReason,
    restrictDeleteForProfile,
    CASCADE_LOCKED_REASON,
    typePresentationOf,
    fieldPresentationOf,
    widgetChoicesFor,
    isRoleWidget,
    sanitizeDeclarations,
    textPropsOf,
    parseOptionList,
    cleanTypePresentation,
    nextTypePresentations,
    MAX_STYLE_DECLARATIONS,
    MAX_STYLE_LENGTH,
} from '../environmentConfig';

// A plain idlookup, the shape the store persists — no D-layer classes, so this suite
// imports the pure module only (classes.ts dies on `window is not defined`, CLAUDE.md §5).
function fixture() {
    const cfg1 = {
        className: 'DEnvironmentConfig',
        father: 'proj1',
        topLevelTypes: ['C1', 'C2', 'C3'],
        profiles: ['p1'],
    };
    const p1 = {
        className: 'DProfile',
        father: 'cfg1',
        name: 'educator',
        typePermissions: { C1: 'read', C2: 'hidden' },
    };
    const idlookup: Record<string, any> = {
        cfg1,
        p1,
        proj1: { className: 'DProject' },
        other: { className: 'DModel' },
    };
    return { idlookup, cfg1, p1 };
}

describe('findEnvironmentConfig', () => {
    it('finds the config owned by the project (father === projectId)', () => {
        const { idlookup, cfg1 } = fixture();
        expect(findEnvironmentConfig(idlookup, 'proj1')).toBe(cfg1);
    });
    it('returns null for a project with no config', () => {
        const { idlookup } = fixture();
        expect(findEnvironmentConfig(idlookup, 'projX')).toBeNull();
    });
    it('is total on empty inputs', () => {
        const { idlookup } = fixture();
        expect(findEnvironmentConfig({}, 'proj1')).toBeNull();
        expect(findEnvironmentConfig(idlookup, '')).toBeNull();
        expect(findEnvironmentConfig(null as any, 'proj1')).toBeNull();
    });
});

describe('findProfile', () => {
    it('finds a profile by id', () => {
        const { idlookup, p1 } = fixture();
        expect(findProfile(idlookup, 'p1')).toBe(p1);
    });
    it('accepts the legacy DRole className', () => {
        const idlookup: Record<string, any> = { r1: { className: 'DRole', name: 'legacy' } };
        expect(findProfile(idlookup, 'r1')).toBe(idlookup.r1);
    });
    it('rejects an id that points at a non-profile entity', () => {
        const { idlookup } = fixture();
        expect(findProfile(idlookup, 'cfg1')).toBeNull();
        expect(findProfile(idlookup, 'proj1')).toBeNull();
    });
    it('is total on absent id', () => {
        const { idlookup } = fixture();
        expect(findProfile(idlookup, undefined)).toBeNull();
        expect(findProfile(idlookup, null)).toBeNull();
    });
});

describe('profileIdsOf / profilesOfConfig', () => {
    it('reads the profiles array', () => {
        const { cfg1 } = fixture();
        expect(profileIdsOf(cfg1)).toEqual(['p1']);
    });
    it('tolerates the legacy `roles` field name', () => {
        expect(profileIdsOf({ roles: ['r1', 'r2'] })).toEqual(['r1', 'r2']);
    });
    it('resolves objects in order and skips dangling ids', () => {
        const { idlookup, p1 } = fixture();
        (idlookup.cfg1 as any).profiles = ['p1', 'ghost'];
        expect(profilesOfConfig(idlookup, idlookup.cfg1)).toEqual([p1]);
    });
    it('is total on null config', () => {
        expect(profileIdsOf(null)).toEqual([]);
        expect(profilesOfConfig({}, null)).toEqual([]);
    });
});

describe('resolveTypePermission', () => {
    it('reads explicit overrides', () => {
        const { p1 } = fixture();
        expect(resolveTypePermission(p1, 'C1')).toBe('read');
        expect(resolveTypePermission(p1, 'C2')).toBe('hidden');
    });
    it('defaults to edit for an absent override', () => {
        const { p1 } = fixture();
        expect(resolveTypePermission(p1, 'C3')).toBe('edit');
    });
    it('a null/empty profile is unrestricted (edit)', () => {
        expect(resolveTypePermission(null, 'C1')).toBe('edit');
        expect(resolveTypePermission(undefined, 'C1')).toBe('edit');
        expect(resolveTypePermission({}, 'C1')).toBe('edit');
    });
    it('falls back to edit on a malformed override value', () => {
        expect(resolveTypePermission({ typePermissions: { C1: 'garbage' } }, 'C1')).toBe('edit');
    });
});

describe('isTypeVisible / isTypeEditable', () => {
    it('visible unless hidden', () => {
        const { p1 } = fixture();
        expect(isTypeVisible(p1, 'C1')).toBe(true); // read
        expect(isTypeVisible(p1, 'C2')).toBe(false); // hidden
        expect(isTypeVisible(p1, 'C3')).toBe(true); // default edit
        expect(isTypeVisible(null, 'C2')).toBe(true);
    });
    it('editable only when edit', () => {
        const { p1 } = fixture();
        expect(isTypeEditable(p1, 'C1')).toBe(false); // read
        expect(isTypeEditable(p1, 'C3')).toBe(true); // default edit
        expect(isTypeEditable(null, 'Cx')).toBe(true);
    });
});

describe('visibleTopLevelTypes', () => {
    it('filters hidden types and preserves order', () => {
        const { cfg1, p1 } = fixture();
        expect(visibleTopLevelTypes(cfg1, p1)).toEqual(['C1', 'C3']);
    });
    it('a null profile sees every top-level type', () => {
        const { cfg1 } = fixture();
        expect(visibleTopLevelTypes(cfg1, null)).toEqual(['C1', 'C2', 'C3']);
    });
    it('a null config yields no types', () => {
        const { p1 } = fixture();
        expect(visibleTopLevelTypes(null, p1)).toEqual([]);
    });
});

describe('defaults', () => {
    it('the default type permission is edit', () => {
        expect(DEFAULT_TYPE_PERMISSION).toBe('edit');
    });
});

// #157, field test 2026-09-29 («AIM Pro»): two metamodels, a model of only one of them.
function multiModelFixture() {
    const idlookup: Record<string, any> = {
        mmScenario: { className: 'DModel', id: 'mmScenario', isMetamodel: true },
        mmEducators: { className: 'DModel', id: 'mmEducators', isMetamodel: true },
        pkgS: { className: 'DPackage', id: 'pkgS', father: 'mmScenario' },
        pkgE: { className: 'DPackage', id: 'pkgE', father: 'mmEducators' },
        pkgE2: { className: 'DPackage', id: 'pkgE2', father: 'pkgE' },
        Scenario: { className: 'DClass', id: 'Scenario', father: 'pkgS' },
        Educator: { className: 'DClass', id: 'Educator', father: 'pkgE' },
        Nested: { className: 'DClass', id: 'Nested', father: 'pkgE2' },
        learningphase: { className: 'DModel', id: 'learningphase', isMetamodel: false, instanceof: 'mmScenario' },
        scenario2: { className: 'DModel', id: 'scenario2', isMetamodel: false, instanceof: 'mmScenario' },
    };
    return idlookup;
}

describe('metamodelOfClass', () => {
    it('walks the package chain up to the metamodel, nested packages included', () => {
        const idlookup = multiModelFixture();
        expect(metamodelOfClass(idlookup, 'Scenario')).toBe('mmScenario');
        expect(metamodelOfClass(idlookup, 'Nested')).toBe('mmEducators');
    });
    it('is null for an unknown class or a broken chain', () => {
        const idlookup = multiModelFixture();
        expect(metamodelOfClass(idlookup, 'nope')).toBeNull();
        idlookup.Orphan = { className: 'DClass', id: 'Orphan', father: 'gone' };
        expect(metamodelOfClass(idlookup, 'Orphan')).toBeNull();
    });
});

describe('modelsForType', () => {
    it('keeps only the models of the class\'s metamodel, in project order', () => {
        const idlookup = multiModelFixture();
        const models = ['learningphase', 'scenario2'];
        expect(modelsForType(idlookup, models, 'Scenario')).toEqual(['learningphase', 'scenario2']);
        expect(modelsForType(idlookup, ['scenario2', 'learningphase'], 'Scenario')).toEqual(['scenario2', 'learningphase']);
    });
    it('is empty for a type whose metamodel has no model — not the first model of the project', () => {
        const idlookup = multiModelFixture();
        expect(modelsForType(idlookup, ['learningphase', 'scenario2'], 'Educator')).toEqual([]);
    });
    it('finds the model once the project has one', () => {
        const idlookup = multiModelFixture();
        idlookup.educators1 = { className: 'DModel', id: 'educators1', isMetamodel: false, instanceof: 'mmEducators' };
        expect(modelsForType(idlookup, ['learningphase', 'educators1'], 'Educator')).toEqual(['educators1']);
        expect(modelsForType(idlookup, ['learningphase', 'educators1'], 'Nested')).toEqual(['educators1']);
    });
});

// #157 R3 — the class as the L-layer reports it (LClass.rootable and the flags that explain it).
describe('topLevelReason', () => {
    const composedBy = (...owners: string[]) => owners.map((name) => ({ father: { name } }));
    it('a rootable class can be a top-level type', () => {
        expect(topLevelReason({ rootable: true })).toBeNull();
    });
    it('the metamodel\'s explicit rootable wins over being composed', () => {
        expect(topLevelReason({ rootable: true, isComposedBy: composedBy('Scenario') })).toBeNull();
    });
    it('an abstract or interface class has no instances of its own', () => {
        expect(topLevelReason({ rootable: false, abstract: true })).toBe('abstract, it has no instances of its own');
        expect(topLevelReason({ rootable: false, interface: true })).toBe('abstract, it has no instances of its own');
    });
    it('a composed class names its containers, once each', () => {
        expect(topLevelReason({ rootable: false, isComposedBy: composedBy('Scenario') })).toBe('created inside Scenario');
        expect(topLevelReason({ rootable: false, isComposedBy: composedBy('Domain', 'Domain', 'Cluster') })).toBe('created inside Domain, Cluster');
    });
    it('a singleton, and a class the metamodel keeps off the root', () => {
        expect(topLevelReason({ rootable: false, isSingleton: true })).toBe('a singleton');
        expect(topLevelReason({ rootable: false })).toBe('not allowed at the model root by its metamodel');
    });
    it('no class, a reason rather than a pass', () => {
        expect(topLevelReason(null)).toBe('unknown metaclass');
    });
});

describe('restrictDeleteForProfile (#157, 2026-10-04)', () => {
    // Exact class per instance, as the Configurator resolves it.
    const perms: Record<string, 'edit' | 'read' | 'hidden'> = { phase: 'read', vault: 'hidden', step: 'edit', ref_ok: 'edit', ref_hidden: 'hidden', ref_read: 'read' };
    const perm = (id: string) => perms[id] ?? 'edit';
    const pre = (descendants: string[], referencedBy: string[], blocked: string | null = null, canReassign = true) => ({
        blocked,
        canReassign,
        descendants: descendants.map((id) => ({ id, name: id })),
        referencedBy: referencedBy.map((instanceId) => ({ instanceId, featureKey: 'f' })),
    });
    const ids = (xs: Array<{ id?: string; instanceId?: string }>) => xs.map((x) => x.id ?? x.instanceId);

    it('a read element in the cascade blocks the delete with the profile reason', () => {
        expect(restrictDeleteForProfile(pre(['step', 'phase'], []), perm).blocked).toBe(CASCADE_LOCKED_REASON);
    });
    it('a hidden element in the cascade blocks it too, and is not listed', () => {
        const r = restrictDeleteForProfile(pre(['step', 'vault'], []), perm);
        expect(r.blocked).toBe(CASCADE_LOCKED_REASON);
        expect(ids(r.descendants)).toEqual(['step']);
    });
    it('the reason names no type', () => {
        expect(CASCADE_LOCKED_REASON).not.toMatch(/Vault|Phase/);
    });
    it('CONTROL: a cascade of editable elements is not blocked, and keeps every entry', () => {
        const r = restrictDeleteForProfile(pre(['step'], ['ref_ok', 'ref_read']), perm);
        expect(r.blocked).toBeNull();
        expect(ids(r.descendants)).toEqual(['step']);
        expect(ids(r.referencedBy)).toEqual(['ref_ok', 'ref_read']);
        expect(r.canReassign).toBe(true);
    });
    it('a hidden referrer leaves the list, so the plan neither reassigns nor clears it', () => {
        expect(ids(restrictDeleteForProfile(pre([], ['ref_ok', 'ref_hidden']), perm).referencedBy)).toEqual(['ref_ok']);
    });
    it('reassign is offered only while a referrer is left', () => {
        expect(restrictDeleteForProfile(pre([], ['ref_hidden']), perm).canReassign).toBe(false);
        expect(restrictDeleteForProfile(pre([], ['ref_ok'], null, false), perm).canReassign).toBe(false);
    });
    it('a reason already there wins (the singleton comes from the metamodel)', () => {
        expect(restrictDeleteForProfile(pre(['phase'], [], 'Scenario is a singleton'), perm).blocked).toBe('Scenario is a singleton');
    });
    it('the input is not changed', () => {
        const input = pre(['vault'], ['ref_hidden']);
        restrictDeleteForProfile(input, perm);
        expect(ids(input.descendants)).toEqual(['vault']);
        expect(ids(input.referencedBy)).toEqual(['ref_hidden']);
    });
});

// ── #186 «Customize element»: the per-role presentation of a type (R-CFG-3, P-2026-10-17-1053) ──

describe('typePresentationOf (#186)', () => {
    const entry = { fields: { title: { label: 'Headline' } } };
    it('returns the entry of the class', () => {
        expect(typePresentationOf({ typePresentation: { C1: entry } }, 'C1')).toEqual(entry);
    });
    it('is null when the profile, the field or the class entry is absent', () => {
        expect(typePresentationOf(null, 'C1')).toBeNull();
        expect(typePresentationOf(undefined, 'C1')).toBeNull();
        expect(typePresentationOf({ name: 'Edu' }, 'C1')).toBeNull();
        expect(typePresentationOf({ typePresentation: { C1: entry } }, 'C2')).toBeNull();
    });
    it('is null on malformed data, never throws', () => {
        expect(typePresentationOf({ typePresentation: 'x' }, 'C1')).toBeNull();
        expect(typePresentationOf({ typePresentation: { C1: 'x' } }, 'C1')).toBeNull();
        expect(typePresentationOf({ typePresentation: { C1: [entry] } }, 'C1')).toBeNull();
    });
});

describe('fieldPresentationOf (#186)', () => {
    it('returns the entry of a feature', () => {
        expect(fieldPresentationOf({ fields: { title: { label: 'H' } } }, 'title')).toEqual({ label: 'H' });
    });
    it('is null for an absent feature, a missing or malformed fields map, a malformed entry, no presentation', () => {
        expect(fieldPresentationOf({ fields: { title: { label: 'H' } } }, 'notes')).toBeNull();
        expect(fieldPresentationOf({}, 'title')).toBeNull();
        expect(fieldPresentationOf({ fields: 'x' } as any, 'title')).toBeNull();
        expect(fieldPresentationOf({ fields: { title: 'x' } } as any, 'title')).toBeNull();
        expect(fieldPresentationOf(null, 'title')).toBeNull();
    });
});

describe('widgetChoicesFor (#186)', () => {
    const f = (typeName: string, o: { isEnum?: boolean; isMultivalued?: boolean; isReadOnly?: boolean } = {}) =>
        widgetChoicesFor({ typeName, isEnum: !!o.isEnum, isMultivalued: !!o.isMultivalued, isReadOnly: o.isReadOnly });
    it('a string: input (the default rendering first), textarea, dropdown', () => {
        expect(f('EString')).toEqual(['input', 'textarea', 'dropdown']);
    });
    it('every numeric type the form renders as a number: stepper (the default first), number input, number dropdown', () => {
        for (const t of ['EInt', 'ELong', 'EShort', 'EFloat', 'EDouble']) {
            expect(f(t)).toEqual(['stepper', 'number-input', 'number-dropdown']);
        }
    });
    it('no choice for a type whose widget is fixed or not covered: boolean, char, date, byte, a custom datatype', () => {
        for (const t of ['EBoolean', 'EChar', 'EDate', 'EByte', 'Color']) expect(f(t)).toEqual([]);
    });
    it('no choice for an enum (its select, as the metamodel defines it), whatever its type name', () => {
        expect(f('Level', { isEnum: true })).toEqual([]);
        expect(f('EString', { isEnum: true })).toEqual([]);
    });
    it('no choice for a multi-valued attribute or a read-only field', () => {
        expect(f('EString', { isMultivalued: true })).toEqual([]);
        expect(f('EInt', { isReadOnly: true })).toEqual([]);
    });
    it('returns a fresh array: a caller that edits it changes nothing for the next', () => {
        const a = f('EString');
        a.pop();
        expect(f('EString')).toEqual(['input', 'textarea', 'dropdown']);
    });
    it('isRoleWidget accepts the six identifiers and nothing else', () => {
        for (const w of ['input', 'textarea', 'dropdown', 'stepper', 'number-input', 'number-dropdown']) expect(isRoleWidget(w)).toBe(true);
        for (const w of ['text', 'select', 'number', '', null, 3]) expect(isRoleWidget(w)).toBe(false);
    });
});

describe('sanitizeDeclarations (#186)', () => {
    const keys = (t: string) => Object.keys(sanitizeDeclarations(t).style);
    it('keeps property declarations, as a camelCase style object and a normalized text', () => {
        expect(sanitizeDeclarations('font-weight: 600; color: #0f172a')).toEqual({
            style: { fontWeight: '600', color: '#0f172a' },
            text: 'font-weight: 600;\ncolor: #0f172a;',
            dropped: [],
        });
    });
    it('accepts camelCase property names', () => {
        const r = sanitizeDeclarations('fontWeight: bold');
        expect(r.style).toEqual({ fontWeight: 'bold' });
        expect(r.text).toBe('font-weight: bold;');
    });
    it('a newline separates declarations as a semicolon does', () => {
        expect(sanitizeDeclarations('color: red\nfont-style: italic').style).toEqual({ color: 'red', fontStyle: 'italic' });
    });
    it('vendor prefixes take React\'s keys', () => {
        expect(keys('-webkit-text-stroke: 1px red; -ms-flex: 1; -moz-tab-size: 2')).toEqual(['WebkitTextStroke', 'msFlex', 'MozTabSize']);
    });
    it('drops url(, in any case and inside another function', () => {
        const r = sanitizeDeclarations('background: URL(x.png); background-image: linear-gradient(red, url(y)); color: red');
        expect(r.style).toEqual({ color: 'red' });
        expect(r.dropped.map((d) => d.reason)).toEqual(['contains url(', 'contains url(']);
    });
    it('drops the other functions that load a resource or run code', () => {
        for (const v of ['background-image: image-set("a.png" 1x)', 'background: image(x.png)', 'background: cross-fade(a, b)',
            'background: element(#x)', 'width: expression(alert(1))', 'background: javascript:alert(1)']) {
            expect(sanitizeDeclarations(v).style).toEqual({});
        }
    });
    it('drops an at-rule, and a value with @, a backslash, a brace or an angle bracket', () => {
        expect(sanitizeDeclarations('@import "x.css"; color: red').style).toEqual({ color: 'red' });
        for (const v of ['font-family: @foo', 'color: re\\64', 'color: red} body{color:blue', 'content: "<b>"', 'width: a>b']) {
            expect(sanitizeDeclarations(v).style).toEqual({});
        }
    });
    it('drops behavior and -moz-binding', () => {
        expect(sanitizeDeclarations('behavior: x; -moz-binding: y; color: red').style).toEqual({ color: 'red' });
    });
    it('keeps position static and relative only: fixed, absolute and sticky lift a field out of its box', () => {
        expect(keys('position: relative')).toEqual(['position']);
        expect(keys('position: Static')).toEqual(['position']);
        for (const v of ['fixed', 'absolute', 'sticky', 'FIXED']) expect(keys(`position: ${v}`)).toEqual([]);
    });
    it('drops a custom property: it would override the design tokens under the field', () => {
        const r = sanitizeDeclarations('--color-text-primary: red; color: red');
        expect(r.style).toEqual({ color: 'red' });
        expect(r.dropped).toEqual([{ declaration: '--color-text-primary: red', reason: 'custom properties are not allowed' }]);
    });
    it('drops what is not a declaration: no colon, an invalid name, an empty value', () => {
        const r = sanitizeDeclarations('red; 1color: red; col or: red; color: ; margin: 0');
        expect(r.style).toEqual({ margin: '0' });
        expect(r.dropped).toHaveLength(4);
    });
    it('a semicolon inside quotes or parentheses does not split', () => {
        const r = sanitizeDeclarations('font-family: "A;B", serif; width: calc(1px ;2px); color: red');
        expect(r.style).toEqual({ fontFamily: '"A;B", serif', width: 'calc(1px ;2px)', color: 'red' });
    });
    it('strips !important and keeps the declaration', () => {
        expect(sanitizeDeclarations('color: red !IMPORTANT')).toEqual({ style: { color: 'red' }, text: 'color: red;', dropped: [] });
    });
    it('strips comments; an unclosed comment takes the rest', () => {
        expect(sanitizeDeclarations('color: red; /* x: y; */ font-weight: 700').style).toEqual({ color: 'red', fontWeight: '700' });
        expect(sanitizeDeclarations('color: red; /* font-weight: 700').style).toEqual({ color: 'red' });
    });
    it('a later declaration of the same property wins', () => {
        const r = sanitizeDeclarations('color: red; color: blue');
        expect(r.style).toEqual({ color: 'blue' });
        expect(r.text).toBe('color: blue;');
    });
    it(`keeps at most ${MAX_STYLE_DECLARATIONS} declarations and ${MAX_STYLE_LENGTH} characters, and reports the rest`, () => {
        const many = sanitizeDeclarations(Array.from({ length: MAX_STYLE_DECLARATIONS + 1 }, (_, i) => `x-p${i}: 1`).join(';'));
        expect(Object.keys(many.style)).toHaveLength(MAX_STYLE_DECLARATIONS);
        expect(many.dropped).toHaveLength(1);
        const long = sanitizeDeclarations(`color: red; font-family: ${'a'.repeat(MAX_STYLE_LENGTH)}`);
        expect(long.style).toEqual({ color: 'red' });
        expect(long.dropped).toHaveLength(1);
        expect(long.text.length).toBeLessThanOrEqual(MAX_STYLE_LENGTH);
    });
    it('every dropped entry names the declaration and a reason', () => {
        const r = sanitizeDeclarations('background: url(x); position: fixed');
        expect(r.dropped).toHaveLength(2);
        for (const d of r.dropped) {
            expect(d.declaration.length).toBeGreaterThan(0);
            expect(d.reason.length).toBeGreaterThan(0);
        }
        expect(r.dropped[0].declaration).toBe('background: url(x)');
    });
    it('is total on a non-string', () => {
        for (const v of [undefined, null, 42, {}]) expect(sanitizeDeclarations(v as any)).toEqual({ style: {}, text: '', dropped: [] });
    });
});

describe('textPropsOf (#186)', () => {
    it('lists the text properties declared, in a fixed order, and nothing else', () => {
        expect(textPropsOf({ fontWeight: '600', backgroundColor: 'red', color: 'blue' })).toEqual(['color', 'font-weight']);
    });
    it('the font shorthand stands for its four parts, once each', () => {
        expect(textPropsOf({ font: 'bold 14px Inter', fontWeight: '700' })).toEqual(['font-family', 'font-size', 'font-style', 'font-weight']);
    });
    it('an empty style declares none', () => {
        expect(textPropsOf({})).toEqual([]);
    });
});

describe('parseOptionList (#186)', () => {
    it('one option per line, trimmed, without empty lines or duplicates', () => {
        expect(parseOptionList('  a \n\nb\na\n c', false)).toEqual({ options: ['a', 'b', 'c'], dropped: [] });
    });
    it('numeric: numbers only, normalized, the rest reported', () => {
        expect(parseOptionList('1\n2.5\nx\n-3\n1e2\n05\n1\n0x10', true)).toEqual({ options: ['1', '2.5', '-3', '100', '5'], dropped: ['x', '0x10'] });
    });
    it('keeps at most 200 options', () => {
        const r = parseOptionList(Array.from({ length: 205 }, (_, i) => `o${i}`).join('\n'), false);
        expect(r.options).toHaveLength(200);
        expect(r.dropped).toHaveLength(5);
    });
    it('is total on a non-string', () => {
        expect(parseOptionList(undefined as any, false)).toEqual({ options: [], dropped: [] });
    });
});

describe('cleanTypePresentation (#186)', () => {
    it('keeps what means something and drops the defaults', () => {
        expect(cleanTypePresentation({
            fields: {
                title: { widget: 'dropdown', options: ['a', ' b ', 'a', ''], allowOther: true, label: ' Headline ', showType: false },
                notes: { label: '   ', showType: true, allowOther: false },
                level: { widget: 'select' as any, options: ['x'] },
                budget: { widget: 'number-dropdown', options: ['1', 'x', '2.50'] },
                duration: { widget: 'stepper', options: ['1'], allowOther: true },
                bogus: 'x' as any,
            },
        })).toEqual({
            fields: {
                title: { widget: 'dropdown', options: ['a', 'b'], allowOther: true, label: 'Headline', showType: false },
                budget: { widget: 'number-dropdown', options: ['1', '2.5'] },
                duration: { widget: 'stepper' },
            },
        });
    });
    it('stores the kept declarations only, and drops a style left empty', () => {
        expect(cleanTypePresentation({ fields: { goal: { cardStyle: 'background: url(x)', lineStyle: 'border-color: red; position: fixed', style: 'color: red' } } }))
            .toEqual({ fields: { goal: { lineStyle: 'border-color: red;', style: 'color: red;' } } });
    });
    it('is null when nothing is left, and on malformed input', () => {
        expect(cleanTypePresentation({ fields: { title: { showType: true } } })).toBeNull();
        expect(cleanTypePresentation({})).toBeNull();
        expect(cleanTypePresentation({ fields: 'x' } as any)).toBeNull();
        expect(cleanTypePresentation(null)).toBeNull();
    });
    it('does not change its input', () => {
        const input = { fields: { title: { label: ' H ', showType: true } } };
        cleanTypePresentation(input);
        expect(input).toEqual({ fields: { title: { label: ' H ', showType: true } } });
    });
});

describe('nextTypePresentations (#186)', () => {
    const c2 = { fields: { description: { label: 'What' } } };
    it('sets the class entry and keeps the others', () => {
        expect(nextTypePresentations({ C2: c2 }, 'C1', { fields: { title: { label: 'H' } } }))
            .toEqual({ next: { C2: c2, C1: { fields: { title: { label: 'H' } } } }, changed: true });
    });
    it('an entry left empty removes the key: a change when it was there, none when it was not', () => {
        expect(nextTypePresentations({ C1: { fields: { title: { label: 'H' } } }, C2: c2 }, 'C1', { fields: { title: { label: '' } } }))
            .toEqual({ next: { C2: c2 }, changed: true });
        expect(nextTypePresentations({ C2: c2 }, 'C1', null)).toEqual({ next: { C2: c2 }, changed: false });
    });
    it('an entry equal to the stored one, once cleaned, is no change', () => {
        expect(nextTypePresentations({ C1: { fields: { title: { label: 'H' } } } }, 'C1', { fields: { title: { label: ' H ', showType: true } } }).changed).toBe(false);
    });
    it('the order of the features does not make a change', () => {
        const a = { fields: { title: { label: 'H' }, notes: { label: 'N' } } };
        const b = { fields: { notes: { label: 'N' }, title: { label: 'H' } } };
        expect(nextTypePresentations({ C1: a }, 'C1', b).changed).toBe(false);
    });
    it('starts from nothing on malformed data, and does not change its input', () => {
        expect(nextTypePresentations('x', 'C1', { fields: { title: { label: 'H' } } }).next).toEqual({ C1: { fields: { title: { label: 'H' } } } });
        const all = { C2: c2 };
        nextTypePresentations(all, 'C1', { fields: { title: { label: 'H' } } });
        expect(all).toEqual({ C2: c2 });
    });
});
