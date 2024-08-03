import React, {Component, PureComponent, ReactElement, ReactNode, useState} from "react";
import {
    Dictionary,
    DocString,
    GObject,
    Log,
    LoggerComponent,
    Point,
    RuntimeAccessible,
    Size,
    Try,
    U,
    windoww
} from "../../joiner";
import $ from "jquery";
import {BoxData, DockLayout, LayoutProps, PanelData, TabData, TabGroup} from "rc-dock";
import {MyPortal} from "./MyDock";
import "./DockManagerStyles.scss";
import {LayoutData} from "rc-dock/src/DockData";

// needs to be class component because needs setState() to be called externally
interface TabHeaderProps{
    tid: string;
    children: ReactNode;
}
class TabHeaderState{
    pinned: AnchorTypes | "";
    constructor() {
        this.pinned = '';
    }
}
interface TabContentProps extends TabHeaderProps{}
class TabContentState extends TabHeaderState{}

@RuntimeAccessible('TabHeader')
export class TabHeader extends React.Component<TabHeaderProps, TabHeaderState>{
    static cname: string = 'TabHeader';
    static instances: Dictionary<string, TabHeader> = {};
    constructor(props:TabHeaderProps) {
        super(props);
        TabHeader.instances[props.tid] = this;
        this.state = new TabHeaderState();
    }

    unpin(){
        let oldPinned = this.state.pinned;
        if (oldPinned === "") return Log.ee("tab already unpinned", this.props.tid);
        TabContent.instances[this.props.tid].setState({pinned: ''});
        this.setState({pinned: ''}, ()=>{
            let strip: PinnableStrip = PinnableStrip[oldPinned as AnchorTypes];
            strip.unpin(this.props.tid);
        });
    }
    onMouseHoverExpand(){
        this.setAsActiveTab();
    }
    onMouseLeaveExpand(){

    }
    getTabStrip(): PinnableStrip{
        Log.exDev(!this.state.pinned, "Cannot get strip, tab is not pinned");
        return PinnableStrip[this.state.pinned as AnchorTypes];
    }
    setAsActiveTab(){
        let strip = this.getTabStrip();
        const tabdata: TabData = strip.dockLayout!.find(this.props.tid+"_pinned") as TabData;
        if (!this.html) return; // not pinned
        strip.dockLayout!.updateTab(tabdata.id as string, tabdata, true);
        // if (windoww) return;
        let tabcontent: HTMLElement = document.getElementById(this.props.tid+"_pinned") as HTMLElement;
        if (!tabcontent) return Log.eDevv("cannot find pinned tab content", {tid: this.props.tid, tabdata});
        // let e: HTMLElement = strip.html!.querySelector('.dock-content-holder') as HTMLElement;
        let csize = Size.of(tabcontent);
        let tabh: HTMLElement = this.html;
        let tabsize = Size.of(tabh);
        //let tabcenter: Point = new Point(tabsize.x + tabsize.w/2, tabsize.y + tabsize.h/2);
        console.log("setActiveTab", {strip, tabdata, tabcontent, csize, tabh, tabsize});
        let offset: Point = new Point(tabsize.x + tabsize.w/2 - csize.w/2, tabsize.y + tabsize.h/2 - csize.h/2);
        let s: string;
        let tabcontentholder: HTMLElement|null|undefined = tabcontent.parentElement?.parentElement;
        if (!tabcontentholder?.classList.contains('dock-content-holder'))
            return Log.exDevv('rc-dock changed structure, need code update or downgrading of rc-dock library.', {tabcontent, tabcontentholder});
        let $tabholder = $(tabcontentholder);
        if (!$tabholder.data("uiResizable")) {
            let handles: string;
            switch(strip.props.side){
                default: handles = ""; break;
                case "t": handles = "s, se, sw"; break;
                case "b": handles = "n, ne, nw"; break;
                case "l": handles = "e, se, ne"; break;
                case "r": handles = "w, sw, nw"; break;
            }
            $tabholder.resizable({handles});
            tabcontentholder.tabIndex = 0;
        }
        switch(strip.props.side){
            default: return;
            case "t": case "b":
                s = "clamp(0px, " + offset.x + "px, 100vw)";
                //s = "clamp(0px, calc(" + tabcenter.x + "px ), 100vw)";
                console.log("clamp: ", s);
                tabcontentholder.style.left = s;
                break;
            case "l": case "r":
                s = "clamp(0px, " + offset.y + "px, 100vw)";
                //s = "clamp(0px, calc(" + tabcenter.y + "px ), 100vw)";
                console.log("clamp: ", s);
                tabcontentholder.style.top = s;
                break;
        }
    }

    private html: HTMLElement | null = null
    render(): ReactNode {
        const props: TabHeaderProps = this.props;
        let pinned = this.state.pinned;
        let content = <div onMouseDown={()=>{console.log("tab dragging start")}}>{props.children}<i className={"pin-button bi bi-pin-angle-fill"} onClick={()=>this.unpin()}/></div>;
        console.log("tabheader portal pre pin", {pinned});
        if (!pinned) {
            let selectTab = () => PinnableDock.instance.setAsActiveTab(props.tid);
            return <div className={"active-on-mouseenter not-pinned"} onMouseDown={selectTab} /*onMouseEnter={selectTab}*/>{content}</div>;
        }
        const strip: PinnableStrip = (PinnableStrip as GObject)[pinned];
        const html: Element|null = tabdict_title[props.tid + '_pinned'];
        console.log("tabheader portal", {html, content, tabdict:tabdict_title, td:{...tabdict_title}});
        if (!html) { // unpinned tab
            Log.exDevv("cannot find html", {html, pinned, 'this': this});
            let selectTab = () => PinnableDock.instance.setAsActiveTab(props.tid);
            return <div className={"active-on-mouseenter"} onMouseDown={selectTab} /*onMouseEnter={selectTab}*/>{content}</div>;
        }
        function preventFocusOnOriginDock(e: any): void{
            e.stopPropagation(); // otherwise the pinned tab will focus the hidden-tab on original dock
        }
        content = <div className={"active-on-mouseenter"} ref={(e) => this.html = e} onMouseDown={preventFocusOnOriginDock} onClick={preventFocusOnOriginDock} onMouseEnter={()=>this.onMouseHoverExpand()} onMouseLeave={()=>this.onMouseLeaveExpand()}>{content}</div>
        return <><MyPortal container={html}>{content}</MyPortal><div className={"moved-content"}>moved</div></>;
    }
}
@RuntimeAccessible('TabHeader')
export class TabContent extends React.Component<TabContentProps, TabContentState>{
    static cname: string = 'TabContent';
    static instances: Dictionary<string, TabContent> = {};
    constructor(props:TabContentProps) {
        super(props);
        TabContent.instances[props.tid] = this;
        this.state = new TabContentState();
    }
    render() {
        const props: TabContentProps = this.props;
        let pinned = this.state.pinned;
        const content = <Try>{props.children}</Try>;
        console.log("tabcontent portal pre pin", {pinned});
        if (!pinned) return content;
        const strip: PinnableStrip = (PinnableStrip as GObject)[pinned];
        const html: Element|null = tabdict_content[props.tid + '_pinned'];
        console.log("tabcontent portal", {html, content, tabdict:tabdict_content, td:{...tabdict_content}});
        if (!html) return content;
        return <MyPortal container={html}>{content}</MyPortal>;
    }
}

type AnchorTypes = "t" | "l" | "r" | "b";
interface PinnableStripProps{
    side: AnchorTypes;
}
class PinnableStripState{
    // pinnedTabs: TabData[];// or what?
    //pinnedTabsid: Dictionary<string, true>;

    constructor() {
       // this.pinnedTabsid = {};
    }
}
@RuntimeAccessible("PinnableStrip")
export class PinnableStrip extends PureComponent<PinnableStripProps, PinnableStripState>{
    static cname = 'PinnableStrip';
    public static t: PinnableStrip;
    public static b: PinnableStrip;
    public static l: PinnableStrip;
    public static r: PinnableStrip;

    html: Element | null = null;
    headerHtml: Element | null = null;
    contentHtml: Element | null = null;

    constructor(props: PinnableStripProps) {
        super(props);
        PinnableStrip[props.side] = this;
        this.state = new PinnableStripState();
        this.groups = {
            'pinned': {floatable: false, maximizable: false, tabLocked: true}
        };
        const tabsData: TabData[] = [];
        /*
        let tabdict: Dictionary<string, TabData> = {};
        for (let tabid in this.state.pinnedTabsid) {
            const id: string = tabid+'_pinned';
            const tabdata: TabData = {
                id,
                group: 'pinned',
                closable: false,
                title: <div ref={(curr)=>this.tabdict_title[id] = curr}></div>,
                content: <div ref={(curr)=>this.tabdict_content[id] = curr}></div>,
                //title: <TabHeader tid={tid()}>Structure</TabHeader>, content: <TabContent tid={tid()}><StructureEditor /></TabContent>
            };
            tabdict[tabdata.id as string] = tabdata;
            tabsData.push(tabdata);
        }*/
        this.layout = {dockbox: {mode: 'horizontal', children: []}};
        this.panel = {id: 'side_panel' + this.props.side, tabs: tabsData};
        this.layout.dockbox.children.push(this.panel);
    }

    private panel: PanelData;
    dockLayout: DockLayout | null = null;

    private layout: LayoutData;
    private groups: {[p: string]: TabGroup};
    private tabs: Dictionary<string, TabData> = {};
    private afterUpdateCallback_funcs: ((...a:any)=>any)[] = [];

    unpin(tid: string){
        const stripdock: DockLayout = this.dockLayout as DockLayout;
        let tabData: TabData = stripdock.find(tid+"_pinned") as TabData;
        delete this.tabs[tid+"_pinned"];
        stripdock.dockMove(tabData, null, 'remove');
        if (!Object.keys(this.tabs).length) this.forceUpdate();
        PinnableDock.instance.restoreTab(tid);
    }
    setAfterUpdateCallback(c: (...a:any)=>any){
        this.afterUpdateCallback_funcs.push(c);
    }
    componentDidUpdate(prevProps: Readonly<PinnableStripProps>, prevState: Readonly<PinnableStripState>, snapshot?: any) {
        this.onupdate();
    }
    componentDidMount() {
        this.onupdate();
    }
    onupdate(){
        console.log('strip updated', [...this.afterUpdateCallback_funcs]);
        for (let c of this.afterUpdateCallback_funcs) c();
        this.afterUpdateCallback_funcs = [];
    }

    addTab(t: TabData): void{
        const tid: string = t.id as string;
        if (this.tabs[tid]) Log.eDevv("docking tab already exist", this, t);
        this.tabs[tid] = t;
        // if (Object.keys(this.tabs).length === 1) this.forceUpdate(); // updates .empty class
        console.log("addTab", {t, pp1:this.dockLayout!.getLayout().dockbox.children[0], pp0: this.panel});
        (window as any ).pinnableStrip = this;
        //this.dockLayout!.dockMove(t, 'side_panel' + this.props.side, 'middle');
        (window as any).addTab = (t: any)=> this.addTab(t);


        this.dockLayout!.dockMove(t, this.dockLayout!.getLayout().dockbox.children[0], 'middle');
        this.forceUpdate();
        //this.dockLayout!.dockMove(t, this.panel, 'middle');

    }
    removeTab(tid: string): void{
        if (!this.tabs[tid]) Log.eDevv("docking tab already removed", this, tid);
        Log.eDevv("docking removeTab() todo", this, tid);
        delete this.tabs[tid];
        if (Object.keys(this.tabs).length === 0) this.forceUpdate(); // updates .empty class
    }

    render(){
        const layout = this.layout;
        const groups = this.groups;
        return <div className={(Object.keys(this.tabs).length ? '' : 'empty') +" pinnable-strip pinnable-strip-" + this.props.side} ref={(curr)=>this.html = curr}>
            {/* loadTab={(d)=>tabdict[d.id as string]} */}
            <DockLayout key="thestripdock" ref={(e)=>this.dockLayout = e} defaultLayout={layout} groups={groups} style={{width: '100%', height: '100%'}} />
            {/*<div className={"tab-row"} ref={(curr)=>this.headerHtml = curr}></div>
            <div className={"content-row"} ref={(curr)=>this.contentHtml = curr}></div>*/}
        </div>;
    }
}

/// todo: lodash _.debounce on whileDragging and similar stuff triggered too often
interface LayoutState {
    layout: LayoutData;
    /** @ignore */
    dropRect?: any;// {left: number, width: number, top: number, height: number, element: HTMLElement, source?: any, direction?: DropDirection};
}
let currentDropRect!: LayoutState["dropRect"];
let currentDropArea!: Element;
let dockLayout!: Element;
let dropIndicator: Element = U.toHtml('<div class="dock-drop-indicator" style="left: 0px; top: 0px; width: 0px; height: 60px; display: block;')

function getStrip(side: string): PinnableStrip {
    let s = side[0];
    return (PinnableStrip as any)[s];
}
function getStripHtml(side: string): Element {
    return getStrip(side).html as Element;
}

windoww.highlightAnchorArea = function(side: string){
    //let highlightdiv = dockLayout.querySelector('.dock-drop-indicator') as HTMLElement;
    //if (!highlightdiv) return;
    //highlightdiv.style.background = '#ff000077';
    let strip = getStripHtml(side);
    console.log("highlightpin", {strip, side, PinnableStrip});
    strip.classList.add('dock-drop-indicator');
}
windoww.hideAnchorArea = function(side: string){
    let strip = getStripHtml(side);
    strip.classList.remove('dock-drop-indicator');
}


const tabdict_title: Dictionary<DocString<"tabdata.id">, HTMLElement | null> = {};
const tabdict_content: Dictionary<DocString<"tabdata.id">, HTMLElement | null> = {};
windoww.confirmSetAnchor = function(side: AnchorTypes){
    windoww.hideAnchorArea(side);
    const tabdata: TabData = PinnableDock.getTabFromDropRect(currentDropRect);
    let strip = getStrip(side);
    let content: TabContent = TabContent.instances[tabdata.id as string];
    let title: TabHeader = TabHeader.instances[tabdata.id as string];
    const id: string = tabdata.id+'_pinned';// + '_' + side;
    const newtabdata: TabData = {
        //...tabdata, parent: undefined,
        id,
        group: 'pinned',
        closable: false,
        title: <div ref={(curr)=>tabdict_title[id] = curr}></div>,
        content: <div ref={(curr)=>tabdict_content[id] = curr}></div>,
        //title: <TabHeader tid={tid()}>Structure</TabHeader>, content: <TabContent tid={tid()}><StructureEditor /></TabContent>
    };
    strip.setAfterUpdateCallback(()=>{
        content.setState({pinned: side}); title.setState({pinned: side});
        console.log("confirm pin anchor", {content, title, strip, side, tabdata, newtabdata, currentDropRect});
    });
    strip.addTab( newtabdata );
    PinnableDock.instance.hideTab(tabdata.id as string, side);

    /*strip.setState({pinnedTabsid:{...strip.state.pinnedTabsid, [tabdata.id as string]:true}},
        ()=>{
        content.setState({pinned: side}); title.setState({pinned: side});
        console.log("confirm pin anchor", {content, title, strip, side, tabdata, currentDropRect});
    });*/
    console.log("confirm pin anchor 0", {tid:tabdata.id, TabHeader, TabContent});


    // how to? i create a new dockiing here for each strip?
    // no i scrap the tabstuf, take the tabdata.header as preview. the tabdata.content as content. then add a un-pin button to the header
    //strip.classList.remove('dock-drop-indicator');
}
/*
let htmltablist = <div className="dock-bar drag-initiator" role="tablist" tabIndex="-1">
    <div role="tablist" className="dock-nav">
        <div className="dock-nav-wrap">
            <div className="dock-nav-list" style="transform: translate(0px, 0px);">
                <div className="dock-tab dock-tab-active">
                    <div role="tab" aria-selected="true" className="dock-tab-btn" tabIndex="0" id={tabid+'_pinned'} aria-controls={tabid+'_pinned'}>
                        <div className="drag-initiator">
                            <TabSlot />
                            <div className="dock-tab-hit-area"></div>
                        </div>
                    </div>
                </div>
                <div className="dock-tab">
                    <div role="tab" aria-selected="false" className="dock-tab-btn" tabIndex="0" id={tabid} aria-controls={tabid}>
                        <div className="drag-initiator">
                            <TabSlot />
                            <div className="dock-tab-hit-area"></div>
                        </div>
                    </div>
                </div>
                <div className="dock-ink-bar dock-ink-bar-animated" style="left: 0px; width: 30px;"></div>
            </div>
        </div>
        <div className="dock-nav-operations dock-nav-operations-hidden">
            <button type="button" className="dock-nav-more" tabIndex="-1" aria-hidden="true" aria-haspopup="listbox"
                    aria-controls="rc-tabs-1-more-popup" id="rc-tabs-1-more" aria-expanded="false"
                    style="visibility: hidden; order: 1;">...
            </button>
        </div>
        <div className="dock-extra-content">
            <div className="dock-panel-max-btn"></div>
        </div>
    </div>
</div>;
    */
// <LayoutProps, LayoutState>
function makeAnchorControl(side: string){
    let s = side[0];


    const str = `<div class="dock-drop-square dock-drop-${side}-anchor" onmouseup="confirmSetAnchor('${s}')" onmouseenter="highlightAnchorArea('${s}')" onmouseleave="hideAnchorArea('${s}')"">
<div class="dock-drop-square-box">
<i class="bi bi-pin-angle-fill"></i>
</div>
</div>`;
    return U.toHtml(str);
}
const anchorControls = [
    makeAnchorControl('top'),
    makeAnchorControl('bottom'),
    makeAnchorControl('left'),
    makeAnchorControl('right'),
];

// todo: how to drop pinned tabs in the main layout https://github.com/ticlo/rc-dock/issues/97there is also an official example with a different strat
export class PinnableDock extends DockLayout{
    static instance: PinnableDock;
    constructor(props: any) {
        super(props);
        console.trace("pinnableDock instance", this);
        //Log.exDevv(PinnableDock.instance, "current PinnableDock is a singleton, cannot make 2 instances", {thiss:this, oldnstance: PinnableDock.instance});
        PinnableDock.instance = this;
        let debug:boolean = false;
        if (!debug) return;
        let t: GObject = this;
        // for debug only, discovery of inner events
        for (let k in t) {
            let originalfunc = t[k];
            if (typeof t[k] === "function") t[k] = function (...a:any): any {
                console.warn('PinnableDock called ' + k, {arguments});
                return originalfunc(...a);
            }
        }
    }

    hideTab(tid: string, pinnedSide: AnchorTypes){
        let tabdata: TabData = this.find(tid) as TabData;
        this.updateTab(tid, {...tabdata, pinned:pinnedSide} as any, false);
        let siblings = this.getSiblings(tid);
        let i = siblings.findIndex((t)=> t.id === tid);
        let newActiveTab = this.getAdiacentTab(tid);
        console.log("hideTab", {siblings, i, newActiveTab, tabdata});
        if (newActiveTab) this.updateTab(newActiveTab.id as string, newActiveTab, true);
        else this.hidePanel(this.getPanelFromTab(tabdata));
    }
    getPanelFromTab(t: TabData): PanelData{
        return t.parent as any;
    }
    hidePanel(p:PanelData): void {
        // document.findElementById(p.id)
    }
    restoreTab(tid: string){
        let tabdata = this.find(tid);
        this.updateTab(tid, {...tabdata, pinned:undefined} as any, true);
    }
    setAsActiveTab(tid: string, tabdata?: TabData): void{ // todo: on mousehover on unpinned tabs
        tabdata = tabdata || this.find(tid) as TabData;
        this.updateTab(tid, tabdata, true);
    }
    setState<K extends keyof LayoutState>(state: ((prevState: Readonly<LayoutState>, props: Readonly<LayoutProps>) => (Pick<LayoutState, K> | LayoutState | null)) | Pick<LayoutState, K> | LayoutState | null, callback?: () => void) {
        // console.warn("set state", state, (state as any)?.dropRect?.element);
        super.setState(state, callback);
    }
    getSiblings(tid: string): TabData[]{
        let tabdata = this.find(tid);
        let panel: PanelData = tabdata.parent as PanelData;
        return panel.tabs;
    }
    getAdiacentTab(tid: string): TabData | undefined{
        let siblings: GObject<TabData>[] = this.getSiblings(tid);
        let i0 = siblings.findIndex((t)=> t.id === tid);
        let i = i0;
        while (++i < siblings.length) if(!siblings[i].pinned) return siblings[i];
        i = i0;
        while (--i >= 0) if(!siblings[i].pinned) return siblings[i];
        return undefined;
    }
    getNextTab(tid: string): TabData | undefined{
        let siblings: GObject<TabData>[] = this.getSiblings(tid);
        let i = siblings.findIndex((t)=> t.id === tid);
        while (++i < siblings.length) if(!siblings[i].pinned) return siblings[i];
        return undefined;
    }
    getPrevTab(tid: string): TabData | undefined{
        let siblings: GObject<TabData>[] = this.getSiblings(tid);
        let i = siblings.findIndex((t)=> t.id === tid);
        while (--i >= 0) if(!siblings[i].pinned) return siblings[i];
        return undefined;
    }
    public static getTabFromDropRect(dropRect: LayoutState['dropRect']): TabData{
        if (!dropRect.source) return undefined as any;
        const panel: PanelData = dropRect.source.props.panelData;
        console.log("getTabFromDropRect", {dropRect, panel, active: panel.activeId});
        const tabdata: TabData = panel.tabs.filter(t=> t.id === panel.activeId)[0];
        return tabdata;
    }

    componentDidUpdate(prevProps: Readonly<LayoutProps>, prevState: Readonly<LayoutState>, snapshot?: any) {
        super.componentDidUpdate(prevProps, prevState, snapshot);
        if (this.state.dropRect) {
            let droparea = this.state.dropRect.element;
            if (!droparea) return;
            /*<div class="dock-drop-square dock-drop-top anchor"><div class="dock-drop-square-box"></div></div>*/
            let droplayer = droparea.querySelector('.dock-drop-layer');
            currentDropArea = droparea;
            dockLayout = this._ref;
            currentDropRect = this.state.dropRect;
            windoww.htmldockLayout = this._ref;
            if (!droplayer) return;
            droplayer.append(...anchorControls);
            let tab = PinnableDock.getTabFromDropRect(droparea);
            // todo: tabfocus but not the active one, the clicked one
            // droparea.style.backgroundColor = "red";
        }
        // document.querySelectorAll('.dock-drop-layer')
    }
    //
    // onDragStateChange = (draggingScope: any) => void{
    //     //super.onDragStateChange(draggingScope);
    // }
    // onSilentChange(currentTabId?: string, direction?: DropDirection) {
    //     super.onSilentChange(currentTabId, direction);
    // }
    // dockMove(source: TabData | PanelData, target: string | TabData | PanelData | BoxData | null, direction: DropDirection) {
    //     super.dockMove(source, target, direction);
    // }
    //
    // setDropRect(element: HTMLElement, direction?: DropDirection, source?: any, event?: { clientX: number; clientY: number }, panelSize?: [number, number]) {
    //     super.setDropRect(element, direction, source, event, panelSize);
    // }
    //
    // changeLayout(layoutData: LayoutData, currentTabId: string, direction: DropDirection, silent?: boolean) {
    //     super.changeLayout(layoutData, currentTabId, direction, silent);
    // }
    // updateTab(id: string, newTab: TabData, makeActive?: boolean): boolean {
    //     return super.updateTab(id, newTab, makeActive);
    // }

    render(): React.ReactNode {
        return <div className={"pinnable-dock-root gray-style"}>
            <PinnableStrip side={"t"} />
            <div className={"pinnable-dock-middle-strip"}>
                <PinnableStrip side={"l"} />
                <div className={"not-strip"}>{super.render()}</div>
                <PinnableStrip side={"r"} />
            </div>
            <PinnableStrip side={"b"} />
        </div>
    }
}
