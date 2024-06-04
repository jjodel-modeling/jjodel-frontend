import React, {Dispatch, Component, ReactElement, ChangeEvent} from 'react';
import {connect} from 'react-redux';
import {DProject, DState, DUser, LProject, U} from '../joiner';
import {FakeStateProps} from '../joiner/types';
import Dashboard from './Dashboard';
import {ProjectsApi} from "../api/persistance";
import {useNavigate} from "react-router-dom";
import Project from "./components/Project";
import Storage from "../data/storage";


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

    const reader = new FileReader();
    reader.onload = async e => {
        /* Import Project File */
        const content = String(e.target?.result);
        if(!content) return;
        try {
            const project = JSON.parse(content) as DProject;
            const projects = Storage.read<DProject[]>('projects') || [];
            const filtered = projects.filter(p => p.id !== project.id);
            filtered.push(project);
            Storage.write('projects', filtered);
            U.refresh();
        } catch (e) {alert('Invalid File.')}
    }
    const importProject = async(e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files || [];
        if(!files.length) return;
        const file = files[0];
        reader.readAsText(file);
    }

    return(<Dashboard>
        <input type={'file'} className={'btn btn-success p-1 mx-1'} onChange={async e => await importProject(e)} />
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

