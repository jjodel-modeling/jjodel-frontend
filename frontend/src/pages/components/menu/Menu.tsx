import React, { useState, useRef, useEffect, useLayoutEffect, MouseEventHandler, ReactNode} from "react";
import ReactDOM from "react-dom";

import "./menu.scss";

type MenuProps = {
    children: any;
    position?: "left"|"right";
    style?: React.CSSProperties;
    theme?: "light"
    title?: string;
    trigger?: ReactNode;
};

// Mirrors `top` on .dropdown in menu.scss. Kept in sync by hand: the portalled variant
// is `position: fixed` and cannot inherit it.
const DROPDOWN_TOP_OFFSET = 36;

function getFragment(command: string): any {
    return (<>
            {command}
    </>);
}

function useClickOutside(ref: any, onClickOutside: any, extraRef?: any) {
    useEffect(() => {
      
        function handleClickOutside(event: Event) {
            const inside = (ref.current && ref.current.contains(event.target))
                || (extraRef && extraRef.current && extraRef.current.contains(event.target));
            if (!inside) {
                onClickOutside();
            }
        }

      // Bind
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        // dispose
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [ref, onClickOutside, extraRef]);
  }

export const Menu = (props: MenuProps) => {

    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const portalRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState<{ top: number; left: number; right: number }>(
        { top: 0, left: 0, right: 0 });

    // The portalled dropdown is outside menuRef, so a click on one of its items would
    // read as "outside" and close the menu before the item fires.
    useClickOutside(menuRef, () => {
        setOpen(false);
    }, portalRef);

    // Anchored from the trigger's own rect: once portalled it has no offset parent here.
    useLayoutEffect(() => {
        if (!open || !triggerRef.current) return;
        const place = () => {
            const r = triggerRef.current!.getBoundingClientRect();
            // `top: 36px` is what menu.scss puts on .dropdown relative to .menu-container,
            // whose top edge is the trigger's. Reproduced here rather than replaced by a
            // gap of our choosing: fixed positioning cannot read the container any more,
            // and the committed geometry is the one that was verified (measured: the
            // dropdown opens at y=39, exactly where it did before the portal).
            // Both edges are computed: a `left` dropdown is right-aligned, and anchoring
            // it by `right` avoids having to know its width, which `min-width` makes
            // dynamic.
            setPos({ top: r.top + DROPDOWN_TOP_OFFSET, left: r.left,
                     right: window.innerWidth - r.right });
        };
        place();
        window.addEventListener('resize', place);
        return () => window.removeEventListener('resize', place);
    }, [open]);

    // Custom trigger (like avatar badge) or default chevron
    if (props.trigger) {
        // Portalled onto document.body. Not to escape the navbar: #root is
        // position:fixed (index.scss:31) and therefore a stacking context, while the
        // right rail's overlay is its *sibling* at z-index 900 — so no z-index written
        // inside #root can win, this dropdown's 1000 included. Outside #root the
        // comparison is real. Only this branch is portalled: it has exactly one
        // consumer (Navbar.tsx, the user menu), while the legacy branch below has
        // eleven. See docs/discovery/discovery_2026-08-21_z_index_popup_rail.md.
        return (
            <div className="menu-container" ref={menuRef} style={props.style}>
                <div className="menu-trigger" ref={triggerRef} onClick={() => setOpen(!open)}>
                    {props.trigger}
                </div>
                {open && ReactDOM.createPortal(
                    <div
                        ref={portalRef}
                        className={`dropdown dropdown--portal ${props.position || 'right'}`}
                        style={props.position === 'left'
                            ? { top: pos.top, right: pos.right, left: 'auto' }
                            : { top: pos.top, left: pos.left, right: 'auto' }}
                    >
                        {props.children}
                    </div>,
                    document.body
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
            {!props.title && <i onClick={() => setOpen(!open)} className="bi bi-three-dots-vertical"></i>}
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

