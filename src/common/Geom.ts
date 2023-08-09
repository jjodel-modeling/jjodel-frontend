import type { GObject, Temporary, TODO} from "../joiner";
import {DPointerTargetable, RuntimeAccessible, windoww, Log, RuntimeAccessibleClass} from "../joiner";

@RuntimeAccessible
export abstract class IPoint extends RuntimeAccessibleClass {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public x!: number;
    public y!: number;

    // @ts-ignore static getM is not null but must be declared nullable to achieve subclass mixing
    // public static getM? = function(firstPt: IPoint, secondPt: IPoint): number { return (firstPt.y - secondPt.y) / (firstPt.x - secondPt.x); }
    public static getM(firstPt: IPoint, secondPt: IPoint): number { return (firstPt.y - secondPt.y) / (firstPt.x - secondPt.x); }
    public static getQ(firstPt: IPoint, secondPt: IPoint): number { return firstPt.y - (IPoint.getM(firstPt, secondPt) * firstPt.x);  }

    public constructor(x: number = 0, y: number = 0) {
        super(); // super('dwc');
        IPoint.init_constructor(this, x, y);
    }

    static init_constructor(thiss: GObject, x: any = 0, y: any = 0, ...a: any): void {
        thiss.id = "POINT_" + (DPointerTargetable.maxID++) + "_" + new Date().getTime();
        thiss.className = thiss.constructor.name;
        if (x === null || x === undefined) thiss.x = undefined as Temporary;
        else if (isNaN(+x)) { thiss.x = 0; }
        else thiss.x = +x;
        if (y === null || y === undefined) thiss.y = undefined as Temporary;
        else if (isNaN(+y)) { thiss.y = 0; }
        else thiss.y = +y;
        thiss.className = this.name;
    }

    public toString(): string { return '(' + this.x + ', ' + this.y + ')'; }
    public clone(other: { x: number, y: number }): this { this.x = other.x; this.y = other.y; return this; }

    protected abstract new(): this;
    public duplicate(): this { const ret = this.new(); ret.clone(this); return ret; }

    public distanceFromPoint(tentativeEnd: IPoint, skipSqrt: boolean = false): number {
        let d_pow2 = (this.x - tentativeEnd.x)**2 + (this.y - tentativeEnd.y)**2;
        return skipSqrt ? d_pow2 : Math.sqrt(d_pow2);
        // return this.subtract(tentativeEnd, true).absolute();
    }

    public subtract(p2: IPoint, newInstance: boolean): this {
        Log.e(!p2, 'subtract argument must be a valid point: ', p2);
        let p1: this;
        if (!newInstance) { p1 = this; } else { p1 = this.duplicate(); }
        p1.x -= p2.x;
        p1.y -= p2.y;
        return p1; }

    public add(p2: IPoint, newInstance: boolean): this {
        Log.e(!p2, 'add argument must be a valid point: ', p2);
        let p1: this;
        if (!newInstance) { p1 = this; } else { p1 = this.duplicate(); }
        p1.x += p2.x;
        p1.y += p2.y;
        return p1; }

    public addAll(p: IPoint[], newInstance: boolean): this {
        let i;
        let p0: this;
        if (!newInstance) { p0 = this; } else { p0 = this.duplicate(); }
        for (i = 0; i < p.length; i++) { p0.add(p[i], true); }
        return p0; }

    public subtractAll(p: this[], newInstance: boolean): this {
        let i;
        let p0: this;
        if (!newInstance) { p0 = this; } else { p0 = this.duplicate(); }
        for (i = 0; i < p.length; i++) { p0.subtract(p[i], true); }
        return p0; }

    public multiply(pt: this | number, newInstance: boolean = false): this {
        let ret: this = (newInstance ? this.duplicate() : this);
        if (typeof pt === "number") {
            ret.x *= pt;
            ret.y /= pt;
        }
        else {
            ret.x *= pt.x;
            ret.y *= pt.y;
        }
        return ret; }

    public divide(pt: this | number, newInstance: boolean = false): this {
        let ret = (newInstance ? this.duplicate() : this);
        if (typeof pt === "number") {
            ret.x /= pt;
            ret.y /= pt;
        }
        else {
            ret.x /= pt.x;
            ret.y /= pt.y;
        }
        return ret; }

    public multiplyScalar(scalar: number, newInstance: boolean): this {
        Log.e(isNaN(+scalar), 'IPoint.multiply()', 'scalar argument must be a valid number: ', scalar);
        let p1: this;
        if (!newInstance) { p1 = this; } else { p1 = this.duplicate(); }
        p1.x *= scalar;
        p1.y *= scalar;
        return p1; }

    public divideScalar(scalar: number, newInstance: boolean): this {
        Log.e(isNaN(+scalar), 'IPoint.divide()', 'scalar argument must be a valid number: ', scalar);
        let p1: this;
        if (!newInstance) { p1 = this; } else { p1 = this.duplicate(); }
        p1.x /= scalar;
        p1.y /= scalar;
        return p1; }

    public isInTheMiddleOf(firstPt: this, secondPt: this, tolleranza: number): boolean {
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

    public distanceFromLine(p1: IPoint, p2: IPoint): number {
        const top: number =
            + (p2.y - p1.y) * this.x
            - (p2.x - p1.x) * this.y
            + p2.x * p1.y
            - p1.x * p2.y;
        const bot =
            (p2.y - p1.y) * (p2.y - p1.y) +
            (p2.x - p1.x) * (p2.x - p1.x);
        return Math.abs(top) / Math.sqrt(bot);  }

    public equals(pt: IPoint, tolleranzaX: number = 0, tolleranzaY: number = 0): boolean {
        if (pt === null) { return false; }
        return Math.abs(this.x - pt.x) <= tolleranzaX && Math.abs(this.y - pt.y) <= tolleranzaY; }

    public moveOnNearestBorder(startVertexSize: ISize, clone: boolean, graph: TODO/*IGraph*/, debug: boolean = true): IPoint {
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

    public getM(pt2: IPoint): number { return IPoint.getM?.(this, pt2) as unknown as number; }

    public degreeWith(pt2: IPoint, toRadians: boolean): number {
        const directionVector: IPoint = this.subtract(pt2, true);
        const ret: number = Math.atan2(directionVector.y, directionVector.x);
        return toRadians ? ret : windoww.U.RadToDegree(ret); }

    public absolute(): number { return Math.sqrt(this.x * this.x + this.y * this.y); }
    public set(x: number, y: number) { this.x = x; this.y = y; }
}

@RuntimeAccessible
export class GraphPoint extends IPoint{
    private dontmixwithPoint: any;
    public static fromEvent(e: JQuery.ClickEvent | JQuery.MouseMoveEvent | JQuery.MouseUpEvent | JQuery.MouseDownEvent | JQuery.MouseEnterEvent | JQuery.MouseLeaveEvent | JQuery.MouseEventBase)
        : GraphPoint | null {
        if (!e) { return null; }
        const p: Point = new Point(e.pageX, e.pageY);
        const g: any = null;
        throw new Error("todo: const g: IGraph = Status.status.getActiveModel().graph;");
        return g.toGraphCoord(p); }

    protected new(): this { return new GraphPoint() as this;}

}


@RuntimeAccessible
export class Point extends IPoint{
    private dontmixwithGPoint: any;
    /// https://stackoverflow.com/questions/6073505/what-is-the-difference-between-screenx-y-clientx-y-and-pagex-y
    public static fromEvent(e: JQuery.ClickEvent | JQuery.MouseMoveEvent | JQuery.MouseUpEvent | JQuery.MouseDownEvent | JQuery.MouseEnterEvent | JQuery.MouseLeaveEvent | JQuery.MouseEventBase)
        : Point {
        const p: Point = new Point(e.pageX, e.pageY);
        return p; }

    protected new(): this { return new Point() as this;}
}

RuntimeAccessibleClass.set_extend(RuntimeAccessibleClass, IPoint);
RuntimeAccessibleClass.set_extend(IPoint, GraphPoint);
RuntimeAccessibleClass.set_extend(IPoint, Point);
@RuntimeAccessible
export abstract class ISize<PT extends IPoint = IPoint> extends RuntimeAccessibleClass {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public x!: number;
    public y!: number;
    public w!: number;
    public h!: number;
    public constructor(x: number = 0, y: number = 0, w: number = 0, h: number = 0) {
        super(); // super('dwc');
        // do not override any fields from the DPointerTargetable, otherwise the ! in the override will reinizialize the attribute
        // erasing the value set in super or in the functions called by the constructor as side effect (static_init called from constructor will be overridden too)
        // if need to override types, build the "new" static function like in DModelElement
        ISize.init_constructor(this, x, y, w, h);
    }

    static init_constructor(thiss: GObject, x: any = 0, y: any = 0, w: any = 0, h: any = 0, ...a: any): void {
        thiss.id = "SIZE_" + (DPointerTargetable.maxID++) + "_" + new Date().getTime();
        thiss.className = thiss.constructor.name;
        if (x === null || x === undefined) thiss.x = undefined as Temporary;
        else if (isNaN(+x)) { thiss.x = 0; }
        else thiss.x = +x;
        if (y === null || y === undefined) thiss.y = undefined as Temporary;
        else if (isNaN(+y)) { thiss.y = 0; }
        else thiss.y = +y;
        if (w === null || w === undefined) thiss.w = undefined as Temporary;
        else if (isNaN(+w)) { thiss.w = 0; }
        else thiss.w = +w;
        if (h === null || h === undefined) thiss.h = undefined as Temporary;
        else if (isNaN(+h)) { thiss.h = 0; }
        else thiss.h = +h;
        thiss.className = this.name; }

    public toString(): string { return JSON.stringify({x: this.x, y: this.y, w: this.w, h: this.h}); }

    public set(x?: number, y?: number, w?: number, h?: number): void {
        if (x !== undefined) (this.x = +x);
        if (y !== undefined) (this.y = +y);
        if (w !== undefined) (this.w = +w);
        if (h !== undefined) (this.h = +h);
    }

    protected abstract makePoint(x: number, y: number): PT;
    protected abstract new(...args:any): this;
    public clone(json: this): this { this.x = json.x; this.y = json.y; this.w = json.w; this.h = json.h; return this; }
    public duplicate(): this { return this.new().clone(this); }

    public add(pt2: this | PT, newInstance?: boolean): this {
        let p1: this;
        if (!newInstance) { p1 = this; } else { p1 = this.duplicate(); }
        p1.x += pt2.x;
        p1.y += pt2.y;
        if (!('w' in pt2)) return p1;
        p1.w += (pt2 as ISize).w;
        p1.h += (pt2 as ISize).h; return p1; }

    public subtract(pt2: this | PT): this {
        this.x -= pt2.x;
        this.y -= pt2.y;
        if (!('w' in pt2)) return this;
        this.w -= (pt2 as ISize).w;
        this.h -= (pt2 as ISize).h; return this; }

    public multiply(pt2: this | PT): void {
        this.x *= pt2.x;
        this.y *= pt2.y;
        if (!('w' in pt2)) return;
        this.w *= (pt2 as ISize).w;
        this.h *= (pt2 as ISize).h; }

    public divide(pt2: this | PT): void {
        this.x /= pt2.x;
        this.y /= pt2.y;
        if (!('w' in pt2)) return;
        this.w /= (pt2 as ISize).w;
        this.h /= (pt2 as ISize).h; }

    public tl(): PT {     return this.makePoint(   this.x,                 this.y             ); }
    public tr(): PT {     return this.makePoint(this.x + this.w,        this.y             ); }
    public bl(): PT {     return this.makePoint(   this.x,              this.y + this.h    ); }
    public br(): PT {     return this.makePoint(this.x + this.w,     this.y + this.h    ); }
    public center(): PT { return this.makePoint(this.x + this.w / 2, this.y + this.h / 2); }
    public relativePoint(xPercent: number, yPercent: number): PT { return this.makePoint(this.x + this.w * xPercent, this.y + this.h * yPercent); }
    public equals(size: this): boolean { return this.x === size.x && this.y === size.y && this.w === size.w && this.h === size.h; }

    /// field-wise Math.min()
    public min(minSize: this, clone: boolean): this {
        const ret: this = clone ? this.new() : this;
        if (!isNaN(minSize.x) && ret.x < minSize.x) { ret.x = minSize.x; }
        if (!isNaN(minSize.y) && ret.y < minSize.y) { ret.y = minSize.y; }
        if (!isNaN(minSize.w) && ret.w < minSize.w) { ret.w = minSize.w; }
        if (!isNaN(minSize.h) && ret.h < minSize.h) { ret.h = minSize.h; }
        return ret; }
    public max(maxSize: this, clone: boolean): this {
        const ret: this = clone ? this.new() : this;
        if (!isNaN(maxSize.x) && ret.x > maxSize.x) { ret.x = maxSize.x; }
        if (!isNaN(maxSize.y) && ret.y > maxSize.y) { ret.y = maxSize.y; }
        if (!isNaN(maxSize.w) && ret.w > maxSize.w) { ret.w = maxSize.w; }
        if (!isNaN(maxSize.h) && ret.h > maxSize.h) { ret.h = maxSize.h; }
        return ret; }

    public intersection(size: this): this | null {
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

    public contains(pt: PT): boolean {
        return  pt.x >= this.x && pt.x <= this.x + this.w && pt.y >= this.y && pt.y <= this.y + this.h; }

    public isOverlapping(size2: this): boolean { return !!this.intersection(size2); }
    public isOverlappingAnyOf(sizes: this[]): boolean {
        if (!sizes) return false;
        for (let size of sizes) { if (this.isOverlapping(size)) return true; }
        return false;
    }

    public multiplyPoint(other: PT, newInstance: boolean): this {
        const ret: this = newInstance ? this.new() : this;
        ret.x *= other.x;
        ret.w *= other.x;
        ret.y *= other.y;
        ret.h *= other.y;
        return ret; }

    public dividePoint(other: PT, newInstance: boolean): this {
        const ret: this = newInstance ? this.new() : this;
        ret.x /= other.x;
        ret.w /= other.x;
        ret.y /= other.y;
        ret.h /= other.y;
        return ret; }

    public boundary(size2: this): void {
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
    static subclasses: any[] = [];
    private static sizeofvar: HTMLElement;
    private static $sizeofvar: JQuery<HTMLElement>;
    private dontMixWithGraphSize: any;

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

    public static fromPoints(firstPt: IPoint, secondPt: IPoint): Size {
        const minX = Math.min(firstPt.x, secondPt.x);
        const maxX = Math.max(firstPt.x, secondPt.x);
        const minY = Math.min(firstPt.y, secondPt.y);
        const maxY = Math.max(firstPt.y, secondPt.y);
        return new Size(minX, minY, maxX - minX, maxY - minY); }

    protected makePoint(x: number, y: number): Point { return new Point(x, y); }
    protected new(...args:any): this { return new Size(...args) as this; }
}

@RuntimeAccessible
export class GraphSize extends ISize<GraphPoint> {
    private dontMixWithSize: any;

    public static fromPoints(firstPt: GraphPoint, secondPt: GraphPoint): GraphSize {
        const minX = Math.min(firstPt.x, secondPt.x);
        const maxX = Math.max(firstPt.x, secondPt.x);
        const minY = Math.min(firstPt.y, secondPt.y);
        const maxY = Math.max(firstPt.y, secondPt.y);
        return new GraphSize(minX, minY, maxX - minX, maxY - minY); }


    public static closestIntersection(size: GraphSize, prevPt: GraphPoint, pt0: GraphPoint, gridAlign?: GraphPoint): GraphPoint | null {
        let ret = GraphSize.closestIntersection0(size, prevPt, pt0, gridAlign) as any;
        // Log.exDev(!Geom.isOnEdge(ret, size), 'ClosestIntersection failed. not on Vertex edge.', {ret, size, prevPt, pt0, gridAlign});
        return ret;
    }
    private static closestIntersection0(vertexGSize: GraphSize, prevPt: GraphPoint, pt0: GraphPoint, gridAlign?: GraphPoint): GraphPoint | null {
        let pt: GraphPoint | null = pt0.duplicate();
        const m = GraphPoint.getM(prevPt, pt) as number;
        const q = GraphPoint.getQ(prevPt, pt) as number;
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


    protected new(...args: any): this { return new GraphSize(...args) as this; }
    protected makePoint(x: number, y: number): GraphPoint { return new GraphPoint(x, y) as GraphPoint; }

    closestPoint(pt: GraphPoint): GraphPoint { return Geom.closestPoint(this, pt); }
}

RuntimeAccessibleClass.set_extend(RuntimeAccessibleClass, ISize);
RuntimeAccessibleClass.set_extend(ISize, Size);
RuntimeAccessibleClass.set_extend(ISize, GraphSize);
@RuntimeAccessible
export class Geom extends RuntimeAccessibleClass {

    static isPositiveZero(m: number): boolean {
        if (!!Object.is) { return Object.is(m, +0); }
        return (1 / m === Number.POSITIVE_INFINITY); }

    static isNegativeZero(m: number): boolean {
        if (!!Object.is) { return Object.is(m, -0); }
        return (1 / m === Number.NEGATIVE_INFINITY); }

    static TanToRadian(n: number): number { return Geom.DegreeToRad(Geom.TanToDegree(n)); }
    static TanToDegree(n: number): number {
        if (Geom.isPositiveZero(n)) { return 0; }
        if (n === Number.POSITIVE_INFINITY) { return 90; }
        if (Geom.isNegativeZero(n)) { return 180; }
        if (n === Number.POSITIVE_INFINITY) { return 270; }
        return Geom.RadToDegree((window as any).Math.atan(n)); }

    static RadToDegree(radians: number): number { return radians * (180 / Math.PI); }
    static DegreeToRad(degree: number): number { return degree * (Math.PI / 180); }



    private static GeomTolerance = 0; // 0.001;
    static isOnEdge(pt: GraphPoint, shape: GraphSize, tolerance: number = Geom.GeomTolerance): boolean {
        return Geom.isOnHorizontalEdges(pt, shape, tolerance) || Geom.isOnVerticalEdges(pt, shape, tolerance); }

    static isOnVerticalEdges(pt: GraphPoint, shape: GraphSize, tolerance: number = Geom.GeomTolerance): boolean {
        return Geom.isOnLeftEdge(pt, shape, tolerance) || Geom.isOnRightEdge(pt, shape, tolerance); }

    static isOnHorizontalEdges(pt: GraphPoint, shape: GraphSize, tolerance: number = Geom.GeomTolerance): boolean {
        return Geom.isOnTopEdge(pt, shape, tolerance) || Geom.isOnBottomEdge(pt, shape, tolerance); }

    static isOnRightEdge(pt: GraphPoint, shape: GraphSize, tolerance: number = Geom.GeomTolerance): boolean {
        if (!pt || !shape) { return false; }
        if (tolerance) return Math.abs(pt.x - (shape.x + shape.w)) < tolerance
            && ( pt.y - (shape.y) > tolerance && pt.y - (shape.y + shape.h) < tolerance);
        return (pt.x === shape.x + shape.w) && (pt.y >= shape.y && pt.y <= shape.y + shape.h);
    }

    static isOnLeftEdge(pt: GraphPoint, shape: GraphSize, tolerance: number = Geom.GeomTolerance): boolean {
        if (!pt || !shape) { return false; }
        if (tolerance) return Math.abs(pt.x - shape.x) < tolerance
            && (pt.y - (shape.y) > tolerance && pt.y - (shape.y + shape.h) < tolerance);
        return (pt.x === shape.x) && (pt.y >= shape.y && pt.y <= shape.y + shape.h);
    }

    static isOnTopEdge(pt: GraphPoint, shape: GraphSize, tolerance: number = Geom.GeomTolerance): boolean {
        if (!pt || !shape) { return false; }
        if (tolerance) return Math.abs(pt.y - shape.y) < tolerance
            && (pt.x - (shape.x) > tolerance && pt.x - (shape.x + shape.w) < tolerance);
        return (pt.y === shape.y) && (pt.x >= shape.x && pt.x <= shape.x + shape.w);
    }

    static isOnBottomEdge(pt: GraphPoint, shape: GraphSize, tolerance?: number): boolean {
        if (!pt || !shape) { return false; }
        if (tolerance) return Math.abs(pt.y - shape.y + shape.h) < tolerance
            && (pt.x - (shape.x) > tolerance && pt.x - (shape.x + shape.w) < tolerance);
        return (pt.y === shape.y + shape.h) && (pt.x >= shape.x && pt.x <= shape.x + shape.w);
    }

    static closestPoint(size: GraphSize, pt: GraphPoint): GraphPoint {
        let top_closest = Geom.closestPointToSegment(size.tl(), size.tr(), pt);
        let bot_closest = Geom.closestPointToSegment(size.bl(), size.br(), pt);
        let left_closest = Geom.closestPointToSegment(size.tl(), size.bl(), pt);
        let right_closest = Geom.closestPointToSegment(size.tr(), size.br(), pt);

        let top_distance = top_closest.distanceFromPoint(pt, false);
        let bot_distance = bot_closest.distanceFromPoint(pt, false);
        let left_distance = left_closest.distanceFromPoint(pt, false);
        let right_distance = right_closest.distanceFromPoint(pt, false);

        let min_distance = Math.min(top_distance, bot_distance, left_distance, right_distance);
        if (min_distance === top_distance) return top_closest;
        if (min_distance === bot_distance) return bot_closest;
        if (min_distance === left_distance) return left_closest;
        return right_closest;
    }
    static isMinusZero(number: number) {return 1/number == -Infinity;}
    static closestPointToSegment(segStart: GraphPoint, segEnd:GraphPoint, pt: GraphPoint): GraphPoint{
        // 1) find equation of line passing for start, end.
        // 2) then find all perpendicular lines, then the perpendicular line that pass through pt
        // 3) find intersection between Line(s,e) and line of point 2.
        // 4A) IF intersection is part of segment(s,e) that is closest.
        // 4B) ELSE, one of the 2 extremes of the segment is closest.

        let x_intersect: number, y_intersect: number;
        let s = segStart;
        let e = segEnd;
        let mse = (e.y - s.y) / (e.x - s.x);
        if (mse === Number.POSITIVE_INFINITY || mse === Number.NEGATIVE_INFINITY) {
            // s and e are both on the same y vertical line (same x)      // new GraphPoint(segStart.x, pt.y);
            x_intersect = segStart.x;
            y_intersect = pt.y;
            // 1), 2), 3) all done shortcut
        } else if (mse === 0 || Geom.isNegativeZero(mse)) {
            // s and e are both on the same x horizontal line (same y)    // new GraphPoint(pt.x, segStart.y);
            x_intersect = pt.x;
            y_intersect = segStart.y
            // 1), 2), 3) all done shortcut
        }
        else {
            let q = s.y - mse*s.x; // y = mx + q           q = y-mx
            // 1) done
            let pmse = -1/mse; // perpendicular to mse
            let pq = pt.y - pmse*pt.x;
            // 2) done
            //  m1 * x + q1 = y    -->   m1 * x + q1 = m2 * x + q2    -->    (m1-m2)x = q2-q1      -->     x=(q2-q1)/(m1-m2)
            x_intersect = (pq-q)/(mse-pmse);
            y_intersect = mse*(x_intersect) + q; //  y = mx +q
            // 3) done
        }

        let maxX: number, minX: number;
        let maxY: number, minY: number;
        if (s.x > e.x) { maxX = s.x; minX = e.x; } else {  maxX = e.x; minX = s.x; }
        if (s.y > e.y) { maxY = s.y; minY = e.y; } else {  maxY = e.y; minY = s.y; }
        if (x_intersect >= minX && x_intersect <= maxX && y_intersect >= minY && y_intersect <= maxY) return new GraphPoint(x_intersect, y_intersect);
        // 4A) IF done

        let sdist = (s.x - x_intersect)**2 + (s.y - y_intersect)**2;  // actual distance is sqrt() of this, but i just need to find closest, not correct distance.
        let edist = (e.x - x_intersect)**2 + (e.y - y_intersect)**2;
        return (sdist < edist) ? new GraphPoint(s.x, s.y) : new GraphPoint(e.x, e.y);
        // 4B) ELSE done
    }
}

RuntimeAccessibleClass.set_extend(RuntimeAccessibleClass, Geom);
