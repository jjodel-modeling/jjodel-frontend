import './style.scss';
import {DState, DUser, LGraphElement, LModelElement, LUser, U} from "../../joiner";
import {FakeStateProps} from "../../joiner/types";
import React, {Dispatch, ReactElement, useState} from "react";
import {connect} from "react-redux";


import swen from '../../static/img/swen-splash.png';
import { About } from './about/About';

enum notificationType {
    Clients = 0,
    Terminal = 1,
    Messages = 2
  }

enum alertType {
    Normal = 0,
    Success = 1,
    RequireAttention = 2,
    Alert = 3,
    Error = 4
}

type Props = {
    type: notificationType;
    alert: alertType;
    message: string;

};


const JjodelName = () => {
const [animal, setAnimal] = useState(false);


    return (<>
        <div className={'jjodel'}>
            <span><About ver={'1.6'} name={'manatee'} /></span>
        </div>
        </>);
}

function BottomBarComponent(props: AllProps): JSX.Element {
    const [swenOpen, setSwen] = useState(false);
    const {node,data} = props;
    let nodepos: string | undefined;
    if (node) {
        let size = {...node.size};
        if (size && typeof size === 'object'){
            let ret = [
                '', U.cropNum(+(+size.x||0).toFixed(2)),
                ', ', U.cropNum(+(+size.y||0).toFixed(2)),
                ', ', U.cropNum(+(+node.zIndex||0).toFixed(2)),
                ' w:', U.cropNum(+(+size.w||0).toFixed(2)),
                ' h:', U.cropNum(+(+size.h||0).toFixed(2)),
            ]
            nodepos = ret.join('');
        }
    }

    return(<footer className={'footer'}>
        <label className={'me-3'}>
            Made with <i className="bi bi-heart-fill" /> in the swen group
        </label>
        <div style={{width: '100px'}}></div>
        <div className={'coordinates'} hidden={!node}>
            {data?.name}&nbsp;
            {nodepos}
        </div>
        {swenOpen && 
                <>
                    <div className='modal-container'></div>
                    <div className='swen'>
                        <img src={swen} onClick={(e) => setSwen(false)} />
                    </div>
                </>
        }
        <JjodelName />

    </footer>)
}

interface OwnProps {}
interface StateProps {
    node?: LGraphElement;
    data?: LModelElement
}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    const selected = state._lastSelected;
    if(selected?.node) ret.node = LGraphElement.fromPointer(selected.node);
    if(selected?.modelElement) ret.data = LModelElement.fromPointer(selected.modelElement);

    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

export const BottomBarConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(BottomBarComponent);

const BottomBar = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <BottomBarConnected {...{...props, children}} />;
}

export {BottomBar};
