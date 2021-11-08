/// <reference path="../node_modules/@types/knockout/index.d.ts" />
/// <reference path="w3include.ts" />
document.addEventListener('mousedown', function (e) {
    // If mousedown event is fired from .handler, toggle flag to true
    if (e.target instanceof Element) {
        if (e.target.classList.contains("noselect")) {
            e.preventDefault();
        }
    }
});
var obs = {
    increment: function (observable, amount) {
        observable(observable() + (amount || 1));
    },
};
//From 0-100 -> 1-10
var logerithmic = function (val) {
    return ((14) / (1 + Math.exp(-0.003 * 14 * val) * ((14 / 5) - 1))) - 4;
};
var get = function (array, keyname, value) {
    return array.find(element => element[keyname] === value);
};
function getFuncName() {
    return getFuncName.caller.name;
}
var pushUnique = function (array, key) {
    if (array().includes(key))
        return;
    array.push(key);
};
/**
 *
 * @param {gameModel} game
 * @param {string} name
 * @returns
 */
var town = function (game, name) {
    return get(game.world.towns, "name", name);
};
