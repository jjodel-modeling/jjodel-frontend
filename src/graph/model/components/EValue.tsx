import {IStore} from "../../../redux/store";
import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {LStructuralFeature, LValue} from "../../../model/logicWrapper";
import {SetRootFieldAction} from "../../../redux/action/action";


function EValueComponent(props: AllProps) {

    const value = props.value;
    const feature: LStructuralFeature = LStructuralFeature.from(value.instanceof[0]);

    const click = (e: React.MouseEvent<HTMLDivElement>) => {
        SetRootFieldAction.new('_lastSelected', {
            modelElement: value.id
        });
        e.stopPropagation();
    }

    return <div className={"EValue-container"} id={value.id} onClick={click}>
        {feature.name}:{value.value}
    </div>
}
interface OwnProps { value: LValue }
interface StateProps {}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {};
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const EValueConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(EValueComponent);

export const EValue = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <EValueConnected {...{...props, childrens}} />;
}
export default EValue;

