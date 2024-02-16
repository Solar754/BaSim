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
        let color = cmd[`${role}Color`];
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

    instructionsElement.innerHTML = `General Teammate syntax:
    Input tiles in x,y:tick format, or toggle marker to select tiles on canvas.
    Tiles added while sim is running get timestamped with current tick and processed.
    Tick is the earliest possible time a command happens and is optional. It reflects 
    when a "click" would happen in-game.
    
    Example: 21,25:10 means the teammate will click to move to tile 21,25 no earlier than tick 10


Player healer syntax:
    In addition to general syntax, healers can be targeted with: 'hID,numFood:tick'.
    Tick is the earliest possible time a command happens and is optional. It reflects 
    when a "click" would happen in-game.

    Example: h1,2:24 means on tick 24 player will start pathing as though they are using food on the 
    first healer (healer 1) every tick, and when valid will use 2 food.
    `
    if (canvasElement.style.display === "none") {
        canvasElement.style.display = "inline";
        document.querySelectorAll('.instructions').forEach(e => e.remove());
    }
    else {
        canvasElement.style.display = "none";

        // var myimg = document.getElementById('myimg');
        // var text = document.createTextNode("This is my caption.");
        // myimg.parentNode.insertBefore(text, myimg.nextSibling)
        //area.appendChild(instructionsElement);
        canvasElement.parentNode.insertBefore(instructionsElement, canvasElement);
    }
}
//}