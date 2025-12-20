
import React, {ReactNode} from "react";
import {ISize, L, LGraph, Pointers} from "../../joiner";

type radians = number;

type InfiniteSvgGridProps = {
    node: LGraph;
    offset?: {x: number, y: number};
    grid?: {x: number, y: number | radians, type: string};
    zoom?: {x: number, y: number};
};


export const Grid: React.FC<InfiniteSvgGridProps> = (props) => {
    let node = props.node;
    //@ts-ignore
    if (Pointers.isPointer(node)) node = L.from(node);
    const offset = props.offset || node.offset;
    const grid = props.grid || node.grid;
    if (!grid.x) grid.x = 0;
    if (!grid.y) grid.y = 0;
    const zoom = props.zoom || node.zoom;
    let {x, y} = grid || {x:0, y:0};
    // if graph size is unknown, i use 8k monitors fullscreen (7680 × 4320)
    if (grid.type === 'polar') return PolarGrid(grid as LGraph['grid'], offset, zoom, ('h' in offset ? offset as any : {...offset, w:7680, h:4320}));
    // let size = node.size; NO! it is 0,0,0,0; use offset instead
    /*if (x < 0) { x = 0; }
    if (y < 0) { y = 0; }
    if (zoom.x <= 0) { zoom.x = 1; }
    if (zoom.y <= 0) { zoom.y = 1; }*/

    const transform = `scale(${zoom.x}, ${zoom.y}) translate(${offset.x}, ${offset.y})`; // scale(${zoom.x}, ${zoom.y});

    return (
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
            <defs>
                {/* Minor grid */}
                <pattern
                    id="minor-grid"
                    width={x}
                    height={y}
                    patternUnits="userSpaceOnUse"
                    patternTransform={transform}
                >
                    <path
                        d={x ? `M 0 0 L ` + (x ? x+' 0 ' : '') + (y ? '0 '+y : '') : ('')}
                        // @ts-ignore
                        dataD={x ? `M 0 0 L ` + (x ? x+' 0 ' : '') + (y ? '0 '+y : '') : ('')}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1}
                        vectorEffect="non-scaling-stroke"
                    />
                </pattern>

                {/* Major grid */}
                <pattern
                    id="major-grid"
                    width={x * 10}
                    height={y * 10}
                    patternUnits="userSpaceOnUse"
                    patternTransform={transform}
                >
                    <path
                        d={x ? `M ${x*10} 0 L ` + (x ? '0 0 ' : '') + (y*10 ? '0 '+y*10 : '') : ('')}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        vectorEffect="non-scaling-stroke"
                    />
                </pattern>
            </defs>

            <rect width="100%" height="100%" fill="url(#minor-grid)" />
            <rect width="100%" height="100%" fill="url(#major-grid)" />
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

    console.log('radial grid',{minRadius, maxRadius, offset, size, })
    const radialLines = () => {
        const step = angleStep;
        let length = Math.ceil(Math.PI * 2 / step);
        return Array.from(
            { length },
            (_, i) => {
                const a = i * step;
                const x = Math.cos(a) * maxRadius;
                const y = Math.sin(a) * maxRadius;
                if (i == length - 1 && y < step*0.0001) return null; // skip near overlapping last line due to rounding errors.
                const isThick = i % 10;
                console.log('radial grid line ' + i, {a, x, y, step, maxRadius});
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
        for (let radius = Math.floor(minRadius / step) * step/* || step*/; radius <= maxRadius; radius+=step) {
            console.log('radial grid circle ' + i, {radius, minRadius, step, maxRadius});
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