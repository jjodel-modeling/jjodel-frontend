import React, {MouseEventHandler, ClassAttributes, useState, useRef, useEffect, ReactElement, ReactNode} from "react";
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
        | "open"
        | "edit"
        | "favorite"
        | "shrink"
        | "expand"
        | "space"
        | "minispace"
        | "sep"
        | "check"
        | "copy"
        | "close"
        | "info"
        | "show"
        | "open-down"
        | "close-up"
        | "settings"
        | "download";

    tip?: string | ReactNode;
    label?: string;
    theme?: "dark" | "light",
    action?: MouseEventHandler,
    size?: "x-small" | "small" | "medium" | "large",
    style?: React.CSSProperties,
    mode?: 'normal' | 'negative'
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

    const mode = (props.mode ? props.mode : 'normal');

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
                                <i onClick={(e) => {props.action && props.action(e); setDel(false); e.stopPropagation()}}
                                    className={`bi tab-btn bi-question-square-fill commandbar-btn ${props.theme ? props.theme : 'light'} question ${props.size && props.size} ${props.disabled && 'disabled'}`}
                                    ref={delRef}
                                    style={props.style}
                                />
                            </Tooltip>
                            :
                            <Tooltip tooltip={`${props.tip && props.tip}`} inline={true} position={'top'} offsetY={10} >
                                <i className={`bi tab-btn ${props.icon} commandbar-btn ${props.theme ? props.theme : 'light'} ${props.size && props.size} ${props.disabled && 'disabled'}`}
                                    onClick={(e) => {setDel(true);e.stopPropagation();}}
                                    style={props.style}
                                />
                            </Tooltip>
                        }
                        </>
                        :
                        <Tooltip tooltip={`${props.tip && props.tip}`} inline={true} position={'top'} offsetY={10} >
                            <i className={`bi tab-btn ${props.icon} commandbar-btn ${props.theme ? props.theme : 'light'} ${props.size && props.size} ${props.mode} ${props.disabled && 'disabled'}`}
                                onClick={(e) => {props.action && props.action(e); e.stopPropagation();}}
                                style={props.style}
                            />
                        </Tooltip>
                    }
                    </>
                }

            </div>
        :
            <>
                {props.icon === "space" || props.icon === "minispace" ?
                    <span style={{display: 'block', width: `${props.icon === 'space' ? '24px' : '4px'}`}}></span>
                :

                <Tooltip tooltip={'Disabled'} inline={true} position={'top'} offsetY={10} >
                    <i className={`bi disabled tab-btn ${props.icon} commandbar-btn ${props.theme ? props.theme : 'light'} ${props.size && props.size} ${props.mode}`}
                    style={props.style}
                />
            </Tooltip>
                }
            </>
        }
    </>);
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
