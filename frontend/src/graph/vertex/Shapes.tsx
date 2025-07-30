import type { VertexOwnProps } from "../graphElement/sharedTypes/sharedTypes";
import type {radian} from "../../joiner/types";
import React, {ReactElement, ReactNode} from "react";
import {GObject, Point, U, Geom} from "../../joiner";
import {VertexConnected} from "./Vertex";


function polygonSideLength(sides: number, radius: number = 1){
    let rad = Math.PI/sides; // actual angle is twice, ut to do calculations i need half of it, to make it first a triangle slice out of a polygon, and then 2 right angle slices. this is the angle of 1 of the 2 right angle slices
    return 2*(radius * Math.sin(rad)); }

function makePolygon(sides: number, radius: number = 0.5, startingPoint?:Point, startingRad?: radian): Point[]{
    let lastPt: Point = startingPoint || new Point(radius, 0);
    let pts: Point[] = [lastPt];
    let sideLength = polygonSideLength(sides, radius);
    let rad0 = Math.PI/sides;
    let currentRad: radian = startingRad !== undefined ? startingRad : rad0;
    let sidesloop = sides;
    while (sidesloop-- > 0) {
        let nextPt = lastPt.move(currentRad, sideLength);
        pts.push(nextPt);
        lastPt = nextPt;
        currentRad += rad0*2;
    }
    return pts;
}

function makeStar(sides: number, radius: number = 0.5, starRadius: number=0.25, niceBugVersion: boolean = true): Point[]{
    console.log("make star", {sides, starRadius});
    let startRad;
    let nextPtRad;
    if (niceBugVersion && sides % 2 == 0) {
        // nb: not fully correct, the correct "bug" version on even would be having an inner polygon identical to outer poly (not rotated)
        // with points[0] = topmost point of the ex-circle for both odd polys. and then matching outer[i] with inner[i-1] points to make a line
        startRad = Geom.degToRad(180/sides+90);
        //nextPtRad = -startRad*2;
        nextPtRad = -startRad*2*(sides-1);
    } else {
        startRad = -Geom.degToRad(-180/sides+90);
        nextPtRad = (startRad - Geom.degToRad(90))*2;
    }
    let startPt: Point = new Point(0.5, 0.5).move(startRad, starRadius);
    //startPt.y = 2*0.5 - startPt.y;
    let poly = makePolygon(sides, radius);
    let innerPoly = makePolygon(sides, starRadius, startPt, nextPtRad);
    //innerPoly = [innerPoly[0], innerPoly[1]]
    let ret: Point[] = []; // both go clockwise, but inner starts on opposide side
    //return innerPoly;
    for (let i = 0; i <= sides; i++) ret.push(poly[i], innerPoly[i]);
    return ret.filter(r => !!r);
}

function makeAsterisk(sides: number, radius: number = 0.5, starRadius: number=0.25): Point[]{
    console.log("make asterisk, todo", {sides, starRadius});
    return [];
}
function makeClipPath(pts:Point[]): string {
    return 'polygon(' + pts.map(pt=> (pt.x*100 + '% ' + pt.y*100 + '%')).join(', ') + ')';
}
/*
function makeSvg(pts: Point[]): string{
    let val = 'M' + (pts.map(pt=> ('L' + pt.x*100 + ' ' + pt.y*100 + ' ')).join(', ')).substring(1) + '';
    let html = document.querySelector('#p');
    html.setAttribute('d', val);
    html.style.display='block';
    html = document.querySelector('#c'+0);
    html.setAttribute("cx", pts[0].x*100);
    html.setAttribute("cy", pts[0].y*100);

    for (let i = 1; i < 20; i++) {
        let v =  pts[i] ? "M" + pts[i-1].x*100 + ' ' + pts[i-1].y*100 + " L" + pts[i].x*100 + ' ' + pts[i].y*100 : "";
        html = document.querySelector('#p'+i);
        html.setAttribute('d', v);
        html.style.display='block';
        html.style.display='block';
        html = document.querySelector('#c'+i);
        if (!html) console.error("failed selector", '#c'+i, {i, v, pts});
        html.setAttribute("cx", pts[i] ? pts[i].x*100 : -500);
        html.setAttribute("cy", pts[i] ? pts[i].y*100 : -500);
    }
    console.log(html);
    return val;
}*/





// geom shortcuts
function addStyle(props0: VertexOwnProps, children:any, childStyle: React.CSSProperties, style: React.CSSProperties = {}){
    let props: GObject = {...props0, children, isGraph:false, isGraphVertex: false, isVertex:true, isEdgePoint: false, isField: false, isEdge: false, isVoid:true};
    // props.style = !props0.style ? {} : {...props0.style};
    props.childStyle = props.childStyle ? {...props.childStyle} : {};
    props.style = props.style ? {...props.style} : {};
    U.objectMergeInPlace(props.childStyle, childStyle, {
        // custom fixed stuff
    });
    U.objectMergeInPlace(props.style, style, {
        // custom fixed stuff
        filter: 'drop-shadow(0px var(--border-width) 0px var(--border-color)) drop-shadow(var(--border-width) 0px 0px var(--border-color))' +
            ' drop-shadow(calc( -1 * var(--border-width)) 0px 0px var(--border-color)) drop-shadow(0px calc( -1 * var(--border-width)) 0px var(--border-color))',
    });
    props.datastyle = JSON.stringify(props.style);
    props.dataChildStyle = JSON.stringify(props.childStyle);
    return props;}

export const Ellipse = (props: VertexOwnProps, children: ReactNode | undefined = []): ReactElement => {
    return <VertexConnected {...addStyle(props, children, {borderRadius:'100%', // ellipse(50% 25% at 50% 50%)
    })} />;}
Ellipse.cname = 'Ellipse';

export const Rectangle = (props: VertexOwnProps, children: ReactNode | undefined = []): ReactElement => { // default
    return <VertexConnected {...addStyle(props, children, {})} />;}
Rectangle.cname = 'Rectangle (alias for default <Vertex />)';

export const Polygon = (props: VertexOwnProps, children: ReactNode | undefined = []): ReactElement => {
    props = {...props};
    if (!props.sides) props.sides = 6;
    // if (!props.radius) props.radius = 0.5;
    return <VertexConnected {...addStyle(props, children, {clipPath: makeClipPath(makePolygon(props.sides, 0.5))})} />;
}
Polygon.cname = 'N-Polygon';

export const Star = (props: VertexOwnProps, children: ReactNode | undefined = []): ReactElement => { // pointed lines, N endings (include 6-stars and more)
    return props.decorated === false ? SimpleStar(props, children) : DecoratedStar(props, children);
}
Star.cname = 'N-Star';
export const DecoratedStar = (props: VertexOwnProps, children: ReactNode | undefined = []): ReactElement => {
    props = {...props};
    if (!props.sides) props.sides = 4;
    // if (!props.radius) props.radius = 0.5;
    if (!props.innerRadius) props.innerRadius = 0.25;
    return <VertexConnected {...addStyle(props, children, {clipPath: makeClipPath(makeStar(props.sides, 0.5, props.innerRadius, true))})} />;
}
DecoratedStar.cname = 'N-DecoratedStar';
export const SimpleStar = (props: VertexOwnProps, children: ReactNode | undefined = []): ReactElement => {
    props = {...props};
    if (!props.sides) props.sides = 6;
    // if (!props.radius) props.radius = 0.5;
    if (!props.innerRadius) props.innerRadius = 0.25;
    return <VertexConnected {...addStyle(props, children, {clipPath: makeClipPath(makeStar(props.sides, 0.5, props.innerRadius, false))})} />;
}
SimpleStar.cname = 'N-SimpleStar';

export const Cross = (props: VertexOwnProps, children: ReactNode | undefined = []): ReactElement => { // cut lines, N endings (includes asterisk)
    return <div>N-Crosses (Asterisk-like) shapes yet to do</div>;
}
Cross.cname = 'N-Cross';

export const Trapezoid = (props0: VertexOwnProps, children: ReactNode | undefined = []): ReactElement => { // cut lines, N endings (includes asterisk)
    let props: VertexOwnProps & {ratio: number} = props0 as any;
    if (!props0.ratio) props = {...props, ratio: 0.2 };
    return <VertexConnected {...addStyle(props, children, {clipPath: 'polygon(' + props.ratio * 100 + '% 0%, ' + (1-props.ratio) * 100 + '% 0%, 100% 100%, 0% 100%)'})} />;}
Trapezoid.cname = 'Trapezoid';


//////////////// aliases (circle -> ellipse) ...

export const Circle = (props: VertexOwnProps, children: ReactNode | undefined = []): ReactElement => { // ellipse ellipse(50% 50% at 50% 50%)
    return Ellipse(props, children); }
Circle.cname = 'Ellipse/Circle';

/*
step 1) put favoriteNode props on all GraphElememnt components except the most basic one like here,
in a way that mirrirong components will have the mirror name instead of the implementation name (which is always GraphVertex)
 favoriteNode={props.favoriteNode || Square.cname}
step 2) when parsing jsx to build nodes, edges, check if props like edge.start or node.favoriteNode are different from the same prop in DVertex/DEdge/DView
in that case, update such value
*/
export const Square = (props: VertexOwnProps, children: ReactNode | undefined = []): ReactElement => { // rectangle
    return <VertexConnected {...{...props, children}} isGraph={false} isVertex={true} isVoid={true} />; }
Square.cname = 'Rectangle/Square';
/*
export const Rhombus = (props: VertexOwnProps, children: ReactNode | undefined = []): ReactElement => { // rectangle
    return <VertexConnected {...{...props, children}} isGraph={false} isVertex={true} isVoid={true} rotate={props.rotate || 45} />; }
Rhombus.cname = 'Rectangle/Diamond';

export const Diamond = (props: VertexOwnProps, children: ReactNode | undefined = []): ReactElement => { return Rhombus(props, children); }
Diamond.cname = 'Rectangle/Diamond';*/

// polygon
export const Triangle = (props: VertexOwnProps, children: ReactNode | undefined = []): ReactElement => {
    return <VertexConnected {...addStyle(props, children, {clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'})} />;}
Triangle.cname = 'Polygon/Triangle';

export const Pentagon = (props: VertexOwnProps, children: ReactNode | undefined = []): ReactElement => {
    return <VertexConnected {...addStyle(props, children, {clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)'})} />;}
Pentagon.cname = 'Polygon/Pentagon';

export const Hexagon = (props: VertexOwnProps, children: ReactNode | undefined = []): ReactElement => {
    return <VertexConnected {...addStyle(props, children, {clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'})} />;}
Hexagon.cname = 'Polygon/Hexagon';

export const Heptagon = (props: VertexOwnProps, children: ReactNode | undefined = []): ReactElement => {
    return <VertexConnected {...addStyle(props, children, {clipPath: 'polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)'})} />;}
Heptagon.cname = 'Polygon/Heptagon';
export const Septagon = (props: VertexOwnProps, children: ReactNode | undefined = []): ReactElement => {
    return <VertexConnected {...addStyle(props, children, {clipPath: 'polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)'})} />;}
Septagon.cname = 'Polygon/Heptagon';

export const Octagon = (props: VertexOwnProps, children: ReactNode | undefined = []): ReactElement => {
    return <VertexConnected {...addStyle(props, children, {clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'})} />;}
Octagon.cname = 'Polygon/Octagon';

export const Nonagon = (props: VertexOwnProps, children: ReactNode | undefined = []): ReactElement => {
    return <VertexConnected {...addStyle(props, children, {clipPath: 'polygon(50% 0%, 83% 12%, 100% 43%, 94% 78%, 68% 100%, 32% 100%, 6% 78%, 0% 43%, 17% 12%)'})} />;}
Nonagon.cname = 'Polygon/Nonagon';

export const Enneagon = (props: VertexOwnProps, children: ReactNode | undefined = []): ReactElement => {
    return <VertexConnected {...addStyle(props, children, {clipPath: 'polygon(50% 0%, 83% 12%, 100% 43%, 94% 78%, 68% 100%, 32% 100%, 6% 78%, 0% 43%, 17% 12%)'})} />;}
Enneagon.cname = 'Polygon/Nonagon';

export const Decagon = (props: VertexOwnProps, children: ReactNode | undefined = []): ReactElement => {
    return <VertexConnected {...addStyle(props, children, {clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 50% 100%, 20% 90%, 0% 70%, 0% 35%, 20% 10%)'})} />;}
Decagon.cname = 'Polygon/Decagon';

export const Asterisk = (props: VertexOwnProps, children: ReactNode | undefined = []): ReactElement => { // cut lines, N endings (includes asterisk)
    return Star(props, children); }
Asterisk.cname = 'Cross/Asterisk';
