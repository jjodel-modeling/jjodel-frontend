/**
 * SAVE1 — un salvataggio, quattro chiamanti.
 *
 * SAVE1-bis ha aggiunto il quarto, la `SaveAndCloseProject` di «Save & Exit»,
 * che era la copia storica rimasta fuori dal perimetro di SAVE1. Con lei il
 * conteggio di «Request timed out» in `Navbar.tsx` va a ZERO, ed e' l'ultimo
 * blocco di §B a cambiare numero.
 *
 * Due meta' distinte, e la divisione non e' stilistica:
 *
 *  §A COMPORTAMENTO. `saveProject.tsx` e' un modulo che si puo' importare in
 *     `environment: node` una volta doppiati i suoi due soli import (`joiner`,
 *     `api/persistance`), quindi il timeout, gli alert e l'ordine delle
 *     scritture su `isLoading` sono asseriti ESEGUENDOLI, non leggendoli.
 *
 *  §B SORGENTE. I chiamanti no: `Navbar.tsx` e `InstanceManagerTab.tsx`
 *     tirano dentro il barrel di `editor-v2/`, che arriva a monaco, che
 *     dereferenzia `window` all'import — la necessita' misurata in 10c, di cui
 *     l'intestazione di `instanceManager10k.test.ts` porta il verbale. Li' le
 *     asserzioni sono sul testo del sorgente.
 *
 * Ogni blocco di §B apre con un controllo POSITIVO: una regex che non trova
 * niente e una lettura che non e' avvenuta danno lo stesso silenzio
 * (CLAUDE.md §5, «un'asserzione di assenza richiede la prova che la ricerca sia
 * girata»).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const setRootField = vi.fn();
const alert = vi.fn();
const save = vi.fn();

vi.mock('../../../joiner', () => ({
    SetRootFieldAction: { new: (...args: any[]) => setRootField(...args) },
    U: { alert: (...args: any[]) => alert(...args) },
}));
vi.mock('../../../api/persistance', () => ({
    ProjectsApi: { save: (...args: any[]) => save(...args) },
}));

import { SAVE_TIMEOUT_MS, saveProjectWithFeedback } from '../saveProject';

/** I valori passati a `SetRootFieldAction.new('isLoading', X)`, nell'ordine. */
const loadingCalls = () =>
    setRootField.mock.calls.filter(c => c[0] === 'isLoading').map(c => c[1]);

const PROJECT = { id: 'prj_1', name: 'P' } as any;

beforeEach(() => {
    setRootField.mockClear();
    alert.mockClear();
    save.mockReset();
});

describe('§A saveProjectWithFeedback — il salvataggio', () => {
    it('salva IL PROGETTO RICEVUTO, e accende e spegne lo spinner in quest\'ordine', async () => {
        save.mockResolvedValue({});
        const ok = await saveProjectWithFeedback(PROJECT);

        expect(ok).toBe(true);
        expect(save).toHaveBeenCalledTimes(1);
        expect(save).toHaveBeenCalledWith(PROJECT);
        expect(loadingCalls()).toEqual([true, false]);
        expect(alert).not.toHaveBeenCalled();
    });

    it('senza progetto non salva e non accende niente', async () => {
        const ok = await saveProjectWithFeedback(undefined);

        expect(ok).toBe(false);
        expect(save).not.toHaveBeenCalled();
        expect(loadingCalls()).toEqual([]);   // ne' true ne' false: non e' passato di qui
        expect(alert).not.toHaveBeenCalled();
    });

    it('sul fallimento: alert dell\'errore, spinner spento — la meta\' che al menu mancava', async () => {
        save.mockRejectedValue(new Error('backend down'));
        const ok = await saveProjectWithFeedback(PROJECT);

        expect(ok).toBe(false);
        expect(alert).toHaveBeenCalledTimes(1);
        expect(alert.mock.calls[0][0]).toBe('e');
        expect(alert.mock.calls[0][1]).toBe('Error while Saving Project');
        expect(alert.mock.calls[0][2]).toBe('backend down');
        // La voce di menu di prima lasciava `isLoading` a `true` per sempre.
        expect(loadingCalls()).toEqual([true, false]);
    });

    it('un errore NON lascia dietro il timer: niente «Request timed out» dieci secondi dopo', async () => {
        vi.useFakeTimers();
        try {
            save.mockRejectedValue(new Error('backend down'));
            await saveProjectWithFeedback(PROJECT);
            alert.mockClear();
            setRootField.mockClear();

            await vi.advanceTimersByTimeAsync(SAVE_TIMEOUT_MS * 2);

            expect(alert).not.toHaveBeenCalled();
            expect(loadingCalls()).toEqual([]);
        } finally {
            vi.useRealTimers();
        }
    });

    it('oltre SAVE_TIMEOUT_MS: alert di timeout e spinner spento — la meta\' che alla scorciatoia mancava', async () => {
        vi.useFakeTimers();
        try {
            save.mockReturnValue(new Promise(() => {}));   // non risolve mai
            void saveProjectWithFeedback(PROJECT);

            await vi.advanceTimersByTimeAsync(SAVE_TIMEOUT_MS - 1);
            expect(alert).not.toHaveBeenCalled();          // controllo positivo del bordo

            await vi.advanceTimersByTimeAsync(1);
            expect(alert).toHaveBeenCalledTimes(1);
            expect(alert.mock.calls[0][0]).toBe('e');
            expect(alert.mock.calls[0][1]).toBe('Request timed out');
            expect(loadingCalls()).toEqual([true, false]);
        } finally {
            vi.useRealTimers();
        }
    });

    it('non tocca `isProjectModified`: lo azzera gia\' `ProjectsApi.save`', () => {
        const SRC = readFileSync(resolve(__dirname, '../saveProject.tsx'), 'utf8');
        expect(SRC).toContain('ProjectsApi.save');            // controllo positivo
        expect(SRC).not.toContain('U.isProjectModified =');
    });
});

// ── §B I quattro chiamanti ───────────────────────────────────────────────────

const NAVBAR_SRC = readFileSync(resolve(__dirname, '../../../pages/components/Navbar.tsx'), 'utf8');
const TAB_SRC = readFileSync(
    resolve(__dirname, '../../../components/abstract/tabs/InstanceManagerTab.tsx'), 'utf8');
const SCSS = readFileSync(
    resolve(__dirname, '../../../components/abstract/tabs/instanceManagerTab.scss'), 'utf8');

/** Il sorgente senza i commenti — l'idioma di `instanceManager10k.test.ts`, e qui
 *  e' obbligatorio, non igiene: i commenti di SAVE1 CITANO per esteso cio' che la
 *  slice non fa (`disabled={!U.isProjectModified}`, `ProjectsApi.save`, il blocco
 *  di timeout in Navbar), e una regex che leggesse anche loro non distinguerebbe
 *  «rimossa e documentata» da «ancora li'». Misurato: senza questo, tre delle
 *  asserzioni di §B sono rosse sui propri commenti. Nella stessa famiglia il
 *  vecchio `matchesShortcut(event, SHORTCUTS.CLOSE)` commentato a Navbar:999, che
 *  precede il blocco SAVE e ne troncherebbe la fetta a zero caratteri. */
const strip = (src: string) => src
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/.*$/gm, '');
const NAVBAR = strip(NAVBAR_SRC);
const TAB = strip(TAB_SRC);
/** L'helper, senza commenti: la sua intestazione CITA «Request timed out» per
 *  raccontare il difetto che chiudeva, e un conteggio che leggesse anche il
 *  commento direbbe due dove il prodotto ne ha una. */
const HELPER = strip(readFileSync(resolve(__dirname, '../saveProject.tsx'), 'utf8'));

describe('§B Navbar — menu File, Ctrl/Cmd+S e «Save & Exit» passano dall\'helper', () => {
    it('lo importa e lo chiama tre volte: menu, scorciatoia, «Save & Exit»', () => {
        expect(NAVBAR).toContain("from '../../common/libraries/saveProject'");
        // Due con SAVE1 (la voce di menu e Ctrl/Cmd+S), la terza con SAVE1-bis
        // (`SaveAndCloseProject`). Tutte e tre passano il proprio `project`.
        expect(NAVBAR.match(/saveProjectWithFeedback\(project\)/g)?.length).toBe(3);
    });

    it('la voce «Save Project» non ha piu\' un salvataggio suo', () => {
        const i = NAVBAR.indexOf("{name: 'Save Project'");
        expect(i).toBeGreaterThan(-1);                        // controllo positivo
        const item = NAVBAR.slice(i, NAVBAR.indexOf('shortcutPills', i));
        expect(item).toContain('saveProjectWithFeedback');
        expect(item).not.toContain('ProjectsApi.save');
        expect(item).not.toContain('Request timed out');
    });

    it('la scorciatoia SAVE non ha piu\' un salvataggio suo', () => {
        const i = NAVBAR.indexOf('matchesShortcut(event, SHORTCUTS.SAVE)');
        expect(i).toBeGreaterThan(-1);                        // controllo positivo
        const block = NAVBAR.slice(i, NAVBAR.indexOf('SHORTCUTS.CLOSE', i));
        expect(block).toContain('saveProjectWithFeedback');
        expect(block).not.toContain('ProjectsApi.save');
    });

    it('in Navbar non resta NESSUNA copia del blocco di timeout: l\'unica e\' nell\'helper', () => {
        // SAVE1 lasciava fuori `SaveAndCloseProject`, l'ultima copia storica, e
        // il conteggio qui era 1. SAVE1-bis la fa passare dall'helper: va a 0.
        //
        // Controllo positivo, obbligatorio prima di un'asserzione di assenza
        // (CLAUDE.md §5): il file e' stato letto davvero, e le tre funzioni che
        // salvavano in proprio sono ancora tutte al loro posto — e' solo il loro
        // salvataggio a essere passato altrove.
        expect(NAVBAR).toContain('const SaveAndCloseProject');
        expect(NAVBAR).toContain('matchesShortcut(event, SHORTCUTS.SAVE)');
        expect(NAVBAR).toContain("{name: 'Save Project'");

        expect(NAVBAR.match(/Request timed out/g)?.length ?? 0).toBe(0);
        // ...e non e' sparita dal prodotto: vive nell'helper, una volta sola.
        expect(HELPER.match(/Request timed out/g)?.length).toBe(1);
    });

    it('«Save & Exit» salva dall\'helper, e sul fallimento non chiude', () => {
        const i = NAVBAR.indexOf('const SaveAndCloseProject');
        expect(i).toBeGreaterThan(-1);                        // controllo positivo
        const block = NAVBAR.slice(i, NAVBAR.indexOf('function placeholder', i));
        expect(block.length).toBeGreaterThan(0);              // la fetta non e' vuota

        expect(block).toContain('saveProjectWithFeedback(project)');
        expect(block).not.toContain('ProjectsApi.save');
        expect(block).not.toContain('SetRootFieldAction');
        // La riscrittura di `U.isProjectModified` sparisce: la fa gia'
        // `ProjectsApi.save`, e subito dopo `CloseProject`.
        expect(block).not.toContain('U.isProjectModified =');

        // Il contratto che il prompt chiede di preservare: errore -> niente
        // chiusura. Il `return` del ramo negativo precede l'unica `CloseProject()`.
        expect(block).toContain('if (!saved) return;');
        expect(block.indexOf('if (!saved) return;'))
            .toBeLessThan(block.indexOf('await CloseProject()'));
        expect(block).toContain('await CloseProject()');
        // ...e la chiusura e' dentro la funzione, non nel ramo dell'`if`.
        expect(block.indexOf('await CloseProject()'))
            .toBeGreaterThan(block.indexOf('U.disableUnsavedChangesWarning()'));
    });
});

describe('§B InstanceManagerTab — il bottone in testata', () => {
    it('e\' nella testata, prima di Export, e chiama l\'helper', () => {
        const head = TAB.indexOf('instance-manager__head-actions');
        expect(head).toBeGreaterThan(-1);                     // controllo positivo
        const region = TAB.slice(head, TAB.indexOf('</header>', head));

        expect(region).toContain('instance-manager__save');
        expect(region).toContain('Save project');
        expect(region).toContain('bi bi-floppy');
        expect(region.indexOf('instance-manager__save'))
            .toBeLessThan(region.indexOf('instance-manager__export'));
        expect(region.indexOf('instance-manager__export'))
            .toBeLessThan(region.indexOf('instance-manager__new'));
    });

    it('non duplica il salvataggio: passa dall\'helper, e il progetto lo risolve come SaveManager', () => {
        expect(TAB).toContain("from '../../../common/libraries/saveProject'");
        expect(TAB).toContain('saveProjectWithFeedback(LProject.getProject())');
        expect(TAB).not.toContain('ProjectsApi.save');
        expect(TAB).not.toContain('Request timed out');
    });

    it('si spegne SOLO durante il salvataggio, e non su una nozione di sporco', () => {
        expect(TAB).toContain('disabled={saving}');           // controllo positivo
        // Il flag e' uno static non sottoscrivibile (commento di `saving`):
        // leggerlo qui darebbe un bottone spento a progetto sporco.
        expect(TAB).not.toContain('disabled={!U.isProjectModified}');
        expect(TAB).not.toContain('isProjectModified()');
    });

    it('il foglio veste Save con la regola di Export, e gli da\' lo stato spento', () => {
        const i = SCSS.indexOf('&__save,');
        expect(i).toBeGreaterThan(-1);                        // controllo positivo
        const block = SCSS.slice(i, SCSS.indexOf('\n    }', i));
        expect(block).toContain('&__export {');
        expect(block).toMatch(/&:disabled\s*\{[^}]*opacity:\s*0\.4/);
        expect(block).toContain('&:hover:not(:disabled)');
        expect(SCSS).toContain('.instance-manager__save { margin-left: 0; }');
    });
});
