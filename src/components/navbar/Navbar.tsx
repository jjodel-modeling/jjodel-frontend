import React, {Dispatch, ReactElement} from 'react';
import {connect} from 'react-redux';
import {DState} from '../../joiner';
import File from './tabs/File';
import Edit from './tabs/Edit';
import Share from './tabs/Share';
import Examples from './tabs/Examples';
import Logo from '../../static/img/logo.png';
import Debug from '../../static/img/debug.png';
import './style.scss';

function NavbarComponent(props: AllProps) {
    const debug = props.debug;

    return(<nav className={'navbar navbar-expand-lg'}>
        <ul className={'navbar-nav'}>
            <File />
            <Edit />
            <Share />
            <Examples />
            {debug && <li className={'d-block ms-1 m-auto'}>
                <img width={30} height={30} src={Debug} />
            </li>}
        </ul>
        <ul className={'navbar-nav ms-auto'}>
            <li className={'d-block'}>
                <img width={80} height={40} src={Logo} />
            </li>
        </ul>

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

