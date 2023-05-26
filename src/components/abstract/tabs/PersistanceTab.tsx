import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {IStore} from "../../../redux/store";
import MemoRec from "../../../memorec/api";
import {useStateIfMounted} from "use-state-if-mounted";


function PersistanceTabComponent(props: AllProps) {

    const [data, setData] = useStateIfMounted<any>(null);

    return(<div>
        <button className={'btn btn-primary'} onClick={async() => setData(await MemoRec.test())}>
            POST
        </button>
        <hr className={'my-2'} />
        {JSON.stringify(data)}
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
