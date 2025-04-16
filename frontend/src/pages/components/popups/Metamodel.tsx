import {DModel, Input, LGraph, LModel, LPackage, LProject, Selectors, U} from '../../../joiner';
import TabDataMaker from '../../../components/abstract/tabs/TabDataMaker';
import DockManager from '../../../components/abstract/DockManager';
import './style.scss';
import React, {Dispatch, JSX, SetStateAction, useState} from 'react';

type Props = {project: LProject, setClicked: Dispatch<SetStateAction<string>>};
function MetamodelPopup(props: Props): JSX.Element {
    const {project, setClicked} = props;
    const [name, setName] = useState('');

    const createM2 = async() => {
        const dModel = DModel.new(name, undefined, true);
        const lModel: LModel = LModel.fromD(dModel);
        project.metamodels = [...project.metamodels, lModel];
        project.graphs = [...project.graphs, lModel.node as LGraph];
        const dPackage = lModel.addChild('package');
        const lPackage: LPackage = LPackage.fromD(dPackage);
        lPackage.name = 'default';
        const tab = TabDataMaker.metamodel(dModel);
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
                <button onClick={createM2} disabled={!name} className={'btn btn-success d-block w-100 mt-3'}>
                        Create
                </button>
            </section>
        </div>
    </div>);
}

export {MetamodelPopup};
