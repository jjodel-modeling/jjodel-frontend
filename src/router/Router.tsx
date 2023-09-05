import {BrowserRouter , Routes, Route} from 'react-router-dom';
import RoomChecker from "../components/room/RoomChecker";
import App from "../App";

function Router() {
    const root = 'jodel-react/'

    return(<BrowserRouter>
        <Routes>
            <Route path={''} element={<App />} />
            <Route path={root} element={<App />} />
            <Route path={root + 'room/:id'} element={<RoomChecker />} />
            <Route path={'*'} element={<b>404: Not Found</b>} />
        </Routes>
    </BrowserRouter>);
}

export default Router;
