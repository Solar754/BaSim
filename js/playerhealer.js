/*
TODO set up w/ cmdTeammate, display healer id on healer

2x stock + run-up + two on the 6
35,7
45,25:8 -- or 7
h1,1
h1,1
h2,1
*/

//{ PlayerHealer - ph
//baHEALER_HEALTH[sim.WaveSelect.value];
function phPlayerHealer(x, y, color, role = cmdROLE_NAMES[0]) {
    this.X = x;
    this.Y = y;
    this.PathQueuePos = 0;
    this.PathQueueX = [];
    this.PathQueueY = [];
    this.ShortestDistances = [];
    this.WayPoints = [];
    this.ArriveDelay = false;
    this.AdjacentTargetTile = undefined;
    this.AdjacentPrevious = undefined;
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
phPlayerHealer.prototype.movedPreviousTick = function () {
    return (this.X !== this.PrevTile.X || this.Y !== this.PrevTile.Y);
}
phPlayerHealer.prototype.pathfind = function () {
    if (ba.TickCounter <= 1) {
        return;
    }
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
    }
    if (ba.TickCounter <= this.CurrentDst?.WaitUntil) {
        return;
    }
    plPathfind(this, this.CurrentDst.X, this.CurrentDst.Y);
}
phPlayerHealer.prototype.pathfindHealer = function () {
    // check if healer exists/update to current tile
    this.findTarget();

    // if healer was found and not tick it spawns
    if (this.AdjacentTargetTile && this.AdjacentPrevious?.X) {
        this.CurrentDst.X = this.AdjacentTargetTile.X;
        this.CurrentDst.Y = this.AdjacentTargetTile.Y;
    }

    // wait if needed
    if (this.CurrentDst.X && ba.TickCounter > this.CurrentDst?.WaitUntil) {
        plPathfind(this, this.CurrentDst.X, this.CurrentDst.Y);
    }

    // if adjacent to healer or previous tile then move on to next queued tile
    let arrived = (this.X === this.AdjacentTargetTile?.X && this.Y === this.AdjacentTargetTile?.Y);
    arrived ||= (this.X === this.AdjacentPrevious?.X && this.Y === this.AdjacentPrevious?.Y);
    if (arrived) {
        console.log(ba.TickCounter + ": Used a food on healer " + this.CurrentDst.healerId);

        this.CurrentDst = this.Tiles[this.TileIdx] || { X: this.X, Y: this.Y };
        if (this.TileIdx < this.Tiles.length) {
            this.TileIdx++;
        }
        if (this.movedPreviousTick()) {
            this.ArriveDelay = true;
        }
    }
}
phPlayerHealer.prototype.findTarget = function () {
    for (let healer of ba.Healers) {
        if (this.CurrentDst?.healerId === healer.id) {
            let adjPrevious = phFindBestAdjacentTile(this.X, this.Y, healer.prevX, healer.prevY);
            let targetTile = phFindBestAdjacentTile(this.X, this.Y, healer.x, healer.y);
            this.AdjacentPrevious = { X: adjPrevious[0], Y: adjPrevious[1] };
            this.AdjacentTargetTile = { X: targetTile[0], Y: targetTile[1] };
            return true;
        }
    }
    this.AdjacentPrevious = undefined;
    this.AdjacentTargetTile = undefined;
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
    vals = vals.split("\n");
    for (let input of vals) {
        if (!input) continue;
        input = input.split(/,|:/);
        let waitUntil = (input.length === 3) ? input[2] : 0;
        if (input[0][0] === "h") {
            tiles.push({
                healerId: parseInt(input[0].substring(1)),
                numFood: parseInt(input[1]),
                WaitUntil: parseInt(waitUntil),
            });
        }
        else {
            tiles.push({
                X: parseInt(input[0]),
                Y: parseInt(input[1]),
                WaitUntil: parseInt(waitUntil),
            });
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