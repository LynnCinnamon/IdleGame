/** @type {Object.<string, Stat>}*/
var allStats = {};

function Stat(name) {
    /** @type {Stat}*/
    var self = this;
    /** @type {string}*/
    self.name = name
    /** @type {number} ko.observable*/
    self.value = ko.observable(1);
    /** @type {number} ko.observable*/
    self.valuePercentage = ko.observable(0);
    /** @type {number} ko.observable*/
    self.metaValue = ko.observable(0)
    /** @type {number} ko.observable*/
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

    /**
     * @param {number} power
     */
    self.incrementWithPower = function (power) {
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