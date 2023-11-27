import React, {MouseEvent, Dispatch, ReactElement} from 'react';
import {connect} from 'react-redux';
import {
    BEGIN,
    END,
    CreateElementAction,
    DProject,
    DState,
    DUser,
    Input,
    LProject,
    LUser,
    SetRootFieldAction,
    U,
    DeleteElementAction
} from '../joiner';
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

    const createProject = async(e: MouseEvent) => {
        let name = 'project_' + 0;
        let projectNames: string[] = user.projects.map(p => p.name);
        name = U.increaseEndingNumber(name, false, false, newName => projectNames.indexOf(newName) >= 0);
        const project = DProject.new(name, user.id);
        user.projects = [...user.projects, LProject.fromD(project)];
    }

    return (<div className={'w-25'}>
        <div className={'d-flex p-2'}>
            <b className={'ms-1 my-auto'}>MY PROJECTS</b>
            <button className={'btn btn-primary ms-auto'} onClick={createProject}>
                <i className={'p-1 bi bi-plus'}></i>
            </button>
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
                <b className={'text-primary'}>{project.name}</b>
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

