import React, {Dispatch, ReactElement, useEffect,  useState} from 'react';
import {connect} from 'react-redux';
import {
    CreateElementAction,
    Dictionary,
    DState,
    DUser,
    DViewElement, GObject,
    LProject,
    LUser,
    LViewElement,
    LViewPoint,
    Pointer,
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
import {useNavigate} from "react-router-dom";
import Loader from '../components/loader/Loader';
import {Navbar} from "./components";
import {CSS_Units} from "../view/viewElement/view";
import {useEffectOnce} from "usehooks-ts";

function ProjectComponent(props: AllProps): JSX.Element {

    const {user} = props;
    const navigate = useNavigate();
    const query = useQuery();
    const id = query.get('id') || '';

    useEffect(() => {
        (async function() {
            const project = await ProjectsApi.getOne(id); 
            if(!project) {
                U.resetState();
                navigate('/allProject');
                return;
            }
            if(project.state) {
                const state = JSON.parse(await U.decompressState(project.state));
                state['idlookup'][DUser.current] = user.__raw;
                if(!state['users'].includes(DUser.current)) state['users'].push(DUser.current);
                SaveManager.load(state);
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
    if(!user?.project) return (<></>);

    return (<>
        <Try>
        <Dashboard active={'Project'} version={props.version} project={user.project}>
            <React.Fragment>
                <style id={"views-css-injector-p"}>
                    {Object.values(viewsDeDuplicator).map(v => v.compiled_css).join('\n\n')}
                </style>
                {CSS_Units.jsx}

                <Cards>
                    {user.project.metamodels.length === 0 ?
                        <Cards.Item
                            title={'Your first metamodel ?'}
                            subtitle={'Create a new metamodel.'}
                            icon={'add'}
                            style={'red'}
                            action={() => {
                                alert('new metamodel')
                            }}
                        />
                        :
                        <React.Fragment>
                            <Cards.Item
                                title={'Create another metamodel ?'}
                                subtitle={'Create a new metamodel.'}
                                icon={'add'}
                                style={'red'}
                                action={() => {
                                    alert('another metamodel')
                                }}
                            />
                            <Cards.Item
                                title={'Create a model ?'}
                                subtitle={'Create a new model.'}
                                icon={'add'}
                                style={'red'}
                                action={() => {
                                    alert('new model')
                                }}
                            />
                        </React.Fragment>
                    }
                    <Cards.Item icon={'question'} style={'clear'} title={'Ehy!'}
                                subtitle={'What do you want to do today?'}/>
                </Cards>

            </React.Fragment>
        </Dashboard>
        </Try>

        {/*<Try><Dock /></Try>*/}
        {user.project.type === 'collaborative' && <CollaborativeAttacher project={user.project}/>}
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

const ProjectPage = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <ProjectConnected {...{...props, children}} />;
}

export {ProjectPage};

