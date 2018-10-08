
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