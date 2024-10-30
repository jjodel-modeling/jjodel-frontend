import {Try} from "../components/forEndUser/Try";
import {Dashboard} from "./components";
import {useState} from "react";
import {DProject, DUser, SetRootFieldAction} from "../joiner";
import {useEffectOnce} from "usehooks-ts";
import {AdminApi} from "../api/persistance";

type Props = {};
function ProjectsInfoPage(props: Props) {
    const [projects, setProjects] = useState<DProject[]>([]);
    useEffectOnce(() => {
        (async function() {
            SetRootFieldAction.new('isLoading', true);
            setProjects(await AdminApi.projects());
            SetRootFieldAction.new('isLoading', false);
        })();
    });

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
