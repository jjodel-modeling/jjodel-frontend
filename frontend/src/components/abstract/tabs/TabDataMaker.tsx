import {DModel, LModel} from '../../../model/logicWrapper';
import {TabData} from 'rc-dock';
import MetamodelTab from './MetamodelTab';
import ModelTab from './ModelTab';
import './tab-title.scss';

// CSS-only approach: uses data attribute and ::before pseudo-element
// This avoids React re-rendering issues with rc-dock
class TabDataMaker {
    static metamodel (model: DModel|LModel): TabData {
        return {
            id: model.id,
            title: <div className="tab-title active-on-mouseenter" data-type="metamodel">{model.name}</div>,
            group: 'models',
            closable: true,
            content: <MetamodelTab modelid={model.id} key={model.id} />
        };
    }

    static model(model: DModel|LModel): TabData {
        return {
            id: model.id,
            title: <div className="tab-title active-on-mouseenter" data-type="model">{model.name}</div>,
            group: 'models',
            closable: true,
            content: <ModelTab modelid={model.id} metamodelid={(model.instanceof as any)?.id || model.instanceof} />
        };
    }
}


export default TabDataMaker;
