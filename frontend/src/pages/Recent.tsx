import React, {
    ChangeEvent,
    MouseEventHandler,
    Component,
    Dispatch,
    ReactElement,
    useState,
    useRef,
    JSX,
    ReactNode
} from 'react';
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


    return(<Try>
        <Dashboard active={'Recent'} version={props.version}>
            <>
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
            </>
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

const RecentPage_Obsolete = (props: OwnProps, children: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <AllProjectsConnected {...{...props, children}} />;
}

export {RecentPage_Obsolete};

