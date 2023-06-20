import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {IStore} from "../../../redux/store";
import {GObject, Selectors} from "../../../joiner";
import {useStateIfMounted} from "use-state-if-mounted";

function TestTabComponent(props: AllProps) {

    const [dict, setDict] = useStateIfMounted<GObject>({});

    const click = () => {
        setDict(Selectors.getSelected());
    }

    return(<div>
        <button onClick={click} className={'btn btn-primary'}>Test</button>
        {Object.keys(dict).map((user) => {
            return(<div><b>{user}</b>: {dict[user]}</div>)
        })}
        {Object.keys(dict).length === 0 && <div>Empty...</div>}
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


const TestTabConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(TestTabComponent);

const TestTab = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <TestTabConnected {...{...props, children}} />;
}
export default TestTab;
