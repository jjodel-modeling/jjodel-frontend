/* simple library to keep track of whether the project has been modified or not */

localStorage.setItem('projectModified', 'false');

export const setProjectModified = function() {
    localStorage.setItem('projectModified', 'true');

}
export const unsetProjectModified = function() {
    localStorage.setItem('projectModified', 'false');
}

export const isProjectModified = function() {
    return localStorage.getItem('projectModified') === 'true';
}