import React from "react";
import {Log} from "./common/U";

export const uselessexport = {}








class Point{
    x: number;
    y: number;
    constructor (x: number=-1, y: number=-1) { this.x = +x; this.y = +y; }


    gethtml(): HTMLElement { return document.querySelector('.c[x="' + this.x + '"][y="' + this.y + '"]') as HTMLElement; }
    // getCell(): Cell { return Cell.all[this.x][this.y]; }
}
class Rectangle{
    tl: Point; // point topleft
    br: Point;
    constructor (x: number=-1, y: number=-1, w: number=-1, h: number=-1) { this.tl = new Point(x, y); this.br = new Point(w, h); }
    moveTo(point: Point, copy = true): Rectangle {
        let ret = copy ? new Rectangle(this.tl.x, this.tl.y, this.br.x, this.br.y) : this;
        ret.tl.x += point.x;
        ret.tl.y += point.y;
        ret.br.x += point.x;
        ret.br.y += point.y;
        return ret;
    }
}

class Building{
    static all: Building[] = [];
    fullname: string; // type + " " + number
    pos: Point; // point
    area: Rectangle; // Rectangle
    safearea: Rectangle; // Rectangle
    type: string; // str

    constructor(x: number, y: number, area: Rectangle, safearea: Rectangle) {
        Building.all.push(this);
        this.pos = new Point(x, y);
        this.type = this.constructor.name;
        this.area = area.moveTo(this.pos, true);
        this.safearea = safearea.moveTo(this.pos, true);
        this.fullname = this.type;
    }

    render() {
        let s = "<div class='item +"+this.constructor.name+"'>"; // building render todo";
        if (this.safearea.tl.x !== this.safearea.br.x && this.safearea.tl.y !== this.safearea.br.y)
            s += '<div class="safearea" style="position: absolute; background-color: orange; border: 4px solid orangered;' +
                'top: ' + this.safearea.tl.y*cellsize+'; left:' + this.safearea.tl.y*cellsize+'; ' +
                'width: ' + (this.safearea.br.y - this.safearea.tl.y)*cellsize+'; height:' + (this.safearea.br.x - this.safearea.tl.x)*cellsize+'; ' +
                '" />';
        if (this.area.tl.x !== this.area.br.x && this.area.tl.y !== this.area.br.y)
            s += '<div class="area" style="position: absolute; background-color: gray; border: 4px solid darkgray;' +
                'top: ' + this.area.tl.y*cellsize+'; left:' + this.area.tl.y*cellsize+'; ' +
                'width: ' + (this.area.br.y - this.area.tl.y)*cellsize+'; height:' + (this.area.br.x - this.area.tl.x)*cellsize+'; ' +
                '" />';
            s += '<div class="core" style="position: absolute; background-color: black;' +
                'top: ' + this.pos.y*cellsize+'; left:' + this.pos.y*cellsize+'; ' +
                'width: ' + (1)*cellsize+'; height:' + (1)*cellsize+'; ' +
                '" />';
        return toHtml(s+"</div>");
    }
}

function toHtml<T extends Element>(html: string, container?: Element, containerTag: string = 'div'): T {
    if (!container) { container = document.createElement(containerTag); }
    Log.e(!html || html === '', 'toHtml', 'require a non-empty string', html);
    container.innerHTML = html;
    const ret: T = container.firstChild as any;
    if (ret) container.removeChild(ret);
    return ret; }

var cellsize = 20;
class Lair extends Building{
    lv: number;
    constructor(lv: number, x: number, y: number, area?: Rectangle, safearea?: Rectangle) {
        super(x, y, area || new Rectangle(-5, -5, 0, 0), safearea || new Rectangle(-9+3, -9+3, 3, 3));
        this.lv = lv;
        this.fullname = this.type + " " + lv;
    }
}
class Residence extends Lair{}
class Wonder extends Residence{}
class Tree extends Wonder{}
class Tunnel extends Lair{}
class Ferry extends Tunnel{
    constructor(lv: number, x: number, y: number, direction: "tr"|"tl") {
        super(lv, x, y, new Rectangle(-1, -1, 0, 0),
            new Rectangle(direction=="tr" ? -3 : -2, direction=="tr" ? -2 : -3, direction=="tr" ? +2 : +1, direction=="tr" ? +1 : +2));
    }
}
class WaterTunnel extends Tunnel{
    constructor(lv: number, x: number, y: number, direction: "tr"|"tl") {
        super(lv, x, y, direction=="tl" ? new Rectangle(-3, -1, 0, 0) : new Rectangle(-1, -3, 0, 0),
            direction=="tl" ? new Rectangle(-4, -2, 1, 1) : new Rectangle(-2, -4, 1, 1))
    }
}
class Rock extends Building{
    constructor(x: number, y: number) {
        super(x, y, new Rectangle(0, 0, 0, 0), new Rectangle(0, 0, 0, 0))
    }
}
class Tower extends Lair{
    constructor(x: number, y: number) {
        super(0, x, y, new Rectangle(-1, -1, 0, 0), new Rectangle(-5, -5, 4, 4))
    }
}
class Leaf extends Building{
    constructor(x: number, y: number) {
        super(x, y, new Rectangle(-1, -1, 0, 0), new Rectangle(0, 0, 0, 0))
    }
}
enum EBuilding{lair="Lair", residence="Residence", wonder="Wonder", tree="Tree", ferry="Ferry", tunnel="Tunnel",
leaf="Leaf", river="River", mountain="Mountain", rock="Rock", node="Node"}


function treeInit(){
    new Tree(10, 753, 753);
    let map: any = {};
    map.tree = Tree;
    map.wonder = Wonder;
    map.residence = Residence;
    map.lair = Lair;
    map.tunnel = Tunnel;
    map.ferry = Ferry;
    map["water tunnel"] = WaterTunnel;
    map["watertunnel"] = WaterTunnel;
    map["wt"] = WaterTunnel;
    for (let key in map) { map[key.substring(1)] = map[key]; }
    map.leaf = Leaf;
    map.rock = Rock;
    let cellSize = 20;
    (window as any).cellclick = function cellclick(e: any){
        console.log("cellclick set river", e);
    }
    let currentPoint: HTMLElement = toHtml("<div onclick='cellclick' style='position:absolute; width:" + cellSize +"px; height:"+cellSize+"px; background-color: gray; opacity:0.5; border: 1px solid black'/>");
    $(document).on("mousemove", (e)=> {
        let p = new Point(Math.floor(e.pageX/cellSize), Math.floor(cellSize/e.pageY));
        if (currentPoint.style.top  !== p.y+"px") currentPoint.style.top  = p.y+"px";
        if (currentPoint.style.left !== p.x+"px") currentPoint.style.left = p.x+"px";
    })
    let s = `
t 10 753 753
r 7 774 854
l 6 794 785
l 5 793 915
l 6 813 833
l 5 774 814
l 6 793 776
r 7 814 755
l 7 842 716
l 5 805 675
l 6 773 735
l 6 726 775
l 5 698 788
l 6 694 754
r 8 654 715
r 8 710 680
l 5 713 651
l 5 634 636
l 5 690 636
r 7 670 602

t 9 689 608
t 9 691 613
t 9 639 618

t 9 846 783
t 9 848 790
t 9 850 797

wt 9 746 863
wt 9 746 869
wt 9 747 875

f 4 757 879
f 4 757 876
f 4 837 812
f 4 834 812

f 4 738 800
f 4 735 800

f 4 726 752
f 4 723 752

f 4 725 703
f 4 722 703

f 4 690 716
f 4 687 716
f 4 683 652
f 4 680 652

`;
    for (let row of s.split("\n")) {
        let params = row.split(" ").filter(p=>!!p);
        let constructor = params[0];
        params.splice(0);
        console.log("making:   " + constructor + " " + map[constructor] +"("+ params.join(", ")+")");
        new map[constructor](...params);
    }

    renderBarren();
}

function distance(x: number, y: number, x2: number, y2: number): number {
    let dx = Math.abs(x - x2);
    let dy = Math.abs(y - y2);
    let ret = dx*dx + dy*dy;
    return ret; // this is slower Math.sqrt(ret);
}


function renderBarren() {
    let sgchecked = false;
    let srchecked = false;
    document.body.innerHTML = '<div class="controls">'
        + '<label><label class="switch sg"><input type="checkbox" onclick="toggle(\'sg\')" ' + (sgchecked ? 'checked' : '') + '> <span class="slider round"></span></label> <h3 class="t">Show basic grid</h3></label>'
        + '<label><label class="switch sg"><input type="checkbox" onclick="toggle(\'rot\')" ' + (srchecked ? 'checked' : '') + '> <span class="slider round"></span></label> <h3 class="t">Rotate map</h3></label>'
        + '</div>';

    let tablehtml = '<div class="table">';


    for (let building of Building.all) {
        tablehtml += building.render();
    }
    tablehtml += '</div>';
    // console.error("tablelen": tablehtml.length, {tablehtml});
    document.body.innerHTML += tablehtml;
    console.error(Building.all);
    return tablehtml;
}


function toggle(classname: string) {
    if (document.documentElement.classList.contains(classname)) document.documentElement.classList.remove(classname);
    else document.documentElement.classList.add(classname);
}


function fixChecked() {
    let so = document.querySelector(".switch.so input");
}
setTimeout(fixChecked, 1);


treeInit();




