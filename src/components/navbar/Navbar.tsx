import './style.scss';
import React, {Dispatch, ReactElement} from 'react';
import {connect} from 'react-redux';
import {DState, DUser, LUser} from '../../joiner';
import File from './tabs/File';
import Edit from './tabs/Edit';
import Share from './tabs/Share';
import Logo from '../../static/img/logo.png';
import Debug from '../../static/img/debug.png';
import {FakeStateProps} from '../../joiner/types';

function NavbarComponent(props: AllProps) {
    const debug = props.debug;
    const user = props.user;
    const project = user.project;

    return(<nav className={'navbar navbar-expand-lg'}>
        <ul className={'navbar-nav'}>
            {(project) ?
                <li className={'nav-item dropdown'}>
                    <i tabIndex={-1} className={'fs-3 dropdown-toggle bi bi-list'} data-bs-toggle={'dropdown'} />
                    <ul className={'dropdown-menu'}>
                        <li tabIndex={-1} className={'dropdown-item'}>
                            Test
                        </li>
                        <hr />
                        <File />
                        <Edit />
                        <Share />
                        <hr />
                        <li tabIndex={-1} onClick={e => user.project = null} className={'text-danger dropdown-item'}>
                            Close Project
                        </li>
                    </ul>
                </li> :
                <li className={'nav-item dropdown'}>
                    <i tabIndex={-1} className={'fs-3 dropdown-toggle bi bi-list'} data-bs-toggle={'dropdown'} />
                    <ul className={'dropdown-menu'}>
                        <li tabIndex={-1} className={'dropdown-item'}>
                            Test
                        </li>
                    </ul>
                </li>
            }
        </ul>
        <ul className={'navbar-nav ms-auto'}>
            <li className={'nav-item dropdown'}>
                <div tabIndex={-1} style={{cursor: 'pointer', width: '2rem', height: '2rem'}} data-bs-toggle={'dropdown'}
                     className={'dropdown-toggle bg-primary circle border d-flex justify-content-center align-items-center'}>
                    <label style={{cursor: 'pointer'}} className={'text-white'}>A</label>
                </div>
                <ul className={'dropdown-menu'}>
                    <li tabIndex={-1} className={'dropdown-item'}>
                        Test
                    </li>
                </ul>
            </li>
            <li className={'nav-item'}>
                <button style={{backgroundColor: '#9746fd', fontSize: '0.85rem'}} className={'text-white btn p-1'}>
                    Share
                </button>
            </li>
            {debug && <li className={'nav-item'}>
                <img alt={'debug'} width={25} height={25} src={Debug} />
            </li>}
        </ul>
    </nav>);

}
interface OwnProps {}
interface StateProps {
    debug: boolean;
    user: LUser;
}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.debug = state.debug;
    ret.user = LUser.fromPointer(DUser.current);
    return ret;
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

