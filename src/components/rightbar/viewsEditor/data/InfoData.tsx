import React from 'react';
import {Input, LViewElement, LViewPoint, Select, SetFieldAction} from '../../../../joiner';
import {OclEditor} from '../../oclEditor/OclEditor';

interface Props {view: LViewElement, viewpoints: LViewPoint[], readonly: boolean}

function InfoData(props: Props) {
    const view = props.view;
    const viewpoints = props.viewpoints;
    const readOnly = props.readonly;

    const objectTypes = ['', 'DModel', 'DPackage', 'DEnumerator', 'DEnumLiteral', 'DClass', 'DAttribute', 'DReference', 'DOperation', 'DParameter', 'DObject', 'DValue', 'DStructuralFeature'];
    const classesOptions = <optgroup label={'Object type'}>
            {objectTypes.map((o)=><option key={o} value={o}>{o.length ? o.substring(1) : 'anything'}</option>)}
    </optgroup>;

    const changeVP = (evt: React.ChangeEvent<HTMLSelectElement>) => {
        const value = evt.target.value;
        if(value !== 'null') SetFieldAction.new(view.id, 'viewpoint', value, '', true);
        else SetFieldAction.new(view.id, 'viewpoint', '', '', false);
    }

    return(<section className={'p-3'}>
        <Input data={view} field={'name'} label={'Name'} type={'text'}/>
        <Input data={view} field={'explicitApplicationPriority'} label={'Priority'} type={'number'}/>
        <Select data={view} field={'appliableTo'} label={'Appliable To'} options={<optgroup label={'Appliable Types'}>
            <option value={'node'}>Node</option>
            <option value={'edge'}>Edge</option>
            <option value={'edgePoint'}>Edge Point</option>
        </optgroup>} readonly={readOnly} />
        <div className={'d-flex p-1'}>
            <label className={'my-auto'}>Viewpoint</label>
            <select className={'my-auto ms-auto select'} disabled={readOnly}
                    defaultValue={view.viewpoint ? view.viewpoint.id : 'null'} onChange={changeVP}>
                <option value={'null'}>-----</option>
                {viewpoints.map((viewpoint, index) => {
                    return(<option key={index} value={viewpoint.id}>{viewpoint.name}</option>);
                })}
            </select>
        </div>
        {/* damiano: qui Select component avrebbe fatto comodo al posto del select nativo, ma è troppo poco generica*/}
        {/*<div className='p-1' style={{display: 'flex'}}><label className='my-auto'>Appliable to</label>
            <select data-obj={view.id} data-field={'appliableToClasses'} data-label={'Appliable to'} data-options={ classesOptions }
                    value={view.appliableToClasses[0] || ''} onChange={(e) => { view.appliableToClasses = e.target.value as any; }}
                    className={'my-auto ms-auto select'} disabled={readOnly}>
                {classesOptions}
            </select>
        </div>*/}
        <OclEditor viewid={view.id} />
    </section>);
}

export default InfoData;
