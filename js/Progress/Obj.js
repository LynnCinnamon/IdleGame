new Progress("Explored", "Exploring the town, you can find many interesting things... Maybe some of them might allow you to have more time per loop?", [
    allExplorables["Pots smashed"],
    allExplorables["Pockets looted"],
]).valueIncrease((that) =>
{
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
    if (potRessauces[that.value()]) {
        obs.increment(that.items[0].found, potRessauces[that.value()]);
    }
    if (pocketRessauces[that.value()]) {
        obs.increment(that.items[1].found, pocketRessauces[that.value()]);
    }
})

new Progress("Drunks talked to", "The conversations are weird but some might prove interesting... No way to find out but to try!", [
    allExplorables["Rumors heared"],
]).valueIncrease((that) =>
{
    obs.increment(that.items[0].found);
})

new Progress("Odd things noticed", "You knew there was merit in talking to the drunks!\n<bold>This speeds up with a higher \"Drunks talked to\" value!</bold>", [

]).valueIncrease((that) =>
{
})
.visible(()=>
{
    return allProgress["Drunks talked to"].value() >= 20;
}).increment(function (that) {
    if (that.value() >= 100) {
        that.value(100);
        that.meta(100);
        return;
    }
    obs.increment(that.meta, allProgress["Drunks talked to"].value() / 20 * (100 / (that.value() + 1)));
    if (that.meta() >= 100) {
        that.meta(0);
        obs.increment(that.value);
        that.valueIncrease();
    }
})