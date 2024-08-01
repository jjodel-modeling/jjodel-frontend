import {DUser, LProject, U, bool} from '../../joiner';
import Banner1 from '../../static/banner/1.png';
import React, { useState, useRef, useEffect, Ref } from "react";

import { ProjectsApi } from '../../api/persistance';
import { useNavigate } from 'react-router-dom';
import { Item, Divisor, Menu } from './menu/Menu';

import card_bg from '../../static/img/card-bg.png';

type Props = {
    data: LProject;
    mode?: string;
    key: any;
};

type ProjectTypeType = {
    type: string;
}

function ProjectType(props: ProjectTypeType){
    return (<>
        {props.type === "public" && <i className="bi bi-unlock"></i>}
        {props.type === "private" && <i className="bi bi-lock"></i>}
        {props.type === "collaborative" && <i className="bi bi-diagram-3"></i>}
    </>);
}


function Project(props: Props): JSX.Element {
    const {data} = props;
    const navigate = useNavigate();

    const [favorite, setFavorite] = useState(false);

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

    /* CARDS */

    function ProjectCard(props: Props): JSX.Element {
        return (<>

            <div className={'project-card'}>
                <div style={{position: 'absolute', top: 10, right: 5}} className={'d-flex'}>
                {/*

                <button disabled={data.author.id !== DUser.current} className={'btn btn-danger me-2'}
                        onClick={async e => await deleteProject()}>
                    <i className={'p-1 bi bi-trash-fill'} />
    </button>*/}
                    {favorite ? <i onClick={(e) => setFavorite(false)} className="bi bi-star-fill"></i> : <i onClick={(e) => setFavorite(true)} className="bi bi-star"></i>}
                    <Menu>
                            <Item keystroke={'<i class="bi bi-command"></i>'} action={e => selectProject()}>Open</Item>
                            <Item>Duplicate</Item>
                            <Item action={e => exportProject()}>Download</Item>
                            <Divisor />
                            <Item action={(e => setFavorite(!favorite))}>Add to favotites</Item>
                            <Item>Share</Item>
                            <Divisor />
                            <Item action={async e => await deleteProject()}>Delete</Item>
                    </Menu>
                </div>
                <div className='header'>
                    <h5 className={'d-block'}>{data.name}</h5>
                    <label className={'d-block'}><i className="bi bi-clock"></i> Edited 10 hours ago</label>
                </div>
                <div className={'tag'}>
                    <div>
                        <i className="bi bi-files"></i> {props.data.metamodels.length} metamodel(s), {props.data.models.length} model(s)<br/>
                        <i className="bi bi-file-code"></i> {props.data.viewpoints.length-1} viewpoint(s)
                    </div>
                </div>
            </div>


        </>);
    }


    /* LIST */

    function ProjectList(props: Props): JSX.Element {
        return (<>
            <div className="row data">
                <div className={'col'}>
                    <Menu position='right'>
                        <Item keystroke={'<i class="bi bi-command"></i>'} action={e => selectProject()}>Open</Item>
                        <Item action={(e => props.data.duplicate())}>Duplicate</Item>
                        <Item action={e => exportProject()}>Download</Item>
                        <Divisor />
                        <Item action={(e => setFavorite(!favorite))}>Add to favotites</Item>
                        <Item>Share</Item>
                        <Divisor />
                        <Item action={async e => await deleteProject()}>Delete</Item>
                    </Menu>
                </div>
                <div className={'col w-20'}>
                {data.type === "public" && <i className="bi bi-unlock"></i>}
        {data.type === "private" && <i className="bi bi-lock"></i>}
        {data.type === "collaborative" && <i className="bi bi-diagram-3"></i>}
                    {favorite ? <i style={{float: 'left'}} onClick={(e) => setFavorite(false)} className="bi bi-star-fill"></i> : <i style={{float: 'left'}} onClick={(e) => setFavorite(true)} className="bi bi-star"></i>}

                </div>
                <div className={'col-5 name'}>{data.name}</div>
                <div className={'col-2'}>13 days ago</div>
                <div className={'col-2'}>July 13, 2024</div>
            </div>
        </>);
    }










    return(<>
        {props.mode === "cards" ?
            <ProjectCard key={props.key} data={props.data} /> :
            <ProjectList key={props.key} data={props.data} />
        }
    </>);
}

export {Project};
