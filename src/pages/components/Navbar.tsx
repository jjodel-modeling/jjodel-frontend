import './style.scss';
import {Dictionary, DState, DUser, GObject, LModel, LProject, LUser, SetRootFieldAction, U} from '../../joiner';
import React, {Component, Dispatch, ReactElement, ReactNode, useState} from 'react';
import {FakeStateProps} from '../../joiner/types';
import {connect} from 'react-redux';
import {MetamodelPopup, ModelPopup} from './popups';
import {ProjectsApi} from '../../api/persistance';
import {useNavigate} from 'react-router-dom';
import logo from '../../static/img/jjodel.jpg';

enum Key{
    "cmd"   = "bi-command",
    "alt"   = "bi-alt",
    "shift" = "bi-shift",
}

const NamedKeys: Dictionary<string, boolean> = Object.values(Key).reduce((acc, v) => { acc[v] = true; return acc; }, {} as GObject);

function getKeystrokeJsx(key: string){
    if (key in NamedKeys) return <span><i className={"bi " + key}/></span>;
    return <span>{key.toUpperCase()}</span>;
}
function getKeyStrokes(keys?: string[]){
    if (!keys || !keys.length) return undefined;
    return <div className={"keystrokes"}>
        {keys.map(k => getKeystrokeJsx(k))}
    </div>
}

function makeEntry(i: MenuEntry) {
    if (i.name === "divisor") return <li className='divisor'><hr /></li>;
    return <li className={i.subItems ? "hoverable" : ""} tabIndex={0}>
            <label className='highlight'>
                <span>{i.name}</span>
                {i.subItems ?
                    <i className='bi bi-chevron-right icon-expand-submenu'></i> :
                    getKeyStrokes(i.keystroke)
                }
            </label>
        {i.subItems &&
            <div className='content right'>
                <ul className='context-menu right'>
                    {i.subItems.map(si => makeEntry(si))}
                </ul>
            </div>
        }
        </li>;
}

type MenuEntry = {name: string, function?: ()=>{}, keystroke?: string[], subItems?:MenuEntry[]};
function NavbarComponent(props: AllProps) {
    const {version, project, metamodels, advanced, debug} = props;
    const [focussed, setFocussed] = useState('');
    const [clicked, setClicked] = useState('');
    const navigate = useNavigate();

    const menuType = "normal";

    const projectItems: MenuEntry[] = [
        {name: 'New metamodel', function: async() => {}, keystroke: [Key.alt, Key.cmd, 'M']},
        {name: 'New model', function: async() => {}, keystroke: []},
        {name: 'divisor', function: async() => {}, keystroke: []},
        {name: 'Close project', function: async() => {}, keystroke: [Key.cmd, 'Q']},
        {name: 'divisor', function: async() => {}, keystroke: []},
        {name: 'Undo', function: async() => {}, keystroke: [Key.cmd, 'Z']},
        {name: 'Redo', function: async() => {}, keystroke: [Key.shift, Key.cmd, 'Z']}, // maybe better cmd + Y ?
        {name: 'divisor', function: async() => {}, keystroke: []},
        {name: 'Save', function: async() => {project && await ProjectsApi.save(project)}, keystroke: [Key.cmd, 'S']},
        {name: 'Save as', function: async() => {}, keystroke: [Key.shift, Key.cmd, 'S']},
        {name: 'divisor', function: async() => {}, keystroke: []},
        {name: 'Import...', function: async() => {}, keystroke: []},
        {name: 'Export as...', function: async() => {}, keystroke: []},
        {name: 'divisor', function: async() => {}, keystroke: []},


        {name: 'View',
            subItems: [
                {name: 'Show dot grid', function: async() => {}, keystroke: []},
                {name: 'divisor', function: async() => {}, keystroke: []},
                {name: 'Maximize editor', function: async() => {}, keystroke: []},
                {name: 'divisor', function: async() => {}, keystroke: []},
                {name: 'Zoom in', function: async() => {}, keystroke: [Key.cmd, '+']},
                {name: 'Zoom out', function: async() => {}, keystroke: [Key.cmd, '-']},
                {name: 'Zoom to 100%', function: async() => {}, keystroke: [Key.cmd, '0']},
            ],
            keystroke: []
        },
        {name: 'divisor', function: async() => {}, keystroke: []},
        {name: 'Help', subItems: [
            {name: 'What\'s new', function: async() => {}, keystroke: []},
            {name: 'divisor', function: async() => {}, keystroke: []},
            {name: 'Homepage', function: async() => {}, keystroke: []},
            {name: 'Getting started', function: async() => {}, keystroke: []},
            {name: 'User guide', function: async() => {}, keystroke: []},
            {name: 'divisor', function: async() => {}, keystroke: []},
            {name: 'Legal terms', function: async() => {}, keystroke: []}
        ],
        keystroke: []},
        {name: 'About jjodel', function: async() => {}, keystroke: []}


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
            <nav className={'nav-container'} style={{zIndex: 99}}>
                <div className='nav-hamburger hoverable' tabIndex={0}>
                    <i className="bi bi-grid-3x3-gap-fill list"></i>
                    <div className={'content context-menu'}>
                        <ul>
                            {projectItems.map(i => makeEntry(i))}
                        </ul>
                    </div>
                </div>
                <div className='nav-logo'><img height={24} src={logo} /></div>
                <div className='nav-side'></div>
            </nav>







                    {/*
                        <label onClick={e => SetRootFieldAction.new('debug', !debug)} className={`my-auto py-0 mx-2 cursor-pointer item text-white rounded ${debug ? 'bg-success' : 'bg-danger'}`}>
                            DEBUG
                        </label>
                        <label  className={`my-auto py-0 mx-2 item`}>
                            <img src="src/static/img/logo.png" />
                        </label>

                    </div>
                </ul>*/}







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
