import React, {ChangeEvent, MouseEventHandler, Component, Dispatch, ReactElement, useState, useRef } from 'react';
import {connect} from 'react-redux';
import {DProject, DState, Log, LProject, Try, U} from '../joiner';
import {Dictionary, FakeStateProps} from '../joiner/types';
import {Dashboard, Project} from './components';
import Storage from "../data/storage";

import { Cards, Card } from './components/cards/Cards';
import { Catalog } from './components/catalog/Catalog';

import {ProjectsApi} from "../api/persistance";

function AllProjectsComponent(props: AllProps): JSX.Element {
    const {projects} = props;
    const createProject = async(type: DProject['type']) => {
        await ProjectsApi.create(type, undefined, undefined, undefined, projects);
    }
    return(<Try>
        <Dashboard active={'All'} version={props.version}>
            <React.Fragment>
                <Cards>
                    <Cards.Item
                        title={'New jjodel (Public)'}
                        subtitle={'Create a new jjodel project.'}
                        icon={'add'}
                        style={'red'}
                        action={() => createProject('public')}
                    />
                    <Cards.Item
                        title={'New jjodel (Collaborative)'}
                        subtitle={'Create a new jjodel project.'}
                        icon={'add'}
                        style={'red'}
                        action={() => createProject('collaborative')}
                    />
                    <Cards.Item
                        title={'Import jjodel'}
                        subtitle={'Import an existing jjodel project.'}
                        icon={'import'}
                        style={'blue'}
                        action={ProjectsApi.importModal}
                    />
                    {true && <Cards.Item icon={'question'} style={'clear'} title={'Ehy!'} subtitle={'What do you want to do today?'}/>}
                </Cards>

                <Catalog projects={projects} />

            </React.Fragment>
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

