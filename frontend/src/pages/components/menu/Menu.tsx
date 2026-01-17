import React, { useState, useRef, useEffect, MouseEventHandler, ReactNode} from "react";

import "./menu.scss";

type MenuProps = {
    children: any;
    position?: "left"|"right";
    style?: React.CSSProperties;
    theme?: "light"
    title?: string;
    trigger?: ReactNode;
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

    // Custom trigger (like avatar badge) or default chevron
    if (props.trigger) {
        return (
            <div className="menu-container" ref={menuRef} style={props.style}>
                <div className="menu-trigger" onClick={() => setOpen(!open)}>
                    {props.trigger}
                </div>
                {open && (
                    <div className={`dropdown ${props.position || 'right'}`}>
                        {props.children}
                    </div>
                )}
            </div>
        );
    }

    // Legacy mode with title or chevron
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
    disabled?: boolean;
    
}

export const Item = (props: ItemType) => {
    return(
        <div onClick={props.action} className={'item' + (props.disabled ? ' disabled' : '')}
             style={props.disabled ? {'--accent-disabled':'var(--color-lighter)', color: 'var(--bg-3-1) !important'} as any : {}}>
            {props.icon ? props.icon : <i className="bi bi-app hidden"/>}
            {props.children}
            {props.keystroke ? <>{" "}<span className="keystroke">{(props.keystroke)}</span></> : null}
        </div>)
}

type UserHeaderType = {
    name: string;
    email?: string;
}

export const UserHeader = (props: UserHeaderType) => {
    return (
        <div className="user-header">
            <div className="user-name">{props.name}</div>
            {props.email && <div className="user-email">{props.email}</div>}
        </div>
    );
}

type SubMenuItemType = {
    icon?: any;
    children: any;
    action?: () => void;
    active?: boolean;
}

type SubMenuType = {
    icon?: any;
    label: string;
    children: ReactNode;
}

export const SubMenuItem = (props: SubMenuItemType) => {
    return (
        <div onClick={props.action} className={'submenu-item' + (props.active ? ' active' : '')}>
            {props.icon && props.icon}
            <span>{props.children}</span>
            {props.active && <i className="bi bi-check2 submenu-check" />}
        </div>
    );
}

export const SubMenu = (props: SubMenuType) => {
    return (
        <div className="item has-submenu">
            {props.icon ? props.icon : <i className="bi bi-app hidden"/>}
            <span>{props.label}</span>
            <div className="submenu">
                {props.children}
            </div>
        </div>
    );
}

