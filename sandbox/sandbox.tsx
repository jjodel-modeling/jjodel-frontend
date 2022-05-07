












/*
import * as React from "react";

React.createElement('p', null,
    [
        React.createElement('h1', null, ["hello2 ", this.data.name + (this.model.id)]),
        React.createElement('i', null, [JSON.stringify(Object.keys(this))]),
        Input({obj: this.data, field: 'name', getter: val => val.toUpperCase(), setter: (val) => val.toLowerCase()})
    ])
()=>React.createElement('p', null,
    [React.createElement('h1', null, ["hello2 ", this.data.name + (this.model.id)]),
        React.createElement('i', null, [JSON.stringify(Object.keys(this))]),
        Input(
            {obj: this.data, field: 'name', getter: val => val.toUpperCase(), setter: (val) => val.toLowerCase()},
            [['inputchildren1', 'ic2', React.createElement('div', null, ["ic3"])]]
        )
    ])
()=>React.createElement('p', null, [
    React.createElement('h1', null, ["hello2 ", this.data.name + (this.model.id)]),
    React.createElement('i', null, [JSON.stringify(Object.keys(this))]),
    Input({obj: this.data, field: 'name', getter: val => val.toUpperCase(), setter: (val) => val.toLowerCase()},
        ["['inputchildren1', 'ic2', ", React.createElement('div', null, ["ic3"]),"]"]
])
()=>React.createElement('p', null, [
    React.createElement('h1', null, "hello2 ", this.data.name + (this.model.id)]),
    React.createElement('i', null, [JSON.stringify(Object.keys(this))]),
    Input({obj: this.data, field: 'name', getter: val => val.toUpperCase(), setter: (val) => val.toLowerCase()},
        ["'inputchildren1', 'ic2', ", React.createElement('div', null, ["ic3"])]
    )])*/
export const fake = {};

class Minion{
    rank;
    name;
    // @ts-ignore
    tribe;
    atk;
    def;
    effects;
    // @ts-ignore
    constructor (rank, name, atk, def, tribe: Tribe = undefined, effects: any[] = []) {
        this.rank = rank;
        this.name = name;
        this.tribe = tribe;
        this.atk = atk;
        this.def = def;
        this.effects = effects;
    }
}

class Effect{
    condition;
    count?: number | Tribe;//avenge(5) | Summon a demon
    effect?: Effectt;
    // @ts-ignore
    constructor(condition, effect: Effectt = undefined, count?: number | Tribe) {
        this.condition = condition;
        this.effect = effect;
        this.count = count;
    }
}
let se = {
    taunt: new Effect('taunt'),
    reborn: new Effect('reborn'),
    divineshield: new Effect('divine shield'),
    poison: new Effect('poison'),
    windfury: new Effect('windfury'),
    megawindfury: new Effect('megawindfury'),
};
enum Tribe {any = "Any", none = "None", all = "All", demon = "Demon", mech = "Mech", beast = "Beast",
dragon = "Dragon", pirate = "Pirate"};
class Effectt{
    text!: string;
    summon?: Minion[];
    atk?: number | "this";
    atkmultiply?: number;
    def?: number | "this";
    defmultiply?: number;
    targetAlly?: boolean | "self" | "not-self";
    targetRandom?: boolean;
    taverncost?: number;
    //target?: "self" | {"random": "ally" | "ally-not-self" | "enemy" | Tribe};
}

let t = Tribe;

let tabbycat = new Minion(1, 'Tabbycat', 1, 1, t.beast);
let imp = new Minion(1, 'Imp', 1, 1, t.demon);

let defaultef: Effectt = {text:'', targetAlly: "self"};
function battlecry(ef: Effectt) { return new Effect('battlecry', {...defaultef, ...ef}); }
function deathrattle(ef: Effectt) { return new Effect('deathrattle', {...defaultef, ...ef}); }
function avenge(count: number, ef: Effectt) { return new Effect('avenge', {...defaultef, ...ef}, count); }
function sell(count: number, ef: Effectt) { return new Effect('sell', {...defaultef, ...ef}, count); }
function summon(tribe: Tribe, ef: Effectt) { return new Effect('summon', {...defaultef, ...ef}, tribe); }
function play(tribe: Tribe, ef: Effectt) { return new Effect('summon', {...defaultef, ...ef}, tribe); }
function tavernupgrade(ef: Effectt) { return new Effect('tavernupgrade', {...defaultef, ...ef}); }
function endofturn(ef: Effectt) { return new Effect('endofturn', {...defaultef, ...ef}); }
function startofturn(ef: Effectt) { return new Effect('startofturn', {...defaultef, ...ef}); }

new Minion(1, 'Acolyte of C\'Thun', 2, 2, t.none, [se.taunt, se.reborn]);
new Minion(1, 'Alleycat', 1, 1, t.beast, [new Effect('battlecry', {text: 'Summon 1/1 cat', summon: [tabbycat]})]);
new Minion(1, 'Deck swabbie', 2, 2, t.pirate, [battlecry({text:'Reduce the cost of upgrading Bob\'s Tavern by (1).', taverncost: -1})]);
new Minion(1, 'Evolving Chromawing', 1, 3, t.dragon, [tavernupgrade({text:'After you upgrade your Tavern Tier, double this minion\'s Attack.', atkmultiply: 2})]);
new Minion(1, 'Icky Imp', 1, 1, t.demon, [deathrattle({text:'Summon two 1/1 Imps.', summon: [imp, imp]})]);
new Minion(1, 'Impulsive Trickster', 2, 2, t.demon, [deathrattle({text:'Give this minion\'s maximum Health to another friendly minion.', def: "this", targetRandom: true, targetAlly: "not-self"})]);
new Minion(1, 'Micro Mummy', 1, 2, t.mech, [se.reborn, endofturn({text:'At the end of your turn, give another random friendly minion +1 Attack.', atk: 1, targetRandom: true, targetAlly: "not-self"})]);
