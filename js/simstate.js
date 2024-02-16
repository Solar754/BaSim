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

// populate dummy instance with saved values
Object.prototype.update = function (obj) {
    Object.keys(obj).forEach((key) => {
        this[key] = obj[key];
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
    Object.keys(sim).forEach(key => {
        let simObj = sim[key];
        if (simObj instanceof HTMLElement || simObj instanceof NodeList) {
            state.sim[key] = simObj;
        } else {
            state.sim[key] = structuredClone(simObj);
        }
    });
    state.sim.WaveVal = sim.WaveSelect.value;
    state.sim.LevelVal = sim.DefLevelSelect.value;
    state.sim.HealerToggle = sim.ToggleHealers.checked;
    state.sim.TeamToggle = sim.SpawnTeam.checked;
    for (let cmd of cmdROLE_NAMES) {
        let cmdName = cmd + 'cmds';
        state.sim[cmdName] = document.getElementById(cmdName).value;
    }

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

    for (let cmd of cmdROLE_NAMES) {
        let cmdName = cmd + 'cmds';
        document.getElementById(cmdName).value = state.sim[cmdName];
    }

    ba = structuredClone(state["ba"]);
    pl = structuredClone(state["pl"]);
    m.mItemZones = structuredClone(state["m"].mItemZones);
    sim.update(state["sim"]);

    cmd.Team = [];
    state["cmd"].Team.forEach(player => {
        let tmpPlayer;
        if (player.Role == "heal") {
            tmpPlayer = new phPlayerHealer();
        }
        else {
            tmpPlayer = new cmdTeammate();
        }
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
