import type { GObject, Temporary, TODO} from "../joiner";
import {DPointerTargetable, RuntimeAccessible, windoww, Log} from "../joiner";

@RuntimeAccessible
export abstract class IPoint extends DPointerTargetable {
    x!: number;
    y!: number;

    static getM? = function(firstPt: IPoint, secondPt: IPoint): number { return (firstPt.y - secondPt.y) / (firstPt.x - secondPt.x); }
    // @ts-ignore static getM is not null but must be declared nullable to achieve subclass mixing
    static getQ? = function(firstPt: IPoint, secondPt: IPoint): number { return firstPt.y - (IPoint.getM(firstPt, secondPt) * firstPt.x);  }

    constructor(x: number = 0, y: number = 0) {
        super('dwc');
        IPoint.init_constructor(this, x, y);
    }

    static init_constructor(thiss: GObject, x: any = 0, y: any = 0, ...a: any): void {
        thiss.id = "POINT_" + (DPointerTargetable.maxID++) + "_" + new Date().getTime();
        thiss.className = thiss.constructor.name;
        if (x === null) thiss.x = null as Temporary;
        else if (isNaN(+x)) { thiss.x = 0; }
        else thiss.x = +x;
        if (y === null) thiss.y = null as Temporary;
        else if (isNaN(+y)) { thiss.y = 0; }
        else thiss.y = +y;
        thiss.className = this.name;
    }

    toString(): string { return '(' + this.x + ', ' + this.y + ')'; }
    clone(other: { x: number, y: number }): this { this.x = other.x; this.y = other.y; return this; }

    abstract new(): this;
    duplicate(): this { const ret = this.new(); ret.clone(this); return ret; }

    subtract(p2: IPoint, newInstance: boolean): this {
        Log.e(!p2, 'subtract argument must be a valid point: ', p2);
        let p1: this;
        if (!newInstance) { p1 = this; } else { p1 = this.duplicate(); }
        p1.x -= p2.x;
        p1.y -= p2.y;
        return p1; }

    add(p2: IPoint, newInstance: boolean): this {
        Log.e(!p2, 'add argument must be a valid point: ', p2);
        let p1: this;
        if (!newInstance) { p1 = this; } else { p1 = this.duplicate(); }
        p1.x += p2.x;
        p1.y += p2.y;
        return p1; }

    addAll(p: IPoint[], newInstance: boolean): this {
        let i;
        let p0: this;
        if (!newInstance) { p0 = this; } else { p0 = this.duplicate(); }
        for (i = 0; i < p.length; i++) { p0.add(p[i], true); }
        return p0; }

    subtractAll(p: this[], newInstance: boolean): this {
        let i;
        let p0: this;
        if (!newInstance) { p0 = this; } else { p0 = this.duplicate(); }
        for (i = 0; i < p.length; i++) { p0.subtract(p[i], true); }
        return p0; }

    multiply(pt: this, newInstance: boolean = false): this {
        let ret: this = (newInstance ? this.duplicate() : this);
        ret.x *= pt.x;
        ret.y *= pt.y;
        return ret; }

    divide(pt: this, newInstance: boolean = false): this {
        let ret = (newInstance ? this.duplicate() : this);
        ret.x /= pt.x;
        ret.y /= pt.y;
        return ret; }

    multiplyScalar(scalar: number, newInstance: boolean): this {
        Log.e(isNaN(+scalar), 'IPoint.multiply()', 'scalar argument must be a valid number: ', scalar);
        let p1: this;
        if (!newInstance) { p1 = this; } else { p1 = this.duplicate(); }
        p1.x *= scalar;
        p1.y *= scalar;
        return p1; }

    divideScalar(scalar: number, newInstance: boolean): this {
        Log.e(isNaN(+scalar), 'IPoint.divide()', 'scalar argument must be a valid number: ', scalar);
        let p1: this;
        if (!newInstance) { p1 = this; } else { p1 = this.duplicate(); }
        p1.x /= scalar;
        p1.y /= scalar;
        return p1; }

    isInTheMiddleOf(firstPt: this, secondPt: this, tolleranza: number): boolean {
        const rectangle: Size = Size.fromPoints(firstPt, secondPt);
        const tolleranzaX = tolleranza; // actually should be cos * arctan(m);
        const tolleranzaY = tolleranza; // actually should be sin * arctan(m);
        if (this.x < rectangle.x - tolleranzaX || this.x > rectangle.x + rectangle.w + tolleranzaX) { return false; }
        if (this.y < rectangle.y - tolleranzaX || this.y > rectangle.y + rectangle.h + tolleranzaY) { return false; }
        // const m = IPoint.getM(firstPt, secondPt);
        // const q = IPoint.getQ(firstPt, secondPt);
        const lineDistance = this.distanceFromLine(firstPt, secondPt);
        // console.log('distance:', lineDistance, ', this:', this, ', p1:', firstPt, ', p2:', secondPt);
        return lineDistance <= tolleranza; }

    distanceFromLine(p1: IPoint, p2: IPoint): number {
        const top: number =
            + (p2.y - p1.y) * this.x
            - (p2.x - p1.x) * this.y
            + p2.x * p1.y
            - p1.x * p2.y;
        const bot =
            (p2.y - p1.y) * (p2.y - p1.y) +
            (p2.x - p1.x) * (p2.x - p1.x);
        return Math.abs(top) / Math.sqrt(bot);  }

    equals(pt: IPoint, tolleranzaX: number = 0, tolleranzaY: number = 0): boolean {
        if (pt === null) { return false; }
        return Math.abs(this.x - pt.x) <= tolleranzaX && Math.abs(this.y - pt.y) <= tolleranzaY; }

    moveOnNearestBorder(startVertexSize: ISize, clone: boolean, graph: TODO/*IGraph*/, debug: boolean = true): IPoint {
        const pt: IPoint = clone ? this.duplicate() : this;
        const tl: IPoint = startVertexSize.tl();
        const tr: IPoint = startVertexSize.tr();
        const bl: IPoint = startVertexSize.bl();
        const br: IPoint = startVertexSize.br();
        const L: number = pt.distanceFromLine(tl, bl);
        const R: number = pt.distanceFromLine(tr, br);
        const T: number = pt.distanceFromLine(tl, tr);
        const B: number = pt.distanceFromLine(bl, br);
        const min: number = Math.min(L, R, T, B);
        if (min === L) { pt.x = tl.x; }
        if (min === R) { pt.x = tr.x; }
        if (min === T) { pt.y = tr.y; }
        if (min === B) { pt.y = br.y; }
        if (debug && graph && pt instanceof GraphPoint) { graph.markg(pt, false, 'purple'); }
        return pt; }

    getM(pt2: IPoint): number { return IPoint.getM?.(this, pt2) as unknown as number; }

    degreeWith(pt2: IPoint, toRadians: boolean): number {
        const directionVector: IPoint = this.subtract(pt2, true);
        const ret: number = Math.atan2(directionVector.y, directionVector.x);
        return toRadians ? ret : windoww.U.RadToDegree(ret); }

    absolute(): number { return Math.sqrt(this.x * this.x + this.y * this.y); }
    set(x: number, y: number) { this.x = x; this.y = y; }
}

@RuntimeAccessible
export class GraphPoint extends IPoint{
    dontmixwithPoint: any;
    static fromEvent(e: JQuery.ClickEvent | JQuery.MouseMoveEvent | JQuery.MouseUpEvent | JQuery.MouseDownEvent | JQuery.MouseEnterEvent | JQuery.MouseLeaveEvent | JQuery.MouseEventBase)
        : GraphPoint | null {
        if (!e) { return null; }
        const p: Point = new Point(e.pageX, e.pageY);
        const g: any = null;
        throw new Error("todo: const g: IGraph = Status.status.getActiveModel().graph;");
        return g.toGraphCoord(p); }

    new(): this { return new GraphPoint() as this;}
    /* duplicate(): this { return new GraphPoint(this.x, this.y) as this; }/*
    clone(other: this): void { this.x = other.x; this.y = other.y; }
    subtract(p2: this, newInstance: boolean): GraphPoint { return super.subtract(p2, newInstance) as GraphPoint; }
    add(p2: GraphPoint, newInstance: boolean): GraphPoint { return super.add(p2, newInstance) as GraphPoint; }
    multiply(scalar: number, newInstance: boolean): GraphPoint { return super.multiply(scalar, newInstance) as GraphPoint; }
    divide(scalar: number, newInstance: boolean): GraphPoint { return super.divide(scalar, newInstance) as GraphPoint; }
    isInTheMiddleOf(firstPt: GraphPoint, secondPt: GraphPoint, tolleranza: number): boolean { return super.isInTheMiddleOf(firstPt, secondPt, tolleranza); }
    distanceFromLine(p1: GraphPoint, p2: GraphPoint): number { return super.distanceFromLine(p1, p2); }
    equals(pt: GraphPoint, tolleranzaX: number = 0, tolleranzaY: number = 0): boolean { return super.equals(pt, tolleranzaX, tolleranzaY); }
    moveOnNearestBorder(startVertexSize: GraphSize, clone: boolean, debug: boolean = true): GraphPoint {
        return super.moveOnNearestBorder(startVertexSize, clone, debug) as GraphPoint; }
    getM(pt2: GraphPoint): number { return super.getM(pt2); }
    degreeWith(pt2: GraphPoint, toRadians: boolean): number { return super.degreeWith(pt2, toRadians); }*/

}

@RuntimeAccessible
export class Point extends IPoint{
    dontmixwithGPoint: any;
    /// https://stackoverflow.com/questions/6073505/what-is-the-difference-between-screenx-y-clientx-y-and-pagex-y
    /*static fromEvent(e: JQuery.ClickEvent | JQuery.MouseMoveEvent | JQuery.MouseUpEvent | JQuery.MouseDownEvent | JQuery.MouseEnterEvent | JQuery.MouseLeaveEvent | JQuery.MouseEventBase)
        : Point {
        const p: Point = new Point(e.pageX, e.pageY);
        return p; }*/

    new(): this { return new Point() as this;}
    /* duplicate(): this { return new Point(this.x, this.y) as this; }
    /*
    subtract(p2: Point, newInstance: boolean): Point { return super.subtract(p2, newInstance) as Point; }
    add(p2: Point, newInstance: boolean): Point { return super.add(p2, newInstance) as Point; }
    // multiplyScalar(scalar: number, newInstance: boolean): Point { sdhfgmj }

    // divideScalar(scalar: number, newInstance: boolean): Point { gdhfg }
    isInTheMiddleOf(firstPt: Point, secondPt: Point, tolleranza: number): boolean { return super.isInTheMiddleOf(firstPt, secondPt, tolleranza); }
    distanceFromLine(p1: Point, p2: Point): number { return super.distanceFromLine(p1, p2); }
    equals(pt: Point, tolleranzaX: number = 0, tolleranzaY: number = 0): boolean { return super.equals(pt, tolleranzaX, tolleranzaY); }
    moveOnNearestBorder(startVertexSize: GraphSize, clone: boolean, debug: boolean = true): Point {
        return super.moveOnNearestBorder(startVertexSize, clone, debug) as Point; }
    getM(pt2: Point): number { return super.getM(pt2); }
    degreeWith(pt2: Point, toRadians: boolean): number { return super.degreeWith(pt2, toRadians); }*/

}


@RuntimeAccessible
export abstract class ISize<PT extends IPoint = IPoint> extends DPointerTargetable {
    x!: number;
    y!: number;
    w!: number;
    h!: number;
    constructor(x: number = 0, y: number = 0, w: number = 0, h: number = 0) {
        super('dwc');
        // do not override any fields from the DPointerTargetable, otherwise the ! in the override will reinizialize the attribute
        // erasing the value set in super or in the functions called by the constructor as side effect (static_init called from constructor will be overridden too)
        // if need to override types, build the "new" static function like in DModelElement
        ISize.init_constructor(this, x, y, w, h);
    }

    static init_constructor(thiss: GObject, x: any = 0, y: any = 0, w: any = 0, h: any = 0, ...a: any): void {
        thiss.id = "SIZE_" + (DPointerTargetable.maxID++) + "_" + new Date().getTime();
        thiss.className = thiss.constructor.name;
        if (x === null) thiss.x = null as Temporary;
        else if (isNaN(+x)) { thiss.x = 0; }
        else thiss.x = +x;
        if (y === null) thiss.y = null as Temporary;
        else if (isNaN(+y)) { thiss.y = 0; }
        else thiss.y = +y;
        if (w === null) thiss.w = null as Temporary;
        else if (isNaN(+w)) { thiss.w = 0; }
        else thiss.w = +w;
        if (h === null) thiss.h = null as Temporary;
        else if (isNaN(+h)) { thiss.h = 0; }
        else thiss.h = +h;
        thiss.className = this.name; }

    toString(): string { return JSON.stringify({x: this.x, y: this.y, w: this.w, h: this.h}); }

    set(x?: number, y?: number, w?: number, h?: number): void {
        if (x !== undefined) (this.x = +x);
        if (y !== undefined) (this.y = +y);
        if (w !== undefined) (this.w = +w);
        if (h !== undefined) (this.h = +h);
    }

    abstract makePoint(x: number, y: number): PT;
    abstract new(): this;
    clone(json: this): this { this.x = json.x; this.y = json.y; this.w = json.w; this.h = json.h; return this; }
    duplicate(): this { return this.new().clone(this); }

    add(pt2: this | PT): void {
        this.x += pt2.x;
        this.y += pt2.y;
        if (!('w' in pt2)) return;
        this.w += (pt2 as ISize).w;
        this.h += (pt2 as ISize).h; }

    subtract(pt2: this | PT): this {
        this.x -= pt2.x;
        this.y -= pt2.y;
        if (!('w' in pt2)) return this;
        this.w -= (pt2 as ISize).w;
        this.h -= (pt2 as ISize).h; return this; }

    multiply(pt2: this | PT): void {
        this.x *= pt2.x;
        this.y *= pt2.y;
        if (!('w' in pt2)) return;
        this.w *= (pt2 as ISize).w;
        this.h *= (pt2 as ISize).h; }

    divide(pt2: this | PT): void {
        this.x /= pt2.x;
        this.y /= pt2.y;
        if (!('w' in pt2)) return;
        this.w /= (pt2 as ISize).w;
        this.h /= (pt2 as ISize).h; }

    tl(): PT { return this.makePoint(   this.x,             this.y         ); }
    tr(): PT { return this.makePoint(this.x + this.w,    this.y         ); }
    bl(): PT { return this.makePoint(   this.x,          this.y + this.h); }
    br(): PT { return this.makePoint(this.x + this.w, this.y + this.h); }
    equals(size: this): boolean { return this.x === size.x && this.y === size.y && this.w === size.w && this.h === size.h; }
    /// field-wise Math.min()
    min(minSize: this, clone: boolean): this {
        const ret: this = clone ? this.new() : this;
        if (!isNaN(minSize.x) && ret.x < minSize.x) { ret.x = minSize.x; }
        if (!isNaN(minSize.y) && ret.y < minSize.y) { ret.y = minSize.y; }
        if (!isNaN(minSize.w) && ret.w < minSize.w) { ret.w = minSize.w; }
        if (!isNaN(minSize.h) && ret.h < minSize.h) { ret.h = minSize.h; }
        return ret; }
    max(maxSize: this, clone: boolean): this {
        const ret: this = clone ? this.new() : this;
        if (!isNaN(maxSize.x) && ret.x > maxSize.x) { ret.x = maxSize.x; }
        if (!isNaN(maxSize.y) && ret.y > maxSize.y) { ret.y = maxSize.y; }
        if (!isNaN(maxSize.w) && ret.w > maxSize.w) { ret.w = maxSize.w; }
        if (!isNaN(maxSize.h) && ret.h > maxSize.h) { ret.h = maxSize.h; }
        return ret; }

    intersection(size: this): this | null {
        // anche "isinside"
        let startx, starty, endx, endy;
        startx = Math.max(this.x, size.x);
        starty = Math.max(this.y, size.y);
        endx = Math.min(this.x + this.w, size.x + size.w);
        endy = Math.min(this.y + this.h, size.y + size.h);
        const intersection: this = this.new();
        // intersection.set(0, 0, 0, 0);
        intersection.x = startx;
        intersection.y = starty;
        intersection.w = endx - startx;
        intersection.h = endy - starty;
        const doesintersect: boolean = intersection.w > 0 && intersection.h > 0;
        return (doesintersect) ? intersection: null; }

    contains(pt: PT): boolean {
        return  pt.x >= this.x && pt.x <= this.x + this.w && pt.y >= this.y && pt.y <= this.y + this.h; }

    isOverlapping(size2: this): boolean { return !!this.intersection(size2); }
    isOverlappingAnyOf(sizes: this[]): boolean {
        if (!sizes) return false;
        for (let size of sizes) { if (this.isOverlapping(size)) return true; }
        return false;
    }

    multiplyPoint(other: PT, newInstance: boolean): this {
        const ret: this = newInstance ? this.new() : this;
        ret.x *= other.x;
        ret.w *= other.x;
        ret.y *= other.y;
        ret.h *= other.y;
        return ret; }

    dividePoint(other: PT, newInstance: boolean): this {
        const ret: this = newInstance ? this.new() : this;
        ret.x /= other.x;
        ret.w /= other.x;
        ret.y /= other.y;
        ret.h /= other.y;
        return ret; }

    boundary(size2: this): void {
        /*let minx, maxx, miny, maxy;
        if (size2.y < this.y) { miny = size2.y; /*maxy = this.y;* / } else { miny = this.y; /*maxy = size2.y;* / }
        if (size2.x < this.x) { minx = size2.y; /*maxx = this.x;* / } else { minx = this.x; /*maxy = size2.x;* / }
        if (size2.y + size2.h < this.y + this.h) maxy = this.y + this.h; else maxy = size2.y + size2.h;
        if (size2.x + size2.w < this.x + this.w) maxx = this.x + this.w; else maxx = size2.x + size2.w;
        */
        this.h = (size2.y + size2.h > this.y + this.h ? size2.y + size2.h : this.y + this.h); // -miny
        this.w = (size2.x + size2.w > this.x + this.w ? size2.x + size2.w : this.x + this.w); // -minx
        if (this.y < size2.y) this.y = size2.y;
        if (this.x < size2.x) this.x = size2.x;
        this.h -= this.y;
        this.w -= this.x;
    }
}

@RuntimeAccessible
export class Size extends ISize<Point> {
    private static sizeofvar: HTMLElement;
    private static $sizeofvar: JQuery<HTMLElement>;

    public static of(element0: Element, debug: boolean = false): Size {
        let element: HTMLElement = element0 as HTMLElement;
        Log.l(debug, 'sizeof()',  element);
        Log.e(element as any === document, 'trying to measure document.');
        if (element as any === document) { element = document.body as any; }
        const $element = $(element);
        Log.e(!element || element.tagName === 'foreignObject', 'sizeof()', 'SvgForeignElementObject have a bug with size, measure a child instead.', element);
        let tmp;
        let size: Size;
        if (!Size.sizeofvar) {
            Size.sizeofvar = document.createElement('div');
            document.body.append(Size.sizeofvar); }

        const isOrphan = element.parentNode === null;
        // var visible = element.style.display !== 'none';
        // var visible = $element.is(":visible"); crea bug quando un elemento è teoricamente visibile ma orfano
        const ancestors =  windoww.U.ancestorArray(element);
        const displayStyles: string[] = ancestors.map( (e: HTMLElement) => e?.style?.display);
        if (isOrphan) { Size.sizeofvar.append(element); }
        // show all and saveToDB visibility to restore it later
        for (let i = 0; i < ancestors.length; i++) { // document has undefined style
            displayStyles[i] = ancestors[i]?.style?.display;
            if (displayStyles[i] === 'none' || (displayStyles[i] === '' && getComputedStyle(ancestors[i]).display === 'none')) { ancestors[i].style.display = 'block' }
        }
        tmp = $element.offset() as JQuery.Coordinates; // made sure cannot be undefined by removing display:none
        size = new Size(tmp.left, tmp.top, 0, 0);
        tmp = element.getBoundingClientRect();
        size.w = tmp.width;
        size.h = tmp.height;
        // restore visibility
        for (let i = 0; i < ancestors.length; i++) {
            if (displayStyles[i] === ancestors[i].style?.display) continue;
            if (displayStyles[i]) ancestors[i].style.display = displayStyles[i];
            else ancestors[i].style.removeProperty('display');
        }
        if (isOrphan) {  windoww.U.clear(Size.sizeofvar); }
        // Status.status.getActiveModel().graph.markS(size, false);
        return size;
    }

    static fromPoints(firstPt: IPoint, secondPt: IPoint): Size {
        const minX = Math.min(firstPt.x, secondPt.x);
        const maxX = Math.max(firstPt.x, secondPt.x);
        const minY = Math.min(firstPt.y, secondPt.y);
        const maxY = Math.max(firstPt.y, secondPt.y);
        return new Size(minX, minY, maxX - minX, maxY - minY); }
    dontMixWithGraphSize: any;

    makePoint(x: number, y: number): Point { return new Point(x, y); }
    new(): this { return new Size() as this; }
    /*
    duplicate(): this { return (this.new()).clone(this); }
    tl(): Point { return super.tl() as Point; }
    tr(): Point { return super.tr() as Point; }
    bl(): Point { return super.bl() as Point; }
    br(): Point { return super.br() as Point; }
    equals(size: Size): boolean { return super.equals(size); }/ *
    min(minSize: Size, clone: boolean): Size { return super.min(minSize, clone) as Size; }
    max(minSize: Size, clone: boolean): Size { return super.max(minSize, clone) as Size; }*/
}

@RuntimeAccessible
export class GraphSize extends ISize<GraphPoint> {
    static fromPoints(firstPt: GraphPoint, secondPt: GraphPoint): GraphSize {
        const minX = Math.min(firstPt.x, secondPt.x);
        const maxX = Math.max(firstPt.x, secondPt.x);
        const minY = Math.min(firstPt.y, secondPt.y);
        const maxY = Math.max(firstPt.y, secondPt.y);
        return new GraphSize(minX, minY, maxX - minX, maxY - minY); }

    static closestIntersection(vertexGSize: GraphSize, prevPt: GraphPoint, pt0: GraphPoint, gridAlign?: GraphPoint): GraphPoint | null {
        let pt: GraphPoint | null = pt0.duplicate();
        const m = GraphPoint.getM?.(prevPt, pt) as number;
        const q = GraphPoint.getQ?.(prevPt, pt) as number;
        // U.pe( Math.abs((pt.y - m * pt.x) - (prevPt.y - m * prevPt.x)) > .001, 'wrong math in Q:', (pt.y - m * pt.x), ' vs ', (prevPt.y - m * prevPt.x));
        /*const isL = prevPt.x < pt.x;
    const isT = prevPt.y < pt.y;
    const isR = !isL;
    const isB = !isT; */
        if (m === Number.POSITIVE_INFINITY && q === Number.NEGATIVE_INFINITY) { // bottom middle
            return new GraphPoint(vertexGSize.x + vertexGSize.w / 2, vertexGSize.y + vertexGSize.h); }
        // console.log('pt:', pt, 'm:', m, 'q:', q);
        let L: GraphPoint | null = new GraphPoint(0, 0);
        let T: GraphPoint | null = new GraphPoint(0, 0);
        let R: GraphPoint | null = new GraphPoint(0, 0);
        let B: GraphPoint | null = new GraphPoint(0, 0);
        L.x = vertexGSize.x;
        L.y = m * L.x + q;
        R.x = vertexGSize.x + vertexGSize.w;
        R.y = m * R.x + q;
        T.y = vertexGSize.y;
        T.x = (T.y - q) / m;
        B.y = vertexGSize.y + vertexGSize.h;
        B.x = (B.y - q) / m;
        // prendo solo il compreso pt ~ prevPt (escludo così il "pierce" sulla faccia opposta), prendo il più vicino al centro.
        // console.log('4 possibili punti di intersezione (LTBR):', L, T, B, R);
        /* this.owner.mark(this.owner.toHtmlCoord(T), true, 'blue');
    this.owner.mark(this.owner.toHtmlCoord(B), false, 'violet');
    this.owner.mark(this.owner.toHtmlCoord(L), false, 'red');
    this.owner.mark(this.owner.toHtmlCoord(R), false, 'orange');*/
        if ( (B.x >= pt.x && B.x <= prevPt.x) || (B.x >= prevPt.x && B.x <= pt.x) ) { } else { B = null; }
        if ( (T.x >= pt.x && T.x <= prevPt.x) || (T.x >= prevPt.x && T.x <= pt.x) ) { } else { T = null; }
        if ( (L.y >= pt.y && L.y <= prevPt.y) || (L.y >= prevPt.y && L.y <= pt.y) ) { } else { L = null; }
        if ( (R.y >= pt.y && R.y <= prevPt.y) || (R.y >= prevPt.y && R.y <= pt.y) ) { } else { R = null; }
        // console.log('superstiti step1: (LTBR):', L, T, B, R);
        const vicinanzaT = !T ? Number.POSITIVE_INFINITY : ((T.x - pt.x) * (T.x - pt.x)) + ((T.y - pt.y) * (T.y - pt.y));
        const vicinanzaB = !B ? Number.POSITIVE_INFINITY : ((B.x - pt.x) * (B.x - pt.x)) + ((B.y - pt.y) * (B.y - pt.y));
        const vicinanzaL = !L ? Number.POSITIVE_INFINITY : ((L.x - pt.x) * (L.x - pt.x)) + ((L.y - pt.y) * (L.y - pt.y));
        const vicinanzaR = !R ? Number.POSITIVE_INFINITY : ((R.x - pt.x) * (R.x - pt.x)) + ((R.y - pt.y) * (R.y - pt.y));
        const closest = Math.min(vicinanzaT, vicinanzaB, vicinanzaL, vicinanzaR);
        // console.log( 'closest:', closest);
        // succede quando pt e prevPt sono entrambi all'interno del rettangolo del vertice.
        // L'edge non è visibile e il valore ritornato è irrilevante.
        if (closest === Number.POSITIVE_INFINITY) {
            /* top center */
            pt = vertexGSize.tl();
            pt.x += vertexGSize.w / 2; } else
        if (closest === Number.POSITIVE_INFINITY) {
            /* bottom center */
            pt = vertexGSize.br();
            pt.x -= vertexGSize.w / 2; } else
        if (closest === vicinanzaT) { pt = T; } else
        if (closest === vicinanzaB) { pt = B; } else
        if (closest === vicinanzaR) { pt = R; } else
        if (closest === vicinanzaL) { pt = L; }

        if (!gridAlign) { return pt; }
        if (!pt) return null;
        if ((pt === T || pt === B || isNaN(closest)) && gridAlign.x) {
            const floorX: number = Math.floor(pt.x / gridAlign.x) * gridAlign.x;
            const ceilX: number = Math.ceil(pt.x / gridAlign.x) * gridAlign.x;
            let closestX;
            let farthestX;
            if (Math.abs(floorX - pt.x) < Math.abs(ceilX - pt.x)) {
                closestX = floorX; farthestX = ceilX;
            } else { closestX = ceilX; farthestX = floorX; }

            // todo: possibile causa del bug che non allinea punti fake a punti reali. nel calcolo realPT questo non viene fatto.
            // if closest grid intersection is inside the vertex.
            if (closestX >= vertexGSize.x && closestX <= vertexGSize.x + vertexGSize.w) { pt.x = closestX; } else
                // if 2° closer grid intersection is inside the vertex.
            if (closestX >= vertexGSize.x && closestX <= vertexGSize.x + vertexGSize.w) { pt.x = farthestX;
                // if no intersection are inside the vertex (ignore grid)
            } else { /* do nothing */ }
        } else if ((pt === L || pt === R) && gridAlign.y) {
            const floorY: number = Math.floor(pt.y / gridAlign.y) * gridAlign.y;
            const ceilY: number = Math.ceil(pt.y / gridAlign.y) * gridAlign.y;
            let closestY;
            let farthestY;
            if (Math.abs(floorY - pt.y) < Math.abs(ceilY - pt.y)) {
                closestY = floorY; farthestY = ceilY;
            } else { closestY = ceilY; farthestY = floorY; }

            // if closest grid intersection is inside the vertex.
            if (closestY >= vertexGSize.y && closestY <= vertexGSize.y + vertexGSize.h) { pt.y = closestY; } else
                // if 2° closer grid intersection is inside the vertex.
            if (closestY >= vertexGSize.y && closestY <= vertexGSize.y + vertexGSize.h) { pt.y = farthestY;
                // if no intersection are inside the vertex (ignore grid)
            } else { /* do nothing */ }
        }
        return pt; }

    dontMixWithSize: any;

    new(): this { return new GraphSize() as this; }
    makePoint(x: number, y: number): GraphPoint { return new GraphPoint(x, y) as GraphPoint; }
    /*
        tl(): GraphPoint { return super.tl(); }
        tr(): GraphPoint { return super.tr(); }
        bl(): GraphPoint { return super.bl(); }
        br(): GraphPoint { return super.br(); }*/
    /*
    new(): this { return new GraphSize() as this; }
    duplicate(): this { return (this.new()).clone(this); }
    makePoint(x: number, y: number): IPoint { return new Point(x, y); }
    tl(): GraphPoint { return super.tl() as GraphPoint; }
    tr(): GraphPoint { return super.tr() as GraphPoint; }
    bl(): GraphPoint { return super.bl() as GraphPoint; }
    br(): GraphPoint { return super.br() as GraphPoint; }
    equals(size: GraphSize): boolean { return super.equals(size); }
    min(minSize: GraphSize, clone: boolean): GraphSize { return super.min(minSize, clone) as GraphSize; }
    max(minSize: GraphSize, clone: boolean): GraphSize { return super.max(minSize, clone) as GraphSize; }



    contains(pt: IPoint): boolean { return super.contains(pt); }*/


}
