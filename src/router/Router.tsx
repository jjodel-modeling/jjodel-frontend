import {BrowserRouter, Route, Routes} from 'react-router-dom';
import App from '../App';
import CollaborativeAttacher from "../components/collaborative/CollaborativeAttacher";

function Router() {

    return(<BrowserRouter>
        <Routes>
            <Route path={''} element={<App />} />
            <Route path={'jjodel'} element={<App />} />
            <Route path={'rooms/:id'} element={<CollaborativeAttacher />} />
            <Route path={'*'} element={<b>404: Not Found</b>} />
        </Routes>
    </BrowserRouter>);
}

export default Router;
