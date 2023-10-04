import {BrowserRouter , Routes, Route} from 'react-router-dom';
import RoomChecker from '../components/room/RoomChecker';
import App from '../App';

function Router() {

    return(<BrowserRouter>
        <Routes>
            <Route path={''} element={<App />} />
            <Route path={'jjodel'} element={<App />} />
            <Route path={'jodel-react/'} element={<App />} />
            <Route path={'jodel-react/build/'} element={<App />} />
            <Route path={'room/:id'} element={<RoomChecker />} />
            <Route path={'*'} element={<b>404: Not Found</b>} />
        </Routes>
    </BrowserRouter>);
}

export default Router;
