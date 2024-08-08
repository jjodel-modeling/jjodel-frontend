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
    U, LoggerCategoryState, RuntimeAccessible, Size
} from '../../joiner';
import './tooltip.scss';
class TooltipVisualizerState{
    tooltip?: ReactNode;
    baseElement?: Element;
    position?: boolean = false; // true = top, false = bottom
}
export class TooltipVisualizer extends React.Component<{}, TooltipVisualizerState> {
    public static component: TooltipVisualizer;
    constructor(){
        super({});
        this.state = new TooltipVisualizerState();
        TooltipVisualizer.component = this;
    }
    onMouseEnter(){
        TooltipVisualizer.component.setState({position: !TooltipVisualizer.component.state.position});
    }
    render(){
        if (!this.state.tooltip) return null;
        const style: GObject = {}
        if (this.state.baseElement){
            // todo: set top, left in pos:absolute according to baseElement
            //style.position = 'absolute';
            let size = Size.of(this.state.baseElement);
            style.left = 'min( 50vw, calc( '+size.x+'px - 50vw ))';
            style.top = 'min( 50vh, calc( '+size.y+'px - 50vh ))';
            // style.right = 'calc( 100vw - '+size.w+'px)';
            // currently center of tooltip is topleft of baseelem
        }

        console.log('tooltip', style, this.state)

        return <div className={"tooltip-wrapper " +
            (this.state.position ? "top" : "bottom")+
            (this.state.baseElement ? " inline" : " fixed")
        } onMouseEnter={this.onMouseEnter}
                    style={style}>
            {this.state.tooltip}</div>;
    }
}

@RuntimeAccessible('Tooltip')
export class Tooltip extends React.Component<AllProps, State> {
    static cname: string = "Tooltip";
    tooltip!: ReactNode;

    constructor(props: AllProps) {
        super(props);
        this.state = { };
        this.onMouseEnter = this.onMouseEnter.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);
    }
    public static show(tooltip: ReactNode, onTop?: boolean, baseElement?: Element): void{
        tooltip = Tooltip.fixTooltip(tooltip);
        const statepatch: Partial<TooltipVisualizerState> = {tooltip, baseElement};
        if (onTop !== undefined) statepatch.position = onTop;
        TooltipVisualizer.component.setState(statepatch);
    }
    public static hide(): void {
        TooltipVisualizer.component.setState({tooltip: undefined});
    }

    onMouseEnter(e?: MouseEvent): void{
        let inline = this.props.inline;
        let onTop = this.props.position === 'bottom' ? false : (this.props.position === 'top' ? true : undefined);
        Tooltip.show(this.tooltip, onTop, inline ? (this.childhtml || undefined) : undefined);
    }
    onMouseLeave(e?: MouseEvent): void{
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
interface OwnProps {
    key?: React.Key | null;
    catch?: ReactNode | ((error: Error, info?: React.ErrorInfo) => ReactNode);
    children: ReactNode;
    tooltip: ReactNode;
    inline?: boolean;
    position?: 'top' | 'bottom'; // missing means on global center-bottom. top or bottom means on top-bottom of child element (inline-like)
    // inline: boolean;
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
