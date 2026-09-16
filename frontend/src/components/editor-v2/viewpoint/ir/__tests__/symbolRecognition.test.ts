/**
 * Riconoscimento strutturale (D14): l'inverso di applyPresetToShape.
 *
 * La proprieta' centrale e' il round-trip: applicare un preset qualunque a una
 * spec qualunque produce assi che riconoscono QUEL preset (insieme, non
 * elemento: il catalogo e' molti-a-molti per costruzione, e i gruppi di
 * ambiguita' noti sono asseriti esplicitamente qui, cosi' un preset nuovo che
 * ne crea uno inatteso fa fallire il test e la coincidenza diventa una scelta
 * dichiarata invece di un caso).
 */

import { describe, it, expect } from 'vitest';
import type { ShapeSpec } from '../irTypes';
import { NOTATION_CATALOG, applyPresetToShape } from '../notationCatalog';
import { recognizeSymbol } from '../symbolRecognition';

const ids = (shape: ShapeSpec) => recognizeSymbol(shape).map(p => p.id);

/** Spec di partenza volutamente sporca: colore d'autore, label, fill. */
const BASE: ShapeSpec = {
    form: 'rect',
    border: { color: '#7a4056', width: 1, style: 'solid' },
    fill: '',
    labels: [{ position: 'center', source: { kind: 'intrinsic', property: 'name' } } as any],
};

describe('symbolRecognition: round-trip con applyPresetToShape', () => {
    it('ogni preset applicato viene riconosciuto, e il colore d\'autore sopravvive', () => {
        for (const preset of NOTATION_CATALOG) {
            const applied = applyPresetToShape(BASE, preset);
            expect(ids(applied), preset.id).toContain(preset.id);
            expect(applied.border?.color).toBe('#7a4056');
        }
    });

    it('il fill dell\'autore non rompe i preset che non lo dichiarano', () => {
        const entity = NOTATION_CATALOG.find(p => p.id === 'er-entity')!;
        const applied = applyPresetToShape({ ...BASE, fill: '#fde68a' }, entity);
        expect(ids(applied)).toContain('er-entity');
    });

    // Slice 3 (D5): il raggio degli spigoli e' ortogonale allo spazio dei preset. Un
    // preset lo conserva quando viene applicato, e cambiarlo dopo non toglie il match
    // (un task BPMN con r = 6 resta un task BPMN).
    it('il raggio degli spigoli non e\' un asse: sopravvive al preset e non ne cambia il riconoscimento', () => {
        for (const preset of NOTATION_CATALOG) {
            for (const cornerRadius of [0, 6, 40]) {
                const applied = applyPresetToShape({ ...BASE, cornerRadius }, preset);
                expect(applied.cornerRadius, `${preset.id} r=${cornerRadius}`).toBe(cornerRadius);
                expect(ids(applied), `${preset.id} r=${cornerRadius}`).toContain(preset.id);
                expect(ids({ ...applied, cornerRadius: cornerRadius + 3 }), `${preset.id} r changed`).toContain(preset.id);
            }
        }
    });
});

describe('symbolRecognition: i gruppi di ambiguita\' sono noti e stabili', () => {
    const plain = (form: ShapeSpec['form']): ShapeSpec => ({ form });
    // D24: le forme pure guadagnano il preset Base in testa (ordine di
    // tabella); fork/join e transizione Petri sono lo stesso punto degli assi.
    // D6: la famiglia Goal e' in CODA al catalogo, quindi entra in coda a ogni
    // insieme e non cambia mai `matches[0]`, cioe' il titolo della modale. Un
    // Goal E' uno stadio e una Resource E' un rettangolo: la coincidenza e'
    // dichiarata qui, come le precedenti, non evitata.
    const CASES: Array<[ShapeSpec, string[]]> = [
        [plain('rect'), ['base-rect', 'flow-process', 'er-entity', 'goal-resource']],
        [plain('rounded'), ['base-rounded', 'bpmn-task', 'uml-state']],
        [plain('diamond'), ['base-diamond', 'uml-choice', 'flow-decision', 'er-relationship']],
        [plain('circle'), ['base-circle', 'bpmn-start-event', 'petri-place', 'goal-actor']],
        [{ form: 'circle', marker: 'dot' }, ['uml-final-state', 'petri-marked-place']],
        [plain('ellipse'), ['base-ellipse', 'uml-use-case', 'er-attribute', 'goal-belief']],
        [plain('stadium'), ['base-stadium', 'goal-goal']],
        [plain('hexagon'), ['base-hexagon', 'goal-task']],
        [plain('parallelogram'), ['base-parallelogram', 'goal-obstacle']],
        // La nuvola e' il solo punto che nessun'altra riga del catalogo occupa.
        [plain('cloud'), ['goal-softgoal']],
        // Agent e Role: la barra li separa dall'Actor, e fra loro.
        [{ form: 'circle', marker: 'bar-top' }, ['goal-agent']],
        [{ form: 'circle', marker: 'bar-bottom' }, ['goal-role']],
        // fill ignorato dove il preset non lo dichiara: il rect campito
        // matcha anche i rect senza fill (semantica gia' testata sotto).
        [{ form: 'rect', fill: '#334155' }, ['base-rect', 'uml-fork-join', 'flow-process', 'petri-transition', 'er-entity', 'goal-resource']],
    ];
    it('gli insiemi coincidono, nell\'ordine del catalogo', () => {
        for (const [shape, expected] of CASES) {
            expect(ids(shape), JSON.stringify(shape)).toEqual(expected);
        }
    });
    it('nessun altro gruppo di ambiguita\' esiste nel catalogo', () => {
        const seen = new Map<string, string[]>();
        for (const p of NOTATION_CATALOG) {
            const key = JSON.stringify([p.values.form, p.values.border?.style ?? 'solid',
                p.values.border?.width ?? 1, p.values.marker ?? '', p.values.fill ?? null]);
            seen.set(key, [...(seen.get(key) ?? []), p.id]);
        }
        const groups = [...seen.values()].filter(g => g.length > 1);
        expect(groups).toEqual([
            ['base-rect', 'flow-process', 'er-entity', 'goal-resource'],
            ['base-rounded', 'bpmn-task', 'uml-state'],
            ['base-stadium', 'goal-goal'],
            ['base-ellipse', 'uml-use-case', 'er-attribute', 'goal-belief'],
            ['base-circle', 'bpmn-start-event', 'petri-place', 'goal-actor'],
            ['base-diamond', 'uml-choice', 'flow-decision', 'er-relationship'],
            ['base-parallelogram', 'goal-obstacle'],
            ['base-hexagon', 'goal-task'],
            ['uml-final-state', 'petri-marked-place'],
            ['uml-fork-join', 'petri-transition'],
        ]);
    });
});

describe('symbolRecognition: perturbazioni e condizionali', () => {
    it('un asse contato che diverge produce custom', () => {
        expect(ids({ form: 'diamond', marker: 'x', border: { color: '#334155', width: 2, style: 'solid' } })).toEqual([]);
        expect(ids({ form: 'rounded', marker: 'gear', border: { color: '#334155', width: 1, style: 'dashed' } })).toEqual([]);
    });
    it('form condizionale non riconosce nulla', () => {
        expect(ids({ form: { when: { kind: 'always' } as any, then: 'diamond' } })).toEqual([]);
    });
    it('marker condizionale fallisce sia i preset che lo richiedono sia quelli che ne richiedono l\'assenza', () => {
        expect(ids({ form: 'diamond', marker: { when: { kind: 'always' } as any, then: 'x' } })).toEqual([]);
    });
    it('fill condizionale e\' ignorato dove il preset non lo dichiara, e fallisce dove lo dichiara', () => {
        const out = ids({ form: 'circle', fill: { when: { kind: 'always' } as any, then: '#334155' } });
        expect(out).toEqual(['base-circle', 'bpmn-start-event', 'petri-place', 'goal-actor']);
        expect(out).not.toContain('uml-initial-state');
    });
    it('marker vuoto equivale ad assente', () => {
        expect(ids({ form: 'rounded', marker: '' })).toEqual(['base-rounded', 'bpmn-task', 'uml-state']);
    });
});
