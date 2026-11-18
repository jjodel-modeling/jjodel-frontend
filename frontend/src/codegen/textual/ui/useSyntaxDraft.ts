/**
 * useSyntaxDraft — the draft of a metamodel's syntax record, shared by the Syntax form and the EBNF mode of the Text tab
 * (lane L1b, P-2026-11-05-0921; report docs/discovery/discovery_2026-11-05_textual_ebnf_literals.md §3.2, R-TXT-49 D3).
 *
 * Lifted from SyntaxForm.tsx (C2b, P-2026-11-05-0118): the draft, the stored key it was taken from (`base`), what a
 * change of the store under it means (`storedChange`), its reading, the Save gate (R-TXT-47 D1) and Save. The draft has
 * no undo of its own (D6): Save is the one undo step. Every computation is syntaxForm.ts's.
 */

import { useEffect, useMemo, useState } from 'react';
import type { ElementIds, SyntaxAnnotations } from '../annotations';
import type { ConcreteGrammar } from '../concreteGrammar';
import type { TextMetamodel } from '../metamodel';
import type { DecodedSyntax } from '../syntaxRecord';
import { EMPTY_DRAFT, isDirty, readDraft, recordToSave, saveGate, storedChange } from '../syntaxForm';
import type { FormFault } from '../syntaxForm';

export interface SyntaxDraftInput {
    /** The metamodel; none when the model cannot be read, and the draft then reads nothing. */
    readonly mm: TextMetamodel | undefined;
    readonly ids: ElementIds;
    /** The stored record, decoded (syntaxRecord.ts `readSyntax`). */
    readonly decoded: DecodedSyntax;
    /** The stored key as written, for the dirty check (R-TXT-47 D3). */
    readonly storedRaw: string | undefined;
    /** The Text layer holds an edit not yet applied: Save waits (D1 (c)). */
    readonly pendingEdit: boolean;
    /** Writes the record as one undo step (openTextualTab.tsx `writeTextualSyntax`). */
    readonly onSave: (record: SyntaxAnnotations) => boolean;
}

/** The draft as read: its faults and, when the derivation did not throw, its grammar. */
export interface SyntaxDraftReading {
    readonly faults: readonly FormFault[];
    readonly grammar?: ConcreteGrammar;
}

export interface SyntaxDraft {
    readonly draft: SyntaxAnnotations;
    readonly setDraft: (update: (draft: SyntaxAnnotations) => SyntaxAnnotations) => void;
    /** What the last change of the store means for the draft (`storedChange`); `kept` offers Reload. */
    readonly change: ReturnType<typeof storedChange>;
    readonly reading: SyntaxDraftReading;
    readonly dirty: boolean;
    readonly gate: ReturnType<typeof saveGate>;
    /** Writes the draft, without the entries of deleted elements, as one undo step; nothing when the gate is closed. */
    readonly save: () => void;
    /** Drops the draft for the stored record (Discard, Reload). */
    readonly loadStored: () => void;
}

/** The draft read, a derivation that throws included: its message is one error of the record. */
function safeReading(mm: TextMetamodel | undefined, ids: ElementIds, draft: SyntaxAnnotations, decoded: DecodedSyntax): SyntaxDraftReading {
    if (!mm) return { faults: [] };
    try {
        return readDraft(mm, ids, draft, decoded.issues);
    } catch (e) {
        return { faults: [{ level: 'error', rule: 'annotations', message: e instanceof Error ? e.message : String(e), at: [] }] };
    }
}

export function useSyntaxDraft({ mm, ids, decoded, storedRaw, pendingEdit, onSave }: SyntaxDraftInput): SyntaxDraft {
    const [draft, setDraft] = useState<SyntaxAnnotations>(() => decoded.record ?? EMPTY_DRAFT);
    // The stored key the draft was taken from: a change of the store under it is an undo, another tab, or a Save.
    const [base, setBase] = useState<string | undefined>(storedRaw);

    const change = storedChange(base, storedRaw, draft);
    useEffect(() => {
        if (change === 'adopt') setBase(storedRaw);
        else if (change === 'reset') { setDraft(decoded.record ?? EMPTY_DRAFT); setBase(storedRaw); }
    }, [change, storedRaw, decoded]);

    const reading = useMemo(() => safeReading(mm, ids, draft, decoded), [mm, ids, draft, decoded]);
    const dirty = isDirty(storedRaw, draft);
    const gate = saveGate({ faults: reading.faults, storedRaw, draft, pendingEdit });

    const loadStored = (): void => { setDraft(decoded.record ?? EMPTY_DRAFT); setBase(storedRaw); };
    const save = (): void => {
        if (!gate.enabled) return;
        const record = recordToSave(draft, ids);
        if (onSave(record)) setDraft(record);
    };
    return { draft, setDraft, change, reading, dirty, gate, save, loadStored };
}
