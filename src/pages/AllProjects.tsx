/* DASHBOARD */
/* ALLPROJECTS */

import React, {ChangeEvent, MouseEventHandler, Component, Dispatch, ReactElement, useState, useRef } from 'react';
import {connect} from 'react-redux';
import {DProject, DState, Log, LProject, SetRootFieldAction, Try, U} from '../joiner';
import {Dictionary, FakeStateProps} from '../joiner/types';
import {Dashboard, Project} from './components';
import Storage from "../data/storage";

import { Cards, Card } from './components/cards/Cards';
import { Catalog } from './components/catalog/Catalog';

import {ProjectsApi} from "../api/persistance";
import { LatestUpdates } from './components/LatestUpdates';

function AllProjectsComponent(props: AllProps): JSX.Element {
    const {projects} = props;
    const createProject = async(type: DProject['type']) => {
        await ProjectsApi.create(type, undefined, undefined, undefined, projects);
    }
    return(<Try>
        <>
        <Dashboard active={'All'} version={props.version}>
            <>
                <Cards>
                    <Cards.Item
                        title={'New Jjodel'}
                        subtitle={'Create a new Jjodel project.'}
                        icon={'add'}
                        style={'green'}
                        action={() => createProject('private')}
                    />
                    {!(U.isOffline()) && <Cards.Item
                        title={'New Jjodel (Collaborative)'}
                        subtitle={'Create a new Jjodel project.'}
                        icon={'add'}
                        style={'yellow'}
                        action={() => createProject('collaborative')}
                    />}
                    <Cards.Item
                        title={'Import Jjodel'}
                        subtitle={'Import an existing Jjodel project.'}
                        icon={'import'}
                        style={'dark'}
                        action={ProjectsApi.import}
                    />
                    {true && <Cards.Item icon={'gettingstarted'} url={'https://www.jjodel.io/getting-started/'} style={'red-orange'} title={'Getting Started'} subtitle={'New to Jjodel? No worries'}/>}
                </Cards>
                <Catalog projects={projects} />
            </>
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

const AllProjectsPage = (props: OwnProps, children: (string | Component)[] = []): ReactElement => {
    return <AllProjectsConnected {...{...props, children}} />;
}

export {AllProjectsPage};

