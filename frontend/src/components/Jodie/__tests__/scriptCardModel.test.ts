/**
 * Script card model (S2, R-JJD-2): chips, status, warning line and name, from a real plan.
 *
 * The plans come from `planEffects` over a small world, so a chip that counts anything but the
 * planner's effects fails here, not only in the browser probe.
 */
import { describe, it, expect } from 'vitest';
import { planEffects, type PlanWorld } from '../../../jjscript/executor/effectsPlanner';
import {
    fixWarningsRequest,
    isScriptCardBlock,
    scriptCardChips,
    scriptCardLineCount,
    scriptCardName,
    scriptCardStatus,
    scriptCardWarningLine,
} from '../scriptCardModel';

const UNBOUNDED = -1;

function world(): PlanWorld {
    return {
        classes: {
            StateMachine: {
                name: 'StateMachine', kinds: ['StateMachine'],
                attributes: [{ name: 'name', upper: 1 }],
                references: [{ name: 'states', containment: true, upper: UNBOUNDED, type: 'State' }],
            },
            State: {
                name: 'State', kinds: ['State'],
                attributes: [{ name: 'name', upper: 1 }],
                references: [{ name: 'next', containment: false, upper: UNBOUNDED, type: 'State' }],
            },
        },
        elements: [{ id: 'b', name: 'B', className: 'State', root: true }],
    };
}

const SCRIPT = [
    '// Traffic light',
    'create instance of StateMachine "SM"',
    'create instance of State "Red" in SM.states',
    'create instance of State "Green" in SM.states',
    'set Red.next += Green',
    'set Green.next += Red',
    'set B.next = Red',
    'set Red.next -= Green',
].join('\n');

describe('scriptCardChips', () => {
    it('counts creates per metaclass, then reference writes per feature, in plan order', async () => {
        const plan = await planEffects(SCRIPT, world());
        expect(plan.error).toBeNull();
        expect(scriptCardChips(plan).map((c) => c.label)).toEqual(['+1 StateMachine', '+2 State', '+3 next']);
    });

    it('leaves removals out of the reference chips', async () => {
        const plan = await planEffects('set B.next += B\nset B.next -= B', world());
        expect(scriptCardChips(plan)).toEqual([{ label: '+1 next', kind: 'reference', count: 1 }]);
    });

    it('has no chip for an empty plan', async () => {
        expect(scriptCardChips(await planEffects('// nothing', world()))).toEqual([]);
    });
});

describe('scriptCardStatus', () => {
    it('reads planning, planned, applied, and the first error with its line', async () => {
        expect(scriptCardStatus(null, false)).toEqual({ kind: 'planning' });
        const ok = await planEffects(SCRIPT, world());
        expect(scriptCardStatus(ok, false)).toEqual({ kind: 'planned' });
        expect(scriptCardStatus(ok, true)).toEqual({ kind: 'applied' });
        const bad = await planEffects('create instance of State "S"\nset B.name += "x"', world());
        expect(scriptCardStatus(bad, false)).toMatchObject({ kind: 'error', line: 2 });
    });
});

describe('scriptCardWarningLine', () => {
    it('gives the count and the first warning, null without warnings', async () => {
        const plan = await planEffects('create instance of Nope "X"\nset B.colour = "red"', world());
        expect(plan.warnings.length).toBe(2);
        expect(scriptCardWarningLine(plan.warnings)).toBe(`2 warnings · line 1: ${plan.warnings[0].message}`);
        expect(scriptCardWarningLine([{ line: 4, code: 'X', message: 'm' }])).toBe('1 warning · line 4: m');
        expect(scriptCardWarningLine([])).toBeNull();
    });

    it('fixWarningsRequest lists every warning and carries the script', () => {
        const text = fixWarningsRequest('a\nb', [{ line: 1, code: 'X', message: 'one' }, { line: 2, code: 'Y', message: 'two' }]);
        expect(text).toContain('- line 1: one\n- line 2: two');
        expect(text).toContain('```jjscript\na\nb\n```');
    });
});

describe('name, line count, which blocks become cards', () => {
    it('takes the first comment line as the name, `script` otherwise', () => {
        expect(scriptCardName(SCRIPT)).toBe('Traffic light');
        expect(scriptCardName('create instance of State "S"\n  //   Later name')).toBe('Later name');
        expect(scriptCardName('//\ncreate instance of State "S"')).toBe('script');
        expect(scriptCardLineCount(SCRIPT)).toBe(8);
    });

    it('takes multi-line jjscript, jjs, or JjScript-looking blocks only', () => {
        const no = () => false;
        expect(isScriptCardBlock('jjscript', 'a\nb', no)).toBe(true);
        expect(isScriptCardBlock('jjs', 'a\nb', no)).toBe(true);
        expect(isScriptCardBlock('jjscript', 'one line', no)).toBe(false);
        expect(isScriptCardBlock('typescript', 'a\nb', no)).toBe(false);
        expect(isScriptCardBlock('text', 'a\nb', () => true)).toBe(true);
    });
});
