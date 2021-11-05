var allProgress = {};
function Progress(name, description, items) {
    var self = this;

    self.name = name;
    self.description = description;
    self.items = items;

    allProgress[self.name] = self;

    self.value = ko.observable(0);
    self.meta = ko.observable(0);

    //For storing some functions this object will hold
    self._internals = {}
    self._defaults = {}

    self.setOrRunFunction = function (name, callback) {
        if (typeof (callback) === "function") {
            self._internals[name] = callback;
            return self;
        }
        var func = self._internals[name];
        if (typeof (func) === "function") {
            return func(self);
        }
        throw new Error("Invalid use of function '" + name + "'")
    }

    self.indirection = function (name) {
        //This weird code here is so that the function has the right name in the end when put out to the console.
        //Nessecary? No. Satisfying? Yeeees.
        const tmp = {
            [name]: (callback) => {
                return self.setOrRunFunction(name, callback);
            }
        }
        return tmp[name];
    }

    //Functions that are to be set on a object level, not constructor level.
    self.visible = self.indirection("visible");
    self.increment = self.indirection("increment");
    self.valueIncrease = self.indirection("valueIncrease");

    //default implementations
    self.visible(function () {
        return true;
    })
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
    })


    self._defaults = {
        visible: self.visible,
        increment: self.increment,
    }

    allActions[self.name] = self
}
