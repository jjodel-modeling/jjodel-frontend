import React, {Dispatch, ReactElement} from 'react';
import {connect} from 'react-redux';
import {DState} from '../../joiner';
import './style.scss';
import Univaq from '../../static/img/univaq.png';
import {useStateIfMounted} from 'use-state-if-mounted';
import File from './tabs/File';
import Edit from './tabs/Edit';
import Share from './tabs/Share';

function NavbarComponent(props: AllProps) {
    const debug = props.debug;
    const [path, setPath] = useStateIfMounted('');

    return(<nav className={'my-navbar'}>
        <div className={'logo'}>
            <img className={'d-block m-auto'} height={50} width={50} src={Univaq} />
        </div>
        <div>
            <div className={'first-row'}>
                <div className={'project-name'}>
                    Untitled Project
                    {debug && <b className={'ms-2 text-danger'}>DEBUG MODE</b>}
                </div>
            </div>
            <div className={'second-row'}>
                <div tabIndex={-1} onClick={e => setPath('file')} className={'my-nav-item'}>
                    File
                </div>
                {path === 'file' && <File setPath={setPath} />}
                <div tabIndex={-1} onClick={e => setPath('edit')} className={'my-nav-item'}>Edit</div>
                {path === 'edit' && <Edit setPath={setPath} />}
                <div tabIndex={-1} onClick={e => setPath('share')} className={'my-nav-item'}>Share</div>
                {path === 'share' && <Share setPath={setPath} />}
            </div>
        </div>
    </nav>);

}
interface OwnProps {}
interface StateProps {debug: boolean}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const debug = state.debug;
    return {debug};
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const NavbarConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(NavbarComponent);

export const Navbar = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <NavbarConnected {...{...props, children}} />;
}
export default Navbar;

