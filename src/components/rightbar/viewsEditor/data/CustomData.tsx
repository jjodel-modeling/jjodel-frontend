import React, {Dispatch, ReactElement} from 'react';
import {DState, DViewElement, LViewElement, Pointer, TextArea} from '../../../../joiner';
import {connect} from "react-redux";
import {Function} from "../../../forEndUser/FunctionComponent";
import JsEditor from "../../jsEditor/JsEditor";

function ViewEventsComponent(props: AllProps) {
    const view = props.view;

    return(<section className={'p-3'}>
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
            <button className={'btn btn-primary ms-auto'}
                    onClick={e => view.events = [...view.events, 'function myCustomEvent() {\n    \n}']}>
                <i className={'p-1 bi bi-plus'}></i>
            </button>
        </div>
        <hr className={'my-1'} />
        {view.events.map((e, i) => <JsEditor
            viewID={view.id} key={i}
            title={`Event ${i + 1}`}
            jsxLabel={<button className={'btn btn-danger my-auto ms-auto'} onClick={() => view.events = view.events.filter((_e, _i) => _i !== i)}>
                <i className={'p-1 bi bi-trash3-fill'}></i>
            </button>}
            getter={() => e}
            setter={(js) => {
                const events = view.events;
                events[i] = js;
                view.events = events;
                }}
        />)}
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
