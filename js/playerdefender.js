/*
* Parse and update defender/player inputs
*/
function toggleDefRecordColor(hasTiles) {
    if (hasTiles) {
        sim.RecordDefButton.style.color = "green";
    }
    else {
        sim.RecordDefButton.style.color = "";
    }
}

// g#:tick / b#:tick -- good/bad food drop
// t:tick / p:tick-- repair trap/pick up food
function plParseTiles() {
    let tiles = []
    let vals = document.getElementById(`defcmds`).value;
    toggleDefRecordColor(vals);
    vals = vals.split("\n");
    for (let input of vals) {
        if (!input) continue;
        input = input.split(/,|:/);
        let waitUntil = (input.length === 3) ? input[2] : 0;
        let symbol = input[0][0];
        if (symbol === "g" || symbol === "b") {
            let numFood = parseInt(input[1]);
            while (numFood > 0) {
                tiles.push({
                    cmd: input[0],
                    WaitUntil: parseInt(waitUntil),
                });
                numFood--;
            }
        }
        else if (symbol === "p" || symbol === "t") {
            waitUntil = (input.length === 2) ? input[1] : 0;
            tiles.push({
                cmd: input[0],
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

function plHandleMovements() {
    if (!sim.SpawnTeam.checked) return;
    if (pl.CurrentMovementIdx >= pl.Movements.length) {
        return;
    }
    pl.Movements = plParseTiles();

    let prevMovement = undefined;
    for (let i = pl.CurrentMovementIdx - 1; i >= 0; i--) {
        if (pl.Movements[i]?.X) {
            prevMovement = pl.Movements[i];
            break;
        }
    }

    let movement = pl.Movements[pl.CurrentMovementIdx];
    while (movement?.cmd) {
        if (movement.WaitUntil >= ba.TickCounter) {
            return;
        }
        switch (movement.cmd) {
            case "g":
                mAddItem(new fFood(pl.X, pl.Y, true, ++sim.CurrentFoodId));
                pl.Actions.good++;
                break;
            case "b":
                mAddItem(new fFood(pl.X, pl.Y, false, ++sim.CurrentFoodId));
                pl.Actions.bad++;
                break;
            case "t":
                if (baIsNextToEastTrap(pl.X, pl.Y) && ba.EastTrapCharges < 2) {
                    plPathfind(pl, pl.X, pl.Y);
                    pl.RepairCountdown = 5;
                    if (pl.StandStillCounter === 0) ++pl.RepairCountdown;
                } else if (baIsNextToWestTrap(pl.X, pl.Y) && ba.WestTrapCharges < 2) {
                    plPathfind(pl, pl.X, pl.Y);
                    pl.RepairCountdown = 5;
                    if (pl.StandStillCounter === 0) ++pl.RepairCountdown;
                }
                pl.Actions.repair++;
                break;
            case "p":
                pl.ShouldPickupFood = true;
                plPathfind(pl, pl.X, pl.Y);
                pl.Actions.pickup++;
                break;
        }
        movement = pl.Movements[++pl.CurrentMovementIdx];
    }

    // update x,y
    if (movement?.X && movement.WaitUntil <= ba.TickCounter) {
        if (prevMovement && (pl.X != prevMovement?.X || pl.Y != prevMovement?.Y)) {
            return;
        }
        pl.ShouldPickupFood = false;
        plPathfind(pl, movement.X, movement.Y);
        pl.Movements[pl.CurrentMovementIdx++];

    }
}

// TODO if both good/bad food is dropped same tick
// the order is not preserved... get food id
// also doesn't work with q skip... need to add new command to list of inputs
function updateMarkersFromStateHistory(e) {
    let textarea = document.getElementById("defcmds");
    let playerTile = "";
    let good_count = 0;
    let bad_count = 0;
    let repair_count = 0;
    let pickup_count = 0;
    textarea.value = "";
    for (let i = 0; i <= stateHistory.index; i++) {
        let state = stateHistory.states[i];
        let tick = parseInt(state.ba.TickCounter);
        let actions = state.pl.Actions;

        if (actions.bad != bad_count) {
            textarea.value += `b,${actions.bad - bad_count}:${tick - 1}\n`;
            bad_count = actions.bad;
        }
        if (actions.good != good_count) {
            textarea.value += `g,${actions.good - good_count}:${tick - 1}\n`;
            good_count = actions.good;
        }
        if (actions.repair != repair_count) {
            textarea.value += `t:${tick - 1}\n`;
            repair_count = actions.repair;
        }
        if (actions.pickup != pickup_count) {
            textarea.value += `p:${tick - 1}\n`;
            pickup_count = actions.pickup;
        }

        let nextTile = `${state.pl.X},${state.pl.Y}`;
        if (playerTile != nextTile) {
            playerTile = nextTile;
            textarea.value += `${nextTile}:${tick}\n`;
        }
    }
    if (e) {
        e.target.setAttribute("stoptick", ba.TickCounter);
    }
    textarea.scrollTop = textarea.scrollHeight;
    toggleDefRecordColor(textarea.value);
}