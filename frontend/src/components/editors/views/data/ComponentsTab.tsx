import {DState, DViewElement, LPointerTargetable, LViewElement, Overlap, Pointer} from "../../../../joiner";
import {FakeStateProps} from "../../../../joiner/types";
import {Dispatch} from "react";
import {connect} from "react-redux";

export function ComponentsTabComponent(props: AllProps): JSX.Element{
    return <>
        'components tab todo'
    </>
}


interface OwnProps {
    viewID: Pointer<DViewElement>;
    readonly : boolean;
}

interface StateProps {
    view: LViewElement;
}

interface DispatchProps {}
type AllProps = Overlap<Overlap<OwnProps, StateProps>, DispatchProps>;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.view = LPointerTargetable.fromPointer(ownProps.viewID);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps { const ret: DispatchProps = {}; return ret; }

export const ComponentsTab = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(ComponentsTabComponent);

(ComponentsTab as any).cname = 'ComponentsTab';
ComponentsTabComponent.cname = 'ComponentsTabComponent';
