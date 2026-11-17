import { describe, it, expect, vi } from 'vitest';

/**
 * A guard that compares source objects (P-2026-11-17-2219).
 *
 * Families2Persons on the gallery project «Families and Persons» mapped every
 * Member to Male: in `parent.mother == self`, `parent.mother` is the handle of a
 * `{ __ref: id }` reference value and `self` is the source object (or its view),
 * two JavaScript objects for one Member. JjEL's `==` and `contains` compared
 * them key by key and answered false. They now decide by the id both carry.
 *
 * The source has the shape ProjectEditor serializes: `id`, `className`, `__type`,
 * references as `{ __ref }`, `_containerId` for the container. Both parse paths
 * run, as in source-collections-in-expressions.test.ts, whose mock of the
 * `joiner` barrel is repeated here for the same reason.
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

function cls(name: string, attributes: string[]) {
    const attrs = attributes.map(a => ({ name: a }));
    return { className: 'DClass', name, attributes: attrs, allAttributes: attrs, references: [], allReferences: [] };
}
const TARGET = { classes: [cls('Male', ['fullName']), cls('Female', ['fullName'])] };

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
const SOURCE = [
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

async function run(body: string, withSource: boolean) {
    const result = await execute(parseJjtl(body, withSource), SOURCE, TARGET);
    expect(result.success).toBe(true);
    const names = (c: string) => (result.targetModel!.instances.get(c) ?? []).map((o: any) => o.fullName).sort();
    return { female: names('Female'), male: names('Male') };
}

const FEMALE = ['Brenda March', 'Cindy March', 'Jackie Sailor', 'Kelly Sailor'];
const MALE = ['Brandon March', 'David Sailor', 'Dylan Sailor', 'Jim March', 'Peter Sailor'];

describe.each([
    ['legacy parser (no source)', false],
    ['JjEL delegation (source)', true],
])('guards that compare source objects: %s', (_label, withSource) => {
    it('== and contains on objects select the female members', async () => {
        const out = await run(`
Member -> Female where parent.mother == self or parent.daughters.contains(self) {
    fullName := firstName + " " + parent.lastName
}
Member -> Male where not (parent.mother == self or parent.daughters.contains(self)) {
    fullName := firstName + " " + parent.lastName
}`, withSource);
        expect(out.female).toEqual(FEMALE);
        expect(out.male).toEqual(MALE);
    });

    it('the comparison of ids, the workaround, gives the same split', async () => {
        const out = await run(`
Member -> Female where parent.mother.id == self.id or parent.daughters.any(d => d.id == self.id) {
    fullName := firstName + " " + parent.lastName
}
Member -> Male where not (parent.mother.id == self.id or parent.daughters.any(d => d.id == self.id)) {
    fullName := firstName + " " + parent.lastName
}`, withSource);
        expect(out.female).toEqual(FEMALE);
        expect(out.male).toEqual(MALE);
    });

    it('!= and indexOf agree with ==', async () => {
        const out = await run(`
Member -> Male where parent.father == self or parent.sons.indexOf(self) >= 0 {
    fullName := firstName + " " + parent.lastName
}
Member -> Female where parent.father != self and parent.sons.indexOf(self) < 0 {
    fullName := firstName + " " + parent.lastName
}`, withSource);
        expect(out.female).toEqual(FEMALE);
        expect(out.male).toEqual(MALE);
    });
});
