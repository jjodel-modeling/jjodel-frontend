import { useState } from "react";
import logo from '../../../static/img/logo-on.png';
import manatee from '../../../static/img/manatee.png';
import React from "react";
import ReactDOM from "react-dom";

let windoww = window as any;

type Props = {
    type?: 'inline'|'menu';
    ver: string;
    name: string;
    value?: boolean;
};

const message: string = "Manatees are large, fully aquatic, mostly herbivorous marine mammals sometimes known as sea cows.The main causes of death for manatees are human-related issues. As usual, we are the most dangerous animal on earth.";

let doopen: (()=>void) | null = null;
class AboutModal {
    static open() { doopen?.(); }
}

const About = (props: Props) => {
    const [open, setOpen] = useState<boolean>(props.value ? props.value : false);

    const {type, ver, name} = props;
    if (!doopen) doopen = ()=>setOpen(true);

    const AboutRaw = (props: Props) => {
        return(
            <>
                <div className='modal' style={{'position': 'fixed'}}>
                    <div><img src={logo} /></div>
                    <div>v{props.ver} {props.name}</div>
                    <div>
                        {message}
                    </div>
                    <div><img src={manatee} /></div>
                    
                    <button className={'close'} onClick={() => setOpen(!open)}>close</button>
                    {open ? <About ver={'1.0'} name={'Jjodel'} type={'menu'} value={true}/> : null}
                </div>
            </>
        );
    }

    return (
        <>
            {props.type !== 'menu' && <span className={'about'} onClick={(e) => setOpen(!open)}>Jjodel v{props.ver} <i className="bi bi-globe-americas"></i> {props.name}</span>}
            {open  && <AboutRaw ver={ver} name={name} />}
        </>

    );
};


export {About, AboutModal};
