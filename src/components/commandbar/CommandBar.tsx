import React, {MouseEventHandler, ClassAttributes, useState, useRef, useEffect} from "react";
import './commandbar.scss';
import { inherits } from "util";
import { Tooltip } from "../forEndUser/Tooltip";

type BtnProps = {
    disabled?: boolean;
    icon: "up" 
        | "down" 
        | "back" 
        | "fwd" 
        | "add" 
        | "add2" 
        | "delete" 
        | "delete2" 
        | "edit" 
        | "shrink" 
        | "expand" 
        | "space" 
        | "sep" 
        | "check" 
        | "copy"
        | "close"
        | "info",
    tip?: string,
    label?: string;
    theme?: "dark" | "light",
    action?: MouseEventHandler,
    size?: "x-small" | "small" | "medium" | "large",
    style?: React.CSSProperties
}

function useClickOutside(ref: any, onClickOutside: any) {

    useEffect(() => {
      
        function handleClickOutside(event: Event) {
            if (ref.current && !ref.current.contains(event.target)) {
                onClickOutside();
            }
        }

      // Bind
      document.addEventListener("mousedown", handleClickOutside); // mousedown
      return () => {
        // dispose
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [ref, onClickOutside]);
  }

type EditorProps = {
    style?: React.CSSProperties;
}

export const Btn = (props: BtnProps) => {

    const [del,setDel] = useState(false);
    const delRef = useRef(null);

    useClickOutside(delRef, () => {
        setDel(false);
    });

    return (<>
        {props.action ?
            <div>
                {props.icon === "delete2" ? 
                    <div className={`delete2 ${props.theme ? props.theme : 'light'}`}>Delete</div>
                    :
                    <>
                    {props.icon === 'delete' ?
                        <>
                        {del ? 
                            <Tooltip tooltip={'Are you sure?'} inline={true} position={'top'} offsetY={10} >
                                <i onClick={(e) => {props.action && props.action(e); setDel(false); }}
                                    className={`bi tab-btn bi-question-square-fill ${props.theme ? props.theme : 'light'} question ${props.size && props.size} ${props.disabled && 'disabled'}`}
                                    ref={delRef}
                                    style={props.style} 
                                />
                            </Tooltip>
                            :
                            <Tooltip tooltip={`${props.tip && props.tip}`} inline={true} position={'top'} offsetY={10} >
                                <i className={`bi tab-btn ${props.icon} ${props.theme ? props.theme : 'light'} ${props.size && props.size} ${props.disabled && 'disabled'}`}
                                    onClick={(e) => setDel(true)}
                                    style={props.style} 
                                />
                            </Tooltip>
                        }
                        </>
                        :
                        <Tooltip tooltip={`${props.tip && props.tip}`} inline={true} position={'top'} offsetY={10} >
                            <i className={`bi tab-btn ${props.icon} ${props.theme ? props.theme : 'light'} ${props.size && props.size} ${props.disabled && 'disabled'}`}
                                onClick={(e) => {props.action && props.action(e); e.stopPropagation();}}
                                style={props.style} 
                            />
                        </Tooltip>}
                    </>
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
