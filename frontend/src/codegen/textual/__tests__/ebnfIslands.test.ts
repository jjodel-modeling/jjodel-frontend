/**
 * Editable EBNF literals, lane L1b item 2 (P-2026-11-05-0921; docs/discovery/discovery_2026-11-05_textual_ebnf_literals.md
 * §2.3, §3.3, R-TXT-49 D2, D8, D11): the EBNF mode shows the shared draft's EBNF, the text `draftPreview` gives, with an
 * island on every element literal; the islands of one origin are linked, and a fault of the draft marks the islands of
 * its fields. The Monaco half (decorations, the content widget) is checked in the app. Mutations each test kills are in
 * its name.
 */

import { describe, expect, it, vi } from 'vitest';

vi.mock('@monaco-editor/react', () => ({ default: () => null }));
vi.mock('../../../jjscript', () => ({ buildEvalContext: () => ({}) }));
vi.mock('../../../components/editor-v2/sim/simBridge', () => ({ evalContextFor: () => ({}) }));
vi.mock('../../../components/abstract/DockManager', () => ({ default: { closeTab: () => true } }));

import { ebnfOfDraft, islandFaults } from '../ui/TextualTab';
import { concreteGrammarEbnfSpans } from '../concreteGrammar';
import { draftPreview, literalField, readDraft, setLiteral } from '../syntaxForm';
import type { FormFault } from '../syntaxForm';
import { PORT_CLIKE, PORT_IDS, PORT_MM, PORT_PASCAL, portObjects } from './portCorpus';

const shown = (draft = PORT_CLIKE) => ebnfOfDraft(PORT_MM, PORT_IDS, readDraft(PORT_MM, PORT_IDS, draft).grammar)!;
const inputs = { k: 'itemKeyword', feature: 'Module.inputs' } as const;

describe('ebnfOfDraft', () => {
    it('is the text draftPreview gives, clean and after an edit (kills: the stored EBNF shown instead of the draft\'s)', () => {
        expect(shown().text).toBe(draftPreview(PORT_MM, PORT_IDS, PORT_CLIKE, portObjects()).ebnf);
        const edit = setLiteral(PORT_MM, PORT_IDS, PORT_CLIKE, inputs, 'in');
        if (!edit.ok) throw new Error(edit.reason);
        expect(shown(edit.draft).text).toBe(draftPreview(PORT_MM, PORT_IDS, edit.draft, portObjects()).ebnf);
        expect(shown(edit.draft).text).not.toContain('"input"');
    });

    it('islands every element literal and nothing else: no style token, fixed token or enumeration literal (kills: an island per quoted string)', () => {
        for (const draft of [PORT_CLIKE, PORT_PASCAL]) {
            const s = shown(draft);
            const { literals } = concreteGrammarEbnfSpans(readDraft(PORT_MM, PORT_IDS, draft).grammar);
            const editable = literals.filter(l => literalField(PORT_MM, PORT_IDS, l.src));
            expect(s.islands.map(i => [i.start, i.end])).toEqual(editable.map(l => [l.start, l.end]));
            expect(s.islands.length).toBeLessThan(literals.length);
            for (const i of s.islands) {
                expect(['style', 'fixed', 'literal']).not.toContain(i.src.k);
                expect(s.text.slice(i.start, i.end)).toBe(i.text);
            }
        }
    });

    it('links the occurrences of one origin: the symbol `&` of Conj twice, one origin (kills: the origin keyed by span)', () => {
        const s = shown();
        const and = s.islands.filter(i => i.text === '&');
        expect(and.length).toBe(2);
        expect(and[0].src).toEqual({ k: 'operatorSymbol', cls: 'Conj' });
        expect(new Set(and.map(i => i.origin)).size).toBe(1);
        expect(s.islands.filter(i => i.origin === and[0].origin)).toEqual(and);
        expect(s.islands.filter(i => i.text === 'input').length).toBe(1);
    });

    it('is null without a grammar (kills: a throw on a draft that does not derive)', () => {
        expect(ebnfOfDraft(PORT_MM, PORT_IDS, undefined)).toBeNull();
    });
});

describe('islandFaults', () => {
    it('marks the islands of the fault\'s fields only (kills: a fault on every island, a fault matched by element alone)', () => {
        const s = shown();
        const fault: FormFault = { level: 'error', rule: 'keywords', message: 'm', at: [{ element: 'feature:F_Module_inputs', field: 'feature.itemKeyword' }] };
        const marked = islandFaults(s.islands, [fault]);
        expect(marked.length).toBe(s.islands.length);
        const hit = s.islands.filter((_, k) => marked[k].length);
        expect(hit.map(i => i.text)).toEqual(['input']);
        const byElement: FormFault = { ...fault, at: [{ element: 'feature:F_Module_inputs', field: 'feature.keyword' }] };
        expect(islandFaults(s.islands, [byElement]).every((f, k) => !f.length || s.islands[k].src.k === 'feature')).toBe(true);
    });
});
