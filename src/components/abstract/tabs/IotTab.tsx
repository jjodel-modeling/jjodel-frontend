import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {DState, SetRootFieldAction} from "../../../joiner";
import {useStateIfMounted} from "use-state-if-mounted";


function IotTabComponent(props: AllProps) {
    const iot = props.iot;
    const [topics, setTopics] = useStateIfMounted<string[]>([]);

    const editTopic = (evt: React.ChangeEvent<HTMLInputElement>, topic: number) => {
        topics[topic] = evt.target.value;
        setTopics([...topics]);
    }

    const save = () => {
        SetRootFieldAction.new('topics', topics, '', false);
        alert('Configuration Saved!');
    }

    if(!iot) return(<></>);

    return(<div className={'px-4'}>
        <div className={'mt-3'}>
            <div className={'p-1 d-flex'}>
                <label className={'my-auto'}>Broker IP</label>
                <input spellCheck={false} className={'my-auto input ms-auto'} type={'text'} />
            </div>
            <hr className={'my-3'} />
            <div className={'d-block text-center mb-2'}>
                <button disabled={topics.length <= 0} className={'me-3 px-2 btn btn-danger'} onClick={() => setTopics(topics.slice(0, -1))}>
                    -
                </button>
                <label>Topics (<b>{topics.length}</b>)</label>
                <button className={'ms-3 px-2 btn btn-success'} onClick={() => setTopics([...topics, ''])}>
                    +
                </button>
            </div>
            {topics.map((value, index) => {
                return(<div className={'p-1 d-flex'}>
                    <label className={'my-auto'}>Topic #<b>{index}</b></label>
                    <input onChange={(evt) => editTopic(evt, index)} spellCheck={false} className={'my-auto input ms-auto'} type={'text'} />
                </div>)
            })}
        </div>
        <button onClick={save} className={'mt-3 d-block btn btn-primary p-1 mx-auto'}>Save</button>
    </div>);
}
interface OwnProps {}
interface StateProps {iot: null|boolean}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const iot = state.iot;
    return {iot};
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


const IotTabConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(IotTabComponent);

const IotTab = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <IotTabConnected {...{...props, children}} />;
}
export default IotTab;
