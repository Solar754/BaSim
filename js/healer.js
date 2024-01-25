//{ Healer - he
function heHealer(x = -1, y = -1, id = -1) {
    this.spawnX = x;
    this.spawnY = y;
    this.x = x;
    this.y = y;
    this.destinationX = x; // calculated before movement
    this.destinationY = y;
    this.targetX = x; // calculated during every healer interaction; 2 interactions per tick
    this.targetY = y;
    this.runnerTarget; // stores runner object
    this.isTargetingPlayer = false;
    this.isTargetingRunner = false;
    this.isTargetingCollector = false;
    this.lastTarget; // either 'player' or 'runner'
    this.justSpawned = true; // special state when healer spawns where it is idle but instead of moving, stays still
    this.sprayTimer = 0; // used to time when a healer should be aggroing runners or players
    this.id = id;
}
heHealer.prototype.tick = function () {

    // TODO: create inheritance structure for players

    // healer stands still when it spawns, until player comes into LOS
    // If multiple players in LOS, randomly choose (rand=0 for def, 1 for col)
    if (this.justSpawned === true) {
        if (mHasLineOfSight(pl.X, pl.Y, this.x, this.y, 15) && mHasLineOfSight(ba.CollectorX, ba.CollectorY, this.x, this.y, 15)) {
            let rand = Math.floor(Math.random() * 2);
            if (rand === 0) {
                console.log(ba.TickCounter + ": healer " + this.id + " chose defender");
                this.destinationX = findTargetTile(this.x, this.y, pl.X, pl.Y)[0];
                this.destinationY = findTargetTile(this.x, this.y, pl.X, pl.Y)[1];
                this.isTargetingPlayer = true;
            }
            else {
                console.log(ba.TickCounter + ": healer " + this.id + " chose collector");
                this.destinationX = findTargetTile(this.x, this.y, ba.CollectorX, ba.CollectorY)[0];
                this.destinationY = findTargetTile(this.x, this.y, ba.CollectorX, ba.CollectorY)[1];
                this.isTargetingCollector = true;
            }
            this.justSpawned = false;
        }
        else if (mHasLineOfSight(pl.X, pl.Y, this.x, this.y, 15)) {
            this.destinationX = findTargetTile(this.x, this.y, pl.X, pl.Y)[0];
            this.destinationY = findTargetTile(this.x, this.y, pl.X, pl.Y)[1];
            this.isTargetingPlayer = true;
            this.justSpawned = false;
        }
        else if (mHasLineOfSight(ba.CollectorX, ba.CollectorY, this.x, this.y, 15)) {
            this.destinationX = findTargetTile(this.x, this.y, ba.CollectorX, ba.CollectorY)[0];
            this.destinationY = findTargetTile(this.x, this.y, ba.CollectorX, ba.CollectorY)[1];
            this.isTargetingCollector = true;
            this.justSpawned = false;
        }
    }

    // idle wander state, 1/8 chance per tick to find new destination, unless found new target
    if (!this.isTargetingPlayer && !this.isTargetingCollector && !this.isTargetingRunner && !this.justSpawned) {

        this.sprayTimer++;

        // try to target runner every 3 ticks only after 4 ticks of pause
        if (this.lastTarget === 'player' && ((this.sprayTimer + 1) % 3) === 0 && this.sprayTimer > 4) {

            // only consider runners in LOS; choose a random runner among those in LOS
            let inSightRunners = [];
            for (let i = 0; i < ba.Runners.length; ++i) {
                if (mHasLineOfSight(this.x, this.y, ba.Runners[i].x, ba.Runners[i].y, 5) && !(ba.Runners[i].isDying)) {
                    inSightRunners.push(ba.Runners[i]);
                }
            }
            if (inSightRunners.length > 0) {
                let rand = Math.floor(Math.random() * inSightRunners.length);
                this.runnerTarget = inSightRunners[rand];
                this.isTargetingRunner = true;
                this.tryTarget('runner');
            }

            // if no runners in LOS, do random movement
            else {
                let rnd = Math.floor(Math.random() * 8);
                if (rnd === 0) {
                    console.log(ba.TickCounter + ": healer " + this.id + " did random movement");
                    const wanderRange = 60;
                    let rndX = Math.floor(Math.random() * (2 * wanderRange + 1));
                    this.destinationX = this.spawnX - wanderRange + rndX;
                    let rndY = Math.floor(Math.random() * (2 * wanderRange + 1));
                    this.destinationY = this.spawnY - wanderRange + rndY;
                }
                this.doMovement();
            }
        }

        // try to target player every tick only after 2 ticks of pause
        else if (this.lastTarget === 'runner' && this.sprayTimer > 2) {
            if (mHasLineOfSight(pl.X, pl.Y, this.x, this.y, 15) && mHasLineOfSight(ba.CollectorX, ba.CollectorY, this.x, this.y, 15)) {
                let rand = Math.floor(Math.random() * 2);
                if (rand === 0) {
                    console.log(ba.TickCounter + ": healer " + this.id + " chose defender");
                    this.isTargetingPlayer = true;
                    this.tryTarget('player');
                }
                else {
                    console.log(ba.TickCounter + ": healer " + this.id + " chose collector");
                    this.isTargetingCollector = true;
                    this.tryTarget('collector');
                }
            }
            else if (mHasLineOfSight(pl.X, pl.Y, this.x, this.y, 15)) {
                this.isTargetingPlayer = true;
                this.tryTarget('player');
            }
            else if (mHasLineOfSight(ba.CollectorX, ba.CollectorY, this.x, this.y, 15)) {
                this.isTargetingCollector = true;
                this.tryTarget('collector');
            }
            // if nobody in LOS, do random movement
            else {
                let rnd = Math.floor(Math.random() * 8);
                if (rnd === 0) {
                    console.log(ba.TickCounter + ": healer " + this.id + " did random movement");
                    const wanderRange = 60;
                    let rndX = Math.floor(Math.random() * (2 * wanderRange + 1));
                    this.destinationX = this.spawnX - wanderRange + rndX;
                    let rndY = Math.floor(Math.random() * (2 * wanderRange + 1));
                    this.destinationY = this.spawnY - wanderRange + rndY;
                }
                this.doMovement();
            }
        }

        // If healer isn't supposed to be targeting anything this tick, do random movement
        else {
            let rnd = Math.floor(Math.random() * 8);
            if (rnd === 0) {
                console.log(ba.TickCounter + ": healer " + this.id + " did random movement");
                const wanderRange = 60;
                let rndX = Math.floor(Math.random() * (2 * wanderRange + 1));
                this.destinationX = this.spawnX - wanderRange + rndX;
                let rndY = Math.floor(Math.random() * (2 * wanderRange + 1));
                this.destinationY = this.spawnY - wanderRange + rndY;
            }
            this.doMovement();
        }
    }

    // move toward player when targeting player
    else if (this.isTargetingPlayer) {
        this.tryTarget('player');
    }

    // move toward coll when targeting coll
    else if (this.isTargetingCollector) {
        this.tryTarget('collector');
    }

    // move toward random runner in range found earlier when targeting runner
    else if (this.isTargetingRunner) {
        if (this.runnerTarget.despawnCountdown === 0) {
            console.log(ba.TickCounter + ": retargeting");
            this.isTargetingRunner = false;
            this.lastTarget = 'runner';
            this.sprayTimer = 0;

            if (mHasLineOfSight(pl.X, pl.Y, this.x, this.y, 15) && mHasLineOfSight(ba.CollectorX, ba.CollectorY, this.x, this.y, 15)) {
                let rand = Math.floor(Math.random() * 2);
                if (rand === 0) {
                    console.log(ba.TickCounter + ": healer " + this.id + " chose defender");
                    this.isTargetingPlayer = true;
                    this.tryTarget('player');
                }
                else {
                    console.log(ba.TickCounter + ": healer " + this.id + " chose collector");
                    this.isTargetingCollector = true;
                    this.tryTarget('collector');
                }
            }
            else if (mHasLineOfSight(pl.X, pl.Y, this.x, this.y, 15)) {
                this.isTargetingPlayer = true;
                this.tryTarget('player');
            }
            else if (mHasLineOfSight(ba.CollectorX, ba.CollectorY, this.x, this.y, 15)) {
                this.isTargetingCollector = true;
                this.tryTarget('collector');
            }
            // if nobody in LOS, do random movement
            else {
                let rnd = Math.floor(Math.random() * 8);
                if (rnd === 0) {
                    console.log(ba.TickCounter + ": healer " + this.id + " did random movement");
                    const wanderRange = 60;
                    let rndX = Math.floor(Math.random() * (2 * wanderRange + 1));
                    this.destinationX = this.spawnX - wanderRange + rndX;
                    let rndY = Math.floor(Math.random() * (2 * wanderRange + 1));
                    this.destinationY = this.spawnY - wanderRange + rndY;
                }
                this.doMovement();
            }
        }
        else {
            this.tryTarget('runner');
        }
    }
}
heHealer.prototype.tryTarget = function (type) {
    // healer interacts with an npc twice per tick. Results in residual pathing
    //
    // every tick:
    //      healer attempts to interact (checks if its on its target tile aka closest adjacent tile to target)
    //      if interaction fails: (not in melee distance)
    //          get new destination
    //          move toward destination
    //          healer attempts to interact

    if (type === 'runner') {
        this.targetX = findTargetTile(this.x, this.y, this.runnerTarget.x, this.runnerTarget.y)[0];
        this.targetY = findTargetTile(this.x, this.y, this.runnerTarget.x, this.runnerTarget.y)[1];
        if (tileDistance(this.x, this.y, this.targetX, this.targetY) === 0 && mHasLineOfSight(this.runnerTarget.x, this.runnerTarget.y, this.x, this.y, 5)) {
            this.isTargetingRunner = false;
            this.lastTarget = 'runner';
            this.sprayTimer = 0;
        }
        else {
            this.destinationX = findTargetTile(this.x, this.y, this.runnerTarget.x, this.runnerTarget.y)[0];
            this.destinationY = findTargetTile(this.x, this.y, this.runnerTarget.x, this.runnerTarget.y)[1];

            this.doMovement();

            this.targetX = findTargetTile(this.x, this.y, this.runnerTarget.x, this.runnerTarget.y)[0];
            this.targetY = findTargetTile(this.x, this.y, this.runnerTarget.x, this.runnerTarget.y)[1];
            if (tileDistance(this.x, this.y, this.targetX, this.targetY) === 0 && mHasLineOfSight(this.runnerTarget.x, this.runnerTarget.y, this.x, this.y, 5)) {
                this.isTargetingRunner = false;
                this.lastTarget = 'runner';
                this.sprayTimer = 0;
            }
        }
    }
    else if (type === 'player') {
        this.targetX = findTargetTile(this.x, this.y, pl.X, pl.Y)[0];
        this.targetY = findTargetTile(this.x, this.y, pl.X, pl.Y)[1];
        if (tileDistance(this.x, this.y, this.targetX, this.targetY) === 0 && mHasLineOfSight(pl.X, pl.Y, this.x, this.y, 15)) {
            this.isTargetingPlayer = false;
            this.lastTarget = 'player';
            this.sprayTimer = 0;
        }
        else {
            this.destinationX = findTargetTile(this.x, this.y, pl.X, pl.Y)[0];
            this.destinationY = findTargetTile(this.x, this.y, pl.X, pl.Y)[1];

            this.doMovement();

            this.targetX = findTargetTile(this.x, this.y, pl.X, pl.Y)[0];
            this.targetY = findTargetTile(this.x, this.y, pl.X, pl.Y)[1];
            if (tileDistance(this.x, this.y, this.targetX, this.targetY) === 0 && mHasLineOfSight(pl.X, pl.Y, this.x, this.y, 15)) {
                this.isTargetingPlayer = false;
                this.lastTarget = 'player';
                this.sprayTimer = 0;
            }
        }
    }
    else if (type === 'collector') {
        this.targetX = findTargetTile(this.x, this.y, ba.CollectorX, ba.CollectorY)[0];
        this.targetY = findTargetTile(this.x, this.y, ba.CollectorX, ba.CollectorY)[1];
        if (tileDistance(this.x, this.y, this.targetX, this.targetY) === 0 && mHasLineOfSight(ba.CollectorX, ba.CollectorY, this.x, this.y, 15)) {
            this.isTargetingCollector = false;
            this.lastTarget = 'player';
            this.sprayTimer = 0;
        }
        else {
            this.destinationX = findTargetTile(this.x, this.y, ba.CollectorX, ba.CollectorY)[0];
            this.destinationY = findTargetTile(this.x, this.y, ba.CollectorX, ba.CollectorY)[1];

            this.doMovement();

            this.targetX = findTargetTile(this.x, this.y, ba.CollectorX, ba.CollectorY)[0];
            this.targetY = findTargetTile(this.x, this.y, ba.CollectorX, ba.CollectorY)[1];
            if (tileDistance(this.x, this.y, this.targetX, this.targetY) === 0 && mHasLineOfSight(ba.CollectorX, ba.CollectorY, this.x, this.y, 15)) {
                this.isTargetingCollector = false;
                this.lastTarget = 'player';
                this.sprayTimer = 0;
            }
        }
    }
}
// Moves healer toward its destination. Prioritizes east/west over north/south.
// Horizontal and vertical movement can occur in the same tick.
heHealer.prototype.doMovement = function () {
    let startX = this.x;
    if (this.destinationX > startX) {
        if (!baTileBlocksPenance(startX + 1, this.y) && mCanMoveEast(startX, this.y)) {
            ++this.x;
        }
    } else if (this.destinationX < startX && !baTileBlocksPenance(startX - 1, this.y) && mCanMoveWest(startX, this.y)) {
        --this.x;
    }
    if (this.destinationY > this.y) {
        if (!baTileBlocksPenance(startX, this.y + 1) && !baTileBlocksPenance(this.x, this.y + 1) && mCanMoveNorth(startX, this.y) && mCanMoveNorth(this.x, this.y)) {
            ++this.y;
        }
    } else if (this.destinationY < this.y && !baTileBlocksPenance(startX, this.y - 1) && !baTileBlocksPenance(this.x, this.y - 1) && mCanMoveSouth(startX, this.y) && mCanMoveSouth(this.x, this.y)) {
        --this.y;
    }
}

// jumpDistance = tileDistance = Max(abs(Bx - Ax),abs(By - Ay));
function tileDistance(x1, y1, x2, y2) {
    let tileDistance = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    return tileDistance;
}

// Healer targets closest adjacent tile to target, not target tile itself. The target tile is the one
// whose distance is smallest, or if the distance is equal, in n/s -> e/w order
function findTargetTile(x1, y1, x2, y2) { // (x1,y1) for healer, (x2,y2) for target
    let northOfTarget = tileDistance(x1, y1, x2, y2 + 1);
    let southOfTarget = tileDistance(x1, y1, x2, y2 - 1);
    let eastOfTarget = tileDistance(x1, y1, x2 + 1, y2);
    let westOfTarget = tileDistance(x1, y1, x2 - 1, y2);

    let minDistance = Math.min(northOfTarget, southOfTarget, eastOfTarget, westOfTarget);
    if (minDistance === northOfTarget) {
        //console.log("north");
        return [x2, y2 + 1];
    }
    if (minDistance === southOfTarget) {
        //console.log("south");
        return [x2, y2 - 1];
    }
    if (minDistance === eastOfTarget) {
        //console.log("east");
        return [x2 + 1, y2];
    }
    if (minDistance === westOfTarget) {
        //console.log("west");
        return [x2 - 1, y2];
    }
}
//}
