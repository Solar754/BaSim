/*
* Manage commands to shoot red, green, and blue eggs
* Track npc priority
*/
//{ Cannon - c
const cWEST_CANNON = [21, 26];
const cWEST_CANNON_PX = [252, 442];
const cEAST_CANNON = [40, 26];
const cEAST_CANNON_PX = [480, 442];
const RED_EGG = 3;
const GREEN_EGG = 1;
const RADIUS = 200;

function cRunCannonQueue() {
    cUpdateZonePriority();
    for (let i = 0; i < ba.CannonQueue.length; i++) {
        let cmd = ba.CannonQueue[i];
        if (m.mCurrentMap == mWAVE10) { // always west
            cmd.cannon = 'w';
        }

        if (cmd.numEggs == 0 || cmd.tick > ba.TickCounter) continue;
        if (cmd.stalled > 0) {
            --cmd.stalled;
            continue;
        }

        let target = cGetTarget(cmd);
        if (target) {
            let stallCountdown = cShootCannon(cmd, target.x, target.y);
            --cmd.numEggs;
            cmd.stalled = stallCountdown;
            if (cmd.eggType == "r") --cmd.stalled; // extra tick for red does not delay next shot
            target.eggQueue.push({
                "stalled": stallCountdown,
                "type": cmd.eggType,
                "cannon": cmd.cannon,
            });
        }
    }
}
function cUpdateZonePriority() {
    let penance = ba.Healers.concat(ba.Runners);
    for (let npc of penance) {
        let currentZone = [npc.x >>> 3, npc.y >>> 3];
        if (`${currentZone}` != `${npc?.CurrentZone}`) {
            npc.CurrentZone = currentZone;
            npc.ZoneCounter = 1;
        }
        else {
            ++npc.ZoneCounter;
        }
    }
}
function cGetTarget(cmd) {
    let penanceList = (cmd.penance == "h") ? ba.Healers : ba.Runners;
    let cannon = (cmd.cannon == "w") ? cWEST_CANNON : cEAST_CANNON;

    // remove npcs out of LOS or stunned or dying (TODO maybe 1t too early for healers)
    penanceList = penanceList.filter((p) => {
        return (tileDistance(...cannon, p.x, p.y) <= RADIUS && p.blueCounter == -1 && !p.isDying);
    });
    if (penanceList.length == 0) return undefined;

    return penanceList[randomRunnerId()];
}

// amount of time it takes for an egg to travel
// 1t before damage is calculated
function cShootCannon(cmd, x, y) {
    let travelTime = undefined;
    let cannon = (cmd.cannon == "w") ? cWEST_CANNON : cEAST_CANNON;
    let targetDistance = tileDistance(...cannon, x, y);

    if (targetDistance > RADIUS) {
        console.log(tickToSecond(ba.TickCounter) + ": No targets in range");
        return undefined;
    }
    else if (targetDistance > 9) {
        travelTime = 6;
    }
    else if (targetDistance > 3) {
        travelTime = 5;
    }
    else {
        travelTime = 4;
    }

    if (cmd.eggType == "r") {
        travelTime += 1;
    }
    console.log(tickToSecond(ba.TickCounter) + ": player clicked to shoot", travelTime);
    return travelTime;
}
//}