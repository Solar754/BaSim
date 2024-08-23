const MAX_TICKS = 64;
const SEED_NUM_RUNNERS = 6;
const SEED_NUM_RND = 500;
const PENALTY_CAP = 1000;
const BLUE_CD = 16;
const HISCORE_STORAGE = "basimHiscore";

var totalPoints = 0;
var num_retries_remaining = 4;
var num_chomp = 0;
var num_blugh = 0;
var num_raa = 0;
var num_kill = 0;

var expected_num_food = (n) => {
    switch (n) {
        case 1:
        case 2:
            return 6;
        case 3:
            return 9;
        case 4:
            return 10;
        case 5:
            return 12;
    }
};

var shuffled_spawns = [];
var expected_num_runners = () => {
    switch (Number(sim.WaveSelect.value)) {
        case 1:
            return 2;
        case 2:
            return 3;
        case 3:
            return 3;
        case 4:
            return 3;
        case 5:
            return 4;
        case 6:
            return 3;
        case 7:
            return 4;
        case 8:
            return 5;
        case 9:
            return 5;
        case 10:
            return 4;
    }
};

let foodCounterHTML = document.getElementById("foodcounter");
let unlockBtn = document.getElementById("unlock");
let generateBtn = document.getElementById("generate");
let nextBtn = document.getElementById("nextwave");
let rerollBtn = document.getElementById("reroll");
let retryBtn = document.getElementById("retry");
let killBtn = document.getElementById("killrunner");
let pointswrapper = document.getElementById("pointswrapper");
let pointsCounter = document.getElementById("pointscounter");
let viewHiscore = document.getElementById("viewhiscore");
let clearHiscore = document.getElementById("clearhiscore");

function gameLogicEntry() {
    sim.WaveSelect.value = 1;
    sim.WaveSelect.setAttribute("disabled", true);
    simWaveSelectOnChange();
    oInstructions();

    viewHiscore.onclick = viewHiscoreOnClick;
    clearHiscore.onclick = clearHiscoreOnClick;

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
    shuffled_spawns = shuffleRunnerSpawns();

    let startBtn = document.getElementById("wavestart");
    let pauseBtn = document.getElementById("wavepause");
    let stepforwardBtn = document.getElementById("wavestep");
    startBtn.click();
    pauseBtn.click();
    for (let i = 0; i < MAX_TICKS - 1; i++) {
        stepforwardBtn.click();
    }

    foodCounterHTML.innerHTML = expected_num_food(ba.TotalRunners);

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
                if (rnd >= 0 && rnd <= 0) // 1/6
                    seed += "e";
                else if (rnd >= 1) // 5/6
                    seed += "s";
            }
            else if (wave == "8" || wave == "10") {
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
    if (wave == "4" || wave == "8" || wave == "9") { // states 0/2
        ++state;
        if (state > 0) {
            state = 2;
        }
    }
    else if (wave == "5" || wave == "10") { // states 0/3
        ++state;
        if (state > 0) {
            state = 3;
        }
    }
    else if (wave == "2") { // states 0,1,2,3
        ++state;
        if (state > 3) {
            state = 1;
        }
    }
    else { // states 0/1
        ++state;
        if (state > 1) {
            state = 1;
        }
    }
    return state;
}

function shuffleRunnerSpawns() {
    let array = [11]; // list of spawn times
    let wave = sim.WaveSelect.value;
    for (let i = 1; i < expected_num_runners(); i++) {
        let nextSpawn = array[array.length - 1] + 10;
        array.push(nextSpawn);
    }

    // coinflip delay last spawn
    let delayLastSpawn = Math.floor(Math.random() * 2);
    if (delayLastSpawn) {
        array[array.length - 1] = array[array.length - 1] + 10;
    }

    // shuffle
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    // choose offset runners
    if (wave == "6") {
        array[0] = array[0] - 5;
    }
    else if (wave == "7") {
        array[0] = array[0] - 5;
        array[1] = array[1] - 5;
    }
    else if (wave == "9") {
        array[0] = array[0] - 5;
        array[1] = array[1] - 5;
    }
    else if (wave == "10") {
        array[0] = array[0] - 5;
    }

    return array;
}

function setupBlue() {
    let wave = sim.WaveSelect.value;
    if (wave == "8" || wave == "9") {
        sim.CannonQueue.value = "wrb,1," + MAX_TICKS;
    }
    else {
        sim.CannonQueue.value = "";
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
    foodCounterHTML.innerHTML = expected_num_food(ba.TotalRunners);
    stateHistory.clear();
}

function loseConditions() {
    if (num_raa > 1) {
        alert("Too many raa's");
        location.reload();
    }
    else if ((Number(pointsCounter.innerHTML) + totalPoints) > PENALTY_CAP) {
        alert("Penalty exceeded " + PENALTY_CAP);
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

    let points = (num_raa * 100) + (num_chomp * 2) + (num_kill * 100) + updateMarkersFromStateHistory();
    points += Math.floor(ba.TickCounter * 0.3) - Math.floor(MAX_TICKS * 0.3) - 2;

    let foodDebt = Number(foodCounterHTML.innerHTML);
    if (foodDebt < 0) {
        points += Math.abs(foodDebt) * 25;
    }

    pointsCounter.innerHTML = points;
}

function nextWave(e) {
    if (sim.WaveSelect.value == "10") {
        return;
    }

    printPoints();
    foodCounterHTML.innerHTML = "?";

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

    let completionPoints = Math.max(PENALTY_CAP - totalPoints, 0);

    let overallHiscore = localStorage.getItem(HISCORE_STORAGE);
    if (overallHiscore) overallHiscore = JSON.parse(overallHiscore);

    oInstructions();
    let instructions = document.getElementById("rules-finish");
    instructions.innerHTML = `Completed gz
    Total points: ${completionPoints}

Penalty breakdown
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

----------------------------------------------------------------
Current hiscore information
${(overallHiscore && overallHiscore.points >= completionPoints) ? overallHiscore.text : ""}
    `

    let results = {
        "points": completionPoints,
        "text": instructions.innerHTML
    }
    results.text = results.text.split('Completed gz')[1];
    results.text = results.text.split('----------------------------------------------------------------')[0];
    if (!overallHiscore || results.points > overallHiscore.points) {
        localStorage.setItem(HISCORE_STORAGE, JSON.stringify(results));
        alert("gz new hiscore@@");
    }
}

function viewHiscoreOnClick(e) {
    let overallHiscore = localStorage.getItem(HISCORE_STORAGE);
    if (!overallHiscore) return;
    overallHiscore = JSON.parse(overallHiscore);
    alert(overallHiscore.text)
}

function clearHiscoreOnClick(e) {
    if (confirm("Are you sure you want to clear your stored hiscore?"))
        localStorage.removeItem(HISCORE_STORAGE);
}