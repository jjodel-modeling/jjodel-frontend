import './style.scss';
import {DState, DUser, LModel, LProject, LUser, SetRootFieldAction, U} from '../../joiner';
import React, {Component, Dispatch, ReactElement, useState} from 'react';
import {FakeStateProps} from "../../joiner/types";
import {connect} from "react-redux";
import {MetamodelPopup, ModelPopup} from "./popups";
import {ProjectsApi} from "../../api/persistance";
import {useNavigate} from "react-router-dom";

function NavbarComponent(props: AllProps): JSX.Element {
    const {version, project, metamodels, debug} = props;
    const [focussed, setFocussed] = useState('');
    const [clicked, setClicked] = useState('');
    const navigate = useNavigate();

    const items = [
        {name: 'New',
            subItems: [
                {name: 'Metamodel', function: async() => {}},
                {name: 'Model', function: async() => {}},
                {name: 'Export', function: async() => {}},
                {name: 'Import', function: async() => {}}
            ]
        },
        {name: 'Project',
            subItems: [
                {name: 'Save', function: async() => {project && await ProjectsApi.save(project)}},
                {name: 'Save as', function: async() => {}},
                {name: 'Close', function: async() => {navigate('/dashboard'); U.refresh();}}
            ]
        }
    ];

    if(project)
        return(<>
            <nav className={'my-navbar'}>
                {items.map(i => <div className={'items-container'} onMouseEnter={e => setFocussed(i.name)}>
                    <label className={'item'}>
                        {i.name}
                    </label>
                    <div className={'sub-items-container border'} onMouseLeave={e => setFocussed('')} style={{display: (i.name === focussed) ? 'block' : 'none'}}>
                        {i.subItems.map(si => <label onClick={async() => {
                            setClicked(`${i.name}.${si.name}`.toLowerCase());
                            await si.function()
                        }} className={'sub-item'}>{si.name}</label>)}
                    </div>
                </div>)}
                <label onClick={e => SetRootFieldAction.new('debug', !debug)} className={`cursor-pointer ms-auto px-1 item text-white rounded ${debug ? 'bg-success' : 'bg-danger'}`}>
                    DEBUG
                </label>
            </nav>
            {clicked === 'new.metamodel' && <MetamodelPopup {...{project, setClicked}} />}
            {clicked === 'new.model' && <ModelPopup {...{metamodels, project, setClicked}} />}
        </>);
    else
        return(<>
            <nav className={'my-navbar'}>
                <div className={'items-container'} onMouseEnter={e => setFocussed('Project')}>
                    <label className={'item'}>
                        Project
                    </label>
                    <div className={'sub-items-container border'} onMouseLeave={e => setFocussed('')} style={{display: ('Project' === focussed) ? 'block' : 'none'}}>
                        <label onClick={async() => {
                            setClicked(`Project.New`.toLowerCase());
                            navigate('/allProjects');
                            SetRootFieldAction.new('isLoading', true);
                            await U.sleep(1);
                            await ProjectsApi.create('public', 'Unnamed Project');
                            SetRootFieldAction.new('isLoading', false);
                        }} className={'sub-item'}>
                            New
                        </label>
                    </div>
                </div>
            </nav>
        </>);
}

interface OwnProps {}
interface StateProps {
    user: LUser;
    project?: LProject;
    metamodels: LModel[];
    version: DState['version'];
    debug: boolean;
}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.user = LUser.fromPointer(DUser.current);
    ret.project = ret.user.project || undefined;
    ret.metamodels = LModel.fromArr(state.m2models);
    ret.version = state.version;
    ret.debug = state.debug;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

const NavbarConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(NavbarComponent);

const Navbar = (props: OwnProps, children: (string | Component)[] = []): ReactElement => {
    return <NavbarConnected {...{...props, children}} />;
}

export {Navbar};
