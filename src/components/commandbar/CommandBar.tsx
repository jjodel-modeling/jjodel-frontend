import React, {MouseEventHandler} from "react";
import './commandbar.scss';

type BtnProps = {
    disabled?: boolean;
    icon: "up" | "down" | "back" | "fwd" | "add" | "delete" | "edit",
    tip?: string,
    action?: MouseEventHandler,
    size?: "small" | "medium" | "large"
}

export const Btn = (props: BtnProps) => {
    return (<>
        {props.action ?
            <div>
                <i className={`bi tab-btn ${props.icon} ${props.size && props.size} ${props.disabled && 'disabled'}`}
                   onClick={props.action} title={`${props.tip && props.tip}`} />
            </div>
        :
            <i className={`bi tab-btn ${props.icon} ${props.size && props.size} disabled`} />
        }
    </>);
}


type CommandProps = {
    children: any;
}

export const CommandBar = (props: CommandProps) => {

    return(<div className={'command-bar'}>
        {props.children}
    </div>);
};
