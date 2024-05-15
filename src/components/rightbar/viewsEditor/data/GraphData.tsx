import React, {Dispatch} from 'react';
import {
    DState,
    DViewElement,
    GenericInput,
    GObject,
    Info,
    LPointerTargetable,
    LViewElement,
    Pointer,
    Select
} from '../../../../joiner';
import {FakeStateProps} from "../../../../joiner/types";
import {connect} from "react-redux";

function GraphDataComponent(props: AllProps) {
    const view = props.view;
    const readOnly = props.readonly;
    let empty = true;
    // if (empty) return null;
    return(<section className={'p-3'}>
        {<h5>Graph</h5>}
        No options for Graphs so far...
    </section>);
}

interface OwnProps {
    viewID: Pointer<DViewElement>;
    readonly : boolean;
}

interface StateProps {
    view: LViewElement;
}

interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.view = LPointerTargetable.fromPointer(ownProps.viewID);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

export const GraphData = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(GraphDataComponent);

export default GraphData;
