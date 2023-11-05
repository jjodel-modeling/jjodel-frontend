import './style.scss'
import React, {useEffect, useRef} from "react";
import {useStateIfMounted} from "use-state-if-mounted";

interface Props {}
function Helper(props: Props) {
    const [iconFlag, setIconFlag] = useStateIfMounted(false);
    const [menuFlag, setMenuFlag] = useStateIfMounted(false);

    return(<section className={'helper'} tabIndex={-1}>
        {(iconFlag || menuFlag) && <div className={'helper-menu border'}
                                        onMouseEnter={e => setMenuFlag(true)} onMouseLeave={e => setMenuFlag(false)}>
            <div tabIndex={-1} onClick={e => alert('ok1')} className={'helper-item'}>Test 1</div>
            <div tabIndex={-1} onClick={e => console.log('ok2')} className={'helper-item'}>Test 2</div>
        </div>}
        <div tabIndex={-1} onClick={e => setIconFlag(!iconFlag)} onBlur={e => setIconFlag(false)}
             className={'bg-dark helper-icon circle border d-flex justify-content-center align-items-center'}>
            <label style={{cursor: 'pointer'}} className={'text-white'}>?</label>
        </div>
    </section>);
}

export default Helper;
