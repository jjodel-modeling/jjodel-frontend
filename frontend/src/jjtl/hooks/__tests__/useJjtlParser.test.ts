import { describe, it, expect, vi } from 'vitest';

/**
 * The app hook parses on the JjEL path, as node does (P-2026-10-31-1910): it
 * passes the source string to the parser, so JjEL-only forms parse in the app.
 *
 * The repository has no hook renderer and no DOM environment, so React is
 * replaced by the four primitives the hook calls, enough to run `parseNow`
 * outside a component. The hook body runs unchanged.
 */
vi.mock('react', () => ({
    useState: (initial: any) => [initial, () => { /* state is not under test */ }],
    useCallback: (fn: any) => fn,
    useRef: (initial: any) => ({ current: initial }),
    useEffect: () => { /* no cleanup under test */ },
}));

import { useJjtlParser } from '../useJjtlParser';

const HEAD = 'transformation T\nfrom S\nto D\n\n';

describe('useJjtlParser parses on the JjEL path', () => {
    it('accepts exists ... such that in a := expression', () => {
        const { ast, errors } = useJjtlParser().parseNow(HEAD + `Family -> Household {
    hasAdult := exists p in members such that p.age > 17
}`);
        expect(errors).toEqual([]);
        const expr = (ast!.mappings[0].body as any[])[0].expression;
        expect(expr.type).toBe('JjelExpression');
        expect(expr.expression.type).toBe('Exists');
    });

    it('accepts exists ... such that in a where guard', () => {
        const { errors } = useJjtlParser().parseNow(HEAD + `Family -> Household where exists p in members such that p.age > 17 {
    name := name
}`);
        expect(errors).toEqual([]);
    });

    it('keeps prompt as the interactive node', () => {
        const { ast, errors } = useJjtlParser().parseNow(HEAD + `Family -> Household {
    name := prompt("Name?", EString)
}`);
        expect(errors).toEqual([]);
        expect((ast!.mappings[0].body as any[])[0].expression.type).toBe('PromptExpression');
    });

    it('lets a := conditional continue with else on the next line', () => {
        const { ast, errors } = useJjtlParser().parseNow(HEAD + `Family -> Household {
    a := if flag then 1
         else 2
    b := 3
}`);
        expect(errors).toEqual([]);
        expect((ast!.mappings[0].body as any[]).map(i => i.targetAttribute)).toEqual(['a', 'b']);
    });
});
