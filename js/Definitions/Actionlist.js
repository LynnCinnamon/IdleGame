class ActionList {
    constructor() {
        var self = this;
        self.actions = ko.observableArray([]);
        self.actionPointer = 0;
        self.collapsed = ko.observable(false);
        self.currentAmount = ko.observable(0);
        self.failed = ko.observable(false);
        self.doMoveDown = (action) => {
            var na = self.actions;
            let pos = na.indexOf(action);
            if (pos > -1) {
                na.splice(pos, 1, na()[pos + 1]);
                na.splice(pos + 1, 1, action);
            }
            else {
                self.actions().forEach((action) => {
                    if (action instanceof ActionList) {
                        action.doMoveDown(action);
                    }
                });
            }
        };
        self.doMoveUp = (action) => {
            var na = self.actions;
            let pos = na.indexOf(action);
            if (pos > 0) {
                na.splice(pos, 1, na()[pos - 1]);
                na.splice(pos - 1, 1, action);
                return;
            }
            else {
                self.actions().forEach((action) => {
                    if (action instanceof ActionList) {
                        action.doMoveUp(action);
                    }
                });
            }
        };
        self.maxAmount = () => {
            return self.actions().reduce((tally, current) => { return tally + current.maxAmount(); }, 0);
        };
        self.canMoveUp = function () {
            var first = globalGameModel.nextActions()[0];
            if (first != self)
                return true;
            if (first instanceof ActionList) {
                return first.mayMoveUp(self);
            }
            return false;
        };
        self.canMoveDown = function () {
            var last = globalGameModel.nextActions()[globalGameModel.nextActions().length - 1];
            if (last != self)
                return true;
            if (last instanceof ActionList) {
                return last.mayMoveDown(self);
            }
            return false;
        };
        self.mayMoveUp = function (action) {
            if (self.actions()[0] == action)
                return false;
            return self.actions().reduce((tally, current) => {
                if (tally)
                    return tally;
                if (current == action)
                    return true;
                if (current instanceof ActionList) {
                    return current.mayMoveUp(action);
                }
            }, false);
        };
        self.mayMoveDown = function (action) {
            if (self.actions()[self.actions().length - 1] == action)
                return false;
            return self.actions().reduce((tally, current) => {
                if (tally)
                    return tally;
                if (current == action)
                    return true;
                if (current instanceof ActionList) {
                    return current.mayMoveDown(action);
                }
            }, false);
        };
        self.hasAction = function (action) {
            return self.actions().reduce((tally, current) => {
                if (tally)
                    return tally;
                if (current == action)
                    return true;
                if (action instanceof ActionList) {
                    return action.hasAction(action);
                }
            }, false);
        };
        self.removeAction = function (action) {
            self.actions.remove(action);
            self.actions().forEach((elem) => {
                if (elem instanceof ActionList) {
                    elem.removeAction(action);
                }
            });
        };
        self.moveUp = function () {
            var na = globalGameModel.nextActions;
            let pos = na.indexOf(self);
            na.splice(pos, 1, na()[pos - 1]);
            na.splice(pos - 1, 1, self);
        };
        self.moveDown = function () {
            var na = globalGameModel.nextActions;
            let pos = na.indexOf(self);
            na.splice(pos, 1, na()[pos + 1]);
            na.splice(pos + 1, 1, self);
        };
        /** @returns {number} */
        self.duration = () => {
            return self.actions().reduce((tally, current) => { return tally + current.duration(); }, 0);
        };
        /** @returns {number} */
        self.currentTick = ko.computed(() => {
            return self.actions().reduce((tally, current) => { return tally + current.currentTick(); }, 0);
        });
        self.finish = () => { };
        self.tick = () => {
        };
        self.reset = () => {
            self.actions().forEach((action) => {
                action.reset();
            });
            self.failed(false);
            self.actionPointer = 0;
            self.currentAmount(0);
        };
        self.doTick = () => {
            var elem = self.actions()[self.actionPointer];
            if (!elem) {
                self.reset();
                var elem = self.actions()[self.actionPointer];
            }
            if (elem && !elem.failed()) {
                if (!elem.isCurrentValidAction()) {
                    if (self.actionPointer < self.actions().length) {
                        self.actionPointer++;
                    }
                    obs.increment(globalGameModel.player.currentTicks, -1);
                    this.failedThisLoop = true;
                    elem.failed(true);
                }
                else {
                    elem.doTick();
                    elem.handleOverflow();
                }
                if (elem.done() && self.actionPointer < self.actions().length) {
                    self.actionPointer++;
                }
            }
        };
        self.handleOverflow = () => {
        };
        self.done = () => {
            return self.actionPointer == self.actions().length;
        };
        self.visible = () => { return true; };
        self.tickMultiplier = () => { return 1; };
        self.copy = () => {
            var AL = new ActionList();
            self.actions().forEach((action) => {
                AL.actions.push(action.copy());
            });
            return AL;
        };
        self.getStaticObject = () => {
            var array = [];
            self.actions().forEach((item) => {
                array.push(item.getStaticObject());
            });
            return {
                name: self.name,
                amount: self.maxAmount(),
                children: array
            };
        };
        self.includesAction = function (action) {
            self.actions().forEach((elem) => {
                if (elem == action)
                    return true;
                if (elem instanceof ActionList) {
                    if (elem.includesAction(action))
                        return true;
                }
            });
            return false;
        };
        self.isCurrentValidAction = function () {
            return true;
        };
    }
}
