//{ RsRenderer - rr
function rrInit(tileSize) {
    rrTileSize = tileSize;
}
function rrSetTileSize(size) {
    rrTileSize = size;
}
function rrSetSize(widthTiles, heightTiles) {
    rrWidthTiles = widthTiles;
    rrHeightTiles = heightTiles;
    rResizeCanvas(rrTileSize * rrWidthTiles, rrTileSize * rrHeightTiles);
}
function rrFillOpaque(x, y) {
    rSetFilledRect(x * rrTileSize, y * rrTileSize, rrTileSize, rrTileSize);
}
function rrFill(x, y) {
    rDrawFilledRect(x * rrTileSize, y * rrTileSize, rrTileSize, rrTileSize);
}
function rrFillBig(x, y, width, height) {
    rDrawFilledRect(x * rrTileSize, y * rrTileSize, width * rrTileSize, height * rrTileSize);
}
function rrOutline(x, y) {
    rDrawOutlinedRect(x * rrTileSize, y * rrTileSize, rrTileSize, rrTileSize);
}
function rrOutlineBig(x, y, width, height) {
    rDrawOutlinedRect(x * rrTileSize, y * rrTileSize, rrTileSize * width, rrTileSize * height);
}
function rrWestLine(x, y) {
    rDrawVerticalLine(x * rrTileSize, y * rrTileSize, rrTileSize);
}
function rrWestLineBig(x, y, length) {
    rDrawHorizontalLine(x * rrTileSize, y * rrTileSize, rrTileSize * length)
}
function rrEastLine(x, y) {
    rDrawVerticalLine((x + 1) * rrTileSize - 1, y * rrTileSize, rrTileSize);
}
function rrEastLineBig(x, y, length) {
    rDrawVerticalLine((x + 1) * rrTileSize - 1, y * rrTileSize, rrTileSize * length);
}
function rrSouthLine(x, y) {
    rDrawHorizontalLine(x * rrTileSize, y * rrTileSize, rrTileSize);
}
function rrSouthLineBig(x, y, length) {
    rDrawHorizontalLine(x * rrTileSize, y * rrTileSize, rrTileSize * length);
}
function rrNorthLine(x, y) {
    rDrawHorizontalLine(x * rrTileSize, (y + 1) * rrTileSize - 1, rrTileSize);
}
function rrNorthLineBig(x, y, length) {
    rDrawHorizontalLine(x * rrTileSize, (y + 1) * rrTileSize - 1, rrTileSize * length);
}
function rrCone(x, y) {
    rDrawCone(x * rrTileSize, y * rrTileSize, rrTileSize);
}
function rrFillItem(x, y) {
    let padding = rrTileSize >>> 2;
    let size = rrTileSize - 2 * padding;
    rDrawFilledRect(x * rrTileSize + padding, y * rrTileSize + padding, size, size);
}
var rrTileSize;
//}