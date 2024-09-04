import React, {useState} from "react";
import { LProject } from "../../../joiner";
import { Menu, Item } from "../menu/Menu";
import { Project } from "../Project";

import colors from '../../../static/img/colors.png';
import { icon } from "../icons/Icons";
import "./catalog.scss"


type ChildrenType = {
    projects?: any;
    children?: any;
};

const Catalog = (props: ChildrenType) => {

    const [filters, setFilters] = useState([true,true,true]);
    const [mode, setMode] = useState<string>("cards");

    const Header = (props: ChildrenType) => {
        return (
            <div className='row catalog-header'>
                {props.children}
            </div>
        );
    }

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
                <span>sorted by</span>
                <Menu position={'left'}>
                    <Item action={(e)=> {alert('')}}>Alphabetical</Item>
                    <Item>Date created</Item>
                    <Item>Last modified</Item>
                </Menu>
                <div className={'view-icons'}>
                    <i onClick={(e) => setMode('cards')} className={`bi bi-grid ${mode === "cards" && 'selected'}`}></i>
                    <i onClick={(e) => setMode('list')} className={`bi bi-list ${mode === "list" && 'selected'}`}></i>
                </div>
            </div>
        </>);
    }

    const CatalogSide = (props: ChildrenType) => {
        return (
            <div className={'catalog'}>
                {props.children}
            </div>
        );
    }

    const CatalogInfoCard = (props: any) => {
        return (
            <div className={'details'}>
                {props.projects ?
                    <>
                        <h5>Your projects</h5>
                        <p>You developed <strong>{props.projects.length}</strong> projects with an overall number of 12 artifacts.</p>
                        <img src={colors} width={220} />
                    </>
                :
                    <>
                        <h5>No projects so far</h5>
                        <img src={colors} width={220} />
                    </>
                }
            </div>
        );
    }

    type CatalogType = {
        projects: LProject[];
    }

    const CatalogReport = (props: CatalogType) => {

        let items_public: LProject[] = [];
        let items_private: LProject[] = [];
        let items_collaborative: LProject[] = [];


        if (filters[0]) {
            items_public = props.projects.filter(p => p.type === "public");
        }
        if (filters[1]) {
            items_private = props.projects.filter(p => p.type === "private");
        }
        if (filters[2]) {
            items_collaborative = props.projects.filter(p => p.type === "collaborative");
        }

        //var items  = items_public.concat(items_private,items_collaborative);

        var items = props.projects.filter(p =>
            (filters[0] && p.type ==="public" || filters[1] && p.type ==="private" || filters[2] && p.type ==="collaborative" || !filters[0] && !filters[1] && !filters[2]));

        return (

            mode == "cards" ?

                /* cards mode */

                <div className={'card-holder'}>

                    {items.length === 0 && <div className={"fallback-message"}><span>
                        Sorry, there are no results matching your search criteria. Please try again with different filters.
                    </span></div>}

                    {
                        props.projects.map((p,i) => <>
                            {filters[0] && p.type === "public" && <Project index={i} key={p.id} data={p} mode={mode} />}
                            {filters[1] && p.type === "private" && <Project index={i}  key={p.id} data={p} mode={mode} />}
                            {filters[2] && p.type === "collaborative" && <Project index={i}  key={p.id} data={p} mode={mode} />}
                            {!filters[0] && !filters[1] && !filters[2] && <Project index={i}  key={p.id} data={p} mode={mode} />}
                        </>)
                    }

                </div>

            :
                /* list mode */

                <div className={'row project-list'}>
                    <div className='row header'>
                    <div className={'col-sm-1'} style={{width: '30px'}}></div><div className={'col-sm-1'}></div><div className={'col-sm-5'}>Name</div><div className={'col-3'}>Last modified</div><div className={'col-2'}>Created</div>
                    </div>
                    {
                        props.projects.map(p => <>
                            {filters[0] && p.type === "public" && <Project key={p.id} data={p} mode={mode} />}
                            {filters[1] && p.type === "private" && <Project key={p.id} data={p} mode={mode} />}
                            {filters[2] && p.type === "collaborative" && <Project key={p.id} data={p} mode={mode} />}
                            {!filters[0] && !filters[1] && !filters[2] && <Project key={p.id} data={p} mode={mode} />}
                        </>)
                    }
                </div>

        );
    };

    return (
        <>
            <Header>
                <CatalogFilters />
                <CatalogMode />
            </Header>
            <CatalogSide>
                <CatalogInfoCard projects={props.projects}/>
                <CatalogReport projects={props.projects}/>
            </CatalogSide>
        </>
    );
}

export {Catalog}
