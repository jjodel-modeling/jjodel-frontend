/**
 * irPrune + pruneForm — che cosa resta scritto nel file, e che cosa sparisce (R-DMV slice F).
 *
 * L'ir salvato non ha VersionFixer (R-B9): ogni chiave che ci finisce ci resta per sempre.
 * La potatura non e' pulizia estetica, e' l'unica occasione di non scrivere. Per questo i
 * casi sotto asseriscono la forma ESATTA dell'oggetto — `toEqual` e non `toMatchObject` —
 * e distinguono «chiave assente» da «chiave a undefined», che a schermo sono la stessa cosa
 * e nel salvato no.
 *
 * ESEGUITE, non lette: `irPrune` dipende dal solo `irTypes` e `FormAuthoringBody` si importa
 * gia' sotto `environment: node` (lo fa `formAuthoring.test.ts`), quindi il codice provato
 * qui e' lo stesso che il pannello chiama (P11).
 */
import { describe, it, expect } from 'vitest';
import { isPrunableClassView, pruneTable, withViewForm, withViewTable } from '../irPrune';
import { pruneForm } from '../../authoring/FormAuthoringBody';
import type { FormSpec, VertexViewIR } from '../irTypes';

/** Lo scheletro che `DataManagerViewpointPanel.createClassView` scrive, verbatim. */
const skeleton = (): VertexViewIR => ({
    irVersion: 'ir-1.2',
    kind: 'vertex',
    metaclasses: ['Sensor'],
    authoringMetaclassPins: { Sensor: 'c-sensor' },
    priority: 0,
    exclusive: true,
    shape: { form: 'rect' },
} as VertexViewIR);

describe('pruneForm — le cinque chiavi potate, e la sesta che non lo e\'', () => {
    it('positivo di controllo: una form con contenuto passa intatta', () => {
        const full: FormSpec = { widgets: { note: 'textarea' }, theme: 'card' };
        expect(pruneForm(full)).toEqual({ widgets: { note: 'textarea' }, theme: 'card' });
    });

    it('i tre record vuoti spariscono: widgets, features, labels', () => {
        expect(pruneForm({ widgets: {}, features: {}, labels: {} })).toBeUndefined();
        expect(pruneForm({ widgets: {}, theme: 'plain' })).toEqual({ theme: 'plain' });
        expect(pruneForm({ labels: {}, theme: 'plain' })).toEqual({ theme: 'plain' });
    });

    it('le due liste vuote spariscono: order e hidden (R-VP-8, R-VP-13)', () => {
        expect(pruneForm({ order: [], hidden: [] })).toBeUndefined();
        expect(pruneForm({ order: [], hidden: ['note'] })).toEqual({ hidden: ['note'] });
        expect(pruneForm({ order: ['note'], hidden: [] })).toEqual({ order: ['note'] });
    });

    it('`basic: []` NON si pota: e\' una risposta dichiarata, non un\'assenza', () => {
        // Vuoto = «niente in Basic»; assente = l'euristica sulla molteplicita'. Due rese
        // diverse, quindi la chiave deve sopravvivere. E' l'asimmetria che il commento di
        // `pruneForm` esiste per dichiarare.
        expect(pruneForm({ basic: [] })).toEqual({ basic: [] });
        expect(pruneForm({ basic: [], widgets: {} })).toEqual({ basic: [] });
    });

    it('una form svuotata del tutto e\' `undefined`, mai `{}`', () => {
        expect(pruneForm({})).toBeUndefined();
        expect(pruneForm({ widgets: {}, features: {}, labels: {}, order: [], hidden: [] })).toBeUndefined();
    });
});

describe('pruneTable — la chiave sorella di `form`', () => {
    it('positivo di controllo: delle colonne dichiarate passano intatte', () => {
        expect(pruneTable({ columns: ['tags', 'threshold'] })).toEqual({ columns: ['tags', 'threshold'] });
    });

    it('`columns: []` sparisce, e con lei l\'intero spec', () => {
        // `orderColumns` restituisce l'input per identita' sia con `columns` assente sia
        // con `columns` vuoto: una sola resa, e solo una delle due forme deve finire nel file.
        expect(pruneTable({ columns: [] })).toBeUndefined();
        expect(pruneTable({})).toBeUndefined();
        expect(pruneTable(undefined)).toBeUndefined();
    });
});

describe('withViewTable / withViewForm — la chiave, o la sua assenza', () => {
    it('positivo di controllo: scrivere mette la chiave', () => {
        const out = withViewTable(skeleton(), { columns: ['note'] });
        expect(out.table).toEqual({ columns: ['note'] });
        expect(withViewForm(skeleton(), { widgets: { note: 'textarea' } }).form)
            .toEqual({ widgets: { note: 'textarea' } });
    });

    it('`undefined` RIMUOVE la chiave, non la scrive a undefined', () => {
        const written = withViewTable(skeleton(), { columns: ['note'] });
        const reset = withViewTable(written, undefined);
        expect('table' in reset).toBe(false);
        expect(reset).toEqual(skeleton());          // round-trip identico allo scheletro

        const withForm = withViewForm(skeleton(), { widgets: { note: 'textarea' } });
        const resetForm = withViewForm(withForm, undefined);
        expect('form' in resetForm).toBe(false);
        expect(resetForm).toEqual(skeleton());
    });

    it('uno spec che si pota a nulla non lascia la chiave dietro di se\'', () => {
        const out = withViewTable(withViewTable(skeleton(), { columns: ['note'] }), { columns: [] });
        expect('table' in out).toBe(false);
    });

    it('non muta l\'ir in ingresso', () => {
        const before = skeleton();
        withViewTable(before, { columns: ['note'] });
        withViewForm(before, { widgets: { note: 'textarea' } });
        expect(before).toEqual(skeleton());
    });
});

describe('isPrunableClassView — quando la view non dice piu\' niente', () => {
    it('positivo di controllo: una view con contenuto NON e\' potabile', () => {
        expect(isPrunableClassView(withViewForm(skeleton(), { widgets: { note: 'textarea' } }))).toBe(false);
        expect(isPrunableClassView(withViewTable(skeleton(), { columns: ['note'] }))).toBe(false);
    });

    it('lo scheletro nudo e\' potabile', () => {
        expect(isPrunableClassView(skeleton())).toBe(true);
        // E lo e' anche dopo il giro completo scrivi-e-resetta, che e' il caso reale.
        expect(isPrunableClassView(withViewForm(
            withViewForm(skeleton(), { widgets: { note: 'textarea' } }), undefined,
        ))).toBe(true);
    });

    it('una view con contenuto AUTORIALE non e\' potabile, qualunque cosa dica la form', () => {
        // La direzione conservativa e' voluta: una view che sopravvive e' una riga in un
        // albero, una view cancellata a torto e' lavoro perso.
        const withLabel: any = { ...skeleton(), label: 'Sensore' };
        expect(isPrunableClassView(withLabel)).toBe(false);
        const withPredicate: any = { ...skeleton(), predicate: { op: 'eq' } };
        expect(isPrunableClassView(withPredicate)).toBe(false);
        const withStructure: any = { ...skeleton(), structure: {} };
        expect(isPrunableClassView(withStructure)).toBe(false);
        const withCompartments: any = { ...skeleton(), fieldCompartments: [] };
        expect(isPrunableClassView(withCompartments)).toBe(false);
    });

    it('uno `shape` che dice piu\' del segnaposto e\' contenuto autoriale', () => {
        const drawn: any = { ...skeleton(), shape: { form: 'rect', fill: '#ff0000' } };
        expect(isPrunableClassView(drawn)).toBe(false);
        const otherForm: any = { ...skeleton(), shape: { form: 'ellipse' } };
        expect(isPrunableClassView(otherForm)).toBe(false);
    });

    it('un ir che non e\' una view di nodo non e\' potabile, e non e\' un errore', () => {
        expect(isPrunableClassView({ kind: 'edge' } as any)).toBe(false);
        expect(isPrunableClassView(undefined)).toBe(false);
        expect(isPrunableClassView(null)).toBe(false);
    });
});
