
function ActionList() {
    /** @type {ActionList}*/
    var self = this;
    /**@type {Action[]} observable*/
    self.actions = ko.observableArray([]);
    self.actionPointer = 0;

    self.collapsed = ko.observable(false)

    /** @type {number} ko.observable*/
    self.currentAmount = ko.observable(0);

    /** @type {boolean} ko.observable*/
    self.failed = ko.observable(false);

    /** @returns {number} */
    self.maxAmount = ()=>{
        return self.actions().reduce((tally, current)=>{return tally + current.maxAmount()}, 0)
    }

    self.canMoveUp = function () {
        return globalGameModel.nextActions()[0] != self;
    }

    self.canMoveDown = function () {
        return globalGameModel.nextActions()[globalGameModel.nextActions().length - 1] != self;
    }

    self.hasAction = function(action){
        return self.actions().reduce((tally, current)=>{return tally || current == action || current.hasAction(action)}, false)
    }

    self.removeAction = function(action){
        var index = actions.indexOf(action);
        if (index > -1) {
            actions.splice(index, 1);
        }
    }

    self.moveUp = function () {
        var na = globalGameModel.nextActions;
        let pos = na.indexOf(self);
        na.splice(pos, 1, na()[pos - 1]);
        na.splice(pos - 1, 1, self);

    }

    self.moveDown = function () {
        var na = globalGameModel.nextActions;
        let pos = na.indexOf(self);
        na.splice(pos, 1, na()[pos + 1]);
        na.splice(pos + 1, 1, self);
    }

    /** @returns {number} */
    self.duration = ()=>{
        return self.actions().reduce((tally, current)=>{return tally + current.duration()}, 0)
    }
    /** @returns {number} */
    self.currentTick = ko.computed(()=>{
        return self.actions().reduce((tally, current)=>{return tally + current.currentTick()}, 0)
    })
    self.finish = () => {}
    self.tick = ()=>{

    }
    self.reset = ()=>{
        self.actions().forEach((action)=>{
            action.reset()
        })
        self.failed(false)
        self.actionPointer = 0;
        self.currentAmount(0)
    }
    self.doTick = () => {
        var elem = self.actions()[self.actionPointer];
        if (!elem) {
            self.reset()
            var elem = self.actions()[self.actionPointer];
        }
        if (elem && !elem.failed()) {
            if (false && !self.isCurrentValidAction(elem)) {
                if (self.actionPointer < self.actions().length) {
                    self.actionPointer++;
                }
                obs.increment(self.player.currentTicks, -1)
                this.failedThisLoop = true;
                elem.failed(true);
            }
            elem.doTick();
            elem.handleOverflow();
            if (elem.done() && self.actionPointer < self.actions().length) {
                self.actionPointer++;
            }
        }
    }
    self.handleOverflow = () => {

    }
    self.done = () => {
        return self.actionPointer == self.actions().length
     }
    self.visible = ()=>{return true}
    self.tickMultiplier = ()=>{ return 1 }

    self.copy = ()=>{
        var AL = new ActionList()
        self.actions().forEach((action)=>{
            AL.actions.push(action.copy())
        })
        return AL;
    }

    self.getStaticObject = () => {
        var array = [];
        self.actions().forEach((item) => {
            array.push(item.getStaticObject())
        })
        return {
            name: self.name,
            amount: self.maxAmount(),
            children: array
        }
    }

}
