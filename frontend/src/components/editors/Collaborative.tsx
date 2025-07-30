import {Dispatch, ReactElement, ReactNode, useEffect, useState} from 'react';
import {connect} from 'react-redux';
import {DProject, DState, LProject} from '../../joiner';
import {DUser, GObject, LUser, U} from '../../joiner';
import {FakeStateProps} from '../../joiner/types';
import {UsersApi} from "../../api/persistance";
import {Btn, CommandBar} from '../commandbar/CommandBar';

function CollaborativeComponent(props: AllProps) {
    const {project, users} = props;
    const [emails, setEmails] = useState<string[]>([]);
    const [filteredEmails, setFilteredEmails] = useState<string[]>([]);
    const [email, setEmail] = useState<string>('');

    useEffect(() => {
        (async function() {
            setEmails(await UsersApi.getAllEmails());
        })();
    }, []);

    useEffect(() => {
        if(!email) setFilteredEmails([]);
        else setFilteredEmails(emails.filter(e => e.startsWith(email)));
    }, [email])

    const addCollaborator = async(e: string) => {
        const user = await UsersApi.getUserByEmail(e);
        if(!user) {
            U.alert('e', 'Cannot retrieve user data.', 'Something went wrong ...');
            return;
        }
        if(!users.map(u => u.id).includes(user.id))
            DUser.new(user.name, user.surname, user.nickname, user.affiliation, user.country, user.newsletter, user.email, '', user.id, user._Id);
        if(project.collaborators.map(c => c.id).includes(user.id)) return;
        project.collaborators = [...((project.__raw||project) as DProject).collaborators, user.id] as any;
    }

    return(<section className={'page-root collaborative-tab'}>
        <h1 className={'view'}>Collaborative Modeling</h1>
        <div className={'p-1 w-100  d-flex'} style={{borderRadius: 'var(--radius)'}}>
            <h5><i className="bi bi-person-video3"></i> Editor</h5>
            <label className={'ms-auto'}>{project.author.nickname}</label>
        </div>
        {project.collaborators.length > 0 && <div className={'mt-2 p-1 w-100 border'} style={{borderRadius: 'var(--radius'}}>
            <h5><i className="bi bi-person-video3"></i> Collaborators</h5>
            <div className={'ms-auto'}>
                {project.collaborators.map((c, index) => {
                    return(<label className={'ms-1'} key={index}>{c.surname}</label>);
                })}
            </div>
        </div>}
        <input placeholder={'contributor email'} className={'input w-25 float-end'} defaultValue={email} onChange={e => setEmail(e.target.value)} />
        <div>
            {filteredEmails.map(e => <div key={e}>
                <CommandBar className={'float-end'} style={{marginLeft: '5px'}}>
                    {e}
                    <Btn icon={'add'} action={() => addCollaborator(e)} tip={'Invite contributor'} />
                </CommandBar>
            </div>)}
        </div>
        <div className={'alert'}>
            <i className="bi bi-exclamation-circle"></i>
            Important: After sending the invitation, save the project!
        </div>
    </section>);
}
interface OwnProps {}
interface StateProps {project: LProject, users: LUser[]}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    const user = LUser.fromPointer(DUser.current) as LUser;
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

export const Collaborative = (props: OwnProps, children: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <CollaborativeConnected {...{...props, children}} />;
}
