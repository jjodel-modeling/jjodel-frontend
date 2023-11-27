import React, {Dispatch, PureComponent, ReactElement, ReactNode} from "react";
import {connect} from "react-redux";
import {
    DGraphElement,
    DModelElement,
    DPointerTargetable,
    DViewElement,
    DState,
    LGraphElement,
    LModelElement,
    LViewElement,
    Pointer, U, DUser,
} from "../../../joiner";
import Structure from "./Structure";


interface ThisState {}

class StructureEditorComponent extends PureComponent<AllProps, ThisState> {

    constructor(props: AllProps, context: any) {
        super(props, context);
    }

    render(): ReactNode{
        const data: LModelElement|null = (this.props.node?.model) ? this.props.node?.model : null;
        return <div className={"px-4"}>
            <div className={"mt-3"}>
                {Structure.Editor(data)}
            </div>
        </div>;
    }
}

interface OwnProps {}
interface StateProps {
    node: LGraphElement|null
}
interface DispatchProps {}

type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    const nodeid = state._lastSelected?.node;
    if(nodeid) ret.node = LGraphElement.fromPointer(nodeid);
    else ret.node = null;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    return ret;
}


export const StructureEditorConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(StructureEditorComponent);

export const StructureEditor = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <StructureEditorConnected {...{...props, children}} />;
}
export default StructureEditor;
