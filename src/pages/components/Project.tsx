import {DUser, LProject, U, bool} from '../../joiner';
import Banner1 from '../../static/banner/1.png';
import React, { useState, useRef, useEffect, Ref } from "react";

import { ProjectsApi } from '../../api/persistance';
import { useNavigate } from 'react-router-dom';
import { Item, Divisor, Menu } from './menu/Menu';

import card from '../../static/img/card.png';
import { icon } from './icons/Icons';


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

    // const [favorite, setFavorite] = useState(false);

    const toggleFavorite = (project: LProject) => {
        project.favorite = !project.favorite;
    }; 
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

    var sectionStyle = {
        backgroundImage: `url(${card}),
        backgroundSize: 'contain'`
   
     }

    function ProjectCard(props: Props): JSX.Element {

        type MeterProps = {
            project: LProject
        }

        const Meter = (props: MeterProps) => {

            var length = props.project.metamodels.length + props.project.models.length + props.project.viewpoints.length;
            var unit = Math.round(90/length);
            var mm_length = Math.round(90/length*props.project.metamodels.length);
            var m_length = Math.round(90/length*props.project.models.length);
            var vp_length = Math.round(90/length*props.project.viewpoints.length);
            return (<>
                <div className={'meter'} style={{width: '90%'}}>
                    {props.project.viewpoints.map((m,i) => <div className={'artifact viewpoints'} style={{width: `${unit}%`}}>{i == props.project.viewpoints.length-1 && <span>VP</span>}</div>)}
                    {props.project.models.map((m,i) => <div className={'artifact models'} style={{width: `${unit}%`}}>{i == props.project.models.length-1 && <span>M1</span>}</div>)}
                    {props.project.metamodels.map((m,i) => <div className={'artifact metamodels'} style={{width: `${unit}%`}}>{i == props.project.metamodels.length-1 && <span>M2</span>}</div>)}

                    {/* <div className={'artifact viewpoints'} style={{width: `${vp_length}%`}}><span>VP</span></div>
                    <div className={'artifact models'} style={{width: `${m_length}%`}}><span>M1</span></div>
            <div className={'artifact metamodels'} style={{width: `${mm_length}%`}}><span>M2</span></div>*/}
                </div>
             </>);
        };

        return (<>
        
            <div className={'project-card'}>
                <div style={{position: 'absolute', top: 10, right: 5}} className={'d-flex'}>
                {/* 
                
                <button disabled={data.author.id !== DUser.current} className={'btn btn-danger me-2'}
                        onClick={async e => await deleteProject()}>
                    <i className={'p-1 bi bi-trash-fill'} />
    </button>*/}
                    {data.favorite ? <i onClick={(e) => toggleFavorite(data)} className="bi bi-star-fill"></i> : <i onClick={(e) => toggleFavorite(data)} className="bi bi-star"></i>}
                    <Menu>
                            <Item icon={icon['new']} keystroke={'<i class="bi bi-command"></i>'} action={e => selectProject()}>Open</Item>
                            <Item icon={icon['duplicate']}>Duplicate</Item>
                            <Item icon={icon['download']} action={e => exportProject()}>Download</Item>
                            <Divisor />
                            <Item icon={icon['favorite']} action={(e => toggleFavorite(data))}>Add to favorites</Item>
                            <Item icon={icon['share']}>Share</Item>
                            <Divisor />
                            <Item icon={icon['delete']} action={async e => await deleteProject()}>Delete</Item>
                    </Menu>
                </div>
                <div className='header'>
                    <h5 className={'d-block'}>{data.name}</h5>
                    <label className={'d-block'}><i className="bi bi-clock"></i> Edited 10 hours ago</label>
                </div>
                
                <Meter project={data}></Meter>
                
                <div className={'tag'}>
                    <div>
                        {/* <i className="bi bi-files"></i> {props.data.metamodels.length} metamodel(s), {props.data.models.length} model(s)<br/> 
                        <i className="bi bi-file-code"></i> {props.data.viewpoints.length-1} viewpoint(s)*/}
                    </div>
                </div>
            </div>
        
        
        </>);
    }

    
    /* LIST */

    function ProjectList(props: Props): JSX.Element {
        return (<>
            <div className="row data">
                <div className={'col-sm-1'} style={{width: '30px'}}>
                    <Menu position='right'>
                        <Item icon={<i className="bi bi-plus-square"></i>} action={e => selectProject()}>Open</Item>
                        <Item icon={<i className="bi bi-files"></i>}>Duplicate</Item>
                        <Item  icon={<i className="bi bi-download"></i>} action={e => exportProject()}>Download</Item>
                        <Divisor />
                        <Item icon={<i className="bi bi-star"></i>}  action={(e => toggleFavorite(data))}>Add to favorites</Item>
                        <Item icon={<i className="bi bi-share"></i>}>Share</Item>
                        <Divisor />
                        <Item icon={<i className="bi bi-trash3"></i>} action={async e => await deleteProject()}>Delete</Item>
                    </Menu> 
                </div>
                <div className={'col-sm-1'}>
                    {data.favorite ? <i style={{float: 'left'}} onClick={(e) => toggleFavorite(data)} className="bi bi-star-fill"></i> : <i style={{float: 'left'}} onClick={(e) => toggleFavorite(data)} className="bi bi-star"></i>}
                    &nbsp;
                    {data.type === "public" && <i className="bi bi-unlock"></i>}
                    {data.type === "private" && <i className="bi bi-lock"></i>}
                    {data.type === "collaborative" && <i className="bi bi-diagram-3"></i>}

                    
                </div>
                <div className={'col-5 name'}>{data.name}</div>
                <div className={'col-3'}>13 days ago</div>
                <div className={'col-2'}>July 13, 2024</div>  
            </div>  
        </>);
    }


    return(<>
        {props.mode === "cards" ?
            <ProjectCard index={props.index} key={props.key} data={props.data} /> :
            <ProjectList index={props.index}  key={props.key} data={props.data} />
        }
    </>);
}

export {Project};
