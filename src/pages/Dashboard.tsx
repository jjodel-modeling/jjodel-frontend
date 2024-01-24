import React, {Dispatch, ReactElement} from 'react';
import {connect} from 'react-redux';
import type {DState} from '../joiner';
<<<<<<< HEAD
import {DProject, DUser, LProject, LUser, SetFieldAction, SetRootFieldAction, U} from '../joiner';
=======
import {
    DModel,
    DProject,
    DUser, Keystrokes,
    LGraph,
    LPackage, LPointerTargetable,
    LProject,
    LUser,
    SetRootFieldAction,
    TRANSACTION,
    U
} from '../joiner';
>>>>>>> 2aef2e3f143d2d7d04a35c54ffea1f6f089f8e64
import {FakeStateProps} from '../joiner/types';
import PersistanceApi from "../api/persistance";
import {useEffectOnce} from "usehooks-ts";
import {StateMachine} from "../examples/StateMachine";
import "./dashboard.scss"
import TabDataMaker from "../components/abstract/tabs/TabDataMaker";
import DockManager from "../components/abstract/DockManager";

function DashboardComponent(props: AllProps) {
    const user = props.user;


    useEffectOnce(() => {
        (async function() {
            if (DUser.offlineMode) return;
            if(user.projects.length > 0) return;
            await PersistanceApi.loadMyProjects();
        })();
    });

    const createProject = async(type: DProject['type'], evt: React.MouseEvent) => {
        let name = 'project_' + 0;
        let projectNames: string[] = user.projects.map(p => p.name);
        let project: DProject = null as any;
        await TRANSACTION(()=>{
            SetRootFieldAction.new('isLoading', true);
            name = U.increaseEndingNumber(name, false, false, newName => projectNames.indexOf(newName) >= 0);
            let m2 = DModel.new('metamodel', undefined, true, true);
            let m1 = DModel.new('model', m2.id, false, true);
            project = DProject.new(type, name, [m2], [m1]);
            const dPackage = LPointerTargetable.fromD(m2).addChild('package');
            // const lPackage: LPackage = LPackage.fromD(dPackage);
            // lPackage.name = 'default';
            if (evt.button === Keystrokes.clickWheel || DUser.offlineMode) {
                user.project = project as any as LProject;
                setTimeout( () => {
                    const tab1 = TabDataMaker.metamodel(m2);
                    const tab2 = TabDataMaker.metamodel(m1);
                    DockManager.open('models', tab1);
                }, 1);
            }

        })
        // keep out of transaction, i don't want the transaction to be stuck waiting for server reply, it would prevent other actions from firing.
        if (project && !DUser.offlineMode) await PersistanceApi.saveProject(LProject.fromD(project));
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
<<<<<<< HEAD
                {/*<button className={'btn btn-success p-1 mx-1'} onClick={e => createProject('public')}>
=======
                <button className={'btn btn-success p-1 mx-1'} onClick={e => createProject('public', e)}>
>>>>>>> 2aef2e3f143d2d7d04a35c54ffea1f6f089f8e64
                    + Public
                </button>
                <button disabled={true} className={'btn btn-success p-1 mx-1'} onClick={e => createProject('private', e)}>
                    + Private
                </button>
                <button className={'btn btn-success p-1 mx-1'} onClick={e => createProject('collaborative', e)}>
                    + Collaborative
                </button>*/}
                <button className={'btn btn-primary p-1 mx-1'} onClick={e => StateMachine.loadBig('State Machine BIG')}>
                    + BIG
                </button>
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
            return(<div className={'d-flex p-3 border m-1 dashboard-row'} key={index} onClick={e => user.project = project}>
                <button className={'btn btn-primary me-2'} onClick={e => { e.stopPropagation(); user.project = project; }}>
                    <i className={'p-1 bi bi-eye-fill'}></i>
                </button>
                <button disabled={project.author.id !== DUser.current} className={'btn btn-danger me-2'} onClick={async(e) => {
                    e.stopPropagation();
                    project.delete();
                    if (DUser.offlineMode) return;
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

