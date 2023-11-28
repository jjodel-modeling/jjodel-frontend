import React, {Dispatch, ReactElement} from 'react';
import {connect} from 'react-redux';
import {
    BEGIN,
    DeleteElementAction,
    DProject,
    DUser,
    END,
    LProject,
    LUser,
    SetRootFieldAction,
    U
} from '../joiner';
import type{DState, GObject} from '../joiner';
import {FakeStateProps} from '../joiner/types';
import PersistanceApi from "../api/persistance";
import {useEffectOnce} from "usehooks-ts";

function DashboardComponent(props: AllProps) {
    const user = props.user;

    useEffectOnce(() => {
        (async function() {
            if (DUser.offlineMode) return;
            await PersistanceApi.loadMyProjects();
        })();
    })

    const createProject = async(type: DProject['type'], id?: DProject['id']) => {
        if (id) {
            SetRootFieldAction.new('isLoading', true);
            const project = await PersistanceApi.getProjectById(id);
            if(!project) {
                alert('This project does NOT exist!');
                return;
            }
            SetRootFieldAction.new('isLoading', false);
            user.projects = [...user.projects, project];
            return;
        }
        let name = 'project_' + 0;
        let projectNames: string[] = user.projects.map(p => p.name);
        name = U.increaseEndingNumber(name, false, false, newName => projectNames.indexOf(newName) >= 0);
        const project = DProject.new(type, name, user.id, id);
        user.projects = [...user.projects, LProject.fromD(project)];
        SetRootFieldAction.new('isLoading', true);
        if(!DUser.offlineMode) await PersistanceApi.saveProject(LProject.fromD(project));
        SetRootFieldAction.new('isLoading', false);
    }

    return (<div className={'container'}>
        <div className={'d-flex p-2'}>
            <b className={'ms-1 my-auto'}>MY PROJECTS</b>
            <div className={'d-flex ms-auto'}>
                <button className={'btn btn-success p-1 mx-1'} onClick={e => createProject('public')}>
                    + Public
                </button>
                <button disabled={true} className={'btn btn-success p-1 mx-1'} onClick={e => createProject('private')}>
                    + Private
                </button>
                <button className={'btn btn-success p-1 mx-1'} onClick={e => createProject('collaborative')}>
                    + Collaborative
                </button>
                <div className={'d-flex ms-5'}>
                    <input id={'project-id'} />
                    <button className={'btn btn-primary p-1 ms-1'} onClick={e => createProject('collaborative', ($('#project-id')[0] as GObject).value)}>
                        + Collaborative
                    </button>
                </div>
            </div>

        </div>
        {user.projects.map((project, index) => {
            return(<div className={'d-flex p-3 border bg-white m-1'} key={index}>
                <button className={'btn btn-primary me-2'} onClick={e => user.project = project}>
                    <i className={'p-1 bi bi-eye-fill'}></i>
                </button>
                <button className={'btn btn-danger me-2'} onClick={async(e) => {
                    await PersistanceApi.deleteProject(project.id);
                    // todo: change into project.delete()
                    BEGIN()
                    user.projects = user.projects.filter(p => p.id !== project.id);
                    DeleteElementAction.new(project.id);
                    SetRootFieldAction.new('projects', project.id, '-=', true);
                    END()
                }}>
                    <i className={'p-1 bi bi-trash-fill'}></i>
                </button>
                <div className={'d-flex w-100'}>
                    <label className={'my-auto'}>
                        <b className={'text-primary me-1'}>{project.name}</b>
                        ({project.type})
                    </label>
                    {(project.type === 'collaborative') &&
                        <input style={{width: '18em'}} className={'p-1 ms-auto'} readOnly={true} defaultValue={project.id} type={'text'} />}
                </div>

            </div>)
        })}
    </div>);
}
interface OwnProps {}
interface StateProps {user: LUser}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.user = LUser.fromPointer(DUser.current);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

export const DashboardConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(DashboardComponent);

const Dashboard = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <DashboardConnected {...{...props, children}} />;
}

export default Dashboard;

