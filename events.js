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
var keys = { up: 38, down: 40, right: 39, left: 37, a: 65, s: 83, d: 68, w: 87, shift: 16, f: 70, space: 32, q: 81, z: 90, e: 69, r: 82, t: 84, c: 67, x: 88}
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

function threeDown(event) {
    event.preventDefault();
    mouseButton = event.button;
    mouseDown = true;
    mouseX = event.clientX;
    mouseY = event.clientY;
}

function threeUp(event) {
    event.preventDefault();
    mouseButton = -1;
    mouseDown = false;
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

function threeOut(event) {
    mouseDown = false;
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
    if (object.xGrip || object.yGrip || object.zGrip)
        object.visible = onoff && selectedPoint != null && object.parent.pointId == selectedPoint.pointId;
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

function changeGridSnapDistance(textbox) {
    snapDistance = parseInt(textbox.value);
    if (isNaN(snapDistance))
        snapDistance = 0;
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
    var simpleLines = [];
    lines.forEach((line) => {
        simpleLines.push({
            id1: line.id1,
            id2: line.id2,
            pos1: line.pos1,
            pos2: line.pos2
        });
    });
    textbox.value = JSON.stringify(simpleLines);
}

function loadJSON() {
    var textbox = document.getElementById('loadsave');
    var simpleLines = JSON.parse(textbox.value);
    if (simpleLines == null)
        return;

    var points = [];
    simpleLines.forEach((line) => {
        var pt1 = {pointId: line.id1, position: line.pos1};
        var pt2 = {pointId: line.id2, position: line.pos2};
        var pt1exists = false;
        var pt2exists = false;
        points.forEach((existing) => {
            if (existing.pointId == pt1.pointId)
                pt1exists = true;
            if (existing.pointId == pt2.pointId)
                pt2exists = true;
        });
        if (!pt1exists) {
            addPointXYZ(pt1);
            points.push(pt1);
        }
        if (!pt2exists) {
            addPointXYZ(pt2);
            points.push(pt2);
        }
    });
    simpleLines.forEach((line) => {
        createLine({pointId: line.id1, position: line.pos1}, {pointId: line.id2, position: line.pos2});
    })
}