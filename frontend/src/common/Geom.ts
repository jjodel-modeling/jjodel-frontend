import {GObject, Temporary, TODO, U} from "../joiner";
import {DPointerTargetable, RuntimeAccessible, windoww, Log, RuntimeAccessibleClass, Dictionary} from "../joiner";
import React from "react";
import {radian} from "../joiner/types";

@RuntimeAccessible('IPoint')
export abstract class IPoint extends RuntimeAccessibleClass {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public x!: number;
    public y!: number;

    // @ts-ignore static getM is not null but must be declared nullable to achieve subclass mixing
    // public static getM? = function(firstPt: IPoint, secondPt: IPoint): number { return (firstPt.y - secondPt.y) / (firstPt.x - secondPt.x); }
    public static getM(firstPt: IPoint, secondPt: IPoint): number { return (firstPt.y - secondPt.y) / (firstPt.x - secondPt.x); }
    public static getQ(firstPt: IPoint, secondPt: IPoint, m?: number): number {
        if (m === undefined) m = IPoint.getM(firstPt, secondPt);
        return firstPt.y - (m * firstPt.x);
    }

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
        thiss.className = this.cname;
    }


    static printDiff(s1: SizeLike, s2: SizeLike) {
        return ISize.printDiff(s1, s2, true);
    }
    public raw(): {x: number, y: number} { return {x: this.x, y: this.y}; }

    public toString(letters: boolean=true, separator: string = " "): string {
        if (letters) return  JSON.stringify({x:this.x, y: this.y});
        else return this.x + separator + this.y + separator;
    }
    public clone(other: { x: number, y: number }): this { this.x = other.x; this.y = other.y; return this; }

    protected abstract new(): this;
    abstract toSize(w: number, h?: number): ISize;
    public duplicate(): this { const ret = this.new(); ret.clone(this); return ret; }

    public distanceFromPoint(tentativeEnd: IPoint, skipSqrt: boolean = false): number {
        let d_pow2 = (this.x - tentativeEnd.x)**2 + (this.y - tentativeEnd.y)**2;
        return skipSqrt ? d_pow2 : Math.sqrt(d_pow2);
        // return this.subtract(tentativeEnd, true).absolute();
    }

    public subtract(p2: { x?: number, y?: number }, newInstance: boolean): this {
        Log.e(!p2, 'subtract argument must be a valid point: ', p2);
        let p1: this;
        if (!newInstance) { p1 = this; } else { p1 = this.duplicate(); }
        if (p2.x !== undefined) p1.x -= p2.x;
        if (p2.y !== undefined) p1.y -= p2.y;
        return p1; }

    public add(p2: { x?: number, y?: number }, newInstance: boolean): this {
        Log.e(!p2, 'add argument must be a valid point: ', p2);
        let p1: this;
        if (!newInstance) { p1 = this; } else { p1 = this.duplicate(); }
        if (p2.x !== undefined) p1.x += p2.x;
        if (p2.y !== undefined) p1.y += p2.y;
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

    public multiply(pt: {x?: number, y?: number} | number, newInstance: boolean = false): this {
        let ret: this = (newInstance ? this.duplicate() : this);
        if (typeof pt === "number") {
            ret.x *= pt;
            ret.y *= pt;
        }
        else {
            if (pt.x !== undefined) ret.x *= pt.x;
            if (pt.y !== undefined) ret.y *= pt.y;
        }
        return ret; }

    public divide(pt: Partial<this> | number, newInstance: boolean = false): this {
        let ret = (newInstance ? this.duplicate() : this);
        if (typeof pt === "number") {
            ret.x /= pt;
            ret.y /= pt;
        }
        else {
            ret.x /= pt.x as number;
            ret.y /= pt.y as number;
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

    public equals(pt: {x:number, y:number}, tolleranzaX: number = 0, tolleranzaY: number = 0): boolean {
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

    // move the point by a vector with direction and distance (module)
    move(rad: radian /*in radians!*/, distance: number, clone:boolean = true): this{
        let pt = clone ? this.duplicate() : this;
        pt.x += distance * Math.cos(rad);
        pt.y += distance * Math.sin(rad);
        return pt;
    }

    static stringify(ptlike: {x?:number, y?:number}): string {
        if (!ptlike) return ptlike;
        let str: string[];
        return '('+U.cropNum(ptlike.x||0)+', '+U.cropNum(ptlike.y||0)+')';
    }
}

@RuntimeAccessible('GraphPoint')
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
    public toSize(w: number, h?: number): GraphSize {
        return new GraphSize(this.x, this.y, w, (h === undefined) ? w : h);
    }

}


@RuntimeAccessible('Point')
export class Point extends IPoint{
    private dontmixwithGPoint: any;
    /// https://stackoverflow.com/questions/6073505/what-is-the-difference-between-screenx-y-clientx-y-and-pagex-y
    public static fromEvent(e: JQuery.ClickEvent | JQuery.MouseMoveEvent | JQuery.MouseUpEvent | JQuery.MouseDownEvent
        | JQuery.MouseEnterEvent | JQuery.MouseLeaveEvent | JQuery.MouseEventBase | React.MouseEvent)
        : Point {
        const p: Point = new Point(e.pageX, e.pageY);
        return p; }

    protected new(): this { return new Point() as this;}
    public toSize(w: number, h?: number): Size {
        return new Size(this.x, this.y, w, (h === undefined) ? w : h);
    }
}

RuntimeAccessibleClass.set_extend(RuntimeAccessibleClass, IPoint);
RuntimeAccessibleClass.set_extend(IPoint, GraphPoint);
RuntimeAccessibleClass.set_extend(IPoint, Point);

@RuntimeAccessible('ISize')
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


    static printDiff(s1: SizeLike, s2: SizeLike, asPoints:boolean = false, maxDigits:number = 5) {
        s1 = {...s1, w: s1.w ?? s1.width, h: s1.h ?? s1.height};
        s1.x = s1.x ?? s2.x;
        s1.y = s1.y ?? s2.y;
        s2 = {...s2, w: s2.w ?? s2.width, h: s2.h ?? s2.height};
        if (!asPoints) {
            s1.w = s1.w ?? s2.w;
            s1.h = s1.h ?? s2.h;
        }
        let s1coords: (number | string)[] = [];
        s1coords.push(!U.isNumber(s1.x) ? '' : U.cropNum(s1.x, maxDigits));
        s1coords.push(!U.isNumber(s1.y) ? ',' : ', '+U.cropNum(s1.y, maxDigits));
        if (!asPoints) {
            s1coords.push(!U.isNumber(s1.w) ? ',' : ', '+U.cropNum(s1.w, maxDigits));
            s1coords.push(!U.isNumber(s1.h) ? ',' : ', '+U.cropNum(s1.h, maxDigits));
        }
        let s2coords: (number | string)[] = [];
        s2coords.push(s2.x === s1.x || !U.isNumber(s2.x) ? '' : U.cropNum(s2.x, maxDigits));
        s2coords.push(s2.y === s1.y || !U.isNumber(s2.y) ? ',' : ', '+U.cropNum(s2.y, maxDigits));
        if (!asPoints) {
            s2coords.push(s2.w === s1.w || !U.isNumber(s2.w) ? ',' : ', '+U.cropNum(s2.w, maxDigits));
            s2coords.push(s2.h === s1.h || !U.isNumber(s2.h) ? ',' : ', '+U.cropNum(s2.h, maxDigits));
        }

        // → 🡲
        return `(`+s1coords.join('')+`)🡲(`+s2coords.join('')+`)`;
    }
    static stringify(ptlike: {x?:number, y?:number, w?:number, h?:number, width?:number, height?:number}): string {
        if (!ptlike) return ptlike as any;
        let str: string[] = [];
        if (ptlike.x && !isNaN(ptlike.x)|| ptlike.x === 0) str.push('x:'+U.cropNum(ptlike.x));
        if (ptlike.y && !isNaN(ptlike.y)|| ptlike.y === 0) str.push('y:'+U.cropNum(ptlike.y));
        if (ptlike.w && !isNaN(ptlike.w)|| ptlike.w === 0) str.push('w:'+U.cropNum(ptlike.w));
        if (ptlike.h && !isNaN(ptlike.h)|| ptlike.h === 0) str.push('h:'+U.cropNum(ptlike.h));
        if (ptlike.width && !isNaN(ptlike.width) || ptlike.width === 0) str.push('W:'+U.cropNum(ptlike.width));
        if (ptlike.height && !isNaN(ptlike.height) || ptlike.height === 0) str.push('H:'+U.cropNum(ptlike.height));
        // if (str.length === 0) return '{}';
        return '{'+str.join(', ')+'}';
    }

    static init_constructor(thiss: GObject, x: any = 0, y: any = 0, w: any = 0, h: any = 0, ...a: any): void {
        thiss.id = "SIZE_" + (DPointerTargetable.maxID++) + "_" + new Date().getTime();
        thiss.className = (thiss.constructor as typeof RuntimeAccessibleClass).cname;
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
        thiss.className = this.cname; }

    public toString(letters: boolean=true, separator: string = " "): string {
        if (letters) return JSON.stringify({x: this.x, y: this.y, w: this.w, h: this.h});
        else return this.x + separator + this.y + separator + this.w + separator + this.h;
    }

    public set(x?: number, y?: number, w?: number, h?: number): void {
        if (x !== undefined) (this.x = +x);
        if (y !== undefined) (this.y = +y);
        if (w !== undefined) (this.w = +w);
        if (h !== undefined) (this.h = +h);
    }

    protected abstract makePoint(x: number, y: number): PT;
    protected abstract new(...args:any): this;
    public clone(json: GObject<ISize>, partial: boolean = false, onlyNumbers: boolean = false): this {
        if (partial) {
            if ('x' in json) this.x = (onlyNumbers ? +json.x||0 : json.x); else delete (this as any).x;
            if ('y' in json) this.y = (onlyNumbers ? +json.y||0 : json.y); else delete (this as any).y;
            if ('w' in json) this.w = (onlyNumbers ? +json.w||0 : json.w); else delete (this as any).w;
            if ('h' in json) this.h = (onlyNumbers ? +json.h||0 : json.h); else delete (this as any).h;
        } else {
            this.x = 'x' in json ? (onlyNumbers ? +json.x||0 : json.x) : 0;
            this.y = 'y' in json ? (onlyNumbers ? +json.y||0 : json.y) : 0;
            this.w = 'w' in json ? (onlyNumbers ? +json.w||0 : json.w) : 0;
            this.h = 'h' in json ? (onlyNumbers ? +json.h||0 : json.h) : 0;
        }
        // @ts-ignore
        if ('currentCoordType' in json) this.currentCoordType = json.currentCoordType;
        return this; }
    public duplicate(): this { return this.new().clone(this as ISize); }

    public add(pt2: number | {x?:number, y?:number, w?:number, h?:number}, newInstance?: boolean): this {
        let thiss = newInstance ? this.duplicate() : this;
        if (typeof pt2 === "number") { thiss.x += pt2; thiss.y += pt2; thiss.w += pt2; thiss.h += pt2; return thiss; }
        if (pt2.x !== undefined) thiss.x += pt2.x;
        if (pt2.y !== undefined) thiss.y += pt2.y;
        if (pt2.w !== undefined) thiss.w += pt2.w;
        if (pt2.h !== undefined) thiss.h += pt2.h;
        return thiss; }

    public subtract(pt2: number | {x?:number, y?:number, w?:number, h?:number}, newInstance?: boolean): this {
        let thiss = newInstance ? this.duplicate() : this;
        if (typeof pt2 === "number") { thiss.x -= pt2; thiss.y -= pt2; thiss.w -= pt2; thiss.h -= pt2; return thiss; }
        if (pt2.x !== undefined) thiss.x -= pt2.x;
        if (pt2.y !== undefined) thiss.y -= pt2.y;
        if (pt2.w !== undefined) thiss.w -= pt2.w;
        if (pt2.h !== undefined) thiss.h -= pt2.h;
        return thiss; }

    public multiply(pt2: number | {x?:number, y?:number, w?:number, h?:number}, newInstance?: boolean): this {
        let thiss = newInstance ? this.duplicate() : this;
        if (typeof pt2 === "number") { thiss.x *= pt2; thiss.y *= pt2; thiss.w *= pt2; thiss.h *= pt2; return thiss; }
        if (pt2.x !== undefined) thiss.x *= pt2.x;
        if (pt2.y !== undefined) thiss.y *= pt2.y;
        // w and h gets multiplied by pt2.w if present, otherwise by pt2.x
        if (pt2.w !== undefined) thiss.w *= pt2.w;
        else if (pt2.x !== undefined) thiss.w *= pt2.x;
        if (pt2.h !== undefined) thiss.h *= pt2.h;
        else if (pt2.y !== undefined) thiss.h *= pt2.y;
        return thiss; }

    public divide(pt2: number | {x?:number, y?:number, w?:number, h?:number}, newInstance?: boolean): this {
        let thiss = newInstance ? this.duplicate() : this;
        if (typeof pt2 === "number") { thiss.x /= pt2; thiss.y /= pt2; thiss.w /= pt2; thiss.h /= pt2; return thiss; }
        if (pt2.x !== undefined) thiss.x /= pt2.x;
        if (pt2.y !== undefined) thiss.y /= pt2.y;
        if (pt2.w !== undefined) thiss.w /= pt2.w;
        if (pt2.h !== undefined) thiss.h /= pt2.h;
        return thiss; }


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
        if (!size) return null;
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
type SizeLike = {x?: number, y?: number, w?: number, h?:number, width?: number, height?: number}
type PointLike = {x?: number, y?: number}

@RuntimeAccessible('Size')
export class Size extends ISize<Point> {
    static subclasses: any[] = [];
    private static sizeofvar: HTMLElement;
    private static $sizeofvar: JQuery<HTMLElement>;
    private dontMixWithGraphSize: any;

    /**
     * measure a node size
     * @param {Element} element0 - the emelemnt to measure;
     * @param {boolean} sizePostTransform - includes css transform instructions for computing his size. like transform: scale(1.5)
     * */
    public static of(element0: Element, sizePostTransform: boolean = true): Size {
        let element: HTMLElement = element0 as HTMLElement;
        if (element as unknown === document) {
            Log.ww('trying to measure document, rerouted to measuring body.');
            element = document.body as any;
        }
        const $element = $(element);
        Log.ex(!element || element.tagName === 'foreignObject', 'sizeof()', 'SvgForeignElementObject have a bug with size, measure a child instead.', element);
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
        // size = new Size(tmp.left, tmp.top, 0, 0);
        let rect = element.getBoundingClientRect();
        size = new Size(0, 0, 0, 0);

        let win = (element.ownerDocument?.defaultView || window);
        size.x = rect.left + win.scrollX;
        size.y = rect.top + win.scrollY;
        if (sizePostTransform) {
            size.w = rect.width;
            size.h = rect.height;
        }
        else {
            size.w = element.offsetWidth; // element.scrollWidth;
            size.h = element.offsetHeight;
        }
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
@RuntimeAccessible('GraphSize')
export class GraphSize extends ISize<GraphPoint> {
    private dontMixWithSize: any;

    public static fromPoints(firstPt: GraphPoint, secondPt: GraphPoint): GraphSize {
        const minX = Math.min(firstPt.x, secondPt.x);
        const maxX = Math.max(firstPt.x, secondPt.x);
        const minY = Math.min(firstPt.y, secondPt.y);
        const maxY = Math.max(firstPt.y, secondPt.y);
        return new GraphSize(minX, minY, maxX - minX, maxY - minY); }

    // both pt and targetPt are readonly-safe parameters
    public static closestIntersection(size: GraphSize, pt: GraphPoint/*segment start*/, targetPt: GraphPoint/*segment end*/, gridAlign?: GraphPoint, m0?:number, q0?:number): GraphPoint | undefined {
        // let pt: GraphPoint = pt0.duplicate();
        const m = m0 || GraphPoint.getM(targetPt, pt);
        const q = q0 || GraphPoint.getQ(targetPt, pt);
        // console.log("closestIntersection()", {size, pt0, targetPt, m, q});
        // let mrecalc = GraphPoint.getM(targetPt, pt);
        // if (mrecalc !== m) console.error('closestIntersection err', {size, pt, targetPt, mrecalc, m, q, mcorrect: mrecalc == m, qcorrect: GraphPoint.getQ(targetPt, pt) === q})
        // else  console.log('closestIntersection 0', {size, pt, targetPt, m, q, mcorrect: mrecalc == m, mrecalc, qcorrect: GraphPoint.getQ(targetPt, pt) === q})
        // if perfectly vertical line
        if (U.isInfinite(m)) {
            // top center
            if (Math.abs(targetPt.y - size.y) <= Math.abs(targetPt.y - size.y - size.h)) return new GraphPoint(pt.x, size.y);
            // bottom center
            else return new GraphPoint(pt.x, size.y + size.h);
        }
        let tl = size.tl(), tr = size.tr(),
            bl = size.bl(), br = size.br();
        let allowT: boolean, allowB: boolean,
            allowL: boolean, allowR: boolean;
        /*let distanceT: number = Number.POSITIVE_INFINITY, distanceB: number = Number.POSITIVE_INFINITY,
            distanceL: number = Number.POSITIVE_INFINITY, distanceR: number = Number.POSITIVE_INFINITY;*/
        let intersectionT: GraphPoint | undefined, intersectionB: GraphPoint | undefined,
            intersectionL: GraphPoint | undefined, intersectionR: GraphPoint | undefined;


        allowT = Geom.isNumberBetween(tl.y, bl.y, targetPt.y);
        allowB = Geom.isNumberBetween(bl.y, tl.y, targetPt.y);
        allowL = Geom.isNumberBetween(tl.x, tr.x, targetPt.x);
        allowR = Geom.isNumberBetween(tr.x, tl.x, targetPt.x);
        // console.log("closestIntersection pt0", {size, targetPt, pt0:pt0.raw(), gridAlign,
        //     corners:{tl:tl.raw(), tr:tr.raw(), bl:bl.raw(), br:br.raw()}, allows:{allowT, allowB, allowL, allowR}});
        // console.log("closestIntersection 1", {isInternal:!(allowT || allowB || allowL || allowR), allowT, allowB, allowL, allowR});
        if (!(allowT || allowB || allowL || allowR)) return undefined; // point is internal to size
        if (allowT) intersectionT = Geom.lineToSegmentIntersection(tl, tr, q, m); else
        if (allowB) intersectionB = Geom.lineToSegmentIntersection(bl, br, q, m); // NOT else, (T|B) AND (L|R) can happen, or just 1 or 0 of those.
        if (allowL) intersectionL = Geom.lineToSegmentIntersection(tl, bl, q, m); else
        if (allowR) intersectionR = Geom.lineToSegmentIntersection(tr, br, q, m);

        // console.log("closestIntersection 2", {intersectionT, intersectionB, intersectionL, intersectionR});
        // only 1 intersection can happen
        return intersectionT || intersectionB || intersectionL || intersectionR;
    }
    public static closestIntersection_old(size: GraphSize, prevPt: GraphPoint, pt0: GraphPoint, gridAlign?: GraphPoint): GraphPoint | null {
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
        if (U.isInfinite(m)) { // bottom middle
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
        console.log("intersect pt1:", {T, B, L, R});
        if ( (B.x >= pt.x && B.x <= prevPt.x) || (B.x >= prevPt.x && B.x <= pt.x) ) { } else { B = null; }
        if ( (T.x >= pt.x && T.x <= prevPt.x) || (T.x >= prevPt.x && T.x <= pt.x) ) { } else { T = null; }
        if ( (L.y >= pt.y && L.y <= prevPt.y) || (L.y >= prevPt.y && L.y <= pt.y) ) { } else { L = null; }
        if ( (R.y >= pt.y && R.y <= prevPt.y) || (R.y >= prevPt.y && R.y <= pt.y) ) { } else { R = null; }
        console.log("intersect pt2:", {T, B, L, R});
        function closestmix(pt: GraphPoint, closest: GraphPoint, segStart: GraphPoint, segEnd: GraphPoint, mode: "TB" | "LR"): void {
            // changes pt
            pt.x = closest.x; pt.y = closest.y; return;
            let main: "x" | "y", sub: "x" | "y";
            if (mode === "TB") { main = "y"; sub = "x"; } else { main = "x"; sub = "y"; }
            pt[main] = closest[main];
            // if T[sub] is inside the top segment, take T[sub], otherwise closest between size.tl[sub] and size.tr[sub]
            // pt[sub] = Math.max(segStart[sub], Math.min(segStart[sub], closest[sub]));
            if (closest[sub] <= segEnd[sub] && closest[sub] >= segStart[sub]) pt[sub] = closest[sub];
            else if (Math.abs(closest[sub]-segEnd[sub]) < Math.abs(closest[sub]-segStart[sub])) pt[sub] = segEnd[sub];
            else pt[sub] = segStart[sub];
        }
        function closestmix2(pt: GraphPoint, closest: GraphPoint, segStart: GraphPoint, segEnd: GraphPoint, mode: "TB" | "LR"): void {
            // changes closest
            let main: "x" | "y", sub: "x" | "y";
            if (mode === "TB") { main = "y"; sub = "x"; } else { main = "x"; sub = "y"; }
            // closest[main] = pt[main];
            // if T[sub] is inside the top segment, take T[sub], otherwise closest between size.tl[sub] and size.tr[sub]
            // pt[sub] = Math.max(segStart[sub], Math.min(segStart[sub], closest[sub]));
            if (closest[sub] <= segEnd[sub] && closest[sub] >= segStart[sub]) {/*no-op*/}
            else if (Math.abs(closest[sub]-segEnd[sub]) < Math.abs(closest[sub]-segStart[sub])) closest[sub] = segEnd[sub];
            else closest[sub] = segStart[sub];
        }
        console.log("intersect pt2.5:");
        try{
            if(T) closestmix2(pt, T, vertexGSize.tl(), vertexGSize.tr(), "TB");
            if(B) closestmix2(pt, B, vertexGSize.bl(), vertexGSize.br(), "TB");
            if(R) closestmix2(pt, R, vertexGSize.tr(), vertexGSize.br(), "LR");
            if(L) closestmix2(pt, L, vertexGSize.tl(), vertexGSize.bl(), "LR");
        } catch(e){ console.error("intersect error",e)}
        // console.log('superstiti step1: (LTBR):', L, T, B, R);
        console.log("intersect pt2.9:");
        const vicinanzaT = !T ? Number.POSITIVE_INFINITY : ((T.x - pt.x) * (T.x - pt.x)) + ((T.y - pt.y) * (T.y - pt.y));
        const vicinanzaB = !B ? Number.POSITIVE_INFINITY : ((B.x - pt.x) * (B.x - pt.x)) + ((B.y - pt.y) * (B.y - pt.y));
        const vicinanzaL = !L ? Number.POSITIVE_INFINITY : ((L.x - pt.x) * (L.x - pt.x)) + ((L.y - pt.y) * (L.y - pt.y));
        const vicinanzaR = !R ? Number.POSITIVE_INFINITY : ((R.x - pt.x) * (R.x - pt.x)) + ((R.y - pt.y) * (R.y - pt.y));
        const closest = Math.min(vicinanzaT, vicinanzaB, vicinanzaL, vicinanzaR);
        console.log("intersect pt3:", {vicinanzaT, vicinanzaB, vicinanzaL, vicinanzaR, closest});

        // console.log( 'closest:', closest);
        // succede quando pt e prevPt sono entrambi all'interno del rettangolo del vertice.
        // L'edge non è visibile e il valore ritornato è irrilevante.

        if (closest === Number.POSITIVE_INFINITY) {
            console.error('x01 case +inf, this case should not be possible', {closest, T, B, L, R, vertexGSize, prevPt, pt0});
            /* top center */
            pt = vertexGSize.tl();
            pt.x += vertexGSize.w / 2; } else
        if (closest === Number.NEGATIVE_INFINITY) {
            console.error('x01 case -inf, this case should not be possible', {closest, T, B, L, R, vertexGSize, prevPt, pt0});
            /* bottom center */
            pt = vertexGSize.br();
            pt.x -= vertexGSize.w / 2; } else
        if (closest === vicinanzaT && T) {
            closestmix(pt, T as any, vertexGSize.tl(), vertexGSize.tr(), "TB");
            /*pt.y = T.y;
            // if T.x is inside the top segment, take T.x, otherwise closest between size.tl.x and size.tr.x
            if ((T.x <= tr.x && T.x >= tl.x)) pt.x = T.x;
            else if (Math.abs(T.x-tr.x) < Math.abs(T.x-tl.x)) pt.x = tr.x;
            else pt.x = tl.x;*/
        }
        if (closest === vicinanzaB) { closestmix(pt, B as any, vertexGSize.bl(), vertexGSize.br(), "TB"); } else
        if (closest === vicinanzaR) { closestmix(pt, R as any, vertexGSize.tr(), vertexGSize.br(), "LR"); } else
        if (closest === vicinanzaL) { closestmix(pt, L as any, vertexGSize.tl(), vertexGSize.bl(), "LR"); }

        if (!gridAlign) { return pt; }
        if (!pt) return null;
        if (gridAlign.x && (pt === T || pt === B || isNaN(closest))) {
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
        } else if (gridAlign.y && (pt === L || pt === R)) {
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



export type PositionStrTypes =
    "top" | "bottom" | "left" | "right" | "" | // '' = x&y center, undefined = top
    "top right" | "top left" | "bottom left" | "bottom right" |
    "right top" | "left top" | "left bottom" | "right bottom" |
    "t" | "b" | "l" | "r" |
    "tl" | "tr" | "bl" | "br" |
    "lt" | "rt" | "lb" | "rb";

@RuntimeAccessible('PositionStr')
export class PositionStr{
    public static cname = 'PositionStr';

    x: -1 | 0 | 1; // left, centered, right
    y: -1 | 0 | 1;
    constructor(x?: PositionStr['x'], y? :PositionStr['y']){
        this.x = x ?? 0;
        this.y = y ?? -1;
    }
    toString(): PositionStrTypes{
        return PositionStr.toPosString(this);
    }
    invert(x = true, y = true): this {
        if (x) this.x = -this.x as 1|0|-1;
        if (y) this.y = -this.y as 1|0|-1;
        return this;
    }
    public static toPosString(o: PositionStr): PositionStrTypes{
        let s: string;
        if (o.y === -1) s = 't';
        else if (o.y === 1) s = 'b';
        else s = '';

        if (o.x === -1) s += 'l';
        else if (o.x === 1) s += 'r';
        // else s = +'';
        // if (!s) return "c";
        return s as PositionStrTypes;
    }
    public static fromPosString(position?: PositionStrTypes): PositionStr{
        let ret = new PositionStr(0, 0);
        let posarr = (position ?? 't').split(' '); // .map(s=>s[0]);
        for (let p of posarr)
            switch (p) {
                default:
                case "t": case "top":                       ret.y = -1; break;
                case "b": case "bottom":                    ret.y =  1; break;
                case "l": case "left":                      ret.x = -1; break;
                case "r": case "right":                     ret.x =  1; break;
                case "tl": case "lt": case "top left":      ret.y = -1; ret.x = -1; break;
                case "tr": case "rt": case "top right":     ret.y = -1; ret.x =  1; break;
                case '': case 'c':                          ret.x =  0; ret.y =  0; break;
                case "bl": case "lb": case "bottom left":   ret.y =  1; ret.x = -1; break;
                case "br": case "rb": case "bottom right":  ret.y =  1; ret.x =  1; break;
            }
        return ret;
    }
    public static invertPosStr(pos?: PositionStrTypes): PositionStrTypes{
        return PositionStr.fromPosString(pos).invert().toString() as any;
    }

    private static toFullLabelSingle(position: string | "" | "c" | "t" | "b" | "l" | "r"): "top" | "bottom" | "left" | "right" | "center" {
        switch (position?.trim()[0]){
            case 'c': case '': return 'center';
            case 't': return 'top';
            default: if (position.trim() === '') return 'center'; return 'bottom';
            case 'b': return 'bottom';
            case 'l': return 'left';
            case 'r': return 'right';
        }
    }
    // tl -> top left
    static toSeparateFullLabels(position?: PositionStrTypes): string {
        let pos = (position ?? 'b').trim();

        if (pos.length === 2) {
            return PositionStr.toFullLabelSingle(pos[0]) + ' ' + PositionStr.toFullLabelSingle(pos[1]);
        } else if (pos.indexOf(' ')) { return pos.split(' ').map(s => PositionStr.toFullLabelSingle(s as any)).join(' '); }
        else return PositionStr.toFullLabelSingle(pos[0]);
        return "";
    }
}

@RuntimeAccessible('Geom')
export class Geom extends RuntimeAccessibleClass {

    static markings: Dictionary<string, HTMLElement> = {};
    static unmark(key: string): boolean{
        if (!Geom.markings[key]) return false;
        let e = Geom.markings[key];
        U.removeFromDom(e);
        delete Geom.markings[key];
        return true;
    }
    static markPt(key: string, pt: Point, color?: string, label?: string): HTMLElement{ return Geom.mark(key, pt.x, pt.y, 1, 1, color, label); }
    static markSize(key: string, pt: Size, color?: string, label?: string): HTMLElement{ return Geom.mark(key, pt.x, pt.y, pt.w??1, pt.h??1, color, label); }
    static mark(key: string, x: number, y: number, w: number=1, h: number=1, color: string='red', label: string=''): HTMLElement{
        if (Geom.markings[key]) Geom.unmark(key);
        let e: HTMLElement;
        let pre = '<div class="debug-mark" data-key="'+key+'" data-label="'+label+'" style="position: absolute; z-index:99999; left:'+x+'px; top:'+y+'px; width: '+w+'px; height: '+h+'px;';
        let post = '"/>';
        if (w + h > 2) {
            e = U.toHtml(pre+'border-radius:0; background: transparent;'+post) as HTMLElement;
        }
        else {
            e = U.toHtml(pre+'border-radius:100%; background: '+color+'; outline: 1px solid '+color+'; outline-offset: 5px;'+post) as HTMLElement;
        }
        document.body.append(e);
        Geom.markings[key] = e;
        return e;
    }
    // warning: nodes from other iframes will say are not instance from Element of the current frame, in that case need duck typing.
    public static isHtmlNode(element: any): element is Element {
        return element instanceof Element || element instanceof HTMLDocument || element instanceof SVGElement;
    }


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
        if (n === Number.NEGATIVE_INFINITY) { return 270; }
        return Geom.RadToDegree((window as any).Math.atan(n)); }

    static RadToDegree(radians: number): number { return Geom.radToDeg(radians); }
    static DegreeToRad(degree: number): number { return Geom.degToRad(degree); }
    static radToDeg(radians: number): number { return radians * (180 / Math.PI); }
    static degToRad(degree: number): number { return degree * (Math.PI / 180); }



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
            && ( pt.y - shape.y > tolerance && pt.y - (shape.y + shape.h) < tolerance);
        return (pt.x === shape.x + shape.w) && (pt.y >= shape.y && pt.y <= shape.y + shape.h);
    }

    static isOnLeftEdge(pt: GraphPoint, shape: GraphSize, tolerance: number = Geom.GeomTolerance): boolean {
        if (!pt || !shape) { return false; }
        if (tolerance) return Math.abs(pt.x - shape.x) < tolerance
            && (pt.y - shape.y > tolerance && pt.y - (shape.y + shape.h) < tolerance);
        return (pt.x === shape.x) && (pt.y >= shape.y && pt.y <= shape.y + shape.h);
    }

    static isOnTopEdge(pt: GraphPoint, shape: GraphSize, tolerance: number = Geom.GeomTolerance): boolean {
        if (!pt || !shape) { return false; }
        if (tolerance) return Math.abs(pt.y - shape.y) < tolerance
            && (pt.x - shape.x > tolerance && pt.x - (shape.x + shape.w) < tolerance);
        return (pt.y === shape.y) && (pt.x >= shape.x && pt.x <= shape.x + shape.w);
    }

    static isOnBottomEdge(pt: GraphPoint, shape: GraphSize, tolerance?: number): boolean {
        if (!pt || !shape) { return false; }
        if (tolerance) return Math.abs(pt.y - shape.y + shape.h) < tolerance
            && (pt.x - shape.x > tolerance && pt.x - (shape.x + shape.w) < tolerance);
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

    // @param: lineX = only required if m === (+-)infinite, is the X coord where the vertical line lies.
    static lineToSegmentIntersection(segStart: GraphPoint, segEnd: GraphPoint, q: number, m: number, lineX?: number): GraphPoint | undefined {
        let lineIsVertical = m === Number.POSITIVE_INFINITY || m === Number.NEGATIVE_INFINITY;
        let lineIsHorizontal = +m === 0; // unary plus operator is required because: +(-0)  === 0, but not sure if -0 === 0
        let isNaNm = isNaN(m);
        let isNaNq = isNaN(q);
        Log.eDev(isNaNm && isNaNq || isNaNm && !isNaNq, 'Error in Geom lineSegmentIntersection, m and q are not coherent', {m, q});
        Log.w((isNaNm || isNaNq) && lineX === undefined, 'Error in Geom lineSegmentIntersection, m is infinite and no points were provided', {m, q});
        if (segStart.x === segEnd.x){ // vertical segment |
            if (lineIsVertical) {
                if (lineX !== undefined && lineX === segStart.x) return new GraphPoint(lineX, (segStart.y + segEnd.y)/2); // complete overlap of segment and line, i take middle
                return undefined; // parallel vertical segment-line
            } else { // vertical segment, skewed or horizontal line
                let y = m*segStart.x + q;
                if (Geom.isNumberBetween(y, segStart.y, segEnd.y)) return new GraphPoint(segStart.x, y);
                else return undefined;
            }
        }
        else if (segStart.y === segEnd.y) { // horizontal segment -------------------
            if (lineIsVertical) {
                if (lineX !== undefined && Geom.isNumberBetween(lineX, segStart.x, segEnd.x)) return new GraphPoint(lineX, segStart.y); // perpendicular and intersecating
                return undefined; // perpendicular but outside segment width
            }
            else if (lineIsHorizontal) { // horizontal line
                if (Geom.isNumberBetween(q, segStart.y, segEnd.y)) return new GraphPoint((segStart.x + segEnd.x), q); // complete overlap of segment and line, i take middle
                return undefined; // parallel horizontal line-segment
            } else {
                let x = (segStart.y-q)/m;
                if (Geom.isNumberBetween(x, segStart.x, segEnd.x)) return new GraphPoint(x, segStart.y);
                else return undefined;
            }
        }

        let m2 = segStart.getM(segEnd);
        let q2 = IPoint.getQ(segStart, segEnd);
        // NB: at this point m2 cannot be infinite | -infinite, but can be -0, m can be anything
        if (+m === +m2) {
            if (+q === +q2) return segStart; // line and segment coincident
            return undefined; // parallel
        }
        let intersect: GraphPoint | undefined;
        if (U.isInfinite(m)) {
            if (lineX !== undefined) intersect = new GraphPoint(lineX, m2*lineX + q2);
            return undefined;
        } else {
            intersect = Geom.lineToLineIntersection(m, q, m2, q2, undefined);
        }
        if (intersect && Geom.isNumberBetween(intersect.x, segStart.x, segEnd.x) && Geom.isNumberBetween(intersect.y, segStart.y, segEnd.y)) return intersect;
        else return undefined;
    }

    static isNumberBetween(target: number, s: number, e: number): boolean {
        let max = Math.max(s, e);
        let min = Math.min(s, e);
        return target >= min && target <= max; }


    // NB invalid if any of the lines are verytical, in which case need to take the X of the vertical line (xVertical) and intersection is: new Point(xVertical, m_otherLine * xVertical + q_otherLine)
    private static lineToLineIntersection(m: number, q: number, m2: number, q2: number, retIfInvalid: any, retIfParallel: any = undefined, retIfCoincident: any = undefined): undefined | GraphPoint {

        if (+m === +m2 || U.isInfinite(m) && U.isInfinite(m2)) {
            if (+q === +q2 || U.isInfinite(q) && U.isInfinite(q2)) return retIfCoincident; // line and segment coincident
            return retIfParallel; // parallel
        }

        if (m === Number.POSITIVE_INFINITY || m === Number.NEGATIVE_INFINITY || m2 === Number.POSITIVE_INFINITY || m2 === Number.NEGATIVE_INFINITY) {
            // m or m2 are a vertical line, Q must be invalid too and i don't have a single point of the line.
            // it's actually infinite possible vertical parallel lines.
            return retIfInvalid;
        }
        /*
            y = mx + q
            y = nx + w
            -->
            mx + q = nx + w
            -->
            mx - nx = w - q
            -->
            x (m - n) = w - q
            -->
            x = (w - q)/(m - n)
        */
        let x = (q2-q)/(m-m2);
        return new GraphPoint(x, m*x+q); }
    // @param start, end: are for determining direction. every m is a line that can be seen in 2 direction
    static mToRad(m: number, start: GraphPoint, end: GraphPoint): number {
        let rad: number;
        if (start.x === end.x) {
            rad = (start.y < end.y) ? Math.PI * 3/2 :  Math.PI / 2;
        } else {
            // console.log("rad diagonal", {base:  Math.atan(m), add: start.x > end.x, sx: start.x, ex: end.x});
            rad = Math.atan(m) + (start.x > end.x ? 0 : Math.PI);
        }
        return rad; }

    // intersect a rectangle with a line or segment (if end parameter is specified)
    // @return: [0, 2] intersections
    static lineToSizeIntersection_TODO(size: GraphSize, m: number, startLine: GraphPoint, endIfSegment?: GraphPoint): [] | [GraphPoint] | [GraphPoint, GraphPoint] {
         // todo: use GraphSize.closestIntersection which is close. it is size-segment returning only the closest intersection
        return [];
    }
}

RuntimeAccessibleClass.set_extend(RuntimeAccessibleClass, Geom);
