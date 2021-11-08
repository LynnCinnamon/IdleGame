/// <reference path="../../node_modules/@types/knockout/index.d.ts" />
/// <reference path="../Definitions/Action.js" />
var allTowns = {};
class Town {
    constructor(name, actionNames, progressNames) {
        var self = this;
        self.name = name;
        self.locked = ko.observable(true);
        self.actions = ko.observableArray([]);
        actionNames.forEach((name) => {
            self.actions.push(allActions[name]);
        });
        self.progress = ko.observableArray([]);
        progressNames.forEach((name) => {
            if (allProgress[name]) {
                self.progress.push(allProgress[name]);
            }
            else {
                console.log(allProgress);
                console.log(name);
                console.log(allProgress[name]);
            }
        });
        allTowns[self.name] = self;
    }
}
