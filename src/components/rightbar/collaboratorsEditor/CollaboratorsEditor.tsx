import {Dispatch, ReactElement} from 'react';
import {connect} from 'react-redux';
import type {DState, LProject} from '../../../joiner';
import {DUser, GObject, LUser, SetRootFieldAction, U} from '../../../joiner';
import {FakeStateProps} from '../../../joiner/types';
import {ProjectsApi, UsersApi} from "../../../api/persistance";

function CollaboratorsEditorComponent(props: AllProps) {
    const {project, users} = props;

    const addCollaborator = async() => {
        const email = ($('#collaborator-email')[0] as GObject).value;
        if(!email) {alert('User not found!'); return;}
        const user = await UsersApi.getUserByEmail(email);
        if(!user) {alert('User not found!'); return;}
        console.log('Save (user)', user)
        if(!users.map(u => u.id).includes(user.id)) DUser.new(user.username, user.id);
        if(project.collaborators.map(c => c.id).includes(user.id)) return;
        project.collaborators = [...project.collaborators, user];
    }

    return (<div className={'p-2'}>
        <div className={'p-1 w-100 border d-flex'}>
            <b>Author</b>
            <label className={'ms-auto'}>{project.author.username}</label>
        </div>
        {(project.author.id === DUser.current) && <div className={'mt-2 p-1 w-100 border d-flex'}>
            <input className={'input w-25'} id={'collaborator-email'} />
            <button className={'ms-1 btn btn-success px-2'} onClick={addCollaborator}>
                + Collaborator
            </button>
        </div>}
        <div className={'mt-2 p-1 w-100 border d-flex'}>
            <b>Collaborators</b>
            <div className={'ms-auto'}>
                {project.collaborators.map((collaborator, index) => {
                    return(<label className={'ms-1'} key={index}>{collaborator.username}</label>);
                })}
            </div>
        </div>
        ** Important: To send the request Save the project! **
    </div>);
}
interface OwnProps {}
interface StateProps {project: LProject, users: LUser[]}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    const user = LUser.fromPointer(DUser.current);
    ret.project = user.project as LProject;
    ret.users = LUser.fromPointer(state.users);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

export const CollaboratorsEditorConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(CollaboratorsEditorComponent);

const CollaboratorsEditor = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <CollaboratorsEditorConnected {...{...props, children}} />;
}

export default CollaboratorsEditor;

