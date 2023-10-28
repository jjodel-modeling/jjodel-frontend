import './style.scss'
import React from "react";
import {useStateIfMounted} from "use-state-if-mounted";

interface Props {}
function Helper(props: Props) {
    const [flag, setFlag] = useStateIfMounted(false);

    return(<section className={'helper'} >
        {flag && <div className={'helper-menu border'}>
            <div tabIndex={-1} onClick={e => alert('ok1')} className={'helper-item'}>Test 1</div>
            <div tabIndex={-1} onClick={e => alert('ok2')} className={'helper-item'}>Test 2</div>
            <hr />
            <div tabIndex={-1} onClick={e => setFlag(false)} className={'text-danger helper-item'}>Close</div>
        </div>}
        <div tabIndex={-1} onClick={e => setFlag(!flag)}
             className={'helper-icon bg-dark circle border d-flex justify-content-center align-items-center'}>
            <label style={{cursor: 'pointer'}} className={'text-white'}>?</label>
        </div>
    </section>)
}

export default Helper;
