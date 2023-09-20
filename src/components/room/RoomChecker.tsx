import {useParams} from 'react-router-dom';
import {useEffectOnce} from "usehooks-ts";
import {CONSTRAINT, Firebase} from "../../firebase";
import {useStateIfMounted} from "use-state-if-mounted";
import App from "../../App";
import RoomAttacher from "./RoomAttacher";
import {SetRootFieldAction} from "../../redux/action/action";
import {SaveManager} from "../topbar/SaveManager";

function RoomChecker() {
    const {id} = useParams();
    const [validCode, setValidCode] = useStateIfMounted(false);

    useEffectOnce(() => {
        SetRootFieldAction.new('isLoading', true);
        const constraint: CONSTRAINT = {field: 'code', operator: '==', value: id};
        Firebase.select('rooms', constraint).then((results) => {
            if(results.length) {
                const result = results[0];
                if(result.state) SaveManager.load(result.state)
                SetRootFieldAction.new('room', id); setValidCode(true);
            }
            SetRootFieldAction.new('isLoading', false);
        });
    })

    if(validCode) return(<>
        <App room={id} />
        <RoomAttacher />
    </>);
    return(<div>Invalid code</div>)
}

export default RoomChecker;
