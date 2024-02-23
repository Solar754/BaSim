/*
* Attempt to process codes
*/
//{ Player Healer Logic - lo
const HTML_CALCULATOR_INPUT = "codecalculatorinput";
const HTML_CALCULATOR_TEXTAREA = "codecalculatortextarea";

const DISPENSER = "35,7";
const HEALER_CAVE = { X: 42, Y: 37 };

function isCode(code) {
    let format = /[-()x\[\]\/]+/;
    return format.test(code) || code.includes("r");
}

function loParseCode(code) {
    let player = cmd.Team.filter(p => p.Role == "heal")[0];
    if (!player) {
        return loTrivialCalculator(undefined, code);
    }
    return updateSpacingPriority(player);
}

function updateSpacingPriority(player) {
    let tiles = player.Tiles;

    // assign spacing by spawn time if unassigned then sort
    if (ba.TickCounter == 1) {
        if (ba.HealerSpawns.length === 0) {
            for (let tile of tiles) {
                if (tile.WaitUntil == 0 && tile.healerId) {
                    tile.WaitUntil = parseInt(tile.healerId + '1');
                } else if (tile.healerId) {
                    tile.isRepoison = true;
                }
            }
        } else {
            for (let tile of tiles) {
                if (tile.WaitUntil == 0 && tile.healerId) {
                    tile.WaitUntil = ba.HealerSpawns[tile.healerId - 1];
                } else if (tile.healerId) {
                    tile.isRepoison = true;
                }
            }
        }
        return tiles.sort((left, right) => {
            return left.WaitUntil > right.WaitUntil
        });
    }

    // if not targeting a healer, dont override
    if (!player.CurrentDst.healerId) return tiles;

    // prioritize a new spawn over current action
    // doesn't take reserves into account
    for (let i = player.TileIdx; i < tiles.length; i++) {
        if (tiles[i]?.healerId <= ba.MaxHealersAlive && !tiles[i].isRepoison) {
            if (tiles[i].WaitUntil == ba.TickCounter && player.CurrentDst?.healerId != tiles[i].healerId) {
                let tmpTile = tiles[i];
                tiles[i] = player.CurrentDst;
                player.CurrentDst = tmpTile;
                return tiles;
            }
        }
    }

    // compare current and next tile to see if swap needed (e.g. for reserves)
    // if current target hasn't spawned yet, deal with other queued targets
    if (player.CurrentDst.WaitUntil == ba.TickCounter - 1 && player.CurrentDst?.healerId) {
        for (let i = player.TileIdx; i < tiles.length; i++) {
            for (let healer of ba.Healers) {
                if (player.CurrentDst.healerId === healer.id) {
                    return tiles; // healer was found
                }
            }
            let tmpTile = tiles[i];
            tiles[i] = player.CurrentDst;
            player.CurrentDst = tmpTile;
        }
    }
    return tiles;
}

// provided 5(10) as 5,(,) ... will return 5, 10
function removeSubstringAndReturn(str, startSymbol, endSymbol) {
    let start = str.indexOf(startSymbol)
    let end = str.indexOf(endSymbol);
    let substr = str.substring(start, end + 1);
    str = str.replace(substr, "");
    substr = substr.substring(1, substr.length - 1);
    return [str, substr];
}

// parse from instructions input or player healer textbox
function loTrivialCalculator(e, simCode = undefined) {
    let code;
    let tiles = [];
    if (simCode) {
        code = simCode;
    }
    else {
        code = document.getElementById(HTML_CALCULATOR_INPUT).value;
    }
    let calls = code.split("//");

    // for each call....
    for (let i = 0; i < calls.length; i++) {
        let healerList = calls[i].split("-");

        // for each healer...
        for (let j = 0; j < healerList.length; j++) {
            let actions = healerList[j];
            let healerId = j + 1;
            let spacing = undefined;

            if (actions.includes("r")) {
                let updatedActions = removeSubstringAndReturn(actions, "r", "/");
                actions = updatedActions[0];
                let stockCount = parseInt(updatedActions[1]);
                let restockEastRunup = [DISPENSER, DISPENSER] // initial movement + arrivedelay
                for (let i = 0; i < stockCount; i++) {
                    restockEastRunup.push(DISPENSER);
                }
                restockEastRunup.push("45,25"); // east trap column
                tiles = tiles.concat(restockEastRunup);
            }
            if (actions.includes("(")) {
                let updatedActions = removeSubstringAndReturn(actions, "(", ")");
                actions = updatedActions[0];
                spacing = Math.round(parseFloat(updatedActions[1]) / 0.6);
            }
            if (!actions) {
                continue;
            }
            else if (actions == "x") {
                actions = 30; // large
            }
            if (spacing != undefined) {
                if (actions > 1) {
                    actions -= 1;
                    tiles.push(`h${healerId},${actions}`);
                }
                tiles.push(`h${healerId},1:${spacing}`);
            }
            else {
                tiles.push(`h${healerId},${actions}`);
            }
        }
    }

    if (simCode)
        return tiles;
    tiles = tiles.join("\n");
    document.getElementById(HTML_CALCULATOR_TEXTAREA).value = tiles;
}

//}