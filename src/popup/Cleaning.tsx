import './style.scss';
import {Oval} from "react-loader-spinner";
import React from "react";

function Cleaning() {
    return(<div className={'popup-container'}>
        <div className={'popup'}>
            <label className={'d-block text-center mt-3'}>
                <b style={{color: '#475e6c'}}>CLEANING...</b>
                <Oval height={60} width={60} wrapperStyle={{justifyContent: 'center'}} wrapperClass={'mt-5'}
                      color={'#475e6c'} secondaryColor={'#ff8811'} />
            </label>
        </div>
    </div>);
}

export default Cleaning;
