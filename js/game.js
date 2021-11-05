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
                progress: [
                    allProgress["Explored"],
                ]
            },
            {
                name: "The tavern",
                locked: ko.observable(true),
                actions: ko.observableArray([
                    allActions["Leave Tavern"],
                    allActions["Talk to the drunks"],
                    allActions["Investigate a rumor"],
                ]),
                progress: [
                    allProgress["Drunks talked to"],
                ]
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