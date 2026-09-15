/**
 * optionColor — una tinta per alternativa.
 *
 * La regola che questi test pinnano e' una sola: due opzioni fra cui l'utente sta
 * scegliendo non portano mai lo stesso colore. Tutto il resto (la ciclatura oltre la
 * settima, il `null` per un valore non offerto, la stabilita' sotto filtro) sono i modi
 * in cui quella regola puo' rompersi.
 *
 * Quello che questi test NON possono dire, e che la sonda dice: che i sette colori si
 * distinguano DAVVERO a schermo. La separazione e' misurata col validatore del metodo
 * dataviz e le cifre stanno accanto ai valori, in `styles/tokens/_colors-light.scss`.
 * Qui si asserisce l'assegnazione, non la percezione.
 *
 * Ogni blocco apre con un controllo POSITIVO: una funzione che ritornasse sempre `null`
 * passerebbe tutti i casi negativi e nessuno se ne accorgerebbe (CLAUDE.md §5).
 */

import { describe, expect, it } from 'vitest';

import {
    OPTION_COLOR_SLOTS,
    optionSlot,
    optionSlotClass,
    type OptionGroupLike,
} from '../optionColor';

/** Un gruppo di `n` opzioni, con valori prevedibili. */
const group = (n: number, prefix = 'v'): OptionGroupLike => ({
    options: Array.from({ length: n }, (_, i) => ({ value: `${prefix}${i}` })),
});

describe('il modulo risponde, e la palette e\' quella dichiarata', () => {
    it('positivo di controllo: una lista non vuota assegna uno slot', () => {
        expect(optionSlot([group(3)], 'v0')).toBe(1);
        expect(optionSlot([group(3)], 'v2')).toBe(3);
    });

    it('gli slot dichiarati sono sette, quanti i token `--color-opt-N-*`', () => {
        expect(OPTION_COLOR_SLOTS).toBe(7);
    });
});

describe('due alternative non portano mai lo stesso colore', () => {
    it('positivo di controllo: sette opzioni danno sette slot distinti', () => {
        const g = [group(7)];
        const slots = g[0].options.map(o => optionSlot(g, o.value));
        expect(new Set(slots).size).toBe(7);
        expect(slots).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    it('l\'indice attraversa i gruppi: il colore non dipende da dove l\'opzione sta', () => {
        const g = [group(3, 'a'), group(3, 'b')];
        expect(optionSlot(g, 'a0')).toBe(1);
        expect(optionSlot(g, 'a2')).toBe(3);
        expect(optionSlot(g, 'b0')).toBe(4);   // e non di nuovo 1
        expect(optionSlot(g, 'b2')).toBe(6);
    });

    it('in una finestra di sette consecutive non ci sono ripetizioni, anche oltre la settima', () => {
        const g = [group(30)];
        const slots = g[0].options.map(o => optionSlot(g, o.value)!);
        for (let i = 0; i + OPTION_COLOR_SLOTS <= slots.length; i++) {
            const window = slots.slice(i, i + OPTION_COLOR_SLOTS);
            expect(new Set(window).size, `finestra a ${i}: ${window.join(',')}`).toBe(OPTION_COLOR_SLOTS);
        }
    });
});

describe('oltre la settima il colore cicla, e il costo e\' dichiarato', () => {
    it('l\'ottava opzione riprende lo slot 1', () => {
        const g = [group(9)];
        expect(optionSlot(g, 'v7')).toBe(1);
        expect(optionSlot(g, 'v8')).toBe(2);
    });

    it('nessuna opzione resta senza colore: una lista lunga non ha slot nulli', () => {
        const g = [group(30)];
        expect(g[0].options.every(o => optionSlot(g, o.value) !== null)).toBe(true);
    });

    it('lo slot sta sempre nell\'intervallo dei token', () => {
        const g = [group(50)];
        for (const o of g[0].options) {
            const slot = optionSlot(g, o.value)!;
            expect(slot).toBeGreaterThanOrEqual(1);
            expect(slot).toBeLessThanOrEqual(OPTION_COLOR_SLOTS);
        }
    });
});

describe('cio\' che non e\' un\'alternativa non prende colore', () => {
    it('positivo di controllo: lo stesso valore, offerto, lo prende', () => {
        expect(optionSlot([group(3)], 'v1')).toBe(2);
    });

    it('un valore fuori dalla lista da\' `null`, non lo slot 1', () => {
        expect(optionSlot([group(3)], 'sconosciuto')).toBeNull();
    });

    it('lista assente, vuota, o valore assente: `null`', () => {
        expect(optionSlot(undefined, 'v0')).toBeNull();
        expect(optionSlot(null, 'v0')).toBeNull();
        expect(optionSlot([], 'v0')).toBeNull();
        expect(optionSlot([{ options: [] }], 'v0')).toBeNull();
        expect(optionSlot([group(3)], '')).toBeNull();
        expect(optionSlot([group(3)], null)).toBeNull();
    });

    it('un gruppo senza `options` non fa cadere il conteggio degli altri', () => {
        const g = [{ options: undefined } as unknown as OptionGroupLike, group(2)];
        expect(optionSlot(g, 'v0')).toBe(1);
        expect(optionSlot(g, 'v1')).toBe(2);
    });
});

describe('il colore segue l\'opzione, non la sua posizione fra i risultati', () => {
    it('filtrare la lista mostrata non cambia lo slot: si legge sempre dalle opzioni intere', () => {
        const all = [group(7)];
        const shown = all[0].options.filter(o => o.value !== 'v0' && o.value !== 'v1');
        // Il chiamante disegna `shown`, ma interroga `all`: e' il contratto del picker.
        for (const o of shown) {
            expect(optionSlot(all, o.value)).toBe(optionSlot(all, o.value));
        }
        expect(optionSlot(all, 'v2')).toBe(3);          // terza in assoluto
        expect(shown[0].value).toBe('v2');              // ma prima fra i risultati
    });
});

describe('la classe che il componente compone', () => {
    it('positivo di controllo: uno slot vero produce il modificatore', () => {
        expect(optionSlotClass('ir-ref__badge', 3)).toBe(' ir-ref__badge--slot-3');
    });

    it('nessuno slot produce la stringa vuota, non `undefined` ne\' uno spazio', () => {
        expect(optionSlotClass('ir-ref__badge', null)).toBe('');
    });

    it('lo spazio iniziale c\'e\', cosi\' la concatenazione non incolla due classi', () => {
        expect(`base${optionSlotClass('base', 2)}`).toBe('base base--slot-2');
    });
});
