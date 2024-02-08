import React, {Dispatch, PureComponent, ReactElement, ReactNode} from "react";
import {connect} from "react-redux";
import {
    DGraphElement,
    DModelElement,
    DPointerTargetable,
    DViewElement,
    DState,
    DObject,
    LObject,
    LGraphElement,
    LModelElement,
    LViewElement,
    Pointer, U, DUser,
} from "../../../joiner";
import Structure from "./Structure";
import {FakeStateProps} from '../../../joiner/types';



interface ThisState {}
class StructureEditorComponent extends PureComponent<AllProps, ThisState> {

    constructor(props: AllProps, context: any) {
        super(props, context);
    }

    render(): ReactNode {
        const node = this.props.node;
        const view = this.props.view;
        const data = this.props.data;
        return <div className={'mb-5'}>
            <div className={'px-3 mt-3'}>
                {Structure.Editor(data || null)}
                {data?.className === DObject.cname && U.wrapper<LObject>(data).features.map((f, i) => {
                    return(<div key={i}>
                        <hr className={'my-3'} />
                        <label className={'text-center'}>{f.instanceof?.name}</label>
                        {Structure.Editor(f)}
                    </div>);
                })}
            </div>
            <div className={'mt-2'}></div>
        </div>;
    }
}

interface OwnProps {}
interface StateProps {
    node?: LGraphElement
    view?: LViewElement
    data?: LModelElement
}
interface DispatchProps {}

type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    const nodeid = state._lastSelected?.node;
    const viewid = state._lastSelected?.view;
    const dataid = state._lastSelected?.modelElement;
    if(nodeid) ret.node = LGraphElement.fromPointer(nodeid);
    if(viewid) ret.view = LViewElement.fromPointer(viewid);
    if(dataid) ret.data = LModelElement.fromPointer(dataid);
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
