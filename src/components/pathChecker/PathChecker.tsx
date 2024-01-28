import {useLocation} from "react-router-dom";
import {useEffect, useState} from "react";
import {U} from '../../joiner';

function PathChecker() {
    const {pathname} = useLocation();
    const [renders, setRenders] = useState(0);

    useEffect(() => {
        const newRenders = renders + 1;
        if(newRenders > 1) {U.refresh();}
        setRenders(newRenders);
    }, [pathname]);


    return(<div className={'d-none'}>{renders}</div>)
}

export default PathChecker;
