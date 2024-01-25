//{ Food - f
function fFood(x = -1, y = -1, isGood = -1, id = -1) {
    this.x = x;
    this.y = y;
    this.isGood = isGood;
    this.id = id;
    if (this.isGood) {
        this.colorRed = 0;
        this.colorGreen = 255;
    } else {
        this.colorRed = 255;
        this.colorGreen = 0;
    }
    this.colorBlue = 0;
    this.colorAlpha = 127;
}
//}
//{ Log - l
function lLog(x = -1, y = -1, logType = -1, id = -1) {
    this.x = x;
    this.y = y;
    this.id = id;
    this.logType = logType
    this.colorRed = 160;
    this.colorGreen = 82;
    this.colorBlue = 45;
    this.colorAlpha = 255;
}
//}