/**
 * SAVE2 — l'indicatore dell'ultimo salvataggio.
 *
 * Due cose si misurano qui, e sono separate:
 *
 *  1. il MODULO: che `markProjectSaved` registri il timestamp ed emetta l'evento,
 *     sia sul salvataggio esplicito sia su quello silenzioso. Eseguito, con un
 *     `window` fittizio che raccoglie i `dispatchEvent`.
 *  2. il CONSUMO nella testata: che l'indicatore ci sia davvero, che legga
 *     `U.isProjectModified` per il dirty e che riusi `formatRelativeTime` invece di
 *     scriverne un quinto. Questo si legge dal sorgente perche' il componente non e'
 *     montabile (niente jsdom, niente `@testing-library`) — e ogni lettura del
 *     sorgente porta con se' il suo controllo POSITIVO, perche' una regex che non
 *     trova nulla e un file che non contiene il difetto danno lo stesso silenzio
 *     (CLAUDE.md §5).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const events: Array<{ type: string; detail: any }> = [];
(globalThis as any).CustomEvent = (globalThis as any).CustomEvent ?? class {
    constructor(public type: string, public init?: any) {}
    get detail() { return this.init?.detail; }
};
(globalThis as any).window = (globalThis as any).window ?? {};
(globalThis as any).window.dispatchEvent = (e: any) => { events.push({ type: e.type, detail: e.detail ?? e.init?.detail }); return true; };

const { markProjectSaved, clearLastSaved, getLastSavedAt, LAST_SAVED_TICK_MS } =
    await import('../lastSaved');
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

describe('lastSaved — il consumo nella testata', () => {
    it('CONTROLLO POSITIVO: la testata ha il bottone di salvataggio da cui partiamo', async () => {
        const src = await readSrc('../../../components/abstract/tabs/InstanceManagerTab.tsx');
        expect(src).toContain('instance-manager__save');
    });

    it('l\'indicatore c\'e\', accanto al bottone', async () => {
        const src = await readSrc('../../../components/abstract/tabs/InstanceManagerTab.tsx');
        expect(src).toContain('instance-manager__last-saved');
        expect(src).toContain('useLastSaved');
    });

    it('riusa `formatRelativeTime` e non ne scrive un quinto', async () => {
        const src = await readSrc('../../../components/abstract/tabs/InstanceManagerTab.tsx');
        expect(src).toContain("import { formatRelativeTime } from '../../../types/activity'");
        // Nessuna soglia di tempo riscritta a mano nel componente: ne' un
        // formatter suo, ne' i literal che uno scriverebbe. Il testo «just now»
        // compare solo dentro un commento, mai come stringa di codice.
        expect(src).not.toMatch(/['"`]just now['"`]/);
        expect(src).not.toMatch(/const\s+formatRelativeTime/);
        expect(src).not.toMatch(/\bd ago\b/);
    });

    it('il dirty e\' `U.isProjectModified`, non un secondo flag', async () => {
        const src = await readSrc('../../../components/abstract/tabs/InstanceManagerTab.tsx');
        expect(src).toContain('isProjectModified');     // controllo positivo
        expect(src).toMatch(/Unsaved, last saved/);
        // La coppia «Unsaved changes» non deve tornare in questo file: la vieta la
        // deviazione A3 di 10c, e il presidio sta li' — `instanceManager10c.test.ts`,
        // che legge il sorgente SENZA commenti ed e' l'unico posto in cui quella
        // negativa e' esprimibile senza inciampare negli apostrofi dell'italiano.
        // Qui non si duplica: si asserisce la forma positiva dell'etichetta.
        expect(src).not.toMatch(/const \[dirty/);
        expect(src).not.toMatch(/setDirty\(/);
    });

    it('nessun colore semantico e nessuna emoji nello stile dell\'indicatore', async () => {
        const scss = await readSrc('../../../components/abstract/tabs/instanceManagerTab.scss');
        expect(scss).toContain('&__last-saved');        // controllo positivo
        const block = scss.slice(scss.indexOf('&__last-saved'), scss.indexOf('&__last-saved') + 400);
        expect(block).toContain('var(--color-form-muted)');
        expect(block).not.toMatch(/green|--color-success|--accent\b/);
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
