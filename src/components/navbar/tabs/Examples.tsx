import React, {Dispatch, ReactElement} from 'react';
import {DState} from '../../../redux/store';
import {connect} from 'react-redux';
import {LoadAction} from '../../../redux/action/action';
import stateExamples from '../../../examples';

function ExamplesComponent(props: AllProps) {

    const load = (state: string) => {
        return LoadAction.new(JSON.parse(state));
    }

    const setExample = (example: number) => {
        switch(example) {
            case 1:
                return load(stateExamples.first);
            case 2:
                return load(stateExamples.second);
            default:
                return;
        }

    }

    return(<li className={'nav-item dropdown'}>
        <div tabIndex={-1} className={'dropdown-toggle'} data-bs-toggle={'dropdown'}>Examples</div>
        <ul className={'dropdown-menu'}>
            <li tabIndex={-1} onClick={e => setExample(1)}  className={'dropdown-item'}>Simplified Class Diagram</li>
            <li tabIndex={-1} onClick={e => setExample(2)}  className={'dropdown-item'}>Nodes & Edges</li>
        </ul>
    </li>);
}

interface OwnProps {}
interface StateProps {}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    return {};
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
