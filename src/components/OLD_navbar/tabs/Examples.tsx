import React, {Dispatch, ReactElement} from 'react';
import {DState} from '../../../redux/store';
import {connect} from 'react-redux';
import {LoadAction} from '../../../redux/action/action';
import stateExamples from '../../../examples';

function ExamplesComponent(props: AllProps) {
    const setPath = props.setPath;

    const load = (state: string) => {
        return LoadAction.new(JSON.parse(state));
    }

    const setExample = (example: number) => {
        setPath('');
        switch(example) {
            case 1:
            default:
                return load(stateExamples.first);
        }

    }


    return(<div className={'tab'} style={{marginLeft: '9.5%'}}>
        <div tabIndex={-1} onClick={e => setExample(1)}  className={'tab-item'}>First</div>
        <div tabIndex={-1} onClick={e => setPath('')}  className={'text-danger tab-item'}>Close</div>
    </div>);
}

interface OwnProps {setPath: (path: string) => void}
interface StateProps {}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const room = state.room;
    const debug = state.debug;
    return {room, debug};
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const ExamplesConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(ExamplesComponent);

export const Examples = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <ExamplesConnected {...{...props, children}} />;
}

export default Examples;
