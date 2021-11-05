var allExplorables = {};
function townExplorable(name, id) {
    var self = this;
    self.name = name;
    self.id = id;
    allExplorables[self.id === undefined ? self.name : self.id] = self;

    self.found = ko.observable(0);
    self.withValue = ko.observable(0);
    self.withoutValue = 0;
    self.done = ko.observable(0);
    self.valueFirst = ko.observable(false);


    self.total = function () {
        return self.found() + self.withValue() + self.withoutValue + self.done()
    }

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

    self.reset = function () {
        this.withValue(this.withValue() + this.done())
        this.done(0);
    }
}