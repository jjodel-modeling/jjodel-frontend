import {Dictionary, Try, windoww} from '../joiner';
import {Dashboard} from './components';

import {Cards, Card} from './components/cards/Cards';
import {Catalog} from './components/catalog/Catalog';
import {ReactNode, useState} from "react";

type keys = 'fix' | 'newbug' | 'opt' | 'feat' | 'info';

class InfoEntry {
    constructor(public title: ReactNode, public content: ReactNode) {
    }
}

class Version {
    static all: Version[] = [];
    entries: Dictionary<keys, InfoEntry[]>;
    minorEntries: Dictionary<keys, InfoEntry[]>;
    _minor: boolean;

    constructor(number: string, name: string, data: string) {
        this.entries = {fix: [], newbug: [], opt: [], feat: [], info: []};
        this.minorEntries = {fix: [], newbug: [], opt: [], feat: [], info: []};
        this._minor = false;
        Version.all.push(this);
    }

    add(key: keys, title: ReactNode, node: ReactNode = null): this {
        this.entries[key].push(new InfoEntry(title, node));
        return this;
    }

    fix(title: ReactNode, node: ReactNode = null): this {
        this.add('fix', title, node);
        return this;
    }

    newbug(title: ReactNode, node: ReactNode = null): this {
        this.add('newbug', title, node);
        return this;
    }

    opt(title: ReactNode, node: ReactNode = null): this {
        this.add('opt', title, node);
        return this;
    }

    feat(title: ReactNode, node: ReactNode = null): this {
        this.add('feat', title, node);
        return this;
    }

    engine(title: ReactNode, node: ReactNode = null): this {
        this.add('feat', title, node);
        return this;
    }

    info(title: ReactNode, node: ReactNode = null): this {
        this.add('info', title, node);
        return this;
    }

    minor(): this {
        this._minor = true;
        return this;
    }
}

let warnicon = <i className="bi bi-exclamation-triangle-fill"/>
// <i className="bi bi-exclamation-diamond-fill" />;
// <i className="bi bi-exclamation-square-fill" />;

function versionsetup() {
    new Version('2.2', 'manatee', '13/nov/2024')
        .newbug(<>{warnicon} Edges</>, <>Some update were made on edge's internal behaviour, old saves might have side effects.
            If edges are not behaving properly create a new project, copy the default model's JSX and paste it in the old project.
            <br/>To enable edits on default views right-click on the jjodel logo at the top-center of the page.
            <br/>On custom views try to make start and end point to vertexes (draggable items) instead of fields (inline items).</>)
        .feat('console tips', 'When hovering a console output or suggested keys a tooltip will show documentation.')
        .fix('delete viewpoints', 'But cannot delete the active viewpoint.') // what if i delete a non-exclusive vp?
        .fix('delete models')
        .fix('containment & parent', 'Containment references were inconsistently updating the .parent property of contained elements.')
        .feat('model dependencies', <>Models can now "depend" on other models in a extend-like style. if A depends on B
            (A→B), A can use concepts from B.
            <br/>Dependency chains (A→B→C) and loops (A→B, B→A) are also supported
            <br/>Cross-reference activation is required too.</>)
        .feat('cross-Reference', <>Cross-reference can be activated for: classes (inheritance), features (type).<br/>
            To reduce cluttering in the options, normally you can only reference concepts in the same model.<br/>
            If Cross-Reference is enabled you can reference valid concepts from all model dependencies.
        </>)
        .feat('context-menu containment', <>The option to add containment objects has been expanded, it is now available
            to individual features too.</>)
        .engine('validTargets', <>Can be used to create custom DSL and filtered to restrict model transformations, it
            provides a list of valid targets for:
            <ul>
                <li>class extension</li>
                <li>parameter, operation and m2-feature type</li>
                <li>m1-values</li>
                <li>model-dependencies</li>
            </ul>
        </>)
        .minor()
        .feat('U.clickedOutside()',
            <>Utility for interactive graphs: When a click is detected outside the first parameter (HTMLElement or Event), it triggers a callback function in the first parameter.
                <br/>
                Example: {"<div onClick={(evt)=>{data.$active=true; U.clickedOutside(evt, ()=>data.$active=false)}} ></div>"} where
                data is a m1-object holding a boolean feature "active"
                {warnicon} To ensure the node is properly updated, remember to add "Listed dependencies" accordingly to
                the value edited in the view.
                <br/>In this example you need the dependency "active = data.$active" or equivalent ones.
                <br/>Without it the value would update immediately but the graphical representation would always be 1 state behind.
            </>)
        .fix('structure editor', 'The layout was occasionally breaking')
}

function UpdatesPage(): JSX.Element {
    // NB: this works only in production if you put subfolders with past builds in the new build root.
    let [info, setInfo] = useState(true);
    let [feat, setFeat] = useState(true);
    let [fix, setFix] = useState(true);
    let [newbug, setNewbug] = useState(true);
    let [opt, setOpt] = useState(false);
    let cards: ReactNode =
        <Cards>
            <Cards.Item
                title={'Getting started'}
                subtitle={'Create your first notation.'}
                icon={'gettingstarted'}
                style={'rainbow'}
            />
            {true && <Cards.Item icon={'question'} style={'clear'} title={'Ehy!'}
                                 subtitle={'What do you want to do today?'}/>}
        </Cards>;
    cards = null;
    versionsetup();

    return (<Try>
        <Dashboard active={'Updates'} version={{n: 0, date: 'fake-date'}}>
            <div id={'updates-page'}>{cards}
                <h2>Past versions
                    <select className={'ms-2'}
                            onChange={(e) => windoww.location = (window.location.origin + e.target.value) as any}>
                        <option value='/jjodel/2.2' title={'13/nov/2024'}>2.2</option>
                        <option value='/jjodel/2.1' disabled>2.1</option>
                        <option value='/jjodel/2.0' disabled>2.0</option>
                    </select>
                </h2>
                <div className={'filter-container'}>
                    <button className={'feat btn-' + (feat ? '' : 'outline-') + 'info'}
                            onClick={e => setFix(!feat)}>Feature
                    </button>
                    <button className={'fix btn-' + (newbug ? '' : 'outline-') + 'success'}
                            onClick={e => setFix(!fix)}>Bugfix
                    </button>
                    <button className={'newbug btn-' + (newbug ? '' : 'outline-') + 'danger'}
                            onClick={e => setNewbug(!newbug)}>New known bug
                    </button>
                    <button className={'info btn-' + (info ? '' : 'outline-') + 'secondary'}
                            onClick={e => setInfo(!info)}>Information
                    </button>
                    <button className={'opt btn-' + (opt ? '' : 'outline-') + 'warning'}
                            onClick={e => setInfo(!opt)}>Optimization
                    </button>
                </div>
                <ul className={'version-list'}>
                    <li className={'version'}>
                        <h2 className={'version-name'}>2.2 manatee (11/nov/2024)</h2>
                        <ul className={'entry-list'}>
                            <li className={'entry'}></li>

                        </ul>
                    </li>

                </ul>
            </div>
        </Dashboard>
    </Try>)
        ;
}

export {UpdatesPage};
