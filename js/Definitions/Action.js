/** @type {Object.<string, BaseAction>}*/
var allActions = {};
/**
 * @param {string} name
 * @param {string} description
 */
class BaseAction {
    constructor(name, description) {
        /** @type {BaseAction}*/
        var self = this;
        /** @type {String}*/
        self.name = name;
        /** @type {String}*/
        self.description = description;
        //For storing some functions this object will hold
        /** @type {Object.<string, Function>}*/
        self._internals = {};
        /** @type {Object.<string, Function>}*/
        self._defaults = {};
        /**
         * @returns {string}
         */
        self.computed_description = function () {
            var string = self.description + "\n\n";
            if (Object.keys(self._stats).length == 0)
                return string; // We have no stats associated with this Action...
            var sum = 0;
            Object.keys(self._stats).forEach((key) => {
                sum += self._stats[key];
            });
            Object.keys(self._stats).forEach((key) => {
                string += key + ": " + (self._stats[key] / sum * 100).toFixed(0) + "%\n";
            });
            return string;
        };
        /**
         * @param {string} name
         * @param {Function} [callback]
         * @returns {Progress}
         */
        self.setOrRunFunction = function (name, callback) {
            if (typeof (callback) === "function") {
                self._internals[name] = callback;
                return self;
            }
            var func = self._internals[name];
            if (typeof (func) === "function") {
                return func(self);
            }
            throw new Error("Invalid use of function '" + name + "'");
        };
        /**
         * @param {string} name
         * @returns {Function}
         */
        self.indirection = function (name) {
            //This weird code here is so that the function has the right name in the end when put out to the console.
            //Nessecary? No. Satisfying? Yeeees.
            const tmp = {
                [name]: (callback) => {
                    return self.setOrRunFunction(name, callback);
                }
            };
            return tmp[name];
        };
        //Functions that are to be set on a object level, not constructor level.
        self.duration = self.indirection("duration");
        self.finish = self.indirection("finish");
        self.tick = self.indirection("tick");
        self.visible = self.indirection("visible");
        self.clickable = self.indirection("clickable");
        self.tickMultiplier = self.indirection("tickMultiplier");
        //default implementations
        self.tick(function (that) {
            if (typeof (that) === "undefined")
                return;
            if (typeof (that._stats) === "undefined")
                return;
            if (Object.keys(that._stats).length == 0)
                return; // We have no stats associated with this Action...
            var sum = 0;
            Object.keys(that._stats).forEach((key) => {
                sum += that._stats[key];
            });
            Object.keys(that._stats).forEach((key) => {
                allStats[key].incrementWithPower(that._stats[key] / sum);
            });
        });
        self.tickMultiplier(function (that) {
            if (typeof (that) === "undefined")
                return 1;
            if (typeof (that._stats) === "undefined")
                return 1;
            if (Object.keys(that._stats).length == 0)
                return 1; // We have no stats associated with this Action...
            var sumStats = 0;
            Object.keys(that._stats).forEach((key) => {
                sumStats += that._stats[key];
            });
            var sum = 0;
            Object.keys(that._stats).forEach((key) => {
                sum += allStats[key].value() * that._stats[key] / sumStats;
            });
            return logerithmic(sum);
        });
        self._defaults = {
            tick: self.tick,
            tickMultiplier: self.tickMultiplier,
        };
        self._stats = {};
        self.stats = function (s) {
            self._stats = s;
            return self;
        };
        self.addToPool = function () {
            globalGameModel.nextActions.push(new Action(this, 1));
        };
        allActions[self.name] = self;
    }
}
/**
 * @param {BaseAction} baseAction
 * @param {number} amount
 */
class Action {
    constructor(baseAction, amount) {
        /** @type {Action}*/
        var self = this;
        self.name = baseAction.name;
        self.description = baseAction.description;
        self.duration = baseAction.duration;
        self._internals = baseAction._internals;
        self._defaults = baseAction._defaults;
        self.finish = baseAction.finish;
        self.tick = baseAction.tick;
        self.visible = baseAction.visible;
        self.clickable = baseAction.clickable;
        self.tickMultiplier = baseAction.tickMultiplier;
        self.stats = baseAction.stats;
        /** @type {number} ko.observable*/
        self.maxAmount = ko.observable(amount);
        /** @type {number} ko.observable*/
        self.currentTick = ko.observable(0);
        /** @type {number} ko.observable*/
        self.currentAmount = ko.observable(0);
        /** @type {boolean} ko.observable*/
        self.failed = ko.observable(false);
        self.reset = () => {
            self.currentTick(0);
            self.currentAmount(0);
            self.failed(false);
        };
        self.getStaticObject = () => {
            return {
                name: self.name,
                amount: self.maxAmount(),
            };
        };
        self.canMoveUp = function () {
            var first = globalGameModel.nextActions()[0];
            if (first != self) {
                var may = false;
                globalGameModel.nextActions().forEach((elem) => {
                    if (elem instanceof ActionList) {
                        may = may || elem.mayMoveUp(self);
                    }
                });
            }
            ;
            return may;
        };
        self.canMoveDown = function () {
            var last = globalGameModel.nextActions()[globalGameModel.nextActions().length - 1];
            if (last != self) {
                var may = false;
                globalGameModel.nextActions().forEach((elem) => {
                    if (elem instanceof ActionList) {
                        may = may || elem.mayMoveDown(self);
                    }
                });
            }
            ;
            return may;
        };
        self.moveUp = function () {
            var na = globalGameModel.nextActions;
            let pos = na.indexOf(self);
            if (pos > 0) {
                na.splice(pos, 1, na()[pos - 1]);
                na.splice(pos - 1, 1, self);
                return;
            }
            else {
                globalGameModel.nextActions().forEach((action) => {
                    if (action instanceof ActionList) {
                        action.doMoveUp(self);
                    }
                });
            }
        };
        self.moveDown = function () {
            var na = globalGameModel.nextActions;
            let pos = na.indexOf(self);
            if (pos > -1) {
                na.splice(pos, 1, na()[pos + 1]);
                na.splice(pos + 1, 1, self);
            }
            else {
                globalGameModel.nextActions().forEach((action) => {
                    if (action instanceof ActionList) {
                        action.doMoveDown(self);
                    }
                });
            }
        };
        self.decrementAmount = function () {
            obs.increment(self.maxAmount, -1);
        };
        self.incrementAmount = function () {
            obs.increment(self.maxAmount, 1);
        };
        self.done = function () {
            return self.currentAmount() >= self.maxAmount();
        };
        self.copy = function () {
            return new Action(baseAction, self.maxAmount());
        };
        self.doTick = function () {
            obs.increment(self.currentTick, self.tickMultiplier());
            self.tick();
        };
        self.isCurrentValidAction = function () {
            return globalGameModel.isCurrentValidAction(self);
        };
        self.handleOverflow = function () {
            if (self.currentTick() >= self.duration()) {
                self.currentTick(0);
                self.finish();
                obs.increment(self.currentAmount);
            }
        };
    }
}
