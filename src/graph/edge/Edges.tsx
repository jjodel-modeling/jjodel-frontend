import {IStore} from "../../redux/store";
import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {
    LModelElement,
    LGraphElement,
    LReference,
    MyProxyHandler, LClass, U,
} from "../../joiner";
import EdgeTest from "./Test";


interface ThisState {}

function EdgesComponent(props: AllProps, state: ThisState) {
    const me = props.source.model;
    if(me?.className === "DReference") {
        const lReference: LReference = me as any;
        const lTarget: LModelElement = MyProxyHandler.wrap(lReference?.type);
        return <>
            {(props.targets) ? props.targets.map((targetNode) => {
                return <EdgeTest source={props.source} target={targetNode} />
            }) : <Edges source={props.source} targets={lTarget.nodes} />}
        </>;
    }
    if(me?.className === "DClass") {
        const lClass: LClass = me as any;
        if(lClass.extends.length > 0) {
            const lTarget: LModelElement = MyProxyHandler.wrap(lClass?.extends[0]);
            return <>
                {(props.targets) ? props.targets.map((targetNode) => {
                    return <EdgeTest source={props.source} target={targetNode} />
                }) : <Edges source={props.source} targets={lTarget.nodes} />}
            </>;
        }
    }
    return <></>;
}
interface OwnProps { source: LGraphElement; targets?: LGraphElement[] }
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


export const EdgesConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(EdgesComponent);

export const Edges = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <EdgesConnected {...{...props, childrens}} />;
}
export default Edges;

