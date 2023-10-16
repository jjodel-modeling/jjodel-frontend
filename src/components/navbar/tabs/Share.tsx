import React, {Dispatch, ReactElement} from 'react';
import {DState} from '../../../redux/store';
import {connect} from 'react-redux';
import Collaborative from "../../collaborative/Collaborative";

function ShareComponent(props: AllProps) {
    const room = props.room;
    const debug = props.debug;
    const root = process.env['REACT_APP_URL'] || '';

    const create = async() => {
        const code = await Collaborative.createRoom();
        window.location.replace(`${root}/rooms/${code}`);
    }

    const quit = async() => {
        window.location.replace(root);
    }

    return(<li className={'nav-item dropdown'}>
        <div tabIndex={-1} className={'dropdown-toggle'} data-bs-toggle={'dropdown'}>Share</div>
        <ul className={'dropdown-menu'}>
            {!room && <li tabIndex={-1} onClick={create} className={'dropdown-item'}>Collaborative</li>}
            {room && <li tabIndex={-1} onClick={quit} className={'dropdown-item'}>Quit</li>}
        </ul>
    </li>);
}

interface OwnProps {}
interface StateProps {room: string, debug: boolean}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const room = state.room;
    const debug = state.debug;
    return {room, debug};
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const ShareConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(ShareComponent);

export const Share = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <ShareConnected {...{...props, children}} />;
}

export default Share;
