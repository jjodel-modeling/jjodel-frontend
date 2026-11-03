import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * #446: the debounced parse must not lose its pending run to a repeated call
 * with the same source. Monaco delivers its content-change events in a queue,
 * and every listener reads the final `getValue()`, so one edit reaches `parse`
 * several times with the same string inside the debounce window. When the
 * repeat cleared the pending timer and returned, the AST kept the previous
 * source and Execute ran it: a wrong result with no signal.
 *
 * No hook renderer and no DOM here (see useJjtlParser.test.ts): React is
 * replaced by its primitives, and each `useState` slot records what it is set
 * to, so the AST the hook publishes can be read back. The hook body runs
 * unchanged; the debounce runs on fake timers.
 */
const slots: Array<{ value: any }> = [];
vi.mock('react', () => ({
    useState: (initial: any) => {
        const slot = { value: initial };
        slots.push(slot);
        return [initial, (v: any) => { slot.value = typeof v === 'function' ? v(slot.value) : v; }];
    },
    useCallback: (fn: any) => fn,
    useRef: (initial: any) => ({ current: initial }),
    useEffect: () => { /* no cleanup under test */ },
}));

import { useJjtlParser } from '../useJjtlParser';

const HEAD = 'transformation S2T\nfrom Src\nto Tgt\n\n';
const OWNER = 'Owner -> TOwner {\n    name := name\n}\n\n';
const PET = 'Pet -> TPet {\n    name := name\n}\n';

/** The hook, with its published AST (the first useState slot) readable. */
function mount() {
    slots.length = 0;
    const hook = useJjtlParser();
    const astSlot = slots[0];
    const rules = () => (astSlot.value?.mappings ?? []).map((m: any) => m.targetClass);
    return { hook, rules };
}

describe('useJjtlParser debounced parse (#446)', () => {
    beforeEach(() => { vi.useFakeTimers(); });
    afterEach(() => { vi.useRealTimers(); });

    it('a repeated call with the same source does not cancel the pending parse', () => {
        const { hook, rules } = mount();
        hook.parse(HEAD + OWNER);
        vi.advanceTimersByTime(300);
        expect(rules()).toEqual(['TOwner']);

        // One edit, delivered by Monaco as several change events reading the same final value.
        hook.parse(HEAD + OWNER + PET);
        hook.parse(HEAD + OWNER + PET);
        hook.parse(HEAD + OWNER + PET);
        vi.advanceTimersByTime(300);
        expect(rules()).toEqual(['TOwner', 'TPet']);
    });

    it('a source changed and changed back inside the window publishes the last one', () => {
        const { hook, rules } = mount();
        hook.parse(HEAD + OWNER);
        vi.advanceTimersByTime(300);
        hook.parse(HEAD + PET);
        hook.parse(HEAD + OWNER);
        vi.advanceTimersByTime(300);
        expect(rules()).toEqual(['TOwner']);
    });

    it('parseNow owns the published AST: a later parse of an earlier source is not skipped', () => {
        const { hook, rules } = mount();
        hook.parse(HEAD + OWNER);
        vi.advanceTimersByTime(300);
        hook.parseNow(HEAD + PET);
        expect(rules()).toEqual(['TPet']);
        hook.parse(HEAD + OWNER);
        vi.advanceTimersByTime(300);
        expect(rules()).toEqual(['TOwner']);
    });

    it('parseNow is not overwritten by a pending parse of another source', () => {
        const { hook, rules } = mount();
        hook.parse(HEAD + OWNER);
        hook.parseNow(HEAD + PET);
        vi.advanceTimersByTime(300);
        expect(rules()).toEqual(['TPet']);
    });

    it('still parses a new source only once per window', () => {
        const { hook, rules } = mount();
        hook.parse(HEAD + PET);
        vi.advanceTimersByTime(299);
        expect(rules()).toEqual([]);
        vi.advanceTimersByTime(1);
        expect(rules()).toEqual(['TPet']);
    });
});
