/*
* Base per-tick logic and behavior
* Draws ba map details
*/
//{ BaArena - ba
const baWEST_TRAP_X = 15;
const baWEST_TRAP_Y = 25;
const baEAST_TRAP_X = 45;
const baEAST_TRAP_Y = 26;
const baWAVE1_NORTH_LOG_X = 28;
const baWAVE1_NORTH_LOG_Y = 39;
const baWAVE10_NORTH_LOG_X = 29;
const baWAVE10_NORTH_LOG_Y = 39;
const baWAVE1_SOUTH_LOG_X = 29;
const baWAVE1_SOUTH_LOG_Y = 38;
const baWAVE10_SOUTH_LOG_X = 30;
const baWAVE10_SOUTH_LOG_Y = 38;
const baWAVE1_RUNNER_SPAWN_X = 36;
const baWAVE1_RUNNER_SPAWN_Y = 39;
const baWAVE10_RUNNER_SPAWN_X = 42;
const baWAVE10_RUNNER_SPAWN_Y = 38;
const baWAVE1_NPC_HEALER_SPAWN_X = 42;
const baWAVE1_NPC_HEALER_SPAWN_Y = 37;
const baWAVE10_NPC_HEALER_SPAWN_X = 36;
const baWAVE10_NPC_HEALER_SPAWN_Y = 39;
const baWAVE1_DEFENDER_SPAWN_X = 33;
const baWAVE1_DEFENDER_SPAWN_Y = 8;
const baWAVE10_DEFENDER_SPAWN_X = 28;
const baWAVE10_DEFENDER_SPAWN_Y = 8;
const baWAVE1_PLAYER_HEALER_SPAWN_X = 32;
const baWAVE1_PLAYER_HEALER_SPAWN_Y = 9;
const baWAVE10_PLAYER_HEALER_SPAWN_X = 31;
const baWAVE10_PLAYER_HEALER_SPAWN_Y = 9;
const baWAVE1_MAIN_SPAWN_X = 31;
const baWAVE1_MAIN_SPAWN_Y = 10;
const baWAVE10_MAIN_SPAWN_X = 30;
const baWAVE10_MAIN_SPAWN_Y = 10;
const baWAVE1_2A_SPAWN_X = 30;
const baWAVE1_2A_SPAWN_Y = 9;
const baWAVE10_2A_SPAWN_X = 29;
const baWAVE10_2A_SPAWN_Y = 9;
const baWAVE1_COLLECTOR_SPAWN_X = 29;
const baWAVE1_COLLECTOR_SPAWN_Y = 8;
const baWAVE10_COLLECTOR_SPAWN_X = 32;
const baWAVE10_COLLECTOR_SPAWN_Y = 8;

// W > E > S > N > SW > SE > NW > NE
const plHealerMovementPriority = Object.freeze({
    "": 0,
    w:  1,
    e:  2,
    s:  3,
    n:  4,
    sw: 5,
    se: 6,
    nw: 7,
    ne: 8,
});

const baPSN_FOOD_DMG = 4;
const baHEALER_HEALTH = {
    "1": 27,
    "2": 32,
    "3": 37,
    "4": 43,
    "5": 49,
    "6": 55,
    "7": 60,
    "8": 67,
    "9": 76,
    "10": 60,
}

function tickToSecond(tick) {
    tick = Math.max(tick - 1, 0);
    return (tick * 0.6).toFixed(1);
}

//{ BaArena - ba
var ba = {
    Runners: undefined,
    RunnersToRemove: undefined,
    TickCounter: undefined,
    RunnersAlive: undefined,
    RunnersKilled: undefined,
    TotalRunners: undefined,
    MaxRunnersAlive: undefined,
    Runnerspawns: undefined,
    RunnerSpawnsIndex: undefined,
    RunnerMovements: undefined,
    RunnerMovementsIndex: undefined,
    Healers: undefined,
    DeadHealers: undefined,
    HealersAlive: undefined,
    HealersKilled: undefined,
    TotalHealers: undefined,
    MaxHealersAlive: undefined,
    HealerSpawns: undefined,
    HealerSpawnsIndex: undefined,
    Players: undefined, // unused
    CollectorX: undefined,
    CollectorY: undefined,
    CollectorTargetX: undefined,
    CollectorTargetY: undefined,
    CurrentRunnerId: undefined,
    CurrentHealerId: undefined,
    CurrentPlayerId: undefined,
    CannonQueue: undefined,
    EastTrapCharges: undefined,
    WestTrapCharges: undefined,
}
function baInit(maxRunnersAlive, totalRunners, maxHealersAlive, totalHealers, runnerMovements, runnerSpawns, HealerSpawns, cannonQueue) {
    ba.Runners = [];
    ba.RunnersToRemove = [];
    ba.Runnerspawns = runnerSpawns;
    ba.RunnerSpawnsIndex = 0;
    ba.RunnersAlive = 0;
    ba.RunnersKilled = 0;
    ba.HealersAlive = 0;
    ba.HealersKilled = 0;
    ba.MaxRunnersAlive = maxRunnersAlive;
    ba.TotalRunners = totalRunners;
    ba.MaxHealersAlive = maxHealersAlive;
    ba.TotalHealers = totalHealers;
    ba.RunnerMovements = runnerMovements;
    ba.RunnerMovementsIndex = 0;

    ba.Healers = [];
    ba.HealersToRemove = [];
    ba.HealerSpawns = HealerSpawns;
    ba.HealerSpawnsIndex = 0;

    ba.TickCounter = 0;
    ba.CollectorX = -1;
    ba.CollectorY = -1;
    ba.CollectorTargetX = -1;
    ba.CollectorTargetY = -1;
    ba.CurrentPlayerId = 1;
    ba.CurrentRunnerId = 1;
    ba.CurrentHealerId = 1;
    ba.EastTrapCharges = 2;
    ba.WestTrapCharges = 2;
    ba.CannonQueue = cannonQueue;

    pl.RenderDistance = 15;
    pl.RenderArea = [];
    cmd.Team = [];

    sim.TickCountSpan.innerHTML = ba.TickCounter;
    sim.SecondsCountSpan.innerHTML = tickToSecond(ba.TickCounter);
}
function baTick() {
    ++ba.TickCounter;
    ba.RunnersToRemove.length = 0;
    for (let i = 0; i < ba.Healers.length; ++i) {
        ba.Healers[i].tick(); // TODO: healers and runners should be in same array.
    }
    for (let i = 0; i < ba.Runners.length; ++i) {
        ba.Runners[i].tick();
    }
    for (let i = 0; i < ba.RunnersToRemove.length; ++i) {
        let runner = ba.RunnersToRemove[i];
        let index = ba.Runners.indexOf(runner);
        ba.Runners.splice(index, 1);
    }
    if (ba.HealersToRemove.length > 0) {
        ba.Healers = ba.Healers.filter(h => ba.HealersToRemove.indexOf(h.id) == -1);
    }
    // spawns
    let isDefaultCycle = (ba.TickCounter > 1 && ba.TickCounter % 10 === 1);
    if (ba.RunnersAlive < ba.MaxRunnersAlive && ba.RunnersKilled + ba.RunnersAlive < ba.TotalRunners) {
        if ((ba.Runnerspawns.length === 0 && isDefaultCycle) ||
            (ba.Runnerspawns.length > 0 && ba.Runnerspawns[ba.RunnerSpawnsIndex]?.time === ba.TickCounter)) {
            baSpawnRunner();
        }
    }
    if (ba.HealersAlive < ba.MaxHealersAlive && ba.HealersKilled + ba.HealersAlive < ba.TotalHealers) {
        if ((ba.HealerSpawns.length === 0 && isDefaultCycle) ||
            (ba.HealerSpawns.length > 0 && ba.HealerSpawns[ba.HealerSpawnsIndex]?.time === ba.TickCounter)) {
            baSpawnHealer();
        }
    }
    if (isDefaultCycle) {
        mDrawLogs();
    }
    cRunCannonQueue();
    sim.TickCountSpan.innerHTML = ba.TickCounter;
    sim.SecondsCountSpan.innerHTML = tickToSecond(ba.TickCounter);
    simMovementsInputWatcher()
}
function baSpawnRunner() {
    let movements;
    if (ba.RunnerMovements.length > ba.RunnerMovementsIndex) {
        movements = ba.RunnerMovements[ba.RunnerMovementsIndex++];
    } else {
        movements = "";
    }
    let isWave10 = (m.mCurrentMap === mWAVE10);
    let xSpawn = (m.mCurrentMap === mWAVE_1_TO_9) ? baWAVE1_RUNNER_SPAWN_X : baWAVE10_RUNNER_SPAWN_X;
    let ySpawn = (m.mCurrentMap === mWAVE_1_TO_9) ? baWAVE1_RUNNER_SPAWN_Y : baWAVE10_RUNNER_SPAWN_Y;
    ba.Runners.push(new ruRunner(xSpawn, ySpawn, new rngRunnerRNG(movements), isWave10, ba.CurrentRunnerId++));
    ++ba.RunnersAlive;
    ++ba.RunnerSpawnsIndex;
}
function baSpawnHealer() {
    if (!sim.ToggleHealers.checked) {
        return;
    }
    let xSpawn = (m.mCurrentMap === mWAVE_1_TO_9) ? baWAVE1_NPC_HEALER_SPAWN_X : baWAVE10_NPC_HEALER_SPAWN_X;
    let ySpawn = (m.mCurrentMap === mWAVE_1_TO_9) ? baWAVE1_NPC_HEALER_SPAWN_Y : baWAVE10_NPC_HEALER_SPAWN_Y;
    ba.Healers.push(new heHealer(xSpawn, ySpawn, ba.CurrentHealerId++));
    ++ba.HealersAlive;
    ++ba.HealerSpawnsIndex;
}
function baDrawOverlays() { // spawns, dispensers
    if (m.mCurrentMap !== mWAVE_1_TO_9 && m.mCurrentMap !== mWAVE10) {
        return;
    }
    if (m.mCurrentMap === mWAVE_1_TO_9) {
        addColor(18, 37, rrOutline, MAIN_CLR);
        addColor(24, 39, rrOutline, MAIN_CLR);
        addColor(36, 39, rrOutline, DEFENDER_CLR);
        addColor(42, 37, rrOutline, PLAYER_HEAL_CLR);
    } else {
        addColor(18, 38, rrOutline, MAIN_CLR);
        addColor(24, 39, rrOutline, MAIN_CLR);
        addColor(42, 38, rrOutline, DEFENDER_CLR);
        addColor(36, 39, rrOutline, PLAYER_HEAL_CLR);
    }
    addColor(33, 6, rrFill, MAIN_CLR);
    addColor(34, 6, rrFill, DEFENDER_CLR);
    addColor(35, 6, rrFill, PLAYER_HEAL_CLR);
    addColor(36, 6, rrFill, COLLECTOR_CLR);
}
function baDrawDetails() {
    if (m.mCurrentMap !== mWAVE_1_TO_9 && m.mCurrentMap !== mWAVE10) {
        return;
    }
    rSetDrawColor(160, 82, 45, 255);
    rrCone(40, 32);
    rrCone(40, 31);
    rrCone(41, 32);
    rrCone(41, 31);
    rrCone(43, 31);
    rrCone(36, 34);
    rrCone(36, 35);
    rrCone(37, 34);
    rrCone(37, 35);
    rrCone(39, 36);
    rrCone(43, 22);
    rrCone(43, 23);
    rrCone(44, 22);
    rrCone(44, 23);
    rrCone(45, 24);
    if (!sim.IsRunning) {
        if (m.mCurrentMap === mWAVE_1_TO_9) {
            rrFillItem(baWAVE1_NORTH_LOG_X, baWAVE1_NORTH_LOG_Y);
            rrFillItem(baWAVE1_SOUTH_LOG_X, baWAVE1_SOUTH_LOG_Y);
        } else {
            rrFillItem(baWAVE10_NORTH_LOG_X, baWAVE10_NORTH_LOG_Y);
            rrFillItem(baWAVE10_SOUTH_LOG_X, baWAVE10_SOUTH_LOG_Y);
        }
    }
    if (ba.EastTrapCharges > 1) {
        rrFill(45, 26);
    } else {
        rrOutline(45, 26);
        if (ba.EastTrapCharges > 0) rrFillItem(45, 26);
    }
    if (ba.WestTrapCharges > 1) {
        rrFill(15, 25);
    } else {
        rrOutline(15, 25);
        if (ba.WestTrapCharges > 0) rrFillItem(15, 25);
    }

    if (m.mCurrentMap === mWAVE10) {
        rrOutlineBig(27, 20, 8, 8);
    }
    rSetDrawColor(127, 127, 127, 255);
    rrFillItem(32, 34);
}
function baDrawEntities() {
    for (let i = 0; i < ba.Runners.length; ++i) {
        let npc = ba.Runners[i];
        addColor(npc.x, npc.y, rrFill, RUNNER_CLR);
        if (npc.hp == 0 && npc.despawnCountdown != -1)
            addColor(npc.x, npc.y, rrFill, RUNNER_DEAD_CLR);
        if (npc.psnHitsplat)
            addColor(npc.x, npc.y, rrFillItem, PSN_HIT_CLR);
        if (npc.blueCounter != -1)
            addColor(npc.x, npc.y, rrOutline, BLUE_EGG_CLR);
    }
    for (let i = 0; i < ba.Healers.length; ++i) {
        let npc = ba.Healers[i];
        addColor(npc.x, npc.y, rrFill, HEALER_CLR);
        if (document.getElementById("rolemarkernumbers").checked)
            rrText(npc.x, npc.y, npc.id);
        if (npc.isPsned)
            addColor(npc.x, npc.y, rrFill, HEALER_PSND_CLR);
        if (npc.isDying)
            addColor(npc.x, npc.y, rrFill, HEALER_DEAD_CLR);
        if (npc.psnHitsplat)
            addColor(npc.x, npc.y, rrFillItem, PSN_HIT_CLR);
        if (npc.blueCounter != -1)
            addColor(npc.x, npc.y, rrOutline, BLUE_EGG_CLR);
    }
    if (ba.CollectorX !== -1) { // draw coll
        addColor(ba.CollectorX, ba.CollectorY, rrFill, COLLECTOR_CLR);
    }
}
function baIsNearWestTrap(x, y) {
    return (Math.abs(x - baWEST_TRAP_X) < 2 && Math.abs(y - baWEST_TRAP_Y) < 2);
}
function baIsNearEastTrap(x, y) {
    return (Math.abs(x - baEAST_TRAP_X) < 2 && Math.abs(y - baEAST_TRAP_Y) < 2);
}
function baIsNextToWestTrap(x, y) {
    return (Math.abs(x - baWEST_TRAP_X) < 2 && Math.abs(y - baWEST_TRAP_Y) < 1) || (Math.abs(x - baWEST_TRAP_X) < 1 && Math.abs(y - baWEST_TRAP_Y) < 2);
}
function baIsNextToEastTrap(x, y) {
    return (Math.abs(x - baEAST_TRAP_X) < 2 && Math.abs(y - baEAST_TRAP_Y) < 1) || (Math.abs(x - baEAST_TRAP_X) < 1 && Math.abs(y - baEAST_TRAP_Y) < 2);
}
function baTileBlocksPenance(x, y) {
    // Player blocks
    if (x === pl.X && y === pl.Y) {
        return true;
    }
    // Collector blocks
    if (x === ba.CollectorX && y === ba.CollectorY) {
        return true;
    }
    // Team blocks
    for (let teammate of cmd.Team) {
        if (x === teammate.X && y === teammate.Y) {
            return true;
        }
    }
    if (y === 22) {
        if (x >= 20 && x <= 22) {
            return true;
        }
        if (m.mCurrentMap === mWAVE_1_TO_9 && x >= 39 && x <= 41) {
            return true;
        }
    } else if (x === 46 && y >= 9 && y <= 12) {
        return true;
    } else if (m.mCurrentMap === mWAVE_1_TO_9 && x === 27 && y === 24) { // the tile
        return true;
    }
    return false;
}
//}