/*
* Create and manage team
*/
//{ Team Controller - cmd
const cmdROLE_NAMES = ["main", "second", "heal", "col", "def"];
var cmd = {
    Team: [],
};

function cmdTeammate(x, y, color, role = cmdROLE_NAMES[0]) {
    this.X = x;
    this.Y = y;
    this.PathQueuePos = 0;
    this.PathQueueX = [];
    this.PathQueueY = [];
    this.ShortestDistances = [];
    this.WayPoints = [];
    this.Role = role; // must be unique
    this.Color = color;
    this.Tiles = cmdParseTiles(role);
    this.TileIdx = 0;
    this.PrevTile = {
        X: x,
        Y: y,
    };
    this.CurrentDst = {
        X: x,
        Y: y,
        WaitUntil: 0
    };
}
cmdTeammate.prototype.tick = function () {
    this.PrevTile.X = this.X;
    this.PrevTile.Y = this.Y;
    if (this.PathQueuePos > 0) {
        this.X = this.PathQueueX[--this.PathQueuePos];
        this.Y = this.PathQueueY[this.PathQueuePos];
        if (this.PathQueuePos > 0) {
            this.X = this.PathQueueX[--this.PathQueuePos];
            this.Y = this.PathQueueY[this.PathQueuePos];
        }
    }
}
cmdTeammate.prototype.noMovement = function () {
    return (this.PrevTile.X == this.CurrentDst.X && this.PrevTile.Y == this.CurrentDst.Y);
}
cmdTeammate.prototype.pathfind = function () {
    if (ba.TickCounter <= 1) {
        return;
    }
    let arrived = (this.CurrentDst?.X === this.X && this.CurrentDst?.Y === this.Y);
    if (arrived && this.TileIdx < this.Tiles.length) {
        this.CurrentDst = this.Tiles[this.TileIdx++];
    }
    if (ba.TickCounter <= this.CurrentDst?.WaitUntil || this.noMovement()) {
        return;
    }
    plPathfind(this, this.CurrentDst.X, this.CurrentDst.Y);
}
cmdTeammate.prototype.draw = function () {
    if (this.X >= 0) {
        addColor(this.X, this.Y, rrFill, this.Color);
        addColor(this.X, this.Y, rrOutline, BLACK_CLR);
    }
}
function cmdInit() {
    if (m.mCurrentMap === mWAVE10) {
        cmd.Team.push(new cmdTeammate(
            baWAVE10_MAIN_SPAWN_X,
            baWAVE10_MAIN_SPAWN_Y,
            MAIN_CLR, "main"
        ));
        cmd.Team.push(new cmdTeammate(
            baWAVE10_2A_SPAWN_X,
            baWAVE10_2A_SPAWN_Y,
            SECOND_CLR, "second"
        ));
        cmd.Team.push(new phPlayerHealer(
            baWAVE10_PLAYER_HEALER_SPAWN_X,
            baWAVE10_PLAYER_HEALER_SPAWN_Y,
            PLAYER_HEAL_CLR, "heal"
        ));
        cmd.Team.push(new cmdTeammate(
            baWAVE10_COLLECTOR_SPAWN_X,
            baWAVE10_COLLECTOR_SPAWN_Y,
            COLLECTOR_CLR, "col"
        ));
    }
    else {
        cmd.Team.push(new cmdTeammate(
            baWAVE1_MAIN_SPAWN_X,
            baWAVE1_MAIN_SPAWN_Y,
            MAIN_CLR, "main"
        ));
        cmd.Team.push(new cmdTeammate(
            baWAVE1_2A_SPAWN_X,
            baWAVE1_2A_SPAWN_Y,
            SECOND_CLR, "second"
        ));
        cmd.Team.push(new phPlayerHealer(
            baWAVE1_PLAYER_HEALER_SPAWN_X,
            baWAVE1_PLAYER_HEALER_SPAWN_Y,
            PLAYER_HEAL_CLR, "heal"
        ));
        cmd.Team.push(new cmdTeammate(
            baWAVE1_COLLECTOR_SPAWN_X,
            baWAVE1_COLLECTOR_SPAWN_Y,
            COLLECTOR_CLR, "col"
        ));
    }
}
function cmdTick() {
    for (let player of cmd.Team) {
        player.Tiles = cmdParseTiles(player.Role);
        player.pathfind();
        player.tick();
    }
}
function cmdDrawTeam() {
    for (let player of cmd.Team) {
        player.draw();
    }
}
function cmdParseTiles(role) { // expected: x,y:tick
    if (role === "heal") {
        return phParseTiles();
    }
    let tiles = []
    let vals = document.getElementById(`${role}cmds`).value;
    vals = vals.split("\n");
    for (let input of vals) {
        if (!input) continue;
        input = input.split(/,|:/);
        let waitUntil = (input.length === 3) ? input[2] : 0;
        tiles.push({
            X: parseInt(input[0]),
            Y: parseInt(input[1]),
            WaitUntil: parseInt(waitUntil),
        });
    }
    return tiles;
}
function cmdUpdateRolePath(role, xTile, yTile) {
    let textarea = document.getElementById(`${role}cmds`);
    if (!ba.TickCounter) {
        textarea.value += `${xTile},${yTile}\n`;
    }
    else {
        textarea.value += `${xTile},${yTile}:${ba.TickCounter}\n`;
    }
    textarea.scrollTop = textarea.scrollHeight;
    oDrawAllRolePaths();
}
function cmdClearPath(e) {
    let id = e.target.getAttribute("for");
    let cmds = document.getElementById(id);
    cmds.value = "";
    if (id.includes("def")) {
        sim.RecordDefButton.removeAttribute("stoptick");
        toggleDefRecordColor(cmds.value);
    }
    oDrawAllRolePaths();
}
function cmdUncheckAllRoles() {
    sim.AllRoleMarkers.forEach(m => m.checked = false);
}
//}