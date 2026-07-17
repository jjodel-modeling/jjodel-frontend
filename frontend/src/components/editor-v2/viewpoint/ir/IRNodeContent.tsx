/**
 * IRNodeContent — renders the content of an ObjectNode from a CompiledView.
 *
 * Read-only by design (spike Fase 1: zero editing). The wrapper .mm-node,
 * NodeResizer, DynamicHandles and highlight classes stay in ObjectNode; this
 * component only replaces the fixed header/feature rows.
 */

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { CompiledView } from './irTypes';
import type { ReadCtx } from './irReadCtx';

export interface IRNodeContentProps {
    compiled: CompiledView;
    objectId: string;
    readCtx: ReadCtx;
}

interface CompartmentRowData {
    key: string;
    name: string;
    typeName: string;
    value: string;
}

function IRNodeContent({ compiled, objectId, readCtx }: IRNodeContentProps) {
    const form = compiled.form(readCtx, objectId);
    const fill = compiled.fill ? compiled.fill(readCtx, objectId) : '';

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
            const row: CompartmentRowData = { key: fid, name, typeName, value };
            if (kind === 'R') references.push(row); else attributes.push(row);
        }
        return { attributes, references };
    }, [compartmentSig]);

    const inlineStyle: React.CSSProperties = {};
    if (fill) inlineStyle.background = fill;

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
                return (
                    <span key={`label_${i}`} className={`ir-label ir-label--${l.position}`}>
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
                                        case 'value': return <span key={si}>{row.value}</span>;
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
