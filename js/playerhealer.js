/*
TODO set up w/ cmdTeammate, display healer id on healer
*/

//{ PlayerHealer - ph
//baHEALER_HEALTH[sim.WaveSelect.value];
function phPlayerHealer(x, y, color, role = cmdROLE_NAMES[0]) {
    this.X = x;
    this.Y = y;
    this.DestinationX;
    this.DestinationY;
    this.PathQueuePos = 0;
    this.PathQueueX = [];
    this.PathQueueY = [];
    this.ShortestDistances = [];
    this.WayPoints = [];
    this.ArriveDelay = false;
    this.Role = role; // must be unique
    this.Color = color;
    this.Tiles = phParseTiles();
    this.TileIdx = 0;
    this.CurrentDst = {
        X: x,
        Y: y,
        WaitUntil: 0
    };
}
phPlayerHealer.prototype.tick = function () {
    // FIXME
    // apply poison if adjacent
    if (this.CurrentDst?.healerId) {
        let tile = phFindBestAdjacentTile(this.X, this.Y, this.CurrentDst.X, this.CurrentDst.Y);
        if (this.X == tile[0] && this.Y == tile[1] && this.CurrentDst.numFood > 0) {
            console.log("Using a food")
            --this.CurrentDst.numFood;
        }
    }
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
phPlayerHealer.prototype.pathfind = function () {
    let arrived = (this.CurrentDst?.X === this.X && this.CurrentDst?.Y === this.Y);
    if (ba.TickCounter <= 1) {
        return;
    }
    // target healer hasn't spawned yet
    if (this.CurrentDst?.healerId && !this.CurrentDst?.X) {
        this.findTarget();
    }
    if (!arrived && this.CurrentDst?.healerId && this.CurrentDst?.X) {
        if (ba.TickCounter <= this.CurrentDst?.WaitUntil) {
            return;
        }
        plPathfind(this, this.CurrentDst.X, this.CurrentDst.Y);
        this.findTarget(); // player moves based on previous tile
    }
    // npc healer has been reached
    if (arrived && this.CurrentDst?.healerId) {
        this.ArriveDelay = true;
    }
    // fetch new tile if arrived or no current tile
    if ((!this.CurrentDst || arrived) && this.TileIdx < this.Tiles.length) {
        this.CurrentDst = this.Tiles[this.TileIdx++];
    }
    if (this.CurrentDst && (arrived || this.CurrentDst?.WaitUntil !== 0)) {
        plPathfind(this, this.CurrentDst.X, this.CurrentDst.Y);
    }

}
phPlayerHealer.prototype.findTarget = function () {
    for (let healer of ba.Healers) {
        if (this.CurrentDst?.healerId === healer.id) {
            let targetTile = phFindBestAdjacentTile(this.X, this.Y, healer.x, healer.y)
            this.CurrentDst.X = targetTile[0];
            this.CurrentDst.Y = targetTile[1];
            return true;
        }
    }
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