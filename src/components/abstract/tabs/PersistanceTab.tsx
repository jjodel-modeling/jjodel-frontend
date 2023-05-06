import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {IStore} from "../../../redux/store";
import Persistance from "../../../persistance/api";


function PersistanceTabComponent(props: AllProps) {
    return(<div>
        <button className={'d-block btn btn-primary'} onClick={() => Persistance.post()}>post</button>
        <button className={'d-block btn btn-primary'} onClick={() => Persistance.get()}>get</button>
    </div>);
}
interface OwnProps {}
interface StateProps {}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const PersistanceTabConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(PersistanceTabComponent);

export const PersistanceTab = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <PersistanceTabConnected {...{...props, childrens}} />;
}
export default PersistanceTab;
