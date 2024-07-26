import type { DState } from '../../joiner';
import {Navbar, LeftBar} from './';
import '../style.scss'

type Props = {
    children?: JSX.Element,
    active: 'Account'|'Settings'|'Updates'|'Community'|'All'|'Archive',
    version: Partial<DState["version"]>;
};
function Dashboard(props: Props): JSX.Element {
    const {children, active} = props;

    return(<>
        { /*<Navbar />*/}
        <div className={"d-flex h-100 w-100"}>
            <LeftBar active={active} />
            <div className={'p-2'} style={{flexGrow:1}}>
                {children}
            </div>
        </div>
    </>);
}

export {Dashboard};

