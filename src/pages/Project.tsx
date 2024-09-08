import {Dispatch, ReactElement, useEffect, useState} from 'react';
import {connect} from 'react-redux';
import {
    CreateElementAction,
    Dictionary,
    DState,
    DUser,
    DViewElement,
    LProject,
    LUser,
    LViewElement,
    LViewPoint,
    Pointer,
    Try,
    U
} from '../joiner';
import {FakeStateProps} from '../joiner/types';
import Dock from '../components/abstract/Dock';
import useQuery from '../hooks/useQuery';
import {ProjectsApi} from '../api/persistance';
import {SaveManager} from '../components/topbar/SaveManager';
import Loader from '../components/loader/Loader';
import {Dashboard, Navbar} from "./components";
import {CSS_Units} from "../view/viewElement/view";
import CollaborativeAttacher from "../components/collaborative/CollaborativeAttacher";
import {useEffectOnce} from "usehooks-ts";
import React from 'react';
import { Cards } from './components/cards/Cards';
import { Catalog } from './components/catalog/Catalog';


function ProjectComponent(props: AllProps): JSX.Element {

    const user = props.user;
    const query = useQuery();
    const id = query.get('id') || '';
    user.project = LProject.fromPointer(id);

    useEffect(() => {
        (async function() {
            const project = await ProjectsApi.getOne(id);
            if(!project || !project.state) return;
            const state = await U.decompressState(project.state);
            SaveManager.load(state);
            CreateElementAction.new(user.__raw);
        })();
    }, [id]);

    let allViews = user.project?.viewpoints.flatMap((vp: LViewPoint) => vp && vp.allSubViews) || [];
    allViews = allViews.filter(v => v);
    const viewsDeDuplicator: Dictionary<Pointer<DViewElement>, LViewElement> = {};
    for (let v of allViews) viewsDeDuplicator[v.id] = v;
    if(!user.project) return <div>
        <label>waiting...</label>
    </div>;

    return(<Try>
        <Dashboard active={'Project'} version={props.version} project={user.project}>
            <React.Fragment>
                <Cards>
                    {user.project.metamodels.length === 0 ?
                        <Cards.Item
                            title={'Your first metamodel ?'}
                            subtitle={'Create a new metamodel.'}
                            icon={'add'}
                            style={'red'}
                            action={() => {alert('new metamodel')}}
                        />
                        :
                        <React.Fragment>
                            <Cards.Item
                                title={'Create another metamodel ?'}
                                subtitle={'Create a new metamodel.'}
                                icon={'add'}
                                style={'red'}
                                action={() => {alert('another metamodel')}}
                            />
                            <Cards.Item
                                title={'Create a model ?'}
                                subtitle={'Create a new model.'}
                                icon={'add'}
                                style={'red'}
                                action={() => {alert('new model')}}
                            />
                        </React.Fragment>
                    }
                    {true && <Cards.Item icon={'question'} style={'clear'} title={'Ehy!'} subtitle={'What do you want to do today?'}/>}
                </Cards>
            </React.Fragment>

        </Dashboard>
    </Try>);

}
interface OwnProps {}
interface StateProps {
    user: LUser,
    projects: LProject[],
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

