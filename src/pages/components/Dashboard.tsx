import type { LUser, DState, LProject } from '../../joiner';
import {DUser, LPointerTargetable} from '../../joiner';
import {Navbar, LeftBar} from './';

import '../dashboard.scss'
import {ReactElement} from "react";

type UserProps = {
    name: string;
    initials: string;
};

const User = (props: UserProps) => {
    return (<>
        <div className={'user'}>
            <div className={'initials'}>{props.initials}</div>
            <div className={'name'}><h2>{props.name}'s projects</h2></div>
        </div>
    </>);
};


type TitleProps = {
    title: string;
    icon: ReactElement;
}

const Title = (props: TitleProps) => {
    return (<>
        <div className={'user'}>
            <div className={'name'}><h2>{props.icon} {props.title}</h2></div>
        </div>
    </>);
};


export type DashProps = {
    children?: JSX.Element,
    // NB: account and profile are both used, i don't know which to keep
    active: 'Account'|'Profile'|'Settings'|'Updates'|'Community'|'All'|'Archive'|'Templates'|'Recent' | 'Notes';
    version: Partial<DState["version"]>;
};


type CatalogProps = {
    children: any;
}

const Catalog = (props: CatalogProps) => {

    return props.children;
    /*return (<>
        <div className={'p-2'} style={{flexGrow:1}}>
            {props.children}
        </div>
    </>);*/
};

function Dashboard(props: DashProps): any {

    const {children, active} = props;
    const user: LUser = LPointerTargetable.fromPointer(DUser.current);

    return(<>
        <Navbar />
        <div className={"dashboard-container"} tabIndex={-1}>
            <LeftBar projects={user.projects} active={active}/>

            <div className={'catalog-container'} style={{}}>
                <div className={'col user-title'}>
                    {active === "All" && <User name={'John Doe'} initials={'JD'} />}
                    {active === "Recent" && <Title title={'Recent'} icon={<i className="bi bi-clock"></i>} />}
                    {active === "Templates" && <Title title={'Jjodel Templates'} icon={<i className="bi bi-code-square"></i>} />}
                    {active === "Notes" && <Title title={'Project Notes'} icon={<i className="bi bi-pencil-square"></i>} />}
                    {active === "Updates" && <Title title={'What\'s new'} icon={<i className="bi bi-clock-history"></i>} />}
                    {active === "Profile" && <Title title={'Profile'} icon={<i className="bi bi-clock-history"></i>} />}

                    <button className={'add-project'}><i className="bi bi-plus-lg"></i> Project</button>
                </div>

                <Catalog children={children}/>
            </div>
        </div>
    </>);
}

export {Dashboard};

