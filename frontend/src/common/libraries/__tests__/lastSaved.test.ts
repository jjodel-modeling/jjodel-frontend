/**
 * SAVE2 — l'indicatore dell'ultimo salvataggio.
 *
 * Due cose si misurano qui, e sono separate:
 *
 *  1. il MODULO: che `markProjectSaved` registri il timestamp ed emetta l'evento,
 *     sia sul salvataggio esplicito sia su quello silenzioso. Eseguito, con un
 *     `window` fittizio che raccoglie i `dispatchEvent`.
 *  2. il CONSUMO: l'etichetta e la sottoscrizione.
 *
 * DOC2 riscrive il punto 2, e va detto perche'. SAVE2 lo misurava LEGGENDO il
 * sorgente di `InstanceManagerTab.tsx` — «il file contiene `useLastSaved`», «il file
 * contiene `Unsaved, last saved`». E' esattamente il difetto che P11 norma: quelle
 * asserzioni restano verdi con la logica rotta, e sono rimaste verdi anche quando
 * l'indicatore era montato nella tab sbagliata. Ora l'etichetta e la sottoscrizione
 * sono due funzioni esportate da `lastSaved.ts` (`formatLastSavedLabel`,
 * `subscribeLastSaved`) e il test le ESEGUE: senza jsdom un hook non e' montabile,
 * una funzione lo e'.
 *
 * Resta una lettura di sorgente sola, dichiarata come tale: che la topbar monti il
 * componente. E' una verifica di CABLAGGIO, non di comportamento — il comportamento
 * e' misurato dalle due funzioni qui sotto e dalla sonda di smoke — e porta con se'
 * il suo controllo positivo, perche' una regex che non trova nulla e un file che non
 * contiene il difetto danno lo stesso silenzio (CLAUDE.md §5).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const events: Array<{ type: string; detail: any }> = [];
(globalThis as any).CustomEvent = (globalThis as any).CustomEvent ?? class {
    constructor(public type: string, public init?: any) {}
    get detail() { return this.init?.detail; }
};
(globalThis as any).window = (globalThis as any).window ?? {};
(globalThis as any).window.dispatchEvent = (e: any) => { events.push({ type: e.type, detail: e.detail ?? e.init?.detail }); return true; };

const { markProjectSaved, clearLastSaved, getLastSavedAt, LAST_SAVED_TICK_MS,
        formatLastSavedLabel, subscribeLastSaved } = await import('../lastSaved');
const { JjodelEvents } = await import('../../../events/registry');

beforeEach(() => { events.length = 0; clearLastSaved(); events.length = 0; });

describe('lastSaved — il modulo', () => {
    it('CONTROLLO POSITIVO: `markProjectSaved` registra ed emette', () => {
        markProjectSaved(1_700_000_000_000);
        expect(getLastSavedAt()).toBe(1_700_000_000_000);
        expect(events.length).toBe(1);
    });

    it('l\'evento e\' quello del registro, non una stringa a mano (regola 25)', () => {
        markProjectSaved(42);
        expect(events[0].type).toBe(JjodelEvents.PROJECT_SAVED);
        expect(JjodelEvents.PROJECT_SAVED).toBe('jjodel:project-saved');
    });

    it('l\'ultimo salvataggio vince: due scritture, il secondo timestamp', () => {
        markProjectSaved(100);
        markProjectSaved(200);
        expect(events.length).toBe(2);                  // controllo positivo
        expect(getLastSavedAt()).toBe(200);
    });

    it('`clearLastSaved` azzera e lo dice', () => {
        markProjectSaved(100);
        expect(getLastSavedAt()).toBe(100);             // controllo positivo
        events.length = 0;
        clearLastSaved();
        expect(getLastSavedAt()).toBeNull();
        expect(events.length).toBe(1);
        expect(events[0].detail?.timestamp).toBeNull();
    });

    it('il tick e\' dichiarato ed e\' un periodo, non zero', () => {
        expect(LAST_SAVED_TICK_MS).toBeGreaterThan(0);
        expect(LAST_SAVED_TICK_MS).toBeLessThanOrEqual(60_000);
    });
});

const readSrc = async (rel: string): Promise<string> => {
    const fs = await import('node:fs');
    const url = await import('node:url');
    return fs.readFileSync(url.fileURLToPath(new URL(rel, import.meta.url)), 'utf8');
};

describe('lastSaved — l\'etichetta, ESEGUITA', () => {
    it('CONTROLLO POSITIVO: a progetto pulito e appena salvato dice cosi\'', () => {
        expect(formatLastSavedLabel(Date.now(), false)).toBe('Saved just now');
    });

    it('il tempo relativo lo fa `formatRelativeTime`, non un formatter nuovo', () => {
        // Due minuti fa: la frase cambia perche' cambia la sorgente del tempo,
        // non perche' l'etichetta abbia soglie sue.
        expect(formatLastSavedLabel(Date.now() - 2 * 60_000, false)).toBe('Saved 2m ago');
        expect(formatLastSavedLabel(Date.now() - 3 * 3600_000, false)).toBe('Saved 3h ago');
    });

    it('lo stato sporco AFFIANCA l\'ultimo salvataggio, non lo cancella', () => {
        const label = formatLastSavedLabel(Date.now(), true);
        expect(label).toBe('Unsaved, last saved just now');
        expect(label).toContain('just now');          // il salvataggio non e' sparito
    });

    it('sporco senza nessun salvataggio in questa sessione: solo «Unsaved»', () => {
        expect(formatLastSavedLabel(null, true)).toBe('Unsaved');
    });

    it('la coppia vietata da A3 non compare in nessuno dei quattro casi', () => {
        for (const l of [formatLastSavedLabel(Date.now(), false),
                         formatLastSavedLabel(Date.now(), true),
                         formatLastSavedLabel(null, true),
                         formatLastSavedLabel(null, false)]) {
            if (l) expect(l).not.toContain('Unsaved changes');
        }
    });

    it('niente da raccontare: nessuna etichetta, quindi nessun elemento', () => {
        expect(formatLastSavedLabel(null, false)).toBeNull();
    });
});

describe('lastSaved — la sottoscrizione, ESEGUITA', () => {
    // Un `window` fittizio con un vero registro di listener: quello del preambolo
    // ha solo `dispatchEvent`, e qui serve anche l'iscrizione.
    const listeners = new Map<string, Set<Function>>();
    const w = (globalThis as any).window;
    const prevAdd = w.addEventListener, prevRemove = w.removeEventListener, prevDispatch = w.dispatchEvent;

    beforeEach(() => {
        listeners.clear();
        vi.useFakeTimers();
        w.addEventListener = (t: string, f: Function) => {
            if (!listeners.has(t)) listeners.set(t, new Set());
            listeners.get(t)!.add(f);
        };
        w.removeEventListener = (t: string, f: Function) => { listeners.get(t)?.delete(f); };
        w.dispatchEvent = (e: any) => {
            events.push({ type: e.type, detail: e.detail ?? e.init?.detail });
            for (const f of listeners.get(e.type) ?? []) (f as any)(e);
            return true;
        };
    });

    afterEach(() => {
        vi.useRealTimers();
        w.addEventListener = prevAdd; w.removeEventListener = prevRemove; w.dispatchEvent = prevDispatch;
    });

    it('MUTAZIONE 1 — il salvataggio sveglia l\'indicatore (togli il listener e questo cade)', () => {
        let calls = 0;
        const off = subscribeLastSaved(() => { calls++; });
        expect(listeners.get(JjodelEvents.PROJECT_SAVED)?.size).toBe(1);   // controllo positivo
        markProjectSaved(1_700_000_000_000);
        expect(calls).toBe(1);
        expect(getLastSavedAt()).toBe(1_700_000_000_000);
        off();
    });

    it('MUTAZIONE 2 — il testo si aggiorna da solo (togli il tick e questo cade)', () => {
        let calls = 0;
        const off = subscribeLastSaved(() => { calls++; });
        expect(calls).toBe(0);                                             // controllo positivo
        vi.advanceTimersByTime(LAST_SAVED_TICK_MS * 3);
        expect(calls).toBe(3);
        off();
    });

    it('allo smontaggio si spengono ENTRAMBI: nessun timer, nessun listener', () => {
        let calls = 0;
        const off = subscribeLastSaved(() => { calls++; });
        markProjectSaved(1);
        vi.advanceTimersByTime(LAST_SAVED_TICK_MS);
        expect(calls).toBe(2);                                             // controllo positivo
        off();
        expect(listeners.get(JjodelEvents.PROJECT_SAVED)?.size ?? 0).toBe(0);
        markProjectSaved(2);
        vi.advanceTimersByTime(LAST_SAVED_TICK_MS * 5);
        expect(calls).toBe(2);
    });
});

describe('lastSaved — dove e\' montato (cablaggio, letto dal sorgente)', () => {
    it('CONTROLLO POSITIVO: la topbar esiste ed e\' quella che stiamo leggendo', async () => {
        const src = await readSrc('../../../pages/components/Navbar.tsx');
        expect(src).toContain("id={'navbar'}");
    });

    it('la topbar monta l\'indicatore', async () => {
        const src = await readSrc('../../../pages/components/Navbar.tsx');
        expect(src).toContain('LastSavedIndicator');
        expect(src).toContain("from \"../../components/topbar/LastSavedIndicator\"");
    });

    it('una sola resa: il Data Manager non lo monta piu\'', async () => {
        const src = await readSrc('../../../components/abstract/tabs/InstanceManagerTab.tsx');
        expect(src).toContain('instance-manager__save');           // controllo positivo: e' il file giusto
        expect(src).not.toContain('<span className="instance-manager__last-saved"');
        expect(src).not.toContain('useLastSaved(');
    });

    it('il componente riusa `formatLastSavedLabel` e non ne scrive un secondo', async () => {
        const src = await readSrc('../../../components/topbar/LastSavedIndicator.tsx');
        expect(src).toContain('formatLastSavedLabel');             // controllo positivo
        expect(src).toContain('isProjectModified');
        expect(src).not.toMatch(/['"`]just now['"`]/);
        expect(src).not.toMatch(/const\s+formatRelativeTime/);
    });

    it('nessun colore semantico e nessuna emoji nello stile dell\'indicatore', async () => {
        const scss = await readSrc('../../../pages/components/navbar.scss');
        expect(scss).toContain('.appbar-last-saved');              // controllo positivo
        const block = scss.slice(scss.indexOf('.appbar-last-saved'), scss.indexOf('.appbar-last-saved') + 300);
        expect(block).toContain('var(--color-text-tertiary)');
        expect(block).toContain('font-size: 11px');
        expect(block).not.toMatch(/green|--color-success|--accent\b|background/);
    });
});

describe('lastSaved — chi lo scrive', () => {
    it('CONTROLLO POSITIVO: `projects.ts` importa il modulo', async () => {
        const src = await readSrc('../../../api/persistance/projects.ts');
        expect(src).toContain('markProjectSaved');
    });

    it('nessun campo nuovo sul progetto: si usa `lastModified`', async () => {
        const src = await readSrc('../../../api/persistance/projects.ts');
        expect(src).toContain('markProjectSaved(dProject.lastModified)');
    });

    it('non e\' una scrittura in Redux: nessuna SetFieldAction su `lastModified` nel save', async () => {
        const src = await readSrc('../../../api/persistance/projects.ts');
        const save = src.slice(src.indexOf('static async save(project: LProject'),
                               src.indexOf('static async favorite(project: DProject)'));
        expect(save).toContain('markProjectSaved');     // controllo positivo: e' la regione giusta
        expect(save).not.toMatch(/SetFieldAction\.new\([^)]*'lastModified'/);
    });
});
