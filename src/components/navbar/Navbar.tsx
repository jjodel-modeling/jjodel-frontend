import React, {Dispatch, ReactElement} from 'react';
import {connect} from 'react-redux';
import {DState, LState, SetRootFieldAction} from '../../joiner';
import File from './tabs/File';
import Edit from './tabs/Edit';
import Share from './tabs/Share';
import Examples from './tabs/Examples';
import Logo from '../../static/img/logo.png';
import Debug from '../../static/img/debug.png';
import './style.scss';

let clickTimestamps: number[] = [];
const clicksRequired = 2;
const timeframe = 2000;
function NavbarComponent(props: AllProps) {
    const debug = props.debug;

    return(<nav className={'navbar navbar-expand-lg'}>
        <ul className={'navbar-nav'}>
            <File />
            <Edit />
            <Share />
            <Examples />
            {debug && <li className={'d-block ms-1 m-auto'}>
                <img width={30} height={30} src={Debug} alt={"debug mode on"} />
            </li>}
        </ul>
        <ul className={'navbar-nav ms-auto'}>
            <li className={'d-block'}>
                <img width={80} height={40} src={Logo} alt={"jjodel logo"} onClick={(e) => {
                    let now = Date.now();
                    if (now - clickTimestamps[clickTimestamps.length - clicksRequired] < timeframe) { SetRootFieldAction.new('debug', !debug); clickTimestamps = []; }
                    clickTimestamps.push(now);
                }}/>
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

