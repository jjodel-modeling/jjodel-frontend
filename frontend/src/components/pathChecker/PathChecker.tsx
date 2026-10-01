import {useLocation} from "react-router-dom";
import {useEffect, useState} from "react";
import {U} from "../../joiner";
import {openKey} from "./openKey";

type Props = {};
function PathChecker(props: Props) {
    const {pathname, search} = useLocation();
    const [renders, setRenders] = useState(0);

    // A change of page resets, and on /project so does a change of project id (P-2026-09-25-1440).
    useEffect(() => {
        const newRenders = renders + 1;
        if(/*pathname === '/project' && */newRenders > 1) U.resetState();
        setRenders(newRenders);
    }, [openKey(pathname, search)]);

    return(<></>);
}

export default PathChecker;
