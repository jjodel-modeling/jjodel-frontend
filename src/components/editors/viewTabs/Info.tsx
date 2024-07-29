import {Input} from "../../forEndUser/Input";
import {LViewElement} from "../../../view/viewElement/view";
import {DViewPoint, Edges, Fields, GraphElements, Graphs, LViewPoint, Select, Vertexes} from "../../../joiner";
import {JsEditor, OclEditor} from "../../../joiner/components";
import React from "react";


type Props = {view: LViewElement, viewpoints: LViewPoint[]};
function ViewInfo(props: Props): JSX.Element {
    const {view, viewpoints} = props;

    const objectTypes = ['', 'DModel', 'DPackage', 'DEnumerator', 'DEnumLiteral', 'DClass', 'DAttribute', 'DReference', 'DOperation', 'DParameter', 'DObject', 'DValue', 'DStructuralFeature'];
    const classesOptions = <optgroup label={'Object type'}>
        {objectTypes.map((o)=><option key={o} value={o}>{o ? o.substring(1) : 'Anything'}</option>)}
    </optgroup>;

    return(<>
        <div className={'input-container'}>
            <b className={'me-2'}>Name:</b>
            <Input data={view} field={'name'} type={'text'} />
        </div>
        <div className={'input-container'}>
            <b className={'me-2'}>Decorator:</b>
            <Input data={view} field={'isExclusiveView'} type={'checkbox'}
                   setter={val => view.isExclusiveView = !val}
                   getter={data => !(data as LViewElement).isExclusiveView as any}/>
        </div>
        <div className={'input-container'}>
            <b className={'me-2'}>Priority:</b>
            <Input data={view} field={'explicitApplicationPriority'} type={'number'}
                   getter={(data: LViewElement) => {
                       let v = data.__raw.explicitApplicationPriority;
                       return v === undefined ? v : ''+v;
                   }}
                   setter={(v: string | boolean) => {
                       view.explicitApplicationPriority = v ? +v as number : undefined as any;
                   }}
                   placeholder={'automatic: ' + view.explicitApplicationPriority}
                   key={'' + view.explicitApplicationPriority} />
        </div>
        <div className={'input-container'}>
            <b className={'me-2'}>Name:</b>
            <Select data={view} field={'forceNodeType'}
                    setter={(val, data, key) => {view.forceNodeType = val === 'unset' ? undefined : val;}}
                    getter={(data, key) => {return data[key] || 'unset_';}}
                    options={
                        <>
                            <option value={'unset'} key={-1}>Automatic</option>
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
                    }/>
        </div>
        <div className={'input-container'}>
            <b className={'me-2'}>Decorator:</b>
            <Select data={view} field={'appliableToClasses'} options={classesOptions} />
        </div>
        <div className={'input-container'}>
            <b className={'me-2'}>Viewpoint:</b>
            <select className={'my-auto ms-auto select'}
                    defaultValue={view.viewpoint ? view.viewpoint.id : 'null'} onChange={e => (view as any as DViewPoint).viewpoint = e.target.value}>
                <option value={'null'} key={-1}>-----</option>
                {viewpoints.map((viewpoint, index) => {
                    return(<option key={index} value={viewpoint.id}>{viewpoint.name}</option>);
                })}
            </select>
        </div>
        <OclEditor viewID={view.id} />
        <JsEditor viewID={view.id} field={'jsCondition'} placeHolder={'/* Last Line should be the return (boolean) */'} />
    </>);
}

export {ViewInfo};
