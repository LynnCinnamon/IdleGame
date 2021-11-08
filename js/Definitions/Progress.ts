/** @type {Object.<string, Progress>}*/
var allProgress: { [s: string]: Progress; } = {};

/**
 * @param {string} name
 * @param {string} description
 * @param {TownExplorable[]} items
 */
class Progress {
    description: any;
    name: string;
    items: any;
    value: KnockoutObservable<number>;
    meta: KnockoutObservable<number>;
    _internals: {[s: string]: Function;};
    _defaults: {[s: string]: Function;};
    setOrRunFunction: (name: any, callback: any) => any;
    indirection: (name: string) => Function;
    visible: any;
    increment: any;
    valueIncrease: any;
    constructor(name, description, items) {
        var self: Progress = this;
        self.name = name;
        self.description = description;
        self.items = items;
        self.value = ko.observable(0);
        self.meta = ko.observable(0);
        //For storing some functions this object will hold
        self._internals = {};
        self._defaults = {};

        /**
         * @param {string} name
         * @param {Function} [callback]
         * @returns {Progress}
         */
        self.setOrRunFunction = function (name: string, callback: Function): Progress {
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
        self.indirection = function (name: string): Function {
            //This weird code here is so that the function has the right name in the end when put out to the console.
            //Nessecary? No. Satisfying? Yeeees.
            const tmp = {
                [name]: (callback) => {
                    return self.setOrRunFunction(name, callback);
                }
            };
            return tmp[name];
        };

        //Functions that are to be set on a object level, not constructor level
        self.visible = self.indirection("visible");
        self.increment = self.indirection("increment");
        self.valueIncrease = self.indirection("valueIncrease");

        //default implementations
        self.visible(function () {
            return true;
        });
        self.increment(function (that) {
            if (that.value() >= 100) {
                that.value(100);
                that.meta(100);
                return;
            }
            obs.increment(that.meta, (100 / (that.value() + 1)));
            if (that.meta() >= 100) {
                that.meta(0);
                obs.increment(that.value);
                that.valueIncrease();
            }
        });


        self._defaults = {
            visible: self.visible,
            increment: self.increment,
        };

        allProgress[self.name] = self;
    }
}
