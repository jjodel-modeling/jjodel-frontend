import {Defaults, Dictionary, DocString, Pointer, Pointers, store} from '../../joiner';
import {Constructors, DProject, LProject, R, U} from '../../joiner';
import React, {JSX} from "react";

import {ProjectsApi} from '../../api/persistance';
import {Divisor, Item, Menu} from './menu/Menu';

import {icon} from './icons/Icons';
import {Btn, CommandBar, Sep} from '../../components/commandbar/CommandBar';
import { Tooltip } from '../../components/forEndUser/Tooltip';
import {compressToUTF16} from "async-lz-string";

/**
 * Generates a consistent color based on project name using a hash function
 * @param name - Project name to hash
 * @returns HSL color string with good saturation and lightness for preview area
 */
function getProjectColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        const char = name.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    // Use hash to generate hue (0-360), with fixed saturation and lightness for pleasant colors
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 75%)`;
}

function formatDate(lastModified: number){
    
    let timeago = Date.now() - lastModified;
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

    return Math.round(timeago) + ' ' + timeunit + ' ago';
}


type Props = {
    data: LProject;
    mode?: string;
    key: any;
    pnames: Dictionary<string, LProject>;
};
type PropsCard = {
    data: LProject;
    mode?: string;
    key: any;
    pnames: Dictionary<string, LProject>;
};
type PropsList = {
    data: LProject;
    mode?: string;
    key: any;
    pnames: Dictionary<string, LProject>;
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

export async function downloadDuplicate(project: DProject, pnames: Dictionary<string, any>): Promise<void> {
    project = await duplicateProject(project, pnames);
    U.download(`${project.name}.jjodel`, JSON.stringify(project));
}

export async function duplicateProject(project: DProject, pnames?: Dictionary<string, any>): Promise<DProject> {
    project = {...project} as any;
    let oldID = project.id;
    project.id = Constructors.makeID();

    if (project.name.indexOf('copy') === -1) project.name += ' copy';

    let projectNames: Dictionary<DocString<'name'>, Pointer>;
    if (pnames) projectNames = pnames;
    else {
        let state = store.getState();
        projectNames = {};
        for (let ptr of state.projects) {
            let p = state.idlookup[ptr];
            if (!p) continue;
            projectNames[p.name||''] = ptr;
        }
    }
    project.name = U.increaseEndingNumber(project.name, false, false, (str)=> { return !!projectNames[str]; })


    const state = JSON.parse(await U.decompressState(project.state));
    state.idlookup[oldID].id = project.id;
    state.idlookup[oldID].name = project.name;
    state.idlookup[project.id] = state.idlookup[oldID];
    delete state.idlookup[oldID];
    let str = JSON.stringify(state);
    str = U.replaceAll(str, oldID, project.id);
    let oldGUID = (project as any)._Id;
    if (oldGUID) {
        project._Id = '';
        str = U.replaceAll(str, oldGUID, '');
    }

    let renewAllIDs = true;
    if (renewAllIDs) {
        for (let id in state.idlookup){
            if (id === project.id || !Pointers.isPointer(id) || Defaults.check(id)) continue;
            str = U.replaceAll(str, id, Constructors.makeID());
        }
    }
    project.state = await compressToUTF16(str);
    state.idlookup[project.id] = {...project, state: ''} as any;
    return project;
}

function Project(props: Props): JSX.Element {
    const {data} = props;

    const toggleFavorite = async(project: LProject) => {
        await ProjectsApi.favorite(project.__raw as DProject);
    };

    const selectProject = (repair: boolean = false) => {
        R.navigate(`/project?id=${data.id}`+(repair ? '&repair=1' : ''), true);
        //U.resetState();
    }

    const exportProject = async() => {
        // await ProjectsApi.save(data);
        U.download(`${data.name}.jjodel`, JSON.stringify(data.__raw));
    }
    const deleteProject = async() => {
        data.delete();
    }

    // Type icon using Bootstrap Icons only
    const typeIcon = (type: string) => {
        switch(type){
            case 'public':
                return <i className="bi bi-unlock type-icon" />;
            case 'private':
                return <i className="bi bi-lock type-icon" />;
            case 'collaborative':
                return <i className="bi bi-people type-icon" />;
            default:
                return null;
        }
    }

    /* CARDS */

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

    function ProjectCard(props: PropsCard): JSX.Element {


        function multiplicity(n: number, none: string, one: string, many: string){
            if (n <= 0) return none;
            if (n === 1) return n + ' ' + one;
            if (n > 1) return n + ' ' + many;
        }

        function getClickedElement(e: any){
            if (e.target.className === 'bi bi-star-fill' || e.target.className === 'bi bi-star' || e.target.className === 'bi bi-chevron-down' || e.target.className === 'item') {
                return;
            } else {
                selectProject(false);
            }
        }

        const previewColor = getProjectColor(data.name || 'Unnamed');

        return (
            <Tooltip tooltip={`${props.data.type} project with ${multiplicity(props.data.metamodelsNumber,'no metamodels', 'metamodel', 'metamodels')},
                ${multiplicity(props.data.modelsNumber,'no models', 'model', 'models')},
                ${multiplicity(props.data.viewpointsNumber -2, 'no (custom) viewpoints', '(custom) viewpoint', '(custom) viewpoints')}` } position={'top'} offsetY={10} theme={'dark'} inline>
                <div className={`project-card-v2 ${data.type}`} onClick={e => getClickedElement(e)}>
                    {/* Preview Area with dynamic color */}
                    <div className="card-preview" style={{ backgroundColor: previewColor }}>
                        <i className="bi bi-folder preview-icon" />
                    </div>

                    {/* Card Actions - Favorite + Menu */}
                    <div className="project-actions">
                        {data.isFavorite ?
                            <i onClick={(e) => toggleFavorite(data)} className="bi bi-star-fill" /> :
                            <i onClick={(e) => toggleFavorite(data)} className="bi bi-star" />
                        }
                        <Menu>
                            <Item icon={icon['new']} action={e => {selectProject()}}>Open</Item>
                            <Item icon={icon['download']} action={e => exportProject()}>Download</Item>
                            <Item icon={icon['tools']} action={e => selectProject(true)}>Repair & open</Item>
                            <Divisor />
                            <Item icon={icon['favorite']} action={(e => toggleFavorite(data))}>{!data.isFavorite ? 'Add to favorites' : 'Remove from favorites'}</Item>
                            <Divisor />
                            <Item icon={icon['delete']} action={async e => await deleteProject()}>Delete</Item>
                        </Menu>
                    </div>

                    {/* Card Content */}
                    <div className='card-content'>
                        <h5 onClick={e => selectProject(false)}>{data.name}</h5>
                        <p className={'description'}>{data.description}</p>
                    </div>

                    {/* Card Footer - Meta info */}
                    <div className={'card-footer'}>
                        <div className='date'>
                            <i className="bi bi-clock-history" />
                            {formatDate(data.lastModified)}
                        </div>
                        <div className={'type'}>
                            {data.type === 'public' && <i className="bi bi-unlock type-icon" />}
                            {data.type === 'private' && <i className="bi bi-lock type-icon" />}
                            {data.type === 'collaborative' && <i className="bi bi-people type-icon" />}
                        </div>
                    </div>
                </div>
            </Tooltip>);
        }


    /* LIST */

    function ProjectList(props: PropsList): JSX.Element {

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


        function timeConverter(UNIX_timestamp: number){
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
        }

        return (<>
            <div className="row data">

                <div style={{paddingLeft: '15px'}} className={'col-4'} onClick={()=> {selectProject()}}>{data.name}</div>
                <div className={'col-1'} onClick={()=> {selectProject()}}>{typeIcon(data.type)}</div>
                <div className={'col-3'} onClick={()=> {selectProject()}}>{timeConverter(data.creation+0)}</div>
                <div className={'col-2'} onClick={()=> {selectProject()}}>{Math.floor(timeago)} {timeunit} ago</div>
                <div className={'col-2'}>
                    <CommandBar noBorder={true} style={{marginBottom: '0'}}>
                        <Btn icon={'favorite'} action={(e => toggleFavorite(data))} tip={!data.isFavorite ? 'Add to favorites' : 'Remove from favorites'} />
                        <Btn icon={'minispace'} />
                        <Btn icon={'bi-tools'} action={e => selectProject(true)} tip={'Repair & open'}/>
                        <Btn icon={'minispace'} />
                        <Btn icon={'download'} action={e => exportProject()} tip={'Download project'}/>
                        <Btn icon={'copy'} action={e => downloadDuplicate(data.__raw as DProject, props.pnames)} tip={'Download a duplicate'}/>
                        <Sep />
                        <Btn icon={'delete'} action={async e => await deleteProject()} tip={'Delete project'}/>
                    </CommandBar>
                </div>
            </div>
        </>);
    }


    return(<>
        {props.mode === "cards" ?
            <ProjectCard key={props.key} data={props.data} pnames={props.pnames} /> :
            <ProjectList key={props.key} data={props.data} pnames={props.pnames} />
        }
    </>);
}

export {Project};
