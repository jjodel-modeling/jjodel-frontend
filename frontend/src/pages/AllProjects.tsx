/* DASHBOARD */
/* ALLPROJECTS */
import React, {Component, Dispatch, ReactElement, ReactNode, useState, useEffect, useCallback} from 'react';

import {connect} from 'react-redux';
import {DProject, DState, Log, LProject, R, SetRootFieldAction, Try, U} from '../joiner';
import {FakeStateProps} from '../joiner/types';
import {Dashboard, Project} from './components';

import { Cards, Card } from './components/cards/Cards';
import { Catalog } from './components/catalog/Catalog';
import { Button } from '../components/common/Button';

import {ProjectsApi} from "../api/persistance";
import {importJjodelFiles} from "../api/persistance/jjodelImport";
import { LatestUpdates } from './components/LatestUpdates';
import { CreateProjectDialog, ProjectFormData } from '../components/CreateProjectDialog/CreateProjectDialog';
import { JjodelEvents } from '../events/registry';

function AllProjectsComponent(props: AllProps): JSX.Element {
    const {projects} = props;
    const [isDropping, setDropping] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);

    // Centralized handler for opening create project dialog - used by ALL "New Project" buttons
    // Wrapped in useCallback to maintain stable reference for event listeners
    const handleOpenCreateDialog = useCallback(() => {
        setShowCreateDialog(true);
    }, []);

    const handleCloseCreateDialog = () => {
        setShowCreateDialog(false);
    };

    const handleSubmitCreateProject = async (formData: ProjectFormData) => {
        try {
            setShowCreateDialog(false);
            const existingProjects = projects?.length > 0 ? projects : undefined;
            await ProjectsApi.create(formData.type, formData.name, [], [], existingProjects);
        } catch (error) {
            console.error('Error creating project:', error);
            throw error;
        }
    };

    // Listen for keyboard shortcut event (CMD+N in dashboard context)
    useEffect(() => {
        const handleNewProjectShortcut = () => {
            handleOpenCreateDialog();
        };

        window.addEventListener(JjodelEvents.NEW_PROJECT, handleNewProjectShortcut);
        return () => {
            window.removeEventListener(JjodelEvents.NEW_PROJECT, handleNewProjectShortcut);
        };
    }, [handleOpenCreateDialog]);

    // Esc closes the import modal
    useEffect(() => {
        if (!isDropping) return;
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setDropping(false);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isDropping]);

    function importFiles(files: FileList){
        importJjodelFiles(files, ProjectsApi.importFromText).then(results => {
            for (const result of results) {
                if (result.ok) continue;
                if (result.reason === 'failed') U.alert('e', 'Import failed', 'The file could not be imported. Please check the file format.');
                else Log.ee('invalid file', result.file.name);
            }
        });
    }

    function dropConfirm(e: React.DragEvent<HTMLElement>){
        e.preventDefault();
        e.stopPropagation();
        // console.log('dropevent', {e});

        importFiles(e.dataTransfer.files);
        //let file = e.dataTransfer.getData('file');
        setDropping(false);
    }

    function filesChosen(e: React.ChangeEvent<HTMLInputElement>){
        if (e.target.files?.length) importFiles(e.target.files);
        // After importFiles, which copies the list synchronously: this empties it. Lets the same file be chosen twice.
        e.target.value = '';
    }

    function mouseleave(e: any){ // should use onDragLeave but it is flashing
        setDropping(false);
    }

    function backdropClick(e: React.MouseEvent<HTMLElement>){
        // Clicks inside the panel bubble here too: closing on those would unmount the input before its change fires.
        if (e.target === e.currentTarget) setDropping(false);
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
            <div className={'project-dropping-container'} onClick={backdropClick} onDragOver={dropPreviewContainer}>
                <div className={'project-dropping-area droparea'} role="dialog" aria-modal="true" aria-labelledby="project-dropping-title" onDrop={dropConfirm} onDragOver={dropPreview}>
                    <div className={'project-dropping-header'}>
                        <h2 id="project-dropping-title" className={'project-dropping-title'}>Import project</h2>
                        <button type="button" className={'project-dropping-close'} aria-label="Close" onClick={mouseleave}><i className="bi bi-x-lg"></i></button>
                    </div>
                    <label className={'project-dropping-zone'}>
                        <input className={'project-dropping-input'} type="file" accept=".jjodel" multiple onChange={filesChosen} />
                        <span className={'icon'}><i className="bi bi-cloud-upload"></i></span>
                        <span className={'body'}>Drop .jjodel files here</span>
                        <span className={'or'}>or browse your computer</span>
                    </label>
                    <p className={'project-dropping-hint'}>You can also drop files directly on the Projects page, without opening this dialog.</p>
                    <div className={'select-file'}>
                        <button type="button" className={'light'} onClick={mouseleave}>Cancel</button>
                    </div>
                </div>
            </div>
            : null
        }

        <Dashboard active={'All'} version={props.version} onNewProject={handleOpenCreateDialog}>
            <div className="dashboard-main-content">
                {/* CTA Buttons - Only 2: Import + New Project */}
                <div className="dashboard-cta-row">
                    <div className="dashboard-cta-left">
                        <h1 className="dashboard-page-title">Projects</h1>
                    </div>
                    <div className="dashboard-cta-right">
                        <Button
                            variant="secondary"
                            onClick={() => setDropping(true)}
                        >
                            <i className="bi bi-download" />
                            Import
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleOpenCreateDialog}
                        >
                            <i className="bi bi-plus-lg" />
                            New Project
                        </Button>
                    </div>
                </div>
                <Catalog projects={projects} onNewProject={handleOpenCreateDialog} onImportFile={ProjectsApi.import} />
            </div>
        </Dashboard>

        <LatestUpdates page={'AllProjects'}/>

        {/* Create Project Dialog - Centralized for all "New Project" buttons */}
        <CreateProjectDialog
            isOpen={showCreateDialog}
            onClose={handleCloseCreateDialog}
            onSubmit={handleSubmitCreateProject}
        />
        
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

