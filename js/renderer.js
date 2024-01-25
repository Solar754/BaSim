/*
* Render (pending drawn) updates to canvas
*/
//{ Renderer - r
const rPIXEL_ALPHA = 255 << 24;

//{ Renderer - r
function rInit(canvas, width, height) {
    rr.Canvas = canvas;
    rr.Context = canvas.getContext("2d");
    rResizeCanvas(width, height);
    rSetDrawColor(255, 255, 255, 255);
}
function rResizeCanvas(width, height) {
    rr.Canvas.width = width;
    rr.Canvas.height = height;
    rr.CanvasWidth = width;
    rr.CanvasHeight = height;
    rr.CanvasYFixOffset = (rr.CanvasHeight - 1) * rr.CanvasWidth;
    rr.ImageData = rr.Context.createImageData(width, height);
    rr.Pixels = new ArrayBuffer(rr.ImageData.data.length);
    rr.Pixels8 = new Uint8ClampedArray(rr.Pixels);
    rr.Pixels32 = new Uint32Array(rr.Pixels);
}
function rSetDrawColor(r, g, b, a) {
    rr.DrawColorRB = r | (b << 16);
    rr.DrawColorG = rPIXEL_ALPHA | (g << 8);
    rr.DrawColor = rr.DrawColorRB | rr.DrawColorG;
    rr.DrawColorA = a + 1;
}
function rClear() {
    let endI = rr.Pixels32.length;
    for (let i = 0; i < endI; ++i) {
        rr.Pixels32[i] = rr.DrawColor;
    }
}
function rPresent() {
    rr.ImageData.data.set(rr.Pixels8);
    rr.Context.putImageData(rr.ImageData, 0, 0);
}
function rDrawPixel(i) {
    let color = rr.Pixels32[i];
    let oldRB = color & 0xFF00FF;
    let oldAG = color & 0xFF00FF00;
    let rb = oldRB + (rr.DrawColorA * (rr.DrawColorRB - oldRB) >> 8) & 0xFF00FF;
    let g = oldAG + (rr.DrawColorA * (rr.DrawColorG - oldAG) >> 8) & 0xFF00FF00;
    rr.Pixels32[i] = rb | g;
}
function rDrawHorizontalLine(x, y, length) {
    let i = rXYToI(x, y)
    let endI = i + length;
    for (; i < endI; ++i) {
        rDrawPixel(i);
    }
}
function rDrawVerticalLine(x, y, length) {
    let i = rXYToI(x, y);
    let endI = i - length * rr.CanvasWidth;
    for (; i > endI; i -= rr.CanvasWidth) {
        rDrawPixel(i);
    }
}
function rSetFilledRect(x, y, width, height) {
    let i = rXYToI(x, y);
    let rowDelta = width + rr.CanvasWidth;
    let endYI = i - height * rr.CanvasWidth;
    while (i > endYI) {
        let endXI = i + width;
        for (; i < endXI; ++i) {
            rr.Pixels32[i] = rr.DrawColor;
        }
        i -= rowDelta;
    }
}
function rDrawFilledRect(x, y, width, height) {
    let i = rXYToI(x, y);
    let rowDelta = width + rr.CanvasWidth;
    let endYI = i - height * rr.CanvasWidth;
    while (i > endYI) {
        let endXI = i + width;
        for (; i < endXI; ++i) {
            rDrawPixel(i);
        }
        i -= rowDelta;
    }
}
function rDrawOutlinedRect(x, y, width, height) {
    rDrawHorizontalLine(x, y, width);
    rDrawHorizontalLine(x, y + height - 1, width);
    rDrawVerticalLine(x, y + 1, height - 2);
    rDrawVerticalLine(x + width - 1, y + 1, height - 2);
}
function rDrawCone(x, y, width) { // Not optimised to use i yet
    let lastX = x + width - 1;
    let endI = (width >>> 1) + (width & 1);
    for (let i = 0; i < endI; ++i) {
        rDrawPixel(rXYToI(x + i, y));
        rDrawPixel(rXYToI(lastX - i, y));
        ++y;
    }
}
function rXYToI(x, y) {
    return rr.CanvasYFixOffset + x - y * rr.CanvasWidth;
}
var rr = {
    Canvas: undefined,
    CanvasWidth: undefined,
    CanvasHeight: undefined,
    CanvasYFixOffset: undefined,
    Context: undefined,
    ImageData: undefined,
    Pixels: undefined,
    Pixels8: undefined,
    Pixels32: undefined,
    DrawColor: undefined,
    DrawColorRB: undefined,
    DrawColorG: undefined,
    DrawColorA: undefined
}
//}
