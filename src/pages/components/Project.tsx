import {DUser, LProject, U, bool} from '../../joiner';
import Banner1 from '../../static/banner/1.png';
import React, { useState, useRef, useEffect, Ref } from "react";



import { ProjectsApi } from '../../api/persistance';
import { useNavigate } from 'react-router-dom';
import { Item, Divisor, Menu } from './menu/Menu';

type Props = {data: LProject};

function Project(props: Props): JSX.Element {
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

    return(<div className={'project-card m-3 p-2'}>
        
        <div style={{position: 'absolute', top: 10, right: 5}} className={'d-flex'}>
            {/* 
            
            <button disabled={data.author.id !== DUser.current} className={'btn btn-danger me-2'}
                    onClick={async e => await deleteProject()}>
                <i className={'p-1 bi bi-trash-fill'} />
</button>*/}
            
            <Menu>
                    <Item keystroke={'<i class="bi bi-command"></i> O'} action={e => selectProject()}>Open</Item>
                    <Item>Duplicate</Item>
                    <Item action={e => exportProject()}>Download</Item>
                    <Divisor />
                    <Item>Share</Item>
                    <Divisor />
                    <Item action={async e => await deleteProject()}>Delete</Item>
            </Menu>
        </div>

        <div className={'p-2'}>
            <h5 className={'d-block'}>{data.name}</h5>
            <label className={'d-block'}>Edited 10 hours ago</label>
        </div>

        <div className={'p-2'}>
            <div className={'tag'}><i className="bi bi-folder"></i>Artifacts: Metamodels ({data.metamodels.length})/Models {data.models.length}</div>
        </div>
        

    </div>)
}

export {Project};
