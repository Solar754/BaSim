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

            if (actions.includes("r")) {
                let updatedActions = removeSubstringAndReturn(actions, "r", "/");
                actions = updatedActions[0];
                loRestock(updatedActions[1]);
            }

            // TODO implement () ... []?... restock doesn't work correctly for second call

            // last remaining action should be the number of food to use immediately
            codeTiles.push(`h${healerId},${actions}`);
        }
    }
    return codeTiles;
}

function loTrivial(code) {
}

function loRestock(stockCount) {
    stockCount = stockCount.substring(1, stockCount.length - 1);
    stockCount = parseInt(stockCount);

    restockEastRunup = [DISPENSER, "45,25:" + (5 + stockCount)];
    codeTiles = codeTiles.concat(restockEastRunup);
}

//}