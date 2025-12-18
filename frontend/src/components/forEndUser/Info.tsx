import {ReactNode} from "react";
import "./Info.scss"

import type {GObject, Overlap} from "../../joiner";
import {GenericProps} from "../../joiner/types";


export function Info(props: AllProps) {
    return <i className={"bi bi-info-square info-component hoverable " + (props.className || '')} style={props.style}>
        <div className={'content p-2 ' + (props.popupClassName || '')} style={props.popupStyle}>{
            props.children || props.content
        }</div>
    </i>
}

interface OwnProps extends GenericProps{
    content?: ReactNode,
    popupClassName?: string,
    popupStyle?: GObject,
}
interface StateProps{}
interface DispatchProps{}
type AllProps = Overlap<OwnProps, Overlap<StateProps, DispatchProps>>;