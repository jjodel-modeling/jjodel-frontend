/* Viewpoints > Events */

import React, {Dispatch, EventHandler, MouseEventHandler, ReactElement, ReactNode} from 'react';
import {DState, DViewElement, GObject, LViewElement, Pointer, TextArea, U} from '../../../../joiner';
import {connect} from "react-redux";
import {JsEditor} from "../../languages";
import {Function} from "../../../forEndUser/FunctionComponent";
import { CommandBar, Btn, Sep } from '../../../commandbar/CommandBar';
import './events-tab.scss';

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
    const customEventKeys = Object.keys(dview.events).filter(k => dview.events[k]);

    return(<section className={'events-tab'}>
        {/* Default Events Section */}
        <div className="events-section events-section--default">
            <div className="events-section-header">
                <h3 className="events-section-title">
                    <i className="bi bi-gear" />
                    Default Events
                </h3>
                <span className="events-section-badge">System</span>
            </div>
            <div className="events-list">
                <JsEditor key='odu' data={view} field={'onDataUpdate'} title={'onDataUpdate'} initialExpand={initialExpand} readOnly={readOnly}/>
                <JsEditor key='ods' data={view} field={'onDragStart'} title={'onDragStart'} initialExpand={initialExpand} readOnly={readOnly}/>
                <JsEditor key='odw' data={view} field={'whileDragging'} title={'whileDragging'} initialExpand={initialExpand} readOnly={readOnly}/>
                <JsEditor key='ode' data={view} field={'onDragEnd'} title={'onDragEnd'} initialExpand={initialExpand} readOnly={readOnly}/>
                <JsEditor key='ors' data={view} field={'onResizeStart'} title={'onResizeStart'} initialExpand={initialExpand} readOnly={readOnly}/>
                <JsEditor key='orw' data={view} field={'whileResizing'} title={'whileResizing'} initialExpand={initialExpand} readOnly={readOnly}/>
                <JsEditor key='ore' data={view} field={'onResizeEnd'} title={'onResizeEnd'} initialExpand={initialExpand} readOnly={readOnly}/>
            </div>
        </div>

        {/* Separator */}
        <div className="events-separator" />

        {/* Custom Events Section */}
        <div className="events-section events-section--custom">
            <div className="events-section-header">
                <h3 className="events-section-title">
                    <i className="bi bi-code-square" />
                    Custom Events
                </h3>
                <button
                    className="events-add-btn"
                    onClick={addEvent}
                    disabled={readOnly}
                    title="Add custom event"
                >
                    <i className="bi bi-plus" />
                </button>
            </div>

            {customEventKeys.length === 0 ? (
                <div className="events-empty-state">
                    <i className="bi bi-plus-circle" />
                    <p>No custom events defined</p>
                    <button
                        className="events-empty-btn"
                        onClick={addEvent}
                        disabled={readOnly}
                    >
                        <i className="bi bi-plus" />
                        Add Event
                    </button>
                </div>
            ) : (
                <div className="events-list events-list--custom">
                    {customEventKeys.map((k) => {
                        let val = dview.events[k];
                        return (
                            <div className="custom-event-wrapper" key={k}>
                                <JsEditor
                                    data={view}
                                    readOnly={readOnly}
                                    initialExpand={()=>true}
                                    title={
                                        <input
                                            className="custom-event-name-input"
                                            defaultValue={k}
                                            disabled={readOnly}
                                            onBlur={(e)=>{
                                                let newname = e.target.value;
                                                if (k === newname) return;
                                                let newEvent: GObject = {};
                                                newEvent[newname] = dview.events[k];
                                                newEvent[k] = undefined;
                                                view.events = newEvent;
                                            }}
                                        />
                                    }
                                    jsxLabel={
                                        <CommandBar className={'ms-auto'} style={{paddingTop: '9px'}}>
                                            <Btn icon={'delete'} tip={'Remove event'} action={() => {
                                                let newEvent: GObject = {};
                                                newEvent[k] = undefined;
                                                view.events = newEvent;
                                            }}/>
                                        </CommandBar>
                                    }
                                    getter={() => val}
                                    setter={(js) => {
                                        let newEvent: GObject = {};
                                        newEvent[k] = js;
                                        view.events = newEvent;
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    </section>);
}

interface OwnProps {viewID: Pointer<DViewElement, 1, 1, LViewElement>, readonly: boolean}
interface StateProps {view: LViewElement}
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const view = LViewElement.fromPointer(ownProps.viewID) as LViewElement;
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

export const ViewEvents = (props: OwnProps, children: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <ViewEventsConnected {...{...props, children}} />;
}
export default ViewEvents;
