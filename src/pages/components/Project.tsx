import {DProject, DUser, LProject, U} from '../../joiner';
import Banner1 from '../../static/banner/1.png'
import React from 'react';
import {ProjectsApi} from '../../api/persistance';
import {useNavigate} from 'react-router-dom';

type Props = {data: LProject};
function Project(props: Props) {
    const {data} = props;
    const navigate = useNavigate();

    const selectProject = () => {
        navigate(`/project?id=${data.id}`);
        U.refresh();
    }
    const exportProject = async() => {
        U.download(`${data.name}.jjodel`, JSON.stringify(data.__raw));
    }
    const deleteProject = async() => {
        await ProjectsApi.delete(data);
    }

    return(<div className={'project-card p-1 m-1'}>
        <img className={'rounded'} alt={`Project's image`} src={Banner1} style={{height: '12em'}} />
        <div style={{position: 'absolute', top: 10, right: 5}} className={'d-flex'}>
            <button className={'btn btn-primary'} onClick={e => selectProject()}>
                <i className={'p-1 bi bi-eye-fill'} />
            </button>
            <button className={'mx-1 btn btn-primary'}
                    onClick={async e => await exportProject()}>
                <i className={'p-1 bi bi-download'} />
            </button>
            <button disabled={data.author.id !== DUser.current} className={'btn btn-danger me-2'}
                    onClick={async e => await deleteProject()}>
                <i className={'p-1 bi bi-trash-fill'} />
            </button>
        </div>

        <div className={'p-2'}>
            <b className={'d-block'}>{data.name}</b>
            <label className={'d-block'}>Edited 10 hours ago</label>
        </div>
    </div>)
}

export default Project;
