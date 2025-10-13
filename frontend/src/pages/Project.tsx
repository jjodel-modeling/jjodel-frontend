import React, {Dispatch, JSX, ReactElement, ReactNode, useEffect, useState} from 'react';
import {connect} from 'react-redux';
import {
    CreateElementAction,
    Dictionary,
    DState,
    DUser,
    DViewElement, DViewPoint, GObject,
    LProject,
    LUser,
    LViewElement,
    LViewPoint,
    Pointer,
    R, store,
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

function ProjectComponent(props: AllProps): JSX.Element {
    const {user} = props;
    const query = useQuery();
    const id = query.get('id') || '';

    useEffect(() => {
        (async function() {
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
    }, [id]);

    let vparr = user?.project?.viewpoints || [];
    let allViews = vparr.flatMap((vp: LViewPoint) => vp && vp.allSubViews);
    allViews.push(...vparr as LViewElement[]);
    allViews = allViews.filter(v => v);
    const viewsDeDuplicator: Dictionary<Pointer<DViewElement>, LViewElement> = {};
    for (let v of allViews) viewsDeDuplicator[v.id] = v;
    if (!user?.project) {
        return (
            <div className={'w-100 h-100 d-flex'}>
                <div className={'m-auto d-flex p-5'} style={{flexFlow: 'column', cursor:'pointer'}}onClick={(e) => R.navigate('/allProjects')}>
                    <h4 className={'mx-auto'}>Project loading...</h4>
                    <div className={'mx-auto'}>if it takes too long try refreshing the page, or click to go back</div>
                </div>
            </div>
        );
    }

    return (<>
        <Dashboard active={'Project'} version={props.version} project={user.project} />
        {/*<Try><Dock /></Try>*/}
        {user.project.type === 'collaborative' && <CollaborativeAttacher project={user.project?.id}/>}
    </>);

}

interface OwnProps {
}

interface StateProps {
    user: LUser,
    version: DState["version"],
}
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

export const ProjectConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(ProjectComponent);

const ProjectPage = (props: OwnProps, children: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <ProjectConnected {...{...props, children}} />;
}

export {ProjectPage};

