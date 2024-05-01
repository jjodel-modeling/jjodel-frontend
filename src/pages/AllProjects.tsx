import React, {Dispatch, Component, ReactElement} from 'react';
import {connect} from 'react-redux';
import {DProject, DState, DUser, LProject, U} from '../joiner';
import {FakeStateProps} from '../joiner/types';
import Dashboard from './Dashboard';
import {ProjectsApi} from "../api/persistance";
import {useNavigate} from "react-router-dom";
import Project from "./components/Project";


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
        <div style={{overflow: 'scroll'}} className={'d-flex flex-wrap'}>
            {projects.map(p => <Project key={p.id} data={p} />)}
        </div>
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

