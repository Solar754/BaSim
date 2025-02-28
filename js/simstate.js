/*
* Manage saved states, process loading stored state
*/
var state = {};

var stateHistory = new function () {
    const STATE_LIMIT = 1000;
    this.states = [];
    this.index = -1;
    this.pushState = function (...states) {
        this.states.splice(this.index + 1, Infinity, ...states);
        this.index += states.length;
        if (this.states.length > STATE_LIMIT) {
            const deleteCount = this.states.length - STATE_LIMIT;
            this.states.splice(0, deleteCount);
            this.index -= deleteCount;
        }
    };
    this.current = function () {
        return this.states[this.index];
    };
    this.peek = function () {
        return this.states[this.index + 1];
    };
    this.latest = function () {
        return this.states[this.states.length - 1];
    };
    this.forward = function () {
        let index = this.index + 1;
        if (index >= this.states.length) {
            index = this.states.length - 1;
        }
        this.index = index;
        return this.states[index];
    };
    this.backward = function () {
        if (this.states.length <= 0) {
            this.index = -1;
            return undefined;
        }
        let index = this.index - 1;
        if (index < 0) {
            index = 0;
        }
        this.index = index;
        return this.states[index];
    };
    this.clear = function () {
        this.states.length = 0;
        this.index = -1;
    };
};

function iterateStates() {
    if (stateHistory.current() == stateHistory.latest()) {
        clearInterval(sim.AutoplayTimerId);
        return;
    }
    sim.StepButton.click()
}

// populate dummy instance with saved values
Object.prototype.update = function (obj) {
    Object.keys(obj).forEach((key) => {
        try {
            this[key] = structuredClone(obj[key]);
        }
        catch (err) { // mostly HTML elements
            this[key] = obj[key];
        }
    });
    return this;
}

function buildSaveState() {
    const state = {};

    // npc stuff
    state.ba = structuredClone(ba);

    // player stuff
    state.pl = structuredClone(pl);
    state.cmd = structuredClone(cmd);

    // map stuff
    // Save a bit of memory not deep-copying the map image since it's set to
    // constant values (either the 1-9 map ref or the 10 map ref)
    state.m = {
        ...structuredClone(Object.assign({}, m, {
            mCurrentMap: undefined
        })),
        mCurrentMap: m.mCurrentMap
    };

    // all the other things
    state.sim = {};
    state.sim.update(sim);
    state.sim.WaveVal = sim.WaveSelect.value;
    state.sim.LevelVal = sim.DefLevelSelect.value;
    state.sim.HealerToggle = sim.ToggleHealers.checked;
    state.sim.TeamToggle = sim.SpawnTeam.checked;

    return state;
}

function loadSaveState(state) {
    if (Object.keys(state).length === 0) {
        return;
    }
    console.log("Loading state...");

    sim.DefLevelSelect.value = state["sim"].LevelVal;
    simDefLevelSelectOnChange();
    sim.WaveSelect.value = state["sim"].WaveVal;
    simWaveSelectOnChange();
    sim.ToggleHealers.checked = state["sim"].HealerToggle;
    sim.SpawnTeam.checked = state["sim"].TeamToggle;
    simToggleTeamOnClick();

    ba = structuredClone(state["ba"]);
    pl = structuredClone(state["pl"]);
    m.mItemZones = structuredClone(state["m"].mItemZones);
    sim.update(state["sim"]);

    cmd.Team = [];
    state["cmd"].Team.forEach(player => {
        let tmpPlayer;
        //if (player.Role == "heal") {
        tmpPlayer = new phPlayerHealer();
        //}
        //else {
        //    tmpPlayer = new cmdTeammate();
        //}
        tmpPlayer.update(player);
        cmd.Team.push(tmpPlayer);
    });

    ba.Healers = [];
    state["ba"].Healers.forEach(healer => {
        let tmpH = new heHealer();
        tmpH.update(healer);
        ba.Healers.push(tmpH);
    });

    ba.Runners = []
    state["ba"].Runners.forEach(runner => {
        let tmpR = new ruRunner();
        let tmpRNG = new rngRunnerRNG();
        tmpR.update(runner);
        tmpRNG.update(runner.runnerRNG);
        tmpR.runnerRNG = tmpRNG;
        tmpR.foodTarget = structuredClone(runner.foodTarget);
        ba.Runners.push(tmpR);
    });
    simMovementsInputWatcher();

    // html
    if (state == stateHistory.latest() || !stateHistory.latest()) {
        sim.TickCountSpan.innerHTML = ba.TickCounter;
    } else {
        sim.TickCountSpan.innerHTML = `${ba.TickCounter} / ${stateHistory.latest().ba.TickCounter}`;
    }
    sim.SecondsCountSpan.innerHTML = tickToSecond(ba.TickCounter);
    simSetRunning(true);
    simSetPause(true);
    simToggleRenderOnChange();
    simDraw();

    sim.MarkerMode = document.getElementById(HTML_TOGGLE_MARKER).checked;
}

function updateSettingsOnClick(e) {
    let settingsImport = document.getElementById("settingsimport");
    settingsImport.onclick = function (e) {
        let allSettings = e.target.previousElementSibling;
        try {
            let parsedSettings = JSON.parse(allSettings.value);
            sim.DefLevelSelect.value = parsedSettings.level;
            sim.WaveSelect.value = parsedSettings.wave;
            sim.MovementsInput.value = parsedSettings.runnerMovements;
            sim.RunnerSpawns.value = parsedSettings.runnerSpawns;
            sim.HealerSpawns.value = parsedSettings.healerSpawns;
            sim.CannonQueue.value = parsedSettings.eggs;
            sim.SpawnTeam.checked = parsedSettings.toggleTeam;
            sim.ToggleHealers.checked = parsedSettings.toggleHealers;
            sim.ToggleRender.checked = parsedSettings.toggleRender;
            sim.IncludeRoleNumbers.checked = parsedSettings.toggleRoleNumbers;
            sim.ToggleIgnoreHealer.checked = parsedSettings.toggleIgnoreHealer;
            for (let role of cmdROLE_NAMES) {
                document.getElementById(`${role}cmds`).value = parsedSettings.team[role];
            }
            simDefLevelSelectOnChange();
            simWaveSelectOnChange();
            simToggleTeamOnClick();
            oDrawAllRolePaths();
            stateHistory.clear();
        } catch (err) {
            console.log(err);
            alert("Import failed.");
        }
        allSettings.value = "";
    }
    let settingsExport = document.getElementById("settingsexport");
    settingsExport.onclick = function (e) {
        let allSettings = {
            "level": sim.DefLevelSelect.value,
            "wave": sim.WaveSelect.value,
            "runnerMovements": sim.MovementsInput.value,
            "runnerSpawns": sim.RunnerSpawns.value,
            "healerSpawns": sim.HealerSpawns.value,
            "eggs": sim.CannonQueue.value,
            "toggleTeam": sim.SpawnTeam.checked,
            "toggleHealers": sim.ToggleHealers.checked,
            "toggleRender": sim.ToggleRender.checked,
            "toggleRoleNumbers": sim.IncludeRoleNumbers.checked,
            "toggleIgnoreHealer": sim.ToggleIgnoreHealer.checked,
            "team": {}
        };
        for (let role of cmdROLE_NAMES) {
            allSettings.team[role] = document.getElementById(`${role}cmds`).value;
        }
        allSettings = JSON.stringify(allSettings);
        navigator.clipboard.writeText(allSettings);
        console.log(allSettings);
        alert("Settings copied to clipboard    -   " + allSettings);
    }
}