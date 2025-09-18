import React, {useState} from "react";
import {type Dictionary, LProject} from "../../../joiner";
import { Menu, Item } from "../menu/Menu";
import { Project } from "../Project";

import colors111 from '../../../static/img/colors-111.png';

import { icon } from "../icons/Icons";
import "./catalog.scss"
import _ from "lodash";

export const CatalogInfoCard = (props: any) => {
    return (
        <div className={'details'}>
            {props.projects ?
                <>
                    <h5>Your projects</h5>
                    <p>You developed <strong>{props.projects.length}</strong> projects{false && ' with an overall number of 12 artifacts'}.</p>
                    <img src={colors111} width={220} />
                </>
                :
                <>
                    <h5>No projects so far. Are you new to Jjodel? why not exploring the Getting Started section?</h5>
                    <img src={colors111} width={220} />
                </>
            }
        </div>
    );
}
type ChildrenType = {
    projects?: any;
    children?: any;
};


const Catalog = (props: ChildrenType) => {

    const [filters, setFilters] = useState([true,true,true]);
    const [mode, setMode] = useState<string>("cards");

    const [sortingMode, setSortingMode] = useState<string>("modified")///("alphabetical");

    const CatalogFilters = () => {

        function toggleFilters(el: 0|1|2) {
            switch(el) {
                case 0:
                    setFilters([!filters[0], filters[1], filters[2]]);
                    break;
                case 1:
                    setFilters([filters[0], !filters[1], filters[2]]);
                    break;
                case 2:
                    setFilters([filters[0], filters[1], !filters[2]]);
                    break;
            }
        };

        return (
            <div className={'left'}>
                {filters[0] ? <button onClick={(e) => toggleFilters(0)} className='active'>public</button> : <button onClick={(e) => toggleFilters(0)}>public</button>}
                {filters[1] ? <button onClick={(e) => toggleFilters(1)} className='active'>private</button> : <button onClick={(e) => toggleFilters(1)}>private</button>}
                {filters[2] ? <button onClick={(e) => toggleFilters(2)} className='active'>collaborative</button> : <button onClick={(e) => toggleFilters(2)} >collaborative</button>}
            </div>
        );
    }

    const CatalogMode = () => {
        return (<>
            <div className={'right'}>
                <span>sorted by <span style={{paddingLeft: '6px'}}>{icon[sortingMode]} </span></span>
                <Menu position={'left'}>
                    <Item icon={icon['alphabetical']} action={(e)=> {setSortingMode('alphabetical')}}>Alphabetical {sortingMode === 'alphabetical' && <i style={{float: 'right'}} className="bi bi-check-lg"></i>}</Item>
                    <Item icon={icon['created']} action={(e)=> {setSortingMode('created')}}>Date created {sortingMode === 'created' && <i style={{float: 'right'}} className="bi bi-check-lg"></i>}</Item>
                    <Item icon={icon['modified']} action={(e)=> {setSortingMode('modified')}}>Last modified {sortingMode === 'modified' && <i style={{float: 'right'}} className="bi bi-check-lg"></i>}</Item>
                </Menu>
                <div className={'view-icons'}>
                    <i onClick={(e) => setMode('cards')} className={`bi bi-grid ${mode === "cards" && 'selected'}`}></i>
                    <i onClick={(e) => setMode('list')} className={`bi bi-list ${mode === "list" && 'selected'}`}></i>
                </div>
            </div>
        </>);
    }




    type CatalogType = {
        projects: LProject[];
    }

    const CatalogReport = (props: CatalogType) => {


        var items = props.projects
            .filter(p =>
                (filters[0] && p.type ==="public" || filters[1] && p.type ==="private" || filters[2] && p.type ==="collaborative" || !filters[0] && !filters[1] && !filters[2]));
        
        var sorted = items;
        var iteratees: ((obj: LProject) => any) | string = 'created';


        let projectNames: Dictionary<string, LProject> = {};
        for (let p of props.projects) {
            if (!p) continue;
            projectNames[p.name] = p;
        }

        switch(sortingMode) {
            case "alphabetical":
                sorted = _.sortBy(items, 'name');
                break;
            case "created":
                iteratees = (obj: LProject) => -new Date(obj.creation).getTime();
                sorted = _.sortBy(items, iteratees);
                break;
            case "modified":
                iteratees = (obj: LProject) => -new Date(obj.lastModified).getTime();
                sorted = _.sortBy(items, iteratees);
                break;
        }

        return (

            mode == "cards" ?

                /* cards mode */

                <div className={'card-holder'}>

                    {items.length === 0 && <div className={"fallback-message"}><span>
                        Sorry, there are no results matching your search criteria. Please try again with different filters.
                    </span></div>}

                    {
                        sorted.map((p,i) => <Project key={i} data={p} mode={mode} pnames={projectNames} />)
                    }

                </div>

            :
                /* list mode */

                <div className={'row project-list'}>
                    <div className='row header'>
                        <div className={'col-4'}>Name</div>
                        <div className={'col-1'}>Type</div>
                        <div className={'col-3'}>Created</div>
                        <div className={'col-2'}>Last modified</div>
                        <div className={'col-2'}>Operation</div>
                    </div>
                    {
                        sorted.map(p => <>
                            {filters[0] && p.type === "public" && <Project key={p.id} data={p} mode={mode} pnames={projectNames} />}
                            {filters[1] && p.type === "private" && <Project key={p.id} data={p} mode={mode} pnames={projectNames} />}
                            {filters[2] && p.type === "collaborative" && <Project key={p.id} data={p} mode={mode} pnames={projectNames} />}
                            {!filters[0] && !filters[1] && !filters[2] && <Project key={p.id} data={p} mode={mode} pnames={projectNames} />}
                        </>)
                    }
                </div>

        );
    };

    return (
        <>
            <div className='row catalog-header'>
                <CatalogFilters/>
                <CatalogMode/>
            </div>
            <div className={'catalog'}>
                <CatalogInfoCard projects={props.projects}/>
                <CatalogReport projects={props.projects}/>
            </div>
        </>
    );
}

export {Catalog}
