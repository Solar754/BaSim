/*
* Process player healer actions
*/

const DEBUG = false;

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
    this.Role = role; // must be unique
    this.hasHealerTargeting = false;
    this.runningComplex = false;
    this.Color = color;
    this.Tiles = phParseTiles(role);
    this.TileIdx = 0;
    this.CurrentDst = {
        X: undefined,
        Y: undefined,
        healerId: undefined,
        Healer: undefined,
        WaitUntil: 0,
    };
    this.PrevTile = {
        X: undefined,
        Y: undefined,
    };
}
phPlayerHealer.prototype.peek = function () {
    return this.Tiles[this.TileIdx];
}
phPlayerHealer.prototype.tick = function () {
    this.PrevTile = {
        X: this.X,
        Y: this.Y
    };

    if (this.ArriveDelay)
        this.ArriveDelay = false;

    if (this.PathQueuePos > 0) {
        this.X = this.PathQueueX[--this.PathQueuePos];
        this.Y = this.PathQueueY[this.PathQueuePos];
        if (this.PathQueuePos > 0) {
            this.X = this.PathQueueX[--this.PathQueuePos];
            this.Y = this.PathQueueY[this.PathQueuePos];
        }
    }

    // sim quirk with manually pathing to tiles
    if (this.arrived() && !this.CurrentDst?.healerId) {
        if (this.peek()?.healerId)
            this.pathfind();
    }
}
phPlayerHealer.prototype.pathfind = function () {
    if (ba.TickCounter <= 1) {
        this.CurrentDst = { X: this.X, Y: this.Y };
        return;
    }

    if (this.tryFood() && this.CurrentDst.useFood) {
        console.log("Healer", this.CurrentDst.Healer.id, "psned", tickToSecond(ba.TickCounter));
        ba.Healers.filter(h => h.id == this.CurrentDst.Healer?.id)[0].applyPoisonDmg(true);
        this.CurrentDst.useFood = false;
        this.ArriveDelay = true;
    }

    this.skipDeadInQueue();

    if (this.arrived() && this.TileIdx < this.Tiles.length) {
        // don't queue up next command until tick before
        if (ba.TickCounter < this.peek()?.WaitUntil)
            return;
        this.CurrentDst = this.Tiles[this.TileIdx++];
        this.skipDeadInQueue();
    }
    else if (this.arrived() && this.TileIdx >= this.Tiles.length) 
        return; // do nothing until more tile cmds given

    if (this.CurrentDst?.healerId)
        this.findHealer();

    if (ba.TickCounter <= this.CurrentDst?.WaitUntil)
        return;
    else if (this.CurrentDst.Healer && !this.CurrentDst.Healer?.drawnX)
        return; // hasn't been drawn
    else if (this.ArriveDelay)
        return;
    plPathfind(this, this.CurrentDst.X, this.CurrentDst.Y);
}
phPlayerHealer.prototype.arrived = function () {
    let arrived = (this.CurrentDst?.X === this.X && this.CurrentDst?.Y === this.Y);
    if (arrived && this.CurrentDst?.useFood === undefined) 
        return true;
    else if (this.CurrentDst?.useFood === false)
        return true;
    return false;
}
phPlayerHealer.prototype.findHealer = function () {
    let targetHealer = ba.Healers.filter(h => h.id == this.CurrentDst?.healerId);
    if (targetHealer.length > 0) {
        this.CurrentDst.Healer = targetHealer[0];
        [this.CurrentDst.X, this.CurrentDst.Y] = this.findBestAdjacentTile(
            this.CurrentDst.Healer.x, this.CurrentDst.Healer.y
        );
    }
}
phPlayerHealer.prototype.tryFood = function () {
    if (!this.CurrentDst.Healer?.hp)
        return false;

    let healer = this.CurrentDst.Healer;
    function mapPerms(plX, plY, targetX, targetY) {
        let tileIsAdj = (
            (plX === targetX + 1 && plY === targetY) // e
            || (plX === targetX - 1 && plY === targetY) // w
            || (plX === targetX && plY === targetY + 1) // n
            || (plX=== targetX && plY === targetY - 1) // s
        );
        let tileIsIntercardinalAdj = (
            (plX + 1 === targetX && plY + 1 === targetY) // ne
            || (plX+ 1 === targetX && plY - 1 === targetY) // se
            || (plX - 1 === targetX && plY - 1 === targetY) // sw
            || (plX - 1 === targetX && plY + 1 === targetY) // nw
        );
        return [tileIsAdj, tileIsIntercardinalAdj];
    }
    // player drawn tile
    [drawn_drawnTileIsAdj, drawn_drawnTileIsIntercardinalAdj] = mapPerms(this.PrevTile.X, this.PrevTile.Y, healer.drawnX, healer.drawnY);
    [drawn_trueTileIsAdj, drawn_trueTileIsIntercardinalAdj] = mapPerms(this.PrevTile.X, this.PrevTile.Y, healer.x, healer.y);

    // player true tile
    [true_drawnTileIsAdj, true_drawnTileIsIntercardinalAdj] = mapPerms(this.X, this.Y, healer.drawnX, healer.drawnY);
    [true_trueTileIsAdj, true_trueTileIsIntercardinalAdj] = mapPerms(this.X, this.Y, healer.x, healer.y);

    if (DEBUG)
        console.log(`
            drawn_drawnTileIsAdj\t${drawn_drawnTileIsAdj}\n
            drawn_trueTileIsAdj\t${drawn_trueTileIsAdj}\n
            drawn_drawnTileIsIntercardinalAdj\t${drawn_drawnTileIsIntercardinalAdj}\n
            drawn_trueTileIsIntercardinalAdj\t${drawn_trueTileIsIntercardinalAdj}\n
            true_drawnTileIsAdj\t${true_drawnTileIsAdj}\n
            true_trueTileIsAdj\t${true_trueTileIsAdj}\n
            true_drawnTileIsIntercardinalAdj\t${true_drawnTileIsIntercardinalAdj}\n
            true_trueTileIsIntercardinalAdj\t${true_trueTileIsIntercardinalAdj}\n
        `);

    // 'exceptions'
    if (
        ( // trapping healer against wall on spawn
            !drawn_trueTileIsAdj &&
            !drawn_drawnTileIsIntercardinalAdj &&
            !true_trueTileIsAdj	&&
            !true_drawnTileIsIntercardinalAdj &&
            drawn_drawnTileIsAdj &&
            drawn_trueTileIsIntercardinalAdj &&
            true_drawnTileIsAdj	&&
            true_trueTileIsIntercardinalAdj
        )
        || ( // healer bouncing when food used
            !drawn_trueTileIsAdj &&
            !drawn_drawnTileIsIntercardinalAdj &&
            !drawn_trueTileIsIntercardinalAdj &&
            !true_trueTileIsAdj &&
            !true_drawnTileIsIntercardinalAdj &&
            !true_trueTileIsIntercardinalAdj &&
            drawn_drawnTileIsAdj &&
            true_drawnTileIsAdj
        )
    ) {
        return false;
    }
    return (
        true_drawnTileIsAdj
        || (drawn_trueTileIsAdj && true_trueTileIsAdj)
        || (
            drawn_trueTileIsAdj && 
            drawn_drawnTileIsIntercardinalAdj && 
            true_trueTileIsAdj && 
            true_drawnTileIsIntercardinalAdj
        )
        // FIXME this is only for the second TEST 1 scenario
        // causes issues elsewhere
        /*|| (
            !drawn_drawnTileIsAdj &&
            !drawn_trueTileIsAdj &&
            !drawn_drawnTileIsIntercardinalAdj &&
            !drawn_trueTileIsIntercardinalAdj &&
            !true_drawnTileIsAdj &&
            !true_trueTileIsIntercardinalAdj &&
            true_trueTileIsAdj &&
            true_drawnTileIsIntercardinalAdj
        )*/
    );
}
phPlayerHealer.prototype.skipDeadInQueue = function () {
    if (!this.CurrentDst.healerId) {
        return;
    }
    let isDead = (ba.HealersToRemove.indexOf(this.CurrentDst.healerId) != -1);
    let maybeDead = ba.Healers.filter(h => h.id == this.CurrentDst.healerId)[0];
    if (isDead || maybeDead?.hp === 0) {
        while (this.TileIdx < this.Tiles.length) {
            let tmpWaitUntil = this.CurrentDst.WaitUntil;
            this.CurrentDst = this.Tiles[this.TileIdx++];
            if (this.CurrentDst.WaitUntil < tmpWaitUntil) {
                this.CurrentDst.WaitUntil = tmpWaitUntil;
            }

            if (!this.CurrentDst.healerId) return;
            isDead = (ba.HealersToRemove.indexOf(this.CurrentDst.healerId) != -1);
            maybeDead = ba.Healers.filter(h => h.id == this.CurrentDst.healerId)[0];
            if ((!isDead && !maybeDead) || maybeDead?.hp > 0) return;
        }
        this.CurrentDst = { X: this.X, Y: this.Y };
    }
}
phPlayerHealer.prototype.findBestAdjacentTile = function(targetX, targetY) {
    let validDirectionsFromTarget = [
        { "direction": "west", "tile": [targetX - 1, targetY], "check": mCanMoveEast },
        { "direction": "east", "tile": [targetX + 1, targetY], "check": mCanMoveWest },
        { "direction": "south", "tile": [targetX, targetY - 1], "check": mCanMoveNorth },
        { "direction": "north", "tile": [targetX, targetY + 1], "check": mCanMoveSouth }
    ];

    let minDistance = Infinity;
    for (let direction of validDirectionsFromTarget) {
        if (direction.check(...direction["tile"]) && mCanMoveToTile(...direction["tile"])) {
            direction.IsValid = true;
            direction.Distance = tileDistance(this.X, this.Y, ...direction["tile"]);
            if (direction?.Distance < minDistance)
                minDistance = direction.Distance;
        }
        else {
            direction.IsValid = false;
        }
    }
    validDirectionsFromTarget = validDirectionsFromTarget.filter(i => i.IsValid && i?.Distance <= minDistance);

    // test the tiles to determine priority
    let tmpl = structuredClone(this)
    for (let validDirection of validDirectionsFromTarget) {
        plPathfind(tmpl, ...validDirection.tile);
        let idx = tmpl.PathQueuePos - 1;

        let cardinalStr = "";
        if (tmpl.PathQueueY[idx] < this.Y)
            cardinalStr += "s";
        else if (tmpl.PathQueueY[idx] > this.Y)
            cardinalStr += "n";
        if (tmpl.PathQueueX[idx] < this.X)
            cardinalStr += "w";
        else if (tmpl.PathQueueX[idx] > this.X)
            cardinalStr += "e";
        validDirection.weight = plHealerMovementPriority[cardinalStr];
    }

    // pick best
    let bestTile = validDirectionsFromTarget.sort((lh, rh) => {
        return lh.weight - rh.weight;
    });
    return bestTile[0]?.tile || [this.X, this.Y];
}
phPlayerHealer.prototype.draw = function () {
    if (this.X >= 0) {
        addColor(this.X, this.Y, rrFill, this.Color);
        addColor(this.X, this.Y, rrOutline, BLACK_CLR);
    }
}
function phParseTiles(role) { // expected: hID,#:tick
    let tiles = []
    let currentTeammate = cmd.Team.filter(p => p.Role == role);
    let vals = document.getElementById(role + `cmds`).value;

    if (isCode(vals)) {
        if (cmd.Team.filter(p => p.Role == "heal")[0])
            return loParseCode(vals);
        vals = loParseCode(vals);
    }
    else {
        vals = vals.split("\n");
    }
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
            if (currentTeammate.length > 0)
                currentTeammate[0].hasHealerTargeting = true;
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
//}