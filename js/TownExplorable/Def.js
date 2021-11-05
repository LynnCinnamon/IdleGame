/** @type {Object.<string, TownExplorable>}*/
var allExplorables = {};

/**
 * This represents an explorable
 * @param {string} name
 * @param {string} [id]
 * @returns {TownExplorable} a TownExplorable instance
 */
function TownExplorable(name, id) {
    /** @type {TownExplorable}*/
    var self = this;

    /** @type {string}*/
    self.name = name;
    /** @type {string}*/
    self.id = self.id === undefined ? self.name : self.id;

    /** @type {ko.observable}*/
    self.found = ko.observable(0);
    /** @type {ko.observable}*/
    self.withValue = ko.observable(0);
    /** @type {number}*/
    self.withoutValue = 0;
    /** @type {ko.observable}*/
    self.done = ko.observable(0);
    /** @type {ko.observable}*/
    self.valueFirst = ko.observable(false);

    /**
     * @returns {number}
     */
    self.total = function () {
        return self.found() + self.withValue() + self.withoutValue + self.done()
    }

    /**
     * @returns {boolean} wether we got an action with value
     */
    self.takeAction = function (chance = 10) {
        if (self.valueFirst()) {
            if (self.withValue() > 0) {
                obs.increment(self.withValue, -1)
                obs.increment(self.done, 1)
                return true;
            }
        }
        if (self.found() > 0) {
            var totalChecked = self.withValue() + self.withoutValue + self.done()
            if (totalChecked % chance == chance - 1) {
                obs.increment(self.done, 1)
                obs.increment(self.found, -1)
                return true;
            }
            self.withoutValue += 1
            obs.increment(self.found, -1)
            return false;
        } else if (self.withValue() > 0) {
            obs.increment(self.withValue, -1)
            obs.increment(self.done, 1)
            return true;
        }
        return false;
    }

    /**
     * @returns {undefined}
     */
    self.reset = function () {
        this.withValue(this.withValue() + this.done())
        this.done(0);
    }
    allExplorables[self.id] = self;
}