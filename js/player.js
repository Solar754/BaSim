//{ Player - pl
var pl = {
    PathQueuePos: undefined,
    ShortestDistances: undefined,
    WayPoints: undefined,
    PathQueueX: undefined,
    PathQueueY: undefined,
    X: undefined,
    Y: undefined,
    ShouldPickupFood: undefined,
    StandStillCounter: undefined,
    RepairCountdown: undefined,
    RenderDistance: undefined,
    RenderArea: undefined
}
function plInit(x, y) {
    pl.X = x;
    pl.Y = y;
    pl.PathQueuePos = 0;
    pl.PathQueueX = [];
    pl.PathQueueY = [];
    pl.ShortestDistances = [];
    pl.WayPoints = [];
    pl.ShouldPickupFood = false;
    pl.StandStillCounter = 0;
    pl.RepairCountdown = 0;
}
function plTick() {
    ++pl.StandStillCounter;
    let prevX = pl.X;
    let prevY = pl.Y;

    if (pl.RepairCountdown > 0) {
        if (--pl.RepairCountdown === 0) {
            if (baIsNextToEastTrap(pl.X, pl.Y)) {
                ba.EastTrapCharges = 2;
            } else if (baIsNextToWestTrap(pl.X, pl.Y)) {
                ba.WestTrapCharges = 2;
            }
        }
    } else {
        if (pl.ShouldPickupFood) {
            let itemZone = mGetItemZone(pl.X >>> 3, pl.Y >>> 3);
            let foodIndex = itemZone.length;
            while (foodIndex--) {
                let item = itemZone[foodIndex];
                if (pl.X === item.x && pl.Y === item.y) {
                    itemZone.splice(foodIndex, 1);
                    break;
                }
            }
            pl.ShouldPickupFood = false;
        }
        // Having 2 if's is for moving twice per tick
        // Having 1 if's is for moving once per tick
        if (pl.PathQueuePos > 0) {
            pl.X = pl.PathQueueX[--pl.PathQueuePos];
            pl.Y = pl.PathQueueY[pl.PathQueuePos];
            if (pl.PathQueuePos > 0) {
                pl.X = pl.PathQueueX[--pl.PathQueuePos];
                pl.Y = pl.PathQueueY[pl.PathQueuePos];
            }
        }

    }
    if (prevX !== pl.X || prevY !== pl.Y) {
        pl.StandStillCounter = 0;
    }

    ba.CollectorX = ba.CollectorTargetX;
    ba.CollectorY = ba.CollectorTargetY;
}
function plDrawPlayer() {
    if (pl.X >= 0) {
        if (pl.RepairCountdown === 0) rSetDrawColor(240, 240, 240, 200);
        else rSetDrawColor(180, 180, 180, 200);
        rrFill(pl.X, pl.Y);
    }
    if (sim.ToggleRender.checked) {
        pl.RenderArea = [];
        plDrawRender(pl);
        plDrawRender({ X: ba.CollectorX, Y: ba.CollectorY });
    }
}
function plDrawRender(player) {
    if (player.X >= 0) {
        rSetDrawColor(0, 0, 0, 20);
        let startX = player.X - pl.RenderDistance;
        let startY = player.Y - pl.RenderDistance;
        let endX = player.X + pl.RenderDistance;
        let endY = player.Y + pl.RenderDistance;
        for (let x = startX; x <= endX; ++x) {
            if (x < 0 || x > 64) continue;
            for (let y = startY; y <= endY; ++y) {
                rrFill(x, y);
                pl.RenderArea.push([x, y]);
            }
        }
    }
}
function plPathfind(destX, destY) {
    for (let i = 0; i < m.mWidthTiles * m.mHeightTiles; ++i) {
        pl.ShortestDistances[i] = 99999999;
        pl.WayPoints[i] = 0;
    }
    pl.WayPoints[pl.X + pl.Y * m.mWidthTiles] = 99;
    pl.ShortestDistances[pl.X + pl.Y * m.mWidthTiles] = 0;
    pl.PathQueuePos = 0;
    let pathQueueEnd = 0;
    pl.PathQueueX[pathQueueEnd] = pl.X;
    pl.PathQueueY[pathQueueEnd++] = pl.Y;
    let currentX;
    let currentY;
    let foundDestination = false;
    while (pl.PathQueuePos !== pathQueueEnd) {
        currentX = pl.PathQueueX[pl.PathQueuePos];
        currentY = pl.PathQueueY[pl.PathQueuePos++];
        if (currentX === destX && currentY === destY) {
            foundDestination = true;
            break;
        }
        let newDistance = pl.ShortestDistances[currentX + currentY * m.mWidthTiles] + 1;
        let index = currentX - 1 + currentY * m.mWidthTiles;
        if (currentX > 0 && pl.WayPoints[index] === 0 && (m.mCurrentMap[index] & 19136776) === 0) {
            pl.PathQueueX[pathQueueEnd] = currentX - 1;
            pl.PathQueueY[pathQueueEnd++] = currentY;
            pl.WayPoints[index] = 2;
            pl.ShortestDistances[index] = newDistance;
        }
        index = currentX + 1 + currentY * m.mWidthTiles;
        if (currentX < m.mWidthTiles - 1 && pl.WayPoints[index] === 0 && (m.mCurrentMap[index] & 19136896) === 0) {
            pl.PathQueueX[pathQueueEnd] = currentX + 1;
            pl.PathQueueY[pathQueueEnd++] = currentY;
            pl.WayPoints[index] = 8;
            pl.ShortestDistances[index] = newDistance;
        }
        index = currentX + (currentY - 1) * m.mWidthTiles;
        if (currentY > 0 && pl.WayPoints[index] === 0 && (m.mCurrentMap[index] & 19136770) === 0) {
            pl.PathQueueX[pathQueueEnd] = currentX;
            pl.PathQueueY[pathQueueEnd++] = currentY - 1;
            pl.WayPoints[index] = 1;
            pl.ShortestDistances[index] = newDistance;
        }
        index = currentX + (currentY + 1) * m.mWidthTiles;
        if (currentY < m.mHeightTiles - 1 && pl.WayPoints[index] === 0 && (m.mCurrentMap[index] & 19136800) === 0) {
            pl.PathQueueX[pathQueueEnd] = currentX;
            pl.PathQueueY[pathQueueEnd++] = currentY + 1;
            pl.WayPoints[index] = 4;
            pl.ShortestDistances[index] = newDistance;
        }
        index = currentX - 1 + (currentY - 1) * m.mWidthTiles;
        if (currentX > 0 && currentY > 0 && pl.WayPoints[index] === 0 &&
            (m.mCurrentMap[index] & 19136782) == 0 &&
            (m.mCurrentMap[currentX - 1 + currentY * m.mWidthTiles] & 19136776) === 0 &&
            (m.mCurrentMap[currentX + (currentY - 1) * m.mWidthTiles] & 19136770) === 0) {
            pl.PathQueueX[pathQueueEnd] = currentX - 1;
            pl.PathQueueY[pathQueueEnd++] = currentY - 1;
            pl.WayPoints[index] = 3;
            pl.ShortestDistances[index] = newDistance;
        }
        index = currentX + 1 + (currentY - 1) * m.mWidthTiles;
        if (currentX < m.mWidthTiles - 1 && currentY > 0 && pl.WayPoints[index] === 0 &&
            (m.mCurrentMap[index] & 19136899) == 0 &&
            (m.mCurrentMap[currentX + 1 + currentY * m.mWidthTiles] & 19136896) === 0 &&
            (m.mCurrentMap[currentX + (currentY - 1) * m.mWidthTiles] & 19136770) === 0) {
            pl.PathQueueX[pathQueueEnd] = currentX + 1;
            pl.PathQueueY[pathQueueEnd++] = currentY - 1;
            pl.WayPoints[index] = 9;
            pl.ShortestDistances[index] = newDistance;
        }
        index = currentX - 1 + (currentY + 1) * m.mWidthTiles;
        if (currentX > 0 && currentY < m.mHeightTiles - 1 && pl.WayPoints[index] === 0 &&
            (m.mCurrentMap[index] & 19136824) == 0 &&
            (m.mCurrentMap[currentX - 1 + currentY * m.mWidthTiles] & 19136776) === 0 &&
            (m.mCurrentMap[currentX + (currentY + 1) * m.mWidthTiles] & 19136800) === 0) {
            pl.PathQueueX[pathQueueEnd] = currentX - 1;
            pl.PathQueueY[pathQueueEnd++] = currentY + 1;
            pl.WayPoints[index] = 6;
            pl.ShortestDistances[index] = newDistance;
        }
        index = currentX + 1 + (currentY + 1) * m.mWidthTiles;
        if (currentX < m.mWidthTiles - 1 && currentY < m.mHeightTiles - 1 && pl.WayPoints[index] === 0 &&
            (m.mCurrentMap[index] & 19136992) == 0 &&
            (m.mCurrentMap[currentX + 1 + currentY * m.mWidthTiles] & 19136896) === 0 &&
            (m.mCurrentMap[currentX + (currentY + 1) * m.mWidthTiles] & 19136800) === 0) {
            pl.PathQueueX[pathQueueEnd] = currentX + 1;
            pl.PathQueueY[pathQueueEnd++] = currentY + 1;
            pl.WayPoints[index] = 12;
            pl.ShortestDistances[index] = newDistance;
        }
    }
    if (!foundDestination) {
        let bestDistanceStart = 0x7FFFFFFF;
        let bestDistanceEnd = 0x7FFFFFFF;
        let deviation = 10;
        for (let x = destX - deviation; x <= destX + deviation; ++x) {
            for (let y = destY - deviation; y <= destY + deviation; ++y) {
                if (x >= 0 && y >= 0 && x < m.mWidthTiles && y < m.mHeightTiles) {
                    let distanceStart = pl.ShortestDistances[x + y * m.mWidthTiles];
                    if (distanceStart < 100) {
                        let dx = Math.max(destX - x);
                        let dy = Math.max(destY - y);
                        let distanceEnd = dx * dx + dy * dy;
                        if (distanceEnd < bestDistanceEnd || (distanceEnd === bestDistanceEnd && distanceStart < bestDistanceStart)) {
                            bestDistanceStart = distanceStart;
                            bestDistanceEnd = distanceEnd;
                            currentX = x;
                            currentY = y;
                            foundDestination = true;
                        }
                    }
                }
            }
        }
        if (!foundDestination) {
            pl.PathQueuePos = 0;
            return;
        }
    }
    pl.PathQueuePos = 0;
    while (currentX !== pl.X || currentY !== pl.Y) {
        let waypoint = pl.WayPoints[currentX + currentY * m.mWidthTiles];
        pl.PathQueueX[pl.PathQueuePos] = currentX;
        pl.PathQueueY[pl.PathQueuePos++] = currentY;
        if ((waypoint & 2) !== 0) {
            ++currentX;
        } else if ((waypoint & 8) !== 0) {
            --currentX;
        }
        if ((waypoint & 1) !== 0) {
            ++currentY;
        } else if ((waypoint & 4) !== 0) {
            --currentY;
        }
    }
}
//}