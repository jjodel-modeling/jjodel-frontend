import './style.scss';
import {DState, DUser, LGraphElement, LModelElement, LUser, U} from "../../joiner";
import {FakeStateProps} from "../../joiner/types";
import React, {Dispatch, JSX, ReactElement, ReactNode, useState} from "react";
import {connect} from "react-redux";


import swen from '../../static/img/swen-splash.png';
import { About } from './about/About';
import { Tooltip } from '../../components/forEndUser/Tooltip';

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
            <Tooltip tooltip={'MIT: permissive; commercial use, modification, and redistribution allowed; no warranty.'} inline offsetY={10} position={'top'}>
                <div className="license">
                <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener noreferrer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="82" height="20" role="img">
                        <title>License: MIT</title>
                        <linearGradient id="s" x2="0" y2="100%">
                            <stop offset="0" stop-color="#bbb" stop-opacity=".1" /><stop offset="1" stop-opacity=".1" />
                        </linearGradient>
                        <clipPath id="r"><rect width="82" height="20" rx="3" fill="#fff" /></clipPath>
                        <g clip-path="url(#r)"><rect width="51" height="20" fill="#555" />
                            <rect x="51" width="31" height="20" fill="#048BA8" /><rect width="82" height="20" fill="url(#s)" />
                        </g>
                        <g fill="#fff" text-anchor="middle" font-family="Inter Variable,sans-serif" text-rendering="geometricPrecision" font-size="120">
                            <text x="265" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="410">
                                License
                            </text>
                            <text x="265" y="140" transform="scale(.1)" fill="#fff" textLength="410">
                                License
                            </text>
                            <text x="655" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="210">
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

const BottomBar = (props: OwnProps, children: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <BottomBarConnected {...{...props, children}} />;
}

export {BottomBar};
