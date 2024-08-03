import './style.scss';
import './navbar.scss';
import {
    Dictionary, DModel,
    DState,
    DUser,
    GObject, LGraph,
    LModel, LPackage,
    LProject,
    LUser,
    SetRootFieldAction,
    Selectors,
    U
} from '../../joiner';

import {icon} from '../components/icons/Icons';

import {useNavigate} from 'react-router-dom';

import React, {Component, Dispatch, ReactElement, useState} from 'react';
import {FakeStateProps} from '../../joiner/types';
import {connect} from 'react-redux';
import {MetamodelPopup, ModelPopup} from './popups';
import {ProjectsApi} from '../../api/persistance';
import TabDataMaker from "../../../src/components/abstract/tabs/TabDataMaker";
import DockManager from "../../../src/components/abstract/DockManager";

import {Menu, Item, Divisor} from '../components/menu/Menu';

import logo from '../../static/img/jjodel.jpg';
import jj from '../../static/img/jj-k.png';

const createM2 = (project: LProject) => {
    let name = 'metamodel_' + 0;
    let names: string[] = Selectors.getAllMetamodels().map(m => m.name);
    name = U.increaseEndingNumber(name, false, false, newName => names.indexOf(newName) >= 0)
    const dModel = DModel.new(name, undefined, true);
    const lModel: LModel = LModel.fromD(dModel);
    project.metamodels = [...project.metamodels, lModel];
    project.graphs = [...project.graphs, lModel.node as LGraph];
    const dPackage = lModel.addChild('package');
    const lPackage: LPackage = LPackage.fromD(dPackage);
    lPackage.name = 'default';
    const tab = TabDataMaker.metamodel(dModel);
    DockManager.open('models', tab);
}

const createM1 = (project: LProject, metamodel: LModel) => {
    let name = 'model_' + 0;
    let modelNames: (string)[] = metamodel.models.map(m => m.name);
    name = U.increaseEndingNumber(name, false, false, newName => modelNames.indexOf(newName) >= 0);
    const dModel: DModel = DModel.new(name, metamodel.id, false, true);
    const lModel: LModel = LModel.fromD(dModel);
    project.models = [...project.models, lModel];
    project.graphs = [...project.graphs, lModel.node as LGraph];
    const tab = TabDataMaker.model(dModel);
    DockManager.open('models', tab);
}

enum Key{
    "cmd"   = "bi-command",
    "alt"   = "bi-alt",
    "shift" = "bi-shift",
}

const NamedKeys: Dictionary<string, boolean> = Object.values(Key).reduce((acc, v) => { acc[v] = true; return acc; }, {} as GObject);
const windowsKeys: Dictionary<string, string> = {
    [Key.cmd]: "ctrl", //'windows'; // <i className="bi bi-windows"></i>
    [Key.shift]: "shift",
    [Key.alt]: "alt",
}

function getKeystrokeJsx(key: string){
    if (key in NamedKeys) return <span><i className={"bi " + key} title={windowsKeys[key] || key}/></span>;
    return <span>{key.toUpperCase()}</span>;
}
function getKeyStrokes(keys?: string[]){
    if (!keys || !keys.length) return undefined;
    return <div className={"keystrokes"}>
        {keys.map(k => getKeystrokeJsx(k))}
    </div>
}

function makeEntry(i: MenuEntry) {

    if (i.name === "divisor") {
        return (
            <li className='divisor'>
                <hr />
            </li>
        );
    } else {
        return (
            <li className={i.subItems ? "hoverable" : ""} tabIndex={0} onClick={()=>i.function?.()}>
                <label className='highlight'>
                    {i.icon ? 
                        <span>{i.icon} {i.name}</span> :
                        <span><i className="bi bi-app hidden"></i> {i.name}</span>
                    }
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
            </li>
        );
    }
}





type UserProps = {
    user?: LUser;
}
const User = (props: UserProps) => {
    return (
        <div className={'user'}>Alfonso <b>Pierantonio</b></div>
    );
};

type MenuEntry = {name: string, icon?: any, function?: ()=>any, keystroke?: string[], subItems?:MenuEntry[]};

function NavbarComponent(props: AllProps) {

    const navigate = useNavigate();
    
    const {version, metamodels, advanced, debug} = props;
    const [focussed, setFocussed] = useState('');
    const [clicked, setClicked] = useState('');
    
    const project: LProject = props.project as LProject;

    // const menuType = "normal";

    const projectItems: MenuEntry[] = [
        
        {name: 'New metamodel', icon: icon['new'], function: ()=>createM2(project), keystroke: [Key.alt, Key.cmd, 'M']},
        {name: 'New model', icon: icon['new'], function: () => {}, keystroke: []},
        {name: 'divisor', function: async() => {}, keystroke: []},
        {name: 'Close project', icon: icon['close'], function: async() => {}, keystroke: [Key.cmd, 'Q']},
        {name: 'divisor', function: async() => {}, keystroke: []},
        {name: 'Undo', icon: icon['undo'], function: async() => {}, keystroke: [Key.cmd, 'Z']},
        {name: 'Redo', icon: icon['redo'], function: async() => {}, keystroke: [Key.shift, Key.cmd, 'Z']}, // maybe better cmd + Y ?
        {name: 'divisor', function: async() => {}, keystroke: []},
        {name: 'Save', icon: icon['save'], function: async() => {project && await ProjectsApi.save(project)}, keystroke: [Key.cmd, 'S']},
        {name: 'Save as', icon: icon['save'], function: async() => {}, keystroke: [Key.shift, Key.cmd, 'S']},
        {name: 'divisor', function: async() => {}, keystroke: []},
        {name: 'Import...', icon: icon['import'], function: async() => {}, keystroke: []},
        {name: 'Export as...', icon: icon['export'], function: async() => {}, keystroke: []},
        {name: 'divisor', function: async() => {}, keystroke: []},

        {name: 'View', icon: <i className="bi bi-tv"></i>,
            subItems: [
                {name: 'Show dot grid', icon: icon['grid'], function: async() => {}, keystroke: []},
                {name: 'divisor', function: async() => {}, keystroke: []},
                {name: 'Maximize editor', icon: icon['maximize'], function: async() => {}, keystroke: []},
                {name: 'divisor', function: async() => {}, keystroke: []},
                {name: 'Zoom in', icon: icon['zoom-in'], function: async() => {}, keystroke: [Key.cmd, '+']},
                {name: 'Zoom out', icon: icon['zoom-out'], function: async() => {}, keystroke: [Key.cmd, '-']},
                {name: 'Zoom to 100%', function: async() => {}, keystroke: [Key.cmd, '0']},
            ],
            keystroke: []
        },
        {name: 'divisor', function: async() => {}, keystroke: []},
        {name: 'Help', icon: icon['help'], subItems: [
            {name: 'What\'s new', icon: icon['whats-new'], function: async() => {}, keystroke: []},
            {name: 'divisor', function: async() => {}, keystroke: []},
            {name: 'Homepage', icon: icon['home'], function: async() => {}, keystroke: []},
            {name: 'Getting started', icon: icon['getting-started'], function: async() => {}, keystroke: []},
            {name: 'User guide', icon: icon['manual'], function: async() => {}, keystroke: []},
            {name: 'divisor', function: async() => {}, keystroke: []},
            {name: 'Legal terms', icon: icon['legal'], function: async() => {}, keystroke: []}
        ],
        keystroke: []},
        {name: 'About jjodel', icon: <img src={jj} width={15}/>, function: async() => {}, keystroke: []}


    ];

    const dashboardItems: MenuEntry[] = [

        {name: 'New project', icon: <i className="bi bi-plus-square"></i>, function: 
        
            async()=>{
                navigate('/allProjects');
            
                SetRootFieldAction.new('isLoading', true);
                await U.sleep(1);
                await ProjectsApi.create('public', 'Unnamed Project');
                SetRootFieldAction.new('isLoading', false);
            }, 
            keystroke: [Key.cmd, 'N']},
        {name: 'Import...', icon: <i className="bi bi-arrow-bar-left"></i>, function: async() => {}, keystroke: []},
        {name: 'divisor', function: async() => {}, keystroke: []},
        {name: 'Help', icon: <i className="bi bi-question-square"></i>, subItems: [
            {name: 'What\'s new', icon: <i className="bi bi-clock"></i>, function: async() => {}, keystroke: []},
            {name: 'divisor', function: async() => {}, keystroke: []},
            {name: 'Homepage', icon: <i className="bi bi-house"></i>, function: async() => {}, keystroke: []},
            {name: 'Getting started', icon: <i className="bi bi-airplane"></i>, function: async() => {}, keystroke: []},
            {name: 'User guide', icon: <i className="bi bi-journals"></i>, function: async() => {}, keystroke: []},
            {name: 'divisor', function: async() => {}, keystroke: []},
            {name: 'Legal terms', icon: <i className="bi bi-mortarboard"></i>, function: async() => {}, keystroke: []}
        ],
        keystroke: []},
        {name: 'About jjodel', icon: <img src={jj} width={15}/>, function: async() => {}, keystroke: []},
        {name: 'divisor', function: async() => {}, keystroke: []},
        {name: 'Logout', icon: <i className="bi bi-box-arrow-right"></i>, function: async() => {}, keystroke: [Key.cmd, 'Q']},

        /* {name: 'Project',
            subItems: [
                {name: 'New', },
            ]
        }*/
    ];

    type MenuType = {
        items: MenuEntry[];
    }
    const MainMenu = (props: MenuType) => {

        return(
            <div className='col nav-hamburger hoverable' tabIndex={0}>
                <i className="bi bi-grid-3x3-gap-fill list"></i>
                <div className={'content context-menu'}>
                    <ul>
                        {props.items.map(i => makeEntry(i))}
                    </ul>
                </div>
            </div>
        );
    };

    const Logo = () => {
        return (
        <div className='col nav-logo'>
            <img height={24} src={logo} />
        </div>
        );
    }

    const Commands = () => {
        return (<>
                      
        </>);
    };

    const UserMenu = () => {
        return (<>
            <div className='col nav-side'>
                <div style={{float: 'right', left: '300px!important', width: '31px', marginTop: '2px'}}>
                    <Menu position={'left'}>
                        <Item icon={icon['dashboard']} action={() => {navigate('/allProjects')}}>Dashboard</Item>
                        <Divisor />
                        <Item icon={icon['profile']}action={(e)=> {alert('')}}>Profile</Item>
                        <Item icon={icon['settings']} action={(e)=> {alert('')}}>Settings</Item>
                        <Divisor />
                        <Item icon={icon['logout']} action={(e)=> {alert('')}}>Sign out</Item>
                    </Menu>
                </div>
            </div>
        </>);
    }

    if(project)

        return(<>
            <nav className={'nav-container d-flex'} style={{zIndex: 99}}>
                <MainMenu items={projectItems}/>
                <Logo />
                <UserMenu />
                <Commands />
                <User />
            </nav>

            {clicked === 'new.metamodel' && <MetamodelPopup {...{project, setClicked}} />}
            {clicked === 'new.model' && <ModelPopup {...{metamodels, project, setClicked}} />}
        </>);
    else
        return(<>
            <nav className={'nav-container d-flex'} style={{zIndex: 99}}>
                <MainMenu items={dashboardItems} />
                <Logo />
                <UserMenu />
                <User />
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
