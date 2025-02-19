/* simple library to keep track of whether the project has been modified or not */

import {U} from "../../joiner";

/*
localStorage.setItem('projectModified', 'false');
export const setProjectModified = function(nope: 'nope') {
    localStorage.setItem('projectModified', 'true');

}
export const unsetProjectModified = function(nope: 'nope') {
    localStorage.setItem('projectModified', 'false');
}*/

export const isProjectModified = function() {
    return U.isProjectModified;
    // return store.getState().idlookup.clonedCounter !==
}