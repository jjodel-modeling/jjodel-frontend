import {GObject, LViewElement, U} from "../../../joiner";
import JsEditor from "../../rightbar/jsEditor/JsEditor";
import React from "react";

type Props = {view: LViewElement};
function ViewEvents(props: Props): JSX.Element {
    const {view} = props;
    const dview = view.__raw;
    const readOnly = false;

    function addEvent() {
        let eventname = "customEvent1";
        eventname = U.increaseEndingNumber(eventname, false, false, (s)=> s in dview.events);
        let newevent: GObject = {};
        newevent[eventname] = '(parameter1, parameter2) => {\n\t// example, replace with your function\n\treturn parameter1 + parameter2;\n}';
        view.events = newevent;
    }

    return(<>
        <b style={{fontSize: '1.25em'}}>Default Events</b>
        <hr className={'my-1'} />
        <JsEditor viewID={view.id} field={'onDataUpdate'} title={'onDataUpdate'}  />
        <JsEditor viewID={view.id} field={'onDragStart'} title={'onDragStart'}  />
        <JsEditor viewID={view.id} field={'whileDragging'} title={'whileDragging'}  />
        <JsEditor viewID={view.id} field={'onDragEnd'} title={'onDragEnd'}  />
        <JsEditor viewID={view.id} field={'onResizeStart'} title={'onResizeStart'}  />
        <JsEditor viewID={view.id} field={'whileResizing'} title={'whileResizing'}  />
        <JsEditor viewID={view.id} field={'onResizeEnd'} title={'onResizeEnd'}  />
        <div className={'d-flex mx-auto'}>
            <b style={{fontSize: '1.25em'}}>Custom Events</b>
            <button className={'btn btn-primary ms-auto'} onClick={addEvent} disabled={readOnly}>
                <i className={'p-1 bi bi-plus'} />
            </button>
        </div>
        <hr className={'my-1'} />
        {Object.keys(dview.events).map((k) => {
            let val = dview.events[k];
            if (!val) return;
            return <>
                <JsEditor
                    viewID={view.id} key={k/* if val does not update, concatenate it to the key (k+val)*/}
                    readonly={readOnly}
                    title={<input defaultValue={k} disabled={readOnly} onBlur={(e)=>{
                        let newname = e.target.value;
                        if (k === newname) return;
                        let newEvent: GObject = {};
                        newEvent[newname] = dview.events[k];
                        newEvent[k] = undefined;
                        view.events = newEvent;
                    }}/>}
                    jsxLabel={<button className={'btn btn-danger my-auto ms-auto'} onClick={() => {
                        let newEvent: GObject = {};
                        newEvent[k] = undefined; // this is how you trigger deletion with object -= action
                        view.events = newEvent;
                    }} disabled={readOnly}>
                        <i className={'p-1 bi bi-trash3-fill'} />
                    </button>}
                    getter={() => val}
                    setter={(js) => {
                        let newEvent: GObject = {};
                        newEvent[k] = js;
                        view.events = newEvent;
                    }}
                /></>})}
        <div className={'p-4'}></div>
    </>);
}

export {ViewEvents};

