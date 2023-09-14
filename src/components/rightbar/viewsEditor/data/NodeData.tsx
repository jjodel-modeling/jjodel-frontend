import React from 'react';
import {LViewElement, Input, SetFieldAction, TextArea} from '../../../../joiner';

interface Props {view: LViewElement, readonly: boolean}

function NodeData(props: Props) {
    const view = props.view;
    const readOnly = props.readonly;

    const objectTypes = ["", "DModel", "DPackage", "DEnumerator", "DEnumLiteral", "DClass", "DAttribute", "DReference", "DOperation", "DParameter", "DObject", "DValue", "DStructuralFeature"];
    const classesOptions = <optgroup label={"Object type"}>
        {objectTypes.map((o)=><option key={o} value={o}>{o.length ? o.substring(1) : "anything"}</option>)}
    </optgroup>;

    const changeFN = (evt: React.ChangeEvent<HTMLSelectElement>) => {
        const value = evt.target.value;
        SetFieldAction.new(view.id, 'forceNodeType', value, '', false);
    }

    return(<>
        {/*<Select obj={view} field={"useSizeFrom"} options={
            <optgroup label="Node position depends from what?">
                <option value={EuseSizeFrom.view}>View</option>
                <option value={EuseSizeFrom.node}>Graph: Same position in different views</option>
                <option value={EuseSizeFrom.node}>Node: Never the same position (default)</option>
            </optgroup>
        } tooltip={ "View: Elements with the same view will keep the same position in different graphs\n" +
                    "Graph: Element in a graph will maintain the position when changing view\n"+
                    "Node: Ensuring every visual element uses his personal size (default)"
        }></Select>*/}
        <Input data={view} field={"width"} label={"Width"} type={"number"}/>
        <Input data={view} field={"height"} label={"Height"} type={"number"}/>
        {/*<Input data={view} field={"scalezoomx"} label={"Zoom X"} type={"number"}/>*/}
        {/*<Input data={view} field={"scalezoomy"} label={"Zoom Y"} type={"number"}/>*/}
        <div className={'d-flex p-1'}>
            <label className={'my-auto'}>Force Node</label>
            <select className={'my-auto ms-auto select'} disabled={readOnly}
                    value={view.forceNodeType} onChange={changeFN}>
                <option value={undefined}>-----</option>
                {['Graph', 'GraphVertex', 'Vertex', 'Field'].map((node, index) => {
                    return(<option key={index} value={node}>{node}</option>);
                })}
            </select>
        </div>
        {/*from damiano: il primo StoreSize tooltip funziona, il secondo no. perchè? l'html viene popolato correttamente ma risulta opacità 0, puoi cercare di risolverlo tu?*/}
        <Input data={view} field={"storeSize"} label={"store Size"} tooltip={
            <div>"Active: the node position depends from the view currently displayed. Inactive: it depends from the graph."</div>} type={"checkbox"} />
        <Input data={view} field={"storeSize"} label={"Store Size"} type={"checkbox"} tooltip={true}/>
        <Input data={view} field={"lazySizeUpdate"} label={"Lazy Update"} type={"checkbox"} tooltip={true}/>

        <div className="p-1" style={{display: "flex"}}><label className="my-auto">Appliable to</label>
            <select data-obj={view.id} data-field={'appliableToClasses'} data-label={'Appliable to'} data-options={classesOptions}
                    value={view.appliableToClasses[0] || ''} onChange={(e) => { view.appliableToClasses = e.target.value as any; }}
                    className={"my-auto ms-auto select"} disabled={readOnly}>
                {classesOptions}
            </select>
        </div>
        <Input data={view} field={"adaptWidth"} label={"Adapt Width"} type={"checkbox"}/>
        <Input data={view} field={"adaptHeight"} label={"Adapt Height"} type={"checkbox"}/>
        <Input data={view} field={"draggable"} label={"Draggable"} type={"checkbox"}/>
        <Input data={view} field={"resizable"} label={"Resizable"} type={"checkbox"}/>
        <TextArea data={view} field={'onDragStart'} label={'OnDragStart'} />
        <TextArea data={view} field={'onDragEnd'} label={'OnDragEnd'} />
        <TextArea data={view} field={'onResizeStart'} label={'OnResizeStart'} />
        <TextArea data={view} field={'onResizeEnd'} label={'OnResizeEnd'} />
    </>);
}

export default NodeData;
