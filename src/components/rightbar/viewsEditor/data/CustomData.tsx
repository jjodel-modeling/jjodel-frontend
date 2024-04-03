import React, {Dispatch, ReactElement} from 'react';
import {DState, DViewElement, LViewElement, Pointer, TextArea} from '../../../../joiner';
import {connect} from "react-redux";
import {Function} from "../../../forEndUser/FunctionComponent";

function ViewEventsComponent(props: AllProps) {
    const view = props.view;
    const readOnly = props.readonly;

    return(<section className={'p-3'}>
        <TextArea data={view} field={'onDataUpdate'} label={'onDataUpdate'} readonly={readOnly} />
        <TextArea data={view} field={'onDragStart'} label={'OnDragStart'} readonly={readOnly} />
        <TextArea data={view} field={'whileDragging'} label={'whileDragging'} readonly={readOnly} />
        <TextArea data={view} field={'onDragEnd'} label={'OnDragEnd'} readonly={readOnly} />
        <TextArea data={view} field={'onResizeStart'} label={'OnResizeStart'} readonly={readOnly} />
        <TextArea data={view} field={'whileResizing'} label={'whileResizing'} readonly={readOnly} />
        <TextArea data={view} field={'onResizeEnd'} label={'OnResizeEnd'} readonly={readOnly} />
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
