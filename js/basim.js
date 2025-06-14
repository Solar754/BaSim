/*
* Main controller, manage user actions
*/
'use strict';

const HTML_CANVAS = "basimcanvas";
const HTML_RUNNER_MOVEMENTS = "runnermovements";
const HTML_RUNNER_SPAWNS = "runnerspawns";
const HTML_HEALER_SPAWNS = "healerspawns";
const HTML_CANNON_SHOTS = "cannonshots";
const HTML_TOGGLE_HEALERS = "togglehealers";
const HTML_TOGGLE_RENDER = "togglerender";
const HTML_TOGGLE_MARKER = "togglemarker";
const HTML_MARKER_COLOR = "markercolorpicker";
const HTML_SAVE_BUTTON = "savestate";
const HTML_LOAD_BUTTON = "loadstate";
const HTML_START_BUTTON = "wavestart";
const HTML_PAUSE_BUTTON = "wavepause";
const HTML_STEP_BUTTON = "wavestep";
const HTML_STEP_BACKWARD_BUTTON = "wavestepback";
const HTML_WAVE_SELECT = "waveselect";
const HTML_TICK_COUNT = "tickcount";
const HTML_SECONDS_COUNT = "secondscount";
const HTML_DEF_LEVEL_SELECT = "deflevelselect";
const HTML_RUNNER_TABLE = "runnertable";
const HTML_HEALER_TABLE = "healertable";
const HTML_TOGGLE_TEAM = "toggleteam";
const HTML_ROLE_MARKER = "rolemarker";
const HTML_TOGGLE_ROLE_MARKER_NUMBERS = "rolemarkernumbers";
const HTML_TOGGLE_IGNORE_HEALER = "ignorehealer";
const HTML_UPDATE_DEF_MARKERS = "defupdatemarkers";
const HTML_THEME_BUTTON = "themebtn";
const HTML_AUTOPLAY_BUTTON = "autoplay";

var cursorX, cursorY;

window.onload = simInit;

//{ Simulation - sim
function simInit() {
	let canvas = document.getElementById(HTML_CANVAS);
	sim.MovementsInput = document.getElementById(HTML_RUNNER_MOVEMENTS);
	sim.MovementsInput.onchange = (e) => simMovementsInputWatcher();
	sim.MovementsInput.onkeypress = function (e) {
		if (e.key === " ") {
			e.preventDefault();
		}
		else if (e.key === "l") {
			return false;
		}
	};
	sim.RunnerSpawns = document.getElementById(HTML_RUNNER_SPAWNS);
	sim.RunnerSpawns.onkeypress = function (e) {
		if (e.key === " ") {
			e.preventDefault();
		}
	};
	sim.HealerSpawns = document.getElementById(HTML_HEALER_SPAWNS);
	sim.HealerSpawns.onkeypress = function (e) {
		if (e.key === " ") {
			e.preventDefault();
		}
	};
	sim.CannonQueue = document.getElementById(HTML_CANNON_SHOTS);
	sim.CannonQueue.onkeypress = function (e) {
		if (e.key === " ") {
			e.preventDefault();
		}
	};
	sim.StartStopButton = document.getElementById(HTML_START_BUTTON);
	sim.StartStopButton.onclick = simStartStopButtonOnClick;
	sim.PauseResumeButton = document.getElementById(HTML_PAUSE_BUTTON);
	sim.PauseResumeButton.onclick = simPauseResumeButtonOnClick;
	sim.StepButton = document.getElementById(HTML_STEP_BUTTON);
	sim.StepButton.onclick = simStepButtonOnClick;
	sim.StepBackwardButton = document.getElementById(HTML_STEP_BACKWARD_BUTTON);
	sim.StepBackwardButton.onclick = simStepBackwardButtonOnClick;
	sim.WaveSelect = document.getElementById(HTML_WAVE_SELECT);
	sim.WaveSelect.onchange = simWaveSelectOnChange;
	sim.DefLevelSelect = document.getElementById(HTML_DEF_LEVEL_SELECT);
	sim.DefLevelSelect.onchange = simDefLevelSelectOnChange;
	sim.ToggleHealers = document.getElementById(HTML_TOGGLE_HEALERS);
	sim.ToggleHealers.onchange = simToggleHealersOnChange;
	sim.ToggleRender = document.getElementById(HTML_TOGGLE_RENDER);
	sim.ToggleRender.onchange = simToggleRenderOnChange;

	sim.TickCountSpan = document.getElementById(HTML_TICK_COUNT);
	sim.SecondsCountSpan = document.getElementById(HTML_SECONDS_COUNT);
	sim.RunnerTable = document.getElementById(HTML_RUNNER_TABLE);
	sim.HealerTable = document.getElementById(HTML_HEALER_TABLE);

	let MarkerEvent = document.getElementById(HTML_TOGGLE_MARKER);
	MarkerEvent.onchange = (e) => { sim.MarkerMode = MarkerEvent.checked; }
	let colorPicker = document.getElementById(HTML_MARKER_COLOR);
	colorPicker.oninput = oUpdateMarkerColor;
	oMarkerOptsOnClick();

	sim.SaveState = document.getElementById(HTML_SAVE_BUTTON);
	sim.SaveState.onclick = simSaveStateOnClick;
	sim.LoadState = document.getElementById(HTML_LOAD_BUTTON);
	sim.LoadState.onclick = simLoadStateOnClick;
	sim.SpawnTeam = document.getElementById(HTML_TOGGLE_TEAM);
	sim.SpawnTeam.onchange = simToggleTeamOnClick;

	sim.AllRoleMarkers = document.getElementsByName(HTML_ROLE_MARKER);
	sim.AllRoleMarkers.forEach(m => m.onclick = simToggleOnlyOneRoleMarker);
	let clearCmds = document.getElementsByName("clearcmds");
	clearCmds.forEach(m => m.onclick = cmdClearPath);
	sim.IncludeRoleNumbers = document.getElementById(HTML_TOGGLE_ROLE_MARKER_NUMBERS);
	sim.IncludeRoleNumbers.onclick = (e) => { oDrawAllRolePaths(); }
	sim.ToggleIgnoreHealer = document.getElementById(HTML_TOGGLE_IGNORE_HEALER);
	sim.RecordDefButton = document.getElementById(HTML_UPDATE_DEF_MARKERS);
	sim.RecordDefButton.onclick = updateMarkersFromStateHistory;

	updateSettingsOnClick();

	// dark mode theme
	document.getElementById(HTML_THEME_BUTTON).onclick = oFlipThemeOnClick;
	if (localStorage.getItem("basimTheme") == "⚫") oFlipThemeOnClick();

	document.getElementById(HTML_AUTOPLAY_BUTTON).onclick = function (e) {
		if (!sim.IsRunning) {
			sim.LoadState.click();
		}
		stateHistory.index = 0;
		sim.StepBackwardButton.click();
		sim.AutoplayTimerId = setInterval(iterateStates, 600);
		for (let state of stateHistory.states) {
			state.sim.AutoplayTimerId = sim.AutoplayTimerId;
		}
	}

	simSetRunning(false);

	rInit(canvas, 64 * 12, 48 * 12);
	rrInit(12);
	mInit(mWAVE_1_TO_9, 64, 48);
	ruInit(5);
	oEggsInit();
	simReset();
	window.onkeydown = simWindowOnKeyDown;
	canvas.onmousedown = simCanvasOnMouseDown;
	canvas.onmousemove = (e) => {
		cursorX = e.clientX;
		cursorY = e.clientY;
	}
	canvas.oncontextmenu = function (e) {
		e.preventDefault();
	};
}
function simUpdateRunnerTable() {
	if (!sim.IsRunning) {
		sim.RunnerTable.style.display = "none";
		return;
	}
	// Generate table body
	let tableBody = document.createElement("tbody");
	for (let i = 0; i < ba.Runners.length; ++i) {
		let runner = ba.Runners[i];
		let tableRow = document.createElement("tr");
		let td = document.createElement("td");
		td.innerHTML = runner.id;
		tableRow.appendChild(td);
		td = document.createElement("td");
		td.innerHTML = runner.cycleTick;
		tableRow.appendChild(td);
		td = document.createElement("td");
		td.innerHTML = runner.targetState;
		tableRow.appendChild(td);
		td = document.createElement("td");
		td.innerHTML = runner.hp + "/5";
		tableRow.appendChild(td);
		td = document.createElement("td");
		td.innerHTML = "(" + runner.x + ", " + runner.y + ")";
		tableRow.appendChild(td);
		td = document.createElement("td");
		td.innerHTML = "(" + runner.destinationX + ", " + runner.destinationY + ")";
		tableRow.appendChild(td);
		td = document.createElement("td");
		if (runner.foodTarget !== null) td.innerHTML = "#" + runner.foodTarget.id;
		else td.innerHTML = "None";
		tableRow.appendChild(td);
		td = document.createElement("td");
		td.innerHTML = runner.chat;
		tableRow.appendChild(td);
		tableBody.appendChild(tableRow);
	}
	let previousBody = sim.RunnerTable.getElementsByTagName("tbody")[0];
	if (previousBody) sim.RunnerTable.removeChild(previousBody);
	sim.RunnerTable.appendChild(tableBody);
	sim.RunnerTable.style.display = "table";
}
function simUpdateHealerTable() {
	if (!sim.IsRunning || !sim.ToggleHealers.checked) {
		sim.HealerTable.style.display = "none";
		return;
	}
	// Generate table body
	let tableBody = document.createElement("tbody");
	for (let i = 0; i < ba.Healers.length; ++i) {
		let healer = ba.Healers[i];
		let tableRow = document.createElement("tr");
		let td = document.createElement("td");
		td.innerHTML = healer.id;
		tableRow.appendChild(td);
		td = document.createElement("td");
		if (healer.isTargetingPlayer)
			td.innerHTML = healer.playerTarget.Role;
		else if (healer.isTargetingCollector)
			td.innerHTML = "collector";
		else if (healer.isTargetingRunner)
			td.innerHTML = "runner";
		else
			td.innerHTML = "";
		tableRow.appendChild(td);
		td = document.createElement("td");
		td.innerHTML = healer.lastTarget || "";
		tableRow.appendChild(td);
		td = document.createElement("td");
		td.innerHTML = healer.sprayTimer;
		tableRow.appendChild(td);
		td = document.createElement("td");
		td.innerHTML = healer.isPsned;
		tableRow.appendChild(td);
		td = document.createElement("td");
		td.innerHTML = healer.hp + "/" + baHEALER_HEALTH[sim.WaveSelect.value];
		tableRow.appendChild(td);
		td = document.createElement("td");
		td.innerHTML = "(" + healer.x + ", " + healer.y + ")";
		tableRow.appendChild(td);
		td = document.createElement("td");
		td.innerHTML = "(" + healer.destinationX + ", " + healer.destinationY + ")";
		tableRow.appendChild(td);
		tableBody.appendChild(tableRow);
	}
	let previousBody = sim.HealerTable.getElementsByTagName("tbody")[0];
	if (previousBody) sim.HealerTable.removeChild(previousBody);
	sim.HealerTable.appendChild(tableBody);
	sim.HealerTable.style.display = "table";
}
function simReset(clearHistory) {
	if (sim.IsRunning) {
		clearInterval(sim.TickTimerId);
	}
	simSetRunning(false);
	sim.CurrentFoodId = 0;
	baInit(0, 0, "");
	plInit(-1, 0);
	simDraw();
	mDrawLogs();
	if (clearHistory) {
		stateHistory.clear();
	}
}
function simSetRunning(running) {
	if (running) {
		sim.IsRunning = true;
		sim.StartStopButton.innerHTML = "Stop Wave";
		sim.PauseResumeButton.style = "display: inline-block";
	} else {
		sim.IsRunning = false;
		sim.StartStopButton.innerHTML = "Start Wave";
		sim.PauseResumeButton.style = "display: none";
	}
	sim.SaveState.disabled = !sim.IsRunning;
	simSetPause(false);
	simUpdateRunnerTable();
	simUpdateHealerTable();
}
function simSetPause(pause) {
	if (pause) {
		sim.IsPaused = true;
		sim.PauseResumeButton.innerHTML = "Resume";
		sim.StepButton.style = "display: inline-block";
		sim.StepBackwardButton.style = "display: inline-block";
	} else {
		sim.IsPaused = false;
		sim.PauseResumeButton.innerHTML = "Pause";
		sim.StepButton.style = "display: none";
		sim.StepBackwardButton.style = "display: none";
	}
}
function simPauseResumeButtonOnClick() {
	if (sim.IsRunning) {
		if (sim.IsPaused) {
			sim.TickTimerId = setInterval(simTick, 600);
			simSetPause(false);
			//cmdUncheckAllRoles();
		} else {
			clearInterval(sim.TickTimerId);
			simSetPause(true);
		}
	}
}
function simStepButtonOnClick() {
	if (!(sim.IsRunning && sim.IsPaused)) {
		return;
	}

	if (stateHistory.peek()) {
		loadSaveState(stateHistory.forward());
	} else {
		simTick();
	}
}
function simStepBackwardButtonOnClick() {
	clearInterval(sim.AutoplayTimerId);
	const state = stateHistory.backward();
	if (!state) {
		return;
	}
	loadSaveState(state);
}

function simStartStopButtonOnClick() {
	if (sim.IsRunning) {
		mResetMap();
		simReset(true);
	} else {
		let movements = simParseMovementsInput();
		let runnerSpawns = simParseSpawnsInput(sim.RunnerSpawns);
		let healerSpawns = simParseSpawnsInput(sim.HealerSpawns);
		if (movements === null) {
			alert("Invalid runner movements. Example: ws-s");
			return;
		}
		if (runnerSpawns === null || healerSpawns === null) {
			alert("Invalid spawn intervals. Example: 11,21,31\n" +
				"Force healer targets with m/2/c/d. Example 11:mc,21:h");
			return;
		}
		let cannonQueue = simParseCannonInput(sim.CannonQueue);
		if (cannonQueue === null) {
			alert("Invalid cannon syntax.\nExample: wrr,1,51 (West Runner Red, 1 egg, tick 51)")
			return;
		}
		simSetRunning(true);
		simSetPause(false);
		let maxRunnersAlive = 0;
		let totalRunners = 0;
		let maxHealersAlive = 0;
		let totalHealers = 0;
		let wave = sim.WaveSelect.value;
		switch (Number(wave)) {
			case 1:
				maxRunnersAlive = 2;
				totalRunners = 2;
				maxHealersAlive = 2;
				totalHealers = 2;
				break;
			case 2:
				maxRunnersAlive = 2;
				totalRunners = 3;
				maxHealersAlive = 3;
				totalHealers = 3;
				break;
			case 3:
				maxRunnersAlive = 2;
				totalRunners = 4;
				maxHealersAlive = 2;
				totalHealers = 3;
				break;
			case 4:
				maxRunnersAlive = 3;
				totalRunners = 4;
				maxHealersAlive = 3;
				totalHealers = 4;
				break;
			case 5:
				maxRunnersAlive = 4;
				totalRunners = 5;
				maxHealersAlive = 4;
				totalHealers = 5;
				break;
			case 6:
				maxRunnersAlive = 4;
				totalRunners = 6;
				maxHealersAlive = 4;
				totalHealers = 6;
				break;
			case 7:
			case 10:
				maxRunnersAlive = 5;
				totalRunners = 6;
				maxHealersAlive = 4;
				totalHealers = 7;
				break;
			case 8:
				maxRunnersAlive = 5;
				totalRunners = 7;
				maxHealersAlive = 5;
				totalHealers = 7;
				break;
			case 9:
				maxRunnersAlive = 5;
				totalRunners = 9;
				maxHealersAlive = 6;
				totalHealers = 8;
				break;
		}
		baInit(maxRunnersAlive, totalRunners, maxHealersAlive, totalHealers, movements, runnerSpawns, healerSpawns, cannonQueue);
		if (m.mCurrentMap === mWAVE10) {
			plInit(baWAVE10_DEFENDER_SPAWN_X, baWAVE10_DEFENDER_SPAWN_Y);
		} else {
			plInit(baWAVE1_DEFENDER_SPAWN_X, baWAVE1_DEFENDER_SPAWN_Y);
		}
		if (sim.SpawnTeam.checked) {
			cmdInit();
		}
		console.log("Wave " + wave + " started!");
		simTick();
		if (!sim.IsPaused)
			sim.TickTimerId = setInterval(simTick, 600);
	}
	//cmdUncheckAllRoles();
}
function simMovementsInputWatcher() {
	ba.runnerMovements = simParseMovementsInput();
	ba.Runners.forEach(runner => {
		let movementIndex = runner.id - 1;
		if (movementIndex < ba.runnerMovements.length) {
			runner.runnerRNG.forcedMovements = ba.runnerMovements[movementIndex];
		}
	});
}
function simParseMovementsInput() {
	let movements = sim.MovementsInput.value.split("-");
	for (let i = 0; i < movements.length; ++i) {
		let moves = movements[i];
		for (let j = 0; j < moves.length; ++j) {
			let move = moves[j];
			if (move !== "" && move !== "s" && move !== "w" && move !== "e") {
				return null;
			}
		}
	}
	return movements;
}
function simParseSpawnsInput(mobSpawns) {
	let spawns = mobSpawns.value.split(",");
	if (mobSpawns.value.includes("-")) {
		spawns = mobSpawns.value.split("-");
	}
	spawns = [...new Set(spawns)].filter(Boolean);
	for (let i = 0; i < spawns.length; ++i) {
		let strToStandard = spawns[i].split(":");
		strToStandard = {
			time: parseFloat(strToStandard[0]),
			target: strToStandard[1]?.toLowerCase() || undefined
		}
		if (!Number.isInteger(strToStandard.time) || !+strToStandard.time) {
			return null;
		}
		spawns[i] = strToStandard;
	}
	spawns = spawns.sort((a, b) => { return a.time - b.time; });
	return spawns;
}
function simParseCannonInput(eggs) {
	// TODO allow update while sim is running
	// expected: wrr,1,51-wrr,1,51 OR wrr,1,51-1,51
	if (!eggs.value) return [];
	let cannonCmds = [];
	let players = eggs.value.split("-");
	for (let player of players) {
		let cmds = player.split(",");
		let id = cannonCmds.length;
		try {
			if (cmds.length < 3) {
				let prev = cannonCmds.length - 1;
				cannonCmds.push({
					"id": id,
					"cannon": cannonCmds[prev].cannon,
					"penance": cannonCmds[prev].penance,
					"eggType": cannonCmds[prev].eggType,
					"numEggs": parseInt(cmds[0]),
					"tick": parseInt(cmds[1]),
					"stalled": 0,
				});
			}
			else {
				let instr = cmds[0].split('');
				cannonCmds.push({
					"id": id,
					"cannon": instr[0],
					"penance": instr[1],
					"eggType": instr[2],
					"numEggs": parseInt(cmds[1]),
					"tick": parseInt(cmds[2]),
					"stalled": 0,
				});
			}
		} catch (err) { return null; }
	}
	return cannonCmds;
}
function simWindowOnKeyDown(e) { // food_drop
	if (document.activeElement.tagName === "INPUT" ||
		document.activeElement.tagName === "TEXTAREA") {
		return;
	}

	if (sim.IsRunning && pl.RepairCountdown === 0) {
		if (e.key === "r") {
			mAddItem(new fFood(pl.X, pl.Y, true, ++sim.CurrentFoodId));
			pl.Actions.good++;
		} else if (e.key === "w") {
			mAddItem(new fFood(pl.X, pl.Y, false, ++sim.CurrentFoodId));
			pl.Actions.bad++;
		} else if (e.key === "e" && pl.TargetX == -1) {
			pl.ShouldPickupFood = true;
			plPathfind(pl, pl.X, pl.Y);
			pl.Actions.pickup++;
		} else if (e.key === "t" && pl.TargetX == -1) {
			if (baIsNextToEastTrap(pl.X, pl.Y) && ba.EastTrapCharges < 2) {
				plPathfind(pl, pl.X, pl.Y);
				pl.RepairCountdown = 5;
				if (pl.StandStillCounter === 0) ++pl.RepairCountdown;
			} else if (baIsNextToWestTrap(pl.X, pl.Y) && ba.WestTrapCharges < 2) {
				plPathfind(pl, pl.X, pl.Y);
				pl.RepairCountdown = 5;
				if (pl.StandStillCounter === 0) ++pl.RepairCountdown;
			}
			pl.Actions.repair++;
		} else if (e.key === "q") {
			let canvasRect = rr.Canvas.getBoundingClientRect();
			let xTile = Math.trunc((cursorX - canvasRect.left) / rrTileSize);
			let yTile = Math.trunc((canvasRect.bottom - 1 - cursorY) / rrTileSize);
			oDrawYellowClick({ "clientX": cursorX, "clientY": cursorY });
			if (mCanMoveToTile(xTile, yTile)) {
				pl.ShouldPickupFood = false;
				pl.PathQueuePos = 0;
				pl.PathQueueX = [];
				pl.PathQueueY = [];
				pl.TargetX = xTile;
				pl.TargetY = yTile;
			}
		}
	}
	if (sim.IsRunning && e.key === "s") {
		simSaveStateOnClick();
	}
	else if (e.key === "l") {
		simLoadStateOnClick();
	}
	else if (e.key === " " || e.key === "Space") {
		simStartStopButtonOnClick();
		e.preventDefault();
	}
	// Toggle pause/resume with 'g' key
	else if (e.key === "g" && sim.IsRunning) {
		simPauseResumeButtonOnClick();
		e.preventDefault();
	}
	// Add hotkeys for step forward/backward
	else if (e.key === "f" && sim.IsRunning) {
		if (!sim.IsPaused)
			simPauseResumeButtonOnClick();
		simStepButtonOnClick();
		e.preventDefault();
	}
	else if (e.key === "d" && sim.IsRunning) {
		simStepBackwardButtonOnClick();
		e.preventDefault();
	}
}
function simCanvasOnMouseDown(e) {
	var canvasRect = rr.Canvas.getBoundingClientRect();
	let xTile = Math.trunc((e.clientX - canvasRect.left) / rrTileSize);
	let yTile = Math.trunc((canvasRect.bottom - 1 - e.clientY) / rrTileSize);

	// add coordinate to textarea on click
	for (let role of cmdROLE_NAMES) {
		let id = `${role}togglemarker`;
		if (document.getElementById(id).checked && sim.SpawnTeam.checked) {
			cmdUpdateRolePath(role, xTile, yTile);
			return;
		}
	}

	if (sim.MarkerMode) {
		if (e.button === 0) {
			oMarkedTiles.push(xTile, yTile);
			simDraw();
		}
	}
	else if (e.button === 0 && pl.RepairCountdown === 0) {
		pl.ShouldPickupFood = false;
		if (pl.TargetX == -1) plPathfind(pl, xTile, yTile);
		oDrawYellowClick(e);
	} else if (e.button === 2 && !sim.SpawnTeam.checked) {
		if (xTile === ba.CollectorX && yTile === ba.CollectorY) {
			ba.CollectorTargetX = -1;
			ba.CollectorTargetY = -1;
		} else {
			ba.CollectorTargetX = xTile;
			ba.CollectorTargetY = yTile;
		}
		oDrawYellowClick(e);
	}
}
function simWaveSelectOnChange(e) {
	if (sim.WaveSelect.value === "10") {
		mInit(mWAVE10, 64, 48);
	} else {
		mInit(mWAVE_1_TO_9, 64, 48);
	}
	simReset(e);
}
function simDefLevelSelectOnChange(e) {
	mResetMap();
	simReset(e);
	ruInit(Number(sim.DefLevelSelect.value));
}
function simToggleHealersOnChange(e) {
	mResetMap();
	simReset(e);
}
function simToggleRenderOnChange(e) {
	simDraw();
}
function simToggleTeamOnClick(e) {
	if (sim.SpawnTeam.checked) {
		document.getElementById("teammatetable").style.display = "table";
	}
	else {
		document.getElementById("teammatetable").style.display = "none";
	}
	//cmdUncheckAllRoles();
	mResetMap();
	simReset(e);
}
function simToggleOnlyOneRoleMarker(e) {
	let originalVal = e.target.checked;
	cmdUncheckAllRoles();
	e.target.checked = originalVal;
	if (e.target.checked) {
		//if (!sim.IsPaused)
		//	sim.PauseResumeButton.click();
		oDrawAllRolePaths();
	}
	else {
		simDraw();
	}
}
function simSaveStateOnClick() {
	console.log("Saving state...");
	if (!sim.IsPaused)
		sim.PauseResumeButton.click();
	window.state = {
		current: stateHistory.current(),
		history: [...stateHistory.states],
		historyIndex: stateHistory.index
	};
}
function simLoadStateOnClick() {
	if (!window.state?.current) {
		return;
	}
	stateHistory.clear();
	stateHistory.pushState(...window.state.history)
	stateHistory.index = window.state.historyIndex;
	loadSaveState(window.state.current);
}
function simTick() {
	baTick();
	plTick();
	cmdTick();
	simDraw();
	simUpdateRunnerTable();
	simUpdateHealerTable();
	stateHistory.pushState(buildSaveState());
	if (sim.RecordDefButton.getAttribute("stoptick") == ba.TickCounter) {
		if (pl.Movements.length > 0 && sim.SpawnTeam.checked) {
			sim.PauseResumeButton.click();
		}
	}
}
function simDraw() {
	mDrawMap();
	baDrawDetails();
	mDrawItems();
	baDrawEntities();
	plDrawPlayer();
	cmdDrawTeam();
	mDrawGrid();
	baDrawOverlays();
	oMarkedTiles.draw();
	oDrawEggs();
	rPresent();
}
var sim = {
	TickTimerId: undefined,
	AutoplayTimerId: undefined,
	MovementsInput: undefined,
	RunnerSpawns: undefined,
	HealerSpawns: undefined,
	CannonQueue: undefined,
	SaveState: undefined,
	LoadState: undefined,
	StartStopButton: undefined,
	PauseResumeButton: undefined,
	StepButton: undefined,
	WaveSelect: undefined,
	DefLevelSelect: undefined,
	TickCountSpan: undefined,
	SecondsCountSpan: undefined,
	IsRunning: undefined,
	IsPaused: undefined,
	ruSniffDistance: undefined,
	RunnerTable: undefined,
	RunnerTableBody: undefined, // unused
	HealerTable: undefined,
	HealerTableBody: undefined, // unused
	CurrentFoodId: undefined,
	ToggleHealers: undefined,
	ToggleRender: undefined,
	MarkerMode: false,
	SpawnTeam: undefined,
	AllRoleMarkers: undefined,
	IncludeRoleNumbers: undefined,
	ToggleIgnoreHealer: undefined,
	RecordDefButton: undefined,
}
//}
