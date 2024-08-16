import React, {MouseEventHandler, ClassAttributes, useState} from "react";
import './commandbar.scss';
import { inherits } from "util";

type BtnProps = {
    disabled?: boolean;
    icon: "up" | "down" | "back" | "fwd" | "add" | "add2" | "delete" | "delete2" | "edit" | "shrink" | "expand" | "space" | "sep" | "check" | "copy",
    tip?: string,
    label?: string;
    theme?: "dark" | "light",
    action?: MouseEventHandler,
    size?: "x-small" | "small" | "medium" | "large",
    style?: React.CSSProperties
}



export const Btn = (props: BtnProps) => {

    return (<>
        {props.action ?
            <div>
                {props.icon === "delete2" ? 
                    <div className={`delete2 ${props.theme ? props.theme : 'light'}`}>Delete</div>
                    :
                    
                    <i 
                        className={`bi tab-btn ${props.icon} ${props.theme ? props.theme : 'light'} ${props.size && props.size} ${props.disabled && 'disabled'}`}
                        onClick={props.action && props.action} title={`${props.tip && props.tip}`} 
                    />
                
                }
                    
            </div>
        :
            <>
            {props.icon === "space" ?
                <span style={{display: 'block', width: '26px'}}></span>
            : 
                <button className="btn btn-success my-btn">{props.icon === "add2" && props.label}</button>
            }
            </>
        }
    </>);
}

export const Sep = () => {

    return (<>
            <div>
                <div className={'tab-btn sep'}></div>
            </div>
    </>);
}

/*
export const Btn = (props: BtnProps) => {

    return (<>
        {props.action ?
            <div className={`${props.icon === 'delete2' && 'my-w-100'}`} >
                <i 
                    className={`bi tab-btn ${props.icon} ${props.theme ? props.theme : 'light'} ${props.size && props.size} ${props.disabled && 'disabled'}`}
                    onClick={props.action && props.action} title={`${props.tip && props.tip}`} 
                />
            </div>
        :
            <i 
                className={`bi tab-btn ${props.icon} ${props.size && props.size} disabled ${props.theme ? props.theme : 'light'}s`} 
            />
        }
    </>);
}
*/


type CommandProps = {
    children: any,
    style?: React.CSSProperties,
    className?: string
}

export const CommandBar = (props: CommandProps) => {

    let style = props.style;

    return(<>
        {props.style ?
            <div className={`command-bar ${props.className && props.className}`} style={props.style}>
                {props.children}
            </div>
            :
            <div className={`command-bar ${props.className && props.className}`} >
                {props.children}
            </div>
        }
            
    </>);
};
