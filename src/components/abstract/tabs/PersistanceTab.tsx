import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {IStore} from "../../../redux/store";
import API from "../../../api/api";


function PersistanceTabComponent(props: AllProps) {
    return(<div>
        <button className={'btn btn-primary'} onClick={() => API.post()}>click</button>
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

export const PersistanceTab = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <PersistanceTabConnected {...{...props, children}} />;
}
export default PersistanceTab;
