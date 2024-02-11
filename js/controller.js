/*
TODO
- toggle to preserve team-specific tile indicators during run
- timeout for unreachable tiles
*/

//{ Team Controller - cmd
var cmd = {
    Team: [],
    mainColor: [240, 10, 10, 220],
    secondColor: [200, 50, 50, 220],
    healColor: [10, 240, 10, 220],
    colColor: [240, 240, 10, 200],
}
function cmdTeammate(x, y, tiles, color, role = "teammate") {
    this.X = x;
    this.Y = y;
    this.PathQueuePos = 0;
    this.PathQueueX = [];
    this.PathQueueY = [];
    this.ShortestDistances = [];
    this.WayPoints = [];
    this.Role = role; // must be unique
    this.Color = color;
    this.Tiles = tiles;
    this.TileIdx = 0;
    this.CurrentDst = {
        X: x,
        Y: y,
        tick: 0,
    };
}
cmdTeammate.prototype.tick = function () {
    // Having 2 if's is for moving twice per tick
    // Having 1 if's is for moving once per tick
    if (this.PathQueuePos > 0) {
        this.X = this.PathQueueX[--this.PathQueuePos];
        this.Y = this.PathQueueY[this.PathQueuePos];
        if (this.PathQueuePos > 0) {
            this.X = this.PathQueueX[--this.PathQueuePos];
            this.Y = this.PathQueueY[this.PathQueuePos];
        }
    }
}
cmdTeammate.prototype.pathfind = function () {
    if (ba.TickCounter <= 1) {
        return;
    }
    let arrived = (this.CurrentDst?.X === this.X && this.CurrentDst?.Y === this.Y);
    if ((!this.CurrentDst || arrived) && this.TileIdx < this.Tiles.length) {
        this.CurrentDst = this.Tiles[this.TileIdx++];
    }
    if (ba.TickCounter <= this.CurrentDst?.WaitUntil) {
        return;
    }
    if (this.CurrentDst && (arrived || this.CurrentDst?.WaitUntil !== 0)) {
        plPathfind(this, this.CurrentDst.X, this.CurrentDst.Y);
    }
}
cmdTeammate.prototype.draw = function () {
    if (this.X >= 0) {
        rSetDrawColor(...this.Color);
        rrFill(this.X, this.Y);
    }
}
function cmdInit() {
    if (m.mCurrentMap === mWAVE10) {
        cmd.Team.push(new cmdTeammate(
            baWAVE10_MAIN_SPAWN_X,
            baWAVE10_MAIN_SPAWN_Y,
            cmdParseTiles("maincmds"),
            cmd.mainColor, "main"
        ));
        cmd.Team.push(new cmdTeammate(
            baWAVE10_2A_SPAWN_X,
            baWAVE10_2A_SPAWN_Y,
            cmdParseTiles("secondcmds"),
            cmd.secondColor, "second"
        ));
        cmd.Team.push(new cmdTeammate(
            baWAVE10_PLAYER_HEALER_SPAWN_X,
            baWAVE10_PLAYER_HEALER_SPAWN_Y,
            cmdParseTiles("healcmds"),
            cmd.healColor, "heal"
        ));
        cmd.Team.push(new cmdTeammate(
            baWAVE10_COLLECTOR_SPAWN_X,
            baWAVE10_COLLECTOR_SPAWN_Y,
            cmdParseTiles("colcmds"),
            cmd.colColor, "col"
        ));
    }
    else {
        cmd.Team.push(new cmdTeammate(
            baWAVE1_MAIN_SPAWN_X,
            baWAVE1_MAIN_SPAWN_Y,
            cmdParseTiles("maincmds"),
            cmd.mainColor, "main"
        ));
        cmd.Team.push(new cmdTeammate(
            baWAVE1_2A_SPAWN_X,
            baWAVE1_2A_SPAWN_Y,
            cmdParseTiles("secondcmds"),
            cmd.secondColor, "second"
        ));
        cmd.Team.push(new cmdTeammate(
            baWAVE1_PLAYER_HEALER_SPAWN_X,
            baWAVE1_PLAYER_HEALER_SPAWN_Y,
            cmdParseTiles("healcmds"),
            cmd.healColor, "heal"
        ));
        cmd.Team.push(new cmdTeammate(
            baWAVE1_COLLECTOR_SPAWN_X,
            baWAVE1_COLLECTOR_SPAWN_Y,
            cmdParseTiles("colcmds"),
            cmd.colColor, "col"
        ));
    }
}
function cmdParseTiles(id) { // expected: x,y:tick
    let tiles = []
    let vals = document.getElementById(id).value;
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
    return tiles
}
function cmdClearPath(e) {
    let id = e.target.getAttribute("for");
    let cmds = document.getElementById(id);
    cmds.value = "";
    simDraw();
}
function cmdTick() {
    for (let player of cmd.Team) {
        player.Tiles = cmdParseTiles(`${player.Role}cmds`);
        player.pathfind();
        player.tick();
    }
}
function cmdDrawTeam() {
    for (let player of cmd.Team) {
        player.draw();
    }
}
//}