import JqxDockingLayout, {IDockingLayoutProps} from "jqwidgets-scripts/jqwidgets-react-tsx/jqxdockinglayout";
import React, {PureComponent, ReactElement, ReactNode} from "react";
import ReactDOM from "react-dom";
/*import "./jqx.base.css"
import "./jqx.darkblue.css"*/
import "./jqx.custom-styling.scss"
import "./smartdock.custom-styling.scss"
import 'jqwidgets-scripts/jqwidgets/styles/jqx.base.css';
import 'jqwidgets-scripts/jqwidgets/styles/jqx.material-purple.css';
import $ from "jquery";
import {Dictionary, DocString, GObject, Log} from "../../joiner";
import {DockingLayout} from 'smart-webcomponents-react/dockinglayout';

class PortalOwnProps{
    children!: ReactNode;
    container!: string | Element;
}

export class MyPortal extends React.Component<PortalOwnProps> {
    container: Element | null = null;
    maxRetries: number = 10;
    retries: number = 0;

    constructor(props: PortalOwnProps) {
        super(props);
    }

    render() {
        if (!this.container) {
            if (!this.props.container) return <div>Error: Portal container is {this.props.container}</div>;
            if (typeof this.props.container === 'object') this.container = this.props.container; else
            if (typeof this.props.container === 'string') this.container = document.querySelector(this.props.container);
        }
        if (!this.container) {
            if (this.retries++ < this.maxRetries) this.forceUpdate();
            console.log('MyPortal retry getting container', {thiss: this, props: this.props});
            return this.props.children;
        }
        this.retries = 0;
        return ReactDOM.createPortal(this.props.children, this.container);
    }
}
const defaultLayout = [{
    type: 'LayoutGroup',
    orientation: 'horizontal',
    items: [{
        type: 'LayoutGroup',
        items: [{
            type: 'LayoutPanel',
            id: 'tabPanel',
            label: 'Input',
            items: [{
                id: 'tab1',
                label: 'first TextBox Tab',
                content: '<div class="tab-root" idata-d="do not use those content at all. the whole content is lost when you save state"><div>firstcontainer content</div></div>'
            },
                {
                    id: 'tabslider',
                    label: 'Slider Tab',
                    content: '<div style="padding:10px;" id="secondContainer"></div>'
                }
            ]
        },
            {
                type: 'LayoutPanel',
                label: 'Output',
                items: [{
                    id: 'outputTab',
                    label: 'Output',
                    headerPosition: 'none',
                    content: 'Write more text here ...'
                }]
            }
        ],
        orientation: 'vertical'
    },
        {
            id: 'item0',
            label: 'Tabs 0',
            items: [{
                id: 'tab A',
                label: 'Tab A',
                selected: true,
                content: 'What is Lorem Ipsum?\n' +
                    'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of' + 'type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in ' + 'the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.\n' +
                    'Why do we use it?\n' +
                    'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal ' + 'distribution of letters, as opposed to using \'Content here, content here\', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their' + 'default model text, and a search for \'lorem ipsum\' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on ' + 'purpose (injected humour and the like).'
            }]
        }
    ]
}];
/*
export class SmartDock extends React.Component {
    public layout: GObject;
    constructor(props: any) {
        super(props);
        let layoutString = localStorage.getItem('smartDockingLayoutdocking-smart-1') || '';
        let layout: GObject | null = layoutString ? JSON.parse(layoutString) : null;
        if (!layout) {
            layout = defaultLayout;
        }
        this.layout = layout;
    }

    private html: HTMLElement | null = null;
    private dock: DockingLayout | null = null;
    // componentDidMount() { this.afterUpdate(); }
    dockReady() { this.afterUpdate(); }
    componentDidUpdate(prevProps: Readonly<{}>, prevState: Readonly<{}>, snapshot?: any) { this.afterUpdate(); }

    saveHtmlMap: Dictionary<DocString<'id'>, NodeListOf<ChildNode>> = {}
    beforeUpdate(){
        if (!this.html) return;
        let $tabs = $(this.html).find('smart-tab-item.smart-element.smart-tab-item');
        let tab: HTMLElement;
        for (tab of $tabs){
            if (!tab.id) { Log.eDevv('tabs must have id\'s', {tab}); }
            this.saveHtmlMap[tab.id] = tab.childNodes;
        }
    }
    afterUpdate(){
        if ((this.dock as any).items.length === 0) {
            this.layout = defaultLayout;
            this.forceUpdate();
            // dock failed to load from localStorage, i'm forcing rerender.
        }
        (window as any).debugAfterUpdate = () => {
            this.forceUpdate();
        }
        if (window) return; // weirdly it works also without this?
        // ReactDOM.render(<MultilineTextBox />, document.querySelector("#firstContainer"));
        //ReactDOM.render(<Slider />, document.querySelector("#secondContainer"));
        if (!this.html) return;
        // let $html = $(this.html);
        let id: string;
        for (id in this.saveHtmlMap){
            let elem = document.getElementById(id);
            if (!elem) { continue; }
            for (let c of this.saveHtmlMap[id]) {
                elem.append(c);
            }
        }
    }


    render() {
        const random = Math.random();
        let layout: GObject = this.layout;
        let r = (random*255).toFixed(0);
        this.beforeUpdate();
        return (
            <div onMouseEnter={() => this.forceUpdate()} ref={e => this.html = e}>
                <h1>{r}</h1>
                <DockingLayout id={'docking-smart-1'} autoSaveState={true} autoLoadState={true}
                               ref={(e)=> {
                                   this.dock = e;
                                   if (!this.dock) return; //
                                   // this.dock.loadState(layout);
                               }}
                               style={{backgroundColor: `rgb(${r}, ${r}, ${r})`}}
                               onReady={()=>this.dockReady()} layout={layout} draggable={true}>
                </DockingLayout>
                <MyPortal container={'#tab1'}><div id={"tab1content"}>tab1 content!</div></MyPortal>
            </div>
        );
    }
}
*/
/*
how to do custom pinned tabs:

to show preview after is pinned:
keep a fake tab in a sidebar outside rc-dock. keep the rc-dock tab hidden in floating mode but anchored to the side of the pin.
when hover on a sidebar title, set display: block on the hovering tab.

to unpin: set display: block on the hovering tab and remove the sidebar fake tab
to pin: set tab on float mode, position it near the pin fake sidebar, make a fake sidebar entry, then hide the float tab

bonus: add pin buttons at the 4 edges near the current position of the 4
 .jqx-docking-layout-overlay-square.jqx-docking-layout-overlay-square-edge

*/
export class JQDock extends React.PureComponent<{}, IDockingLayoutProps> {
    constructor(props: {}) {
        super(props);
        const layout: IDockingLayoutProps['layout'] = [
            {
                items: [{
                    alignment: 'left',
                    items: [{
                        contentContainer: 'ToolboxPanel',
                        title: 'toolbox', //<b color={"red"}>Toolbox red</b>,
                        type: 'layoutPanel'
                    }, {
                        contentContainer: 'HelpPanel',
                        title: 'Help',
                        type: 'layoutPanel'
                    }],
                    type: 'autoHideGroup',
                    unpinnedWidth: 200,
                    width: 80
                },
                    {
                        items: [{
                            height: 400,
                            items: [{
                                contentContainer: 'Document1Panel',
                                title: 'Document 1',
                                type: 'documentPanel',
                            },
                                {
                                    contentContainer: 'Document2Panel',
                                    title: 'Document 2',
                                    type: 'documentPanel'
                                }],
                            minHeight: 200,
                            type: 'documentGroup'
                        },
                            {
                                height: 200,
                                items: [{
                                    contentContainer: 'ErrorListPanel',
                                    title: 'Error List',
                                    type: 'layoutPanel'
                                }],
                                pinnedHeight: 30,
                                type: 'tabbedGroup'
                            }],
                        orientation: 'vertical',
                        type: 'layoutGroup',
                        width: 500
                    },
                    {
                        items: [
                            {
                                contentContainer: 'SolutionExplorerPanel',
                                initContent: () => {
                                    // initialize a jqxTree inside the Solution Explorer Panel
                                    const source = [{
                                        expanded: true,
                                        icon: './../images/earth.png',
                                        items: [
                                            {
                                                expanded: true,
                                                icon: './../images/folder.png',
                                                items: [{
                                                    icon: './../images/nav1.png',
                                                    label: 'jqx.base.css'
                                                },
                                                    {
                                                        icon: './../images/nav1.png',
                                                        label: 'jqx.energyblue.css'
                                                    }, {
                                                        icon: './../images/nav1.png',
                                                        label: 'jqx.orange.css'
                                                    }],
                                                label: 'css'
                                            },
                                            {
                                                icon: './../images/folder.png',
                                                items: [{
                                                    icon: './../images/nav1.png',
                                                    label: 'jqxcore.js'
                                                },
                                                    {
                                                        icon: './../images/nav1.png',
                                                        label: 'jqxdata.js'
                                                    }, {
                                                        icon: './../images/nav1.png',
                                                        label: 'jqxgrid.js'
                                                    }],
                                                label: 'scripts',
                                            },
                                            {
                                                icon: './../images/nav1.png',
                                                label: 'index.htm'
                                            }],
                                        label: 'Project',
                                    }];
                                    ReactDOM.render(<div>tree?</div>, document.querySelector('#treeContainer'));
                                },
                                title: 'Solution Explorer',
                                type: 'layoutPanel'
                            },
                            {
                                contentContainer: 'PropertiesPanel',
                                title: 'Properties',
                                type: 'layoutPanel'
                            }],
                        minWidth: 200,
                        type: 'tabbedGroup',
                        width: 220
                    }],
                orientation: 'horizontal',
                type: 'layoutGroup'
            },
            {
                height: 300,
                items: [{
                    contentContainer: 'OutputPanel',
                    selected: true,
                    title: 'Output',
                    type: 'layoutPanel'
                }],
                position: {
                    x: 350,
                    y: 250
                },
                type: 'floatGroup',
                width: 500
            }
        ];
        this.state = {
            layout
        }
    }
    public html: Element | null = null;
    callbackReference(e: HTMLElement | null) {
        this.html = e;
        if (!e) return;
        $(e).on('float', function (event: JQuery.Event & GObject) {
            var floatedItem = event.args.item;
            const $allfloats = $('.jqx-docking-layout-group-floating');
            console.log("something is afloat", {event, args:event.args, floatedItem, e, $allfloats});
            // @ts-ignore
            e.prepend(...($allfloats as any));

        });
    }
    public render() {
        return (
            <div id={"dock-roottt"}  ref={(e)=> this.callbackReference(e)}>
            <JqxDockingLayout width={500} height={300} layout={this.state.layout}>
                {/* The panel content divs can have a flat structure */}
                {/* autoHideGroup */}
                <div data-container={'ToolboxPanel'}>
                    List of tools
                </div>
                <div data-container={'HelpPanel'}>
                    Help topics
                </div>
                {/* documentGroup */}
                <div data-container={'Document1Panel'}>
                    Document 1 content
                </div>
                <div data-container={'Document2Panel'}>
                    Document 2 content
                </div>
                {/* bottom tabbedGroup */}
                <div data-container={'ErrorListPanel'}>
                    List of errors
                </div>
                {/* right tabbedGroup */}
                <div data-container={'SolutionExplorerPanel'}>
                    <div id="treeContainer" style={{ border: 'none', width: '99%', height: '100%' }} />
                </div>
                <div data-container={'PropertiesPanel'}>
                    List of properties
                </div>
                {/* floatGroup */}
                <div data-container={'OutputPanel'}>
                    <div style={{ fontFamily: 'Consolas' }}>
                        <p>
                            Themes installation complete.
                        </p>
                        <p>
                            List of installed stylesheet files. Include at least one stylesheet Theme file and
                            the images folder:
                        </p>
                        <ul>
                            <li>
                                styles/jqx.base.css: Stylesheet for the base Theme. The jqx.base.css file should
                                be always included in your project.
                            </li>
                            <li>styles/jqx.arctic.css: Stylesheet for the Arctic Theme</li>
                            <li>styles/jqx.web.css: Stylesheet for the Web Theme</li>
                            <li>styles/jqx.bootstrap.css: Stylesheet for the Bootstrap Theme</li>
                            <li>styles/jqx.classic.css: Stylesheet for the Classic Theme</li>
                            <li>styles/jqx.darkblue.css: Stylesheet for the DarkBlue Theme</li>
                            <li>styles/jqx.energyblue.css: Stylesheet for the EnergyBlue Theme</li>
                            <li>styles/jqx.shinyblack.css: Stylesheet for the ShinyBlack Theme</li>
                            <li>styles/jqx.office.css: Stylesheet for the Office Theme</li>
                            <li>styles/jqx.metro.css: Stylesheet for the Metro Theme</li>
                            <li>styles/jqx.metrodark.css: Stylesheet for the Metro Dark Theme</li>
                            <li>styles/jqx.orange.css: Stylesheet for the Orange Theme</li>
                            <li>styles/jqx.summer.css: Stylesheet for the Summer Theme</li>
                            <li>styles/jqx.black.css: Stylesheet for the Black Theme</li>
                            <li>styles/jqx.fresh.css: Stylesheet for the Fresh Theme</li>
                            <li>styles/jqx.highcontrast.css: Stylesheet for the HighContrast Theme</li>
                            <li>styles/jqx.blackberry.css: Stylesheet for the Blackberry Theme</li>
                            <li>styles/jqx.android.css: Stylesheet for the Android Theme</li>
                            <li>styles/jqx.mobile.css: Stylesheet for the Mobile Theme</li>
                            <li>styles/jqx.windowsphone.css: Stylesheet for the Windows Phone Theme</li>
                            <li>styles/jqx.ui-darkness.css: Stylesheet for the UI Darkness Theme</li>
                            <li>styles/jqx.ui-lightness.css: Stylesheet for the UI Lightness Theme</li>
                            <li>styles/jqx.ui-le-frog.css: Stylesheet for the UI Le Frog Theme</li>
                            <li>styles/jqx.ui-overcast.css: Stylesheet for the UI Overcast Theme</li>
                            <li>styles/jqx.ui-redmond.css: Stylesheet for the UI Redmond Theme</li>
                            <li>styles/jqx.ui-smoothness.css: Stylesheet for the UI Smoothness Theme</li>
                            <li>styles/jqx.ui-start.css: Stylesheet for the UI Start Theme</li>
                            <li>styles/jqx.ui-sunny.css: Stylesheet for the UI Sunny Theme</li>
                            <li>styles/images: contains images referenced in the stylesheet files</li>
                        </ul>
                    </div>
                </div>
            </JqxDockingLayout>
            </div>
        );
    }
}
export const MyDock = JQDock;
// export class MyDock extends JQDock{}


/*
// @ts-ignore
export function MyDock(...a:any) {
// @ts-ignore
    return <igc-dockmanager id="dockManager" onClick={()=>new IgcDockManager()}>
        <div slot="content1" className="dockManagerContent">Content 1</div>
        <div slot="content2" className="dockManagerContent">Content 2</div>
        <div slot="content3" className="dockManagerContent">Content 3</div>
        <div slot="content4" className="dockManagerContent">Content 4</div>
        <div slot="content5" className="dockManagerContent">Content 5</div>
        <div slot="content6" className="dockManagerContent">Content 6</div>
        <div slot="content7" className="dockManagerContent">Content 7</div>
        <div slot="content8" className="dockManagerContent">Content 8</div>
        <div slot="content9" className="dockManagerContent">Content 9</div>
        <div slot="content10" className="dockManagerContent">Content 10</div>
        <div slot="content11" className="dockManagerContent">Content 11</div>
        <div slot="content12" className="dockManagerContent">Content 12</div>
        {/* @ts-ignore * /}
    </igc-dockmanager>


//    return <IgcDockManager {...a}></IgcDockManager>;
}
*/
