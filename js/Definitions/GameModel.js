/**
 * @typedef {import('./Player')}
 */



function GameModel() {
    var self = this;

    /** @type {Player}*/
    self.player = new Player();

    self.mouse = {
        x: ko.observable(0),
        y: ko.observable(0)
    }


    self.bankedTicks = ko.observable(0);
    self.useBankedTicks = ko.observable(false);

    self.currentTownDisplay = ko.observable(0);
    self.currentTownPlayerPawn = 0;

    self.currentActions = ko.observableArray([]);
    self.actionPointer = 0;

    self.unlockables = ko.observableArray([]);

    /**
     *
     * @param {Action} action
     */
    self.isCurrentValidAction = function (action) {
        var name = action.name;
        var town = self.world.towns[this.currentTownPlayerPawn];
        return town.actions().find(element => element.name === name) != undefined;
    }

    self.world = {
        towns: [
            allTowns["A small village"],
            allTowns["The tavern"],
        ],
    }


    self.stopped = ko.observable(true);
    self.longerStopped = ko.observable(false);

    self.waitBeforeRestart = ko.observable(false);
    self.waitOnFail = ko.observable(false);
    self.repeatLastAction = ko.observable(false);
    self.keepCurrentActions = ko.observable(false);

    self.inTown = function (num) {
        return self.currentTownDisplay() == num
    }

    self.nextActions = ko.observableArray([]);

    self.ticksInSeconds = function () {
        return (self.player.currentTicks() / 60 / (self.useBankedTicks() ? 4 : 1) ).toFixed(2)
    }

    self.bankedticksInSeconds = function() {
        return (self.bankedTicks() / 60).toFixed(2)
    }

    self.incrementShownTown = function () {
        obs.increment(self.currentTownDisplay)
    }

    self.maySeeNeighborTown = function (offset) {
        var newPos = self.currentTownDisplay() + offset;
        if (newPos < 0) return false;
        if (newPos > self.world.towns.length - 1) return false;
        if (self.world.towns[newPos].locked()) return false;
        return true;
    }

    self.decrementShownTown = function () {
        obs.increment(self.currentTownDisplay, -1)
    }

    self.toggleUseBankedTime = function () {
        self.useBankedTicks(!self.useBankedTicks())
    }

    self.toggleStart = function () {

        if (self.currentActions().length == 0) {
            self.currentActions.removeAll()
            self.nextActions().forEach(function (ac) {
                self.currentActions.push(ac.copy())
            })
        }

        if (self.stopped()) {
            self.stopped(false);
            self.longerStopped(false);
        } else {
            self.longerStopped(true);
            self.stop();
        }
    }

    self.restart = function () {
        self.stopped(false);
        self.actionPointer = 0;
        self.longerStopped(false);
        self.failedThisLoop = false;
        self.currentTownPlayerPawn = 0;

        self.player.reset()

        saveGameManager.save();

        self.world.towns.forEach(function (town) {
            town.progress().forEach(function (prog) {
                prog.items.forEach(function (item) {
                    item.reset();
                })
            })
        })


        self.player.stats().forEach(function (stat) {
            stat.value(0)
            stat.valuePercentage(0)
        });
        if(self.keepCurrentActions() && self.currentActions().length > 0)
        {
            self.currentActions().forEach((action)=>{
                action.reset()
            })
        }
        else {
            self.currentActions.removeAll()
            self.nextActions().forEach(function (ac) {
                if(ac.maxAmount() <=0 )
                return
                self.currentActions.push(ac.copy())
            })
        }
    }

    self.removeCurrentAction = function (data) {
        self.currentActions.remove(data)
    }

    self.removeNextAction = function (data) {
        self.nextActions.remove(data)
    }


    //Stops the loop from executing.
    //The tick function continues to fire!
    self.stop = function () {
        if (self.waitBeforeRestart()) {
            self.longerStopped(true);
        }
        self.stopped(true)
    }

    self.unlockUnlockables = function () {
        if (self.player.money() > 0) {
            self.unlock("FirstGold")
        }
    }


    self.bankedTickText = ko.computed(function () {
        return ["Toggles the usage of your banked ticks.",
            "You currently have <bold>" + self.bankedTicks().toFixed(0) + " banked ticks (" + (self.bankedticksInSeconds()) + " seconds)</bold>",
            "You gain new ticks at <bold>0.25/t (or 15/second)</bold> while your loop is paused or you are offline.",
            "You may use them to perform loop actions at <bold>4x speed</bold> until they run out.",
            "Your tick usage is turned <bold>" + (self.useBankedTicks() ? "on" : "off") + "</bold>."
        ].join("\n");
    })

    self.lock = function (name) {
        if (!validUnlockables.includes(name))
            console.warn("Game-Unlockables (lock) : unknown id: " + name);
        self.unlockables.removeAll(name);
    }

    self.unlock = function (name) {
        if (!validUnlockables.includes(name))
            console.warn("Game-Unlockables (unlock) : unknown id: " + name);
        pushUnique(self.unlockables, name);
    }

    self.isUnlocked = function (name) {
        if (!validUnlockables.includes(name))
            console.warn("Game-Unlockables (isUnlocked) : unknown id: " + name);
        return self.unlockables().includes(name);
    }

    self.failedThisLoop = false;

    self.tick = function () {
        if (self.useBankedTicks() && !self.longerStopped()) {
            if (self.bankedTicks() <= 0) {
                self.useBankedTicks(false);
                self.bankedTicks(0)
            } else {
                for (let i = 0; i < 4; i++) {
                    self._tick();
                }
                obs.increment(self.bankedTicks, -1);
                return;
            }
        }
        self._tick();
    }

    self.clearNextActions = function(){
        self.nextActions.removeAll()
    }

    //The main gameloop.
    self._tick = function () {
        self.unlockUnlockables();
        if (self.currentActions().length == 0) {
            self.stopped(true)
            self.longerStopped(true);
        }
        if (self.stopped()) {
            if (!self.longerStopped() && !self.waitBeforeRestart()) {
                self.restart();
                return;
            } else {
                self.longerStopped(true);
            }
            obs.increment(self.bankedTicks, 0.25);
            return;
        }

        if (self.player.currentTicks() <= 0) {
            self.stop()

            if (self.waitOnFail()) {
                var runEnded = (self.actionPointer == self.currentActions().length);
                self.longerStopped() = !runEnded;
            }
            return;
        }

        self.player.stats().forEach(function (elem) {
            elem.handleOverflow();
        })



        var elem = self.currentActions()[self.actionPointer];
        if (!elem && self.repeatLastAction()) {
            elem = self.currentActions()[self.currentActions().length - 1]
        }
        if (elem && !elem.failed()) {
            if (!self.isCurrentValidAction(elem)) {
                if (self.actionPointer < self.currentActions().length) {
                    self.actionPointer++;
                }
                obs.increment(self.player.currentTicks, -1)
                this.failedThisLoop = true;
                elem.failed(true);
            }
            elem.doTick();
            elem.handleOverflow();
            if (elem.done() && self.actionPointer < self.currentActions().length) {
                self.actionPointer++;
            }
            obs.increment(self.player.currentTicks, -1)
        }

        var runEnded = (self.actionPointer == self.currentActions().length && !self.repeatLastAction());
        if (runEnded) {
            self.stop()
            if (self.currentActions().length == 0) {
                self.longerStopped(true);
            }
            if (this.failedThisLoop && self.waitOnFail()) {
                self.longerStopped(true);
            }
        }
    }

}