import React, {Dispatch, PureComponent, ReactElement, ReactNode} from "react";
import { connect } from "react-redux";
import {DState} from "../../joiner";
import './example.scss';
import {DPointerTargetable, GObject, Log, LPointerTargetable, Pointer} from "../../joiner";
import {ExampleComponent} from "../../templateExample/example";
export let useless=1;
// todo: select a point by clicking inside a rectangle.
/*
// private
interface ThisState {
    hover: boolean;
    focus: boolean;
    x: number;
    y: number;
}

class PointInputComponent extends PureComponent<AllProps, ThisState>{
    static cname: string;


    constructor(props: AllProps, context: any) {
        super(props, context);
        this.state = {hover: false, focus: false, x: 0.5, y: 0.5};
        todo nmot 50% but getter(this.props.data, this.props.field)
        this.setState(this.state);
    }

    render(): ReactNode {
        let otherProps: GObject = {...this.props};
        let outerStyle = otherProps.style;
        delete otherProps.style;
        delete otherProps.setter;
        delete otherProps.getter;
        delete otherProps.label;
        delete otherProps.data;
        delete otherProps.field;
        delete otherProps.readonly;
        delete otherProps.tooltip;
        delete otherProps.markerPoint;
        let hover = this.state.hover || this.state.focus;
        if (!outerStyle.position) outerStyle.position = "relative";
        if (!outerStyle.display) outerStyle.display = "flex";
        if (!outerStyle.border) outerStyle.border = "1px solid gray";

        todo if  getter(this.props.data, this.props.field) !== this.state.x or y, setstate amd return <></> (empty)
        set state dr4agging in local state that doesn''t trigger the check above.
            do clickstart begin dragging the cursor following the mouse.
            clickend actuallt sets the val and sets dragging = false
        if (hover) {/*
            if (!outerStyle.height) outerStyle.height = this.props.hoverHeight || "200px";
            if (!outerStyle.width) outerStyle.width = this.props.hoverWidth || "200px";* /
            outerStyle.transform = "scale(" + (this.props.hoverScale || 10) + ")";
            outerStyle.transformOrigin = "center";
        }
        else {
            if (!outerStyle.height) outerStyle.height = "20px";
            if (!outerStyle.width) outerStyle.width = "20px";
        }
        let markerPoint: JSX.Element;
        let crossSize = this.props.crossSize || 4;
        if (!this.props.markerPoint) {
           markerPoint = <div style={{display:"flex", position:"absolute", pointerEvents:"none",
               top: "calc(" + this.state.y+"% - " + crossSize+"px)",
               left: "calc(" + this.state.x+"% - " + crossSize+"px)",
               backgroundImage:".... todo",
               width: crossSize + "px",
               height: crossSize + "px",
           }}></div>
        }
        else {
            Log.exDevv("custom markerPoint still unsupported, need to adjust his position after click.");
            markerPoint = this.props.markerPoint;
        }
        return (<>
            <div {...otherProps} style={outerStyle} tabIndex={-1}
                 onMouseEnter={() => this.setState({hover:true})}
                 onMouseLeave={() => this.setState({hover:false})}
                 onFocus={() => this.setState({focus:true})}
                 onBlur={() => this.setState({focus:false, hover: false})}>
                {markerPoint}
            </div>
        </>); }
}

// private
interface OwnProps {
    data: LPointerTargetable;
    field: string;
    getter?: (data: LPointerTargetable) => string;
    setter?: (value: string|boolean) => void;
    label?: JSX.Element;
    readonly?: boolean;
    tooltip?: JSX.Element;
    markerPoint?: JSX.Element;
    key?: React.Key | null;
    hoverScale?: number;
    crossSize?: number; // marker size where user clicks
    /*
    hoverWidth?: string; // like in css 15px or 5vw, 2em...
    hoverHeight?: string;* /
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

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    /// to fill
    return ret; }

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    /// to fill
    return ret; }


export const PointInput = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(PointInputComponent);

PointInputComponent.cname = "PointInputComponent";
PointInput.cname = "PointInput";
*/
