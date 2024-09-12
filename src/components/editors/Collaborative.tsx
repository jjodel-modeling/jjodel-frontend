import {Dispatch, ReactElement} from 'react';
import {connect} from 'react-redux';
import type {DState, LProject} from '../../joiner';
import {DUser, GObject, LUser} from '../../joiner';
import {FakeStateProps} from '../../joiner/types';
import {UsersApi} from "../../api/persistance";
import {Btn, CommandBar} from '../commandbar/CommandBar';

function CollaborativeComponent(props: AllProps) {
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

    // return (
    //     <div className={'p-2'}>


    //             <div className={'p-1 w-100 border d-flex'}>
    //                 <b>Editor</b>
    //                 <label className={'ms-auto'}>{project.author.username}</label>
    //             </div>
    //             {(project.author.id === DUser.current) && <div className={'mt-2 p-1 w-100 border d-flex'}>

    //             <input className={'input w-25 jj-input'} id={'collaborator-email'} />
    //
    //             <CommandBar style={{marginLeft: '5px', marginTop: '2px'}}><Btn icon={'add'} action={addCollaborator} tip={'Invite contributor'} /></CommandBar>
    //         </div>}
    //         <div className={'mt-2 p-1 w-100 border d-flex'}>
    //             <b>Contributors</b>
    //             <div className={'ms-auto'}>
    //                 {project.collaborators.map((collaborator, index) => {
    //                     return(<label className={'ms-1'} key={index}>{collaborator.username}</label>);
    //                 })}
    //             </div>
    //         </div>
    //         ** Important: To send the request Save the project! **

    // </div>);

    return(<section className={'page-root collaborative-tab'}>
        <h1 className={'view'}>Collaborative Modeling</h1>
        <div className={'p-1 w-100  d-flex'} style={{borderRadius: 'var(--radius)'}}>
            <h5><i className="bi bi-person-video3"></i> Editor</h5>
            <label className={'ms-auto'}>{project.author.username}</label>
        </div>
        <div className={'mt-2 p-1 w-100 border '} style={{borderRadius: 'var(--radius'}}>
            <h5><i className="bi bi-person-video3"></i> Contributors
                <CommandBar className={'float-end'} style={{marginLeft: '5px'}}><Btn icon={'add'} action={addCollaborator} tip={'Invite contributor'} /></CommandBar>
                <input placeholder={'contributor email'} className={'input w-25 float-end'} id={'collaborator-email'} />

            </h5>
            <div className={'ms-auto'}>
                {project.collaborators.map((collaborator, index) => {
                    return(<label className={'ms-1'} key={index}>{collaborator.username}</label>);
                })}
            </div>
        </div>
        <div className={'alert'}><i className="bi bi-exclamation-circle"></i> Important: Before sending the invitation, save the project!</div>
    </section>);
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

export const CollaborativeConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(CollaborativeComponent);

export const Collaborative = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <CollaborativeConnected {...{...props, children}} />;
}
