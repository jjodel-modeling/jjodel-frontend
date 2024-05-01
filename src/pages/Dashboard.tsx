import {ReactNode} from 'react';
import Navbar from "./components/Navbar";
import LeftBar from "./components/LeftBar";
import './style.scss'

type Props = {children?: ReactNode};
function Dashboard(props: Props) {
    const {children} = props;
    return(<>
        <Navbar />
        <LeftBar />
        <div style={{marginLeft: '12%'}} className={'p-2'}>
            {children}
        </div>
    </>);
}

export default Dashboard;

