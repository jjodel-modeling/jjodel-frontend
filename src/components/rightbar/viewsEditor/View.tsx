import React from "react";
import type {LViewElement, LViewPoint, DViewPoint} from "../../../joiner";
import {SetFieldAction, SetRootFieldAction} from "../../../redux/action/action";
import OclEditor from "../oclEditor/OclEditor";
import JsxEditor from "../jsxEditor/JsxEditor";
import {U,
    Select,
    TextArea,
    Input,
    EdgeBendingMode,
    CoordinateMode} from "../../../joiner";
import {EdgeGapMode} from "../../../joiner/types";

interface Props { view: LViewElement; viewpoints: LViewPoint[]; }

const objectTypes = ["", "DModel", "DPackage", "DEnumerator", "DEnumLiteral", "DClass", "DAttribute", "DReference", "DOperation", "DParameter", "DObject", "DValue", "DStructuralFeature"];
let classesOptions =
    <optgroup label={"Object type"}>{objectTypes.map(
        (o)=><option key={o} value={o}>{o.length ? o.substring(1) : "anything"}</option>)}
    </optgroup>;

function ViewData(props: Props) {
    const view = props.view;
    const viewpoints = props.viewpoints;
    const readOnly = U.getDefaultViewsID().includes(view.id);

    const back = (evt: React.MouseEvent<HTMLButtonElement>) => {
        SetRootFieldAction.new('stackViews', undefined, '-=', true);
    }
    const changeVP = (evt: React.ChangeEvent<HTMLSelectElement>) => {
        const value = evt.target.value;
        if(value !== 'null') SetFieldAction.new(view.id, 'viewpoint', value, '', true);
        else SetFieldAction.new(view.id, 'viewpoint', '', '', false);
    }

    const changeFN = (evt: React.ChangeEvent<HTMLSelectElement>) => {
        const value = evt.target.value;
        SetFieldAction.new(view.id, 'forceNodeType', value, '', false);
    }

    return(<div>
        <div className={'d-flex p-2'}>
            <b className={'ms-1 my-auto'}>VIEW</b>
            <button className={'btn btn-danger ms-auto'} onClick={back}>
                <i className={'p-1 bi bi-arrow-left'}></i>
            </button>
        </div>
        <Input data={view} field={"name"} label={"Name"} type={"text"}/>
        <Input data={view} field={"explicitApplicationPriority"} label={"Priority"} type={"number"}/>
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

        <TextArea data={view} field={"constants"} label={"Constants"} />
        <TextArea data={view} field={"preRenderFunc"} label={"PreRender Function"} />
        <Input data={view} field={"scalezoomx"} label={"Zoom X"} type={"number"}/>
        <Input data={view} field={"scalezoomy"} label={"Zoom Y"} type={"number"}/>
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

        {/*from damiano: il primo StoreSize tooltip funziona, il secondo no. perchè?
        l'html viene popolato correttamente ma risulta opacità 0, puoi cercare di risolverlo tu?*/}
        <Input data={view} field={"storeSize"} label={"store Size"} tooltip={
            <div>"Active: the node position depends from the view currently displayed. Inactive: it depends from the graph."</div>} type={"checkbox"} />
        <Input data={view} field={"storeSize"} label={"Store Size"} type={"checkbox"} tooltip={true}/>
        <Input data={view} field={"lazySizeUpdate"} label={"Lazy Update"} type={"checkbox"} tooltip={true}/>
        <Input data={view} field={"adaptWidth"} label={"Adapt Width"} type={"checkbox"}/>
        <Input data={view} field={"adaptHeight"} label={"Adapt Height"} type={"checkbox"}/>
        <Input data={view} field={"draggable"} label={"Draggable"} type={"checkbox"}/>
        <Input data={view} field={"resizable"} label={"Resizable"} type={"checkbox"}/>
        <div className={'d-flex p-1'}>
            <label className={'my-auto'}>Viewpoint</label>
            <select className={'my-auto ms-auto select'} disabled={readOnly}
                    value={String(view.viewpoint?.id)} onChange={changeVP}>
                <option value={'null'}>-----</option>
                {viewpoints.map((viewpoint, index) => {
                    return(<option key={index} value={viewpoint.id}>{viewpoint.name}</option>);
                })}
            </select>
        </div>
        <TextArea data={view} field={'onDragStart'} label={'OnDragStart'} />
        <TextArea data={view} field={'onDragEnd'} label={'OnDragEnd'} />
        <TextArea data={view} field={'onResizeStart'} label={'OnResizeStart'} />
        <TextArea data={view} field={'onResizeEnd'} label={'OnResizeEnd'} />
        <div className="p-1" style={{display: "flex"}}><label className="my-auto">Appliable to</label>
            <select data-obj={view.id} data-field={'appliableToClasses'} data-label={'Appliable to'} data-options={classesOptions}
                    value={view.appliableToClasses[0] || ''} onChange={(e) => { view.appliableToClasses = e.target.value as any; }}
                    className={"my-auto ms-auto select"} disabled={readOnly}>
                {classesOptions}
            </select>
        </div>
        <section><h1>Edge options</h1>
            <b>to do</b>
            <div style={{display: "none"}}>
                <select data-data={view} data-field={"bendingMode"} onChange={(e)=> view.bendingMode = e.target.value as any} value={view.bendingMode} data-value={view.bendingMode}>
                    <optgroup label={"How the edge should bend to address EdgePoints"}>{
                        Object.keys(EdgeBendingMode).map( k => <option value={(EdgeBendingMode as any)[k]}>{k}</option>)
                    }</optgroup></select>

                <Input data={view} field={"edgeEndStopAtBoundaries"} />
                {/*view.*/}
            </div>
        </section>
        <section><h1>EdgePoint options</h1>
            <b>to do</b>
            <div style={{display: "none"}}>
            <select data-data={view} data-field={"edgePointCoordMode"} onChange={(e)=> view.edgePointCoordMode = e.target.value as any}
                    value={view.edgePointCoordMode} data-value={view.edgePointCoordMode}>
                <optgroup label={"How the edge should bend to address EdgePoints"}>{
                    Object.keys(CoordinateMode).map( k => <option value={(CoordinateMode as any)[k]}>{k}</option>)
                }</optgroup></select>
            <select data-data={view} data-field={"edgeGapMode"} onChange={(e)=> view.edgeGapMode = e.target.value as any}
                    value={view.edgeGapMode} data-value={view.edgeGapMode}>
                <optgroup label={"How to stop upon meeting an EdgePoint"}>{
                    Object.keys(EdgeGapMode).map( k => <option value={(EdgeGapMode as any)[k]}>{k}</option>)
                }</optgroup></select>
            </div>
        </section>

        {/* damiano: qui Select component avrebbe fatto comodo al posto del select nativo, ma è troppo poco generica*/}
        <div className="p-1" style={{display: "flex"}}><label className="my-auto">Appliable to</label>
            <select data-obj={view.id} data-field={'appliableToClasses'} data-label={'Appliable to'} data-options={ classesOptions }
                value={view.appliableToClasses[0] || ''} onChange={(e) => { view.appliableToClasses = e.target.value as any; }}
                className={"my-auto ms-auto select"}>
            {classesOptions}
            </select>
        </div>
        <OclEditor viewid={view.id} />
        <JsxEditor viewid={view.id} />
    </div>);
}

export default ViewData;
