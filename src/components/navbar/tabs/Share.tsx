import {Dispatch, ReactElement} from 'react';
import {DState} from '../../../redux/store';
import {connect} from 'react-redux';
import {FakeStateProps} from "../../../joiner/types";

function ShareComponent(props: AllProps) {
    const debug = props.debug;
    const root = process.env['REACT_APP_URL'] || '';

    const create = async() => {
        // const code = await Collaborative.createRoom();
        // window.location.replace(`${root}/rooms/${code}`);
    }

    const quit = async() => {
        // window.location.replace(root);
    }
    return(<li className={'dropdown-item'}>Share
        <i className={'ms-auto bi bi-caret-right-fill'} />
        <ul className={'submenu dropdown-menu'}>
            {false && <li tabIndex={-1} onClick={create} className={'dropdown-item'}>Collaborative</li>}
            {false && <li tabIndex={-1} onClick={quit} className={'dropdown-item'}>Quit</li>}
        </ul>
    </li>);
}

interface OwnProps {}
interface StateProps {debug: boolean}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret = {} as FakeStateProps;
    ret.debug = state.debug;
    return ret;
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
