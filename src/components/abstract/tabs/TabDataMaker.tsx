import {DModel, LModel} from '../../../model/logicWrapper';
import {TabData} from 'rc-dock';
import MetamodelTab from './MetamodelTab';
import ModelTab from './ModelTab';

class TabDataMaker {
    static metamodel (model: DModel|LModel): TabData {
        return {
            id: model.id,
            title: model.name,
            group: 'models',
            closable: true,
            content: <MetamodelTab modelid={model.id} />
        };
    }
    static model(model: DModel|LModel): TabData {
        return {
            id: model.id,
            title: model.name,
            group: 'models',
            closable: true,
            content: <ModelTab modelid={model.id} metamodelid={(model.instanceof as any)?.id || model.instanceof} />
        };
    }
}

export default TabDataMaker;
