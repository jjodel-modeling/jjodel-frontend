/**
 * simBoardSound — the Buzzer's tone (R-SIM-133 over R-SIM-128; P-2026-10-04-1131).
 *
 * A Buzzer reads as an LED (simBoardFace.ts) and sounds on the rising edge of its
 * boolean: a short tone through WebAudio, about 1.3 kHz for about 0.45 s. The
 * audio context is made on the first user gesture inside the board and never
 * before (`unlock`), as browsers require; until then an edge is read and nothing
 * sounds. The board is muted by default, a viewer preference
 * (simViewerPrefs.ts `boardSound`); a muted buzzer still shows its lamp.
 *
 * `observe` takes the buzzers' readings on the step shown: an edge is a reading
 * true after a live reading false, so the first reading of a buzzer never sounds,
 * a past step viewed neither sounds nor moves the edge, and a buzzer gone from the
 * readings forgets its last one. The driver is owned by the board card, one per
 * card; it writes nothing anywhere and never touches the run.
 *
 * Pure: the audio context comes from the caller, so a fake one runs under the
 * node test bench (sim/__tests__/simBoardSound.test.ts).
 */

/** The tone (R-SIM-133). */
export const TONE_HZ = 1300;
export const TONE_SECONDS = 0.45;
const TONE_GAIN = 0.2;
const TONE_FLOOR = 0.001;

/** What the tone needs of a WebAudio `AudioContext`. */
export interface ToneContext {
    readonly currentTime: number;
    readonly destination: unknown;
    readonly state?: string;
    resume?: () => Promise<void>;
    createOscillator: () => {
        type: string;
        readonly frequency: { setValueAtTime: (value: number, time: number) => unknown };
        connect: (node: any) => unknown;
        start: (time: number) => void;
        stop: (time: number) => void;
    };
    createGain: () => {
        readonly gain: { setValueAtTime: (value: number, time: number) => unknown; exponentialRampToValueAtTime: (value: number, time: number) => unknown };
        connect: (node: any) => unknown;
    };
}

/** One tone from now: a sine at `TONE_HZ` for `TONE_SECONDS`, its gain decaying to silence. */
export function playTone(ctx: ToneContext): void {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(TONE_HZ, t);
    gain.gain.setValueAtTime(TONE_GAIN, t);
    gain.gain.exponentialRampToValueAtTime(TONE_FLOOR, t + TONE_SECONDS);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + TONE_SECONDS);
}

export interface Buzzer {
    /** A user gesture inside the board: the audio context is made now, once; a suspended one is resumed. */
    unlock(): void;
    /** The buzzers' readings on the step shown, by device id: the ids whose rising edge sounded. */
    observe(lit: ReadonlyMap<string, boolean>, opts: { readonly muted: boolean; readonly live: boolean }): string[];
}

/** The board's buzzer driver; `makeContext` is called on the first `unlock` and may give `null` (no WebAudio). */
export function createBuzzer(makeContext: () => ToneContext | null): Buzzer {
    let ctx: ToneContext | null = null;
    let tried = false;
    let last = new Map<string, boolean>();
    return {
        unlock() {
            if (!tried) {
                tried = true;
                ctx = makeContext();
            }
            if (ctx?.state === 'suspended') void ctx.resume?.().catch(() => undefined);
        },
        observe(lit, { muted, live }) {
            if (!live) return [];
            const sounded: string[] = [];
            for (const [id, on] of lit) {
                if (on && last.get(id) === false && !muted && ctx) {
                    playTone(ctx);
                    sounded.push(id);
                }
            }
            last = new Map(lit);
            return sounded;
        },
    };
}
