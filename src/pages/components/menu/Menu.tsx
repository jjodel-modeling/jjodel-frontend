import React, { useState, useRef, useEffect, MouseEventHandler, ReactNode, ReactHTML } from "react";
import parse from 'html-react-parser';
import "./menu.scss";

type MenuProps = {
    children: any;
    position?: "left"|"right";
    style?: React.CSSProperties;
    theme?: "light"
    title?: string;
};

function getFragment(command: string): any {
    return (<>
            {command}
    </>);
}

function useClickOutside(ref: any, onClickOutside: any) {
    useEffect(() => {
      
        function handleClickOutside(event: Event) {
            if (ref.current && !ref.current.contains(event.target)) {
                onClickOutside();
            }
        }

      // Bind
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        // dispose
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [ref, onClickOutside]);
  }

export const Menu = (props: MenuProps) => {

    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);

    useClickOutside(menuRef, () => {
        setOpen(false);
    });

    // const my_style = (props.style ? props.style : {border: '1px solid blue'} );
    return(<>
        {props.title && <span onClick={(e) => {e.preventDefault();setOpen(!open);}} className={"top-level"}>{props.title}</span>}
        <div className={`menu-button ${props.title && 'no-display'}`} ref={menuRef}  style={props.style}>
            {open && <div className={`dropdown ${props.position ? props.position : 'right' }`}>
                {props.children}
            </div>}
            {!props.title && <i onClick={() => setOpen(!open)} className="bi bi-chevron-down" style={{fontSize: '10px!important'}}></i>}
        </div>      
    </>);
};

export const Divisor = () => {
    return(
        <hr className="my-1 divisor" />
    );
};

type ItemType = {
    icon?: any;
    children: any;
    action?: MouseEventHandler;
    keystroke?: string; 
    
}

export const Item = (props: ItemType) => {

    return(<>
        {props.action && props.keystroke &&  
            <div onClick={props.action} className={'item'}>
                {props.icon ? 
                    props.icon 
                    : 
                    <i className="bi bi-app hidden"></i>
                } 
                {props.children} <span>{parse(props.keystroke)}</span>
            </div>
        } 
        {props.action && !props.keystroke &&  
            <div onClick={props.action} className={'item'}>
                {props.icon ? 
                    props.icon 
                : 
                    <i className="bi bi-app hidden"></i>
                } 
                {props.children}
            </div>
        } 
        {!props.action && 
            <div className={'item disabled'}>
                {props.icon ? 
                    props.icon
                : 
                    <i className="bi bi-app hidden"></i>
                } 
                {props.children}
            </div>
        } 
    </>);
}

