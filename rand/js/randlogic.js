/*
TODO
- keep track of total pts in local storage

w1
    2 runners, normal rng
w2 
    3 runners, normal rng
w3
    3 runners, bad rng (4/6 west 2/6 south)
w4
    3 runners, normal rng
    can go into states 2/3
w5
    4 runners, good rng (no west, 2/6 east)
w6
    3 runners, normal rng, offset
w7
    4 runners, normal rng, 2 offset
w8
    5 runners, normal rng, offset, blue
w9
    5 runners, bad rng (3/6 west 2/6 south), blue
    can go into states 2/3
w10
    4 runners, normal rng
    can go into states 2/3
    reduced lure range
*/

const MAX_TICKS = 64;
const SEED_NUM_RUNNERS = 10;
const SEED_NUM_RND = 500;

var totalPoints = 0;
var num_retries_remaining = 4;
var num_chomp = 0;
var num_blugh = 0;
var num_raa = 0;
var num_kill = 0;

let unlockBtn = document.getElementById("unlock");
let generateBtn = document.getElementById("generate");
let nextBtn = document.getElementById("nextwave");
let rerollBtn = document.getElementById("reroll");
let retryBtn = document.getElementById("retry");
let killBtn = document.getElementById("killrunner");
let pointswrapper = document.getElementById("pointswrapper");
let pointsCounter = document.getElementById("pointscounter");

function gameLogicEntry() {
    sim.WaveSelect.value = 1;
    sim.WaveSelect.setAttribute("disabled", true);
    simWaveSelectOnChange();
    oInstructions();

    unlockBtn.checked = false;
    unlockBtn.onchange = unlockOnChange;

    generateBtn.onclick = generateScenario;

    nextBtn.setAttribute("disabled", true);
    nextBtn.onclick = nextWave;

    rerollBtn.setAttribute("disabled", true);
    rerollBtn.onclick = function (e) {
        resetPoints();
        num_retries_remaining--;
        generateScenario();
        generateScenario();

        if (num_retries_remaining <= 0) {
            rerollBtn.setAttribute("disabled", true);
            retryBtn.setAttribute("disabled", true);
            killBtn.setAttribute("disabled", true);
            return;
        }
    }

    retryBtn.setAttribute("disabled", true);
    retryBtn.onclick = function (e) {
        let tmpSeed = sim.MovementsInput.value;
        resetPoints();
        num_retries_remaining--;
        simLoadStateOnClick();
        sim.MovementsInput.value = tmpSeed;

        if (num_retries_remaining <= 0) {
            rerollBtn.setAttribute("disabled", true);
            retryBtn.setAttribute("disabled", true);
            killBtn.setAttribute("disabled", true);
            return;
        }
    }

    killBtn.setAttribute("disabled", true);
    killBtn.onclick = function (e) {
        let id = Number(document.getElementById("killrunnerinput").value);
        let runner = ba.Runners.filter(r => r.id == id);
        try {
            runner[0].hp = 0;
            num_kill++;
            document.getElementById("killrunnerinput").value = "";
        } catch (e) { return; }

        num_retries_remaining--;
        if (num_retries_remaining <= 0) {
            rerollBtn.setAttribute("disabled", true);
            retryBtn.setAttribute("disabled", true);
            killBtn.setAttribute("disabled", true);
            return;
        }
    }
}

function unlockOnChange(e) {
    if (unlockBtn.checked) {
        num_retries_remaining = 5000;
        sim.WaveSelect.removeAttribute("disabled");
        document.getElementById("seedwrapper").style.display = "";
    }
    else {
        location.reload();
    }
}

function generateScenario(e) {
    if (document.getElementById(HTML_CANVAS).style.display === "none") {
        oInstructions();
    }

    setupBlue();
    setLureRange();
    generateSeed();

    let startBtn = document.getElementById("wavestart");
    let pauseBtn = document.getElementById("wavepause");
    let stepforwardBtn = document.getElementById("wavestep");
    startBtn.click();
    pauseBtn.click();
    for (let i = 0; i < MAX_TICKS - 1; i++) {
        stepforwardBtn.click();
    }

    generateBtn.setAttribute("disabled", true);
    if (num_retries_remaining > 0) {
        rerollBtn.removeAttribute("disabled");
        retryBtn.removeAttribute("disabled");
        killBtn.removeAttribute("disabled");
    }
    simSaveStateOnClick();
}

// preloading random movements so it's the same every retry
function generateSeed() {
    let seed = "";
    let wave = sim.WaveSelect.value;
    for (let i = 0; i < SEED_NUM_RUNNERS; i++) {
        for (let j = 0; j < SEED_NUM_RND; j++) {
            let rnd = Math.floor(Math.random() * 6); // 0-5

            if (wave == "3") {
                if (rnd >= 0 && rnd <= 1) // 2/6
                    seed += "s";
                else if (rnd >= 2) // 4/6
                    seed += "w";
            }
            else if (wave == "5") {
                if (rnd >= 0 && rnd <= 1) // 2/6
                    seed += "e";
                else if (rnd >= 2) // 4/6
                    seed += "s";
            }
            else if (wave == "9") {
                if (rnd >= 0 && rnd <= 1) // 2/6
                    seed += "s";
                else if (rnd >= 2 && rnd <= 4) // 3/6
                    seed += "w";
                else // 1/6
                    seed += "e";
            }
            else { // normal
                if (rnd >= 0 && rnd <= 3) // 4/6
                    seed += "s";
                else if (rnd >= 4 && rnd <= 4) // 1/6
                    seed += "w";
                else // 1/6
                    seed += "e";
            }
        }
        seed += "-";
    }
    sim.MovementsInput.value = seed;
}

function iterState(state) {
    let wave = sim.WaveSelect.value;
    if (wave == "4" || wave == "9" || wave == "10") {
        ++state;
        if (state > 3) {
            state = 1;
        }
    }
    else { // never enter states 2/3
        ++state;
        if (state > 1) {
            state = 1;
        }
    }
    return state;
}

function offsetSpawns() {
    let wave = sim.WaveSelect.value;
    if (wave == "6") {
        if (ba.TickCounter == 26) {
            let runner = baSpawnRunner();
            runner.toggleRed = true;
        }
    }
    else if (wave == "7") {
        if (ba.TickCounter == 16 || ba.TickCounter == 26) {
            let runner = baSpawnRunner();
            runner.toggleRed = true;
        }
    }
    else if (wave == "8") {
        if (ba.TickCounter == 26) {
            let runner = baSpawnRunner();
            runner.toggleRed = true;
        }
    }
}

function setupBlue() {
    let wave = sim.WaveSelect.value;
    if (wave == "8" || wave == "9") {
        sim.CannonQueue.value = "wrb,1," + MAX_TICKS;
    }
}

function randomRunnerId() {
    return Math.floor(Math.random() * ba.TotalRunners);
}

function setLureRange() {
    let wave = sim.WaveSelect.value;
    if (wave == "10") {
        sim.DefLevelSelect.value = "4";
        simDefLevelSelectOnChange();
    } else {
        sim.DefLevelSelect.value = "5";
        simDefLevelSelectOnChange();
    }
}

function resetPoints() {
    num_chomp = 0;
    num_blugh = 0;
    num_raa = 0;
    num_kill = 0;
    pointsCounter.innerHTML = 0;
    stateHistory.clear();
}

function loseConditions() {
    if (num_raa > 1) {
        alert("Too many raa's");
        location.reload();
    }
}

function printPoints() {
    let tmp = document.getElementById("tmp-space");
    if (tmp)
        tmp.remove();

    let printWavePoints = document.createElement("span");
    printWavePoints.id = "points_w" + sim.WaveSelect.value;
    printWavePoints.style.paddingRight = '25px';
    printWavePoints.innerHTML = "W" + sim.WaveSelect.value + ": " + pointsCounter.innerHTML;
    pointswrapper.appendChild(printWavePoints);

    totalPoints += parseInt(pointsCounter.innerHTML);
    resetPoints();
}

function checkRoundStatus() {
    if (ba.RunnersKilled == ba.TotalRunners) {
        nextBtn.removeAttribute("disabled");
        if (sim.WaveSelect.value == "10") {
            finish();
        }
        return;
    }

    let points = (num_raa * 20) + (num_blugh * 4) + (num_chomp * 2) + (num_kill * 50) + updateMarkersFromStateHistory();
    points += Math.floor(ba.TickCounter * 0.3) - Math.floor(MAX_TICKS * 0.3) - 2;
    pointsCounter.innerHTML = points;
}

function nextWave(e) {
    if (sim.WaveSelect.value == "10") {
        return;
    }

    printPoints();

    sim.WaveSelect.value = parseInt(sim.WaveSelect.value) + 1;
    simWaveSelectOnChange();
    simSaveStateOnClick();

    generateBtn.removeAttribute("disabled");
    nextBtn.setAttribute("disabled", true)
    rerollBtn.setAttribute("disabled", true);
    retryBtn.setAttribute("disabled", true);
    killBtn.setAttribute("disabled", true);
}

function finish() {
    if (unlockBtn.checked)
        return;

    printPoints();

    rerollBtn.setAttribute("disabled", true);
    retryBtn.setAttribute("disabled", true);
    killBtn.setAttribute("disabled", true);
    nextBtn.setAttribute("disabled", true);
    generateBtn.setAttribute("disabled", true);
    document.getElementById("wavestep").setAttribute("disabled", true);

    oInstructions();
    let instructions = document.getElementById("rules-finish");
    instructions.innerHTML = `Completed gz
    Total Penalty: ${totalPoints}

Wave Breakdown
    ${document.getElementById('points_w1').innerHTML}
    ${document.getElementById('points_w2').innerHTML}
    ${document.getElementById('points_w3').innerHTML}
    ${document.getElementById('points_w4').innerHTML}
    ${document.getElementById('points_w5').innerHTML}
    ${document.getElementById('points_w6').innerHTML}
    ${document.getElementById('points_w7').innerHTML}
    ${document.getElementById('points_w8').innerHTML}
    ${document.getElementById('points_w9').innerHTML}
    ${document.getElementById('points_w10').innerHTML}
    `
}