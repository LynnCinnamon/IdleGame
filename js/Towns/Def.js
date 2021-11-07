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

    /** @type {BaseAction[]} ko.observableArray*/
    self.actions = ko.observableArray([])
    actionNames.forEach((name)=>{
        self.actions.push(allActions[name]);
    })

    /** @type {Progress[]} ko.observableArray*/
    self.progress = ko.observableArray([])
    progressNames.forEach((name)=>{
        if(allProgress[name])
        {
            self.progress.push(allProgress[name]);
        }
        else
        {
            console.log(allProgress)
            console.log(name)
            console.log(allProgress[name])
        }
    })


    allTowns[self.name] = self;
}