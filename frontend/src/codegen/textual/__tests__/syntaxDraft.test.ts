/**
 * Editable EBNF literals, lane L1b item 1 (P-2026-11-05-0921; docs/discovery/discovery_2026-11-05_textual_ebnf_literals.md
 * §3.2, R-TXT-49 D3): the Syntax form's draft, base, reading, gate and save lifted into `useSyntaxDraft`, owned by the
 * Text tab and shared by the form and the EBNF mode. The form takes the shared draft through one optional prop and
 * keeps its own state without it. Rendered on the server (no DOM in the bench): effects do not run, the first render is
 * what is read. Mutations each test kills are in its name.
 */

import { describe, expect, it, vi } from 'vitest';

vi.mock('react-redux', () => ({ useSelector: (f: (s: unknown) => unknown) => f({ advanced: false }) }));

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { SyntaxAnnotations } from '../annotations';
import { encodeSyntax } from '../syntaxRecord';
import SyntaxForm from '../ui/SyntaxForm';
import { useSyntaxDraft } from '../ui/useSyntaxDraft';
import type { SyntaxDraft, SyntaxDraftInput } from '../ui/useSyntaxDraft';
import { PORT_CLIKE, PORT_IDS, PORT_MM, portObjects } from './portCorpus';

/** The hook's first render. */
function draftOf(input: SyntaxDraftInput): SyntaxDraft {
    let out: SyntaxDraft | undefined;
    const Probe = () => { out = useSyntaxDraft(input); return null; };
    renderToStaticMarkup(createElement(Probe));
    return out!;
}

const input = (record: SyntaxAnnotations | null, storedRaw: string | undefined): SyntaxDraftInput => ({
    mm: PORT_MM, ids: PORT_IDS, decoded: { record, issues: [] }, storedRaw, pendingEdit: false, onSave: () => true,
});

describe('useSyntaxDraft', () => {
    it('starts on the stored record, clean, Save blocked as unchanged (kills: the draft not taken from the record, the gate not computed)', () => {
        const d = draftOf(input(PORT_CLIKE, encodeSyntax(PORT_CLIKE)));
        expect(d.draft).toBe(PORT_CLIKE);
        expect(d.dirty).toBe(false);
        expect(d.change).toBe('same');
        expect(d.gate.blocks).toEqual(['unchanged']);
        expect(d.reading.faults).toEqual([]);
        expect(d.reading.grammar?.rules.length).toBeGreaterThan(0);
    });

    it('a record over no stored key is dirty and Save is enabled (kills: dirty read against the record instead of the stored key)', () => {
        const d = draftOf(input(PORT_CLIKE, undefined));
        expect(d.dirty).toBe(true);
        expect(d.gate.enabled).toBe(true);
    });

    it('with no metamodel reads nothing and blocks nothing but the unchanged draft (kills: a throw on a missing metamodel)', () => {
        const d = draftOf({ ...input(null, undefined), mm: undefined });
        expect(d.reading.faults).toEqual([]);
        expect(d.reading.grammar).toBeUndefined();
        expect(d.gate.blocks).toEqual(['unchanged']);
    });
});

describe('SyntaxForm with a shared draft', () => {
    const formOf = (shared: boolean): string => {
        const Probe = () => {
            // The store holds no record; the shared draft holds the port record, dirty.
            const d = useSyntaxDraft(input(PORT_CLIKE, undefined));
            return createElement(SyntaxForm, {
                mm: PORT_MM, ids: PORT_IDS, decoded: { record: null, issues: [] }, storedRaw: undefined, objects: portObjects(),
                pendingEdit: false, onSave: () => true, preview: () => null, ...(shared ? { draft: d } : {}),
            });
        };
        return renderToStaticMarkup(createElement(Probe));
    };

    it('shows the shared draft, not its own (kills: the prop ignored)', () => {
        expect(formOf(true)).toContain('Unsaved changes');
    });

    it('without the prop keeps its own draft, the stored one (kills: the own state dropped)', () => {
        expect(formOf(false)).toContain('>Saved<');
    });
});
