import type {GObject, VertexComponent} from "../../joiner";
import {
    ClickEvent,
    DGraphElement,
    Dictionary, DVertex, DViewElement, DVoidEdge, DVoidVertex, getPath,
    IStore, LGraphElement, LVoidVertex, Point,
    Pointer,
    RuntimeAccessibleClass,
    Selectors,
    SetRootFieldAction,
    store,
    TRANSACTION,
    DUser, RuntimeAccessible, $, DPointerTargetable, Log, MyProxyHandler, Size, U
} from "../../joiner";
import React from "react";

const debug: boolean = false;
@RuntimeAccessible
export class GraphDragHandler extends RuntimeAccessibleClass {
    public static singleton: GraphDragHandler;
    // static idMap: Dictionary<string, typeof GraphElementRaw>;
    public static isDragging: boolean = false;
    private currentSelection: Pointer<DGraphElement,1,'N'> = [];
    public draggingSelection: DVoidVertex[] = [];
    public vertexToComponent: Dictionary<Pointer<DGraphElement, 1, 1, LGraphElement>, GObject> = {}; // VertexComponent
    private totalDragOffset: Point; // NOT graphpoint, this is pixels
    private startDragClickedPoint!: Point; // NOT graphpoint, this is pixels
    private dragTolerance = 10; // if less than 10 pixel i won't start the drag


    public static init() {
        new GraphDragHandler();
    }
    // public static mousedownStartDragOn?: Pointer<DVoidVertex, 1, 1, LVoidVertex>; // per iniziare il drag non basta mousemove & mousedown & selezione. il mousedown dev'essere partito da un vertice.
    protected constructor() {
        super();
        GraphDragHandler.singleton = this;
        // GraphDragHandler.idMap = {};
        $(document)
            .on('click', this.onClick)
            .on('mouseup', this.onMouseUp)
            .on('mousemove', this.onMouseMove);
        GraphDragHandler.isDragging = false;
        this.totalDragOffset = new Point(0 ,0);
    }
/*
    public onMouseMove(e: JQuery.MouseMoveEvent): void {
        if (!GraphDragHandler.mousedownStartDragOn) return;

    }*/
    private onMouseUp = (e: JQuery.MouseUpEvent): void => {
        if (e.shiftKey || e.ctrlKey) return;
        this.stopDragging();
    }

    private onClick = (e: ClickEvent, ...args: any[]): any => {
        const clicked: Element = e.target as unknown as Element;
        // const ancestors: Element[] = U.ancestorArray(clicked, undefined, true);
        const clickedVertex = (e.originalEvent as any).clickedOnVertex; // $(ancestors).filter('.vertex');
        if (clickedVertex) return;         // the clicked on vertex part is handled in non-static handler
        const graphid = (e.originalEvent as any).graphid; // todo: devi iniettarlo in un eventlistener di GraphComponent, anzi, sposta tutta la funzione dentro GraphComponent
        if (!graphid) return; // clicked outside any graph.
        if (!e.shiftKey && !e.ctrlKey) { this.clearSelection(null, graphid); }
        return;
    }


    // todo: add on mousedown su GraphElementRaw per triggerare startDragging
    public startDragging(e:React.MouseEvent<HTMLDivElement>, manualAddLastSelected?: DVoidVertex): void {
        Log.i(true, 'dragx start', {draggingSelection: this.draggingSelection, thiss:this});
        console.log('vertex evt mousedown dragx start', {draggingSelection: this.draggingSelection, thiss:this});
        GraphDragHandler.isDragging = true;
        this.startDragClickedPoint = new Point(e.screenX, e.screenY);
        // this.totalDragOffset.set(0, 0);
        // let state: IStore =  store.getState();
        this.draggingSelection = Selectors.getVertex(false, true).filter( (v) => v.isSelected[DUser.current]);
        if (manualAddLastSelected) U.ArrayAdd(this.draggingSelection, manualAddLastSelected);
    }

    public stopDragging(): void {
        console.log('vertex evt mousedown dragx stop', {draggingSelection: this.draggingSelection, thiss:this});
        Log.i(debug, 'dragx stop', {draggingSelection: this.draggingSelection, thiss:this});
        GraphDragHandler.isDragging = false;
        this.totalDragOffset.set(0, 0);
    }

    private onMouseMove = (e: JQuery.MouseMoveEvent<Document, undefined, Document, Document>, ...args: any[]): any => {
        // Log.i(debug, 'dragx dragging check: ' + GraphDragHandler.isDragging);
        if (!GraphDragHandler.isDragging) return;
        function getOffset() {
            // return new Point(e.offsetX, e.offsetY);
            return new Point(e.screenX, e.screenY);

            Log.i(debug, 'dragx dragging getoffset: ', {child:e.currentTarget, e});
            let parent = e.currentTarget.parentElement;
            let parentsize = Size.of(parent as any);
            let childsize = e.currentTarget && Size.of(e.currentTarget as any);
            Log.i(debug, 'dragx dragging getoffset: ', {parent, child:e.currentTarget, parentSize:{...parentsize}, childSize:{...childsize}});
            return childsize.subtract(parentsize).tl(); }

        const mouseposAbsolute: Point = new Point(e.screenX, e.screenY);
        const offset: Point = mouseposAbsolute.subtract(this.startDragClickedPoint, false);
        Log.i(true, 'dragx dragging : ' + offset, {draggingSelection: this.draggingSelection, totalOffset: this.totalDragOffset.toString(), e, offset});
        let dragged: DVoidVertex;
        this.totalDragOffset  = offset; // this.totalDragOffset.add(offset, false);
        if (this.totalDragOffset.absolute() < this.dragTolerance) return;
        for (dragged of this.draggingSelection) {
            let component = this.vertexToComponent[dragged.id];
            // Log.i(debug, 'dragx dragging component', {component});
            if (!component) continue; // got unmounted before deselecting
            component?.setAbsolutePosition(offset);
        }
        return;
    }


    clearSelection = (forUser:Pointer<DUser, 0, 1> = null, forGraph: Pointer<DGraphElement>): void  => {
        console.log('CLEAR VERTEX SELECTION');
        const user: string = forUser || DUser.current;
        const nodes: DGraphElement[] = (Selectors.getSubNodeElements(forGraph, false, false) as DGraphElement[]).filter( (n: DGraphElement) => n.isSelected[user]);
        TRANSACTION( () => {
            for (let node of nodes) {
                let proxy = MyProxyHandler.wrap<DGraphElement, LGraphElement>(node);
                if (proxy) proxy.isSelected[user] = false;
                // new SetRootFieldAction('idlookup.' + view.id + '.' + (getPath as DViewElement).__transient.isSelected[forUser].$, false);
            }
        });
    }
    /*
    onClick = (e: string) => {
    const clicked: Element = e.target as unknown as Element;
    // const ancestors: Element[] = U.ancestorArray(clicked, undefined, true);
    const clickedVertex = (e.originalEvent as any).clickedOnVertex; // $(ancestors).filter('.vertex');
    if (!clickedVertex) {
    if (!e.shiftKey && !e.ctrlKey ) { this.clearSelection(); }
return;
}*/
// the clicked on vertex part is handled in non-static handler

}
