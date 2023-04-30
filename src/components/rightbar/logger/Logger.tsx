import React, {Dispatch, PureComponent, ReactElement, ReactNode} from "react";
import {connect} from "react-redux";
import {
    DGraphElement,
    DModelElement, DPointerTargetable,
    DViewElement, Input,
    IStore, LGraphElement, LLog,
    LModelElement, LViewElement,
    MyProxyHandler,
    Pointer,
} from "../../../joiner";
import "../rightbar.scss";
import parse from 'html-react-parser';
import "./logger.scss";




interface ThisState {}

class LoggerComponent extends PureComponent<AllProps, ThisState> {

    constructor(props: AllProps, context: any) {
        super(props, context);
    }

    render(): ReactNode{
        return( <div className={"logger"}>
            {this.props.logs.map((lLog, i) => {
                return <div className={"log"} key={i}>{parse(lLog.value)}</div>
            })}
        </div>);
    }
}

interface OwnProps {}
interface StateProps {
    logs: LLog[]
}
interface DispatchProps {}

type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const logs: LLog[] = [];
    for(let dLog of state.logs) {
        const lLog: LLog = MyProxyHandler.wrap(dLog);
        logs.push(lLog);
    }
    return {logs: logs} as StateProps;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    return ret;
}


export const LoggerConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(LoggerComponent);

export const Logger = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    // @ts-ignore
    return <LoggerConnected {...{...props, childrens}} />;
}
export default Logger;
