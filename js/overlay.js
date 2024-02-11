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
    simDraw(); // clear canvas
    for (let role of ROLE_NAMES) {
        let tiles = cmdParseTiles(role);
        let color = cmd[`${role}Color`];
        rSetDrawColor(...color.slice(0, 3), 90);
        for (let tile of tiles) {
            rrFill(tile.X, tile.Y);
        }
    }
    rPresent();
}

function oXTiletoPx(xTile) { // top left
    var canvasRect = rr.Canvas.getBoundingClientRect();
    return (xTile * rrTileSize) + canvasRect.left;
}
function oYTiletoPx(yTile) { // bottom right
    var canvasRect = rr.Canvas.getBoundingClientRect();
    return canvasRect.bottom - 1 - (yTile * rrTileSize);
}

//}
/*
misc notes
-- adding text onto a tile

.numbertile {
    margin: 0;
    position: absolute;
    user-select: none;
    pointer-events: none;
    font-size: 14px;
}


function oNumberTile(xTile = 30, yTile = 20, role = "", counter = 12) {
    let xPixel = oXTiletoPx(xTile);
    let yPixel = oYTiletoPx(yTile);
    let tmp = document.createElement("span");
    tmp.id = String(xTile) + String(yTile) + role + counter
    tmp.className = "numbertile"
    tmp.style.left = xPixel + 3 + 'px';
    tmp.style.top = yPixel - 13 + 'px';
    tmp.innerHTML = counter
    document.body.appendChild(tmp);
}

*/