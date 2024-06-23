import type {Dictionary, DocString} from "../../joiner";
import React, {HTMLProps, ReactNode} from "react";
import {U} from "../../joiner";
import {useStateIfMounted} from "use-state-if-mounted";

interface DropDownButtonProps {
    rootProps: HTMLProps<any>;
    mainButton: ReactNode;
    otherButtons: Dictionary<DocString<"label">, ReactNode[]> | ReactNode[];
}
export function DropDownButton(props: DropDownButtonProps){
    let rootStyle = {display: "flex"};
    let rootClass = 'DropDownButton hoverable ';
    if (props.rootProps.style) { rootStyle = {...rootStyle, ...props.rootProps.style}; }
    if (props.rootProps.className) { rootClass += props.rootProps.className; }
    const [collapsed, setCollapsed] = useStateIfMounted(false);

    let transitionTime = 300;
    let chevronStyle = {
        cursor: 'pointer',
        transition:transitionTime/2 + "ms all",
        transform: "scaleY("+(collapsed ? 1 : -1 )+")  translateY(" + (collapsed ? -0 : 0.1) +"em)"
    };
    let buttons: Dictionary<DocString<"label">, ReactNode[]>;
    if (!props.otherButtons) buttons = {}
    if (Array.isArray(props.otherButtons)) buttons = {'': props.otherButtons}
    else buttons = props.otherButtons;

    return (
        <div {...(props.rootProps || {})} className={rootClass} style={rootStyle} onMouseEnter={()=> setCollapsed(true)} onMouseLeave={()=> setCollapsed(false)}>
            <div className={"mainButton"} style={{flexGrow:8, flexBasis:50}}>{props.mainButton}</div>
            {!collapsed && <div className={"content dropdown-container"}>
                {Object.keys(buttons).map((label, i) => (
                    <div className={"optgroup row"}>
                        {i !== 0 && <hr/>}
                        {label.trim().length > 0 && <div className={"row"}>label</div>}
                        {buttons[label]}
                    </div>)
                )}
            </div>}
            <i className={ "p1 bi m-auto mx-1 bi bi-chevron-bar-down btn-outline-secondary"} style={chevronStyle} />
        </div>);
}
