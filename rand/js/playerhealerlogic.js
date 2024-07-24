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

// provided 5(10) as 5,(,) ... will return 5, 10
function removeSubstringAndReturn(str, startSymbol, endSymbol) {
    let start = str.indexOf(startSymbol)
    let end = str.indexOf(endSymbol);
    let substr = str.substring(start, end + 1);
    str = str.replace(substr, "");
    substr = substr.substring(1, substr.length - 1);
    return [str, substr];
}

function loParseCode(code) {
    let player = cmd.Team.filter(p => p.Role == "heal")[0];
    if (!player) {
        return loTrivialCalculator(undefined, code);
    }
    player.runningComplex = true;
    return loUpdateSpacingPriority(player);
}

function loUpdateSpacingPriority(player) {
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

        // restock based on last healer, problem with reserves
        // doesn't quite work
        // w7: r3/2(27)-6-6-1//r5/
        for (let i = 1; i < tiles.length; i++) {
            if (!tiles[i].healerId && !tiles[i].WaitUntil) {
                tiles[i].WaitUntil = tiles[i - 1].WaitUntil + 1;
            }
        }

        return tiles.sort((left, right) => {
            return left.WaitUntil - right.WaitUntil
        });
    }

    // wall trap pathing exception for 12s spawn
    if (ba.TickCounter < 24 && m.mCurrentMap !== mWAVE10) {
        if (player.CurrentDst?.healerId == 2) {
            player.TileIdx -= 1;
            player.CurrentDst = { X: 45, Y: 33, WaitUntil: 22 }
            return tiles;
        }
        return tiles;
    }

    // if not targeting a healer, dont override pathing
    if (!player.CurrentDst.healerId) return tiles;

    // prioritize a new spawn over current action
    for (let healer of ba.Healers) {
        if (!healer.isPsned && player.CurrentDst?.healerId == healer.id) {
            return tiles;
        }
        else if (!healer.isPsned) {
            for (let i = player.TileIdx; i < tiles.length; i++) {
                if (tiles[i]?.healerId == healer.id) {
                    let tmpTile = tiles[i];
                    tiles[i] = player.CurrentDst;
                    player.CurrentDst = tmpTile;
                    return tiles;
                }
            }
        }
    }

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