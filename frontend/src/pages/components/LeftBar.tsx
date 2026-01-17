import {useState, MouseEventHandler, JSX} from 'react';
import {DProject, DUser, L, LProject, LUser, R, SetRootFieldAction, U, windoww} from '../../joiner';

import { icon } from './icons/Icons';
import {DashProps} from "./Dashboard";
import Collaborative from "../../components/collaborative/Collaborative";
import {ProjectsApi} from "../../api/persistance";
import storage from "../../data/storage";
import { isProjectModified } from '../../common/libraries/projectModified';
import { Tooltip } from '../../components/forEndUser/Tooltip';
import {SaveManager} from "../../components/topbar/SaveManager";
import {Link, useNavigate} from "react-router-dom";

interface StateProps {
    projects: LProject[];
}


export type LeftBarProps = {
    user?: LUser;
    active: DashProps['active']; // prende il tipo dal parent-component, così si evita di aggiornare entrambi o avere tipi discordanti.
    projects?: LProject[];
    project?: LProject;

};


type ItemProps = {
    children: string;
    icon?: any;
    action?: string | MouseEventHandler;
    dot?: boolean;
    onClick?: MouseEventHandler
};

const Item = (props: ItemProps) => {
    let action: (e:any)=>any = props.action as any;
    let navigate = useNavigate();
    if (typeof action === 'string') action = (e => R.navigate(`/${props.action}`, navigate));
    let finalaction = (e:any) =>{ props.onClick?.(e); action(e); }
/*
    let url: string = '';
    if (typeof props.action === 'string') url = props.action;*/
    return (<>

        {/*<Link to={url} className={'item ' + (props.dot ? 'red-dot' : '')}>{props.icon && props.icon}&nbsp;{props.children}</Link>*/}
            <div onClick={finalaction} className={'item ' + (props.dot ? 'red-dot' : '')}>
                {props.icon && props.icon}&nbsp;<span>{props.children}</span>
            </div>
    </>);
}

const Upload = () => {
    return(<></>);
    return(
        <div className={'upload'}>
            <i className="bi bi-arrow-up-circle"></i>
            <p>Drop your Jjodel project archive here to import it.</p>
        </div>
    );
};

type MenuProps = {
    children: any;
    title?: string;
    mode?: "collapsable";
    project?: boolean;
};

const Menu = (props: MenuProps) => {
    const [open,setOpen] = useState(true);

    return (
        <div className='menu border-bottom'>
            {/* Only render title section if title exists */}
            {props.title && (
                <div className="menu-header" onClick={props.mode ? () => setOpen(!open) : undefined} style={props.mode ? {cursor: 'pointer'} : {}}>
                    <h1>
                        {props.title}
                        {isProjectModified() && props.project && <i className="bi bi-circle-fill modified"></i>}
                    </h1>
                    {props.mode && (
                        <i className={`bi ${open ? 'bi-chevron-down' : 'bi-chevron-right'}`} />
                    )}
                </div>
            )}
            <div>
                {open && props.children}
            </div>
        </div>
    );
}

const Divisor = () => {
    return (<hr className='my-1' />);
};

Menu.Item = Item;

function LeftBar(props: LeftBarProps): JSX.Element {

    const {active, project} = props;
    let user: LUser = props.user || L.fromPointer(DUser.current);

    const selectProject= (project: LProject) => {
        R.navigate(`/project?id=${project.id}`, true);
        U.resetState();
    };

    const closeProject = () => {
        function doclose(){
            R.navigate('/allProjects', true);
            Collaborative.disconnect();
            U.resetState();
        }
        doclose();
    }
    const toggleFavorite = async() => {
        await ProjectsApi.favorite(project?.__raw as DProject);
    };
    const exportProject = async() => {
        if(project) {
            await ProjectsApi.save(project);
            U.download(`${project?.name}.jjodel`, JSON.stringify(project?.__raw));
        }
    }

    // Check if there are any projects for "Recently Modified" section
    const hasProjects = props.projects && props.projects.length > 0;

    return(<>

        {active === 'Project' ?
            <div className={'leftbar'}>
                {/* @ts-ignore */}
                <Menu title={props.project.name ? props.project.name : 'Unnamed Project'} project>
                    <Item action={exportProject} icon={icon['download']}>Download</Item>
                    <Item action={toggleFavorite} icon={!project?.isFavorite ? icon['favorite'] : icon['favoriteFill']}>{!project?.isFavorite ? 'Add to favorites ' : 'Remove from favorites '}</Item>
                    <Item action={closeProject} icon={icon['close']}>Close project </Item>
                </Menu>
            </div>
            :
            <div className={'leftbar'}>

                {user && user.email === 'admin@gmail.it' && <Menu title={'Administration'} mode={'collapsable'}>
                    <Item action={'usersInfo'} icon={<i className="bi bi-people" />}>Users</Item>
                    <Item action={'projectsInfo'} icon={<i className="bi bi-folder" />}>Projects</Item>
                    <Item action={'news'} icon={<i className="bi bi-newspaper" />}>News</Item>
                </Menu>}

                {/* Main Navigation - Workspace */}
                <Menu>
                    <Item action={'allProjects'} icon={<i className="bi bi-folder" />}>All projects</Item>
                    <Item action={'favorites'} icon={<i className="bi bi-star" />}>Favorites</Item>
                    <Item action={'trash'} icon={<i className="bi bi-trash" />}>Trash</Item>
                </Menu>

                {/* Browse Section - Templates & Explore (moved from navbar tabs) */}
                <Menu title={'Browse'} mode={'collapsable'}>
                    <Item action={'templates'} icon={<i className="bi bi-grid-3x3-gap" />}>Templates</Item>
                    <Item
                        action={() => window.open('https://www.jjodel.io/explore/', '_blank')}
                        icon={<i className="bi bi-compass" />}
                    >Explore</Item>
                </Menu>

                {/* Recently Modified - ONLY show if projects exist */}
                {hasProjects && props.projects &&
                    <Menu title={"Recently Modified"} mode={'collapsable'}>
                        {[...props.projects]
                            .sort((a,b) => (b.lastModified > a.lastModified) ?  1 : -1)
                            .slice(0,5)
                            .map(p => <Item key={p.id} icon={<i className="bi bi-file-earmark" />} action={e => selectProject(p)}>{p.name}</Item>)}
                    </Menu>
                }

                {/* Support Section */}
                <Menu title={'Support'} mode={'collapsable'}>
                    <Item
                        action={() => window.open('https://www.jjodel.io/manual/', '_blank')}
                        icon={<i className="bi bi-book" />}
                    >Documentation</Item>
                    <Item
                        action={() => window.open('https://www.jjodel.io/getting-started/', '_blank')}
                        icon={<i className="bi bi-mortarboard" />}
                    >Tutorials</Item>
                </Menu>

                {/* Footer - Version Only */}
                <div className="leftbar-footer">
                    <span className="version-text">Jjodel v2.0 · MIT</span>
                </div>

            </div>
        }

    </>)
}

export {LeftBar};
