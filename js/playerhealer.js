/*
* Process player healer actions
*/
//{ PlayerHealer - ph
function phPlayerHealer(x, y, color, role = cmdROLE_NAMES[0]) {
    this.X = x;
    this.Y = y;
    this.PathQueuePos = 0;
    this.PathQueueX = [];
    this.PathQueueY = [];
    this.ShortestDistances = [];
    this.WayPoints = [];
    this.ArriveDelay = false;
    this.targetHealer = undefined;
    this.movementCounter = 0;
    this.AdjacentTrueTile = undefined;
    this.AdjacentDrawn = undefined;
    this.Role = role; // must be unique
    this.Color = color;
    this.Tiles = phParseTiles();
    this.TileIdx = 0;
    this.PrevTile = {
        X: x,
        Y: y,
    };
    this.CurrentDst = {
        X: x,
        Y: y,
        WaitUntil: 0
    };
}
phPlayerHealer.prototype.tick = function () {
    this.PrevTile.X = this.X;
    this.PrevTile.Y = this.Y;
    if (this.ArriveDelay) {
        this.ArriveDelay = false;
        return;
    }
    if (this.PathQueuePos > 0) {
        this.X = this.PathQueueX[--this.PathQueuePos];
        this.Y = this.PathQueueY[this.PathQueuePos];
        if (this.PathQueuePos > 0) {
            this.X = this.PathQueueX[--this.PathQueuePos];
            this.Y = this.PathQueueY[this.PathQueuePos];
        }
    }
}
phPlayerHealer.prototype.useFood = function () {
    console.log(tickToSecond(ba.TickCounter) + ": Used a food on healer " + this.CurrentDst.healerId);
    for (let healer of ba.Healers) {
        if (this.CurrentDst.healerId === healer.id && healer.hp) {
            healer.applyPoisonDmg(true);
            return;
        }
    }
}
phPlayerHealer.prototype.skipDeadInQueue = function () {
    if (!this.CurrentDst.healerId) {
        return;
    }
    let isDead = (ba.HealersToRemove.indexOf(this.CurrentDst.healerId) != -1);
    let maybeDead = ba.Healers.filter(h => h.id == this.CurrentDst.healerId)[0];
    if (isDead || maybeDead?.hp === 0) {
        if (this.TileIdx < this.Tiles.length) {
            while (this.TileIdx < this.Tiles.length) {
                this.CurrentDst = this.Tiles[this.TileIdx++];

                if (!this.CurrentDst.healerId) return;
                isDead = (ba.HealersToRemove.indexOf(this.CurrentDst.healerId) != -1);
                maybeDead = ba.Healers.filter(h => h.id == this.CurrentDst.healerId)[0];
                if ((!isDead && !maybeDead) || maybeDead?.hp > 0) return;
            }
        }
        this.CurrentDst = { X: this.X, Y: this.Y };
    }
}
phPlayerHealer.prototype.pathfind = function () {
    if (ba.TickCounter <= 1) {
        return;
    }
    this.skipDeadInQueue();
    if (this.CurrentDst?.healerId) {
        this.pathfindHealer();
    }
    else {
        this.pathfindTile();
    }
}
phPlayerHealer.prototype.pathfindTile = function () {
    let arrived = (this.CurrentDst?.X === this.X && this.CurrentDst?.Y === this.Y);
    if (arrived && this.TileIdx < this.Tiles.length) {
        this.CurrentDst = this.Tiles[this.TileIdx++];
        this.skipDeadInQueue();

        if (this.CurrentDst?.healerId) {
            return this.pathfindHealer();
        }
    }
    if (ba.TickCounter <= this.CurrentDst?.WaitUntil) {
        return;
    }
    plPathfind(this, this.CurrentDst.X, this.CurrentDst.Y);
}
phPlayerHealer.prototype.pathfindHealer = function () {
    // check if healer exists/update to current tile
    this.findTarget();

    // path to true tile
    if (this.AdjacentTrueTile && this.AdjacentDrawn?.X) {
        this.CurrentDst.X = this.AdjacentTrueTile.X;
        this.CurrentDst.Y = this.AdjacentTrueTile.Y;
    }

    if (this.CurrentDst.X && ba.TickCounter > this.CurrentDst?.WaitUntil) {
        plPathfind(this, this.CurrentDst.X, this.CurrentDst.Y);
    }

    // uses a food same tick healer moves
    if (this.isMovingAfterStationary()) {
        if (this.movementCounter == 1) {
            this.tick();
            this.ArriveDelay = true;
            return;
        }
    }

    if (this.targetIsAdjacent() && ba.TickCounter > this.CurrentDst?.WaitUntil) {
        this.useFood();
        this.ArriveDelay = true;

        this.CurrentDst = this.Tiles[this.TileIdx] || { X: this.X, Y: this.Y };
        if (this.TileIdx < this.Tiles.length) {
            this.TileIdx++;
        }
    }
}
phPlayerHealer.prototype.isMovingAfterStationary = function () {
    let noMovePreviousTick = (this.X === this.PrevTile.X && this.Y === this.PrevTile.Y);
    let moveNextTick = (this.X !== this.CurrentDst.X || this.Y !== this.CurrentDst.Y);
    if (noMovePreviousTick && moveNextTick) {
        this.movementCounter++;
    }
    else {
        this.movementCounter = 0;
    }
    return noMovePreviousTick && moveNextTick;
}
phPlayerHealer.prototype.targetIsAdjacent = function () {
    let trueTileIsAdj = (this.X === this.AdjacentTrueTile?.X && this.Y === this.AdjacentTrueTile?.Y);
    let drawnTileIsAdj = (this.X === this.AdjacentDrawn?.X && this.Y === this.AdjacentDrawn?.Y);
    let intercardinalDrawnIsAdj = (
        (this.X + 1 === this.targetHealer?.drawnX && this.Y + 1 === this.targetHealer?.drawnY) // ne
        || (this.X + 1 === this.targetHealer?.drawnX && this.Y - 1 === this.targetHealer?.drawnY) // se
        || (this.X - 1 === this.targetHealer?.drawnX && this.Y - 1 === this.targetHealer?.drawnY) // sw
        || (this.X - 1 === this.targetHealer?.drawnX && this.Y + 1 === this.targetHealer?.drawnY) // nw
    );
    return drawnTileIsAdj || (trueTileIsAdj && intercardinalDrawnIsAdj);
}
phPlayerHealer.prototype.findTarget = function () {
    for (let healer of ba.Healers) {
        if (this.CurrentDst?.healerId === healer.id) {
            this.targetHealer = healer;
            let adjDrawn = phFindBestAdjacentTile(this.X, this.Y, healer.drawnX, healer.drawnY);
            let adjTrue = phFindBestAdjacentTile(this.X, this.Y, healer.x, healer.y);
            this.AdjacentDrawn = { X: adjDrawn[0], Y: adjDrawn[1] };
            this.AdjacentTrueTile = { X: adjTrue[0], Y: adjTrue[1] };
            return true;
        }
    }
    this.targetHealer = undefined;
    this.AdjacentDrawn = undefined;
    this.AdjacentTrueTile = undefined;
    return false;
}
phPlayerHealer.prototype.draw = function () {
    if (this.X >= 0) {
        rSetDrawColor(...this.Color);
        rrFill(this.X, this.Y);
        rSetDrawColor(0, 0, 0, 200);
        rrOutline(this.X, this.Y);
    }
}
function phParseTiles() { // expected: hID,#:tick
    let tiles = []
    let vals = document.getElementById(`healcmds`).value;

    // disabled for now
    //if (isCode(vals)) {
    //    vals = loParseCode(vals);
    //}
    //else {
    vals = vals.split("\n");
    //}
    for (let input of vals) {
        if (!input) continue;
        input = input.split(/,|:/);
        let waitUntil = (input.length === 3) ? input[2] : 0;
        if (input[0][0] === "h") {
            let numFood = parseInt(input[1]);
            while (numFood > 0) {
                tiles.push({
                    healerId: parseInt(input[0].substring(1)),
                    useFood: true,
                    WaitUntil: parseInt(waitUntil),
                });
                numFood--;
            }
        }
        else {
            tiles.push({
                X: parseInt(input[0]),
                Y: parseInt(input[1]),
                WaitUntil: parseInt(waitUntil),
            });
        }
    }
    for (let i = 1; i < tiles.length; i++) {
        if (tiles[i].WaitUntil < tiles[i - 1].WaitUntil) {
            tiles[i].WaitUntil = tiles[i - 1].WaitUntil;
        }
    }
    return tiles
}
function phFindBestAdjacentTile(x1, y1, targetX, targetY) {
    // prioritize east > west > north > south
    let validDirectionsFromTarget = [
        { "direction": "east", "tile": [targetX + 1, targetY], "check": mCanMoveWest },
        { "direction": "west", "tile": [targetX - 1, targetY], "check": mCanMoveEast },
        { "direction": "north", "tile": [targetX, targetY + 1], "check": mCanMoveSouth },
        { "direction": "south", "tile": [targetX, targetY - 1], "check": mCanMoveNorth },
    ]
    for (let direction of validDirectionsFromTarget) {
        if (direction.check(...direction["tile"]) && mCanMoveToTile(...direction["tile"])) {
            direction.IsValid = true;
            direction.Distance = tileDistance(x1, y1, ...direction["tile"]);
        }
        else {
            direction.IsValid = false;
        }
    }
    validDirectionsFromTarget = validDirectionsFromTarget.filter(i => i.IsValid);
    let bestTile = validDirectionsFromTarget.reduce(function (prev, curr) {
        return prev.Distance <= curr.Distance ? prev : curr;
    });
    return bestTile["tile"];
}
//}