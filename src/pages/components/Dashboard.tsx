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


type Props = {
    children?: JSX.Element,
    active: 'Account'|'Settings'|'Updates'|'Community'|'All'|'Archive',
    version: Partial<DState["version"]>;
};


type CatalogProps = {
    children: any;
}

const Catalog = (props: CatalogProps) => {

    return (<>
        <div>
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
            <LeftBar projects={user.projects} active={active} />

            <div className={'catalog-container'}>
                <User name={'John Doe'} initials={'JD'} />
                <Catalog children={children}/>
            </div>
        </div>
    </>);
}

export {Dashboard};

