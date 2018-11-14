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
    mirrorSelection(1, 1, -1);
}
function mirrorXZ() {
    mirrorSelection(1, -1, 1);
}
function mirrorYZ() {
    mirrorSelection(-1, 1, 1);
}

function mirrorSelection(x, y, z) {
    var points = [];
    lines.forEach((line) => {
        var pt1exists = false;
        var pt2exists = false;
        var pt1selected = false;
        var pt2selected = false;
        points.forEach((p) => {
            if (p.oldId == line.id1)
                pt1exists = true;
            if (p.oldId == line.id2)
                pt2exists = true;
        });
        selectedPoints.forEach((p) => {
            if (p.pointId == line.id1)
                pt1selected = true;
            if (p.pointId == line.id2)
                pt2selected = true;
        });
        if (!pt1exists && pt1selected) {
            var newPos1 = new THREE.Vector3(line.pos1.x * x, line.pos1.y * y, line.pos1.z * z);
            var pt1 = addPointXYZ({position: newPos1});
            points.push({pointId: pt1.pointId, oldId: line.id1, position: pt1.position});
        }
        if (!pt2exists && pt2selected) {
            var newPos2 = new THREE.Vector3(line.pos2.x * x, line.pos2.y * y, line.pos2.z * z);
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

function scaleSelected() {
    var amount = parseFloat(document.getElementById('scale').value);
    var scaleX = document.getElementById('scalex').checked;
    var scaleY = document.getElementById('scaley').checked;
    var scaleZ = document.getElementById('scalez').checked;
    if (isNaN(amount))
        return;
    var orbit = new THREE.Object3D();
    var center = new THREE.Vector3();
    
    for (var i = 0; i < selectedPoints.length; i++)
        center.add(selectedPoints[i].position);
    var n = selectedPoints.length;
    center.multiplyScalar(1 / n);
    for (var i = 0; i < selectedPoints.length; i++) {
        orbit.add(selectedPoints[i]);
        selectedPoints[i].position.sub(center);
    }

    orbit.updateMatrixWorld();
    var positions = [];
    orbit.children.forEach((pt) => {
        var pos = new THREE.Vector3();
        pos.setFromMatrixPosition(pt.matrixWorld);
        pos.add(center);
        if (scaleX)
            pos.x *= amount;
        if (scaleY)
            pos.y *= amount;
        if (scaleZ)
            pos.z *= amount;
        positions.push(pos);
    });
    while (orbit.children.length > 0)
        scene.add(orbit.children[0]);
    for (var i = 0; i < selectedPoints.length; i++) {
        movePoint2(selectedPoints[i], positions[i]);
    }
}

function deleteSelected() {
    var selectedCopy = selectedPoints.slice();
    selectedCopy.forEach((selected) => {
        deselectPoint(selected);
        scene.remove(selected);
        var linesToPoint = getLinesWithPoint(selected);
        linesToPoint.forEach((line) => {
            deleteLine2(line);
        });
    });
}

function rotateX() {
    rotateAxis('x');
}
function rotateY() {
    rotateAxis('y');
}
function rotateZ() {
    rotateAxis('z');
}

function rotateAxis(axis) {
    var degrees = parseFloat(document.getElementById('rotatedegrees').value);
    if (isNaN(degrees))
        return;
    var rotateCenter = document.getElementById('rotatecenter').checked;
    var orbit = new THREE.Object3D();
    var center = new THREE.Vector3();
    
    if (rotateCenter) {
        for (var i = 0; i < selectedPoints.length; i++)
            center.add(selectedPoints[i].position);
        var n = selectedPoints.length;
        center.multiplyScalar(1 / n);
    }
    for (var i = 0; i < selectedPoints.length; i++) {
        orbit.add(selectedPoints[i]);
        selectedPoints[i].position.sub(center);
    }
    
    if (axis == 'x')
        orbit.rotateX(degrees * Math.PI / 180);
    if (axis == 'y')
        orbit.rotateY(degrees * Math.PI / 180);
    if (axis == 'z')
        orbit.rotateZ(degrees * Math.PI / 180);

    orbit.updateMatrixWorld();
    var positions = [];
    orbit.children.forEach((pt) => {
        var pos = new THREE.Vector3();
        pos.setFromMatrixPosition(pt.matrixWorld);
        if (rotateCenter)
            pos.add(center);
        positions.push(pos);
    });
    while (orbit.children.length > 0)
        scene.add(orbit.children[0]);
    for (var i = 0; i < selectedPoints.length; i++) {
        movePoint2(selectedPoints[i], positions[i]);
    }
}

function addSphere() {
    var radius = parseFloat(document.getElementById('sphereradius').value);
    if (isNaN(radius))
        return;
    angleDelta = parseFloat(document.getElementById('angledelta').value);
    if (isNaN(angleDelta))
        return;
    var c=3.141592654/180.0;
    var x1,y1,z1,phi0,angleDelta;
    phi0=60;
    var rings = [];
    for (var phi=-phi0; phi<=phi0; phi+=angleDelta) {
        var phir=c*phi; //Phi in radians
        var ring = [];
        for (var theta=0; theta<=360; theta+=angleDelta) {
            var thetar=c*theta;
            x1 = radius * Math.sin(thetar) * Math.cos(phir);
            y1 = radius * Math.sin(phir);
            z1 = radius * Math.cos(thetar) * Math.cos(phir);
            var pt = addPointXYZ({position: {x: x1, y: y1, z: z1}});
            ring.push(pt);
        }
        for (var index = 1; index < ring.length; index++) {
            createLine(ring[index - 1], ring[index]);
        }
        createLine(ring[index - 1], ring[0]);
        rings.push(ring);
    }
    for (let index = 1; index < rings.length; index++) {
        const ring = rings[index - 1];
        const ring2 = rings[index];
        for (var i2 = 0; i2 < ring.length; i2++) {
            createLine(ring[i2], ring2[i2]);
        }
    }
    var top = addPointXYZ({position: {x: 0, y: radius, z: 0}});
    var bottom = addPointXYZ({position: {x: 0, y: -radius, z: 0}});
    for (let index = 0; index < rings[0].length; index ++)
    {
        createLine(top, rings[rings.length - 1][index]);
        createLine(bottom, rings[0][index]);
    }
}

function addCylinder() {
    var radius = parseFloat(document.getElementById('cylinderradius').value);
    if (isNaN(radius))
        return;
    var hSegments = parseInt(document.getElementById('hsegments').value);
    if (isNaN(hSegments))
        return;
    var vSegments = parseInt(document.getElementById('vsegments').value);
    if (isNaN(vSegments))
        return;
    var height = parseFloat(document.getElementById('cylinderheight').value);
    var vRadiansPerSeg = 2 * Math.PI / vSegments;
    var rings = [];
    for (let hSeg = -hSegments / 2; hSeg <= hSegments / 2; hSeg++) {
        var y = hSeg / hSegments;
        y *= height;
        var ring = [];
        for (let vSeg = 0; vSeg < vSegments; vSeg++) {
            var x = Math.cos(vSeg * vRadiansPerSeg);
            var z = Math.sin(vSeg * vRadiansPerSeg);
            x *= radius;
            z *= radius;
            var pt = addPointXYZ({position: {x: x, y: y, z: z}});
            ring.push(pt);
        }
        for (var index = 1; index < ring.length; index++) {
            createLine(ring[index - 1], ring[index]);
        }
        createLine(ring[index - 1], ring[0]);
        rings.push(ring);
    }
    for (let index = 1; index < rings.length; index++) {
        const ring = rings[index - 1];
        const ring2 = rings[index];
        for (var i2 = 0; i2 < ring.length; i2++) {
            createLine(ring[i2], ring2[i2]);
        }
    }
}

function addGrid() {
    var xSegments = parseFloat(document.getElementById('gridxsegments').value);
    if (isNaN(xSegments))
        return;
    var xSegmentSize = parseFloat(document.getElementById('gridxsegmentsize').value);
    if (isNaN(xSegmentSize))
        return;
    var zSegments = parseFloat(document.getElementById('gridzsegments').value);
    if (isNaN(zSegments))
        return;
    var zSegmentSize = parseFloat(document.getElementById('gridzsegmentsize').value);
    if (isNaN(zSegmentSize))
        return;
    var points = [];
    for (let x = 0; x < xSegments + 1; x++) {
        var xp = x * xSegmentSize - ((xSegments / 2) * xSegmentSize);
        var xPoints = [];
        for (let z = 0; z < zSegments + 1; z++) {
            var zp = z * zSegmentSize - ((zSegments / 2) * zSegmentSize);
            var pt = addPointXYZ({position: {x: xp, y: 0, z: zp}});
            xPoints.push(pt);
        }
        points.push(xPoints);
    }

    for (let x = 0; x  < points.length; x++) {
        for (let z = 0; z < points[x].length; z++) {
            var pt2 = null;
            var pt3 = null;
            var pt = points[x][z];
            if (points[x + 1])
                pt2 = points[x + 1][z];
            if (points[x])
                pt3 = points[x][z + 1];
            if (pt2)
                createLine(pt, pt2);
            if (pt3)
                createLine(pt, pt3);
        }
    }
}

function saveJSON() {
    var textbox = document.getElementById('loadsave');
    var compress = document.getElementById('compresssave').checked;
    var points = [];
    lines.forEach((line) => {
        var pos1 = line.pos1;
        var pos2 = line.pos2;
        if (compress) {
            pos1.x = Math.round(pos1.x * 100) / 100;
            pos1.y = Math.round(pos1.y * 100) / 100;
            pos1.z = Math.round(pos1.z * 100) / 100;
            pos2.x = Math.round(pos2.x * 100) / 100;
            pos2.y = Math.round(pos2.y * 100) / 100;
            pos2.z = Math.round(pos2.z * 100) / 100;
        }
        var pt1 = {id: line.id1, pos: pos1, conn: []};
        var pt2 = {id: line.id2, pos: pos2, conn: []};
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