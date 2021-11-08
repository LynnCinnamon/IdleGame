/// <reference path="../../node_modules/@types/knockout/index.d.ts" />
/// <reference path="../Definitions/Stat.js" />
var Player = /** @class */ (function () {
    function Player() {
        /** @type {Stat[]} ko.observable*/
        this.stats = ko.observableArray([
            allStats["Dexterity"],
            allStats["Strength"],
            allStats["Constitution"],
            allStats["Speed"],
            allStats["Perception"],
            allStats["Charisma"],
            allStats["Intelligence"],
            allStats["Luck"],
            allStats["Soul"],
        ]);
        this.startTicks = 250;
        this.maxTicks = ko.observable(this.startTicks);
        this.currentTicks = ko.observable(this.startTicks);
        this.money = ko.observable(0);
    }
    Player.prototype.reset = function () {
        this.maxTicks(this.startTicks);
        this.currentTicks(this.startTicks);
        this.money(0);
    };
    return Player;
}());
