import React from 'react';
import {Defaults, DViewPoint, Input, LViewElement, LViewPoint, Select} from '../../../../joiner';
import {OclEditor} from '../../oclEditor/OclEditor';
import {Edges, Fields, GraphElements, Graphs, Vertexes} from "../../../../joiner/components";
import JsEditor from "../../jsEditor/JsEditor";

interface Props {view: LViewElement, viewpoints: LViewPoint[], readonly: boolean}

function InfoData(props: Props) {
    const view = props.view;
    const viewpoints = props.viewpoints;
    const readOnly = props.readonly;

    const objectTypes = ['', 'DModel', 'DPackage', 'DEnumerator', 'DEnumLiteral', 'DClass', 'DAttribute', 'DReference', 'DOperation', 'DParameter', 'DObject', 'DValue', 'DStructuralFeature'];
    const classesOptions = <optgroup label={'Object type'}>
            {objectTypes.map((o)=><option key={o} value={o}>{o ? o.substring(1) : 'anything'}</option>)}
    </optgroup>;

    const changeVP = (evt: React.ChangeEvent<HTMLSelectElement>) => {
        (view as any as DViewPoint).viewpoint = evt.target.value;
    }

    return(<section className={'p-3'}>
        <Input data={view} field={'name'} label={'Name'} type={'text'} readonly={readOnly}/>
        <Input data={view} field={'isExclusiveView'} label={'is Decorator'} type={"checkbox"} readonly={readOnly || Defaults.check(view.id)}
               setter={(val) => { console.log("setting vex", {view, vex: view.isExclusiveView, val, nval:!val}); view.isExclusiveView = !val}}
               getter={(data) => !(data as LViewElement).isExclusiveView as any}/>
        <Input data={view} field={'explicitApplicationPriority'} label={'Priority'} type={'number'} readonly={readOnly}/>
        {/*
        <Select data={view} field={'appliableTo'} label={'Appliable to node types'} readonly={readOnly} options={<optgroup label={'Appliable Types'}>
            <option value={'node'}>Node</option>
            <option value={'edge'}>Edge</option>
            <option value={'edgePoint'}>Edge Point</option>
        </optgroup>} />
        */}
        <Select data={view} field={'forceNodeType'} label={'Preferred appearance'} readonly={readOnly} options={
            <>
                <option value={'unset'} key={-1}>Automatic by model type (package, object, feature...)</option>
                <optgroup label={'Graph'} key={0}>{
                    Object.keys(Graphs).map((key: string) => <option value={key} key={key}>{GraphElements[key].cname}</option>)
                }</optgroup>
                <optgroup label={'Edge'} key={1}>{
                    Object.keys(Edges).map((key: string) => <option value={key} key={key}>{GraphElements[key].cname}</option>)
                }</optgroup>
                <optgroup label={'Field'} key={3}>{
                    Object.keys(Fields).map((key: string) => <option value={key} key={key}>{GraphElements[key].cname}</option>)
                }</optgroup>
                <optgroup label={'Vertex'} key={2}>{
                    Object.keys(Vertexes).map((key: string) => <option value={key} key={key}>{GraphElements[key].cname}</option>)
                }</optgroup>
            </>
        } setter={(data, key, val) => { view.forceNodeType = val === 'unset' ? undefined : val; }}
          getter={(data, key) => { return data[key] || 'unset_'; }} />
        <Select data={view} field={'appliableToClasses'} label={'Appliable to classes'} readonly={readOnly} options={classesOptions} />
        <div className={'d-flex p-1'}>
            <label className={'my-auto'}>Viewpoint</label>
            <select className={'my-auto ms-auto select'} disabled={readOnly}
                    defaultValue={view.viewpoint ? view.viewpoint.id : 'null'} onChange={changeVP}>
                <option value={'null'} key={-1}>-----</option>
                {viewpoints.map((viewpoint, index) => {
                    return(<option key={index} value={viewpoint.id}>{viewpoint.name}</option>);
                })}
            </select>
        </div>
        <OclEditor viewid={view.id} readonly={readOnly} />
        <span>OCL engine by Stephan Köninger, <a href={"https://ocl.stekoe.de/#examples"}>Supported instructions</a></span>
        <JsEditor viewid={view.id} readonly={readOnly} />
    </section>);
}

export default InfoData;
