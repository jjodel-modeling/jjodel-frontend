import { describe, it, expect } from 'vitest';
import { lookupNamedEntry, uniqueModelName, type NamedArray } from '../nameLookup';

/**
 * A4 — le prove di COMPORTAMENTO che A2 e A3 non potevano scrivere.
 *
 * Fino a qui `_impl_getByName` e `uniqueModelName` vivevano dentro file che il banco non
 * riesce a importare (`LModelElement.tsx`, `joiner/classes.ts`: `window is not defined`
 * attraverso la barrel `joiner`), quindi i loro test erano asserzioni sul TESTO del
 * sorgente. Il banco delle mutazioni ha mostrato cosa si perde cosi': il tie-break
 * invertito (A2/N2), la guardia `caseSensitive` tolta (A2/N3) e la riscrittura degli alias
 * (A2/N1) passavano tutte e tre, e solo una sonda non committata le uccideva.
 *
 * Ora la logica sta in `model/nameLookup.ts`, che il banco importa, e queste sono le prove
 * che restano in repo.
 */

type Entry = { id: string; name: string };

const named = (items: Entry[]): NamedArray<Entry> => {
    const arr = [...items] as NamedArray<Entry>;
    for (const it of items) arr['$' + it.name] = it;
    return arr;
};
const snapshot = (a: NamedArray<Entry>) => JSON.stringify({ keys: Object.keys(a).sort(), len: a.length });

describe('lookupNamedEntry — esatto prima, case-insensitive come ripiego', () => {
    const lower = { id: 'A.person', name: 'person' };
    const upper = { id: 'A.Person', name: 'Person' };

    it('trova la chiave esatta', () => {
        expect(lookupNamedEntry(named([upper]), 'Person')?.id).toBe('A.Person');
    });

    it('distingue le due grafie quando entrambe esistono', () => {
        const coll = named([lower, upper]);
        expect(lookupNamedEntry(coll, 'Person')?.id).toBe('A.Person');
        expect(lookupNamedEntry(coll, 'person')?.id).toBe('A.person');
    });

    it('A2/N2 — il tie-break del ripiego e\' l\'ULTIMA chiave che corrisponde', () => {
        // Non una scelta di A4: il giro di alias che questo codice sostituisce sovrascriveva
        // le chiavi precedenti con le successive. Invertirlo sarebbe un cambiamento di
        // comportamento, e questo test lo dice.
        expect(lookupNamedEntry(named([lower, upper]), 'PERSON')?.id).toBe('A.Person');
        expect(lookupNamedEntry(named([upper, lower]), 'PERSON')?.id).toBe('A.person');
    });

    it('A2/N3 — `caseSensitive` esce prima del ripiego', () => {
        expect(lookupNamedEntry(named([upper]), 'person', true)).toBeNull();
        expect(lookupNamedEntry(named([upper]), 'Person', true)?.id).toBe('A.Person');
    });

    it('A2/N1 — la collezione non viene toccata, e una ricerca non ne avvelena un\'altra', () => {
        const coll = named([lower, upper]);
        const before = snapshot(coll);
        expect(lookupNamedEntry(coll, 'person')?.id).toBe('A.person');
        lookupNamedEntry(coll, 'PERSON');            // il ripiego gira qui
        expect(snapshot(coll)).toBe(before);
        expect(lookupNamedEntry(coll, 'person')?.id).toBe('A.person');   // era 'A.Person'
    });

    it('due chiamate identiche danno la stessa risposta', () => {
        const coll = named([lower, upper]);
        expect(lookupNamedEntry(coll, 'PERSON')?.id).toBe(lookupNamedEntry(coll, 'PERSON')?.id);
    });

    it('il nome viene ripulito dagli spazi, il miss e\' null', () => {
        expect(lookupNamedEntry(named([upper]), '  Person  ')?.id).toBe('A.Person');
        expect(lookupNamedEntry(named([upper]), 'Nope')).toBeNull();
    });

    it('una collezione vuota, o un nome che non e\' una stringa, non esplodono', () => {
        expect(lookupNamedEntry(named([]), 'Person')).toBeNull();
        expect(lookupNamedEntry(named([upper]), undefined as any)).toBeNull();
    });
});

describe('uniqueModelName — lo schema (n)', () => {
    it('A3 — A, A (1), A (2)', () => {
        const taken: string[] = [];
        for (const expected of ['A', 'A (1)', 'A (2)']) {
            const got = uniqueModelName('A', taken);
            expect(got).toBe(expected);
            taken.push(got);
        }
    });

    it('un nome libero torna intatto — il controllo', () => {
        expect(uniqueModelName('Fresh', ['A', 'A (1)'])).toBe('Fresh');
    });

    it('A3 — il confronto e\' esatto: `a` non collide con `A`', () => {
        expect(uniqueModelName('a', ['A'])).toBe('a');
    });

    it('riparte dal massimo esistente, non dal conteggio', () => {
        expect(uniqueModelName('A', ['A', 'A (7)'])).toBe('A (8)');
    });

    it('i metacaratteri non allargano il confronto', () => {
        // Senza escape, `^A.B*C \((\d+)\)$` prenderebbe anche 'AXBC (3)' e il suffisso
        // ripartirebbe da 3.
        expect(uniqueModelName('A.B*C', ['A.B*C', 'AXBC (3)'])).toBe('A.B*C (1)');
    });

    it('un nome che gia\' finisce in (n) e\' base di se stesso', () => {
        expect(uniqueModelName('A (1)', ['A', 'A (1)'])).toBe('A (1) (1)');
    });

    it('un nome vuoto resta al ramo dell\'auto-nome', () => {
        expect(uniqueModelName('', ['', 'A'])).toBe('');
    });
});
