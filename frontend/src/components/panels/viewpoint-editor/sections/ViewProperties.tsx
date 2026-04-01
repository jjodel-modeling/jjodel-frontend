import React, { useCallback } from 'react';
import { DViewElement, LViewElement } from '../../../../joiner';

interface ViewPropertiesProps {
    view: LViewElement;
}

const ViewProperties: React.FC<ViewPropertiesProps> = ({ view }) => {
    const dview: DViewElement = view.__raw;

    const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        view.name = e.target.value;
    }, [view]);

    const handlePriorityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        (view as any).explicitApplicationPriority = val ? +val : undefined;
    }, [view]);

    return (
        <div className="vep-view-props">
            <input
                className="vep-view-props__name"
                value={dview.name || ''}
                onChange={handleNameChange}
                placeholder="View name"
            />
            <input
                className="vep-view-props__priority"
                type="number"
                value={dview.explicitApplicationPriority ?? ''}
                onChange={handlePriorityChange}
                placeholder="auto"
                title={`Priority${dview.explicitApplicationPriority === undefined ? ' (auto)' : ''}`}
            />
        </div>
    );
};

export default ViewProperties;
