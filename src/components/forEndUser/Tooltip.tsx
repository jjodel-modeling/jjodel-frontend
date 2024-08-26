import React, {
    Dispatch,
    isValidElement,
    KeyboardEvent,
    LegacyRef,
    ReactElement,
    ReactNode,
    Ref,
    RefObject
} from 'react';
import {connect} from 'react-redux';
import {DState} from '../../redux/store';
import {
    Defaults,
    DPointerTargetable,
    DV,
    GObject,
    Keystrokes,
    Log,
    LPointerTargetable,
    Overlap,
    Pointer, store,
    U, LoggerCategoryState, RuntimeAccessible, Size, Point
} from '../../joiner';
import './tooltip.scss';
import {IPoint, PositionStr, PositionStrTypes} from "../../common/Geom";

class TooltipVisualizerState{
    tooltip?: ReactNode;
    baseElement?: Element;
    position?: PositionStrTypes;
    offsetX?: number;
    offsetY?: number
    theme?: ThemeType;
    constructor() {
        this.position = 'b';
    }
}
export class TooltipVisualizer extends React.Component<{}, TooltipVisualizerState> {
    public static component: TooltipVisualizer;
    constructor(){
        super({});
        this.state = new TooltipVisualizerState();
        TooltipVisualizer.component = this;
    }
    onMouseEnter(){
        let position = PositionStr.invertPosStr(TooltipVisualizer.component.state.position ?? "b");
        TooltipVisualizer.component.setState({position});
    }

    private tooltip: HTMLElement | null = null;
    private root: HTMLElement | null = null;
    private innerText?: string;
    private tsize?: Size;
    private theme?: ThemeType;

    setRef(e: HTMLElement | null) { this.root = e; this.componentDidUpdate(); }
    componentDidMount(){
        return this.componentDidUpdate();
    }
    componentDidUpdate(){
        let e = this.root;
        if (!e) return;
        let innerText = e.innerText;
        if (innerText === this.innerText) return;
        this.innerText = innerText;
        this.tooltip = e.children[0] as any;
        this.tsize = this.tooltip ? Size.of(this.tooltip) : undefined;
        
        this.forceUpdate();
    }

    render(){
        let tooltip = this.state.tooltip;
        if (!tooltip) return null;
        const style: GObject = {};
        let position = this.state.position;
        let offsetX = this.state.offsetX || 0;
        let offsetY = this.state.offsetY || 0;
        let theme = this.state.theme;

        /* debug stuff override
        let positions = ['t', 'b', 'l', 'r', 'tl', 'tr', 'bl', 'br', ''] as any;
        let windoww = window as any
        position = positions[windoww.ii || 0];//Math.floor(Math.random()*positions.length)];
        offsetX = windoww.xx || 0;
        offsetY = windoww.yy || 0;*/
        if (this.state.baseElement){
            //style.position = 'absolute';
            let size = Size.of(this.state.baseElement);
            let tsize = this.tsize;
            let x = size.x;
            let y = size.y;
            let pos = PositionStr.fromPosString(position);
            x += (pos.x+1)/2 * size.w + pos.x * offsetX;
            y += (pos.y+1)/2 * size.h + pos.y * offsetY;
            // -1 -> 0
            // 0 -> 0.5
            // 1 -> 1

            let xmin = 'calc(' + size.w + 'px / 2 - 50vw)';
            let ymin = 'calc(' +  size.h + 'px / 2 - 50vh)';

            let xmax = 'calc(50vw - ' + size.w + 'px / 2)';
            let ymax = 'calc(50vh - ' +  size.h + 'px / 2)';

            let l = 'max(' + xmin + ', min(' + xmax +', calc( '+ x +'px - 50vw)))';
            let t = 'max(' + ymin + ', min(' + ymax + ', calc( '+ y +'px - 50vh)))';
            // style.left = l; style.top = t;
            style['--mid-x'] = 'calc(' + x + 'px - 50vw)';
            style['--mid-y'] = 'calc(' + y + 'px - 50vh)';
            style['--source-size-w'] = size.w + 'px';
            style['--source-size-h'] = size.h + 'px';
            if (tsize) {
                style['--size-w'] = tsize.w + 'px';
                style['--size-h'] = tsize.h + 'px';
            }
            console.log("inlinepos:", {position, pos, x, y, size, offsetX, offsetY, l, t});
            // style.right = 'calc( 100vw - '+size.w+'px)';
            // currently center of tooltip is topleft of baseelem
        }

        // wrapper cannot contain only rawtext without subelements to be rendered
        if (typeof tooltip !== 'object') tooltip = <div>{tooltip}</div>;
        if (Array.isArray(tooltip)) tooltip = tooltip.map(e => typeof e !== 'object' ? <div>{e}</div> : e)
        // NB: arrays are allowed but currently show elements in an horizontal line
        console.log('tooltip', style, this.state);
        // debugg stuff
        let tooltip2 = <div style={{...style, padding:0, width:0, height:0,  borderRadius: '100%'}} />; // border:'2px solid red',
        style.padding = 0;
        // debug stuff end

        return <>
            <div className={"tooltip-wrapper " +
                (PositionStr.toSeparateFullLabels(position ?? 't'))+
                (this.state.baseElement ? " inline" : " fixed")+ " "+
                (theme)
            } onMouseEnter={this.onMouseEnter}
                 style={style} ref={(e)=> this.setRef(e)}>
                {tooltip}</div>
            <div className={"tooltip-wrapper " +
                (PositionStr.toSeparateFullLabels(position ?? 't'))+
                (this.state.baseElement ? " inline" : " fixed")+ " "+
                (theme)
            } onMouseEnter={this.onMouseEnter}
                 style={style}>
        {tooltip2}</div>
        </>;
    }
}

@RuntimeAccessible('Tooltip')
export class Tooltip extends React.Component<AllProps, State> {
    static cname: string = "Tooltip";
    tooltip!: ReactNode;

    constructor(props: AllProps) {
        super(props);
        this.state = {};
        this.onMouseEnter = this.onMouseEnter.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);
    }

    public static show(tooltip: ReactNode, pos?: PositionStrTypes, baseElement?: Element, seconds: number = -1, offset?: IPoint, theme?: ThemeType): void{
        tooltip = Tooltip.fixTooltip(tooltip);
        const statepatch: Partial<TooltipVisualizerState> = {tooltip, baseElement, offsetX: offset?.x ?? 0, offsetY: offset?.y ?? 0, theme};
         statepatch.position = pos ?? 'b';
        TooltipVisualizer.component.setState(statepatch);
        if (seconds>0) setTimeout( () => {
            if (TooltipVisualizer.component.state.tooltip !== tooltip) return;
            if (TooltipVisualizer.component.state.baseElement !== baseElement) return;
            TooltipVisualizer.component.setState({tooltip: undefined, baseElement: undefined, offsetX: 0, offsetY: 0});
            }, seconds * 1000);
    }

    public static hide(): void {
        TooltipVisualizer.component.setState({tooltip: undefined});
    }

    onMouseEnter(e?: MouseEvent): void{
        let inline = this.props.inline;
        let x = this.props.offsetX;
        let y = this.props.offsetY;
        let offset: Point | undefined = (x || x === 0) || (y || y === 0) ? new Point(this.props.offsetX || 0, this.props.offsetY || 0) : undefined;
        Tooltip.show(this.tooltip, this.props.position, inline ? (this.childhtml || undefined) : undefined, -1, offset);

        if (this.props.seconds) {
            setTimeout(()=>this.onMouseLeave(e), this.props.seconds);
        }
    }
    onMouseLeave(e?: MouseEvent): void{
        if (this.props.seconds) return;
        Tooltip.hide();
    }

    componentWillUnmount() {
        this.onMouseLeave();
    }
    private static fixTooltip(t: ReactNode): ReactNode{
        return t;
        // const onMouseEnter = Tooltip.mergeEvents(t, "onMouseEnter", ()=> TooltipVisualizer.component.setState({position: !TooltipVisualizer.component.position}));
        //return React.cloneElement(t, {onMouseEnter});
    }
    private static mergeEvents(c: React.ReactElement<any, string | React.JSXElementConstructor<any>> | React.ReactPortal, key: string, func: (...a:any)=>any): ((...a:any)=>any) {
        if (!c.props[key]) return func;

        let evt = (...a:any[])=>{
            let ret: any = undefined;
            if (typeof c.props[key] !== "function") Log.ww("<Tooltip /> component requires his child to have "+key+" props either missing or a valid function");
            else { ret = c.props[key](...a); }
            func(...a);
            return ret;
        }
        return evt;

    }
    childhtml: Element | null = null;

    render() {
        if (!this.props.tooltip) return this.props.children;
        if (Array.isArray(this.props.children)) return <span>
            &lt;Tooltip /&gt; component requires exactly 1 element as children. Wrap the subelements in a container element.
        </span>
        if (!this.props.children || !isValidElement(this.props.children)) return <span>
            &lt;Tooltip /&gt; component requires a html or react node as children.
        </span>
        for (let k of Object.keys(this.props)) switch (k){
            default: Log.ww('<Tooltip /> component cannot accept props other than "key", "position", and "tooltip".'); break;
            case 'children': case 'key': case 'tooltip': case 'position': break;
            // case "inline": break;
        }
        this.tooltip = Tooltip.fixTooltip(this.props.tooltip);

        let c = this.props.children;
        const onMouseEnter = Tooltip.mergeEvents(c, 'onMouseEnter', this.onMouseEnter);
        const onMouseLeave = Tooltip.mergeEvents(c, 'onMouseLeave', this.onMouseLeave);
        let ref: Ref<Element> | undefined = undefined;
        if (c.props.ref) {
            const pref = c.props.ref;
            switch(typeof pref){
                case "object": this.childhtml = (pref as RefObject<Element>).current; break;
                case "function": ref = (e: Element, ...a:any)=> { pref(e, a); this.childhtml = e;}; break;
                case "string": Log.ee("Found React-ref of type string in Tooltip children which is unsupported. Use object or funcional refs."); break;
            }
        } else ref = ((ref: Element | null) => { this.childhtml = ref; } );

        const injectProps: GObject = {onMouseEnter, onMouseLeave};
        if (ref) injectProps.ref = ref;
        let ret = React.cloneElement(c, injectProps);
        return ret;
    }

}
interface State{
}

type ThemeType = 'default' | 'dark';

interface OwnProps {
    key?: React.Key | null;
    catch?: ReactNode | ((error: Error, info?: React.ErrorInfo) => ReactNode);
    children: ReactNode;
    tooltip: ReactNode;
    inline?: boolean;
    offsetX?: number;
    offsetY?: number;
    position?: PositionStrTypes;
    seconds?: number;
    theme?: ThemeType;
}
interface StateProps {
}
interface DispatchProps { }
type AllProps = Overlap<OwnProps, Overlap<StateProps, DispatchProps>>;


// const TooltipConnected = connect<StateProps, DispatchProps, OwnProps, DState>(mapStateToProps, mapDispatchToProps)(TooltipComponent);


// export function Tooltip(props: OwnProps): ReactElement { return <TooltipConnected {...{...props}}>{props.children}</TooltipConnected>; }

//TooltipComponent.cname = 'TooltipComponent';
//TooltipConnected.cname = 'TooltipConnected';
Tooltip.cname = 'Tooltip';
