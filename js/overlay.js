/*
* Misc visual assistance
*/
//{ Overlay - o
const MAIN_CLR = [240, 10, 10, 220];
const SECOND_CLR = [200, 50, 50, 220];
const PLAYER_HEAL_CLR = [10, 240, 10, 220];
const COLLECTOR_CLR = [240, 240, 10, 200];
const DEFENDER_CLR = [10, 10, 240, 220];
const RUNNER_CLR = [10, 10, 240, 127];
const RUNNER_DEAD_CLR = [1, 1, 39, 150];
const HEALER_CLR = [11, 199, 11, 150];
const HEALER_DEAD_CLR = [1, 39, 1, 150];
const HEALER_PSND_CLR = [116, 169, 46, 170];
const RED_EGG_CLR = [240, 10, 10, 220];
const GREEN_EGG_CLR = [10, 240, 10, 220];
const BLUE_EGG_CLR = [4, 59, 92, 220];
const PSN_HIT_CLR = [30, 142, 59, 220];
const BLACK_CLR = [0, 0, 0, 255];
const TRANSPARENT_CLR = [0, 0, 0, 0];

function addColor(x, y, rrFunc, color) {
    rSetDrawColor(...color);
    rrFunc(x, y);
}

var oMarkedTiles = new function () {
    this.tiles = [];
    this.currentColorRGB = [0, 0, 0, 255];
    this.currentColorHex = "#000000";
    this.storageNameW1_9 = "baTiles";
    this.storageNameW10 = "baTilesW10";
    this.getStorageName = function () {
        if (m.mCurrentMap == mWAVE10) {
            return this.storageNameW10;
        }
        return this.storageNameW1_9;
    };
    this.push = function (xTile, yTile) {
        let strTileTuple = JSON.stringify([xTile, yTile, this.currentColorRGB, this.currentColorHex]);
        if (this.tiles.includes(strTileTuple)) {
            this.tiles = this.tiles.filter(e => e !== strTileTuple);
        } else {
            this.tiles.push(strTileTuple);
        }
        localStorage.setItem(this.getStorageName(), JSON.stringify(this.tiles));
    };
    this.fetch = function () {
        this.tiles = localStorage.getItem(this.getStorageName());
        if (this.tiles == null) this.tiles = [];
        else this.tiles = JSON.parse(this.tiles);
        return this.tiles;
    };
    this.draw = function () {
        this.fetch();
        let markedTilesArr = [...this.tiles].map(JSON.parse);
        for (let i of markedTilesArr) {
            let xTile = i[0].toString();
            let yTile = i[1].toString();
            let tileColor = BLACK_CLR;
            if (i[2]) { // rgb
                tileColor = i[2];
            }
            addColor(xTile, yTile, rrOutline, tileColor);
        }
        this.updateHTMLColorList();
    };
    this.export = function (tileFilter) {
        this.fetch();
        let runeliteTiles = [];
        let region = (m.mCurrentMap == mWAVE10) ? 7508 : 7509;
        let markedTilesArr = [...this.tiles].map(JSON.parse);

        if (tileFilter !== "all") { // expects hex
            markedTilesArr = markedTilesArr.filter((t) => {
                if (t[3]) {
                    return t[3] == tileFilter;
                }
            });
        }

        for (let tile of markedTilesArr) {
            let tileColor = "#000000";
            if (tile[3]) { // hex
                tileColor = tile[3];
            }
            runeliteTiles.push({
                "regionId": region,
                "regionX": tile[0],
                "regionY": tile[1] + 8,
                "z": 0,
                "color": "#ff" + tileColor.slice(1) // RL alpha
            })
        }
        runeliteTiles = JSON.stringify(runeliteTiles);
        navigator.clipboard.writeText(runeliteTiles);
        console.log(runeliteTiles);
        alert("Tiles copied to clipboard\n" + runeliteTiles);
    };
    this.clear = function () {
        this.tiles = [];
        localStorage.removeItem(this.getStorageName());
    };
    this.updateHTMLColorList = function () {
        let markedTilesArr = [...this.tiles].map(JSON.parse);
        markedTilesArr = [...new Set(markedTilesArr.map(item => (item[3] || this.currentColorHex)))];

        let colorListParent = document.getElementsByClassName("currenttilecolors");
        for (let parent of colorListParent) {
            let children = parent.childNodes;
            while (children.length > 0) {
                children[0].parentNode.removeChild(children[0]);
            }

            let newHTMLColor = document.createElement("option");
            newHTMLColor.setAttribute("name", parent.getAttribute("label"));
            newHTMLColor.innerHTML = "all";
            newHTMLColor.value = "all";
            parent.appendChild(newHTMLColor);

            for (let color of markedTilesArr) {
                let newHTMLColor = document.createElement("option");
                newHTMLColor.setAttribute("name", parent.getAttribute("label"));
                newHTMLColor.style.backgroundColor = color;
                newHTMLColor.value = color;
                parent.appendChild(newHTMLColor);
            }
        }
    }
};

function oUpdateMarkerColor(e) {
    let menuOption = document.getElementById("selectedmarkercolor");
    menuOption.style.backgroundColor = e.target.value;

    let rgb = menuOption.style.backgroundColor.replace(/[^\d,]/g, '');
    rgb = rgb.split(',').map(Number);
    rgb.push(255); // alpha
    oMarkedTiles.currentColorRGB = rgb;
    oMarkedTiles.currentColorHex = e.target.value;
}

function oDrawYellowClick(e) {
    const DURATION = 540; // ms
    function clearGif(gif) {
        gif.src = "";
        document.body.removeChild(gif);
    }
    let collection = document.getElementsByClassName("ripple");
    for (let ele of collection) {
        clearGif(ele);
    }
    let yellowClick = document.createElement("img");
    yellowClick.className = "ripple";
    yellowClick.src = "css/yellow_click.gif";
    document.body.appendChild(yellowClick);
    yellowClick.style.left = `${e.clientX - 6}px`;
    yellowClick.style.top = `${e.clientY - 6}px`;
    setTimeout(() => {
        try {
            clearGif(yellowClick);
        } catch (err) { }
    }, DURATION);
}

function oDrawEggs() {
    const EGG_MAP = {
        "r": {
            "src": "red_egg.webp",
            "x": 0
        },
        "g": {
            "src": "green_egg.webp",
            "x": 6
        },
        "b": {
            "src": "blue_egg.webp",
            "x": 12
        }
    };
    let penance = ba.Healers.concat(ba.Runners);
    let allEggs = document.getElementsByClassName('egg');
    while (allEggs.length > 0) {
        allEggs[0].parentNode.removeChild(allEggs[0]);
    }
    for (let p of penance) {
        for (let egg of p.eggQueue) {
            let cannon = (egg.cannon == "w") ? cWEST_CANNON_PX : cEAST_CANNON_PX;
            if (egg.stalled >= 0) {
                let eggImg = document.createElement("img");
                eggImg.className = "egg";
                eggImg.src = "css/" + EGG_MAP[egg.type].src;
                eggImg.draggable = false;
                document.body.appendChild(eggImg);
                eggImg.style.left = (cannon[0] + EGG_MAP[egg.type].x) + `px`;
                eggImg.style.top = cannon[1] + `px`;
            }
            else if (egg.stalled == -1 && egg.type == "r") {
                addColor(p.x, p.y, rrOutline, RED_EGG_CLR);
            }
            else if (egg.stalled == -1 && egg.type == "g") {
                addColor(p.x, p.y, rrOutline, GREEN_EGG_CLR);
            }
        }
    }
}

function oDrawAllRolePaths() {
    let opacity = 90;
    let colorMap = {
        "main": MAIN_CLR.slice(0, 3).concat([opacity]),
        "second": SECOND_CLR.slice(0, 3).concat([opacity]),
        "heal": PLAYER_HEAL_CLR.slice(0, 3).concat([opacity]),
        "col": COLLECTOR_CLR.slice(0, 3).concat([opacity]),
    }
    simDraw(); // clear canvas
    let includeNumbers = document.getElementById("rolemarkernumbers").checked;
    for (let role of cmdROLE_NAMES) {
        let tiles = cmdParseTiles(role);
        for (let i = 0; i < tiles.length; i++) {
            addColor(tiles[i].X, tiles[i].Y, rrFill, colorMap[role])
            if (includeNumbers) {
                rrText(tiles[i].X, tiles[i].Y, i + 1);
            }
        }
    }
    rPresent();
}

function oFlipThemeOnClick() {
    let themeBtn = document.getElementById("themebtn");
    if (themeBtn.textContent === "⚫") {
        themeBtn.textContent = "🟡";
        document.documentElement.dataset.theme = 'dark';
        localStorage.setItem("basimTheme", "⚫");
    }
    else {
        themeBtn.textContent = "⚫";
        document.documentElement.dataset.theme = 'light';
        localStorage.setItem("basimTheme", "🟡");
    }
}

function oInstructions() {
    let canvasElement = document.getElementById(HTML_CANVAS);
    let instructionsElement = document.createElement("textarea");
    instructionsElement.classList.add("instructions")
    instructionsElement.readOnly = true;
    instructionsElement.style.resize = "none";
    instructionsElement.style.width = rr.CanvasWidth + "px";
    instructionsElement.style.height = rr.CanvasHeight + "px";
    instructionsElement.innerHTML = `Runner movements
    Control runner random e/w/s movement. Can be updated while sim is running.

    Example: ws-s
    First runner will move west on spawn, and next random movement (no food/crash direction) will be south.
    Second runner will move south on spawn.

    
Runner/healer spawns
    Specify when runner/healer should spawn. 
    Reserves will only come out if eligible and if time is specified.

    Example: 11,21,31
    First spawn will be when tick counter = 11, then 21, then 31


Egg syntax
    Input eggs to shoot using certain specifiers, in the format
    <cannon=e|w><penance=r|h><egg=r|g|b>,num eggs,tick. An egg will appear next to
    the appropriate hopper on the 'click' and disappear the tick the egg effect is applied.

    Example: wrr,2,51 (West Runner Red, 2 eggs, tick 51)
    means the west cannon will try to target a runner and shoot 2 red eggs, as if the player clicked
    to shoot on 51. The second red will be shot after cooldown.

    Red 2: wrr,1,51-wrr,1,51 means two separate players will shoot. Writing it as 
    wrr,1,51-1,51 is also valid syntax, and the previous specifiers (wrr) will apply 
    to the next player's shots.


General teammate syntax
    Input tiles in x,y:tick format, or toggle marker to select tiles on canvas.
    Tiles added while sim is running get timestamped with current tick and processed.
    Tick is the earliest possible time a command happens and is optional. It reflects 
    when a "click" would happen in-game.
    
    Example: 21,25:10 means the teammate will click to move to tile 21,25 no earlier than tick 10


Player healer syntax
    In addition to general syntax, healers can be targeted with: 'hID,numFood:tick'.
    Tick is the earliest possible time a command happens and is optional. It reflects 
    when a "click" would happen in-game.

    Example: h1,2:24 means after tick 24 player will start pathing as though they are using food on the 
    first healer (healer 1) every tick, and two food will be used.

    Trivial code syntax (see below) can also be entered here. Player healer will do its best to make 
    its own decisions (don't expect much).


Ignore healer toggle
    When toggled on, npc healers will not target player healer.


Trivial code convert tool (on the right)
    This tool takes a basic approach to convert code into player healer commands.
    Copy-paste generated/modified code into the heal text box after toggling "Team".
    At the moment it makes no attempt to path anywhere after running up post-stock.
    
    Syntax:
        r#/ -- number of times to stock and then run up east
        (#) -- number of seconds to wait until last food is placed (wont go to next healer until 
                spacing is satisfied)
        //  -- "call change", not very useful at the moment but can be used to space out rps in 
                a roundabout way
        x   -- spam down until dead

    Example 1x os w4: r2/2(12)-5-4//0-0-0-x
    `

    let codeCalculator = document.createElement("input");
    codeCalculator.type = "text";
    codeCalculator.id = "codecalculatorinput";
    codeCalculator.classList.add("instructions");
    codeCalculator.style.width = rr.CanvasWidth * (1 / 4) + "px";
    codeCalculator.placeholder = "r2/2(12)-5-4//0-0-0-x";

    let codeTextarea = document.createElement("textarea");
    codeTextarea.classList.add("instructions")
    codeTextarea.id = "codecalculatortextarea";
    codeTextarea.style.resize = "none";
    codeTextarea.style.width = rr.CanvasWidth * (1 / 4) + "px";
    codeTextarea.style.height = rr.CanvasHeight - 22 + "px";

    let wrapper = document.createElement("div");
    wrapper.classList.add("instructions");
    wrapper.classList.add("container");

    let subwrapper1 = document.createElement("div");
    subwrapper1.classList.add("instructions");
    subwrapper1.classList.add("one");

    let subwrapper2 = document.createElement("div");
    subwrapper2.classList.add("instructions");
    subwrapper2.classList.add("two");
    subwrapper2.style.marginLeft = "49rem";

    let subwrapper2Split = document.createElement("br");

    let instructionsExist = document.querySelectorAll('.instructions').length > 0;
    if (canvasElement.style.display === "none") {
        canvasElement.style.display = "inline";
        document.querySelectorAll('.instructions').forEach(e => e.style.display = "none");
    }
    else {
        canvasElement.style.display = "none";
        if (instructionsExist) {
            document.querySelectorAll('.instructions').forEach(e => e.style.display = "inline-grid");
        }
        else {
            canvasElement.parentNode.insertBefore(wrapper, canvasElement);
            wrapper.appendChild(subwrapper1);
            wrapper.appendChild(subwrapper2);
            subwrapper1.appendChild(instructionsElement);
            subwrapper2.appendChild(codeCalculator);
            subwrapper2.appendChild(subwrapper2Split);
            subwrapper2.appendChild(codeTextarea);
        }
        document.getElementById(HTML_CALCULATOR_INPUT).oninput = loTrivialCalculator;
    }
}
//}