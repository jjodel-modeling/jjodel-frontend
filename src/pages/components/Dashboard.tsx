import type { DState } from '../../joiner';
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



function Dashboard(props: Props): JSX.Element {
    const {children, active} = props;

    return(<>
        <Navbar />
        <LeftBar active={active} />
        <div className={'catalog-container'}>
            <User name={'Alfonso Pierantonio'} initials={'AP'} />
            <Catalog children={children}/>
        </div>
    </>);
}

export {Dashboard};

