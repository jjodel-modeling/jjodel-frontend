import React from "react";
import type {LViewElement} from "../../../view/viewElement/view";
import {SetFieldAction, SetRootFieldAction} from "../../../redux/action/action";
import OclEditor from "../oclEditor/OclEditor";
import JsxEditor from "../jsxEditor/JsxEditor";
import Input from "../../forEndUser/Input";
import type {LViewPoint} from "../../../view/viewPoint/viewpoint";
import {TextArea} from "../../../joiner";

interface Props { view: LViewElement; viewpoints: LViewPoint[]; }

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
        <OclEditor viewid={view.id} />
        <JsxEditor viewid={view.id} />
    </div>);
}

export default ViewData;
