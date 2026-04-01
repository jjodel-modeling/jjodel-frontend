import React, { useCallback, useMemo } from 'react';
import { LViewElement, DViewElement, EdgeBendingMode, EdgeGapMode, CoordinateMode } from '../../../../joiner';
import CollapsibleSection from './CollapsibleSection';

interface EdgeSectionProps {
    view: LViewElement;
}

const EdgeSection: React.FC<EdgeSectionProps> = ({ view }) => {
    const dview: DViewElement = view.__raw;

    const setField = useCallback((field: string, value: any) => {
        (view as any)[field] = value;
    }, [view]);

    const setPointField = useCallback((field: string, axis: 'x' | 'y', value: number) => {
        const current = (dview as any)[field] || { x: 0, y: 0 };
        (view as any)[field] = { ...current, [axis]: value };
    }, [view, dview]);

    const summary = useMemo(() => {
        const parts: string[] = [];
        if (dview.bendingMode) parts.push(dview.bendingMode);
        if (dview.edgeGapMode) parts.push(dview.edgeGapMode);
        return parts.join(', ') || 'defaults';
    }, [dview.bendingMode, dview.edgeGapMode]);

    const startOffset = (dview as any).edgeStartOffset || { x: 0, y: 0 };
    const endOffset = (dview as any).edgeEndOffset || { x: 0, y: 0 };
    const headSize = (dview as any).edgeHeadSize || { x: 0, y: 0 };
    const tailSize = (dview as any).edgeTailSize || { x: 0, y: 0 };

    return (
        <CollapsibleSection title="Edge" summary={summary}>
            <div className="vep-config-grid">
                {/* Bending mode */}
                <label className="vep-config-grid__label">Path mode</label>
                <select
                    className="vep-config-grid__select"
                    value={dview.bendingMode || ''}
                    onChange={(e) => setField('bendingMode', e.target.value)}
                >
                    {Object.entries(EdgeBendingMode).map(([key, val]) => (
                        <option key={val} value={val}>{key.replace(/_/g, ' ')}</option>
                    ))}
                </select>

                {/* Gap mode */}
                <label className="vep-config-grid__label">Gap mode</label>
                <select
                    className="vep-config-grid__select"
                    value={dview.edgeGapMode || ''}
                    onChange={(e) => setField('edgeGapMode', e.target.value)}
                >
                    {Object.entries(EdgeGapMode).map(([key, val]) => (
                        <option key={val} value={val}>{key}</option>
                    ))}
                </select>

                {/* Start offset */}
                <label className="vep-config-grid__label">Start offset</label>
                <div className="vep-edge-point-row">
                    <label className="vep-edge-point-row__axis">x</label>
                    <input
                        type="number"
                        className="vep-edge-point-row__input"
                        value={startOffset.x ?? 0}
                        onChange={(e) => setPointField('edgeStartOffset', 'x', +e.target.value)}
                    />
                    <label className="vep-edge-point-row__axis">y</label>
                    <input
                        type="number"
                        className="vep-edge-point-row__input"
                        value={startOffset.y ?? 0}
                        onChange={(e) => setPointField('edgeStartOffset', 'y', +e.target.value)}
                    />
                    <button
                        type="button"
                        className={`vep-config-grid__switch vep-config-grid__switch--mini ${(dview as any).edgeStartOffset_isPercentage ? 'vep-config-grid__switch--active' : ''}`}
                        onClick={() => setField('edgeStartOffset_isPercentage', !(dview as any).edgeStartOffset_isPercentage)}
                        title="Percentage"
                    />
                    <span className="vep-edge-point-row__hint">%</span>
                </div>

                {/* End offset */}
                <label className="vep-config-grid__label">End offset</label>
                <div className="vep-edge-point-row">
                    <label className="vep-edge-point-row__axis">x</label>
                    <input
                        type="number"
                        className="vep-edge-point-row__input"
                        value={endOffset.x ?? 0}
                        onChange={(e) => setPointField('edgeEndOffset', 'x', +e.target.value)}
                    />
                    <label className="vep-edge-point-row__axis">y</label>
                    <input
                        type="number"
                        className="vep-edge-point-row__input"
                        value={endOffset.y ?? 0}
                        onChange={(e) => setPointField('edgeEndOffset', 'y', +e.target.value)}
                    />
                    <button
                        type="button"
                        className={`vep-config-grid__switch vep-config-grid__switch--mini ${(dview as any).edgeEndOffset_isPercentage ? 'vep-config-grid__switch--active' : ''}`}
                        onClick={() => setField('edgeEndOffset_isPercentage', !(dview as any).edgeEndOffset_isPercentage)}
                        title="Percentage"
                    />
                    <span className="vep-edge-point-row__hint">%</span>
                </div>

                {/* Stop at boundaries */}
                <label className="vep-config-grid__label">Start stops at boundary</label>
                <div className="vep-config-grid__control">
                    <button
                        type="button"
                        className={`vep-config-grid__switch ${(dview as any).edgeStartStopAtBoundaries ? 'vep-config-grid__switch--active' : ''}`}
                        onClick={() => setField('edgeStartStopAtBoundaries', !(dview as any).edgeStartStopAtBoundaries)}
                    />
                </div>

                <label className="vep-config-grid__label">End stops at boundary</label>
                <div className="vep-config-grid__control">
                    <button
                        type="button"
                        className={`vep-config-grid__switch ${(dview as any).edgeEndStopAtBoundaries ? 'vep-config-grid__switch--active' : ''}`}
                        onClick={() => setField('edgeEndStopAtBoundaries', !(dview as any).edgeEndStopAtBoundaries)}
                    />
                </div>

                {/* Head size */}
                <label className="vep-config-grid__label">Head size</label>
                <div className="vep-edge-point-row">
                    <label className="vep-edge-point-row__axis">x</label>
                    <input
                        type="number"
                        className="vep-edge-point-row__input"
                        value={headSize.x ?? 0}
                        onChange={(e) => setPointField('edgeHeadSize', 'x', +e.target.value)}
                    />
                    <label className="vep-edge-point-row__axis">y</label>
                    <input
                        type="number"
                        className="vep-edge-point-row__input"
                        value={headSize.y ?? 0}
                        onChange={(e) => setPointField('edgeHeadSize', 'y', +e.target.value)}
                    />
                </div>

                {/* Tail size */}
                <label className="vep-config-grid__label">Tail size</label>
                <div className="vep-edge-point-row">
                    <label className="vep-edge-point-row__axis">x</label>
                    <input
                        type="number"
                        className="vep-edge-point-row__input"
                        value={tailSize.x ?? 0}
                        onChange={(e) => setPointField('edgeTailSize', 'x', +e.target.value)}
                    />
                    <label className="vep-edge-point-row__axis">y</label>
                    <input
                        type="number"
                        className="vep-edge-point-row__input"
                        value={tailSize.y ?? 0}
                        onChange={(e) => setPointField('edgeTailSize', 'y', +e.target.value)}
                    />
                </div>

                {/* EdgePoint coord mode */}
                <label className="vep-config-grid__label">Coord mode</label>
                <select
                    className="vep-config-grid__select"
                    value={(dview as any).edgePointCoordMode || ''}
                    onChange={(e) => setField('edgePointCoordMode', e.target.value)}
                >
                    {Object.entries(CoordinateMode).map(([key, val]) => (
                        <option key={val} value={val}>{key}</option>
                    ))}
                </select>
            </div>
        </CollapsibleSection>
    );
};

export default EdgeSection;
