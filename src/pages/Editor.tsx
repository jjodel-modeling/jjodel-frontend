import React, {Dispatch, ReactElement} from 'react';
import {connect} from 'react-redux';
import {DState, LUser} from '../joiner';
import {FakeStateProps} from '../joiner/types';

function EditorComponent(props: AllProps) {
    const user = props.user;
    const project = user.project;

    return (<div>
        {project?.name}
        <button onClick={e => user.project = null}>back</button>
    </div>);
}
interface OwnProps {}
interface StateProps {user: LUser}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.user = LUser.fromPointer(state.user);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

export const EditorConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(EditorComponent);

const Editor = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <EditorConnected {...{...props, children}} />;
}

export default Editor;

