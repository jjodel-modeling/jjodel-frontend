/**
 * IRNodeContent — renders the content of an ObjectNode from a CompiledView.
 *
 * Fase 3: in-place editing through the canonical EditorV2 write path
 * (canvasToJjom.syncUpdateFeatureValue / syncNodeLabel) — never a new write
 * path (spec v1.2 sez. 5). Defaults for parity with the native ObjectNode:
 * value segments and intrinsic name labels are editable unless the IR sets
 * `editable: false`. The wrapper .mm-node, NodeResizer, DynamicHandles and
 * highlight classes stay in ObjectNode.
 */

import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { syncNodeLabel, syncUpdateFeatureValue } from '../../sync/canvasToJjom';
import type { CompiledView } from './irTypes';
import type { ReadCtx } from './irReadCtx';

export interface IRNodeContentProps {
    compiled: CompiledView;
    objectId: string;
    /** RF vertex id — the canonical write path is keyed by vertex. */
    vertexId: string;
    readCtx: ReadCtx;
}

interface CompartmentRowData {
    key: string;
    name: string;
    typeName: string;
    value: string;
    editableValue: boolean;
}

function IRNodeContent({ compiled, objectId, vertexId, readCtx }: IRNodeContentProps) {
    const form = compiled.form(readCtx, objectId);
    const fill = compiled.fill ? compiled.fill(readCtx, objectId) : '';

    // In-place editing state
    const [editingRow, setEditingRow] = useState<{ key: string; name: string } | null>(null);
    const [editingLabel, setEditingLabel] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');

    // Compartment rows come from the object's D-layer features (name/type/value).
    const compartmentSig = useSelector((state: any) => {
        if (compiled.fieldCompartments.length === 0) return '';
        const lookup = state.idlookup;
        const dObject = lookup?.[objectId];
        if (!dObject?.features) return '';
        const parts: string[] = [];
        for (const fid of dObject.features) {
            const dv = lookup?.[fid];
            if (!dv) continue;
            const feat = lookup?.[dv.instanceof];
            if (!feat) continue;
            const kind = feat.className === 'DReference' ? 'R' : 'A';
            const typeObj = typeof feat.type === 'string' ? lookup?.[feat.type] : null;
            const vals = Array.isArray(dv.values) ? dv.values : [];
            const display = vals.map((v: unknown) => {
                if (typeof v === 'string' && lookup?.[v]?.name) return lookup[v].name;
                return v == null ? '' : String(v);
            }).join(', ');
            parts.push(`${kind};${fid};${feat.name ?? ''};${typeObj?.name ?? ''};${display}`);
        }
        return parts.join('|');
    });

    const rows = useMemo(() => {
        const attributes: CompartmentRowData[] = [];
        const references: CompartmentRowData[] = [];
        if (!compartmentSig) return { attributes, references };
        for (const entry of compartmentSig.split('|')) {
            const [kind, fid, name, typeName, value] = entry.split(';');
            const row: CompartmentRowData = { key: fid, name, typeName, value, editableValue: kind === 'A' };
            if (kind === 'R') references.push(row); else attributes.push(row);
        }
        return { attributes, references };
    }, [compartmentSig]);

    const commitRowEdit = useCallback(() => {
        if (editingRow) {
            syncUpdateFeatureValue(vertexId, editingRow.name, editValue);
            setEditingRow(null);
        }
    }, [editingRow, editValue, vertexId]);

    const commitLabelEdit = useCallback(() => {
        if (editingLabel !== null) {
            syncNodeLabel(vertexId, editValue);
            setEditingLabel(null);
        }
    }, [editingLabel, editValue, vertexId]);

    const editKeys = useCallback((commit: () => void) => (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') commit();
        else if (e.key === 'Escape') { setEditingRow(null); setEditingLabel(null); }
    }, []);

    const inlineStyle: React.CSSProperties = {};
    if (fill) inlineStyle.background = fill;
    // Fase B: authored border painted inline on .ir-node-content (per-field
    // fallback). When compiled.border is null the CSS box border applies —
    // covers demo/migrated views without an authored border.
    const b = compiled.border;
    if (b) inlineStyle.border = `${b.width ?? 1}px ${b.style ?? 'solid'} ${b.color ?? 'var(--border-default)'}`;

    return (
        <div
            className={`ir-node-content ir-shape--${form}`}
            style={inlineStyle}
        >
            {compiled.badges.map((b, i) => {
                if (!b.visible(readCtx, objectId)) return null;
                const icon = b.icon(readCtx, objectId);
                if (!icon) return null;
                return (
                    <span key={`badge_${i}`} className={`ir-badge ir-badge--${b.position}`} title={b.tooltip}>
                        <i className={`bi ${icon}`} />
                    </span>
                );
            })}
            {compiled.labels.map((l, i) => {
                if (!l.visible(readCtx, objectId)) return null;
                const raw = l.text(readCtx, objectId);
                const text = raw == null ? '' : String(raw);
                // Editable: intrinsic name/qualifiedName labels edit the element
                // name unless the IR opts out (spec v1.2 sez. 5).
                if (l.editsName && editingLabel === i) {
                    return (
                        <input
                            key={`label_${i}`}
                            className={`ir-label ir-label--${l.position} ir-label__input`}
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onFocus={(e) => e.target.select()}
                            onBlur={commitLabelEdit}
                            onKeyDown={editKeys(commitLabelEdit)}
                        />
                    );
                }
                return (
                    <span
                        key={`label_${i}`}
                        className={`ir-label ir-label--${l.position}`}
                        onDoubleClick={l.editsName ? () => {
                            setEditingLabel(i);
                            setEditValue(readCtx.getName(objectId) ?? '');
                        } : undefined}
                    >
                        {text}
                    </span>
                );
            })}
            {compiled.fieldCompartments.map(fc => {
                if (!fc.visible(readCtx, objectId)) return null;
                const source = fc.source === 'references' ? rows.references : rows.attributes;
                if (source.length === 0) return null;
                return (
                    <div
                        key={fc.id}
                        className={`ir-compartment${fc.separator ? '' : ' ir-compartment--no-separator'}`}
                    >
                        {source.map(row => (
                            <div key={row.key} className="ir-row">
                                {fc.segments.map((seg, si) => {
                                    switch (seg.kind) {
                                        case 'name': return <span key={si}>{row.name}</span>;
                                        case 'type': return <span key={si}>{row.typeName}</span>;
                                        case 'value': {
                                            const editable = row.editableValue && (seg as any).editable !== false;
                                            if (editable && editingRow?.key === row.key) {
                                                return (
                                                    <input
                                                        key={si}
                                                        className="ir-row__input"
                                                        autoFocus
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        onFocus={(e) => e.target.select()}
                                                        onBlur={commitRowEdit}
                                                        onKeyDown={editKeys(commitRowEdit)}
                                                    />
                                                );
                                            }
                                            return (
                                                <span
                                                    key={si}
                                                    className={editable ? 'ir-row__value--editable' : undefined}
                                                    onDoubleClick={editable ? () => {
                                                        setEditingRow({ key: row.key, name: row.name });
                                                        setEditValue(row.value);
                                                    } : undefined}
                                                >
                                                    {row.value}
                                                </span>
                                            );
                                        }
                                        case 'literal': return <span key={si}>{seg.text}</span>;
                                        default: return null;
                                    }
                                })}
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
}

export default IRNodeContent;
