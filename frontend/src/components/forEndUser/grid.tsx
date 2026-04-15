
import React, {ReactNode} from "react";
import {DGraph, ISize, L, LGraph, LViewElement, Pointer, Pointers} from "../../joiner";

type radians = number;

type InfiniteSvgGridProps = {
    node?: LGraph; // fallback
    graph?: LGraph;
    graphid?: Pointer<DGraph>; // injected
    offset?: {x: number, y: number};
    grid?: LViewElement['grid'];
    zoom?: {x: number, y: number};
    mode?: "lines" | "points";
};


export const GridComponent: React.FC<InfiniteSvgGridProps> = (props: InfiniteSvgGridProps) => {
    let node = props.graph || props.node;
    //@ts-ignore
    if (Pointers.isPointer(node)) node = L.from(node);
    if (!node) node = L.fromPointer(props.graphid);
    if (!node) return null;
    const offset = props.offset || node.offset;
    const grid = props.grid || node.grid;
    if (!grid.visible) return null;
    if (!grid.x) grid.x = 0;
    if (!grid.y) grid.y = 0;

    const zoom = props.zoom || node.zoom;
    let {x, y} = grid || {x:0, y:0};
    if (x <= 0 && y <= 0) return null;
    // if graph size is unknown, i use 8k monitors fullscreen (7680 × 4320)
    if (grid.type === 'polar') return PolarGrid(grid as LGraph['grid'], offset, zoom, ('h' in offset ? offset as any : {...offset, w:7680, h:4320}));
    // let size = node.size; NO! it is 0,0,0,0; use offset instead
    /*if (x < 0) { x = 0; }
    if (y < 0) { y = 0; }
    if (zoom.x <= 0) { zoom.x = 1; }
    if (zoom.y <= 0) { zoom.y = 1; }*/

    const transform = `scale(${zoom.x}, ${zoom.y}) translate(${offset.x}, ${offset.y})`; // scale(${zoom.x}, ${zoom.y});

    let hideX = false;
    let hideY = false;
    if (x <= 0) {
        x = 999;
        hideY = true;
    }
    if (y <= 0) {
        y = 999;
        hideX = true;
    }
    let id = node.id;
    let modeDots = props.mode === 'points' && !hideX && !hideY;
    return (
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
            <defs>
                {/* Minor grid
                x=0  -> horizontal rows spaced by y -> y any, c = min(stroke-width) max(
                y=0  -> vertical columns spaced by x

                */}
                <pattern
                    id={id+"_minor-grid"}
                    width={x}
                    height={y}
                    patternUnits="userSpaceOnUse"
                    patternTransform={transform}
                >
                    {modeDots && // if x or y are missing, it collapses to infinite dots close, so it's just a line again
                        <>
                            <circle r={1} cx={0} cy={0} />
                            <circle r={1} cx={0} cy={y} />
                            <circle r={1} cx={x} cy={0} />
                            <circle r={1} cx={x} cy={y} />
                        </>
                    }
                    <path d={`M 0 0 L `  + (hideX ? '0 ' + y + ' ' : x + ' 0 ') +        (hideY ? '' : x + ' ' + y)}
                        // @ts-ignore
                        dataD={`M 0 0 L `+ (hideX ? '0 ' + y + ' ' : x + ' 0 ') + " _ " +(hideY ? '' : x + ' ' + y)}
                        fill="none"
                        stroke={modeDots ? 'transparent' : 'currentColor'}
                        strokeWidth={1}
                        vectorEffect="non-scaling-stroke"
                    />
                </pattern>

                {/* Major grid */}
                <pattern
                    id={id + "_major-grid"}
                    width={x * 10}
                    height={y * 10}
                    patternUnits="userSpaceOnUse"
                    patternTransform={transform}
                >
                    {modeDots && // if x or y are missing, it collapses to infinite dots close, so it's just a line again
                        <>
                            <circle r={2} cx={0}    cy={0}    />
                            <circle r={2} cx={0}    cy={y*10} />
                            <circle r={2} cx={x*10} cy={0}    />
                            <circle r={2} cx={x*10} cy={y*10} />
                        </>
                    }
                    <path
                        d={`M 0 0 L ` + (hideX ? '0 ' + y * 10 + ' ' : x * 10 + ' 0 ') + (hideY ? '' : x * 10 + ' ' + y * 10)}
                        // d={`M 0 0 L ` + (x ? x*10+' 0 ' : '') + (y ? x*10+' '+y*10 : '')}
                        fill="none"
                        stroke={modeDots ? 'transparent' : 'currentColor'}
                        strokeWidth={2}
                        vectorEffect="non-scaling-stroke"
                    />
                </pattern>
            </defs>

            <rect width="100%" height="100%" fill={"url(#" + id + "_minor-grid)"} />
            <rect width="100%" height="100%" fill={"url(#" + id + "_major-grid)"} />
        </svg>
    );
};

function PolarGrid(grid: LGraph['grid'], offset: { x: number; y: number }, zoom: { x: number; y: number}, size: ISize){
    let angleStep = grid.y;
    let rStep = grid.x;

    let safetyMargin = 1.414 * 1.1;// sqrt(2) for diagonals (with offset i measure circles at straight axis, but angles can hold more distant circles), with 1.1 extra margin.
    const maxRadius = Math.max((offset.x + size.w) / zoom.x, (offset.y + size.h) / zoom.y) * safetyMargin; //rStep * 100;
    const minRadius = Math.min(0, (offset.x - size.w) / zoom.x, (offset.y - size.h) / zoom.x) / safetyMargin; //rStep * 100;

    const transform = `scale(${zoom.x}, ${zoom.y}) translate(${offset.x}, ${offset.y})`; // scale(${zoom.x}, ${zoom.y});

    // console.log('radial grid',{minRadius, maxRadius, offset, size, })
    const radialLines = () => {
        const step = angleStep;
        if (step === 0) return null;
        let length = Math.ceil(Math.PI * 2 / step);
        return Array.from(
            { length },
            (_, i) => {
                const a = i * step;
                const x = Math.cos(a) * maxRadius;
                const y = Math.sin(a) * maxRadius;
                if (i == length - 1 && y < step*0.0001) return null; // skip near overlapping last line due to rounding errors.
                const isThick = i % 10;
                // console.log('radial grid line ' + i, {a, x, y, step, maxRadius});
                return (
                    <line
                        key={`polar-line-${i}`}
                        x1={0}
                        y1={0}
                        x2={x}
                        y2={y}
                        className={isThick ? 'thick' : ''}
                        stroke="currentColor"
                        strokeWidth={isThick === 0 ? 2 : 1}
                        vectorEffect="non-scaling-stroke"
                    />
                );
            }
        );
    };

    const circles = () => {
        const step = rStep;
        let arr: ReactNode[] = [];
        let i: number = -1;
        if (step === 0) return null;
        for (let radius = Math.floor(minRadius / step) * step/* || step*/; radius <= maxRadius; radius+=step) {
            // console.log('radial grid circle ' + i, {radius, minRadius, step, maxRadius});
            if (++i === 0 && angleStep) continue; // skip first circle if there are already radial lines (invisible anyway)
            if (radius < minRadius) continue; // maybe impossible, maybe for rounding?
            let isThick = i%10 === 0;
            arr.push(<circle
                key={`polar-circle-${i}`}
                className={isThick ? 'thick' : ''}
                cx={0}//-offset.x}
                cy={0}//-offset.y}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={isThick ? 2 : 1}
                vectorEffect="non-scaling-stroke"
            />)
        }
        return arr;
    };

    return (
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
            <g transform={transform}>
                {circles()}
                {radialLines()}
            </g>
        </svg>
    );
}

(GridComponent as any).cname = 'GridComponent';
(Grid as any).cname = 'Grid';
export function Grid(props:InfiniteSvgGridProps, children: ReactNode){ return <GridComponent {...props}>{children || (props as any).children}</GridComponent>; }
