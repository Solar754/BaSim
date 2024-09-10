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
    this.drawnX = undefined;
    this.drawnY = undefined;
    this.playerTarget; // generic player object
    this.runnerTarget; // stores runner object
    this.isTargetingPlayer = false;
    this.isTargetingRunner = false;
    this.isTargetingCollector = false;
    this.lastTarget; // either 'player' or 'runner'
    this.justSpawned = true; // special state when healer spawns where it is idle but instead of moving, stays still
    this.sprayTimer = 0; // used to time when a healer should be aggroing runners or players
    this.id = id;

    // psn stuff
    this.hp = baHEALER_HEALTH[sim.WaveSelect.value];
    this.spawnTick = ba.TickCounter;
    this.lastPsnTick = ba.TickCounter;
    this.isPsned = false;
    this.naturalPsn = 4;
    this.psnTickCount = 0;
    this.psnHitsplat = false;

    // cannon stuff
    this.eggQueue = [];
    this.greenCounter = -1;
    this.blueCounter = -1;
    this.zombieState = false; // 0 hp but still alive
    this.regenTimer = -1;

    // dying stuff
    this.isDying = false;
    this.despawnCountdown = 3;
}
heHealer.prototype.foundPlayerTarget = function () {
    let plTarget = undefined;
    let possibleTargets = [];
    let players = heCompilePlayerTargets();
    players.forEach((player) => {
        if (mHasLineOfSight(player.X, player.Y, this.x, this.y, 15)) {
            possibleTargets.push(player);
        }
    });
    if (possibleTargets.length > 0) {
        plTarget = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
    }
    this.playerTarget = plTarget;
    return plTarget;
}
heHealer.prototype.tick = function () {
    this.psnHitsplat = false;
    if (this.blueCounter >= 0) {
        --this.blueCounter;
        return;
    }

    if (++this.regenTimer % 100 == 0) {
        this.hp = Math.min(this.hp + 1, baHEALER_HEALTH[sim.WaveSelect.value]);
        this.zombieState = false;
    }

    this.applyPoisonDmg(false);
    this.processDeath();
    this.processEggQueue();

    this.drawnX = this.x;
    this.drawnY = this.y;

    if (this.isDying) {
        return;
    }
    else if (this.zombieState) {
        this.doMovement();
        return;
    }

    // healer stands still when it spawns, until player comes into LOS
    // if multiple players in LOS, randomly choose
    if (this.justSpawned && this.foundPlayerTarget()) {
        [this.destinationX, this.destinationY] = heFindTargetTile(this.x, this.y, this.playerTarget.X, this.playerTarget.Y);
        this.isTargetingPlayer = true;
        this.justSpawned = false;
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
                this.selectRandomTile();
                this.doMovement();
            }
        }
        // try to target player every tick only after 2 ticks of pause
        else if (this.lastTarget === 'runner' && this.sprayTimer > 2) {
            if (this.foundPlayerTarget()) {
                this.isTargetingPlayer = true;
                this.tryTarget('player');
            }
            // if nobody in LOS, do random movement
            else {
                this.selectRandomTile();
                this.doMovement();
            }
        }
        // If healer isn't supposed to be targeting anything this tick, do random movement
        else {
            this.selectRandomTile();
            this.doMovement();
        }
    }
    // move toward player when targeting player
    else if (this.isTargetingPlayer) {
        // update x,y for playerTarget
        let allPlayers = heCompilePlayerTargets();
        this.playerTarget = allPlayers.filter(player => player.Role === this.playerTarget.Role)[0];
        this.tryTarget('player');
    }
    // move toward random runner in range found earlier when targeting runner
    else if (this.isTargetingRunner) {
        if (this.runnerTarget.despawnCountdown === 0) {
            console.log(ba.TickCounter + ": retargeting");
            this.isTargetingRunner = false;
            this.lastTarget = 'runner';
            this.sprayTimer = 0;

            if (this.foundPlayerTarget()) {
                this.isTargetingPlayer = true;
                this.tryTarget('player');
            }
            // if nobody in LOS, do random movement
            else {
                this.selectRandomTile();
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
        [this.targetX, this.targetY] = heFindTargetTile(this.x, this.y, this.runnerTarget.x, this.runnerTarget.y);
        if (tileDistance(this.x, this.y, this.targetX, this.targetY) === 0 && mHasLineOfSight(this.runnerTarget.x, this.runnerTarget.y, this.x, this.y, 5)) {
            this.isTargetingRunner = false;
            this.lastTarget = 'runner';
            this.sprayTimer = 0;
        }
        else {
            [this.destinationX, this.destinationY] = heFindTargetTile(this.x, this.y, this.runnerTarget.x, this.runnerTarget.y);
            this.doMovement();

            [this.targetX, this.targetY] = heFindTargetTile(this.x, this.y, this.runnerTarget.x, this.runnerTarget.y);
            if (tileDistance(this.x, this.y, this.targetX, this.targetY) === 0 && mHasLineOfSight(this.runnerTarget.x, this.runnerTarget.y, this.x, this.y, 5)) {
                this.isTargetingRunner = false;
                this.lastTarget = 'runner';
                this.sprayTimer = 0;
            }
        }
    }
    else if (type === 'player') {
        [this.targetX, this.targetY] = heFindTargetTile(this.x, this.y, this.playerTarget.X, this.playerTarget.Y);
        if (tileDistance(this.x, this.y, this.targetX, this.targetY) === 0 && mHasLineOfSight(this.playerTarget.X, this.playerTarget.Y, this.x, this.y, 15)) {
            this.isTargetingPlayer = false;
            this.lastTarget = 'player';
            this.sprayTimer = 0;
        }
        else {
            [this.destinationX, this.destinationY] = heFindTargetTile(this.x, this.y, this.playerTarget.X, this.playerTarget.Y);

            this.doMovement();

            [this.targetX, this.targetY] = heFindTargetTile(this.x, this.y, this.playerTarget.X, this.playerTarget.Y);
            if (tileDistance(this.x, this.y, this.targetX, this.targetY) === 0 && mHasLineOfSight(this.playerTarget.X, this.playerTarget.Y, this.x, this.y, 15)) {
                this.isTargetingPlayer = false;
                this.lastTarget = 'player';
                this.sprayTimer = 0;
            }
        }
    }
}
heHealer.prototype.selectRandomTile = function () {
    // do not bounce on the same tick as player psn
    if (this.sprayTimer == 1 && this.lastTarget == 'player') {
        return;
    }
    const WANDER_RANGE = 60;
    let rnd = Math.floor(Math.random() * 8);
    if (rnd === 0) {
        let rndX = Math.floor(Math.random() * (2 * WANDER_RANGE + 1));
        this.destinationX = this.spawnX - WANDER_RANGE + rndX;
        let rndY = Math.floor(Math.random() * (2 * WANDER_RANGE + 1));
        this.destinationY = this.spawnY - WANDER_RANGE + rndY;
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
heHealer.prototype.applyPoisonDmg = function (food) {
    if (this.isDying || (food && this.zombieState)) {
        return;
    }

    if (this.greenCounter >= 0 && !food) { // every 30 ticks
        if (this.greenCounter % 30 == 0 && !this.zombieState) {
            this.hp -= GREEN_EGG;
            this.psnHitsplat = true;
        }
        --this.greenCounter;
    }

    let startTimer = (ba.TickCounter - this.spawnTick >= 5);
    if (food) {
        this.hp = Math.max(0, this.hp - baPSN_FOOD_DMG);
        this.naturalPsn = 4;
        this.psnTickCount = 0;
        if (!this.isPsned) {
            this.isPsned = true;
            if (startTimer) { // +5t after spawn
                this.spawnTick = ba.TickCounter;
            }
        }
        this.psnHitsplat = true;
    }
    else if (this.isPsned && startTimer) {
        if (ba.TickCounter - this.lastPsnTick >= 5) {
            if (!this.zombieState) {
                this.hp = Math.max(0, this.hp - this.naturalPsn);
                this.psnHitsplat = true;
            }
            this.lastPsnTick = ba.TickCounter;
            this.psnTickCount++;
        }
        if (this.psnTickCount == 5) {
            this.naturalPsn--;
            this.psnTickCount = 0;
        }
        if (this.naturalPsn <= 0) {
            this.isPsned = false;
        }
    }
}
heHealer.prototype.processEggQueue = function () {
    this.eggQueue = this.eggQueue.filter(e => e.stalled >= 0);
    for (let egg of this.eggQueue) {
        if (egg.stalled == 0) {
            console.log(tickToSecond(ba.TickCounter) + ": Egg effect started");
            if (egg.type == "r" && !this.zombieState) {
                this.hp -= RED_EGG;
            }
            else if (egg.type == "g" && !this.zombieState) {
                this.hp -= GREEN_EGG;
                this.greenCounter = 149;
                this.psnHitsplat = true;
            }
            else if (egg.type == "b") {
                this.blueCounter = 9;
                this.eggQueue = [];
                if (this.isDying) {
                    this.isDying = false;
                    this.zombieState = true;
                    [this.destinationX, this.destinationY] = (egg.cannon == 'w') ? cWEST_CANNON : cEAST_CANNON;
                    if (this.despawnCountdown == 1) { // death tick 2 = +.6 regen
                        --this.regenTimer;
                    }
                    this.despawnCountdown = 3;
                }
            }
        }
        --egg.stalled;
    }

    // overkill
    if (this.blueCounter == -1) {
        if (this.eggQueue.filter(e => { return (e.type == "r" && e.stalled == -1) }).length > 1 && this.hp <= 0) {
            this.processDeath();
        }
    }
    this.hp = Math.max(this.hp, 0);
}
heHealer.prototype.processDeath = function () {
    if (this.hp > 0 || this.zombieState) {
        return;
    }
    this.isDying = true;
    this.despawnCountdown--;
    if (this.despawnCountdown == 2) {
        ba.HealersAlive--;
        ba.HealersKilled++;
    }
    if (this.despawnCountdown == 0) {
        ba.HealersToRemove.push(this.id);
    }
}

function heCompilePlayerTargets() {
    let playerTargets = [];
    if (sim.SpawnTeam.checked) {
        playerTargets = structuredClone(cmd.Team);
        if (sim.ToggleIgnoreHealer.checked) {
            playerTargets = playerTargets.filter(p => p.Role !== "heal");
            playerTargets = playerTargets.filter(p => !p.hasHealerTargeting);
        }
    }
    playerTargets.push({ X: pl.X, Y: pl.Y, Role: "player" });
    playerTargets.push({ X: ba.CollectorX, Y: ba.CollectorY, Role: "collector" });
    return playerTargets;
}

// Healer targets closest adjacent tile to target, not target tile itself. The target tile is the one
// whose distance is smallest, or if the distance is equal, in n/s -> e/w order
function heFindTargetTile(x1, y1, targetX, targetY) { // (x1,y1) for healer, (targetX,targetY) for target
    let northOfTarget = tileDistance(x1, y1, targetX, targetY + 1);
    let southOfTarget = tileDistance(x1, y1, targetX, targetY - 1);
    let eastOfTarget = tileDistance(x1, y1, targetX + 1, targetY);
    let westOfTarget = tileDistance(x1, y1, targetX - 1, targetY);

    let minDistance = Math.min(northOfTarget, southOfTarget, eastOfTarget, westOfTarget);
    if (minDistance === northOfTarget) {
        //console.log("north");
        return [targetX, targetY + 1];
    }
    if (minDistance === southOfTarget) {
        //console.log("south");
        return [targetX, targetY - 1];
    }
    if (minDistance === eastOfTarget) {
        //console.log("east");
        return [targetX + 1, targetY];
    }
    if (minDistance === westOfTarget) {
        //console.log("west");
        return [targetX - 1, targetY];
    }
}
//}
