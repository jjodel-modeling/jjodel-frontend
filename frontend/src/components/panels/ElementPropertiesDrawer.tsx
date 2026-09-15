import React from 'react';
import { Info } from '../editors/Info';

export interface ElementPropertiesDrawerProps {
    /** The name of the selected element (for display in the drawer title). */
    elementName?: string;
}

/**
 * ElementPropertiesDrawer — renders the existing Info (properties) panel
 * inside a BottomDrawer. The selected element comes from Redux (_lastSelected),
 * so no explicit element prop is needed.
 */
const ElementPropertiesDrawer: React.FC<ElementPropertiesDrawerProps> = () => {
    return (
        <div className="element-properties-drawer">
            <Info mode="inline" />
        </div>
    );
};

export default ElementPropertiesDrawer;
