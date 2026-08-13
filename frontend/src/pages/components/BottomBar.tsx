import React, {Dispatch, JSX, ReactElement, ReactNode, useState} from "react";
import {connect} from "react-redux";

import {DState, DUser, LGraphElement, LModelElement, LUser, U, SetRootFieldAction} from "../../joiner";
import {FakeStateProps} from "../../joiner/types";

import swen from '../../static/img/swen-splash.png';
import { About } from './about/About';
import { Tooltip } from '../../components/forEndUser/Tooltip';

import './style.scss';

const windoww = window as any;

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
            <span><About ver={'2.0'} name={'manatee 2'} /></span>
        </div>
        </>);
}

/**
 * Mode Indicator - shows current Basic/Advanced mode
 * Clickable to toggle between modes
 */
const ModeIndicator = ({ advanced }: { advanced: boolean }) => {
    const toggleMode = () => {
        const newMode = !advanced;
        SetRootFieldAction.new('advanced', newMode);
        windoww.advanced = newMode;
        localStorage.setItem('jjodel.interfaceMode', newMode ? 'advanced' : 'basic');
        U.interfaceMode = newMode ? 'advanced' : 'basic';
        U.alert('i', newMode ? 'Advanced Mode' : 'Basic Mode',
            newMode ? 'All features and options are now visible' : 'Simplified interface active');
    };

    return (
        <Tooltip
            tooltip={`Click to switch to ${advanced ? 'Basic' : 'Advanced'} mode (Cmd+Shift+M)`}
            inline
            offsetY={10}
            position={'top'}
        >
            <div className={`mode-indicator ${advanced ? 'advanced-mode' : ''}`} onClick={toggleMode}>
                {advanced ? (
                    <>
                        <i className="bi bi-lightning-charge-fill" />
                        <span>Advanced</span>
                    </>
                ) : (
                    <>
                        <i className="bi bi-sliders2" />
                        <span>Basic</span>
                    </>
                )}
            </div>
        </Tooltip>
    );
};

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

    return (
        <footer className={'footer'} role="contentinfo">
            {/* Node coordinates readout is diagnostic info: Advanced mode only */}
            <div className={'coordinates'} hidden={!node || !props.advanced}>
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
            <ModeIndicator advanced={props.advanced} />
            <JjodelName />
            <Tooltip tooltip={'MIT: permissive; commercial use, modification, and redistribution allowed; no warranty.'} inline offsetY={10} position={'top'}>
                <div className="license">
                <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener noreferrer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="82" height="20" role="img">
                        <title>License: MIT</title>
                        <linearGradient id="s" x2="0" y2="100%">
                            <stop offset="0" stopColor="#bbb" stopOpacity=".1" /><stop offset="1" stopOpacity=".1" />
                        </linearGradient>
                        <clipPath id="r"><rect width="82" height="20" rx="3" fill="#fff" /></clipPath>
                        <g clipPath="url(#r)"><rect width="51" height="20" fill="#555" />
                            <rect x="51" width="31" height="20" fill="#048BA8" /><rect width="82" height="20" fill="url(#s)" />
                        </g>
                        <g fill="#fff" textAnchor="middle" fontFamily="Inter Variable,sans-serif" textRendering="geometricPrecision" fontSize="120">
                            <text x="265" y="150" fill="#010101" fillOpacity=".3" transform="scale(.1)" textLength="410">
                                License
                            </text>
                            <text x="265" y="140" transform="scale(.1)" fill="#fff" textLength="410">
                                License
                            </text>
                            <text x="655" y="150" fill="#010101" fillOpacity=".3" transform="scale(.1)" textLength="210">
                                MIT
                            </text>
                            <text x="655" y="140" transform="scale(.1)" fill="#fff" textLength="210">
                                MIT
                            </text>
                        </g>
                    </svg>
                </a>
                {/* Open source under the &nbsp; <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener noreferrer">
                MIT License</a> */}
            </div>
            </Tooltip>
        </footer>
    )
}

interface OwnProps {}
interface StateProps {
    node?: LGraphElement;
    data?: LModelElement;
    advanced: boolean;
}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    const selected = state._lastSelected;
    if(selected?.node) ret.node = LGraphElement.fromPointer(selected.node);
    if(selected?.modelElement) ret.data = LModelElement.fromPointer(selected.modelElement);
    ret.advanced = state.advanced;

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

const BottomBar = (props: OwnProps, children: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <BottomBarConnected {...{...props, children}} />;
}

export {BottomBar};
