import React, { useState, useRef, useEffect, MouseEventHandler, ReactNode} from "react";
import "./modal.scss";

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


type ModalProps = {
    id: string;
    title?:string;
    subtitle?:string;
    icon?: string;
};

export const Modal = (props: ModalProps) => {

    const [open, setOpen] = useState(false);
    const modalRef = useRef(null);

    useClickOutside(modalRef, () => {
        setOpen(false);
    });

    return(<>
        <div className={'modal-container w-100 h-100'}>
            <div className={'modal'} ref={modalRef}>
                {props.title && <h1>{props.icon && <i className={`bi ${props.icon}`}></i>} {props.title}</h1>}
                {props.subtitle && <h2>{props.title}</h2>}
                
            </div>
        </div>      
    </>);
};


