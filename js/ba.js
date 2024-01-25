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

function TickToSecond(tick) {
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
    RunnerspawnsIndex: undefined,
    RunnerMovements: undefined,
    RunnerMovementsIndex: undefined,
    Healers: undefined,
    HealersAlive: undefined,
    HealersKilled: undefined,
    TotalHealers: undefined,
    MaxHealersAlive: undefined,
    Healerspawns: undefined,
    HealerspawnsIndex: undefined,
    Players: undefined, // unused
    CollectorX: undefined,
    CollectorY: undefined,
    CollectorTargetX: undefined,
    CollectorTargetY: undefined,
    CurrentRunnerId: undefined,
    CurrentHealerId: undefined,
    CurrentPlayerId: undefined,
    EastTrapCharges: undefined,
    WestTrapCharges: undefined
}
function baInit(maxRunnersAlive, totalRunners, maxHealersAlive, totalHealers, runnerMovements, runnerSpawns, healerSpawns) {
    ba.Runners = [];
    ba.RunnersToRemove = [];
    ba.Runnerspawns = runnerSpawns;
    ba.RunnerspawnsIndex = 0;
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
    ba.Healerspawns = healerSpawns;
    ba.HealerspawnsIndex = 0;

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

    pl.RenderDistance = 15;
    pl.RenderArea = [];

    sim.TickCountSpan.innerHTML = ba.TickCounter;
    sim.SecondsCountSpan.innerHTML = TickToSecond(ba.TickCounter);
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
    if (ba.TickCounter > 1 && ba.TickCounter % 10 === 1) {
        if (ba.RunnersAlive < ba.MaxRunnersAlive && ba.RunnersKilled + ba.RunnersAlive < ba.TotalRunners && ba.Runnerspawns.length === 0) {
            let movements;
            if (ba.RunnerMovements.length > ba.RunnerMovementsIndex) {
                movements = ba.RunnerMovements[ba.RunnerMovementsIndex++];
            } else {
                movements = "";
            }
            if (m.mCurrentMap === mWAVE_1_TO_9) {
                ba.Runners.push(new ruRunner(baWAVE1_RUNNER_SPAWN_X, baWAVE1_RUNNER_SPAWN_Y, new rngRunnerRNG(movements), false, ba.CurrentRunnerId++));
            } else {
                ba.Runners.push(new ruRunner(baWAVE10_RUNNER_SPAWN_X, baWAVE10_RUNNER_SPAWN_Y, new rngRunnerRNG(movements), true, ba.CurrentRunnerId++));
            }
            ++ba.RunnersAlive;
        }
        if (sim.ToggleHealers.checked && ba.Healerspawns.length === 0) {
            if (ba.HealersAlive < ba.MaxHealersAlive && ba.HealersKilled + ba.HealersAlive < ba.TotalHealers) {
                if (m.mCurrentMap === mWAVE_1_TO_9) {
                    ba.Healers.push(new heHealer(baWAVE1_NPC_HEALER_SPAWN_X, baWAVE1_NPC_HEALER_SPAWN_Y, ba.CurrentHealerId++));
                } else {
                    ba.Healers.push(new heHealer(baWAVE10_NPC_HEALER_SPAWN_X, baWAVE10_NPC_HEALER_SPAWN_Y, ba.CurrentHealerId++));
                }
                ++ba.HealersAlive;
            }
        }
    }
    // custom spawn times
    if (ba.RunnersAlive < ba.MaxRunnersAlive && ba.RunnersKilled + ba.RunnersAlive < ba.TotalRunners && ba.Runnerspawns.length > 0) {
        if (ba.Runnerspawns[ba.RunnerspawnsIndex] === ba.TickCounter) {
            let movements;
            if (ba.RunnerMovements.length > ba.RunnerMovementsIndex) {
                movements = ba.RunnerMovements[ba.RunnerMovementsIndex++];
            } else {
                movements = "";
            }
            if (m.mCurrentMap === mWAVE_1_TO_9) {
                ba.Runners.push(new ruRunner(baWAVE1_RUNNER_SPAWN_X, baWAVE1_RUNNER_SPAWN_Y, new rngRunnerRNG(movements), false, ba.CurrentRunnerId++));
            } else {
                ba.Runners.push(new ruRunner(baWAVE10_RUNNER_SPAWN_X, baWAVE10_RUNNER_SPAWN_Y, new rngRunnerRNG(movements), true, ba.CurrentRunnerId++));
            }
            ++ba.RunnersAlive;
            ++ba.RunnerspawnsIndex;
        }
    }
    if (sim.ToggleHealers.checked && ba.Healerspawns.length > 0) {
        if (ba.Healerspawns[ba.HealerspawnsIndex] === ba.TickCounter) {
            if (ba.HealersAlive < ba.MaxHealersAlive && ba.HealersKilled + ba.HealersAlive < ba.TotalHealers) {
                if (m.mCurrentMap === mWAVE_1_TO_9) {
                    ba.Healers.push(new heHealer(baWAVE1_NPC_HEALER_SPAWN_X, baWAVE1_NPC_HEALER_SPAWN_Y, ba.CurrentHealerId++));
                } else {
                    ba.Healers.push(new heHealer(baWAVE10_NPC_HEALER_SPAWN_X, baWAVE10_NPC_HEALER_SPAWN_Y, ba.CurrentHealerId++));
                }
                ++ba.HealersAlive;
                ++ba.HealerspawnsIndex;
            }
        }
    }
    if (ba.TickCounter > 1 && ba.TickCounter % 10 === 1) {
        mDrawLogs();
    }
    sim.TickCountSpan.innerHTML = ba.TickCounter;
    sim.SecondsCountSpan.innerHTML = TickToSecond(ba.TickCounter);
    simMovementsInputWatcher()
}
function baDrawOverlays() {
    if (m.mCurrentMap !== mWAVE_1_TO_9 && m.mCurrentMap !== mWAVE10) {
        return;
    }
    rSetDrawColor(240, 10, 10, 220);
    if (m.mCurrentMap === mWAVE_1_TO_9) {
        rrOutline(18, 37);
    } else {
        rrOutline(18, 38);
    }
    rrOutline(24, 39);
    rrFill(33, 6);
    rSetDrawColor(10, 10, 240, 220);
    if (m.mCurrentMap === mWAVE_1_TO_9) {
        rrOutline(36, 39);
    } else {
        rrOutline(42, 38);
    }
    rrFill(34, 6);
    rSetDrawColor(10, 240, 10, 220);
    if (m.mCurrentMap === mWAVE_1_TO_9) {
        rrOutline(42, 37);
    } else {
        rrOutline(36, 39);
    }
    rrFill(35, 6);
    rSetDrawColor(240, 240, 10, 220);
    rrFill(36, 6);
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
    rSetDrawColor(10, 10, 240, 127);
    for (let i = 0; i < ba.Runners.length; ++i) {
        rrFill(ba.Runners[i].x, ba.Runners[i].y);
    }
    rSetDrawColor(11, 199, 11, 150);
    for (let i = 0; i < ba.Healers.length; ++i) {
        rrFill(ba.Healers[i].x, ba.Healers[i].y);
    }
    if (ba.CollectorX !== -1) { // draw coll
        rSetDrawColor(240, 240, 10, 200);
        rrFill(ba.CollectorX, ba.CollectorY);
    }
}
function baDrawMarkedTiles() {
    let markedTilesArr = [...markedTiles].map(JSON.parse);
    rSetDrawColor(0, 0, 0, 255);
    for (let i of markedTilesArr) {
        let xTile = i[0].toString();
        let yTile = i[1].toString();
        rrOutline(xTile, yTile);
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