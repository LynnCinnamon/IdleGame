/** @type {Object.<string, Town>}*/
var allTowns = {};

/**
 * Represents a town in the game.
 * @param {string} name
 * @param {string[]} actionNames
 * @param {string[]} progressNames
 * @returns {Town}
 */
function Town(name, actionNames, progressNames) {
    /** @type {Town}*/
    var self = this;

    /** @type {string}*/
    self.name = name;

    /** @type {boolean} ko.observable*/
    self.locked = ko.observable(true);

    /** @type {ko.observable[]}*/
    self.actions = ko.observableArray([])
    actionNames.forEach((name)=>{
        self.actions.push(allActions[name]);
    })

    /** @type {ko.observable[]}*/
    self.progress = ko.observableArray([])
    progressNames.forEach((name)=>{
        self.progress.push(allProgress[name]);
    })


    allTowns[self.name] = self;
}