import React, {useEffect, useState} from 'react';
import "./Draggable.css";
import $ from "jquery";
import "jqueryui";
import "jqueryui/jquery-ui.css";
import {GObject, U} from "../../joiner";

export default function Draggable3()  {

    const getPerimeter = (x: number, y: number, width: number, height: number): Set<number[]> => {
        let firstX = x;
        let lastX = firstX + width;
        let firstY = y;
        let lastY = firstY + height;
        const perimeter = new Set<number[]>();
        while(firstX < lastX) {
            perimeter.add([firstX, firstY]);
            perimeter.add([firstX, lastY]);
            firstX++;
        }
        firstX = x;
        while(firstY < lastY) {
            perimeter.add([firstX, firstY]);
            perimeter.add([lastX, firstY]);
            firstY++;
        }
        return perimeter;
    }

    const myFunctionWithPerimeter = (perimeter: Set<number[]>) => {
        const k = -40;
        for(let point of perimeter) {
            const x = point[0]; const y = point[1];
            if(!(((x + k) * (x + k)) + ((y + k) * (y + k)) < (40 * 40))) { return false; }
        }
        return true;
    }

    const myHelper = (): Set<number[]> => {
        const area = new Set<number[]>();
        const n = 80;
        const k = -40;
        for(let x = 0; x < n; x++) {
            for(let y = 0; y < n; y++) {
                if(((x + k) * (x + k)) + ((y + k) * (y + k)) < (40 * 40)) {
                    area.add([x, y]);
                }
            }
        }
        return area;
    }

    const myFunction = (y: number, x: number): boolean => {
        const k= -40;
        return ((x + k) * (x + k)) + ((y + k) * (y + k)) < (40 * 40);
    }

    useEffect(() => {
        const element: JQuery & GObject = $("#test");
        element.draggable({
            cursor: "grabbing",
            containment: "parent",
            drag: function(event: GObject, obj: GObject){
                const y: number = obj.position.top;
                const x: number = obj.position.left;
                let height: number = element.height() as number;
                let width: number = element.width() as number;
                const centeredY: number = y + (height / 2);
                const centeredX: number = x + (width / 2);
                if(myFunction(centeredY, centeredX)) {
                    element.draggable( "option", "revert", false );
                } else {
                    element.draggable( "option", "revert", true );
                }
                return myFunction(centeredY, centeredX)
                /*
                if(myFunctionWithPerimeter(getPerimeter(x, y, width, height))) {
                    element.draggable( "option", "revert", false );
                } else {
                    element.draggable( "option", "revert", true );
                }
                myFunctionWithPerimeter(getPerimeter(x, y, width, height));
               */
            }
        });
        element.resizable({
            containment: "parent",
            resize: function(event: GObject, obj: GObject){
                const y: number = obj.position.top;
                const x: number = obj.position.left;
                const height: number = obj.size.height;
                const width: number = obj.size.width;
                const centeredY: number = y + (height / 2);
                const centeredX: number = x + (width / 2);

                if(myFunction(centeredY, centeredX)) {
                    element.resizable("option", "maxWidth", 9999);
                    element.resizable("option", "maxHeight", 9999);
                } else {
                    element.resizable("option", "maxWidth", width);
                    element.resizable("option", "maxHeight", height);
                }
            }
        });
    },[]);
    return(<>
        <div className={"d-none my-container"} >
            <div id={"test"} className={"ui-widget-content"}></div>
        </div>
        {/*[...myHelper()].map((point) => {
            return <div style={{position: "absolute", background: "black", height: "1px", width: "1px", top: point[1] + "px", left: point[0] + "px"}}></div>
        })*/}
    </>);
}
