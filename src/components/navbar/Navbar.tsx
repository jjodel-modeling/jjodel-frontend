import './style.scss';
import React, {Dispatch, ReactElement} from 'react';
import {connect} from 'react-redux';
import {DState, DUser, LUser, SetRootFieldAction, U} from '../../joiner';
import File from './tabs/File';
import Edit from './tabs/Edit';
import Debug from './tabs/Debug';
import DebugImage from '../../static/img/debug.png';
import {FakeStateProps} from '../../joiner/types';
import PersistanceApi from "../../api/persistance";
import Collaborative from "../collaborative/Collaborative";

let clickTimestamps: number[] = [];
const clicksRequired = 2;
const timeframe = 2000;
function NavbarComponent(props: AllProps) {
    const debug = props.debug;
    const user = props.user;
    const project = user.project;

    const closeProject = async() => {
        if(project?.type === 'collaborative') {
            SetRootFieldAction.new('collaborativeSession', false);
            Collaborative.client.disconnect();
            if(project.onlineUsers === 0) await PersistanceApi.saveProject();
        }
        user.project = null;
    }

    return(<nav className={'navbar navbar-expand-lg'}>
        <ul className={'navbar-nav'}>
            {(project) ?
                <li className={'nav-item dropdown'}>
                    <i tabIndex={-1} className={'fs-3 dropdown-toggle bi bi-list'} data-bs-toggle={'dropdown'} />
                    <ul className={'dropdown-menu'}>
                        {/*<li tabIndex={-1} className={'dropdown-item'}>
                            Test
                        </li>*/}
                        {debug && <>
                            <hr />
                            <Debug />
                        </>}
                        <hr />
                        <File />
                        <Edit />
                        {/*<Share />*/}
                        {debug && undefined /* <Examples />*/}
                        <hr />
                        <li tabIndex={-1} onClick={closeProject} className={'text-danger dropdown-item'}>
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
            {debug && <li className={'nav-item'}>
                <img alt={'debug'} width={25} height={25} src={DebugImage} />
            </li>}
            <li className={'nav-item dropdown'}>
                <div tabIndex={-1} style={{cursor: 'pointer', width: '2rem', height: '2rem'}} data-bs-toggle={'dropdown'}
                     className={'dropdown-toggle bg-primary circle border d-flex justify-content-center align-items-center'}
                     onClick={(e)=>{
                         let now = Date.now();
                         if (now - clickTimestamps[clickTimestamps.length - clicksRequired] < timeframe) { SetRootFieldAction.new('debug', !debug); clickTimestamps = []; }
                         clickTimestamps.push(now);
                     }}>
                    <label style={{cursor: 'pointer'}} className={'text-white'}>{user.username[0].toUpperCase()}</label>
                </div>
                <ul className={'dropdown-menu'}>
                    <li tabIndex={-1} onClick={async(e) => {
                        SetRootFieldAction.new('isLoading', true);
                        await PersistanceApi.logout();
                    }} className={'dropdown-item'}>
                        Logout
                    </li>
                </ul>
            </li>

            <ul className={'navbar-nav ms-auto'}>
            </ul>
            {user.project && <li className={'nav-item'}>
                <button disabled={project?.type === 'collaborative'} onClick={async(e) => await PersistanceApi.saveProject()} style={{backgroundColor: '#9746fd', fontSize: '0.85rem'}} className={'text-white btn p-1'}>
                    Save
                </button>
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

