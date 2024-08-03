import { meanBy } from 'lodash';
import { useState, MouseEventHandler } from 'react';
import { IconTheme } from 'react-hot-toast';
import {useNavigate} from 'react-router-dom';
import { LProject } from '../../joiner';

import { icon } from './icons/Icons';

interface StateProps {
    projects: LProject[];
}


type Props = {
    active: 'Account'|'Settings'|'Updates'|'Community'|'All'|'Archive';
    projects: LProject[];
};


type ItemProps = {
    children: string;
    icon?: any;
    action?: string | MouseEventHandler;
};

const Item = (props: ItemProps) => {
    const navigate = useNavigate();
    return (
        <div onClick={e => navigate(`/${props.action}`)} className={'item'}>{props.icon && props.icon} {props.children}</div>
    );
}

const Upload = () => {
    return(
        <div className={'upload'}>
            <i className="bi bi-arrow-up-circle"></i>
            <p>Drop your jjodel project archive here to import it.</p>
        </div>
    );
};

type MenuProps = {
    children: any;
    title?: string;
    mode?: "collapsable";
};

const Menu = (props: MenuProps) => {
    const [open,setOpen] = useState(true);

    return (<>
        {props.title && props.mode && open && <i className={'bi bi-chevron-down'} onClick={(e) => setOpen(!open)}></i>}
        {props.title && props.mode && !open && <i className={'bi bi-chevron-right'} onClick={(e) => setOpen(!open)}></i>}
        
        <div className='menu border-bottom'>
            {props.title && <h1>{props.title}</h1>}
            <div>
                {open && props.children}
            </div>
        </div>
    </>);
}

const Divisor = () => {
    return (<hr className='my-1' />);
};

Menu.Item = Item;

function LeftBar(props: Props): JSX.Element {
    const {active} = props;
    const navigate = useNavigate();
    
    

    return(<div className={'leftbar border-end border-light-subtle '}>
        
        <i className="bi bi-search"></i>
        <input placeholder={'Search for anything'}type={'text'} name='search-text' />

        <Menu>
            <Item action={'allProjects'} icon={icon['dashboard']}>All projects </Item>
            <Item action={'recent'} icon={icon['recent']}>Recent</Item>
        </Menu>
        <Menu title={"Starred"} mode={'collapsable'}>
            {props.projects.filter(p => p.favorite).map(p => <Item icon={icon['folder']} action={e => selectProject()}>{p.name}</Item>)}
        </Menu>
        <Menu>
            <Item action={'templates'} icon={icon['template2']}>Templates</Item>
            <Item action={'notes'} icon={icon['edit']}>Notes</Item>
        </Menu>
        <Menu title={'Support'} mode={'collapsable'}>
            <Item action={'updates'} icon={icon['whats-new']}>What's new</Item>
            <Item action={'gettingstarted'} icon={icon['getting-started']}>Getting started</Item>
            <Item action={'guide'} icon={icon['manual']}>User guide</Item>
        </Menu>

        <Upload />


        {/* 
        
        <b className={'d-block px-1 mt-2'}>Generals</b>
        {info.map((data, i) => <div key={i} onClick={e => navigate(`/${data.link}`)} className={`${active === data.label && 'bg-gray'} p-2`} tabIndex={-1}>
            <i style={{fontSize: '1.2em'}} className={`bi bi-${data.icon}`} />
            <label className={'ms-2 my-auto'}>{data.label}</label>
        </div>)}
        <hr className={'my-2'} />
        <b className={'d-block px-1'}>Projects</b>
        {projects.map((data, i) => <div key={i} onClick={e => navigate(`/${data.link}`)} className={`${active === data.label && 'bg-gray'} p-2`} tabIndex={-1}>
            <i style={{fontSize: '1.2em'}} className={`bi bi-${data.icon}`} />
            <label className={'ms-2 my-auto'}>{data.label}</label>
        </div>)}
        
        */}
    </div>
    
    )
}

export {LeftBar};
