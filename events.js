// Disable right click context menu
document.addEventListener('contextmenu', event => event.preventDefault());

// Handle keypresses
// Use like:
// if (keys.w in keysDown)
// for any time w is down
// or
// if (keys.w in keysUp)
// for when w is released.
var keysDown = [];
var keysUp = []; // Cleared every update.
var keys = { up: 38, down: 40, right: 39, left: 37, a: 65, s: 83, d: 68, w: 87, shift: 16, f: 70, space: 32, q: 81, z: 90, e: 69, r: 82, t: 84, c: 67, x: 88, b:66, v: 86, g: 71}
addEventListener("keydown", function(e) {
    keysDown[e.keyCode] = true;
    delete keysUp[e.keyCode];
}, false);

addEventListener("keyup", function(e) {
    delete keysDown[e.keyCode];
    keysUp[e.keyCode] = true;
}, false);

addEventListener("resize", function(e) {
    width = threediv.clientWidth;
    height = threediv.clientHeight;
    renderer.setSize(width, height);
    var zoom = realCamera.zoom;
    realCamera = new THREE.OrthographicCamera(width / -scale, width / scale, height / scale, height / -scale, 0, 4000);
    camera.add(realCamera);
    realCamera.translateZ(2000);
    cam.add(camera);
    realCamera.zoom = zoom;
    realCamera.updateProjectionMatrix();
    scene.add(cam);
}, false);

// Handle mouse clicks
var mouseButton = -1;
var mouseX;
var mouseY;
var mouseDX = 0;
var mouseDY = 0;
var mouseDZ = 0; // Scroll wheel
var mouseDown = false;
var mouseWasDown = false;

function threeDown(event) {
    event.preventDefault();
    mouseButton = event.button;
    mouseDown = true;
    mouseX = event.clientX;
    mouseY = event.clientY;
}

function threeUp(event) {
    event.preventDefault();
    mouseDown = false;
    mouseWasDown = true;
    pickedMoveAxis = AXIS.none;
    mouseX = event.clientX;
    mouseY = event.clientY;
    pickedObject = null;
}

function threeMove(event) {
    event.preventDefault();
    if (mouseDown) {
        mouseDX = mouseX - event.clientX;
        mouseDY = mouseY - event.clientY;
    }
    mouseX = event.clientX;
    mouseY = event.clientY;
}

function threeWheel(event) {
    mouseDZ = event.deltaY;
}

// Handle options in side pane
function toggleGrid(checkbox) {
    if (checkbox.checked) {
        scene.add(gridHelper);
    }
    else {
        scene.remove(gridHelper);
    }
}

function toggleAxes(checkbox) {
    if (checkbox.checked) {
        scene.add(originAxes);
    }
    else {
        scene.remove(originAxes);
    }
}

function toggleCameraAxes(checkbox) {
    if (checkbox.checked) {
        cam.add(camAxes);
    }
    else {
        cam.remove(camAxes);
    }
}

function togglePointControls(checkbox) {
    scene.children.forEach((child) => {
        togglePointControlsRecursive(child, checkbox.checked);
    });
}

function togglePointControlsRecursive(object, onoff) {
    if (object.pointCube)
        object.visible = onoff;
    if (object.xGrip || object.yGrip || object.zGrip) {
        var selected = false;
        selectedPoints.forEach((point) => {
            if (object.parent.pointId == point.pointId)
                selected = true;
        })
        object.visible = onoff && selected;
    }
    object.children.forEach((child) => {
        togglePointControlsRecursive(child, onoff);
    })
}

function toggleAutoConnect(checkbox) {
    autoConnect = checkbox.checked;
}

function toggleAutoSelect(checkbox) {
    autoSelect = checkbox.checked;
}

function toggleAutoDeselect(checkbox) {
    autoDeselect = checkbox.checked;
}

function toggleLightTheme(checkbox) {
    if (checkbox.checked) {
        currentLineMat = blackLineMat;
        lines.forEach((line) => {
            line.obj.material = blackLineMat;
        })
        scene.background = new THREE.Color( 0xffffff );
    }
    else {
        currentLineMat = whiteLineMat;
        lines.forEach((line) => {
            line.obj.material = whiteLineMat;
        })
        scene.background = new THREE.Color( 0x000000 );
    }
}

function changeGridSnapDistance(textbox) {
    // Digits only. The type="number" allows things like 'e' so do it by hand.
    textbox.value = textbox.value.replace(/[^\d]/,'');
    snapDistance = parseInt(textbox.value);
    if (isNaN(snapDistance))
        snapDistance = 0;
    textbox.value = snapDistance;
}

function selectMode() {
    clickMode = MODE.select;
    document.getElementById('currentMode').innerHTML = 'SELECT';
}

function connectMode() {
    clickMode = MODE.connect;
    document.getElementById('currentMode').innerHTML = 'CONNECT';
}

function disconnectMode() {
    clickMode = MODE.disconnect;
    document.getElementById('currentMode').innerHTML = 'DISCONNECT';
}

function deleteMode() {
    clickMode = MODE.delete;
    document.getElementById('currentMode').innerHTML = 'DELETE';
}

function boxSelectMode() {
    clickMode = MODE.boxSelect;
    document.getElementById('currentMode').innerHTML = 'BOX SELECT';
}

function extrudeSelected() {
    var selectedCopy = selectedPoints.slice();
    selectedCopy.forEach((selected) => {
        deselectPoint(selected);
    });
    var newPoints = [];
    var idMap = {};
    selectedCopy.forEach((pt) => {
        var pos = new THREE.Vector3(pt.position.x, pt.position.y, pt.position.z);
        var newPt = addPointXYZ({position: pos});
        newPoints.push(newPt);
        idMap[newPt.pointId] = pt.pointId;
        idMap[pt.pointId] = newPt.pointId;
    });
    newPoints.forEach((newPt) => {
        var connected = getConnectedPoints(getPointById(idMap[newPt.pointId]));
        connected.forEach((connect) => {
            var connectId = idMap[connect.pointId];
            var newConnPt = getPointById(connectId);
            if (newConnPt != null)
                createLine(newPt, newConnPt);
        });
        var prevPoint = getPointById(idMap[newPt.pointId]);
        createLine(newPt, prevPoint);
        selectPoint(newPt);
    });
}

function selectNoneAll() {
    var points = selectedPoints.slice();
    if (points.length > 0) {
        points.forEach((point) => {
            deselectPoint(point);
        });
    }
    else {
        scene.children.forEach((child) => {
            if (child.pointId)
                selectPoint(child);
        });
    }
}

function copySelected() {
    var selectedCopy = selectedPoints.slice();
    selectedCopy.forEach((selected) => {
        deselectPoint(selected);
    });
    var newPoints = [];
    var idMap = {};
    selectedCopy.forEach((pt) => {
        var pos = new THREE.Vector3(pt.position.x, pt.position.y, pt.position.z);
        var newPt = addPointXYZ({position: pos});
        newPoints.push(newPt);
        idMap[newPt.pointId] = pt.pointId;
        idMap[pt.pointId] = newPt.pointId;
    });
    newPoints.forEach((newPt) => {
        var connected = getConnectedPoints(getPointById(idMap[newPt.pointId]));
        connected.forEach((connect) => {
            var connectId = idMap[connect.pointId];
            var newConnPt = getPointById(connectId);
            if (newConnPt != null)
                createLine(newPt, newConnPt);
        });
        selectPoint(newPt);
    });
}

function mirrorXY() {
    var points = [];
    lines.forEach((line) => {
        var pt1exists = false;
        var pt2exists = false;
        points.forEach((p) => {
            if (p.oldId == line.id1)
                pt1exists = true;
            if (p.oldId == line.id2)
                pt2exists = true;
        });
        if (!pt1exists) {
            var newPos1 = new THREE.Vector3(line.pos1.x, line.pos1.y, -line.pos1.z);
            var pt1 = addPointXYZ({position: newPos1});
            points.push({pointId: pt1.pointId, oldId: line.id1, position: pt1.position});
        }
        if (!pt2exists) {
            var newPos2 = new THREE.Vector3(line.pos2.x, line.pos2.y, -line.pos2.z);
            var pt2 = addPointXYZ({position: newPos2});
            points.push({pointId: pt2.pointId, oldId: line.id2, position: pt2.position});
        }
    });
    lines.forEach((line) => {
        var newPt1 = null;
        var newPt2 = null;
        points.forEach((p) => {
            if (p.oldId == line.id1) {
                newPt1 = p;
            }
            if (p.oldId == line.id2) {
                newPt2 = p;
            }
        });
        if (newPt1 != null && newPt2 != null) {
            createLine({position: newPt1.position, pointId: newPt1.pointId}, 
                {position: newPt2.position, pointId: newPt2.pointId});
        }
    });
}

function saveJSON() {
    var textbox = document.getElementById('loadsave');
    var points = [];
    lines.forEach((line) => {
        var pt1 = {id: line.id1, pos: line.pos1, conn: []};
        var pt2 = {id: line.id2, pos: line.pos2, conn: []};
        var pt1exists = false;
        var pt2exists = false;
        points.forEach((existing) => {
            if (existing.id == pt1.id)
                pt1exists = true;
            if (existing.id == pt2.id)
                pt2exists = true;
        });
        if (!pt1exists) {
            points.push(pt1);
        }
        if (!pt2exists) {
            points.push(pt2);
        }
    });
    lines.forEach((line) => {
        points.forEach((point) => {
            if (line.id1 == point.id) {
                if (point.conn.indexOf(line.id2) < 0)
                    point.conn.push(line.id2);
            }
            if (line.id2 == point.id) {
                if (point.conn.indexOf(line.id1) < 0)
                    point.conn.push(line.id1);
            }
        })
    });
    textbox.value = JSON.stringify(points);
}

function loadJSON() {
    var textbox = document.getElementById('loadsave');
    var points = JSON.parse(textbox.value);
    points.forEach((point) => {
        var pt = {pointId: point.id, position: point.pos};
        addPointXYZ(pt);
    });
    points.forEach((point) => {
        point.conn.forEach((otherId) => {
            var other = null;
            points.forEach((candidate) => {
                if (candidate.id == otherId)
                    other = candidate;
            });
            if (other != null) {
                var pt1 = {pointId: point.id, position: point.pos};
                var pt2 = {pointId: other.id, position: other.pos};
                createLine(pt1, pt2);
            }
        });
    });
}