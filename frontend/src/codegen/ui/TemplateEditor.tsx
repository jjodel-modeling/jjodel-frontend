/**
 * TemplateEditor — one template of the code panel, as a draft (slice S5, P-2026-10-10-1825; spec §4, R-GEN-4,
 * R-GEN-12).
 *
 * Name, parameters (a comma-separated list) and body are edited locally and written by «Save» in one `state`
 * assignment, one undo step (CodePanel's `save`): typing never writes the metamodel. A rename is a save under the new
 * name. The draft is the template's: the panel keys this editor by name, so selecting another template starts a new
 * draft. Whether the body parses, and whether the name is an identifier, the engine reports at generation, with the
 * position (templates.ts).
 */

import React, { useState } from 'react';
import type { TemplateRecord } from '../engine/templates';

export interface TemplateEditorProps {
    readonly template: TemplateRecord;
    /** The names of the other templates: a rename onto one of them is refused. */
    readonly taken: readonly string[];
    readonly onSave: (next: TemplateRecord) => void;
    readonly onDelete: () => void;
}

const paramsOf = (text: string): string[] => text.split(',').map(p => p.trim()).filter(p => p !== '');

export default function TemplateEditor({ template, taken, onSave, onDelete }: TemplateEditorProps): React.ReactElement {
    const [name, setName] = useState(template.name);
    const [params, setParams] = useState(template.params.join(', '));
    const [body, setBody] = useState(template.body);

    const trimmed = name.trim();
    const problem = trimmed === '' ? 'A template needs a name.' : taken.includes(trimmed) ? `The name ${trimmed} is taken by another template.` : null;
    const nextParams = paramsOf(params);
    const dirty = trimmed !== template.name || nextParams.join(',') !== template.params.join(',') || body !== template.body;

    const save = () => {
        if (problem || !dirty) return;
        onSave({ ...template, name: trimmed, params: nextParams, body });
    };

    return (
        <div className="codegen-panel__editor">
            <div className="codegen-panel__field-row">
                <label className="codegen-panel__field">
                    <span className="codegen-panel__label">Name</span>
                    <input
                        className="codegen-panel__input"
                        value={name}
                        spellCheck={false}
                        onChange={e => setName(e.target.value)}
                    />
                </label>
                <label className="codegen-panel__field">
                    <span className="codegen-panel__label">Parameters</span>
                    <input
                        className="codegen-panel__input"
                        value={params}
                        placeholder="a, b"
                        spellCheck={false}
                        onChange={e => setParams(e.target.value)}
                    />
                </label>
            </div>
            <label className="codegen-panel__field">
                <span className="codegen-panel__label">Body</span>
                <textarea
                    className="codegen-panel__body-input"
                    value={body}
                    rows={10}
                    spellCheck={false}
                    placeholder={'"text with ${holes}"'}
                    onChange={e => setBody(e.target.value)}
                />
            </label>
            {problem && <div className="codegen-panel__hint codegen-panel__hint--error">{problem}</div>}
            <div className="codegen-panel__actions">
                <button type="button" className="codegen-panel__button codegen-panel__button--primary" disabled={!!problem || !dirty} onClick={save}>
                    <i className="bi bi-check2" />
                    <span>Save</span>
                </button>
                <button type="button" className="codegen-panel__button" title={`Delete ${template.name}`} onClick={onDelete}>
                    <i className="bi bi-trash" />
                    <span>Delete</span>
                </button>
            </div>
        </div>
    );
}
