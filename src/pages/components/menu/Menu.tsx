import React, { useState, useRef, useEffect, MouseEventHandler, ReactNode, ReactHTML } from "react";
import parse from 'html-react-parser';
import "./menu.scss";

type MenuProps = {
    children: any;
    position?: "left"|"right";
};

function getFragment(command: string): any {
    return (
        <React.Fragment>
            {command}
        </React.Fragment>
    );
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

    return(<>
        <div className={'menu-button'} ref={menuRef}>
            {open && <div className={`dropdown ${props.position ? props.position : 'right' }`}>
                {props.children}
            </div>}
            <i onClick={() => setOpen(!open)} className="bi bi-chevron-down"></i>
        </div>      
    </>);
};

export const Divisor = () => {
    return(
        <hr className="my-1" />
    );
};

type ItemType = {
    children: any;
    action?: MouseEventHandler;
    keystroke?: string; 
}

export const Item = (props: ItemType) => {
    return(<>
        {props.action && props.keystroke &&  <div onClick={props.action} className={'item'}>{props.children} <span>{parse(props.keystroke)}</span></div>} 
        {props.action && !props.keystroke &&  <div onClick={props.action} className={'item'}>{props.children}</div>} 
        {!props.action  &&  <div className={'item disabled'}>{props.children}</div>} 
    </>);
}

