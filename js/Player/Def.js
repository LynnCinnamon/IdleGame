/**
 * @param {string} name
 */
function Player() {
    /** @type {Player}*/
    var self = this;
    /** @type {Stat[]} ko.observable*/
    self.stats = ko.observableArray([
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

    self.startTicks = 250;
    self.maxTicks = ko.observable(self.startTicks);
    self.currentTicks = ko.observable(self.startTicks);
    self.money = ko.observable(0);

    self.reset = function()
    {
        self.maxTicks(self.startTicks);
        self.currentTicks(self.startTicks);
        self.money(0);
    }
}
