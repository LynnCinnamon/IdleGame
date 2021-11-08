/// <reference path="../../node_modules/@types/knockout/index.d.ts" />
/// <reference path="./Stat.ts" />

class Player{
    stats: KnockoutObservableArray<any>
    startTicks: number
    maxTicks: KnockoutObservable<any>
    currentTicks: KnockoutObservable<number>
    money: KnockoutObservable<number>
    constructor()
    {
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

    reset()
    {
        this.maxTicks(this.startTicks);
        this.currentTicks(this.startTicks);
        this.money(0);
    }
}
