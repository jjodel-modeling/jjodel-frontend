import React, {ChangeEvent, MouseEventHandler, Component, Dispatch, ReactElement, useState, useRef } from 'react';
import {connect} from 'react-redux';
import {DProject, DState, LProject, Try, U} from '../joiner';
import {FakeStateProps} from '../joiner/types';
import {Dashboard, Project} from './components';
import Storage from "../data/storage";

import {Menu, Item, Divisor} from './components/menu/Menu';
import { Cards, Card } from './components/cards/Cards';
import { Catalog } from './components/catalog/Catalog';

import colors from '../static/img/colors.png';


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
        <Dashboard active={'Recent'} version={props.version}>
            
            <React.Fragment>                

                <Cards>
                    <Cards.Item
                        title={'Need help?'} 
                        subtitle={'Don\' ask Alexa, click here instead.'}
                        icon={'alexa'} 
                        style={'red-orange'}   
                    />
                    {false && <Cards.Item icon={'question'} style={'clear'} title={'Ehy!'} subtitle={'What do you want to do today?'}/>}
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

const RecentPage = (props: OwnProps, children: (string | Component)[] = []): ReactElement => {
    return <AllProjectsConnected {...{...props, children}} />;
}

export {RecentPage};

