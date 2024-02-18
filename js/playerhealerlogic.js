/*
WIP

post restock movement may not always be run-up east....maybe assume east for trivial
then for complex look for location of next target
current code assumes east

spacing like (21) = tick 36; sim requires input as tick 35 to happen on 36

2x stock + run-up + two on the 6:
35,7
45,25:7
h1,2
h2,1

w4
35,7
45,25:6
h1,2
h2,5
h3,4
h4,7
*/

/*
* Attempt to process codes
*/
//{ Player Healer Logic - lo
const HTML_CALCULATOR_INPUT = "codecalculatorinput";
const HTML_CALCULATOR_TEXTAREA = "codecalculatortextarea";

const DISPENSER = "35,7";
let codeTiles = [];

function isCode(code) {
    let format = /[-()x\[\]\/]+/;
    return format.test(code) || code.includes("r");
}

// provided 5(10) as 5,(,) ... will return 5, (10)
function removeSubstringAndReturn(str, startSymbol, endSymbol) {
    let start = str.indexOf(startSymbol)
    let end = str.indexOf(endSymbol);
    let substr = str.substring(start, end + 1);
    str = str.replace(substr, "");
    substr = substr.substring(1, substr.length - 1);
    return [str, substr];
}

// returns an array of strings made up of either
// "x,y:tick" or "hID,numFood:tick"
function loParseCode(code) {
    codeTiles = [];
    code = code.split("\n")[0].toLowerCase();
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
                loRestock(updatedActions[1]);
            }

            // TODO []?... restock doesn't work correctly for second call

            // should be last
            if (actions.includes("(")) {
                let updatedActions = removeSubstringAndReturn(actions, "(", ")");
                actions = updatedActions[0];
                spacing = Math.round(parseFloat(updatedActions[1]) / 0.6) + 1;
            }

            if (!actions) {
                continue;
            }
            else if (actions == "x") {
                actions = 30; // large
            }

            // last remaining action should be the number of food to use immediately
            if (spacing != undefined) {
                if (actions > 1) {
                    actions -= 1;
                    tiles.push(`h${healerId},${actions}`);
                    tiles.push(`h${healerId},1:${spacing}`);
                }
                else {
                    tiles.push(`h${healerId},${actions}:${spacing}`);
                }
            }
            else {
                tiles.push(`h${healerId},${actions}`);
            }
        }
    }
    return codeTiles;
}

function loRestock(stockCount) {
    stockCount = parseInt(stockCount);
    restockEastRunup = [DISPENSER, "45,25:" + (4 + stockCount)];
    codeTiles = codeTiles.concat(restockEastRunup);
}

// parse from instructions input
function loTrivialCalculator(e) {
    let tiles = []
    code = document.getElementById(HTML_CALCULATOR_INPUT).value;
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
                loRestock(updatedActions[1]);
                let stockCount = parseInt(updatedActions[1]);
                let restockEastRunup = [DISPENSER, "45,25:" + (4 + stockCount)];
                tiles = tiles.concat(restockEastRunup);
            }
            if (actions.includes("(")) {
                let updatedActions = removeSubstringAndReturn(actions, "(", ")");
                actions = updatedActions[0];
                spacing = Math.round(parseFloat(updatedActions[1]) / 0.6) + 1;
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
                    tiles.push(`h${healerId},1:${spacing}`);
                }
                else {
                    tiles.push(`h${healerId},${actions}:${spacing}`);
                }
            }
            else {
                tiles.push(`h${healerId},${actions}`);
            }
        }
    }
    tiles = tiles.join("\n");
    document.getElementById(HTML_CALCULATOR_TEXTAREA).value = tiles;
}

//}