/**
 * simBoardSound — the Buzzer's tone (P-2026-10-04-1131; R-SIM-133 over R-SIM-128).
 *
 * Executes the module with a fake audio context that records what it is asked:
 * the context is made on the first user gesture and never before, a tone sounds on
 * the rising edge of a buzzer's boolean on the live step, never on its first
 * reading, never while a past step is viewed and never while muted, and is about
 * 1.3 kHz for about 0.45 s. Each test name says which break of the rule kills it;
 * the mutation bench is in the commit message.
 */

import { describe, expect, it } from 'vitest';
import { TONE_HZ, TONE_SECONDS, createBuzzer, playTone } from '../simBoardSound';
import type { ToneContext } from '../simBoardSound';

interface Calls { made: number; tones: Array<{ hz: number; start: number; stop: number }>; gains: string[] }

function fakeContext(calls: Calls): ToneContext {
    return {
        currentTime: 10,
        destination: { node: 'out' },
        createOscillator: () => {
            const tone = { hz: 0, start: 0, stop: 0 };
            return {
                type: 'sine',
                frequency: { setValueAtTime: (v: number) => { tone.hz = v; } },
                connect: (n: unknown) => n,
                start: (t: number) => { tone.start = t; },
                stop: (t: number) => { tone.stop = t; calls.tones.push(tone); },
            };
        },
        createGain: () => ({
            gain: {
                setValueAtTime: (v: number, t: number) => { calls.gains.push(`set ${v}@${t}`); },
                exponentialRampToValueAtTime: (v: number, t: number) => { calls.gains.push(`ramp ${v}@${t}`); },
            },
            connect: (n: unknown) => n,
        }),
    };
}

function bench() {
    const calls: Calls = { made: 0, tones: [], gains: [] };
    const buzzer = createBuzzer(() => { calls.made++; return fakeContext(calls); });
    return { calls, buzzer };
}

const lit = (entries: Record<string, boolean>) => new Map(Object.entries(entries));
const LIVE = { muted: false, live: true };

describe('the audio context is made on the first user gesture (R-SIM-133)', () => {
    it('no context before a gesture, one after, never two (mutants: made at creation; made per gesture)', () => {
        const { calls, buzzer } = bench();
        buzzer.observe(lit({ z: false }), LIVE);
        buzzer.observe(lit({ z: true }), LIVE);
        expect([calls.made, calls.tones.length]).toEqual([0, 0]);
        buzzer.unlock();
        buzzer.unlock();
        expect(calls.made).toBe(1);
    });

    it('a context that cannot be made leaves the buzzer silent, no throw (mutant: null context called)', () => {
        const buzzer = createBuzzer(() => null);
        buzzer.unlock();
        buzzer.observe(lit({ z: false }), LIVE);
        expect(buzzer.observe(lit({ z: true }), LIVE)).toEqual([]);
    });
});

describe('a tone on the rising edge of the live reading (R-SIM-133)', () => {
    it('false then true sounds once; true again does not; true on first reading does not (mutants: level, not edge; first reading sounds)', () => {
        const { calls, buzzer } = bench();
        buzzer.unlock();
        expect(buzzer.observe(lit({ a: true, b: false }), LIVE)).toEqual([]);
        expect(buzzer.observe(lit({ a: true, b: true }), LIVE)).toEqual(['b']);
        expect(buzzer.observe(lit({ a: true, b: true }), LIVE)).toEqual([]);
        expect(buzzer.observe(lit({ a: false, b: false }), LIVE)).toEqual([]);
        expect(buzzer.observe(lit({ a: true, b: false }), LIVE)).toEqual(['a']);
        expect(calls.tones.length).toBe(2);
    });

    it('muted: the edge is read and nothing sounds; unmuted later, a held value does not sound (mutants: mute ignored; edge kept for later)', () => {
        const { calls, buzzer } = bench();
        buzzer.unlock();
        buzzer.observe(lit({ z: false }), LIVE);
        expect(buzzer.observe(lit({ z: true }), { muted: true, live: true })).toEqual([]);
        expect(buzzer.observe(lit({ z: true }), LIVE)).toEqual([]);
        expect(calls.tones.length).toBe(0);
    });

    it('a past step viewed neither sounds nor moves the edge; back to live the edge is from the last live reading (mutants: history rings; viewed reading kept)', () => {
        const { buzzer } = bench();
        buzzer.unlock();
        buzzer.observe(lit({ z: false }), LIVE);
        expect(buzzer.observe(lit({ z: true }), { muted: false, live: false })).toEqual([]);
        expect(buzzer.observe(lit({ z: true }), LIVE)).toEqual(['z']);
    });

    it('a buzzer removed and added again starts with no reading (mutant: stale reading kept)', () => {
        const { buzzer } = bench();
        buzzer.unlock();
        buzzer.observe(lit({ z: false }), LIVE);
        buzzer.observe(lit({}), LIVE);
        expect(buzzer.observe(lit({ z: true }), LIVE)).toEqual([]);
    });
});

describe('the tone (R-SIM-133)', () => {
    it('about 1.3 kHz for about 0.45 s from now, a decaying gain (mutants: another pitch; no stop; no decay)', () => {
        const calls: Calls = { made: 0, tones: [], gains: [] };
        playTone(fakeContext(calls));
        expect(TONE_HZ).toBe(1300);
        expect(TONE_SECONDS).toBe(0.45);
        expect(calls.tones).toEqual([{ hz: 1300, start: 10, stop: 10 + 0.45 }]);
        expect(calls.gains[0]).toMatch(/^set 0\.\d+@10$/);
        expect(calls.gains[calls.gains.length - 1]).toMatch(/^ramp 0\.0+1@10\.45$/);
    });
});
