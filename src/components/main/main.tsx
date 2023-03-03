import 'smart-webcomponents-react/source/styles/smart.default.css';
import React from "react";
import ReactDOM from "react-dom";
import {DockingLayout} from 'smart-webcomponents-react/dockinglayout';
import {GObject, LoggerComponent, Size} from "../../joiner";
import ToolboxComponent from "../toolbox/ToolboxComponent";
import $ from 'jquery';
import './main.scss';

class DragContext{
    protected type?: "LayoutPanelItem" | "LayoutPanel" | "LayoutGroup" | string;
    public idNotForHtml?: string;
    public childOrientation: "horizontal" | "vertical" | undefined = undefined;

    public label: string | undefined = undefined;
    public childrens: DragContext[] = [];
    // isContext: boolean = true;
    constructor(parent: DragContext | null){
        this.setType();
        if (parent) parent.childrens.push(this);
    }
    setType(val: string | undefined | null = undefined): this { this.type = val === null ? undefined : "LayoutGroup"; return this; }
    /*setChildrens(childrens: (DragPanel | DragContext)[]): this {
        this.childrens = childrens;
        return this;
    }*/
    emitObject(): GObject {
        let ret: GObject = {};
        if (this.type) ret.type = this.type;
        if (this.idNotForHtml) ret.id = this.idNotForHtml;
        if (this.label) ret.label = this.label;
        if (this.childOrientation) ret.orientation = this.childOrientation;
        if (this.headerPosition) ret.headerPosition = this.headerPosition;
        if (this.content) ret.content = this.content;
        if (this.selected) ret.selected = this.selected;
        if (this.childrens) ret.items = this.childrens.map( (c) => c.emitObject());
        return ret;
    }
    setHeader(headerPosition: "none" | undefined): this {
        this.headerPosition = headerPosition;
        return this;
    }
    public headerPosition: "none" | undefined;
    public content: string | undefined;
    public selected: boolean | undefined;
    setID(id: string): this {
        this.idNotForHtml = id;
        return this;
    }
    setOrientation(orientation: "horizontal" | "vertical" | undefined): this{
        this.childOrientation = orientation;
        return this;
    }
    setLabel(label: string): this {
        this.label = label;
        return this;
    }
    setSelected(b: boolean | undefined = true): this {
        this.selected = b;
        return this;
    }
    setContent(content: string | undefined): this {
        this.content = content;
        return this;
    }
}
class DragPanel extends DragContext{
    isPanel: boolean = true;
    setType(): this { this.type = "LayoutPanel"; return this; }
    setChildrens(childrens: (DragTab)[]): this {
        this.childrens = childrens;
        return this;
    }
}

class DragTab extends DragContext{
    childrens!: never[];
    constructor(parent: DragContext | DragPanel){
        super(parent);
    }
    isTab: boolean = true;
    setType(): this { this.type = undefined; return this; }
    setChildrens(childrens: never[]): this {
        this.childrens = childrens;
        return this;
    }
}

const rootc = new DragContext(null).setOrientation("horizontal");
//const topcontext = new DragContext(rootc).setOrientation("vertical");
//const toppanel = new DragPanel(topcontext).setID("tabTop").setLabel("TopBar");
// const menutab = new DragTab(toppanel).setLabel("Menù").setContent('<div class="docking-tab-content topbar">container tab top</div>');
const leftPanel = new DragPanel(rootc).setLabel("Left");
const leftTab = new DragTab(leftPanel).setID("toolbox").setLabel("Toolbox").setHeader("none").setContent('<div class="docking-tab-content toolbox">container tab toolbox, content will be replaced</div>')

const topPanel = new DragPanel(rootc).setLabel("Top");
const topTab = new DragTab(topPanel).setID("topbar").setLabel("Menù").setHeader("none").setContent('<div class="docking-tab-content topbar">container tab topbar, content will be replaced</div>')

const rightPanel = new DragPanel(rootc).setLabel("Right");
const treeTab = new DragTab(rightPanel).setID("treeview").setLabel("Tree view").setHeader("none").setContent('<div class="docking-tab-content treeview">container tab treeview, content will be replaced</div>')

const bottomPanel = new DragPanel(rootc).setLabel("Bottom");
const consoleTab = new DragTab(bottomPanel).setID("console").setLabel("Console").setHeader("none").setContent('<div class="docking-tab-content console">container tab console, content will be replaced</div>')
const loggerTab = new DragTab(bottomPanel).setID("logger").setLabel("Log").setHeader("none").setContent('<div class="docking-tab-content logger">container tab logger, content will be replaced</div>')

const centerPanel = new DragPanel(rootc).setLabel("Graph");

const graphm3Tab = new DragTab(centerPanel).setID("graph-m3").setLabel("M3").setHeader("none").setContent('<div class="docking-tab-content container-graph-m3">container graph m3, content will be replaced</div>')
const graphm2Tab = new DragTab(centerPanel).setID("graph-m3").setLabel("M2").setHeader("none").setContent('<div class="docking-tab-content container-graph-m2">container graph m2, content will be replaced</div>')
const graphm1Tab = new DragTab(centerPanel).setID("graph-m1").setLabel("M1").setHeader("none").setContent('<div class="docking-tab-content container-graph-m1">container graph m1, content will be replaced</div>')

// const item0context = new DragPanel(rootc).setID("item0").setLabel("Tabs outside"); //.setType(null); // se non metto type null succede un casino non so perchè
// const taba = new DragTab(item0context).setSelected(true).setLabel("Tab A").setContent('lorem opossum');


const layout1 = [rootc.emitObject()];
const layout = [{
    type: 'LayoutGroup',
    orientation: 'horizontal',
    items: [{
        type: 'LayoutGroup',
        items: [{
            type: 'LayoutPanel',
            id: 'tabTop',
            label: 'TopBar',
            items: [{
                label: 'Menù',
                content: '<div class="docking-tab-content topbar">container tab top, content will be replaced</div>'
            },/*
                    {
                        label: 'Slider Tab',
                        content: '<div class="docking-item ">container2</div>'
                    }*/
            ]
        },
            {
                type: 'LayoutPanel',
                label: 'Left',
                items: [{
                    id: 'tabLeft',
                    label: 'Toolbox',
                    headerPosition: 'none',
                    content: '<div class="docking-tab-content leftbar">container tab left, content will be replaced</div>'
                }]
            }
        ],
        orientation: 'vertical'
    },
        {
            id: 'item0',
            label: 'Tabs outside',
            items: [{
                label: 'Tab A',
                selected: true,
                content: 'lorem ipsum'
            }]
        }
    ]
}];
class TabContainerComponent extends React.Component {
    private static maxID: number = 1;
    private layout = layout1;
    private id: string = "mainDockLayout_" + TabContainerComponent.maxID++;
    private dockinglayout!: DockingLayout;
    componentDidMount() {
        // setInterval(this.updateHorizontalLayout, 5000);
    }
    handleSaveCurrentState() {
        this.dockinglayout.getState().then((value: GObject) => localStorage.setItem(this.id, JSON.stringify(value)));
    }

    handleLoadState() {
        this.dockinglayout.loadState(JSON.parse(localStorage.getItem(this.id) || '{}'));
    }

    updateHorizontalLayout = (evt?: JQuery.MouseDownEvent) => {
        $('.smart-content-container:not([data-manualorientation])').each((i, e) => {
        // $('smart-tabs:not([data-manualorientation])').each((i, e) => {
            const $alignable = $([e, ...$(e).find('smart-tabs')]);
            // console.log('updateHorizontalLayout', $alignable);
            let size: Size = Size.of(e);
            return;
            if (size.w > size.h) {
                $alignable.attr('vertical', '');
                $alignable.removeAttr('horizontal')
            } else {
                $alignable.attr('horizontal', '');
                $alignable.removeAttr('vertical');
            }
        });
    }

    private setupOrientation(): void {
        $('smart-splitter-bar').off('mousedown.horizontal').on('mousedown.horizontal' as any,this.updateHorizontalLayout);
        this.updateHorizontalLayout();
    }

    handleReady = () => {
        const topbar = document.querySelector(".docking-tab-content.topbar .topbar");
        const toolbox = document.querySelector(".docking-tab-content.leftbar .toolbox");
        const treeview = document.querySelector(".docking-tab-content.rightbar > .treeview");
        const graphm3 = document.querySelector(".docking-tab-content.rightbar > .container-graph-m3");
        const graphm2 = document.querySelector(".docking-tab-content.rightbar > .container-graph-m2");
        const graphm1 = document.querySelector(".docking-tab-content.rightbar > .container-graph-m1");
        // const styleeditor = document.querySelector(".docking-tab-content.rightbar > .styleeditor");
        // const rawfragment = document.querySelector(".docking-tab-content.rightbar > .rawfragment");
        const consoletab = document.querySelector(".docking-tab-content.bottombar > .console");
        const logger = document.querySelector(".docking-tab-content.bottombar > .logger");
        // if (topbar) ReactDOM.render(<TopbarComponent />, topbar);
        if (toolbox) ReactDOM.render(<ToolboxComponent />, toolbox);
        if (graphm1) ReactDOM.render(<div> graph-m1-content</div>, graphm1);
        if (graphm2) ReactDOM.render(<div> graph-m2-content</div>, graphm2);
        if (graphm2) ReactDOM.render(<div> graph-m3-content</div>, graphm3);
        // if (rawfragment) ReactDOM.render(<RawFragment />, rawfragment);
        // if (styleeditor) ReactDOM.render(<StyleEditor />, styleeditor);
        // if (console) ReactDOM.render(<ConsoleComponent />, consoletab);
        if (logger) ReactDOM.render(<LoggerComponent />, logger);
        this.setupOrientation();


        this.dockinglayout.onChange = (e?: Event) => console.log('onchange', e);
        this.dockinglayout.onClose = (e?: Event) => console.log('onClose', e);
        this.dockinglayout.onClosing = (e?: Event) => console.log('onClosing', e);
        this.dockinglayout.onCreate = (e?: Event) => console.log('onCreate', e);
        this.dockinglayout.onReady = (e?: Event) => console.log('onReady', e);
        this.dockinglayout.onResizeEnd = (e?: Event) => console.log('onResizeEnd', e);
        this.dockinglayout.onResizeStart = (e?: Event) => console.log('onResizeStart', e);
        this.dockinglayout.onStateChange = (e?: Event) => console.log('onStateChange', e);
    }

    render() {
        return (
            <div>
                {/* live resize rompe il salvataggio */}
                <DockingLayout ref={(el => this.dockinglayout = el ? el : undefined as any)}
                               id={this.id}
                               onReady={this.handleReady}
                               layout={this.layout}
                               draggable={true}
                               autoSaveState autoLoadState
                               liveResize={false}
                               locale={"en"}
                               readonly={false} animation={"advanced" /* | "none" | "simple" */} hideSplitterBars={true} resizeStep={5} snapMode={"simple"}
                               theme={''}>
                </DockingLayout>
            </div>
        );
    }
}

// ReactDOM.render(<TabContainerComponent2 />, document.querySelector("#root"));

export default TabContainerComponent;
