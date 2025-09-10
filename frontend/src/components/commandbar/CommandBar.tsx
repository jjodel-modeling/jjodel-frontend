import React, {MouseEventHandler, ClassAttributes, useState, useRef, useEffect, ReactElement, ReactNode} from "react";
import './commandbar.scss';
import { inherits } from "util";
import { Tooltip } from "../forEndUser/Tooltip";
import { U } from "../../joiner";

type BtnProps = {
    disabled?: boolean;
    active?: boolean;
    icon: string;

    tip?: ReactNode;
    label?: string;
    theme?: "dark" | "light",
    action?: MouseEventHandler,
    size?: "x-small" | "small" | "medium" | "large",
    style?: React.CSSProperties,
    mode?: 'normal' | 'negative'
    className?: string;
    needConfirm?:boolean;
}


export const Btn = (props: BtnProps) => {
    const [askingConfirm, setConfirm] = useState(false);
    const mode = (props.mode ? props.mode : 'normal');
    let needConfirm = props.needConfirm || (props.icon === 'delete' && !props.disabled);
    let i_classes = (props.className||'') + ` bi tab-btn commandbar-btn ${askingConfirm ? 'bi-question-square-fill question': props.icon} ${props.theme ? props.theme : 'light'} ${props.size||''} ${mode} ${props.disabled ? 'disabled ' : ''}`
    let action = (e: React.MouseEvent<any,any>) => {
        console.log('commandbar action', {disabled: props.disabled, action:props.action, askingConfirm, needConfirm});
        if (props.disabled || !props.action) return;
        if (!askingConfirm && needConfirm) {
            setConfirm(true);
            U.clickedOutside(e, ()=> {
                // console.log('clicked outside remove confirm');
                setConfirm(false)
            });
            return;
        }
        props.action(e);
        e.stopPropagation();
    }
    let icon: ReactNode = null;

    switch (props.icon){
        case 'delete2':
            icon = <div className={`delete2 ${props.theme ? props.theme : 'light'}`}>Delete</div>; break;

        case 'delete':
            icon = <Tooltip tooltip={askingConfirm ? 'Are you sure?' : props.tip} inline={true} position={'top'} offsetY={10} >
                <i onClick={action} style={props.style} className={i_classes} />
            </Tooltip>; break;

        default:
            icon = <Tooltip tooltip={props.tip} inline={true} position={'top'} offsetY={10}>
                <i className={i_classes} onClick={action} style={props.style}/>
            </Tooltip>; break;
    }

    if (props.icon === "space" || props.icon === "minispace") return <span style={{display: 'block', width: `${props.icon === 'space' ? '24px' : '4px'}`}} />;
    return <div className={'btn-component '+(props.active ? 'active' : '')}>{icon}</div>;
}



export const Sep = (style?: any) => {

    return (<>
            {style ?
                <div>
                    <div className={'tab-btn sep'}></div>
                </div>
            :
                <div>
                    <div className={'tab-btn sep'} style={style}></div>
                </div>
            }

    </>);
}


type CommandProps = {
    children: any,
    style?: React.CSSProperties,
    className?: string,
    noBorder?: boolean;
}

export const CommandBar = (props: CommandProps) => {

    let style = props.style;

    let noBorder = (props.noBorder ? props.noBorder: false);

    return(<>
        {props.style ?
            <div className={`command-bar ${props.className && props.className} ${noBorder && 'no-border'}`} style={props.style}>
                {props.children}
            </div>
            :
            <div className={`command-bar ${props.className && props.className} ${noBorder && 'no-border'}`} >
                {props.children}
            </div>
        }

    </>);
};
