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
    document.body.classList.toggle("dark-theme");
    if (themeBtn.textContent === "⚫") {
        themeBtn.textContent = "🟡";
        localStorage.setItem("basimTheme", "⚫");
    }
    else {
        themeBtn.textContent = "⚫";
        localStorage.setItem("basimTheme", "🟡");
    }
}
//}