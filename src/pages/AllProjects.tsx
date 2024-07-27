import React, {ChangeEvent, Component, Dispatch, ReactElement} from 'react';
import {connect} from 'react-redux';
import {DProject, DState, LProject, Try, U} from '../joiner';
import {FakeStateProps} from '../joiner/types';
import {Dashboard, Project} from './components';
import Storage from "../data/storage";


type UserProps = {
    name: string;
    initial: string;
}

const User = (props: UserProps) => {
    return (<>
        <div className={'user-title'}>
            <h1>{props.name}</h1>
        </div>
    </>);
}


function AllProjectsComponent(props: AllProps): JSX.Element {
    const {projects} = props;

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

    return(<Try>
        <Dashboard active={'All'} version={props.version}>
        
            <div className={'catalog'}>
                
                {/* 
                
                AP: l'upload di progetti deve avvenire tramite il menu principale

                <div className={'ms-2 p-1 bg-primary w-25 rounded me-auto'}>
                    <b className={'d-block text-center text-gray'}>Do you want to import a project?</b>
                    <input className={'form-control w-100'} type={'file'} onChange={async e => await importProject(e)} />
                </div>*/}
                
                <div style={{display: (projects.length > 0) ? 'flex' : 'none'}} className={'flex-wrap'}>
                    {projects.map(p => <Project key={p.id} data={p} />)}
                </div>
            </div>
        </Dashboard>
    </Try>);
}

interface OwnProps {}
interface StateProps {
    projects: LProject[];
    version: DState["version"];
}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.projects = LProject.fromArr(state.projects);
    ret.version = state.version;
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

export {AllProjectsPage};

