import React, {Dispatch, ReactElement} from 'react';
import {DState, DViewElement, GObject, LViewElement, Pointer, U} from '../../../../joiner';
import {connect} from "react-redux";
import {JsEditor} from "../../languages";
import {Btn, CommandBar} from '../../../commandbar/CommandBar';

function ViewEventsComponent(props: AllProps) {
    const view = props.view;
    const dview = props.view.__raw;
    const readOnly = props.readonly;

    function addEvent() {
        let eventname = "customEvent1";
        eventname = U.increaseEndingNumber(eventname, false, false, (s)=> s in dview.events);
        let newevent: GObject = {};
        newevent[eventname] = '(parameter1, parameter2) => {\n\t// example, replace with your function\n\treturn parameter1 + parameter2;\n}';
        view.events = newevent;
    }

    let initialExpand = (v: any, field: any)=>!!(v as any)[field as string];
    return(<section className={'p-3 events-tab'}>
        <h1 className={'view'}>View: {view.name}</h1>
        <h2>Default Events</h2>
        <JsEditor viewID={view.id} field={'onDataUpdate'} title={'onDataUpdate'} initialExpand={initialExpand} readonly={readOnly}/>
        <JsEditor viewID={view.id} field={'onDragStart'} title={'onDragStart'} initialExpand={initialExpand} readonly={readOnly}/>
        <JsEditor viewID={view.id} field={'whileDragging'} title={'whileDragging'} initialExpand={initialExpand} readonly={readOnly}/>
        <JsEditor viewID={view.id} field={'onDragEnd'} title={'onDragEnd'} initialExpand={initialExpand} readonly={readOnly}/>
        <JsEditor viewID={view.id} field={'onResizeStart'} title={'onResizeStart'} initialExpand={initialExpand} readonly={readOnly}/>
        <JsEditor viewID={view.id} field={'whileResizing'} title={'whileResizing'} initialExpand={initialExpand} readonly={readOnly}/>
        <JsEditor viewID={view.id} field={'onResizeEnd'} title={'onResizeEnd'} initialExpand={initialExpand} readonly={readOnly}/>
        <div className={'d-flex mx-auto'} style={{marginTop: '14px'}}>
            <h2>Custom Events</h2>
            <CommandBar className={'ms-auto'} style={{paddingTop: '12px'}}>
                <Btn icon={'add'} action={addEvent}  tip={'New event'}/>
            </CommandBar>
        </div>
        {Object.keys(dview.events).map((k) => {
            let val = dview.events[k];
            if (!val) return;
            return <>
            <JsEditor
            viewID={view.id} key={k/* if val does not update, concatenate it to the key (k+val)*/}
            readonly={readOnly}
            initialExpand={()=>true}
            title={<input defaultValue={k} disabled={readOnly} onBlur={(e)=>{
                let newname = e.target.value;
                if (k === newname) return;
                let newEvent: GObject = {};
                newEvent[newname] = dview.events[k];
                newEvent[k] = undefined;
                view.events = newEvent;
            }}/>}
            jsxLabel={<CommandBar className={'ms-auto'} style={{paddingTop: '9px'}}>
                <Btn icon={'delete'} tip={'Remove event'} action={() => {
                    let newEvent: GObject = {};
                    newEvent[k] = undefined; // this is how you trigger deletion with object -= action
                    view.events = newEvent;
                }}/>
            </CommandBar>}
            getter={() => val}
            setter={(js) => {
                let newEvent: GObject = {};
                newEvent[k] = js;
                view.events = newEvent;
            }}
        /></>})}
        <div className={'p-4'}></div>
    </section>);
}

interface OwnProps {viewID: Pointer<DViewElement, 1, 1, LViewElement>, readonly: boolean}
interface StateProps {view: LViewElement}
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const view = LViewElement.fromPointer(ownProps.viewID);
    return {view};
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const ViewEventsConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(ViewEventsComponent);

export const ViewEvents = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <ViewEventsConnected {...{...props, children}} />;
}
export default ViewEvents;
