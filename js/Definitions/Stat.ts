/// <reference path="../../node_modules/@types/knockout/index.d.ts" />
/// <reference path="../jsUtils.js" />
var allStats: { [s: string]: Stat; } = {};

class Stat {

    name: string
    flavourText: string
    value: KnockoutObservable<number>
    valuePercentage: KnockoutObservable<number>
    metaValue: KnockoutObservable<number>
    metaValuePercentage: KnockoutObservable<number>
    getStaticObject: () => { name: string; value: number; valuePercentage: number; metaValue: number; metaValuePercentage: number; }
    computedDescription: KnockoutComputed<string>
    incrementWithPower: (power: number) => void;
    handleOverflow: () => void;
    constructor(name: string, flavourText: string)
    {

        var self = this;
        self.name = name
        self.flavourText = flavourText;
        self.value = ko.observable(1);
        self.valuePercentage = ko.observable(0);
        self.metaValue = ko.observable(0)
        self.metaValuePercentage = ko.observable(0);
        self.getStaticObject = () => {
            return {
                name: self.name,
                value: self.value(),
                valuePercentage: self.valuePercentage(),
                metaValue: self.metaValue(),
                metaValuePercentage: self.metaValuePercentage()
            }
        }
        self.computedDescription = ko.computed(function () {
            return [
                "This is your <bold>" + name + "</bold>",
                "Level (main): " + self.value(),
                "Percentage (main): " + self.valuePercentage().toFixed(0),
                "Level (meta): " + self.metaValue(),
                "Percentage (meta): " + self.metaValuePercentage().toFixed(2),
                self.flavourText,
            ].join("\n");
        })
        self.incrementWithPower = function (power: number) {
            obs.increment(self.valuePercentage, power + power * self.metaValue() * 0.1)
            obs.increment(self.metaValuePercentage, power * 0.1 / Math.sqrt(self.metaValue() + 1))
        }

        self.handleOverflow = function () {
            while (self.metaValuePercentage() >= 100) {
                self.metaValuePercentage(self.metaValuePercentage() - 100);
                obs.increment(self.metaValue)
            }
            while (self.valuePercentage() >= 100) {
                self.valuePercentage(self.valuePercentage() - 100);
                obs.increment(self.value)
            }
        }
        allStats[self.name] = self;
    }


}