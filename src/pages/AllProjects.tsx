import React, {Dispatch, Component, ReactElement} from 'react';
import {connect} from 'react-redux';
import {DProject, DState, DUser, LProject, U} from '../joiner';
import {FakeStateProps} from '../joiner/types';
import Dashboard from './dashboard/Dashboard';
import {ProjectsApi} from "../api/persistance";
import {useNavigate} from "react-router-dom";


function AllProjectsComponent(props: AllProps) {
    const {projects} = props;
    const navigate = useNavigate();

    const selectProject = (id: DProject['id']) => {
        navigate(`/project?id=${id}`);
        U.refresh();
    }
    const exportProject = async(project: LProject) => {
        U.download(`${project.name}.jjodel`, JSON.stringify(project.__raw));
    }
    const deleteProject = async(project: LProject) => {
        await ProjectsApi.delete(project);
    }

    return(<Dashboard>
        {projects.map((project, index) => {
            return(<div className={'d-flex p-3 border m-1 dashboard-row'} key={index}>
                <button className={'btn btn-primary me-2'} onClick={e => selectProject(project.id)}>
                    <i className={'p-1 bi bi-eye-fill'}></i>
                </button>
                <button className={'btn btn-primary me-2'}
                        onClick={async() => await exportProject(project)}>
                    <i className={'p-1 bi bi-download'}></i>
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
    </Dashboard>);
}

interface OwnProps {}
interface StateProps {projects: LProject[]}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.projects = LProject.fromArr(state.projects);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

const AllProjectsConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(AllProjectsComponent);

const AllProjectsPage = (props: OwnProps, children: (string | Component)[] = []): ReactElement => {
    return <AllProjectsConnected {...{...props, children}} />;
}

export default AllProjectsPage;

