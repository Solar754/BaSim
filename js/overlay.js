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

function oDrawRolePath(rolename, xTile, yTile) {
    let textarea = document.getElementById(`${rolename}cmds`);
    textarea.value += `${xTile},${yTile}\n`;
    let color = cmd[`${rolename}Color`];
    rSetDrawColor(...color.slice(0, 3), 90);
    rrFill(xTile, yTile);
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
-- adding text next to a dropped food (mDrawItems)

if (item.isGood === true) {
    let xPixel = rXtoPx(item.x);
    let yPixel = rYtoPx(item.y);

    let tmp = document.createElement("strong");
    tmp.innerHTML = "3"
    tmp.id = String(item.x) + String(item.y)
    tmp.className = "food"
    tmp.style.margin = '0';
    tmp.style.position = 'absolute';
    tmp.style.left = xPixel + 8 + 'px';
    tmp.style.top = yPixel - 12 + 'px';
    document.body.appendChild(tmp);
}

*/