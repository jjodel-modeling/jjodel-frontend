import { describe, it, expect, vi } from 'vitest';

/**
 * `parent` as a property of source objects, and the lexical scope of helper bodies
 * (P-2026-11-18-1815).
 *
 * A: `x.parent` yields the container of any source object `x`: the current instance
 * (`self`), an alias, a helper parameter, a `forall` element, the handle of a
 * `{ __ref }` value. A user feature named `parent` wins; an element of a serialized
 * source array is contained through `_containerId` only, so a root's `parent` is null.
 *
 * B: a helper body sees its parameters, the builtins and helpers, and `data`, nothing
 * from the caller's instance context. A name it does not bind reads as any undefined
 * name does (null, no warning; a member read on it warns).
 *
 * The source has the shape ProjectEditor serializes, as in
 * source-object-identity.test.ts, whose `joiner` mock is repeated for the same reason.
 */
vi.mock('../../../joiner', () => ({
    U: {
        asNumber: (val: any, returnInvalid: any = 0, returnNAN: any = NaN): number => {
            if (isNaN(val)) return returnNAN;
            if (typeof val === 'number') return val;
            const v = +val;
            if (isNaN(v)) return returnInvalid;
            return v;
        },
    },
}));

import { JjtlLexer } from '../../lexer/lexer';
import { JjtlParser } from '../../parser/parser';
import { execute } from '../executor';
import type { TransformationAST } from '../../types/ast';

function cls(name: string, attributes: string[], references: any[] = []) {
    const attrs = attributes.map(a => ({ name: a }));
    return { className: 'DClass', name, attributes: attrs, allAttributes: attrs, references, allReferences: references };
}
const TARGET = {
    classes: [
        cls('Male', ['fullName']),
        cls('Female', ['fullName']),
        cls('Household', ['name'], [{ name: 'members', composition: true, type: { name: 'Female' } }]),
    ],
};

const ref = (id: string) => ({ __ref: id });
function member(id: string, firstName: string, family: string) {
    return { id, name: 'Member', className: 'Member', __type: 'Member', firstName, _containerId: family };
}
function family(id: string, lastName: string, father: string, mother: string, sons: string[], daughters: string[]) {
    return {
        id, name: 'Family', className: 'Family', __type: 'Family', lastName,
        father: ref(father), mother: ref(mother), sons: sons.map(ref), daughters: daughters.map(ref),
    };
}
// The sample model of the template: 2 families, 9 members, 4 of them female.
const SOURCE: any[] = [
    family('F1', 'March', 'M1', 'M2', ['M3'], ['M4']),
    family('F2', 'Sailor', 'M5', 'M6', ['M7', 'M8'], ['M9']),
    member('M1', 'Jim', 'F1'), member('M2', 'Cindy', 'F1'), member('M3', 'Brandon', 'F1'), member('M4', 'Brenda', 'F1'),
    member('M5', 'Peter', 'F2'), member('M6', 'Jackie', 'F2'), member('M7', 'David', 'F2'), member('M8', 'Dylan', 'F2'),
    member('M9', 'Kelly', 'F2'),
];

const HEADER = 'transformation Families2Persons\nfrom Families\nto Persons\n\n';

function parseJjtl(body: string, withSource: boolean): TransformationAST {
    const text = HEADER + body.trim();
    const { tokens, errors: lexErrors } = new JjtlLexer(text).tokenize();
    expect(lexErrors).toEqual([]);
    const { ast, errors } = new JjtlParser(tokens, withSource ? text : undefined).parse();
    expect(errors).toEqual([]);
    return ast!;
}

async function run(body: string, withSource: boolean, source: any[] = SOURCE) {
    const result = await execute(parseJjtl(body, withSource), source, TARGET);
    expect(result.errors).toEqual([]);
    expect(result.success).toBe(true);
    const names = (c: string) => (result.targetModel!.instances.get(c) ?? []).map((o: any) => o.fullName).sort();
    return { female: names('Female'), male: names('Male'), warnings: result.warnings };
}

const FEMALE = ['Brenda March', 'Cindy March', 'Jackie Sailor', 'Kelly Sailor'];
const MALE = ['Brandon March', 'David Sailor', 'Dylan Sailor', 'Jim March', 'Peter Sailor'];
const MOTHERS = ['Cindy', 'Jackie'];

describe.each([
    ['legacy parser (no source)', false],
    ['JjEL delegation (source)', true],
])('parent and helper scope: %s', (_label, withSource) => {
    // ---------------------------------------------------------------- A
    it('A: the Families split through a helper that reads m.parent', async () => {
        const out = await run(`
helper isFemale(m : Member) -> Boolean {
   m.parent.mother == m or m.parent.daughters.contains(m)
}
Member m -> Female where isFemale(m) { fullName := firstName + " " + m.parent.lastName }
Member m -> Male where not isFemale(m) { fullName := firstName + " " + m.parent.lastName }`, withSource);
        expect(out.female).toEqual(FEMALE);
        expect(out.male).toEqual(MALE);
        expect(out.warnings).toEqual([]);
    });

    it('A: self.parent and alias .parent in a guard', async () => {
        const viaSelf = await run(`Member -> Female where self.parent.mother == self { fullName := firstName }`, withSource);
        expect(viaSelf.female).toEqual(MOTHERS);
        expect(viaSelf.warnings).toEqual([]);
        const viaAlias = await run(`Member m -> Female where m.parent.mother == m { fullName := firstName }`, withSource);
        expect(viaAlias.female).toEqual(MOTHERS);
        expect(viaAlias.warnings).toEqual([]);
    });

    it('A: .parent on the handle of a { __ref } value, and through a cycle', async () => {
        const viaHandle = await run(`
Member m -> Female where parent.mother.parent.lastName == parent.lastName and parent.mother == m { fullName := firstName }`, withSource);
        expect(viaHandle.female).toEqual(MOTHERS);
        expect(viaHandle.warnings).toEqual([]);
        const cycle = await run(`
Member m -> Female where m.parent.daughters.first().parent.daughters.contains(m) { fullName := firstName }`, withSource);
        expect(cycle.female).toEqual(['Brenda', 'Kelly']);
        expect(cycle.warnings).toEqual([]);
    });

    it('A: .parent on a forall element', async () => {
        const out = await run(`
Family f -> Household {
    name := lastName
    -> members {
        forall d in daughters -> Female {
            fullName := d.firstName + " " + d.parent.lastName
        }
    }
}`, withSource);
        expect(out.female).toEqual(['Brenda March', 'Kelly Sailor']);
        expect(out.warnings).toEqual([]);
    });

    it('A: a user feature named parent wins over the container, bare and dotted', async () => {
        const source = SOURCE.map(o => (o.id === 'M4' ? { ...o, parent: ref('F2') } : o));
        const out = await run(`
Member m -> Female where firstName == "Brenda" { fullName := parent.lastName + "/" + m.parent.lastName + "/" + self.parent.lastName }`,
        withSource, source);
        expect(out.female).toEqual(['Sailor/Sailor/Sailor']);
        expect(out.warnings).toEqual([]);
    });

    it('A: the parent of a serialized root is null, bare and dotted, though the root has a feature named father', async () => {
        const out = await run(`
Family f -> Male { fullName := lastName + ":" + (parent == null) + ":" + (f.parent == null) + ":" + (self.parent == null) }`, withSource);
        expect(out.male).toEqual(['March:true:true:true', 'Sailor:true:true:true']);
        expect(out.warnings).toEqual([]);
    });

    // ---------------------------------------------------------------- B
    it('B: a helper does not see the caller\'s bare parent: a member read on it warns, and nothing matches', async () => {
        const out = await run(`
helper isMother(m : Member) -> Boolean { parent.mother == m }
Member m -> Female where isMother(m) { fullName := firstName }`, withSource);
        expect(out.female).toEqual([]);
        expect(out.warnings.length).toBe(9);
        for (const w of out.warnings) expect(w).toMatch(/Cannot access property 'mother' of null/);
    });

    it('B: a helper does not see the caller\'s self, alias or attributes: they read null, with no warning', async () => {
        const out = await run(`
helper probe(x : Member) -> String {
   "" + (self == null) + (m == null) + (firstName == null) + (source == data)
}
Member m -> Female where m.firstName == "Brenda" { fullName := probe(m) }`, withSource);
        expect(out.female).toEqual(['truetruetruetrue']);
        expect(out.warnings).toEqual([]);
    });

    it('B: a helper still sees its parameters, data, other helpers and builtins', async () => {
        const out = await run(`
helper count(cn : String) -> Integer { data.filter(o => o.className == cn).size() }
helper label(x : Member) -> String { x.firstName + "#" + count("Member") + "#" + count("Family") }
Member m -> Female where m.firstName == "Brenda" { fullName := label(m) }`, withSource);
        expect(out.female).toEqual(['Brenda#9#2']);
        expect(out.warnings).toEqual([]);
    });

    it('B: a helper called inside a forall does not see the loop variable', async () => {
        const out = await run(`
helper peek(x : Member) -> String { "" + (d == null) }
Family f -> Household {
    name := lastName
    -> members {
        forall d in daughters -> Female {
            fullName := d.firstName + ":" + peek(d)
        }
    }
}`, withSource);
        expect(out.female).toEqual(['Brenda:true', 'Kelly:true']);
        expect(out.warnings).toEqual([]);
    });
});
