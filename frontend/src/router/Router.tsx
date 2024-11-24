import {BrowserRouter, Route, Routes} from 'react-router-dom';
import App from '../App';
import CollaborativeAttacher from "../components/collaborative/CollaborativeAttacher";

function Router() {

    return(<div>Nope</div>);
    /*
    return(<BrowserRouter>
        <Routes>
            <Route path={''} element={<App />} />
            <Route path={'jjodel'} element={<App />} />
            <Route path="jodel-react/build" element={<App />} />
            <Route path="jodel-react" element={<App />}>
                <Route path="" element={<App />} />
                <Route path="build" element={<App />} />
            </Route>
            <Route path={'rooms/:id'} element={<CollaborativeAttacher />} />
            <Route path={'*'} element={<App />} />
        </Routes>
    </BrowserRouter>);
    */
}

export default Router;
