import Logo from '../../static/img/logo.png';
import {ProjectsApi} from '../../api/persistance';
import {useNavigate} from 'react-router-dom';
import {SetRootFieldAction} from '../../redux/action/action';
import {U} from '../../joiner';

type Props = {};
function Navbar(props: Props) {
    const navigate = useNavigate();

    const createProject = async() => {
        navigate('/allProjects');
        SetRootFieldAction.new('isLoading', true);
        await U.sleep(1);
        await ProjectsApi.create('public', 'Unnamed Project');
        SetRootFieldAction.new('isLoading', false);
    }

    return(<div className={'d-flex bg-white border border-start-0 border-end-0 border-light-subtle'}>
        <img style={{height: '5em'}} alt={'JJodel Logo'} src={Logo}></img>
        <button className={'ms-auto btn btn-light'}>
            <i className={'bi bi-person-fill'} />
            <label className={'ms-1'}>1</label>
        </button>
        <button className={'mx-2 btn btn-light'}>
            <label>Invite Member</label>
        </button>
        <button className={'me-1 btn btn-primary'} onClick={e => createProject()}>
            <label>New Project</label>
        </button>
    </div>)
}

export default Navbar;
