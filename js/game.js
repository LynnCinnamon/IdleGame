//Helper functions


var obs = {
    increment: function (observable, amount) {
        observable(observable() + (amount || 1));
    },
}

//From 0-100 -> 1-10
var logerithmic = function (val) {
    return ((14) / (1 + Math.exp(-0.003 * 14 * val) * ((14 / 5) - 1))) - 4
}

/**
 *
 * @param {array} array
 * @param {string} keyname
 * @param {any} value
 */
var get = function (array, keyname, value) {
    return array.find(element => element[keyname] === value);
}

function getFuncName() {
    return getFuncName.caller.name
}

var pushUnique = function (array, key) {
    if (array().includes(key))
        return
    array.push(key);
}

/**
 *
 * @param {gameModel} game
 * @param {string} name
 * @returns
 */
var town = function (game, name) {
    return get(game.world.towns, "name", name)
}

//GLOBAL VARS

var validUnlockables = [
    "FirstGold"
]

//Game logic

function Stat(name) {
    var self = this;
    self.name = name
    self.value = ko.observable(1);
    self.valuePercentage = ko.observable(0);
    self.metaValue = ko.observable(0)
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
}

/**
 *
 * @param {string} name
 * @param {gameModel} gameModel
 */
function townExplorable(name, gameModel) {
    var self = this;
    self.name = name;


    self.found = ko.observable(0);
    self.withValue = ko.observable(0);
    self.withoutValue = 0;
    self.done = ko.observable(0);
    self.valueFirst = ko.observable(false);


    self.total = function () {
        return self.found() + self.withValue() + self.withoutValue + self.done()
    }

    self.gameModel = gameModel;

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

function gameModel() {
    var self = this;
    self.stats = ko.observableArray([
        new Stat("Dexterity"),
        new Stat("Strength"),
        new Stat("Constitution"),
        new Stat("Speed"),
        new Stat("Perception"),
        new Stat("Charisma"),
        new Stat("Intelligence"),
        new Stat("Luck"),
        new Stat("Soul"),
    ]);

    self.mouse = {
        x: ko.observable(0),
        y: ko.observable(0)
    }

    self.bankedTicks = ko.observable(0);
    self.useBankedTicks = ko.observable(false);

    self.currentTownDisplay = ko.observable(0);
    self.currentTownPlayerPawn = 0;
    self.money = ko.observable(0);

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
        towns: [{
                name: "A small village",
                locked: ko.observable(false),
                actions: ko.observableArray([
                    allActions["Explore"],
                    allActions["Smash Pots"],
                    allActions["Loot Pockets"],
                    allActions["Buy Mana"],
                    allActions["Visit Tavern"],
                ]),
                progress: [{
                    name: "Explored",
                    value: ko.observable(0),
                    meta: ko.observable(0),
                    description: "Exploring the town, you can find many interesting things... Maybe some of them might allow you to have more time per loop?",
                    visible: function () {
                        return true;
                    },
                    items: [
                        new townExplorable("Pots smashed"),
                        new townExplorable("Pockets looted")
                    ],
                    increment: function () {
                        if (this.value() >= 100) {
                            this.value(100);
                            this.meta(100);
                            return;
                        }
                        obs.increment(this.meta, (100 / (self.world.towns[0].progress[0].value() + 1)));
                        if (this.meta() >= 100) {
                            this.meta(0);
                            obs.increment(this.value);
                            this.valueIncrease();
                        }
                    },
                    valueIncrease: function () {
                        var potRessauces = {
                            1: 5,
                            5: 5,
                            10: 5,
                            20: 5,
                            25: 5,
                            30: 5,
                            35: 5,
                            40: 5,
                            45: 5,
                            50: 5,
                            55: 5,
                            60: 5,
                            65: 5,
                            70: 5,
                            75: 5,
                            80: 5,
                            85: 5,
                            90: 5,
                            95: 5,
                            100: 5,
                        }
                        var pocketRessauces = {
                            10: 2,
                            20: 2,
                            30: 2,
                            40: 2,
                            50: 2,
                            60: 2,
                            70: 2,
                            80: 2,
                            90: 2,
                            100: 2,
                        }
                        if (potRessauces[this.value()]) {
                            obs.increment(this.items[0].found, potRessauces[this.value()]);
                        }
                        if (pocketRessauces[this.value()]) {
                            obs.increment(this.items[1].found, pocketRessauces[this.value()]);
                        }
                    }
                }]
            },
            {
                name: "The tavern",
                locked: ko.observable(true),
                actions: ko.observableArray([
                    allActions["Leave Tavern"],
                    allActions["Talk to the drunks"],
                    allActions["Investigate a rumor"],
                ]),
                progress: [{
                    name: "Drunks talked to",
                    value: ko.observable(0),
                    meta: ko.observable(0),
                    description: "The conversations are weird but some might prove interesting... No way to find out but to try!",
                    visible: function () {
                        return true;
                    },
                    items: [
                        new townExplorable("Rumors heared"),
                    ],
                    increment: function () {
                        if (this.value() >= 100) {
                            this.value(100);
                            this.meta(100);
                            return;
                        }
                        obs.increment(this.meta, (100 / (this.value() + 1)));
                        if (this.meta() >= 100) {
                            this.meta(0);
                            obs.increment(this.value);
                            this.valueIncrease();
                        }
                    },
                    valueIncrease: function () {
                        obs.increment(this.items[0].found);
                    }
                }]
            }
        ],
    }

    self.startTicks = 250;
    self.maxTicks = ko.observable(self.startTicks);
    self.currentTicks = ko.observable(self.startTicks);
    self.stopped = ko.observable(true);
    self.longerStopped = ko.observable(false);

    self.waitBeforeRestart = ko.observable(false);
    self.waitOnFail = ko.observable(false);
    self.repeatLastAction = ko.observable(false);

    self.inTown = function (num) {
        return self.currentTownDisplay() == num
    }

    self.nextActions = ko.observableArray([]);

    self.ticksInSeconds = function () {
        return (self.currentTicks() / 60 / (self.useBankedTicks() ? 4 : 1) ).toFixed(2)
    }

    self.bankedticksInSeconds = function() {
        return (self.bankedTicks() / 60).toFixed(2)
    }

    self.getStatByName = function (name) {
        var finalStat = undefined
        self.stats().forEach(function (stat) {
            if (stat.name == name) {
                finalStat = stat;
            }
        });
        return finalStat;
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
        self.currentTicks(self.startTicks)
        self.maxTicks(self.startTicks)
        self.currentActions.removeAll()
        self.failedThisLoop = false;
        self.currentTownPlayerPawn = 0;

        saveGameManager.save();

        self.money(0);

        self.world.towns.forEach(function (town) {
            town.progress.forEach(function (prog) {
                prog.items.forEach(function (item) {
                    item.reset();
                })
            })
        })


        self.stats().forEach(function (stat) {
            stat.value(0)
            stat.valuePercentage(0)
        });

        self.nextActions().forEach(function (ac) {
            self.currentActions.push(ac.copy())
        })
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
        if (self.money() > 0) {
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

        if (self.currentTicks() <= 0) {
            self.stop()

            if (self.waitOnFail()) {
                var runEnded = (self.actionPointer == self.currentActions().length);
                self.longerStopped() = !runEnded;
            }
            return;
        }

        self.stats().forEach(function (elem) {
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
                obs.increment(self.currentTicks, -1)
                this.failedThisLoop = true;
                elem.failed(true);
            }
            elem.doTick();
            elem.handleOverflow();
            if (elem.done() && self.actionPointer < self.currentActions().length) {
                self.actionPointer++;
            }
            obs.increment(self.currentTicks, -1)
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


var speedup = 1;

function startupLoop() {
    if (ready !== 1) {
        return;
    }
    clearTimeout(startup)

    saveGameManager.load()

    ko.applyBindings(globalGameModel)

    var notbremse = setInterval(function () {
        for (let i = 0; i < speedup; i++) {
            try {
                globalGameModel.tick();
            } catch (error) {
                console.warn("Notbremse gezogen jugnge!");
                clearInterval(notbremse);
                console.error(error)
                break;
            }
        }
    }, 1000 / 60)
}



window.globalGameModel = new gameModel()
$("body").mousemove(function (e) {
    globalGameModel.mouse.x(e.pageX);
    globalGameModel.mouse.y(e.pageY);
})
var startup = setInterval(startupLoop, 10);


function hidePopup(e) {
    e.getElementsByClassName("popup")[0].style.display = "none";
}

function showPopup(e) {
    e.getElementsByClassName("popup")[0].style.display = "block";
}


function serializeData(givenArray) {
    var array = [];
    givenArray.forEach((item) => {
        array.push(item.getStaticObject())
    })
    return array;
}


function debugLog(obj)
{
    //console.log(obj);
}

var saveGameManager = {
    generateItemsSaveObject: (items)=>{
        var array = [];
        items.forEach((item) => {
            array.push({
                name: item.name,
                found: item.found(),
                withValue: item.withValue(),
                withoutValue: item.withoutValue,
                done: item.done(),
                valueFirst: item.valueFirst(),
            })
        })
        return array;
    },
    generateProgressSaveObject: (progress) => {
        var array = [];
        progress.forEach((progress) => {
            array.push({
                name: progress.name,
                value: progress.value(),
                meta: progress.meta(),
                items: saveGameManager.generateItemsSaveObject(progress.items)
            })
        })
        return array;
    },
    generateTownsSaveObject: (towns) => {
        var array = [];
        towns.forEach((town) => {
            array.push({
                name: town.name,
                locked: town.locked(),
                progress: saveGameManager.generateProgressSaveObject(town.progress)
            })
        })
        return array;
    },
    generateSaveGameFile: () => {
        return JSON.stringify({
            saveTime: new Date(),
            bankedTicks: globalGameModel.bankedTicks(),
            stats: serializeData(globalGameModel.stats()),
            nextActions: serializeData(globalGameModel.nextActions()),
            towns: saveGameManager.generateTownsSaveObject(globalGameModel.world.towns)
        })
    },
    loadSaveGameFile: (saveGame) => {

        var now = new Date();
        var then = new Date(saveGame.saveTime);
        var diff = now-then
        var seconds = parseInt(diff/1000);
        var offlineTicks = seconds * 15;

        saveGame.bankedTicks += offlineTicks;

        debugLog("Banked Ticks -> " + saveGame.bankedTicks)
        globalGameModel.bankedTicks(saveGame.bankedTicks)
        saveGame.stats.forEach((stat) => {
            debugLog(stat.name + ":");
            var gameStat = globalGameModel.getStatByName(stat.name);
            debugLog("\tvalue -> " + stat.value)
            gameStat.value(stat.value)
            debugLog("\tmetaValue -> " + stat.metaValue)
            gameStat.metaValue(stat.metaValue)
            debugLog("\tvaluePercentage -> " + stat.valuePercentage)
            gameStat.valuePercentage(stat.valuePercentage)
            debugLog("\tmetaValuePercentage -> " + stat.metaValuePercentage)
            gameStat.metaValuePercentage(stat.metaValuePercentage)
        })
        globalGameModel.nextActions.removeAll();
        saveGame.nextActions.forEach((action) => {
            debugLog("Adding Action '" + action.name + "' (" + action.amount + "x)")
            globalGameModel.nextActions.push(new Action(allActions[action.name], action.amount))
        })
        saveGame.towns.forEach((town)=>{
            var gameTown = globalGameModel.world.towns.find(element => element.name === town.name)
            debugLog("'" + town.name + "':")
            debugLog("\tlocked -> " + town.locked)
            gameTown.locked(town.locked);
            town.progress.forEach((progress)=>{
                var gameProgress = gameTown.progress.find(element => element.name === progress.name)
                debugLog("\t" + progress.name + ":")
                debugLog("\t\tvalue -> " + progress.value)
                gameProgress.value(progress.value);
                debugLog("\t\tmeta -> " + progress.meta)
                gameProgress.meta(progress.meta);
                progress.items.forEach((item)=>{
                    debugLog("\t\t" + item.name)
                    var gameItem = gameProgress.items.find(element => element.name == item.name)
                    debugLog("\t\t\tdone ->" + item.done)
                    gameItem.done(item.done)
                    debugLog("\t\t\tfound ->" + item.found)
                    gameItem.found(item.found)
                    debugLog("\t\t\tvalueFirst ->" + item.valueFirst)
                    gameItem.valueFirst(item.valueFirst)
                    debugLog("\t\t\twithValue ->" + item.withValue)
                    gameItem.withValue(item.withValue)
                    debugLog("\t\t\twithoutValue ->" + item.withoutValue)
                    gameItem.withoutValue = item.withoutValue
                })
            })
        })
        return saveGame
    },
    save: () => {
        try {
            localStorage.setItem("SaveGame", saveGameManager.generateSaveGameFile())
        } catch (error) {
            console.warn("Could not save...")
            console.error(error)
        }
    },
    load: () => {
        try {
            if( localStorage.getItem("SaveGame") != null)
                saveGameManager.loadSaveGameFile(JSON.parse(localStorage.getItem("SaveGame")));
        } catch (error) {
            console.warn("Could not load savefile...")
            console.warn("Clearing save and backing it up to key 'LastFailedLoad'")
            console.error(error);
            localStorage.setItem("LastFailedLoad", localStorage.getItem("SaveGame"))
            localStorage.removeItem("SaveGame")
        }
    },
    clear: () => {
        localStorage.removeItem("SaveGame")
    },
    cleaeLastFailed: () => {
        localStorage.removeItem("LastFailedLoad")
    },
    fullClear: () => {
        localStorage.removeItem("SaveGame")
        localStorage.removeItem("LastFailedLoad")
    }
}

function getActionShareString()
{
    var str = ""
    serializeData(globalGameModel.nextActions()).forEach((e)=>{
        str += (str === "" ? '' : '\n') + (e.amount + 'x ' + e.name)
    })
    return str
}