import {DModel, LModel} from '../../../model/logicWrapper';
import {TabData} from 'rc-dock';
import MetamodelTab from './MetamodelTab';
import ModelTab from './ModelTab';
import { TbSquareRoundedLetterM, TbSquareRoundedLetterMFilled } from 'react-icons/tb';

class TabDataMaker {
    static metamodel (model: DModel|LModel): TabData {
        return {
            id: model.id,
            title: <div className={"active-on-mouseenter"}><TbSquareRoundedLetterMFilled style={{fontSize: '1.2em'}}/> {model.name}</div>,
            group: 'models',
            closable: true,
            content: <MetamodelTab modelid={model.id} key={model.id} />
        };
    }
    static model(model: DModel|LModel): TabData {
        return {
            id: model.id,
            title: <div className={"active-on-mouseenter"}><TbSquareRoundedLetterM style={{fontSize: '1.2em'}}/> {model.name}</div>,
            group: 'models',
            closable: true,
            content: <ModelTab modelid={model.id} metamodelid={(model.instanceof as any)?.id || model.instanceof} />
        };
    }
}

export default TabDataMaker;
