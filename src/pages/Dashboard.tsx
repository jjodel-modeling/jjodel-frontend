import React, {Dispatch, ReactElement} from 'react';
import {connect} from 'react-redux';
import type {DState} from '../joiner';
import {DProject, DUser, LProject, LUser, SetFieldAction, SetRootFieldAction, U} from '../joiner';
import {FakeStateProps} from '../joiner/types';
import PersistanceApi from "../api/persistance";
import {useEffectOnce} from "usehooks-ts";
import {StateMachine} from "../examples/StateMachine";

function DashboardComponent(props: AllProps) {
    const user = props.user;


    useEffectOnce(() => {
        (async function() {
            if (DUser.offlineMode) return;
            if(user.projects.length > 0) return;
            await PersistanceApi.loadMyProjects();
        })();
    });

    const createProject = async(type: DProject['type']) => {
        let name = 'project_' + 0;
        let projectNames: string[] = user.projects.map(p => p.name);
        name = U.increaseEndingNumber(name, false, false, newName => projectNames.indexOf(newName) >= 0);
        const project = DProject.new(type, name);
        SetRootFieldAction.new('isLoading', true);
        if(!DUser.offlineMode) await PersistanceApi.saveProject(LProject.fromD(project));
        SetRootFieldAction.new('isLoading', false);
    }

    return (<div style={{overflow: 'scroll'}}>
        <div className={'d-flex p-2'}>
            <b className={'ms-1 my-auto'}>MY PROJECTS</b>
            <button disabled={true || DUser.offlineMode} onClick={async() => await PersistanceApi.loadMyProjects()}
                    className={'ms-2 p-1 btn btn-primary circle'}>
                <i className={'bi bi-arrow-clockwise'}></i>
            </button>
            <div className={'d-flex ms-auto'}>
                {/*<button className={'btn btn-success p-1 mx-1'} onClick={e => createProject('public')}>
                    + Public
                </button>
                <button disabled={true} className={'btn btn-success p-1 mx-1'} onClick={e => createProject('private')}>
                    + Private
                </button>
                <button className={'btn btn-success p-1 mx-1'} onClick={e => createProject('collaborative')}>
                    + Collaborative
                </button>*/}
                <button className={'btn btn-primary p-1 mx-1'} onClick={e => StateMachine.load0('State Machine s0')}>
                    + S0
                </button>
                <button className={'btn btn-primary p-1 mx-1'} onClick={e => StateMachine.load1('State Machine s1')}>
                    + S1
                </button>
                <button className={'btn btn-primary p-1 mx-1'} onClick={e => StateMachine.load2('State Machine s2')}>
                    + S2
                </button>
                <button className={'btn btn-primary p-1 mx-1'} onClick={e => StateMachine.load3('State Machine s3')}>
                    + S3
                </button>
                <button className={'btn btn-primary p-1 mx-1'} onClick={e => StateMachine.load4('State Machine s4')}>
                    + S4
                </button>
                <button className={'btn btn-primary p-1 mx-1'} onClick={e => StateMachine.load7('State Machine s7')}>
                    + S7
                </button>
                <button className={'btn btn-primary p-1 mx-1'} onClick={e => StateMachine.load9('State Machine s9')}>
                    + S9
                </button>
                <button className={'btn btn-primary p-1 mx-1'} onClick={e => StateMachine.load10('State Machine s10')}>
                    + S10
                </button>
                <button className={'btn btn-primary p-1 mx-1'} onClick={e => StateMachine.load11('State Machine s11')}>
                    + S11
                </button>
                <button className={'btn btn-primary p-1 mx-1'} onClick={e => StateMachine.load12('State Machine s12')}>
                    + S12
                </button>
            </div>

        </div>
        {user.projects.map((project, index) => {
            if(!project) return(<></>);
            return(<div className={'d-flex p-3 border bg-white m-1'} key={index}>
                <button className={'btn btn-primary me-2'} onClick={e => user.project = project}>
                    <i className={'p-1 bi bi-eye-fill'}></i>
                </button>
                <button disabled={project.author.id !== DUser.current} className={'btn btn-danger me-2'} onClick={async(e) => {
                    project.delete();
                    if(DUser.offlineMode) return;
                    await PersistanceApi.deleteProject(project.id);
                }}>
                    <i className={'p-1 bi bi-trash-fill'}></i>
                </button>
                <div className={'d-flex w-100'}>
                    <label className={'my-auto'}>
                        <b className={'text-primary me-1'}>{project.name}</b>
                        ({project.type})
                    </label>
                </div>
            </div>);
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

