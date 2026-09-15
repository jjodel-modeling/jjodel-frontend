/**
 * Unit tests for pathExprFromSelection (authoring slice-1 enabling layer, F5-emit).
 * Verifies the three take modes and that every emitted step matches the IR
 * grammar the compiler enforces (irCompile.ts STEP_RE).
 */
import { describe, it, expect } from 'vitest';
import { pathExprFromSelection } from '../pathExpr';

/** Mirror of irCompile.ts STEP_RE — each dot-separated step must match. */
const STEP_RE = /^(\$[A-Za-z_][A-Za-z0-9_]*|value|values(\[\d+\])?)$/;

describe('pathExprFromSelection', () => {
    it('emits .value for a single-value take', () => {
        expect(pathExprFromSelection({ feature: 'name', take: 'value' })).toBe('$name.value');
    });

    it('emits .values for a whole-array take', () => {
        expect(pathExprFromSelection({ feature: 'tags', take: 'values' })).toBe('$tags.values');
    });

    it('emits .values[N] for an indexed take', () => {
        expect(pathExprFromSelection({ feature: 'tags', take: 'valuesAt', index: 2 })).toBe('$tags.values[2]');
    });

    it('defaults the valuesAt index to 0 when absent', () => {
        expect(pathExprFromSelection({ feature: 'tags', take: 'valuesAt' })).toBe('$tags.values[0]');
    });

    it('every emitted step matches the IR grammar STEP_RE', () => {
        const exprs = [
            pathExprFromSelection({ feature: 'name', take: 'value' }),
            pathExprFromSelection({ feature: 'tags', take: 'values' }),
            pathExprFromSelection({ feature: 'tags', take: 'valuesAt', index: 5 }),
        ];
        for (const expr of exprs) {
            for (const step of expr.split('.')) {
                expect(STEP_RE.test(step)).toBe(true);
            }
        }
    });
});
