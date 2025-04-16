
import React, {PureComponent, ReactElement, ReactNode} from "react";
import ReactDOM from "react-dom";
/*import "./jqx.base.css"
import "./jqx.darkblue.css"*/
import "./jqx.custom-styling.scss"
import "./smartdock.custom-styling.scss"/*
import 'jqwidgets-scripts/jqwidgets/styles/jqx.base.css';
import 'jqwidgets-scripts/jqwidgets/styles/jqx.material-purple.css';*/
import $ from "jquery";
import {Dictionary, DocString, GObject, Log} from "../../joiner";
import { DockingLayout } from 'smart-webcomponents-react/dockinglayout';

import {DockLayout, LayoutData} from 'rc-dock';
import { Slider } from 'smart-webcomponents-react/slider';
import { MultilineTextBox } from 'smart-webcomponents-react/multilinetextbox';

import { createRoot } from "react-dom/client";

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
