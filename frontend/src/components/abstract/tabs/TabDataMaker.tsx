import {DModel, LModel} from '../../../model/logicWrapper';
import {TabData} from 'rc-dock';
import MetamodelTab from './MetamodelTab';
import ModelTab from './ModelTab';
import { ElementBadge } from '../../common/ElementBadge';
import { memo } from 'react';

// Memoized tab title component to prevent icon disappearing
const TabTitle = memo<{ type: 'metamodel' | 'model'; name: string }>(
    ({ type, name }) => (
        <div className="active-on-mouseenter">
            <ElementBadge type={type} /> {name}
        </div>
    ),
    // Custom comparison: only re-render if name actually changes
    // Badge stays mounted even when name updates
    (prevProps, nextProps) => {
        return prevProps.name === nextProps.name && prevProps.type === nextProps.type;
    }
);

TabTitle.displayName = 'TabTitle';

class TabDataMaker {
    static metamodel (model: DModel|LModel): TabData {
        return {
            id: model.id,
            title: <TabTitle type="metamodel" name={model.name} />,
            group: 'models',
            closable: true,
            content: <MetamodelTab modelid={model.id} key={model.id} />
        };
    }

    static model(model: DModel|LModel): TabData {
        return {
            id: model.id,
            title: <TabTitle type="model" name={model.name} />,
            group: 'models',
            closable: true,
            content: <ModelTab modelid={model.id} metamodelid={(model.instanceof as any)?.id || model.instanceof} />
        };
    }
}


export default TabDataMaker;
