import React, {Dispatch, PureComponent, ReactNode} from "react";
import {connect} from "react-redux";
import {DockContext, DockLayout, DropDirection, PanelData, TabData} from "rc-dock";
import "rc-dock/dist/rc-dock.css";
import './docking.scss';
import {LayoutBase} from "rc-dock/lib/DockData";
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import {
    CreateElementAction,
    DGraph,
    DModel,
    IStore,
    Log,
    Pointer,
    Selectors,
    store,
    TRANSACTION,
    windoww,
} from "../../joiner";
import {DefaultNode} from "../../joiner/components";
import StyleEditor from "../rightbar/styleEditor/StyleEditor";


//const StyleEditor = windoww.tempcomponents.StyleEditor;

//Giordano: why this stuff is in joiner ? these components cannot be access by the user
//const StyleEditor = windoww.components.StyleEditor;
//const ViewsEditor = windoww.components.ViewsEditor;
const MySwal = withReactContent(Swal);

// private
interface ThisState {
    listAllStateVariables: boolean,
}
type LayoutData = any;

let count = 0;

function newTab0() {
    return {
        id: `newtab${++count}`,
        title: 'New Tab',
        group: 'graph card ghostone addable',
        content: (
            <div>
                <p>newTab</p>
            </div>),
    };
}


function newTab(modelid0?: Pointer<DModel, 1, 1>, name?: string, gid?: Pointer<DGraph, 1, 1>, model?: DModel): TabData {
    let ret: TabData = {} as any;
    let modelid = modelid0;
    if (!modelid) modelid = store.getState().models[0] as string;
    if (!gid) gid = store.getState().graphs[0] as string;
    //temporary issue todo: nello store c'è modello ma non c'è graph
    console.log('newtab', {gid, model, modelid, modelid0, graphs:[...store.getState().graphs]});
    return {
        id: `newtab${++count}`,
        title: <span>{name || 'Graph ' + count}</span>,
        group: 'graph card ghostone addable',
        closable: true,
        cached: true,
        minHeight: undefined,
        minWidth: undefined,
        content: (
            <>{modelid ?
            <div>
                <h1>Model name: {name}</h1>
                <DefaultNode data={modelid} nodeid={gid} graphid={gid} />
                {/*<span>Edit Section</span>
                <Graph data={modelid} nodeid={gid+'_'+2} graphid={gid+'_'+2} view = {Selectors.getByName(DViewElement, 'EditView')?.id as string} />
                <span>Graph end</span>*/}.
            </div> : <span>No models found</span>
            }</>
        )
    };
}
async function addButtonClick(e: React.MouseEvent<HTMLElement>, context: DockContext, panelData: PanelData): Promise<void> {// Promise<SweetAlertResult>
    /*const { value: url } = await Swal.fire({
        input: 'url',
        inputLabel: 'URL address',
        inputPlaceholder: 'Enter the URL'
    })*/
/*
    if (url) {
        Swal.fire(`Entered URL: ${url}`)
    }*/
    const {value: modelName} = await MySwal.fire({
        title: <span>Make a graph for which model?</span>,
        input: 'text',
        inputLabel: 'Model name',
        inputAttributes: {autocapitalize: 'off', placeholder: "New model", list: 'model-datalist'},
        showCancelButton: true,
        confirmButtonText: 'Add',
        showLoaderOnConfirm: true,
        preConfirm: (mpid: string) => {
            return mpid;
            /*
                return fetch(`//api.github.com/users/${login}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(response.statusText)
                        }
                        return response.json()
                    })
                    .catch(error => {
                        Swal.showValidationMessage(
                            `Request failed: ${error}`
                        )
                    })*/
        },
        allowOutsideClick: () => !MySwal.isLoading()
    })/*.then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                title: `${result.value.login}'s avatar`,
                imageUrl: result.value.avatar_url
            })
        }
    })*/
    createOrOpenModelTab(modelName, context, panelData);
}

export function createOrOpenModelTab(modelName: string, context0?: DockContext, panelData0?: PanelData): void {
    if (!modelName) return;

    let context: DockContext = context0 || windoww.lastDockContext;
    let panelData: PanelData = panelData0 || windoww.lastDockPanelData;
    console.log('createOrOpenModelTab0', {context0 , wcontext: windoww.lastDockContext, panelData, wpanel: windoww.lastDockPanelData});
    let model: DModel = Selectors.getModel(modelName, false, false) as DModel;
    let graph: DGraph;
    graph = DGraph.new(model.id);
    const graphid = graph.id; // getGraphID();
    console.log('createOrOpenModelTab', {context, panelData});
    /*let isGraphOpen = (gid: string): boolean => { return false; } // todo
    let getGraphID = (): string => {
        Log.exDev(!model?.id, 'failed to createGraphID, model.id is null', {model, modelid: model.id, modelName});
        console.log(!model?.id, 'dgraph.makeid', {DGraph, wdg: windoww.DGraph});
        return U.increaseEndingNumber(DGraph.makeID(model.id), false, false, isGraphOpen); }*/

    if (model as any) {
        console.log('createTab1:', {model, modelName, graphid});
        context.dockMove(newTab(model.id, modelName, graphid, model), panelData, 'middle');
        return; }

    model = DModel.new(modelName);
    TRANSACTION(
        () => {
            // model._transient.currentView = LViewElement.findViewFor(model).id;
            CreateElementAction.new(model);
            CreateElementAction.new(graph);
        }
    );
    console.log('createTab2:', {model, modelName, graphid});
    Log.exDev(!graphid, 'failed to createGraphID', {model, modelName, graphid});
    context.dockMove(newTab(model.id, modelName, graphid, model), panelData, 'middle');
}

// todo: permetti commenti con riferimenti, riferimenti che non siano diretti ma query-like e permetti di mettere reference query-like anche dentro le reference ver fuori dai commenti che verranno risolte a run-time, es: eisLinkedWithMe = (me, otherclass) => me.getVertexPos().center().subtract(otherClass.getVertexPos().center()).absolute().lessthan(sogliavicinanza) per assegnare reference agli elementi vicini.

let groups = {
    headless: {
        // the css class for this would be dock-panel-headless
        // this is a pre-defined style, defined here:
        // https://github.com/ticlo/rc-dock/blob/master/style/predefined-panels.less
        floatable: true,
        maximizable: true,
    },
    // 'card custom': {
    'graph card ghostone addable': {
        // the css class for this would be dock-panel-custom
        // this is a custom panel style defined in panel-style.html
        floatable: true,
        maximizable: true,
        panelExtra: (panelData: PanelData, context: DockContext) => {
            windoww.lastDockContext = context;
            windoww.lastDockPanelData = panelData; // temp workaround to programmatically create a tab
            return (<div className={"my-panel-extra-container"}>
                <span className='my-panel-extra-btn dock-panel-max-btn'
                      onClick={() => context.dockMove(panelData, null, 'maximize')}>
                  {/*panelData.parent?.mode === 'maximize' ? '▬' : '▣'*/}
                </span>
                <span className='my-panel-extra-btn dock-panel-add-btn'
                      onClick={(e) => addButtonClick(e, context, panelData)}>
                    {/*onClick={() => context.dockMove(panelData, null, 'remove')}> */}
                    +
                </span>
                <button className='my-panel-extra-btn dock-panel-add-btn' style={{display: 'none'}}
                        onClick={() => context.dockMove(newTab(), panelData, 'middle')}>
                    add
                </button>
            </div>);
        }
    }
};

let defaultTab = {
    title: 'default-style',
    content: (
        <div>
            Tabs from different style group can't be docked in same panel
        </div>
    )
};
let headlessTab = {
    title: 'headless',
    content: (
        <div style={{background: '#f6f6f6', height: '100%', margin: 0, padding: 30}}>
            <h4 className={"mb-4"}>STYLE EDITOR</h4>
            <StyleEditor />
        </div>
    ),

    // this is a pre-defined style, defined here:
    // https://github.com/ticlo/rc-dock/blob/master/style/predefined-panels.less
    group: 'headless'
};
let cardTabOld = {
    title: <span>card-style</span>,
    content: <span>newtab</span>, //newTab(),
    // this is a pre-defined style, defined here:
    // https://github.com/ticlo/rc-dock/blob/master/style/predefined-panels.less
    group: 'graph card ghostone addable', // card hhostone
};
let cardTab = newTab();
// groups definiti da me o default: card | large | transparent | ghostone (utilizzabili in combinazione
let customTab = {
    title: 'custom-style',
    content: (
        <div style={{overflowY: "scroll", background: '#f6f6f6', height: '100%', margin: 0, padding: 30}}>
            {/*<ViewsEditor />*/}
        </div>
    ),
    // you can mix predefined style with you own style
    // separate 2 styles with space
    // the panel class will contain both dock-style-car and dock-style-custom
    group: 'card large'
};
let box: LayoutData = {
    dockbox: {
        mode: 'horizontal',
        children: [
            {
                mode: 'vertical',
                children: [
                    {
                        tabs: [
                        /*
                            {...defaultTab, id: 't7'},
                            {
                                ...defaultTab, id: 't8', title: (
                                    <div className='github-icon'>
                                        custom-tab
                                    </div>
                                ), content: (
                                    <div>
                                        Tab title can be any react component
                                    </div>
                                )
                            }
                         */
                        ],
                    },
                    {
                        tabs: [{...cardTab, id: 't9'}, {...cardTab, id: 't10'}, {...cardTab, id: 't11'}],
                    },

                ]
            },
            {
                mode: 'vertical',
                children: [
                    {
                        tabs: [{...customTab, id: 't4'}, {...customTab, id: 't5'}, {...customTab, id: 't6'}],
                    },
                    {
                        tabs: [{...headlessTab, id: 't1'}, {...headlessTab, id: 't2'}, {...headlessTab, id: 't3'}],
                    },

                ]
            }

        ]
    }
};

let groups2 = {
    headless: {
        // the css class for this would be dock-panel-headless
        // this is a pre-defined style, defined here:
        // https://github.com/ticlo/rc-dock/blob/master/style/predefined-panels.less
        floatable: true,
        maximizable: true,
    },
    'card custom': {
        // the css class for this would be dock-panel-custom
        // this is a custom panel style defined in panel-style.html
        floatable: true,
        maximizable: true,
        panelExtra: (panelData: PanelData, context: DockContext) => (
            <div className={"extra-btn-container"}>
                <span className='my-panel-extra-btn'
                      onClick={() => context.dockMove(panelData, null, 'maximize')}>
                  {panelData.parent?.mode === 'maximize' ? 'a▬' : 'b▣'}
                </span>
                <span className='my-panel-extra-btn'
                      onClick={() => context.dockMove(panelData, null, 'remove')}>
                  X</span>
            </div>
        )
    },
    'close-all': {
        floatable: true,
        maximizable: true,
        panelExtra: (panelData: PanelData, context: DockContext) => (
            <div>
                <span className='my-panel-extra-btn'
                      onClick={() => context.dockMove(panelData, null, 'maximize')}>
                  {panelData.parent?.mode === 'maximize' ? 'a▬' : 'b▣'}
                </span>
                <span className='my-panel-extra-btn'
                      onClick={() => context.dockMove(panelData, null, 'remove')}>
                  X</span>
            </div>
        )
    },
    addable: {
        floatable: true,
        maximizable: true,
        panelExtra: (panelData: PanelData, context: DockContext) => (
                <button className='btn' onClick={() => context.dockMove(newTab(), panelData, 'middle')}>add</button>
        )
    }
};


let tab1 = {id: 't1', title: 'Tab 1', content: <div>Tab 1</div>, groups: "card custom"};
let tab2 = {id: 't2', title: 'Tab 2', content: <div>Tab 2</div>, groups: "card custom"};
let tab3 = {id: 't3', title: 'Tab 3', content: <div>Tab 3</div>, groups: "card custom"};
let tab4 = {id: 't4', title: 'Tab 4', content: <div>Tab 4</div>, groups: "card custom"};
let tab5 = {id: 't5', title: 'Tab 5', content: <div>Tab 5</div>, groups: "card custom"};
let tab6 = {id: 't6', title: 'Tab 6', content: <div>Tab 6</div>, groups: "card custom"}; // allowWindow per popup window esterna on right-click maximize

let defaultLayout: LayoutData = {
    dockbox: {
        mode: 'horizontal',
        children: [
            {
                mode: 'vertical',
                children: [
                    {
                        tabs: [tab1],
                    },
                    {
                        tabs: [tab2, tab3, tab4],
                    }
                ]
            },
            {
                tabs: [tab5, tab6],
            },
        ]
    }
};



let saved = {"dockbox":{"id":"+1","size":200,"mode":"horizontal","children":[{"id":"+2","size":432,"mode":"vertical","children":[{"id":"+3","size":200,"tabs":[{"id":"t7"},{"id":"t8"}],"activeId":"t7"},{"id":"+4","size":239,"tabs":[{"id":"t9"},{"id":"t10"},{"id":"t11"}],"activeId":"t9"}]},{"id":"+5","size":1464,"mode":"vertical","children":[{"id":"+6","size":296,"tabs":[{"id":"t4"},{"id":"t5"},{"id":"t6"}],"activeId":"t4"},{"id":"+7","size":60,"tabs":[{"id":"t1"},{"id":"t2"},{"id":"t3"}],"activeId":"t1"}]}]},"floatbox":{"id":"+8","size":1,"mode":"float","children":[]},"windowbox":{"id":"+9","size":1,"mode":"window","children":[]},"maxbox":{"id":"+10","size":1,"mode":"maximize","children":[]}};


class DockLayoutComponentRaw extends PureComponent<AllProps, ThisState>{
    private static maxID: number = 0;
    private rcdock: DockLayout | null;
    private id: string = "rcdock_" + DockLayoutComponentRaw.maxID++;

    constructor(props: AllProps, context: any) {
        super(props, context);
        this.rcdock = null;
    }
    private save(): void {
        let debug: boolean = true;
        if (debug) return;
        if (this.rcdock) localStorage.setItem(this.id, JSON.stringify(this.rcdock.saveLayout()));
    }

    private load(newLayout?: LayoutBase): void {
        if (!this.rcdock) return;
        if (!newLayout) {
            const json = localStorage.getItem(this.id);
            if (!json) return;
            newLayout = JSON.parse(json);
            if (!newLayout) return;
        }
        this.rcdock.loadLayout(newLayout);
    }

    onLayoutChange = (newLayout: LayoutBase, currentTabId?: string | undefined, direction?: DropDirection | undefined): void => {
        // control DockLayout from state
        this.save();
        console.log('onlayoutchange', currentTabId, newLayout, direction);
        if (currentTabId === 'protect1' && direction === 'remove') {
            alert('removal of this tab is rejected');
        } else {
           // this.load(newLayout);
        }
    };
    componentDidMount(): void {
        this.load();
    }

    render(): ReactNode {
        return (<>
            <DockLayout
                ref={ e => this.rcdock = e}
                defaultLayout={box}
                groups={groups}
                style={{
                    position: "absolute",
                    left: 10,
                    top: 10,
                    right: 10,
                    bottom: 10,
                }}
                onLayoutChange={this.onLayoutChange}
            />
            </>); }
    }

// private
    interface OwnProps {
    // propsRequestedFromHtmlAsAttributes: string;
}
// private
interface StateProps {
    // propsFromReduxStateOrOtherKindOfStateManagement: boolean; // flux or custom things too, unrelated to this.state of react.
}

// private
interface DispatchProps {
    // propsFromReduxActions: typeof funzioneTriggeraAzioneDaImportare;
}


// private
type AllProps = OwnProps & StateProps & DispatchProps;

////// mapper func

function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    /// to fill
    return ret; }

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    /// to fill
    return ret; }


export const DockLayoutComponent = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(DockLayoutComponentRaw as any);
