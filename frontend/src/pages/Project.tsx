import React, {Dispatch, JSX, ReactElement, ReactNode, useEffect, useState} from 'react';
import {connect} from 'react-redux';
import {
    GObject,
    Pointer,
    DViewElement,
    DViewPoint,
    LProject,
    Dictionary,
    DProject,
    DState,
    DUser,
    LUser,
    LViewElement,
    LViewPoint,
} from '../joiner';
import {
    CreateElementAction,
    R,
    store,
    Try,
    U
} from '../joiner';
import {FakeStateProps} from '../joiner/types';
import useQuery from '../hooks/useQuery';
import {ProjectsApi} from '../api/persistance';
import {SaveManager} from '../components/topbar/SaveManager';
import {Dashboard} from "./components";
import CollaborativeAttacher from "../components/collaborative/CollaborativeAttacher";
import {Cards} from './components/cards/Cards';
import Storage from "../data/storage";
import Loader from '../components/loader/Loader';
import {Navbar} from "./components";
import {CSS_Units} from "../view/viewElement/view";
import { ProjectLoadingScreen } from '../components/LoadingScreen';

function ProjectComponent(props: AllProps): JSX.Element {
/*
    useEffect(() => { moved in stateinitializer
        (async function() {
            console.error('init_project');
            const project = await ProjectsApi.getOne(id);
            console.log('project load api response', {project, isOff:U.isOffline()});
            if (!project) {
                // U.resetState();
                // R.navigate('/allProject');
                return;
            }
            if (project.state) {
                const state = JSON.parse(await U.decompressState(project.state));
                state['idlookup'][DUser.current] = user.__raw;
                if (!state['users'].includes(DUser.current)) state['users'].push(DUser.current);
                SaveManager.load(state, project);
            }
            user.project = LProject.fromPointer(project.id);
        })();
    }, [id]);*/


    if (props.isLoading) {
        return <ProjectLoadingScreen />;
        /*return (
            <div className={'w-100 h-100 d-flex'}>
                <div className={'m-auto d-flex p-5'} style={{flexFlow: 'column', cursor:'pointer'}}onClick={(e) => R.navigate('/allProjects')}>
                    <h4 className={'mx-auto'}>Project loading...</h4>
                    <div className={'mx-auto'}>if it takes too long try refreshing the page, or click to go back</div>
                </div>
            </div>
        );*/
    }
    let project = LProject.getProject();
    let vparr = project?.viewpoints || [];
    let allViews = vparr.flatMap((vp: LViewPoint) => vp && vp.allSubViews);
    allViews.push(...vparr as LViewElement[]);
    allViews = allViews.filter(v => v);
    const viewsDeDuplicator: Dictionary<Pointer<DViewElement>, LViewElement> = {};
    for (let v of allViews) viewsDeDuplicator[v.id] = v;

    return (<>
        <Dashboard active={'Project'} version={props.version} project={project} />
        {project.type === 'collaborative' && <CollaborativeAttacher project={props.projectid as string}/>}
    </>);

}

interface OwnProps {
}

interface StateProps {
    projectid?: Pointer<DProject>,
    // project?: LProject,
    version: DState["version"],
    isLoading: boolean,
}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.projectid = U.getProjectID_URL() || '';
    ret.isLoading = ProjectsApi.isLoading;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

export const ProjectConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(ProjectComponent);

const ProjectPage = (props: OwnProps, children: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <ProjectConnected {...{...props, children}} />;
}

export {ProjectPage};

