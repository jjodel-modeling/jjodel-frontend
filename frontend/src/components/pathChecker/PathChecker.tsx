import {useLocation} from "react-router-dom";
import {useEffect, useState} from "react";
import {U} from "../../joiner";

type Props = {};
function PathChecker(props: Props) {
    const {pathname} = useLocation();
    const [renders, setRenders] = useState(0);

    useEffect(() => {
        const newRenders = renders + 1;
        if(/*pathname === '/project' && */newRenders > 1) U.resetState();
        setRenders(newRenders);
    }, [pathname]);

    return(<></>);
}

export default PathChecker;
