//Helper functions


var obs = {
    increment: function(observable, amount)
    {
        observable(observable() + (amount || 1));
    },
}

//From 0-100 -> 1-10
var logerithmic = function(val)
{
    return ((14) / (1 + Math.exp(-0.003 * 14 * val) * (( 14 / 5 ) - 1) )) - 4
}

/**
 * 
 * @param {array} array 
 * @param {string} keyname 
 * @param {any} value 
 */
var get = function(array, keyname, value)
{
    return array.find(element => element[keyname] === value);
}

function getFuncName() {
    return getFuncName.caller.name
}

var pushUnique = function(array, key)
{
    if(array().includes(key))
        return
    array.push(key);
}

/**
 * 
 * @param {gameModel} game 
 * @param {string} name 
 * @returns 
 */
var town = function(game, name)
{
    return get(game.world.towns, "name", name)
}

//GLOBAL VARS

var validUnlockables = [
    "FirstGold"
]

//Game logic

function Stat(name)
{
    var self = this;
    self.name = name
    self.value = ko.observable(1);
    self.valuePercentage = ko.observable(0);
    self.metaValue = ko.observable(0)
    self.metaValuePercentage = ko.observable(0);

    self.incrementWithPower = function(power)
    {
        obs.increment(self.valuePercentage, power + power * self.metaValue() * 0.1)
        obs.increment(self.metaValuePercentage, power * 0.1 / Math.sqrt(self.metaValue() + 1))
    }

    self.handleOverflow = function()
    {
        while(self.metaValuePercentage() >= 100)
        {
            self.metaValuePercentage(self.metaValuePercentage() - 100);
            obs.increment(self.metaValue)
        }
        while(self.valuePercentage() >= 100)
        {
            self.valuePercentage(self.valuePercentage() - 100);
            obs.increment(self.value)
        }
    }
}


function BaseAction(gamemodel, name, description)
{
    var self = this;
    self.gameModel = gamemodel;
    self.name = name;
    self.description = description;
    
    //For storing some functions this object will hold
    self._internals = {}
    self._defaults = {}

    self.computed_description = function()
    {
        var string = self.description + "\n\n";
        if( Object.keys(self._stats).length == 0 )
            return string; // We have no stats associated with this Action...

        var sum = 0;
        Object.keys(self._stats).forEach((key)=>{
            sum += self._stats[key]
        })
        Object.keys(self._stats).forEach((key)=>{
            string += key + ": " + (self._stats[key] / sum * 100).toFixed(0) + "%\n";
        })
        return string
    }

    self.setOrRunFunction = function(name, callback)
    {
        if(typeof(callback) === "function")
        {
            self._internals[name] = callback;
            return self;
        }
        var func = self._internals[name];
        if(typeof(func) === "function")
        {
            return func(self);
        }
        throw new Error("Invalid use of function '" + name + "'")
    }

    self.indirection = function(name){
        //This weird code here is so that the function has the right name in the end when put out to the console.
        //Nessecary? No. Satisfying? Yeeees.
        const tmp = {
            [name]: (callback) => { return self.setOrRunFunction(name, callback); }
        }
        return tmp[name];
    }

    //Functions that are to be set on a object level, not constructor level.
    self.duration       = self.indirection("duration");
    self.finish         = self.indirection("finish");
    self.tick           = self.indirection("tick");
    self.visible        = self.indirection("visible");
    self.clickable      = self.indirection("clickable");
    self.tickMultiplier = self.indirection("tickMultiplier");

    //default implementations
    self.tick(function(that)
    {
        if(typeof(that) === "undefined") return;
        if(typeof(that._stats) === "undefined") return;
        if( Object.keys(that._stats).length == 0 )
            return; // We have no stats associated with this Action...
        var sum = 0;
        Object.keys(that._stats).forEach((key)=>{
            sum += that._stats[key]
        })
        Object.keys(that._stats).forEach((key)=>{
            self.gameModel.getStatByName(key).incrementWithPower(that._stats[key] / sum);
        })
    })

    self.tickMultiplier(function(that)
    {
        if(typeof(that) === "undefined") return 1;
        if(typeof(that._stats) === "undefined") return 1;
        if( Object.keys(that._stats).length == 0 )
            return 1; // We have no stats associated with this Action...
        var sumStats = 0;
        Object.keys(that._stats).forEach((key)=>{
            sumStats += that._stats[key]
        })
        var sum = 0;
        Object.keys(that._stats).forEach((key)=>{
            sum += self.gameModel.getStatByName(key).value() * that._stats[key] / sumStats;
        })
        return logerithmic(sum);
    })

    self._defaults = {
        tick: self.tick,
        tickMultiplier: self.tickMultiplier,
    }

    self._stats = {};
    self.stats = function(s){
        self._stats = s;
        return self;
    }

    self.addToPool = function()
    {
        gamemodel.nextActions.push(new Action(this, 1))
    }
}

function Action(baseAction, amount)
{
    var self = this;

    var baseAction = baseAction;
    self.name = baseAction.name;
    self.description = baseAction.description;
    self.duration = baseAction.duration;
    self.gameModel = baseAction.gameModel;

    self._internals = baseAction._internals;
    self._defaults = baseAction._defaults;

    self.finish = baseAction.finish;
    self.tick = baseAction.tick;
    self.visible = baseAction.visible;
    self.clickable = baseAction.clickable;
    self.tickMultiplier = baseAction.tickMultiplier;

    self.stats = baseAction.stats;

    self.maxAmount = ko.observable(amount);
    
    self.currentTick = ko.observable(0);
    self.currentAmount = ko.observable(0);

    self.failed = ko.observable(false);


    self.canMoveUp = function()
    {
        return self.gameModel.nextActions()[0] != self;
    }

    self.canMoveDown = function()
    {
        return self.gameModel.nextActions()[self.gameModel.nextActions().length - 1] != self;
    }

    self.moveUp = function()
    {
        var na = self.gameModel.nextActions;
        let pos = na.indexOf(self);
        na.splice(pos, 1, na()[pos - 1]);
        na.splice(pos - 1, 1, self);
        
    }

    self.moveDown = function()
    {
        var na = self.gameModel.nextActions;
        let pos = na.indexOf(self);
        na.splice(pos, 1, na()[pos + 1]);
        na.splice(pos + 1, 1, self);
    }

    self.decrementAmount = function()
    {
        obs.increment(self.maxAmount, -1);
    }
    
    self.incrementAmount = function()
    {
        obs.increment(self.maxAmount, 1);
    }

    self.done = function()
    {
        return self.currentAmount() >= self.maxAmount();
    }

    self.copy = function()
    {
        return new Action(baseAction, self.maxAmount());
    }

    self.doTick = function()
    {
        obs.increment(self.currentTick, self.tickMultiplier());
        self.tick();
    }

    self.handleOverflow = function() {
        if(self.currentTick() >= self.duration())
        {
            self.currentTick(0);
            self.finish();
            obs.increment(self.currentAmount)
        }
    }
}

/**
 * 
 * @param {string} name 
 * @param {gameModel} gameModel 
 */
function townExplorable(name, gameModel)
{
    var self = this;
    self.name= name;

    self.found= ko.observable(0);
    self.withValue= ko.observable(0);
    self.withoutValue= 0;
    self.done= ko.observable(0);
    self.valueFirst= ko.observable(false);

    self.total = function()
    {
        return self.found() + self.withValue() + self.withoutValue + self.done()
    }

    self.gameModel = gameModel;

    self.takeAction = function(chance = 10)
    {
        if(self.valueFirst())
        {
            if(self.withValue() > 0)
            {
                obs.increment(self.withValue, -1)
                obs.increment(self.done, 1)
                return true;
            }
        }
        if(self.found() > 0)
        {
            var totalChecked = self.withValue() + self.withoutValue + self.done()
            if(totalChecked % chance == chance - 1)
            {
                obs.increment(self.done, 1)
                obs.increment(self.found, -1)
                return true;
            }
            self.withoutValue += 1
            obs.increment(self.found, -1)
            return false;
        }
        else if(self.withValue() > 0)
        {
            obs.increment(self.withValue, -1)
            obs.increment(self.done, 1)
            return true;
        }
        return false;
    }

    self.reset = function()
    {
        this.withValue(this.withValue() + this.done())
        this.done(0);
    }
}

function gameModel()
{
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
    self.isCurrentValidAction = function(action)
    {
        var name = action.name;
        var town = self.world.towns[this.currentTownPlayerPawn];
        return town.actions().find(element => element.name === name) != undefined;
    }

    self.world = {
        towns:[
            {
                name: "A small village",
                locked: ko.observable(false),
                actions: ko.observableArray([
                    new BaseAction(self, "Explore", "Take a look around.\nThere must be something to do...")
                        .duration(function()
                        {
                            return 150;
                        })
                        .finish(function()
                        {
                            self.world.towns[0].progress[0].increment();
                        })
                        .stats({
                            "Speed": 70,
                            "Perception": 20,
                            "Dexterity": 10
                        })
                        .visible(function()
                        {
                            return true
                        })
                        .clickable(function()
                        {
                            return true
                        }),
                    new BaseAction(self, "Smash Pots", "Like a particular elf-boy")
                        .duration(function()
                        {
                            return 50;
                        })
                        .finish(function()
                        {
                            var action = self.world.towns[0].progress[0];
                            var success = action.items[0].takeAction(5);
                            if(success)
                            {
                                obs.increment(self.currentTicks, 100)
                                obs.increment(self.maxTicks, 100)
                            }
                        })
                        .stats({
                            "Strength": 50,
                            "Constitution": 50,
                        })
                        .visible(function()
                        {
                            return self.world.towns[0].progress[0].items[0].total() > 0
                        })
                        .clickable(function()
                        {
                            return self.world.towns[0].progress[0].items[0].total() > 0
                        }),
                    new BaseAction(self, "Loot Pockets", "You dirty thief!")
                        .duration(function()
                        {
                            return 50;
                        })
                        .finish(function(){
                            var action = self.world.towns[0].progress[0];
                            var success = action.items[1].takeAction(2);
                            if(success)
                            {
                                obs.increment(self.money, 10)
                            }
                        })
                        .stats({
                            "Intelligence": 50,
                            "Luck": 50,
                        })
                        .visible(function()
                        {
                            return self.world.towns[0].progress[0].items[1].total() > 0
                        })
                        .clickable(function()
                        {
                            return self.world.towns[0].progress[0].items[1].total() > 0
                        }),
                    new BaseAction(self, "Buy Mana", "Can't do anything else with that money... Or can you?")
                        .duration(function()
                        {
                            return 10
                        })
                        .finish (function()
                        {
                            if(self.money() > 0)
                            {
                                obs.increment(self.currentTicks, self.money() * 20);
                                obs.increment(self.maxTicks, self.money() * 20);
                                self.money(0);
                            }
                        })
                        .tick (function()
                        {
                            self.getStatByName("Charisma").incrementWithPower(.1);
                        })
                        .visible (function()
                        {
                            return self.isUnlocked("FirstGold")
                        })
                        .clickable (function()
                        {
                            return self.isUnlocked("FirstGold")
                        }),
                    new BaseAction(self, "Visit Tavern", "Hey, you deserve a break too, right?")
                        .duration(function()
                        {
                            return 100
                        })
                        .finish (function()
                        {
                            self.currentTownPlayerPawn = 1;
                            if(self.world.towns[1].locked())
                            {
                                self.currentTownDisplay(self.currentTownPlayerPawn);
                                self.world.towns[1].locked(false);
                                
                            }
                        })
                        .tick (function()
                        {

                        
                        })
                        .visible (function() 
                        {
                            return self.world.towns[0].progress[0].value() >= 40
                        })
                        .clickable (function() 
                        {
                            return self.world.towns[0].progress[0].value() >= 40
                        }),
                ]),
                progress:
                [
                    {
                        name: "Explored",
                        value: ko.observable(0),
                        meta: ko.observable(0),
                        visible: function()
                        {
                            return true;
                        },
                        items:
                        [
                            new townExplorable("Pots smashed"),
                            new townExplorable("Pockets looted")
                        ],
                        increment: function()
                        {
                            if(this.value() >= 100)
                            {
                                this.value(100);
                                this.meta(100);
                                return;
                            }
                            obs.increment(this.meta, (100 / (self.world.towns[0].progress[0].value() + 1)));
                            if(this.meta() >= 100)
                            {
                                this.meta(0);
                                obs.increment(this.value);
                                this.valueIncrease();
                            }
                        },
                        valueIncrease: function()
                        {
                            var potRessauces = {
                                1  : 5,
                                5  : 5,
                                10 : 5,
                                20 : 5,
                                25 : 5,
                                30 : 5,
                                35 : 5,
                                40 : 5,
                                45 : 5,
                                50 : 5,
                                55 : 5,
                                60 : 5,
                                65 : 5,
                                70 : 5,
                                75 : 5,
                                80 : 5,
                                85 : 5,
                                90 : 5,
                                95 : 5,
                                100: 5,
                            }
                            var pocketRessauces = {
                                10 : 2,
                                20 : 2,
                                30 : 2,
                                40 : 2,
                                50 : 2,
                                60 : 2,
                                70 : 2,
                                80 : 2,
                                90 : 2,
                                100: 2,
                            }
                            if(potRessauces[this.value()])
                            {
                                obs.increment(this.items[0].found, potRessauces[this.value()]);
                            }
                            if(pocketRessauces[this.value()])
                            {
                                obs.increment(this.items[1].found, pocketRessauces[this.value()]);
                            }
                        }
                    }
                ]
            },
            {
                name: "The tavern",
                locked: ko.observable(true),
                actions: ko.observableArray([
                    new BaseAction(self, "Leave Tavern", "Welp, off to the outside again!")
                        .duration(function()
                        {
                            return 100;
                        })
                        .finish(function()
                        {
                            self.currentTownPlayerPawn = 0;
                        })
                        .visible(function() {return true})
                        .clickable(function() {return true}),
                    new BaseAction(self, "Talk to the drunks", "If you can even call that a conversation...")
                        .duration(function()
                        {
                            return 100;
                        })
                        .finish(function()
                        {
                            self.currentTownPlayerPawn = 0;
                        })
                        .visible(function() {return true})
                        .clickable(function() {return true}),
                ]),
                progress:
                [
                    {
                        name: "Drunks talked to",
                        value: ko.observable(0),
                        meta: ko.observable(0),
                        visible: function()
                        {
                            return true;
                        },
                        items:
                        [
                            new townExplorable("Rumors heared"),
                        ],
                        increment: function()
                        {
                            if(this.value() >= 100)
                            {
                                this.value(100);
                                this.meta(100);
                                return;
                            }
                            obs.increment(this.meta, (100 / (this.value() + 1)));
                            if(this.meta() >= 100)
                            {
                                this.meta(0);
                                obs.increment(this.value);
                                this.valueIncrease();
                            }
                        },
                        valueIncrease: function()
                        {
                            obs.increment(this.items[0].found);
                        }
                    }
                ]
            }
        ],
    }

    self.startTicks = 250;
    self.maxTicks = ko.observable(self.startTicks);
    self.currentTicks = ko.observable(self.startTicks);
    self.stopped = ko.observable(true);
    self.longerStopped = false;

    self.waitBeforeRestart = ko.observable(false);
    self.waitOnFail = ko.observable(false);
    self.repeatLastAction = ko.observable(false);

    self.inTown = function(num)
    {
        return self.currentTownDisplay() == num
    }

    self.nextActions = ko.observableArray([]);

    self.ticksInSeconds = function()
    {
        return (self.currentTicks() / 60).toFixed(2)
    }
    
    self.getStatByName = function(name)
    {
        var finalStat = undefined
        self.stats().forEach(function(stat){
            if(stat.name == name)
            {
                finalStat = stat;
            }
        });
        return finalStat;
    }
    
    self.incrementShownTown = function()
    {
        obs.increment(self.currentTownDisplay)
    }
    
    self.maySeeNeighborTown = function(offset)
    {
        var newPos = self.currentTownDisplay() + offset;
        if(newPos < 0) return false;
        if(newPos > self.world.towns.length - 1) return false;
        if(self.world.towns[newPos].locked()) return false;
        return true;
    }

    self.decrementShownTown = function()
    {
        obs.increment(self.currentTownDisplay, -1)
    }

    self.toggleStart = function()
    {
        if(self.stopped())
        {
            self.stopped(false);
            self.longerStopped = false;
        }
        else
        {
            self.longerStopped = true;
            self.stop();
        }
    }

    self.restart = function()
    {
        self.stopped(false);
        self.actionPointer = 0;
        self.longerStopped = false;
        self.currentTicks(self.startTicks)
        self.maxTicks(self.startTicks)
        self.currentActions.removeAll()
        self.failedThisLoop = false;
        self.currentTownPlayerPawn = 0;

        self.money(0);

        self.world.towns.forEach(function(town){
            town.progress.forEach(function(prog){
                prog.items.forEach(function(item){
                    item.reset();
                })
            })
        })


        self.stats().forEach(function(stat){
            stat.value(0)
            stat.valuePercentage(0)
        });

        self.nextActions().forEach(function(ac)
        {
            self.currentActions.push(ac.copy())
        })
    }

    self.removeCurrentAction = function(data)
    {
        self.currentActions.remove(data)
    }

    self.removeNextAction = function(data)
    {
        self.nextActions.remove(data)
    }

    
    //Stops the loop from executing.
    //The tick function continues to fire!
    self.stop = function()
    {
        if(self.waitBeforeRestart())
        {
            self.longerStopped = true;
        }
        self.stopped(true)
    }

    self.unlockUnlockables = function()
    {
        if(self.money() > 0)
        {
            self.unlock("FirstGold")
        }
    }

    self.lock = function(name)
    {
        if(!validUnlockables.includes(name))
            console.warn("Game-Unlockables (lock) : unknown id: " + name);
        self.unlockables.removeAll(name);
    }

    self.unlock = function(name)
    {
        if(!validUnlockables.includes(name))
            console.warn("Game-Unlockables (unlock) : unknown id: " + name);
        pushUnique(self.unlockables, name);
    }

    self.isUnlocked = function(name)
    {
        if(!validUnlockables.includes(name))
            console.warn("Game-Unlockables (isUnlocked) : unknown id: " + name);
        return self.unlockables().includes(name);
    }

    self.failedThisLoop = false;
    //The main gameloop.
    self.tick = function()
    {
        self.unlockUnlockables();
        if(self.currentActions().length == 0)
        {
            self.stopped(true)
            self.longerStopped = true;
        }
        if(self.stopped())
        {
            if(!self.longerStopped && !self.waitBeforeRestart())
            {
                self.restart();
                return;
            }
            else
            {
                self.longerStopped = true;
            }
            return;
        }

        if(self.currentTicks() <= 0)
        {
            self.stop()

            if(self.waitOnFail())
            {
                var runEnded = (self.actionPointer == self.currentActions().length);
                self.longerStopped = !runEnded;
            }
            return;
        }

        self.stats().forEach(function(elem)
        {
            elem.handleOverflow();
        })
        
        

        var elem = self.currentActions()[self.actionPointer];
        if(!elem && self.repeatLastAction())
        {
            elem = self.currentActions()[self.currentActions().length - 1]
        }
        if(elem)
        {
            if(!self.isCurrentValidAction(elem))
            {
                if(self.actionPointer < self.currentActions().length)
                {
                    self.actionPointer ++;
                }
                obs.increment(self.currentTicks, -1)
                this.failedThisLoop = true;
                elem.failed(true);
            }
            elem.doTick();
            elem.handleOverflow();
            if(elem.done() && self.actionPointer < self.currentActions().length)
            {
                self.actionPointer ++;
            }
            obs.increment(self.currentTicks, -1)
        }
        
        var runEnded = (self.actionPointer == self.currentActions().length && !self.repeatLastAction());
        if(runEnded)
        {
            self.stop()
            if(self.currentActions().length == 0)
            {
                self.longerStopped = true;
            }
            if(this.failedThisLoop && self.waitOnFail())
            {
                self.longerStopped = true;
            }
        }
    }

}


var speedup = 1;

function startupLoop()
{
    if(ready !== 1)
    {
        return;
    }
    clearTimeout(startup)
    
    ko.applyBindings(globalGameModel)
    
    var notbremse = setInterval(function(){
        for (let i = 0; i < speedup; i++) {
            try{
                globalGameModel.tick();
            }catch
            {
                console.warn("Notbremse gezogen jugnge!");
                clearInterval(notbremse);
                break;
            }
        }
    }, 1000/60)
}



window.globalGameModel = new gameModel()
$("body").mousemove(function(e) {
    globalGameModel.mouse.x(e.pageX);
    globalGameModel.mouse.y(e.pageY);
})
var startup = setInterval(startupLoop, 10);


function hidePopup(e)
{
    e.getElementsByClassName("popup")[0].style.display="none";
}

function showPopup(e)
{
    e.getElementsByClassName("popup")[0].style.display="block";
}