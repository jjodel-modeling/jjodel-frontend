import type {GObject} from "../../joiner";
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
    DUser, RuntimeAccessible, $, DPointerTargetable
} from "../../joiner";

@RuntimeAccessible
export class GraphDragHandler extends RuntimeAccessibleClass {
    public static singleton: GraphDragHandler;
    // static idMap: Dictionary<string, typeof GraphElementRaw>;
    public static isDragging: boolean = false;
    private currentSelection: Pointer<DGraphElement,1,'N'> = [];
    private draggingSelection: DVoidVertex[] = [];
    public vertexToComponent: Dictionary<Pointer<DGraphElement, 1, 1, LGraphElement>, GObject> = {}; // VertexComponent
    private totalDragOffset: Point; // NOT graphpoint, this is pixels
    private dragTolerance = 10; // if less than 10 pixel i won't start the drag
    // public static mousedownStartDragOn?: Pointer<DVoidVertex, 1, 1, LVoidVertex>; // per iniziare il drag non basta mousemove & mousedown & selezione. il mousedown dev'essere partito da un vertice.
    constructor() {
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
    public startDragging(): void {
        GraphDragHandler.isDragging = true;
        // this.totalDragOffset.set(0, 0);
        let state: IStore =  store.getState();
        this.draggingSelection = Selectors.getVertex(false, true).filter( (v) => v.isSelected[DUser.current]);
    }

    public stopDragging(): void {
        GraphDragHandler.isDragging = false;
        this.totalDragOffset.set(0, 0);
    }
    private onMouseMove = (e: JQuery.MouseMoveEvent<Document, undefined, Document, Document>, ...args: any[]): any => {
        if (!GraphDragHandler.isDragging) return;
        let dragged: DVoidVertex;
        const offset: Point = new Point(e.offsetX, e.offsetY);
        this.totalDragOffset.add(offset, false);
        if (this.totalDragOffset.absolute() < this.dragTolerance) return;
        for (dragged of this.draggingSelection) {
            let component = this.vertexToComponent[dragged.id];
            // if (!component) continue;
            component?.vertexGotMoved(offset);
        }
        return;
    }


    clearSelection = (forUser:Pointer<DUser, 0, 1> = null, forGraph: Pointer<DGraphElement>): void  => {
        console.log('CLEAR VERTEX SELECTION');
        const user: string = forUser || DUser.current;
        const nodes: DGraphElement[] = (Selectors.getSubNodeElements(forGraph, false, false) as DGraphElement[]).filter( (n: DGraphElement) => n.isSelected[user]);
        TRANSACTION( () => {
            for (let node of nodes) {
                DPointerTargetable.wrap<DGraphElement, LGraphElement>(node).isSelected[user] = false;
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
