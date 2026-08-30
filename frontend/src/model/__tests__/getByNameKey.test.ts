import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * `LModel._impl_getByName` e la convenzione della chiave (model/logicWrapper/LModelElement.tsx).
 *
 * Perche' statiche e non di comportamento: `LModelElement.tsx` non e' importabile sotto
 * vitest (`ReferenceError: window is not defined` da monaco, via la barrel `joiner`;
 * l'ambiente di `vitest.config.ts` e' `node`). Ricopiare qui l'algoritmo per eseguirlo
 * misurerebbe la copia, non il soggetto.
 *
 * Il difetto: il lookup cercava la chiave nuda, i produttori scrivono `"$" + nome`, e le
 * due funzioni pubbliche che ci passano — `getClassByName` e `getEnumByName` — non hanno
 * mai potuto trovare niente, nemmeno su un nome unico. Misurato in
 * `docs/discovery/discovery_2026-08-30_uniqueness_m2.md` §4.1 (R-M2-2).
 *
 * Questo file e' quindi un test di **coerenza fra file**: il lookup e i tre produttori
 * devono dire la stessa cosa. Se un produttore cambia convenzione, va rosso qui.
 * La prova di comportamento e' la sonda del referto.
 */

const LME_TSX = path.resolve(__dirname, '../logicWrapper/LModelElement.tsx');
const U_TSX = path.resolve(__dirname, '../../common/U.tsx');

const source = fs.readFileSync(LME_TSX, 'utf8');
const uSource = fs.readFileSync(U_TSX, 'utf8');

/** Il corpo del solo `_impl_getByName`, dalla firma alla chiusura della classe. */
function implBody(): string {
    const start = source.indexOf('    _impl_getByName(collection:');
    expect(start, 'la firma di _impl_getByName e\' cambiata: aggiorna il test').toBeGreaterThan(-1);
    const next = source.indexOf('\n    }', start);
    expect(next).toBeGreaterThan(start);
    return source.slice(start, next);
}

describe('_impl_getByName — cerca la chiave che i produttori scrivono', () => {
    it('costruisce la chiave con il prefisso, e non usa piu\' il nome nudo', () => {
        const body = implBody();
        expect(body).toMatch(/const key: string = '\$' \+ name;/);
        expect(body).toMatch(/if \(collection\[key\]\) return collection\[key\];/);
        expect(body).not.toMatch(/if \(collection\[name\]\) return collection\[name\];/);
    });

    it('anche il giro case-insensitive passa dalla chiave, non dal nome', () => {
        // Era la meta' che restava rotta anche correggendo solo la prima riga: le chiavi
        // in minuscolo sono '$freeprobe', e chiedere 'freeprobe' non le trova.
        const body = implBody();
        expect(body).toMatch(/return collection\[key\.toLowerCase\(\)\] \|\| null;/);
        expect(body).not.toMatch(/collection\[name\.toLowerCase\(\)\]/);
    });

    it('contrasto: `caseSensitive` esce ancora prima del giro in minuscolo', () => {
        const body = implBody();
        expect(body.indexOf('if (caseSensitive) return null;'))
            .toBeLessThan(body.indexOf('toLowerCase'));
    });

    it('non-regressione: il `trim` e il `null` finale restano', () => {
        const body = implBody();
        expect(body).toMatch(/name = name\.trim\(\);/);
        expect(body).toMatch(/\|\| null;/);
    });
});

describe('la convenzione della chiave, dove viene scritta', () => {
    it('`U.toNamedArray` scrive "$" + nome', () => {
        expect(uSource).toMatch(/\(larr as GObject\)\["\$"\+\(darr\[i\] as GObject\)\.name\] = larr\[i\];/);
    });

    it('i due produttori di LPackage scrivono la stessa chiave', () => {
        expect(source).toMatch(/lclasses\["\$"\+dclasses\[i\]\.name\] = lclasses\[i\];/);
        expect(source).toMatch(/\(lenums as GObject\)\["\$"\+denums\[i\]\.name\] = lenums\[i\];/);
    });

    it('le collezioni che il lookup riceve sono proprio quelle', () => {
        // `get_getClassByName`/`get_getEnumByName` passano `get_classes(c)`/`get_enumerators(c)`
        // di LModel, che finiscono in `_getallSub` -> `U.toNamedArray`. Se un giorno
        // passassero un'altra collezione, la chiave andrebbe rimisurata.
        expect(source).toMatch(/this\._impl_getByName\(this\.get_classes\(c\), name\)/);
        expect(source).toMatch(/this\._impl_getByName\(this\.get_enumerators\(c\), name\)/);
        expect(source).toMatch(/U\.toNamedArray\(larr, darr\);\s*\n\s*return larr;\s*\n\s*\}/);
    });
});
