import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * `EcoreParser.parse` e la finestra in cui `Constructors.paused` e' alzato (api/data.ts).
 *
 * Perche' statiche e non di comportamento: `api/data.ts` non e' importabile sotto vitest —
 * tira dentro la barrel `joiner`, che lega `window` a livello di modulo, mentre l'ambiente
 * di `vitest.config.ts` e' `node`. Stessa ragione e stessa forma di
 * `joiner/__tests__/dTypedElement.test.ts` e `model/__tests__/getTypeFallback.test.ts`.
 *
 * La prova di comportamento e' la sonda del referto
 * `docs/discovery/discovery_2026-08-30_gettype_finestra_parser.md` §5: un `.ecore` con un
 * `eType` irrisolvibile lasciava `paused === true` per il resto della sessione, e ogni
 * elemento creato dopo restava non committato **in silenzio**.
 */

const DATA_TS = path.resolve(__dirname, '../data.ts');
const CLASSES_TS = path.resolve(__dirname, '../../joiner/classes.ts');

const source = fs.readFileSync(DATA_TS, 'utf8');

/** Il corpo della sola `EcoreParser.parse`, dalla firma alla `fixObjectPointers` che la segue. */
function parseBody(): string {
    const start = source.indexOf('    static parse(ecorejson: GObject | string | null, isMetamodel: boolean');
    expect(start, 'la firma di EcoreParser.parse e\' cambiata: aggiorna il test').toBeGreaterThan(-1);
    const next = source.indexOf('\n    private static fixObjectPointers(', start);
    expect(next, 'il metodo che segue parse e\' cambiato: aggiorna il test').toBeGreaterThan(start);
    return source.slice(start, next);
}

describe('EcoreParser.parse — `paused` torna giu\' anche quando la parse solleva', () => {
    it('il flag viene abbassato in un `finally`', () => {
        expect(parseBody()).toMatch(/\}\s*finally\s*\{\s*\n\s*Constructors\.paused = false;\s*\n\s*\}/);
    });

    it('non lo abbassa da nessun\'altra parte', () => {
        // Una sola discesa, e sta nel finally: se ne comparisse una seconda sul percorso
        // felice, il finally diventerebbe una ridondanza e il test sopra passerebbe a vuoto.
        expect(parseBody().match(/Constructors\.paused = false;/g)?.length).toBe(1);
        expect(parseBody().match(/Constructors\.paused = true;/g)?.length).toBe(1);
    });

    it('contrasto: il fallimento resta rumoroso — nessun `catch` lo ingoia', () => {
        // `finally`, non `catch`: l'eccezione esce da `parse` come prima, e chi importa
        // un .ecore rotto vede lo stesso errore di oggi. Un `catch` qui degraderebbe
        // comportamento verificato (un import rotto che fallisce in silenzio).
        const body = parseBody();
        // Ancorato al flag, non al primo `try {` del metodo: quello e' il JSON.parse
        // d'ingresso (:173), che un `catch` ce l'ha e deve tenerselo.
        const tryAt = body.indexOf('Constructors.paused = true;');
        expect(tryAt).toBeGreaterThan(-1);
        expect(body.slice(tryAt)).not.toMatch(/\}\s*catch/);
    });

    it('la finestra copre esattamente i quattro passi che stavano fra i due flag', () => {
        const body = parseBody();
        const tryAt = body.indexOf('Constructors.paused = true;');
        const finallyAt = body.indexOf('} finally {');
        const inside = body.slice(tryAt, finallyAt);
        for (const step of ['parseM2Model', 'parseM1Model', 'this.LinkAllNamesToIDs', 'this.fixNamingConflicts']) {
            expect(inside, `${step} deve stare dentro la finestra`).toContain(step);
        }
    });

    it('non-regressione: quello che stava fuori resta fuori, e nell\'ordine', () => {
        // `fixObjectPointers` gira con `paused === false` (usa proxy L su elementi non
        // ancora committati) e `persist` deve trovarlo gia' abbassato.
        const body = parseBody();
        const finallyEnd = body.indexOf('} finally {');
        const tail = body.slice(finallyEnd);
        expect(tail).toContain('this.fixObjectPointers(parsedElements)');
        expect(tail).toContain('Constructors.persist(parsedElements)');
        expect(tail.indexOf('this.fixObjectPointers')).toBeLessThan(tail.indexOf('Constructors.persist'));
    });
});

describe('EcoreParser.parse — perche\' il flag conta', () => {
    it('`persist` esce subito se `paused` e\' alzato', () => {
        // E' il motivo per cui lasciarlo alzato non rompe niente a schermo e perde tutto
        // in silenzio: nessuna CreateElementAction parte, e l'app continua a rispondere.
        expect(fs.readFileSync(CLASSES_TS, 'utf8')).toMatch(/static persist\([\s\S]{0,200}?if \(Constructors\.paused\) return/);
    });

    it('il passo che solleva e\' ancora li\', e solleva ancora', () => {
        // `Log.ex` con la condizione vera lancia: se questa riga sparisse, il difetto
        // sarebbe chiuso da un'altra parte e questo fix diventerebbe una cintura in piu'.
        expect(source).toMatch(/Log\.ex\(!target, "LinkAllNames\(\) can't find type target"/);
    });
});
