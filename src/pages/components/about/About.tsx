import { useState } from "react";
import logo from '../../../static/img/logo-on.png';
import manatee from '../../../static/img/manatee.png';

type Props = {
    type?: 'inline'|'menu';
    ver: string;
    name: string;
};

const About = (props: Props) => {

    const [open, setOpen] = useState<boolean>(false);

    // <i className="bi bi-globe-americas"></i> 

    return (
        <>
            <span className={'about'} onClick={(e) => setOpen(!open)}>Jjodel v{props.ver} <i className="bi bi-globe-americas"></i> {props.name}</span>
            {open && 
                <>
                    <div className='modal-container'></div>
                    <div className='modal'>
                        <div><img src={logo} /></div>
                        <div>
                            Manatees are large, fully aquatic, mostly herbivorous marine mammals sometimes known as sea cows. 
                            The main causes of death for manatees are human-related issues. As usual, we are the most dangerous animal on earth.
                        </div>
                        <div><img src={manatee} /></div>
                        
                        <button className={'close'} onClick={() => setOpen(!open)}>close</button>
                    </div>
                </>
            }
        </>

    );
};

export {About};