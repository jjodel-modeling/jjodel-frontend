/**
 * SAVE2 — il trigger diradato: N gesti ravvicinati, UN solo salvataggio.
 *
 * Le asserzioni contano le CHIAMATE a `save`, non l'effetto: lo scheduler non sa
 * cosa `save` faccia, ed e' esattamente per poterlo contare che i due timer sono
 * stati estratti da `useLayoutAutosave` (nel repo non ci sono jsdom ne'
 * `@testing-library`, e aggiungerne uno sarebbe una dipendenza nuova).
 *
 * Ogni blocco apre con un controllo POSITIVO — che lo scheduler spari davvero
 * almeno una volta — perche' quasi tutte le asserzioni qui sono su un CONTEO, e un
 * conteggio a zero e' indistinguibile da uno scheduler mai armato (CLAUDE.md §5).
 *
 * I numeri di produzione sono importati da `useLayoutAutosave`, non riscritti: se
 * qualcuno riporta il debounce a 1000 ms il test che lo verifica diventa rosso.
 */

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { createLayoutAutosaveScheduler, installAutosaveEdgeGuards } from '../layoutAutosaveScheduler';

const IDLE = 15_000;
const CAP = 120_000;

const make = () => {
    const save = vi.fn();
    const s = createLayoutAutosaveScheduler({ save, debounceMs: IDLE, maxWaitMs: CAP });
    return { save, s };
};

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('lo scheduler — la quiete', () => {
    it('CONTROLLO POSITIVO: un gesto solo produce un salvataggio', () => {
        const { save, s } = make();
        s.schedule();
        expect(save).toHaveBeenCalledTimes(0);          // non prima della scadenza
        vi.advanceTimersByTime(IDLE);
        expect(save).toHaveBeenCalledTimes(1);
    });

    it('non salva prima della finestra di quiete', () => {
        const { save, s } = make();
        s.schedule();
        vi.advanceTimersByTime(IDLE - 1);
        expect(save).toHaveBeenCalledTimes(0);
        vi.advanceTimersByTime(1);
        expect(save).toHaveBeenCalledTimes(1);          // controllo positivo: e' armato
    });

    it('LA MISURA: 10 gesti a 2 s l\'uno dall\'altro producono UN solo salvataggio', () => {
        // E' la sessione misurata dalla sonda del punto 0, che col debounce a
        // 1000 ms ne produceva 6.
        const { save, s } = make();
        for (let i = 0; i < 10; i++) { s.schedule(); vi.advanceTimersByTime(2_000); }
        expect(save).toHaveBeenCalledTimes(0);          // durante la raffica, mai
        vi.advanceTimersByTime(IDLE);
        expect(save).toHaveBeenCalledTimes(1);
    });

    it('col vecchio debounce da 1000 ms la stessa raffica ne produrrebbe 10', () => {
        // Il contrappunto che rende il test sopra una misura e non una tautologia.
        const save = vi.fn();
        const s = createLayoutAutosaveScheduler({ save, debounceMs: 1_000, maxWaitMs: CAP });
        for (let i = 0; i < 10; i++) { s.schedule(); vi.advanceTimersByTime(2_000); }
        expect(save).toHaveBeenCalledTimes(10);
    });

    it('due raffiche separate da una pausa producono due salvataggi', () => {
        const { save, s } = make();
        s.schedule(); s.schedule();
        vi.advanceTimersByTime(IDLE);
        expect(save).toHaveBeenCalledTimes(1);          // controllo positivo
        s.schedule();
        vi.advanceTimersByTime(IDLE);
        expect(save).toHaveBeenCalledTimes(2);
    });

    it('a scadenza avvenuta non resta nessun timer che spari una seconda volta', () => {
        const { save, s } = make();
        s.schedule();
        vi.advanceTimersByTime(IDLE);
        expect(save).toHaveBeenCalledTimes(1);          // controllo positivo
        vi.advanceTimersByTime(CAP * 2);
        expect(save).toHaveBeenCalledTimes(1);
    });
});

describe('lo scheduler — il tetto sull\'attesa', () => {
    it('CONTROLLO POSITIVO: lavoro ininterrotto, il tetto spara comunque', () => {
        const { save, s } = make();
        // Un gesto ogni 5 s per sempre: la quiete non arriva mai.
        for (let t = 0; t < CAP; t += 5_000) { s.schedule(); vi.advanceTimersByTime(5_000); }
        expect(save).toHaveBeenCalledTimes(1);
    });

    it('il tetto NON si riarma a ogni gesto: se lo facesse sarebbe un secondo debounce', () => {
        const { save, s } = make();
        // Con un riarmo a ogni gesto, questa raffica non farebbe mai scattare il
        // tetto e il conteggio resterebbe 0.
        for (let t = 0; t < CAP - 5_000; t += 5_000) { s.schedule(); vi.advanceTimersByTime(5_000); }
        expect(save).toHaveBeenCalledTimes(0);
        s.schedule(); vi.advanceTimersByTime(5_000);
        expect(save).toHaveBeenCalledTimes(1);
    });

    it('il salvataggio di quiete disarma il tetto: non ne arriva un secondo', () => {
        const { save, s } = make();
        s.schedule();
        vi.advanceTimersByTime(IDLE);
        expect(save).toHaveBeenCalledTimes(1);          // controllo positivo
        vi.advanceTimersByTime(CAP);
        expect(save).toHaveBeenCalledTimes(1);
    });
});

describe('lo scheduler — flush e cancel', () => {
    it('CONTROLLO POSITIVO: `flush` con un\'attesa in corso salva subito', () => {
        const { save, s } = make();
        s.schedule();
        vi.advanceTimersByTime(1_000);
        expect(save).toHaveBeenCalledTimes(0);
        expect(s.flush()).toBe(true);
        expect(save).toHaveBeenCalledTimes(1);
    });

    it('`flush` senza attesa non salva e lo dichiara', () => {
        const { save, s } = make();
        expect(s.flush()).toBe(false);
        expect(save).toHaveBeenCalledTimes(0);
    });

    it('dopo `flush` i timer sono disarmati: nessun secondo salvataggio', () => {
        const { save, s } = make();
        s.schedule();
        s.flush();
        expect(save).toHaveBeenCalledTimes(1);          // controllo positivo
        vi.advanceTimersByTime(CAP * 2);
        expect(save).toHaveBeenCalledTimes(1);
    });

    it('il gesto fatto appena prima della chiusura non si perde (flush-on-unmount)', () => {
        // Il gesto e' a 14,9 s dalla scadenza: senza flush morirebbe con lo smontaggio.
        const { save, s } = make();
        s.schedule();
        vi.advanceTimersByTime(IDLE - 100);
        expect(save).toHaveBeenCalledTimes(0);
        s.flush();                                      // <- lo smontaggio
        expect(save).toHaveBeenCalledTimes(1);
    });

    it('`cancel` disarma senza salvare', () => {
        const { save, s } = make();
        s.schedule();
        expect(s.isPending()).toBe(true);               // controllo positivo
        s.cancel();
        expect(s.isPending()).toBe(false);
        vi.advanceTimersByTime(CAP * 2);
        expect(save).toHaveBeenCalledTimes(0);
    });
});

describe('i bordi — visibilitychange, pagehide, smontaggio (ESEGUITI)', () => {
    /** Un `window`/`document` finti che registrano davvero e sanno emettere. */
    const fakeEnv = () => {
        const listeners: Record<string, Array<(e?: any) => void>> = {};
        const target = {
            visibilityState: 'visible' as string,
            addEventListener: (t: string, f: any) => { (listeners[t] ??= []).push(f); },
            removeEventListener: (t: string, f: any) => {
                listeners[t] = (listeners[t] ?? []).filter((g) => g !== f);
            },
        };
        return {
            env: { win: target, doc: target },
            target,
            emit: (t: string) => { for (const f of [...(listeners[t] ?? [])]) f(); },
            count: (t: string) => (listeners[t] ?? []).length,
        };
    };

    it('CONTROLLO POSITIVO: i due listener vengono registrati e poi tolti', () => {
        const { s } = make();
        const f = fakeEnv();
        const dispose = installAutosaveEdgeGuards(s, f.env);
        expect(f.count('visibilitychange')).toBe(1);
        expect(f.count('pagehide')).toBe(1);
        dispose();
        expect(f.count('visibilitychange')).toBe(0);
        expect(f.count('pagehide')).toBe(0);
    });

    it('la pagina che va in background salva l\'attesa', () => {
        const { save, s } = make();
        const f = fakeEnv();
        installAutosaveEdgeGuards(s, f.env);
        s.schedule();
        vi.advanceTimersByTime(1_000);
        expect(save).toHaveBeenCalledTimes(0);
        f.target.visibilityState = 'hidden';
        f.emit('visibilitychange');
        expect(save).toHaveBeenCalledTimes(1);
    });

    it('la pagina che torna visibile NON salva: non e\' un bordo', () => {
        const { save, s } = make();
        const f = fakeEnv();
        installAutosaveEdgeGuards(s, f.env);
        s.schedule();
        f.target.visibilityState = 'visible';
        f.emit('visibilitychange');
        expect(save).toHaveBeenCalledTimes(0);
        f.target.visibilityState = 'hidden';
        f.emit('visibilitychange');
        expect(save).toHaveBeenCalledTimes(1);          // controllo positivo: era armato
    });

    it('`pagehide` salva l\'attesa', () => {
        const { save, s } = make();
        const f = fakeEnv();
        installAutosaveEdgeGuards(s, f.env);
        s.schedule();
        vi.advanceTimersByTime(2_000);
        f.emit('pagehide');
        expect(save).toHaveBeenCalledTimes(1);
    });

    it('LO SMONTAGGIO salva il gesto fatto un attimo prima (flush-on-unmount)', () => {
        const { save, s } = make();
        const f = fakeEnv();
        const dispose = installAutosaveEdgeGuards(s, f.env);
        s.schedule();
        vi.advanceTimersByTime(IDLE - 100);             // dentro la finestra, di poco
        expect(save).toHaveBeenCalledTimes(0);
        dispose();                                     // <- lo smontaggio
        expect(save).toHaveBeenCalledTimes(1);
    });

    it('lo smontaggio senza attesa non salva niente', () => {
        const { save, s } = make();
        const f = fakeEnv();
        installAutosaveEdgeGuards(s, f.env)();
        expect(save).toHaveBeenCalledTimes(0);
    });

    it('dopo lo smontaggio i listener sono muti e i timer disarmati', () => {
        const { save, s } = make();
        const f = fakeEnv();
        const dispose = installAutosaveEdgeGuards(s, f.env);
        s.schedule();
        dispose();
        expect(save).toHaveBeenCalledTimes(1);          // controllo positivo
        f.target.visibilityState = 'hidden';
        f.emit('visibilitychange');
        f.emit('pagehide');
        vi.advanceTimersByTime(CAP * 2);
        expect(save).toHaveBeenCalledTimes(1);
    });
});

describe('SAVE2 — le costanti di produzione', () => {
    it('il debounce dell\'hook e\' 15 s e il tetto 120 s', async () => {
        // Letto dal sorgente e non importato: `useLayoutAutosave.ts` tira dentro
        // `ProjectsApi` e la catena di `joiner`, che in `environment: node` non si
        // caricano. Controllo POSITIVO sotto, perche' una regex che non trova nulla
        // e un file che non contiene il difetto danno lo stesso silenzio.
        const fs = await import('node:fs');
        const url = await import('node:url');
        const path = url.fileURLToPath(new URL('../useLayoutAutosave.ts', import.meta.url));
        const src = fs.readFileSync(path, 'utf8');
        expect(src).toContain('AUTOSAVE_DEBOUNCE_MS');                 // controllo positivo
        expect(src).toMatch(/const AUTOSAVE_DEBOUNCE_MS = 15_000;/);
        expect(src).toMatch(/const AUTOSAVE_MAX_WAIT_MS = 120_000;/);
    });

    it('l\'hook copre i bordi: smontaggio, visibilitychange, pagehide', async () => {
        const fs = await import('node:fs');
        const url = await import('node:url');
        const path = url.fileURLToPath(new URL('../useLayoutAutosave.ts', import.meta.url));
        const src = fs.readFileSync(path, 'utf8');
        expect(src).toContain('createLayoutAutosaveScheduler');        // controllo positivo
        expect(src).toContain('installAutosaveEdgeGuards');            // bordi + flush
        expect(src).toContain('{ silent: true }');                     // e resta silenzioso
    });
});
