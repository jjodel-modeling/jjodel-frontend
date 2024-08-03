import type { LUser, DUser, LPointerTargetable, DState, LProject } from '../../joiner';
import {Navbar, LeftBar} from './';

import '../style.scss'

type UserProps = {
    name: string;
    initials: string;
};

const User = (props: UserProps) => {
    return (<>
        <div className={'user row'}>
            <div className={'initials'}>{props.initials}</div>
            <div className={'name'}><h2>{props.name}'s projects</h2></div>
        </div>
    </>);
};


type TitleProps = {
    title: string;
    icon: any;
}

const Title = (props: TitleProps) => {
    return (<>
        <div className={'user row'}>
            <div className={'name'}><h2>{props.icon} {props.title}</h2></div>
        </div>
    </>);
};


type Props = {
    children?: JSX.Element,
    active: 'Account' | 'All' | 'Recent' | 'Notes' | 'Profile' | 'Settings' | 'Templates' |  'Updates',
    version: Partial<DState["version"]>;
};


type CatalogProps = {
    children: any;
}

const Catalog = (props: CatalogProps) => {

    return (<>
        <div className={'p-2'} style={{flexGrow:1}}>
            {props.children}
        </div>
    </>);
};

function Dashboard(props: Props): any {

    const {children, active} = props;
    const user: LUser = LPointerTargetable.fromPointer(DUser.current);

    return(<>
        <Navbar />
        <div className={"d-flex h-100 w-100"}>
            <LeftBar projects={user.projects} active={active}/>

            <div className={'row catalog-container h-20 w-100'} style={{marginRight: '20px', height: '10px'}}>
                <div className={'col'}>
                    {active === "All" && <User name={'John Doe'} initials={'JD'} />}
                    {active === "Recent" && <Title title={'Recent'} icon={<i className="bi bi-clock"></i>} />} 
                    {active === "Templates" && <Title title={'Jjodel Templates'} icon={<i className="bi bi-code-square"></i>} />} 
                    {active === "Notes" && <Title title={'Project Notes'} icon={<i className="bi bi-pencil-square"></i>} />} 
                    {active === "Updates" && <Title title={'What\'s new'} icon={<i className="bi bi-clock-history"></i>} />}
                    {active === "Profile" && <Title title={'Profile'} icon={<i className="bi bi-clock-history"></i>} />}
                    
                </div>
                <div className={'col text-end'}>
                    <button className={'add-project'}><i className="bi bi-plus-lg"></i> Project</button>
                </div>

                <Catalog children={children}/>
            </div>
        </div>
    </>);
}

export {Dashboard};

