import React from "react";
import type {LViewElement} from "../../../view/viewElement/view";
import {SetFieldAction, SetRootFieldAction} from "../../../redux/action/action";
import OclEditor from "../oclEditor/OclEditor";
import JsxEditor from "../jsxEditor/JsxEditor";
import Input from "../../forEndUser/Input";
import {Selectors} from "../../../joiner";

interface Props { view: LViewElement }

function ViewData(props: Props) {
    const view = props.view;
    const viewpoint = view.viewpoint;

    const back = (evt: React.MouseEvent<HTMLButtonElement>) => {
        SetRootFieldAction.new('stackViews', undefined, '-=', true);
    }
    const change = (evt: React.ChangeEvent<HTMLSelectElement>) => {
        const value = evt.target.value;
        if(value) { SetFieldAction.new(view.id, 'viewpoint', value, '', true); }
        else { SetFieldAction.new(view.id, 'viewpoint', value, '', false); }
    }

    return(<div style={{overflowY: 'scroll'}}>
        <div className={'d-flex p-2'}>
            <b className={'ms-1 my-auto'}>VIEW</b>
            <button className={'btn btn-danger ms-auto'} onClick={back}>
                <i className={'p-1 bi bi-arrow-left'}></i>
            </button>
        </div>
        <Input obj={view} field={"name"} label={"Name"} type={"text"}/>
        <Input obj={view} field={"width"} label={"Width"} type={"number"}/>
        <Input obj={view} field={"height"} label={"Height"} type={"number"}/>
        <Input obj={view} field={"adaptWidth"} label={"Adapt Width"} type={"checkbox"}/>
        <Input obj={view} field={"adaptHeight"} label={"Adapt Height"} type={"checkbox"}/>
        <Input obj={view} field={"draggable"} label={"Draggable"} type={"checkbox"}/>
        <Input obj={view} field={"resizable"} label={"Resizable"} type={"checkbox"}/>
        <div className={'d-flex p-1'}>
            <label className={'my-auto'}>Viewpoint</label>
            <select className={'my-auto ms-auto select'} value={String(viewpoint?.id)} onChange={change}>
                <option value={'undefined'}>-----</option>
                {Selectors.getViewpoints().map((viewpoint, index) => {
                    return(<option value={viewpoint.id}>{viewpoint.name}</option>);
                })}
            </select>
        </div>
        <OclEditor viewid={view.id} />
        <JsxEditor viewid={view.id} />
    </div>);
}

export default ViewData;
