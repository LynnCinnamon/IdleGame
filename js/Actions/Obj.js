new BaseAction("Explore", "Take a look around.\nThere must be something to do...")
    .duration(function () {
        return 150;
    })
    .finish(function () {
        globalGameModel.world.towns[0].progress[0].increment();
    })
    .stats({
        "Speed": 70,
        "Perception": 20,
        "Dexterity": 10
    })
    .visible(function () {
        return true
    })
    .clickable(function () {
        return true
    })

new BaseAction("Smash Pots", "Like a particular elf-boy\nIn Some of them might be some mana, who knows?")
    .duration(function () {
        return 50;
    })
    .finish(function () {
        var action = globalGameModel.world.towns[0].progress[0];
        var success = action.items[0].takeAction(5);
        if (success) {
            obs.increment(globalGameModel.currentTicks, 100)
            obs.increment(globalGameModel.maxTicks, 100)
        }
    })
    .stats({
        "Strength": 50,
        "Constitution": 50,
    })
    .visible(function () {
        return globalGameModel.world.towns[0].progress[0].items[0].total() > 0
    })
    .clickable(function () {
        return globalGameModel.world.towns[0].progress[0].items[0].total() > 0
    })

new BaseAction("Loot Pockets", "You need that money more than they do.\nAnd they will forget next loop anyway.")
    .duration(function () {
        return 50;
    })
    .finish(function () {
        var action = globalGameModel.world.towns[0].progress[0];
        var success = action.items[1].takeAction(2);
        if (success) {
            obs.increment(globalGameModel.money, 10)
        }
    })
    .stats({
        "Intelligence": 50,
        "Luck": 50,
    })
    .visible(function () {
        return globalGameModel.world.towns[0].progress[0].items[1].total() > 0
    })
    .clickable(function () {
        return globalGameModel.world.towns[0].progress[0].items[1].total() > 0
    })

new BaseAction("Buy Mana", "Can't do anything else with that money... Or can you?\n1G -> 20 Mana")
    .duration(function () {
        return 10
    })
    .finish(function () {
        if (globalGameModel.money() > 0) {
            obs.increment(globalGameModel.currentTicks, globalGameModel.money() * 20);
            obs.increment(globalGameModel.maxTicks, globalGameModel.money() * 20);
            globalGameModel.money(0);
        }
    })
    .tick(function () {
        globalGameModel.getStatByName("Charisma").incrementWithPower(.1);
    })
    .visible(function () {
        return globalGameModel.isUnlocked("FirstGold")
    })
    .clickable(function () {
        return globalGameModel.isUnlocked("FirstGold")
    })

new BaseAction("Visit Tavern", "Hey, you deserve a break too, right?\n(New Area)")
    .duration(function () {
        return 100
    })
    .finish(function () {
        globalGameModel.currentTownPlayerPawn = 1;
        if (globalGameModel.world.towns[1].locked()) {
            globalGameModel.currentTownDisplay(globalGameModel.currentTownPlayerPawn);
            globalGameModel.world.towns[1].locked(false);

        }
    })
    .tick(function () {


    })
    .visible(function () {
        return globalGameModel.world.towns[0].progress[0].value() >= 15
    })
    .clickable(function () {
        return globalGameModel.world.towns[0].progress[0].value() >= 15
    })




new BaseAction("Leave Tavern", "Welp, off to the outside again!")
    .duration(function () {
        return 100;
    })
    .finish(function () {
        globalGameModel.currentTownPlayerPawn = 0;
    })
    .visible(function () {
        return true
    })
    .clickable(function () {
        return true
    })

new BaseAction("Talk to the drunks", "Maybe they have something interesting...")
    .duration(function () {
        return 100;
    })
    .finish(function () {
        globalGameModel.world.towns[1].progress[0].increment();
    })
    .visible(function () {
        return true
    })
    .stats({
        "Charisma": 70,
        "Luck": 30,
    })
    .clickable(function () {
        return true
    })

new BaseAction("Investigate a rumor", "This ought to be interesting")
    .duration(function () {
        return 400;
    })
    .stats({
        "Perception": 60,
        "Intelligence": 40,
    })
    .finish(function () {
        var action = globalGameModel.world.towns[1].progress[0];
        var success = action.items[0].takeAction(10);
        if (success) {
            obs.increment(globalGameModel.money, 30)
        }
    })
    .visible(function () {
        return globalGameModel.world.towns[1].progress[0].items[0].total() > 0
    })
    .clickable(function () {
        return globalGameModel.world.towns[1].progress[0].items[0].total() > 0
    })