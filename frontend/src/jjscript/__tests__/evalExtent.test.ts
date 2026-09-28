/**
 * evalExtent — la restrizione dell'estensione, eseguita (R-VAL-16).
 *
 * Questo file ESEGUE il modulo, e puo' farlo perche' `evalExtent.ts` non importa
 * `joiner`. `eval.ts` si', quindi tocca `window` alla prima riga e nella suite —
 * `environment: 'node'` — non si importa: `context-binding.test.ts`, che ci prova, e' fra
 * i file rossi da sempre. La decisione sull'estensione vive in un modulo suo proprio per
 * questo, e questo file e' la ragione per cui vive li'.
 *
 * Le due asserzioni che contano sono asimmetriche di proposito:
 *
 *  - il ramo SENZA parametro e' il percorso di console, JjScript e Jjodie, e non deve
 *    cambiare di una virgola. Si verifica sull'IDENTITA' dell'array, non sul contenuto:
 *    un `toEqual` passerebbe anche su una copia, e una copia sarebbe gia' un cambiamento
 *    del percorso che si sta dichiarando immutato;
 *  - il ramo CON parametro restringe, e una restrizione che non trova niente restituisce
 *    l'insieme vuoto, non quello intero. Silenziosamente allargare al progetto sarebbe
 *    esattamente il difetto che R-VAL-16 chiude.
 */

import { describe, it, expect } from 'vitest';
import { selectExtentModels } from '../executor/commands/evalExtent';

const A = { id: 'Pointer_A', name: 'SM_A' };
const B = { id: 'Pointer_B', name: 'SM_B' };
const MODELS = [A, B];

describe('§A senza parametro: il percorso di sempre, immutato', () => {
    it('restituisce LO STESSO array, non una copia con lo stesso contenuto', () => {
        expect(selectExtentModels(MODELS)).toBe(MODELS);
        expect(selectExtentModels(MODELS, undefined)).toBe(MODELS);
        // La stringa vuota non e' una restrizione: e' l'assenza di una richiesta.
        expect(selectExtentModels(MODELS, '')).toBe(MODELS);
    });

    it('l\'estensione di default e\' quella di PROGETTO: tutti i modelli', () => {
        expect(selectExtentModels(MODELS).map(m => m.name)).toEqual(['SM_A', 'SM_B']);
    });
});

describe('§B con parametro: l\'estensione e\' un modello solo', () => {
    it('restituisce il solo modello richiesto', () => {
        expect(selectExtentModels(MODELS, 'Pointer_A')).toEqual([A]);
        expect(selectExtentModels(MODELS, 'Pointer_B')).toEqual([B]);
    });

    it('e conserva l\'identita\' degli elementi: le shell nascono ristrette, non ricostruite', () => {
        // Il vincolo di accettazione di R-VAL-16: `self.instanceOf == State` vale per
        // identita' di riferimento, quindi da qui devono uscire GLI STESSI oggetti.
        expect(selectExtentModels(MODELS, 'Pointer_A')[0]).toBe(A);
    });

    it('un id che nessun modello porta da\' l\'insieme VUOTO, non quello intero', () => {
        expect(selectExtentModels(MODELS, 'Pointer_INESISTENTE')).toEqual([]);
        // Controllo positivo (P12): la stessa chiamata con un id vero non e' vuota, quindi
        // il vuoto sopra e' una restrizione che ha agito e non una lista che era gia' vuota.
        expect(selectExtentModels(MODELS, 'Pointer_A')).toHaveLength(1);
    });

    it('regge su un elenco vuoto e su elementi senza id, senza lanciare', () => {
        expect(selectExtentModels([], 'Pointer_A')).toEqual([]);
        expect(selectExtentModels([{}, A] as any, 'Pointer_A')).toEqual([A]);
    });
});
