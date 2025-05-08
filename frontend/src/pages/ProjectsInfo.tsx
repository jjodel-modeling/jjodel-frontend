import {Try} from "../components/forEndUser/Try";
import {Dashboard} from "./components";
import {useEffect, useState} from "react";
import {DProject, DUser, SetRootFieldAction} from "../joiner";


type Props = {};
function ProjectsInfoPage(props: Props) {
    const [projects, setProjects] = useState<DProject[]>([]);
    useEffect(() => {
        (async function() {
            SetRootFieldAction.new('isLoading', true);
            SetRootFieldAction.new('isLoading', false);
        })();
    }, []);

    return(<Try>
        <Dashboard active={'UsersInfo'} version={{n: 0, date:'fake-date'}}>
            <div>
                Projects: {projects.length}
                {projects.map(p => <div key={p.id}>
                    {p.name} (State: {p.state.length}, M2: {p.metamodelsNumber}, M1: {p.modelsNumber}, VP: {p.viewpointsNumber})
                </div>)}
            </div>
        </Dashboard>
    </Try>);
}

export {ProjectsInfoPage};
