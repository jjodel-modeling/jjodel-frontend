import React, {Dispatch, ReactElement} from 'react';
import {connect} from 'react-redux';
import type {DState} from '../joiner';
import {DProject, DUser, LProject, LUser, U} from '../joiner';
import {FakeStateProps} from '../joiner/types';
import {StateMachine} from "../examples/StateMachine";
import "./dashboard.scss"
import Navbar from "../components/navbar/Navbar";
import {ProjectsApi} from "../api/persistance";
import {useNavigate} from "react-router-dom";
import Storage from "../data/storage";

function DashboardComponent(props: AllProps) {
    const user = props.user;
    const projects = props.projects;
    const navigate = useNavigate();

    const createProject = async(type: DProject['type']) => {
        let name = 'project_' + 0;
        const projectNames: string[] = projects.map(p => p.name);
        name = U.increaseEndingNumber(name, false, false, newName => projectNames.indexOf(newName) >= 0);
        const project = await ProjectsApi.create(type, name);
        selectProject(project.id);
    }
    const deleteProject = async(project: LProject) => {
        await ProjectsApi.delete(project);
    }
    const selectProject = (project: DProject['id']) => {
        // window.open(`${window.location.origin}/#/project?id=${project}`)
        navigate(`/project?id=${project}`);
        U.refresh();
    }

    return (<>
        <Navbar />
        <div style={{overflow: 'scroll'}}>
            <div className={'d-flex p-2'}>
                <b className={'ms-1 my-auto'}>MY PROJECTS</b>
                <button onClick={() => {
                    U.refresh();
                }} className={'ms-2 p-1 btn btn-primary circle'}>
                    <i className={'bi bi-arrow-clockwise'}></i>
                </button>
                <div className={'d-flex ms-auto'}>
                    {!DUser.isStateMachine && <section>
                        <button className={'btn btn-success p-1 mx-1'} onClick={e => createProject('public')}>
                        + Public
                        </button>
                        <button disabled={true} className={'btn btn-success p-1 mx-1'} onClick={e => createProject('private')}>
                            + Private
                        </button>
                        <button disabled={true} className={'btn btn-success p-1 mx-1'} onClick={e => createProject('collaborative')}>
                            + Collaborative
                        </button>
                    </section>}
                    {DUser.isStateMachine && <section>
                        {/*<button className={'btn btn-primary p-1 mx-1'} onClick={e => StateMachine.loadBig('State Machine BIG')}>
                            + BIG
                        </button>*/}
                        <button className={'btn btn-primary p-1 mx-1'} onClick={e => {
                            StateMachine.load0('State Machine s0', true);
                            // navigate(`/project?id=${StateMachine.project.id}`)
                        }}>
                            + S0
                        </button>
                        <button className={'btn btn-primary p-1 mx-1'} onClick={e => {
                            StateMachine.load1('State Machine s1', true);
                            // navigate(`/project?id=${StateMachine.project.id}`)
                        }}>
                            + S1
                        </button>
                        <button className={'btn btn-primary p-1 mx-1'} onClick={e => {
                            StateMachine.load2('State Machine s2', true);
                            // navigate(`/project?id=${StateMachine.project.id}`)
                        }}>
                            + S2
                        </button>
                        <button className={'btn btn-primary p-1 mx-1'} onClick={e => {
                            StateMachine.load3('State Machine s3', true);
                            // navigate(`/project?id=${StateMachine.project.id}`)
                        }}>
                            + S3
                        </button>
                        <button className={'btn btn-primary p-1 mx-1'} onClick={e => {
                            StateMachine.load4('State Machine s4', true);
                            // navigate(`/project?id=${StateMachine.project.id}`)
                        }}>
                            + S4
                        </button>
                        <button className={'btn btn-primary p-1 mx-1'} onClick={e => {
                            StateMachine.load6('State Machine s6', true);
                            // navigate(`/project?id=${StateMachine.project.id}`)
                        }}>
                            + S6
                        </button>
                        <button className={'btn btn-primary p-1 mx-1'} onClick={e => {
                            StateMachine.load7('State Machine s7', true);
                            // navigate(`/project?id=${StateMachine.project.id}`)
                        }}>
                            + S7
                        </button>
                        <button className={'btn btn-primary p-1 mx-1'} onClick={e => {
                            StateMachine.load9('State Machine s9', true);
                            // navigate(`/project?id=${StateMachine.project.id}`)
                        }}>
                            + S9
                        </button>
                        <button className={'btn btn-primary p-1 mx-1'} onClick={e => {
                            StateMachine.load10('State Machine s10', true);
                            // navigate(`/project?id=${StateMachine.project.id}`)
                        }}>
                            + S10
                        </button>
                        <button className={'btn btn-primary p-1 mx-1'} onClick={e => {
                            StateMachine.load11('State Machine s11', true);
                            // navigate(`/project?id=${StateMachine.project.id}`)
                        }}>
                            + S11
                        </button>
                        <button className={'btn btn-primary p-1 mx-1'} onClick={e => {
                            StateMachine.load12('State Machine s12', true);
                            // navigate(`/project?id=${StateMachine.project.id}`)
                        }}>
                            + S12
                        </button>
                    </section>}
                </div>

            </div>
            {projects.map((project, index) => {
                if(!project) return(<></>);
                return(<div className={'d-flex p-3 border m-1 dashboard-row'} key={index}>
                    <button className={'btn btn-primary me-2'} onClick={e => selectProject(project.id)}>
                        <i className={'p-1 bi bi-eye-fill'}></i>
                    </button>
                    <button disabled={project.author.id !== DUser.current} className={'btn btn-danger me-2'}
                            onClick={async() => await deleteProject(project)}>
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
        </div>
    </>);
}
interface OwnProps {}
interface StateProps {user: LUser, projects: LProject[]}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.user = LUser.fromPointer(DUser.current);
    ret.projects = LProject.fromArr(state.projects);
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

const DashboardPage = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <DashboardConnected {...{...props, children}} />;
}

export default DashboardPage;

