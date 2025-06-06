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
const RUNNER_RED_CLR = [240, 10, 10, 127];
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

function hexToRgb(hex) {
    hex = hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i
        , (m, r, g, b) => '#' + r + r + g + g + b + b)
        .substring(1).match(/.{2}/g)
        .map(x => parseInt(x, 16));
    hex.push(255); //alpha
    return hex;
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
        let tileExists = this.tiles.filter(e => (e.includes(`[${xTile},${yTile}`)));
        if (tileExists.length > 0) {
            this.tiles = this.tiles.filter(e => e !== tileExists[0]);
        } else {
            let strTileTuple = JSON.stringify([xTile, yTile, this.currentColorRGB, this.currentColorHex]);
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
            markedTilesArr = markedTilesArr.filter(t => t[3] == tileFilter);
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
        alert("Tiles copied to clipboard    -   " + runeliteTiles);
    };
    this.import = function (importedTiles) {
        try {
            importedTiles = JSON.parse(importedTiles);
            let curHex = this.currentColorHex;
            let curRgb = this.currentColorRGB;
            this.fetch();
            let region = (m.mCurrentMap == mWAVE10) ? 7508 : 7509;
            for (let i of importedTiles) {
                if (i.regionId != region) continue;
                let importX = i.regionX;
                let importY = i.regionY - 8;
                this.currentColorHex = "#" + i.color.slice(3);
                this.currentColorRGB = hexToRgb(this.currentColorHex);

                let tileExists = this.tiles.filter(e => (e.includes(`[${importX},${importY}`)));
                if (tileExists.length > 0) {
                    this.tiles = this.tiles.filter(e => e !== tileExists[0]);
                }
                this.push(importX, importY);
            }
            this.currentColorHex = curHex;
            this.currentColorRGB = curRgb;
        }
        catch (err) {
            console.log(err);
            alert("Import failed.");
        }
    };
    this.clear = function () {
        this.tiles = [];
        localStorage.removeItem(this.getStorageName());
    };
    this.updateHTMLColorList = function () {
        let markedTilesArr = [...this.tiles].map(JSON.parse);
        markedTilesArr = [...new Set(markedTilesArr.map(item => (item[3] || this.currentColorHex)))];

        let parent = document.getElementById("exportsubmenu");
        let children = parent.childNodes;
        while (children.length > 0) {
            children[0].parentNode.removeChild(children[0]);
        }

        let allTilesSpan = document.createElement("span");
        allTilesSpan.setAttribute("name", parent.getAttribute("label"));
        allTilesSpan.innerHTML = "[All] ";
        allTilesSpan.value = "all";
        parent.appendChild(allTilesSpan);
        allTilesSpan.onclick = function (e) {
            oMarkedTiles.export(allTilesSpan.value);
        }

        for (let color of markedTilesArr) {
            let newHTMLSpan = document.createElement("span");
            newHTMLSpan.setAttribute("name", parent.getAttribute("label"));
            newHTMLSpan.value = color;
            newHTMLSpan.onclick = function (e) {
                oMarkedTiles.export(newHTMLSpan.value);
            }

            let newHTMLColor = document.createElement("input");
            newHTMLColor.classList.add("colorpicker");
            newHTMLColor.type = "color";
            newHTMLColor.disabled = true;
            newHTMLColor.value = color;

            parent.appendChild(newHTMLSpan);
            newHTMLSpan.appendChild(newHTMLColor);
        }
    }
};

function oMarkerOptsOnClick(e) {
    let markerColor = document.getElementById("markercolor");
    markerColor.onclick = function (e) {
        let colorPicker = document.getElementById("markercolorpicker");
        colorPicker.click();
    }
    let markerClear = document.getElementById("markerclear");
    markerClear.onclick = function (e) {
        oMarkedTiles.clear();
        simDraw();
    }
    let markerImport = document.getElementById("markerimport");
    markerImport.onclick = function (e) {
        let importedTiles = e.target.previousElementSibling;
        oMarkedTiles.import(importedTiles.value);
        importedTiles.value = "";
        simDraw();
    }
}

function oUpdateMarkerColor(e) {
    oMarkedTiles.currentColorHex = e.target.value;
    oMarkedTiles.currentColorRGB = hexToRgb(e.target.value);
}

function oDrawYellowClick(e) {
    let yellowClick = document.getElementsByClassName("yellow-click");
    if (yellowClick.length) {
        yellowClick[0].remove();
    }
    yellowClick = document.createElement("div");
    yellowClick.className = "yellow-click"
    yellowClick.style.left = `${e.clientX - 6}px`;
    yellowClick.style.top = `${e.clientY - 6}px`;
    document.body.appendChild(yellowClick);
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
                /*
                let eggImg = document.createElement("img");
                eggImg.className = "egg";
                eggImg.src = "css/" + EGG_MAP[egg.type].src;
                eggImg.draggable = false;
                document.body.appendChild(eggImg);
                eggImg.style.left = (cannon[0] + EGG_MAP[egg.type].x) + `px`;
                eggImg.style.top = cannon[1] + `px`;
                */
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
        "def": DEFENDER_CLR.slice(0, 3).concat([opacity]),
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
    instructionsElement.id = "rules-finish";
    instructionsElement.classList.add("instructions")
    instructionsElement.readOnly = true;
    instructionsElement.style.resize = "none";
    instructionsElement.style.width = rr.CanvasWidth + "px";
    instructionsElement.style.height = rr.CanvasHeight + "px";
    instructionsElement.innerHTML = `Goal
    Kill all the runners in as few moves as possible from waves 1-10. 
    
    Begin by clicking the 'Generate' button. When all runners are dead, the points will
    stop and the 'Next' button will be available.

    Once the food counter in the top left hits 0, additional food incurs a larger penalty.

    Can Remove/Retry/Reroll ${num_retries_remaining} times.
        Remove a runner by id 2 ticks after the button is pressed
        Retry restarts the wave with the same seed
        Reroll re-generates the seed

    Unlock will allow wave change and access to the seed.


Lose conditions
    2+ raas
    Penalty > ${PENALTY_CAP}


Notes
    No reserves
    Collector is available
    Traps have 3 charges
    States are inconsistent
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
    subwrapper2Split.classList.add("tmpbrsplit");

    let instructionsExist = document.querySelectorAll('.instructions').length > 0;
    if (canvasElement.style.display === "none") {
        canvasElement.style.display = "inline";
        document.querySelectorAll('.instructions').forEach(e => e.style.display = "none");
    }
    else {
        canvasElement.style.display = "none";
        if (instructionsExist) {
            document.querySelectorAll('.instructions').forEach(e => e.style.display = "inline-grid");
            document.getElementsByClassName("tmpbrsplit")[0]?.remove();
        }
        else {
            canvasElement.parentNode.insertBefore(wrapper, canvasElement);
            wrapper.appendChild(subwrapper1);
            wrapper.appendChild(subwrapper2);
            subwrapper1.appendChild(instructionsElement);
        }
    }
}
//}