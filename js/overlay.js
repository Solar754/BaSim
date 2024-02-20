/*
* Misc visual assistance
*/
//{ Overlay - o
var markedTiles = new function () {
    this.tiles = [];
    this.storageName = "baTiles";
    this.push = function (xTile, yTile) {
        let strTileTuple = JSON.stringify([xTile, yTile]);
        if (this.tiles.includes(strTileTuple)) {
            this.tiles = this.tiles.filter(e => e !== strTileTuple);
        } else {
            this.tiles.push(strTileTuple);
        }
        localStorage.setItem(this.storageName, JSON.stringify(this.tiles));
    };
    this.fetch = function () {
        this.tiles = localStorage.getItem(this.storageName);
        if (this.tiles == null) this.tiles = [];
        else this.tiles = JSON.parse(this.tiles);
    };
    this.draw = function () {
        let markedTilesArr = [...this.tiles].map(JSON.parse);
        rSetDrawColor(0, 0, 0, 255);
        for (let i of markedTilesArr) {
            let xTile = i[0].toString();
            let yTile = i[1].toString();
            rrOutline(xTile, yTile);
        }
    };
    this.clear = function () {
        this.tiles = [];
        localStorage.removeItem(this.storageName);
    };
};

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

function oDrawAllRolePaths() {
    let includeNumbers = document.getElementById("rolemarkernumbers").checked;
    simDraw(); // clear canvas
    for (let role of cmdROLE_NAMES) {
        let tiles = cmdParseTiles(role);
        let color = cmd[role + `Color`];
        rSetDrawColor(...color.slice(0, 3), 90);
        for (let i = 0; i < tiles.length; i++) {
            rrFill(tiles[i].X, tiles[i].Y);
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
    First spawn will be when tick counter = 11, then 21, etc....


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