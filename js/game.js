//GLOBAL VARS
var validUnlockables = [
    "FirstGold"
];
var globalGameModel = new GameModel();
var startup = setInterval(startupLoop, 10);
var speedup = 1;
function startupLoop() {
    if (ready !== 1) {
        return;
    }
    clearTimeout(startup);
    saveGameManager.load();
    ko.applyBindings(globalGameModel);
    var notbremse = setInterval(function () {
        for (let i = 0; i < speedup; i++) {
            try {
                globalGameModel.tick();
            }
            catch (error) {
                console.warn("Notbremse gezogen jugnge!");
                clearInterval(notbremse);
                console.error(error);
                break;
            }
        }
    }, 1000 / 60);
}
$("body").on("mousemove", function (e) {
    globalGameModel.mouse.x(e.pageX);
    globalGameModel.mouse.y(e.pageY);
});
function hidePopup(e) {
    e.getElementsByClassName("popup")[0].style.display = "none";
}
function showPopup(e) {
    e.getElementsByClassName("popup")[0].style.display = "block";
}
function serializeData(givenArray) {
    var array = [];
    givenArray.forEach((item) => {
        array.push(item.getStaticObject());
    });
    return array;
}
function debugLog(obj) {
    //console.log(obj);
}
var saveGameManager = {
    generateItemsSaveObject: (items) => {
        var array = [];
        items.forEach((item) => {
            array.push({
                name: item.name,
                found: item.found(),
                withValue: item.withValue(),
                withoutValue: item.withoutValue,
                done: item.done(),
                valueFirst: item.valueFirst(),
            });
        });
        return array;
    },
    generateProgressSaveObject: (progress) => {
        var array = [];
        progress().forEach((progress) => {
            array.push({
                name: progress.name,
                value: progress.value(),
                meta: progress.meta(),
                items: saveGameManager.generateItemsSaveObject(progress.items)
            });
        });
        return array;
    },
    generateTownsSaveObject: (towns) => {
        var array = [];
        towns.forEach((town) => {
            array.push({
                name: town.name,
                locked: town.locked(),
                progress: saveGameManager.generateProgressSaveObject(town.progress)
            });
        });
        return array;
    },
    generateSaveGameFile: () => {
        var saveGame = {
            saveTime: new Date().getTime(),
            bankedTicks: globalGameModel.bankedTicks(),
            stats: serializeData(globalGameModel.player.stats()),
            nextActions: serializeData(globalGameModel.nextActions()),
            towns: saveGameManager.generateTownsSaveObject(globalGameModel.world.towns)
        };
        return JSON.stringify(saveGame);
    },
    loadSaveGameFile: (saveGame) => {
        var now = new Date();
        var then = saveGame.saveTime;
        var diff = now.getTime() - then;
        var seconds = parseInt(diff / 1000 + '');
        var offlineTicks = seconds * 15;
        saveGame.bankedTicks += offlineTicks;
        debugLog("Banked Ticks -> " + saveGame.bankedTicks);
        globalGameModel.bankedTicks(saveGame.bankedTicks);
        saveGame.stats.forEach((stat) => {
            debugLog(stat.name + ":");
            var gameStat = allStats[stat.name];
            debugLog("\tmetaValue -> " + stat.metaValue);
            gameStat.metaValue(stat.metaValue);
            debugLog("\tmetaValuePercentage -> " + stat.metaValuePercentage);
            gameStat.metaValuePercentage(stat.metaValuePercentage);
        });
        globalGameModel.nextActions.removeAll();
        saveGame.nextActions.forEach((action) => {
            debugLog("Adding Action '" + action.name + "' (" + action.amount + "x)");
            globalGameModel.nextActions.push(new Action(allActions[action.name], action.amount));
        });
        saveGame.towns.forEach((town) => {
            var gameTown = globalGameModel.world.towns.find(element => element.name === town.name);
            debugLog("'" + town.name + "':");
            debugLog("\tlocked -> " + town.locked);
            gameTown.locked(town.locked);
            town.progress.forEach((progress) => {
                var gameProgress = gameTown.progress().find(element => element.name === progress.name);
                debugLog("\t" + progress.name + ":");
                debugLog("\t\tvalue -> " + progress.value);
                gameProgress.value(progress.value);
                debugLog("\t\tmeta -> " + progress.meta);
                gameProgress.meta(progress.meta);
                progress.items.forEach((item) => {
                    debugLog("\t\t" + item.name);
                    var gameItem = gameProgress.items.find(element => element.name == item.name);
                    debugLog("\t\t\tdone ->" + item.done);
                    gameItem.done(item.done);
                    debugLog("\t\t\tfound ->" + item.found);
                    gameItem.found(item.found);
                    debugLog("\t\t\tvalueFirst ->" + item.valueFirst);
                    gameItem.valueFirst(item.valueFirst);
                    debugLog("\t\t\twithValue ->" + item.withValue);
                    gameItem.withValue(item.withValue);
                    debugLog("\t\t\twithoutValue ->" + item.withoutValue);
                    gameItem.withoutValue = item.withoutValue;
                });
            });
        });
        return saveGame;
    },
    save: () => {
        try {
            localStorage.setItem("SaveGame", saveGameManager.generateSaveGameFile());
        }
        catch (error) {
            console.warn("Could not save...");
            console.error(error);
        }
    },
    load: () => {
        try {
            if (localStorage.getItem("SaveGame") != null)
                saveGameManager.loadSaveGameFile(JSON.parse(localStorage.getItem("SaveGame")));
        }
        catch (error) {
            console.warn("Could not load savefile...");
            console.warn("Clearing save and backing it up to key 'LastFailedLoad'");
            console.error(error);
            localStorage.setItem("LastFailedLoad", localStorage.getItem("SaveGame"));
            localStorage.removeItem("SaveGame");
        }
    },
    clear: () => {
        localStorage.removeItem("SaveGame");
    },
    cleaeLastFailed: () => {
        localStorage.removeItem("LastFailedLoad");
    },
    fullClear: () => {
        localStorage.removeItem("SaveGame");
        localStorage.removeItem("LastFailedLoad");
    }
};
function getActionShareString() {
    var str = "";
    serializeData(globalGameModel.nextActions()).forEach((e) => {
        str += (str === "" ? '' : '\n') + (e.amount + 'x ' + e.name);
    });
    return str;
}
