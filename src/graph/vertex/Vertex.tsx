import React, {CSSProperties, Dispatch, PureComponent, ReactNode} from "react";
import { connect } from "react-redux";
import {IStore, UserState} from "../../redux/store";
import './vertex.scss';
import {
    U,
    Size,
    GraphSize,
    Dictionary,
    Pointer,
    DModel,
    DModelElement,
    PointerTargetable,
    GObject,
    User, store, SetFieldAction, SetRootFieldAction, GraphElementRaw
} from "../../joiner";
import Overlap from "../../components/forEndUser/Overlap";
import {GraphElementStatee, GraphElementDispatchProps, GraphElementReduxStateProps, GraphElementOwnProps} from  "../graphElement/sharedTypes/sharedTypes";
import {windoww} from "../../joiner/types";

// private
class VertexStatee extends GraphElementStatee {
    vertexid!: string
    constructor(vertexID: string) { super(); this.vertexid = vertexID; }
    /*
    constructor(preRenderFunc: string | undefined, evalContext: GObject, templatefunc: () => React.ReactNode, id: string) {
        super(preRenderFunc, evalContext, templatefunc);
        this.vertexid = id;
    }*/
}

class VertexDragResizeRotateSelect<AllProps extends AllPropss, VertexState extends VertexStatee> extends GraphElementRaw<AllProps, VertexState>{
    static idMap: Dictionary<string, typeof VertexDragResizeRotateSelect>;//typeof DragResizeRotateConnected>;
    static staticInit(): void {
        VertexDragResizeRotateSelect.idMap = {};
        $(document).on('click', (e) => {
            const clicked: Element = e.target as unknown as Element;
            // const ancestors: Element[] = U.ancestorArray(clicked, undefined, true);
            const clickedVertex = (e.originalEvent as any).clickedOnVertex; // $(ancestors).filter('.vertex');
            if (!clickedVertex) {
                if (!e.shiftKey && !e.ctrlKey ) { this.clearSelection(); }
                return;
            }
            // the clicked on vertex part is handled in non-static handler
        });
    }
    ////// mapper func
    static mapStateToProps(state: IStore, ownProps: VertexOwnProps): VertexReduxStateProps {
        const superret: GraphElementReduxStateProps = GraphElementRaw.mapStateToProps(state, ownProps);
        const ret: VertexReduxStateProps = new VertexReduxStateProps();
        ////// begin vertex-specific code (currently none)
        return {...superret, ...ret};
    }

    static mapDispatchToProps(dispatch: Dispatch<any>): GraphElementDispatchProps {
        const superret: GraphElementDispatchProps = GraphElementRaw.mapDispatchToProps(dispatch);
        const ret: GraphElementDispatchProps = new GraphElementDispatchProps();
        return {...superret, ...ret};
    }

    addToSelection(mpid: Pointer<DModelElement>) {
        // to do redux on shared data (each user can have a different selection)
    }
    static clearSelection(): void {

    }
    private readonly parentRef: React.RefObject<HTMLDivElement>;

    constructor(props: AllProps, context: any) {
        super(props, context);
        if (!VertexDragResizeRotateSelect.idMap) { VertexDragResizeRotateSelect.staticInit(); }
        this.parentRef = React.createRef();
        const id = new PointerTargetable(false).id;
        VertexDragResizeRotateSelect.idMap[id] = this as any;
        this.setState({vertexid: id});
    }


    private onclick0(e: React.MouseEvent<HTMLDivElement>): void {
        (e.nativeEvent as any).clickedOnVertex = true;
        if (e.shiftKey || e.ctrlKey) {
            if (this.isSelected()) this.deselect();
            else this.addToSelection(this.getMpID());
            return;
        }
        this.clearCurrentUserSelection();
        this.select();
    }

    private onclick(e: React.MouseEvent<HTMLDivElement>): void {
        this.onclick0(e);
        this.props.onclick?.(e);
    }

    private getMpID(): Pointer<DModelElement> {
        return this.props.data.id;
    }
    private isSelected(byUser?: Pointer<User> & string): boolean { return this.props.view.transient.isSelected[byUser || User.current];}
    private deselect(): void {}

    componentDidMount(): void {
        super.componentDidMount();
        // send redux action to create vertex
    }
    componentWillUnmount(): void {
        // send redux action to delete vertex
    }

    render(): ReactNode {
        const size: Size | null = this.parentRef.current && Size.of(this.parentRef.current);
        const sizestyle: CSSProperties = {};
        sizestyle.transform = '';
        if (false && this.props.view.scalezoomy) sizestyle.transform += " scaleY(0.?)";
        else sizestyle.height = this.props.view.transient.private.size.h + "px";
        if (false && this.props.view.scalezoomx) sizestyle.transform += " scaleX(0.?)";
        else sizestyle.width = this.props.view.transient.private.size.w + "px";
        sizestyle.top = this.props.view.transient.private.size.y + "px";
        sizestyle.left = this.props.view.transient.private.size.x + "px";


        let classes: string[] = this.props.class ? (Array.isArray(this.props.class) ? this.props.class : [this.props.class]) : [];
        if (this.props.className) U.arrayMergeInPlace(classes, Array.isArray(this.props.className) ? this.props.className : [this.props.className])
        classes.push("vertex");
        if (this.isSelected()) classes.push("selected");
        return (<>
            <Overlap>
                <div id={this.state.vertexid} className={classes.join(' ')} ref={this.parentRef} onClick={this.onclick}
                style={{...this.props.style, ...sizestyle} }>
                    {
                        // this.props.children
                        super.render()
                    }
                </div>
                <div className={"vertex-controls"}>
                </div>
            </Overlap>
        </>); }

    private clearCurrentUserSelection() {

    }

    private select(forUser:Pointer<User, 0, 1> = null): void {
        if (!forUser) forUser = User.current;
        new SetRootFieldAction('users.' + forUser + ".selection[]", this.state.vertexid);
    }
}

// private
class VertexOwnProps extends GraphElementOwnProps {
    onclick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    // propsRequestedFromHtmlAsAttributes: string;
}
// private
class VertexReduxStateProps extends GraphElementReduxStateProps{
    // propsFromReduxStateOrOtherKindOfStateManagement: boolean; // flux or custom things too, unrelated to this.state of react.
}

// private
class VertexDispatchProps extends GraphElementDispatchProps {
    // propsFromReduxActions: typeof funzioneTriggeraAzioneDaImportare;
}


// private
type AllPropss = VertexOwnProps & VertexReduxStateProps & VertexDispatchProps;


const DragResizeRotateConnected = connect<VertexReduxStateProps, VertexDispatchProps, VertexOwnProps, IStore>(
    VertexDragResizeRotateSelect.mapStateToProps,
    VertexDragResizeRotateSelect.mapDispatchToProps
)(VertexDragResizeRotateSelect);
export const Vertex = DragResizeRotateConnected;



if (!windoww.mycomponents) windoww.mycomponents = {};
windoww.mycomponents.Vertex =  VertexDragResizeRotateSelect;
