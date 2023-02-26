import React from "react";
import type {LViewElement} from "../../../view/viewElement/view";
import {SetRootFieldAction} from "../../../redux/action/action";
import OclEditor from "../oclEditor/OclEditor";
import JsxEditor from "../jsxEditor/JsxEditor";
import Input from "../../forEndUser/Input";

interface Props { view: LViewElement }

function ViewData(props: Props) {
    const view = props.view;

    const back = (evt: React.MouseEvent<HTMLButtonElement>) => {
        SetRootFieldAction.new('stackViews', undefined, '-=', true);
    }

    return(<div style={{overflowY: 'scroll'}}>
        <div className={'d-flex p-2'}>
            <b className={'ms-1 border border-dark my-auto'}>VIEW</b>
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
        <Input obj={view} field={"viewpoint"} label={"Viewpoint"} type={"number"}/>
        <OclEditor viewid={view.id} />
        <JsxEditor viewid={view.id} />
    </div>);
}

export default ViewData;
