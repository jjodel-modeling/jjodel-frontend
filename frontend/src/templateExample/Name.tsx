import React, {Dispatch, ReactElement, ReactNode} from 'react';
import {connect} from 'react-redux';
import {DState} from '../joiner';
import {FakeStateProps} from '../joiner/types';

function NameComponent(props: AllProps) {
    return (<div>Hello World!</div>);
}
interface OwnProps {}
interface StateProps {}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

export const NameConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(NameComponent);

const Name = (props: OwnProps, children: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <NameConnected {...{...props, children}} />;
}

export default Name;

