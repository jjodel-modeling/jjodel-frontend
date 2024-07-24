import './style.scss';
import {DState, DUser, LModel, LProject, LUser, SetRootFieldAction, U} from '../../joiner';
import React, {Component, Dispatch, ReactElement, useState} from 'react';
import {FakeStateProps} from '../../joiner/types';
import {connect} from 'react-redux';
import {MetamodelPopup, ModelPopup} from './popups';
import {ProjectsApi} from '../../api/persistance';
import {useNavigate} from 'react-router-dom';

function NavbarComponent(props: AllProps): JSX.Element {
    const {version, project, metamodels, advanced, debug} = props;
    const [focussed, setFocussed] = useState('');
    const [clicked, setClicked] = useState('');
    const navigate = useNavigate();

    const projectItems = [
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

    const dashboardItems = [
        {name: 'Project',
            subItems: [
                {name: 'New', function: async() => {
                    navigate('/allProjects');
                    SetRootFieldAction.new('isLoading', true);
                    await U.sleep(1);
                    await ProjectsApi.create('public', 'Unnamed Project');
                    SetRootFieldAction.new('isLoading', false);
                }},
            ]
        }
    ];




    if(project)
        return(<>
            <nav style={{zIndex: 99}}>
                <ul className={'new-navbar'}>
                    {projectItems.map(i => <li key={i.name} className={'new-dropdown'}>
                        <label>{i.name}</label>
                        <ul className={'new-dropdown-content'}>
                            {i.subItems.map(si => <li key={si.name} onClick={async() => {
                                setClicked(`${i.name}.${si.name}`.toLowerCase());
                                await si.function();
                            }}>
                                <label>{si.name}</label>
                            </li>)}
                        </ul>
                    </li>)}
                    <div className={'ms-auto d-flex'}>
                        <li className={'input-container mx-2'}>
                            <b className={'object-name text-white'}>Advanced</b>
                            <input checked={advanced} onClick={e =>
                                    SetRootFieldAction.new('advanced', !advanced)
                                } className={'input switch my-auto ms-2'} type={'checkbox'}
                            />
                        </li>
                        <label onClick={e => SetRootFieldAction.new('debug', !debug)} className={`my-auto py-0 mx-2 cursor-pointer item text-white rounded ${debug ? 'bg-success' : 'bg-danger'}`}>
                            DEBUG
                        </label>
                    </div>
                </ul>
            </nav>
            {clicked === 'new.metamodel' && <MetamodelPopup {...{project, setClicked}} />}
            {clicked === 'new.model' && <ModelPopup {...{metamodels, project, setClicked}} />}
        </>);
    else
        return(<>
            <nav style={{zIndex: 99}}>
                <ul className={'new-navbar'}>
                    {dashboardItems.map(i => <li key={i.name} className={'new-dropdown'}>
                        <label>{i.name}</label>
                        <ul className={'new-dropdown-content'}>
                            {i.subItems.map(si => <li key={si.name} onClick={async() => {
                                setClicked(`${i.name}.${si.name}`.toLowerCase());
                                await si.function();
                            }}>
                                <label>{si.name}</label>
                            </li>)}
                        </ul>
                    </li>)}
                </ul>
            </nav>
        </>);
}

interface OwnProps {}
interface StateProps {
    user: LUser;
    project?: LProject;
    metamodels: LModel[];
    version: DState['version'];
    advanced: boolean;
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
    ret.advanced = state.advanced;
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
