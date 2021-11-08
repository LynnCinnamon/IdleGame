
var allExplorables = {};

/**
 * This represents an explorable
 * @param {string} name
 * @param {string} [id]
 * @returns {TownExplorable} a TownExplorable instance
 */
class TownExplorable {
    name: string;
    id: string;
    found: KnockoutObservable<number>;
    withValue: KnockoutObservable<number>;
    withoutValue: number;
    done: KnockoutObservable<number>;
    valueFirst: KnockoutObservable<boolean>;
    computedDescription: KnockoutComputed<string>;
    total: () => number;
    takeAction: (chance?: number) => boolean;
    reset: () => void;
    constructor(name: string, id: string) {
        var self = this;

        self.name = name;
        self.id = self.id === undefined ? self.name : self.id;

        self.found = ko.observable(0);
        self.withValue = ko.observable(0);
        self.withoutValue = 0;
        self.done = ko.observable(0);
        self.valueFirst = ko.observable(false);

        self.computedDescription = ko.computed(function () {
            return [
                "These are your <bold>" + name + "</bold>",
                "They display in the following format:",
                "<bold>Amount with value left / Amount with value total / Amount to check for value</bold>",
            ].join("\n");
        });

        self.total = function (): number {
            return self.found() + self.withValue() + self.withoutValue + self.done();
        };

        self.takeAction = function (chance = 10): boolean {
            if (self.valueFirst()) {
                if (self.withValue() > 0) {
                    obs.increment(self.withValue, -1);
                    obs.increment(self.done, 1);
                    return true;
                }
            }
            if (self.found() > 0) {
                var totalChecked = self.withValue() + self.withoutValue + self.done();
                if (totalChecked % chance == chance - 1) {
                    obs.increment(self.done, 1);
                    obs.increment(self.found, -1);
                    return true;
                }
                self.withoutValue += 1;
                obs.increment(self.found, -1);
                return false;
            } else if (self.withValue() > 0) {
                obs.increment(self.withValue, -1);
                obs.increment(self.done, 1);
                return true;
            }
            return false;
        };

        self.reset = function (): void {
            this.withValue(this.withValue() + this.done());
            this.done(0);
        };
        allExplorables[self.id] = self;
    }
}