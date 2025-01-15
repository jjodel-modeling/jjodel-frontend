import {DProject, LProject, U} from '../../joiner';
import React from "react";

import {ProjectsApi} from '../../api/persistance';
import {useNavigate} from 'react-router-dom';
import {Divisor, Item, Menu} from './menu/Menu';

import card from '../../static/img/card.png';
import {icon} from './icons/Icons';
import {Btn, CommandBar, Sep} from '../../components/commandbar/CommandBar';
import { int } from '../../joiner/types';

import { 
    VscLock as Lock,
    VscUnlock as UnLock,
    VscBroadcast as Share
} from "react-icons/vsc";

import { SlShare as Share2 } from "react-icons/sl";
import { Tooltip } from '../../components/forEndUser/Tooltip';



type Props = {
    data: LProject;
    mode?: string;
    key: any;
    index?: number; // a che serve? si può togliere?
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

    const toggleFavorite = async(project: LProject) => {
        await ProjectsApi.favorite(project.__raw as DProject);
    };
    const selectProject = () => {
        navigate(`/project?id=${data.id}`);
        U.resetState();
    }
    const exportProject = async() => {
        // await ProjectsApi.save(data);
        U.download(`${data.name}.jjodel`, JSON.stringify(data.__raw));
    }
    const deleteProject = async() => {
        await ProjectsApi.delete(data);
    }

    /* CARDS */

    var sectionStyle = {
        backgroundImage: `url(${card})`,
        backgroundSize: 'contain'
     }

    type ProjectProps = {
        project: LProject
    }

    const Empty = (props: ProjectProps) => {
        return (<>
            {props.project.metamodelsNumber == 0 && props.project.modelsNumber == 0 && <><i title="empty project" className="bi bi-exclamation-circle"></i> <span>Empty</span></>}
            {/* {props.project.metamodels.length == 0 && props.project.models.length != 0 && <i style={{float: 'left'}} title="no models" className="bi bi-circle-half"></i>}
            {props.project.metamodels.length != 0 && props.project.models.length != 0 && <i style={{float: 'left'}} title="artifacts present" className="bi bi-circle-fill"></i>}*/}
        </>);
    }

    function ProjectCard(props: Props): JSX.Element {


        const Meter = (props: ProjectProps) => {

            const length = props.project.metamodelsNumber + props.project.modelsNumber + props.project.viewpointsNumber;
            const unit = Math.round(90/length);
            const mm_length = Math.round(90/length*props.project.metamodelsNumber);
            const m_length = Math.round(90/length*props.project.modelsNumber);
            const vp_length = Math.round(90/length*props.project.viewpointsNumber);
            return (<>

                    <div className={'meter'} style={{width: '90%'}}>
                        {Array.from(Array(props.project.viewpointsNumber)).map((m,i) => <div className={'artifact viewpoints'} style={{width: `${unit}%`}}>{i == props.project.viewpointsNumber - 1 && <span>VP</span>}</div>)}
                        {Array.from(Array(props.project.modelsNumber)).map((m,i) => <div className={'artifact models'} style={{width: `${unit}%`}}>{i == props.project.modelsNumber - 1 && <span>M1</span>}</div>)}
                        {Array.from(Array(props.project.metamodelsNumber)).map((m,i) => <div className={'artifact metamodels'} style={{width: `${unit}%`}}>{i == props.project.metamodelsNumber - 1 && <span>M2</span>}</div>)}
                    </div>

             </>);
        };

        return (<>

            <div className={'project-card'}>
                <div className="project-actions d-flex" style={{position: 'absolute', top: 10, right: 5}}>
                    {data.isFavorite ? <i onClick={(e) => toggleFavorite(data)} className="bi bi-star-fill" />
                        :
                        <i onClick={(e) => toggleFavorite(data)} className="bi bi-star" />
                    }
                    
                    <Menu>
                            <Item icon={icon['new']} keystroke={'<i class="bi bi-command"></i>'} action={e => selectProject()}>Open</Item>
                            <Item icon={icon['duplicate']}>Duplicate</Item>
                            <Item icon={icon['download']} action={e => exportProject()}>Download</Item>
                            <Divisor />
                            <Item icon={icon['favorite']} action={(e => toggleFavorite(data))}>{!data.isFavorite ? 'Add to favorites' : 'Remove from favorites'}</Item>
                            <Divisor />
                            <Item icon={icon['delete']} action={async e => await deleteProject()}>Delete</Item>
                    </Menu>
                </div>
                <div className='header'>
                    <h5 className={'d-block'} style={{cursor: 'pointer'}} onClick={e => selectProject()}>
                        {data.name}
                    </h5>
                    <label className={'d-block'}>
                        {data.type === 'public' && <Tooltip tooltip={'Public Project'} inline={true} position={'top'} offsetY={10}><UnLock style={{fontSize: '1.5em', marginBottom: '2px', marginRight: '8px', padding: '1.5px', borderRadius: '2px', border: '0px solid var(--color)', backgroundColor: '#B5C6E0', color: 'white' }}/></Tooltip>}
                        {data.type === 'private' && <Tooltip tooltip={'Private Project'} inline={true} position={'top'} offsetY={10}><Lock style={{fontSize: '1.5em', marginBottom: '2px', marginRight: '8px', padding: '1.5px', borderRadius: '2px', border: '0px solid var(--color)', backgroundColor: '#B5C6E0', color: 'white' }}/></Tooltip>} 
                        {data.type === 'collaborative' && <Tooltip tooltip={'Collaborative Project'} inline={true} position={'top'} offsetY={10}><Share2 style={{fontSize: '1.5em', marginBottom: '2px', marginRight: '8px', padding: '3px', borderRadius: '2px', border: '0px solid var(--color)', backgroundColor: '#B5C6E0', color: 'white' }}/></Tooltip>} 
                        <i className="bi bi-clock"></i> Edited {Math.floor((data.lastModified - data.creation) / (3600 * 1000))} hours ago
                        <Empty project={props.data}/>
                    </label>
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

        let timeago = Date.now() - data.lastModified;
        let timeunit: string;
        let sec = 1000;
        let min = sec*60;
        let hr = min*60;
        let day = hr*24;
        let week = day*7;
        let month = day*24;
        let year = day*365;
        if (timeago < min) { timeago /= sec; timeunit = 'seconds'; }
        else if (timeago >= min && timeago < hr) { timeago /= min; timeunit = 'minutes'; }
        else if (timeago >= hr && timeago < day) { timeago /= hr; timeunit = 'hours'; }
        else if (timeago >= day && timeago < week) { timeago /= day; timeunit = 'days'; }
        else if (timeago >= week && timeago < month) { timeago /= week; timeunit = 'weeks'; }
        else if (timeago >= month && timeago < year) { timeago /= month; timeunit = 'months'; }
        else { timeago/= min; timeunit = 'years'; }


        function timeConverter(UNIX_timestamp: int){
            var a = new Date(UNIX_timestamp);
            
            const formattedDate2 = a.toISOString();

            const formattedDate = new Intl.DateTimeFormat('en-US', {
                day: '2-digit',
                month: 'short', // "long" for full month name
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                //second: '2-digit',
                //fractionalSecondDigits: 3, // Includes milliseconds
                //timeZone: 'UTC', // Optional, set the timezone
              }).format(a);

            return formattedDate;



            
            // var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            // var year = a.getFullYear();
            // var month = months[a.getMonth()];
            // var date = a.getDate();
            // var hour = a.getHours();
            // var min = a.getMinutes();
            // var sec = a.getSeconds();
            // var time = month + ' '+ date +', ' + year + ' ' + hour + ':' + min ;
            // return time;
        }
        return (<>
            <div className="row data">
                {/* <div className={'col-sm-1'} style={{width: '30px'}}>
                    <Menu position='right'>
                        <Item icon={<i className="bi bi-plus-square"></i>} action={e => selectProject()}>Open</Item>
                        <Item icon={<i className="bi bi-files"></i>} action={(e => props.data.duplicate())}>Duplicate</Item>
                        <Item  icon={<i className="bi bi-download"></i>} action={e => exportProject()}>Download</Item>
                        <Divisor />
                        <Item icon={<i className="bi bi-star"></i>}  action={(e => toggleFavorite(data))}>Add to favorites</Item>
                        <Item icon={<i className="bi bi-share"></i>}>Share</Item>
                        <Divisor />
                        <Item icon={<i className="bi bi-trash3"></i>} action={async e => await deleteProject()}>Delete</Item>
                    </Menu>
                </div>
                <div className={'col-sm-1'}>
                    {data.favorite ?
                        <i style={{float: 'left'}} onClick={(e) => toggleFavorite(data)} className="bi bi-star-fill"></i> :
                        <i style={{float: 'left'}} onClick={(e) => toggleFavorite(data)} className="bi bi-star"></i>}
                    &nbsp;
                    {data.type === "public" && <i className="bi bi-unlock"></i>}
                    {data.type === "private" && <i className="bi bi-lock"></i>}
                    {data.type === "collaborative" && <i className="bi bi-diagram-3"></i>}


                </div> */}
                <div className={'col-3'} onClick={()=> {selectProject()}}>{data.name}</div>
                <div className={'col-1'}>{data.type}</div>
                <div className={'col-3'}>{timeConverter(data.creation+0)}</div>
                <div className={'col-2'}>{Math.floor(timeago)} {timeunit} ago</div>
                <div className={'col-3'}>
                    <CommandBar noBorder={true} style={{marginBottom: '0'}}>
                        <Btn icon={'favorite'} action={(e => toggleFavorite(data))} tip={!data.isFavorite ? 'Add to favorites' : 'Remove from favorites'} />
                        <Btn icon={'minispace'} />
                        <Btn icon={'copy'} action={e => props.data.duplicate()} tip={'Duplicate project'}/>
                        <Btn icon={'minispace'} />
                        <Btn icon={'download'} action={e => exportProject()} tip={'Download project'}/>
                        <Sep />
                        <Btn icon={'delete'} action={async e => await deleteProject()} tip={'Delete project'}/>
                    </CommandBar>
                </div>
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
