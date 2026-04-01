import React, { useMemo } from 'react';
import { LPointerTargetable, Pointer } from '../../../../joiner';
import { TreeNodeType } from '../ViewTreeNode';

interface NodePropertiesProps {
    nodeId: string;
    nodeType: TreeNodeType;
}

const NodeProperties: React.FC<NodePropertiesProps> = ({ nodeId, nodeType }) => {
    const node = useMemo(() => {
        try {
            return LPointerTargetable.fromPointer(nodeId as Pointer) as any;
        } catch { return null; }
    }, [nodeId]);

    const name = node?.name || 'Unnamed';
    const typeLabel = nodeType === 'model' ? 'Model' : nodeType === 'graph' ? 'Graph' : nodeType;

    return (
        <div className="workbench-properties">
            <h4 className="workbench-properties__section-header">{typeLabel}</h4>

            <div className="wp-field">
                <label className="wp-field__label">Name</label>
                <input
                    className="wp-field__input"
                    value={name}
                    disabled
                    readOnly
                />
            </div>

            <div className="wp-field">
                <label className="wp-field__label">Type</label>
                <input
                    className="wp-field__input"
                    value={typeLabel}
                    disabled
                    readOnly
                />
            </div>

            <div className="wp-field">
                <label className="wp-field__label">ID</label>
                <input
                    className="wp-field__input"
                    value={nodeId}
                    disabled
                    readOnly
                    style={{ fontSize: 9, fontFamily: "'IBM Plex Mono', Monaco, Consolas, monospace" }}
                />
            </div>
        </div>
    );
};

export default NodeProperties;
