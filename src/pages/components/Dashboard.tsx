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
        <Navbar />
        <LeftBar active={active} />
        <div style={{marginLeft: '12%'}} className={'p-2'}>
            {children}
        </div>
    </>);
}

export {Dashboard};

