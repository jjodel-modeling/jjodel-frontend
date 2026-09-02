import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { transformSync } from 'esbuild';

/**
 * UNQ1 F2 — l'auto-nome che ombreggia il nome vero
 * (`model/logicWrapper/LModelElement.tsx`).
 *
 * Referto: `docs/discovery/discovery_2026-09-01_unq1_duplicate_name.md`.
 *
 * Due difetti, una causa sola guardata da due lati (referto §1, §5, §6):
 *
 *  (A) `LObject.get_name` legge PRIMA lo slot identita'. Lo slot e' seminato in differita
 *      (`createAdapter.ts:42`), e finche' i suoi `values` sono `[]` non si legge vuoto:
 *      `get_values` ci sostituisce l'`initialName` del proprietario, cioe' l'auto-nome. Per
 *      almeno 425 ms due fratelli con nomi diversi si leggevano entrambi `<Metaclasse>_0`, e
 *      il produttore registrava un duplicate-name che nei dati non e' mai stato vero.
 *
 *  (B) `DPointerTargetable.defaultname` (joiner/classes.ts:1455) costruisce l'insieme dei nomi
 *      occupati da `lfather.childNames`, che per uno slot di containment e' VUOTO — `LValue`
 *      non ridefinisce `get_children_idlist`. Il contatore non lasciava mai lo `_0`, e due
 *      `Add` senza rinomina producevano due oggetti che si chiamano davvero uguale. Le root
 *      sono immuni perche' un padre `DModel` quel namespace lo popola.
 *
 * PERCHE' IL SORGENTE VIENE ESTRATTO ED ESEGUITO, e non importato.
 * `LModelElement.tsx` non e' importabile sotto vitest: l'import solleva
 * `ReferenceError: window is not defined` da monaco, tirata dentro dalla barrel `joiner`,
 * e l'ambiente di `vitest.config.ts` e' `node`. Stessa ragione di `getByNameKey.test.ts`,
 * `setContainmentVerdict.test.ts` e `getTypeFallback.test.ts`, che per questo si fermano al
 * confronto testuale.
 *
 * Qui si va oltre senza ricopiare l'algoritmo: il corpo dei due metodi viene letto DAL FILE,
 * i tipi cancellati da esbuild (la stessa cancellazione che fa la build) e il risultato
 * eseguito con le sole dipendenze libere iniettate. Cio' che gira e' il sorgente committato,
 * non una sua parafrasi — e se una firma cambia, gli ancoraggi qui sotto vanno rossi e
 * chiedono di aggiornare il test invece di misurare silenziosamente un altro soggetto.
 *
 * La prova di comportamento sull'app vera resta la sonda del referto (§Verifica del prompt).
 */

const LME_TSX = path.resolve(__dirname, '../logicWrapper/LModelElement.tsx');
const U_TSX = path.resolve(__dirname, '../../common/U.tsx');
const NU_TS = path.resolve(__dirname, '../logicWrapper/nameUniqueness.ts');

const source = fs.readFileSync(LME_TSX, 'utf8');
const uSource = fs.readFileSync(U_TSX, 'utf8');
const nuSource = fs.readFileSync(NU_TS, 'utf8');

// ─────────────────────────────────────────────────────────────────────────────
//  Estrazione ed esecuzione
// ─────────────────────────────────────────────────────────────────────────────

/** Il corpo di un metodo, dalla sua firma alla chiusura all'indentazione data. */
function bodyOf(src: string, signature: string, closer: string, what: string): string {
    const start = src.indexOf(signature);
    expect(start, `la firma di ${what} e' cambiata: aggiorna il test`).toBeGreaterThan(-1);
    const open = src.indexOf('{', start + signature.length - 1);
    expect(open, `non trovo l'apertura del corpo di ${what}`).toBeGreaterThan(-1);
    const end = src.indexOf(closer, open);
    expect(end, `non trovo la chiusura del corpo di ${what}`).toBeGreaterThan(open);
    return src.slice(open + 1, end);
}

/**
 * Compila un corpo estratto in una funzione eseguibile.
 * `params` sono le dipendenze libere iniettate; i tipi li cancella esbuild.
 */
function compile(body: string, params: string[], what: string): Function {
    const ts = `(function (${params.join(', ')}) {\n${body}\n})`;
    const js = transformSync(ts, { loader: 'ts', target: 'es2020' }).code;
    // eslint-disable-next-line no-new-func
    return new Function(`return ${js.replace(/;\s*$/, '')}`)() as Function;
}

// ── (A) LObject.get_name ─────────────────────────────────────────────────────
// Ancorato al marcatore introdotto dalla correzione: c'e' un solo `get_name` che legge
// `['$name']` in questo file, ed e' quello di `LObject`.
const GET_NAME_SIG = "    protected get_name(context: Context): this['name'] {";
const getNameBody = (() => {
    const marker = source.indexOf("const slot = (context.proxyObject as GObject)['$name'];");
    expect(marker, 'il corpo di LObject.get_name e\' cambiato: aggiorna il test').toBeGreaterThan(-1);
    const sigAt = source.lastIndexOf(GET_NAME_SIG, marker);
    expect(sigAt, 'la firma di LObject.get_name e\' cambiata: aggiorna il test').toBeGreaterThan(-1);
    return bodyOf(source.slice(sigAt), GET_NAME_SIG, '\n    }', 'LObject.get_name');
})();
const getName = compile(getNameBody, ['context'], 'LObject.get_name') as (c: any) => any;

/** Un contesto di lettura: lo slot identita' (grezzo + letto) e il `data.name`. */
function ctx(opts: { rawValues?: unknown[] | undefined; slotValue?: any; dataName?: any; metaName?: any; noSlot?: boolean }) {
    const slot = opts.noSlot ? undefined : { value: opts.slotValue, __raw: { values: opts.rawValues } };
    return {
        data: { name: opts.dataName },
        proxyObject: { '$name': slot, instanceof: { name: opts.metaName } },
    };
}

// ── (B) DObject.autoName ─────────────────────────────────────────────────────
const AUTO_NAME_SIG = '    private static autoName(father?: DObject["father"], instanceoff?: DObject["instanceof"]): string {';
const autoNameBody = bodyOf(source, AUTO_NAME_SIG, '\n    }', 'DObject.autoName');
const autoNameFactory = compile(
    autoNameBody,
    ['father', 'instanceoff', 'LPointerTargetable', 'DValue', 'getNamespaceOf', 'U'],
    'DObject.autoName',
) as Function;

// `U.increaseEndingNumber` e' il contatore vero, estratto da `common/U.tsx` con la stessa
// tecnica: iniettarne una imitazione misurerebbe l'imitazione. `Log` e' l'unica dipendenza
// libera che porta con se', e qui non deve fare niente.
const INCREASE_SIG = '    static increaseEndingNumber(s: string, allowLastNonNumberChars: boolean = false, allowDecimal: boolean = false, increaseWhile?: ((x: string) => boolean)): string {';
const increaseBody = bodyOf(uSource, INCREASE_SIG, '\n\n', 'U.increaseEndingNumber');
const increaseEndingNumber = compile(
    increaseBody.replace(/return prefix \+ num; \}\s*$/, 'return prefix + num;'),
    ['s', 'allowLastNonNumberChars', 'allowDecimal', 'increaseWhile', 'Log'],
    'U.increaseEndingNumber',
) as Function;
const U_STUB = {
    increaseEndingNumber: (s: string, a: boolean, d: boolean, w?: (x: string) => boolean) =>
        increaseEndingNumber(s, a, d, w, { ex: () => {}, eDevv: () => {} }),
};

/** Chiama `autoName` con un padre finto. `siblings` sono i nomi gia' presenti nello slot. */
function autoName(fatherKind: 'DValue' | 'DModel' | null, siblings: string[], metaName = 'Edition') {
    const calls: { namespaceOf: any[]; defaultname: any[] } = { namespaceOf: [], defaultname: [] };
    const father = fatherKind ? 'ptr_father' : undefined;
    const lfather = fatherKind ? { id: 'ptr_father', className: fatherKind } : null;
    const LPT = {
        wrap: (p: any) => (p === 'ptr_father' ? lfather : null),
        from: (p: any) => ({ name: metaName }),
    };
    const getNamespaceOf = (f: any) => { calls.namespaceOf.push(f); return siblings.map(n => ({ name: n })); };
    // `this.defaultname` — la strada delle root, che qui deve restare intatta.
    const self = { defaultname: (...a: any[]) => { calls.defaultname.push(a); return 'DEFAULTNAME_PATH'; } };
    const out = autoNameFactory.call(self, father, 'ptr_meta', LPT, { cname: 'DValue' }, getNamespaceOf, U_STUB);
    return { out, calls };
}

// ─────────────────────────────────────────────────────────────────────────────
//  A — lo slot vuoto cede a data.name
// ─────────────────────────────────────────────────────────────────────────────

describe('A — LObject.get_name: uno slot identita\' vuoto non ombreggia piu\' data.name', () => {
    it('slot `[]` e data.name pieno -> data.name (il difetto misurato in §1-§3)', () => {
        // Il campione del referto §2: raw [Edition_0, Edition_1], proxy [Edition_0, Edition_0].
        // Il secondo oggetto: data.name = 'Edition_1', slot ancora da seminare, che si legge
        // 'Edition_0' perche' get_values ci mette l'initialName.
        expect(getName(ctx({ rawValues: [], slotValue: 'Edition_0', dataName: 'Edition_1' })))
            .toBe('Edition_1');
    });

    it('il contrasto del referto §2 (P2): nomi espliciti diversi, nessuna lettura sbagliata', () => {
        expect(getName(ctx({ rawValues: [], slotValue: 'Edition_0', dataName: 'Beta' }))).toBe('Beta');
    });

    it('slot POPOLATO -> vince lo slot: la direzione slot -> nome resta portante (CLAUDE.md §3.12)', () => {
        // Non-regressione del binding identita': se lo slot ha un valore, e' lui il nome, anche
        // quando data.name dice altro (e' la finestra INVERSA, subito dopo una scrittura di slot).
        expect(getName(ctx({ rawValues: ['prima edizione'], slotValue: 'prima edizione', dataName: 'Edition_0' })))
            .toBe('prima edizione');
    });

    it('slot `[]` e data.name vuoto -> l\'auto-nome resta il ripiego', () => {
        // Il caso che i tre lettori di initialName gia' scrivono come `name ?? initialName`
        // (instanceTable.ts:127, shapeDraw.ts:205, irReadCtx.ts:173): non cambia per loro niente.
        expect(getName(ctx({ rawValues: [], slotValue: 'Edition_0', dataName: '' }))).toBe('Edition_0');
        expect(getName(ctx({ rawValues: [], slotValue: 'Edition_0', dataName: undefined }))).toBe('Edition_0');
    });

    it('nessuno slot identita\' -> data.name, poi il nome della metaclasse', () => {
        expect(getName(ctx({ noSlot: true, dataName: 'X' }))).toBe('X');
        expect(getName(ctx({ noSlot: true, dataName: '', metaName: 'Edition' }))).toBe('Edition');
    });

    it('tutto vuoto -> il nome della metaclasse, come prima', () => {
        expect(getName(ctx({ rawValues: [], slotValue: '', dataName: '', metaName: 'Edition' }))).toBe('Edition');
    });

    it('uno slot che tiene davvero \'\' non e\' il caso corretto qui: resta come prima', () => {
        // Dichiarato e non toccato: la finestra misurata ha `slotRaw: []`, non `['']`. Un nome
        // cancellato di proposito continua a mostrare il ripiego che mostrava prima.
        expect(getName(ctx({ rawValues: [''], slotValue: 'Edition_0', dataName: 'Edition_1' })))
            .toBe('Edition_0');
    });

    it('la lettura grezza passa da `__raw.values`, l\'idioma che set_name usa a :6385', () => {
        expect(getNameBody).toMatch(/__raw\?\.values/);
        expect(getNameBody).toMatch(/Array\.isArray\(rawValues\) && rawValues\.length === 0/);
        // e la vecchia prima riga, quella che leggeva lo slot per primo senza guardarlo, non c'e' piu'
        expect(getNameBody).not.toMatch(/return \(context\.proxyObject as GObject\)\['\$name'\]\?\.value \|\|/);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
//  B — l'auto-nome conta dentro lo slot
// ─────────────────────────────────────────────────────────────────────────────

describe('B — DObject.autoName: il contatore del nested vede i fratelli dello slot', () => {
    it('slot vuoto -> Edition_0 (il primo nested non cambia)', () => {
        expect(autoName('DValue', []).out).toBe('Edition_0');
    });

    it('un fratello Edition_0 -> Edition_1 (il difetto di §1c e §6: prima era ancora Edition_0)', () => {
        expect(autoName('DValue', ['Edition_0']).out).toBe('Edition_1');
    });

    it('due fratelli -> Edition_2: il contatore avanza come per le root di §5', () => {
        expect(autoName('DValue', ['Edition_0', 'Edition_1']).out).toBe('Edition_2');
    });

    it('salta i buchi occupati, non il primo libero', () => {
        expect(autoName('DValue', ['Edition_0', 'Edition_2']).out).toBe('Edition_1');
    });

    it('fratelli con nomi espliciti diversi -> Edition_0 resta libero', () => {
        expect(autoName('DValue', ['Alpha', 'Beta']).out).toBe('Edition_0');
    });

    it('il namespace chiesto e\' quello del padre DValue, via getNamespaceOf', () => {
        const { calls } = autoName('DValue', ['Edition_0']);
        expect(calls.namespaceOf).toHaveLength(1);
        expect(calls.namespaceOf[0]).toMatchObject({ id: 'ptr_father', className: 'DValue' });
        expect(calls.defaultname, 'per un padre DValue non si passa piu\' da childNames').toHaveLength(0);
    });

    it('CONTROLLO — un padre DModel resta sulla strada di prima, intatta', () => {
        const { out, calls } = autoName('DModel', ['Book_0']);
        expect(out).toBe('DEFAULTNAME_PATH');
        expect(calls.defaultname).toHaveLength(1);
        expect(calls.namespaceOf, 'le root non passano da getNamespaceOf').toHaveLength(0);
    });

    it('CONTROLLO — nessun padre: strada di prima', () => {
        const { out, calls } = autoName(null, []);
        expect(out).toBe('DEFAULTNAME_PATH');
        expect(calls.namespaceOf).toHaveLength(0);
    });

    it('il prefisso resta quello della metaclasse, con lo stesso ripiego "obj_"', () => {
        expect(autoName('DValue', [], 'Chapter').out).toBe('Chapter_0');
        expect(autoNameBody).toMatch(/\(meta\?\.name \|\| "obj"\) \+ "_"/);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Coerenza fra file — cio' che la correzione ha scelto di NON fare
// ─────────────────────────────────────────────────────────────────────────────

describe('coerenza — C1 non e\' stata presa, e i due creatori usano lo stesso auto-nome', () => {
    it('`LValue` continua a NON ridefinire get_children_idlist (C1 del referto §7)', () => {
        // Se un giorno lo facesse, il significato di "figlio" per LValue cambierebbe per tutti i
        // suoi lettori e questo test chiede di rifare quel censimento prima di fidarsi.
        const lvalueAt = source.indexOf('export class LValue<Context extends LogicContext<DValue>');
        expect(lvalueAt, 'la dichiarazione di LValue e\' cambiata: aggiorna il test').toBeGreaterThan(-1);
        const nextClass = source.indexOf('\nexport class ', lvalueAt + 1);
        const lvalueBody = source.slice(lvalueAt, nextClass > 0 ? nextClass : undefined);
        expect(lvalueBody).not.toMatch(/protected get_children_idlist\(/);
    });

    it('`DObject.new` e `DObject.new3` chiamano entrambi autoName', () => {
        expect(source).toMatch(/const computedDefaultName = this\.autoName\(father, instanceoff\);/);
        expect(source).toMatch(/const computedDefaultName = this\.autoName\(ptrs\.father, ptrs\.instanceof\);/);
        expect(source).not.toMatch(/const computedDefaultName = this\.defaultname\(/);
    });

    it('`getNamespaceOf` e\' ancora il punto unico dove lo scope M1 e\' deciso, e scende il DValue', () => {
        expect(source).toMatch(/import \{[^}]*getNamespaceOf[^}]*\} from "\.\/nameUniqueness";/);
        expect(nuSource).toMatch(/export function getNamespaceOf\(/);
        expect(nuSource).toMatch(/siblings = resolveLObjectsFromLValue\(father\);/);
    });
});
