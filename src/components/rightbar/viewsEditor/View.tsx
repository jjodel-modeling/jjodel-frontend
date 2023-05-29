import React from "react";
import type {LViewElement, LViewPoint, DViewPoint} from "../../../joiner";
import {SetFieldAction, SetRootFieldAction} from "../../../redux/action/action";
import OclEditor from "../oclEditor/OclEditor";
import JsxEditor from "../jsxEditor/JsxEditor";
import Input from "../../forEndUser/Input";
import {Select, TextArea} from "../../../joiner";

interface Props { view: LViewElement; viewpoints: LViewPoint[]; }

const objectTypes = ["", "DModel", "DPackage", "DEnumerator", "DEnumLiteral", "DClass", "DAttribute", "DReference", "DOperation", "DParameter", "DObject", "DValue", "DStructuralFeature"];
let classesOptions =
    <optgroup label={"Object type"}>{objectTypes.map(
        (o)=><option key={o} value={o}>{o.length ? o.substring(1) : "anything"}</option>)}
    </optgroup>;

function ViewData(props: Props) {
    const view = props.view;
    const viewpoints = props.viewpoints;

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
        <Input obj={view} field={"name"} label={"Name"} type={"text"}/>
        <Input obj={view} field={"explicitApplicationPriority"} label={"Priority"} type={"number"}/>
        <Input obj={view} field={"storeSize"} label={"Active: the node position depends from the view currently displayed. Inactive: it depends from the graph."} type={"checkbox"} />
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
        <Input obj={view} field={"width"} label={"Width"} type={"number"}/>
        <Input obj={view} field={"height"} label={"Height"} type={"number"}/>

        <TextArea obj={view} field={"constants"} label={"Constants"} />
        <TextArea obj={view} field={"preRenderFunc"} label={"PreRender Function"} />
        <Input obj={view} field={"scalezoomx"} label={"Zoom X"} type={"number"}/>
        <Input obj={view} field={"scalezoomy"} label={"Zoom Y"} type={"number"}/>
        <div className={'d-flex p-1'}>
            <label className={'my-auto'}>Force Node</label>
            <select className={'my-auto ms-auto select'} value={view.forceNodeType} onChange={changeFN}>
                <option value={undefined}>-----</option>
                {['Graph', 'GraphVertex', 'Vertex', 'Field'].map((node, index) => {
                    return(<option key={index} value={node}>{node}</option>);
                })}
            </select>
        </div>

        <Input obj={view} field={"adaptWidth"} label={"Adapt Width"} type={"checkbox"}/>
        <Input obj={view} field={"adaptHeight"} label={"Adapt Height"} type={"checkbox"}/>
        <Input obj={view} field={"draggable"} label={"Draggable"} type={"checkbox"}/>
        <Input obj={view} field={"resizable"} label={"Resizable"} type={"checkbox"}/>
        <div className={'d-flex p-1'}>
            <label className={'my-auto'}>Viewpoint</label>
            <select className={'my-auto ms-auto select'} value={String(view.viewpoint?.id)} onChange={changeVP}>
                <option value={'null'}>-----</option>
                {viewpoints.map((viewpoint, index) => {
                    return(<option key={index} value={viewpoint.id}>{viewpoint.name}</option>);
                })}
            </select>
        </div>
        <TextArea obj={view} field={'onDragStart'} label={'OnDragStart'} />
        <TextArea obj={view} field={'onDragEnd'} label={'OnDragEnd'} />
        <TextArea obj={view} field={'onResizeStart'} label={'OnResizeStart'} />
        <TextArea obj={view} field={'onResizeEnd'} label={'OnResizeEnd'} />

        {/* damiano: qui Select avrebbe fatto comodo, ma è troppo poco generica, remove "data-" se viene generizzata Select */}
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
