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

describe('_impl_getByName — delega, e la delega e\' tutto cio\' che resta da fissare qui', () => {
    // A4: il corpo e' in `model/nameLookup.ts`, che il banco IMPORTA. Le prove di
    // comportamento — esatto prima, ripiego case-insensitive, tie-break sull'ultima chiave,
    // `caseSensitive`, e soprattutto che la collezione non venga scritta — stanno in
    // `model/__tests__/nameLookup.test.ts` e girano davvero.
    //
    // Qui resta l'unica cosa che di quel file non si puo' eseguire: che il metodo deleghi,
    // e che non si sia riportato dentro una copia della logica.
    it('chiama lookupNamedEntry passando i suoi tre argomenti', () => {
        const body = implBody();
        expect(body).toMatch(/return lookupNamedEntry<LModelElement>\(collection, name, caseSensitive\);/);
    });

    it('non e\' rientrata una copia della logica nel corpo', () => {
        const body = implBody();
        expect(body).not.toMatch(/collection\[[^\]]*\]\s*=/);   // nessuna scrittura
        expect(body).not.toMatch(/toLowerCase/);                  // nessun confronto locale
        expect(body).not.toMatch(/initialKeys/);
    });

    it('il modulo e\' importato, e da un percorso che non passa dalla barrel joiner', () => {
        expect(source).toMatch(/import \{lookupNamedEntry, uniqueModelName\} from "\.\.\/nameLookup";/);
        const mod = fs.readFileSync(path.resolve(__dirname, '../nameLookup.ts'), 'utf8');
        // Se un import comparisse li' dentro, il banco tornerebbe a non poterlo caricare e
        // queste prove di comportamento sparirebbero senza che nulla diventi rosso.
        expect(mod).not.toMatch(/^import /m);
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
