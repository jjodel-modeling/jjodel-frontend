import {DModel, Input, LGraph, LModel, LPackage, LProject, Pointer, Selectors, U} from '../../../joiner';
import TabDataMaker from '../../../components/abstract/tabs/TabDataMaker';
import DockManager from '../../../components/abstract/DockManager';
import './style.scss';
import React, {Dispatch, JSX, SetStateAction, useState} from 'react';

type Props = {metamodels: LModel[], project: LProject, setClicked: Dispatch<SetStateAction<string>>};
function ModelPopup(props: Props): JSX.Element {
    const {metamodels, project, setClicked} = props;
    const [name, setName] = useState('');
    const [metamodel, setMetamodel] = useState<Pointer>('');

    const createM1 = async() => {
        const dModel: DModel = DModel.new(name, metamodel as Pointer<DModel, 1, 1, LModel>, false, true);
        const lModel: LModel = LModel.fromD(dModel);
        project.models = [...project.models, lModel];
        project.graphs = [...project.graphs, lModel.node as LGraph];
        const tab = TabDataMaker.model(dModel);
        await DockManager.open('models', tab);
        setClicked('');
    }

    return(<div className={'popup-container'}>
        <div className={'popup'}>
            <div className={'close-container'}>
                <i onClick={e => setClicked('')} className={'bi bi-x-lg text-danger close'} />
            </div>
            <section className={'px-3'}>
                <div className={'input-container'}>
                    <b className={'me-2'}>Name:</b>
                    <input className={'input'} onChange={e => setName(e.target.value)} />
                </div>
                <div className={'input-container'}>
                    <b className={'me-2'}>Metamodel:</b>
                    <select className={'select'} onChange={e => setMetamodel(e.target.value)}>
                        <option value={''}>----------</option>
                        {metamodels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
                <button onClick={createM1} disabled={!name || !metamodel} className={'btn btn-success d-block w-100 mt-3'}>
                        Create
                </button>
            </section>
        </div>
    </div>);
}

export {ModelPopup};
