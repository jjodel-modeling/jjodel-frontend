/* DASHBOARD */
/* ALLPROJECTS */
import React, {Component, Dispatch, ReactElement, ReactNode, useState} from 'react';

import {connect} from 'react-redux';
import {DProject, DState, Log, LProject, R, SetRootFieldAction, Try, U} from '../joiner';
import {FakeStateProps} from '../joiner/types';
import {Dashboard, Project} from './components';

import { Cards, Card } from './components/cards/Cards';
import { Catalog } from './components/catalog/Catalog';

import {ProjectsApi} from "../api/persistance";
import { LatestUpdates } from './components/LatestUpdates';

function AllProjectsComponent(props: AllProps): JSX.Element {
    const {projects} = props;
    const [isDropping, setDropping] = useState(false);
  
    const createProject = async(type: DProject['type']) => {
        await ProjectsApi.create(type, undefined, undefined, undefined, projects);
        R.navigate("/allProjects");
    }

    function dropConfirm(e: React.DragEvent<HTMLElement>){
        e.preventDefault();
        e.stopPropagation();
        console.log('dropevent', {e});

        const droppedFiles = Array.from(e.dataTransfer.files);
        if (droppedFiles.length > 0) {
            for (let file of droppedFiles){
            var reader = new FileReader();
            reader.onload = function(e) {
                if (!e.target) { Log.ee('invalid file', e); return; }
                var contents = e.target.result;
                console.log('read file', {contents, e, file});
                let date: number = file.lastModified;
                let name = file.name; // including extension
                if (typeof contents === 'string') ProjectsApi.importFromText(contents, name, date);
                else Log.ee('invalid file content', {e, contents});
            };
            reader.readAsText(file);
            }
        }
        //let file = e.dataTransfer.getData('file');
        setDropping(false);
    }

    function mouseleave(e: any){ // should use onDragLeave but it is flashing
        setDropping(false);
    }

    function dropPreviewContainer(e: React.DragEvent<any>){
        e.stopPropagation();
        e.preventDefault();

        e.dataTransfer.dropEffect = 'none';
    }
    function dropPreview(e: any){
        e.stopPropagation();
        e.preventDefault();
        setDropping(true);
        e.dataTransfer.dropEffect = 'copy';
    }

    return(<Try>
        <>
        {isDropping ? 
            <div className={'project-dropping-container'} onClick={mouseleave} onDragOver={dropPreviewContainer}>
                <div className={'project-dropping-area droparea'} onDrop={dropConfirm} onDragOver={dropPreview}>
                    <div className={'icon'}><i className="bi bi-cloud-upload"></i></div>
                    <div className={'body'}>Drop the file to import a .Jjodel project</div>   
                    <div className={'or'}>or</div>  
                    <button className={'dark'} onClick={ProjectsApi.import}>select project</button>
                    <div className={'select-file'}>
                        <button className={'light'} onClick={mouseleave}>cancel</button>
                    </div>  
                </div> 
            </div>
            : null
        }

        <Dashboard active={'All'} version={props.version}>
            <div className="dashboard-main-content">
                {/* CTA Buttons - Only 2: Import + New Project */}
                <div className="dashboard-cta-row">
                    <div className="dashboard-cta-left">
                        <h1 className="dashboard-page-title">Projects</h1>
                    </div>
                    <div className="dashboard-cta-right">
                        <button
                            className="btn-secondary-outlined"
                            onClick={() => setDropping(true)}
                        >
                            <i className="bi bi-download" />
                            Import
                        </button>
                        <button
                            className="btn-primary-solid"
                            onClick={() => createProject('private')}
                        >
                            <i className="bi bi-plus-lg" />
                            New Project
                        </button>
                    </div>
                </div>
                <Catalog projects={projects} />
            </div>
        </Dashboard>
        
        <LatestUpdates page={'AllProjects'}/>
        
        </>


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

const AllProjectsPage = (props: OwnProps, children: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <AllProjectsConnected {...{...props, children}} />;
}

export {AllProjectsPage};

