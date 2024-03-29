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
    var center = new THREE.Vector3();
    for (var i = 0; i < selectedPoints.length; i++)
        center.add(selectedPoints[i].position);
    var n = selectedPoints.length;
    center.multiplyScalar(1 / n);

    var positions = [];
    selectedPoints.forEach((pt) => {
        var pos = new THREE.Vector3();
        pos.copy(pt.position);
        pos.sub(center);
        if (scaleX)
            pos.x *= amount;
        if (scaleY)
            pos.y *= amount;
        if (scaleZ)
            pos.z *= amount;
        positions.push(pos);
    });
    for (var i = 0; i < selectedPoints.length; i++) {
        var newPos = positions[i].add(center);
        movePoint2(selectedPoints[i], newPos);
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
        for (var theta=0; theta<360; theta+=angleDelta) {
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

function addIcoSphere() {
    // Thanks: http://blog.andreaskahler.com/2009/06/creating-icosphere-mesh-in-code.html
    var iterations = parseInt(document.getElementById('icosphereiterations').value);
    if (isNaN(iterations))
        return;
    if (iterations > 4)
        return; // Too much
    var radius = parseInt(document.getElementById('icosphereradius').value);
    if (isNaN(radius))
        return;

    var points = [];
    var cache = {};
    var triangles = [];
    var t = (1 + Math.sqrt(5)) / 2.0;
    addIcoSpherePoint([-1,  t, 0], points);
    addIcoSpherePoint([ 1,  t, 0], points);
    addIcoSpherePoint([-1, -t, 0], points);
    addIcoSpherePoint([ 1, -t, 0], points);

    addIcoSpherePoint([0, -1,  t], points);
    addIcoSpherePoint([0,  1,  t], points);
    addIcoSpherePoint([0, -1, -t], points);
    addIcoSpherePoint([0,  1, -t], points);

    addIcoSpherePoint([ t, 0, -1], points);
    addIcoSpherePoint([ t, 0,  1], points);
    addIcoSpherePoint([-t, 0, -1], points);
    addIcoSpherePoint([-t, 0,  1], points);

    triangles.push([0, 11, 5]);
    triangles.push([0, 5, 1]);
    triangles.push([0, 1, 7]);
    triangles.push([0, 7, 10]);
    triangles.push([0, 10, 11]);

    triangles.push([1, 5, 9]);
    triangles.push([5, 11, 4]);
    triangles.push([11, 10, 2]);
    triangles.push([10, 7, 6]);
    triangles.push([7, 1, 8]);

    triangles.push([3, 9, 4]);
    triangles.push([3, 4, 2]);
    triangles.push([3, 2, 6]);
    triangles.push([3, 6, 8]);
    triangles.push([3, 8, 9]);

    triangles.push([4, 9, 5]);
    triangles.push([2, 4, 11]);
    triangles.push([6, 2, 10]);
    triangles.push([8, 6, 7]);
    triangles.push([9, 8, 1]);

    for (var i = 0; i < iterations; i++) {
        var newTriangles = [];
        for (var t = 0; t < triangles.length; t++) {
            var a = getMiddlePoint(triangles[t][0], triangles[t][1], cache, points);
            var b = getMiddlePoint(triangles[t][1], triangles[t][2], cache, points);
            var c = getMiddlePoint(triangles[t][2], triangles[t][0], cache, points);

            newTriangles.push([triangles[t][0], a, c]);
            newTriangles.push([triangles[t][1], b, a]);
            newTriangles.push([triangles[t][2], c, b]);
            newTriangles.push([a, b, c]);
        }
        triangles = newTriangles;
    }
    for (var i = 0; i < points.length; i++) {
        points[i][0] *= radius;
        points[i][1] *= radius;
        points[i][2] *= radius;
    }
    var pointObjs = [];
    for (var p = 0; p < points.length; p++) {
        var pt = addPointXYZ({position: {x: points[p][0], y: points[p][1], z: points[p][2]}});
        pointObjs.push(pt);
    }
    for (var t = 0; t < triangles.length; t++) {
        createLine(pointObjs[triangles[t][0]], pointObjs[triangles[t][1]]);
        createLine(pointObjs[triangles[t][1]], pointObjs[triangles[t][2]]);
        createLine(pointObjs[triangles[t][0]], pointObjs[triangles[t][2]]);
    }
}

function addIcoSpherePoint(p, points) {
    var length = Math.sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2]);
    var pt = [p[0] / length, p[1] / length, p[2] / length];
    points.push(pt);
    return points.length - 1;
}

function getMiddlePoint(p1, p2, cache, points) {
    var smaller = p2;
    if (p1 < p2)
        smaller = p1;
    var larger = p1;
    if (p1 < p2)
        larger = p2;
    var key = (smaller << 16) + larger;
    if (cache[key] !== undefined) {
        return cache[key];
    }
    var pt1 = points[p1];
    var pt2 = points[p2];
    var middle = [
        (pt1[0] + pt2[0]) / 2,
        (pt1[1] + pt2[1]) / 2,
        (pt1[2] + pt2[2]) / 2
    ];
    var index = addIcoSpherePoint(middle, points);
    cache[key] = index;
    return index;
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
    var newIds = [];
    points.forEach((point) => {
        var pt = {pointId: point.id, position: point.pos};
        var newPoint = addPointXYZ(pt);
        newIds[point.id] = newPoint.pointId;
    });
    points.forEach((point) => {
        point.conn.forEach((otherId) => {
            var other = null;
            points.forEach((candidate) => {
                if (newIds[candidate.id] == newIds[otherId])
                    other = candidate;
            });
            if (other != null) {
                var pt1 = {pointId: newIds[point.id], position: point.pos};
                var pt2 = {pointId: newIds[other.id], position: other.pos};
                createLine(pt1, pt2);
            }
        });
    });
}

function saveShapeJSON() {
    var textbox = document.getElementById('loadsave');
    var compress = document.getElementById('compresssave').checked;
    var shapePoints = [];
    var shapeIds = [];
    if (selectedPoints.length < 3) {
        alert('You must select at least 3 points are connected in a loop');
        return;
    }
    // Follow the points around a loop by their connections
    var nextPoint = selectedPoints[0];
    var currentPoint = nextPoint;
    while (nextPoint != null) {
        currentPoint = nextPoint;
        nextPoint = null;
        shapePoints.push({x: currentPoint.position.x, y: currentPoint.position.y, z: currentPoint.position.z});
        shapeIds.push(currentPoint.pointId);
        var connected = getConnectedPoints(currentPoint);
        var connSelected = [];
        connected.forEach((conn) => {
            var selected = false;
            for (var i = 0; i < selectedPoints.length; i++) {
                if (selectedPoints[i].pointId == conn.pointId)
                    selected = true;
            }
            if (selected)
                connSelected.push(conn);
        });
        for (var cs = 0; cs < connSelected.length; cs++) {
            var conn = connSelected[cs];
            var exists = false;
            for (var i = 0; i < shapeIds.length; i++) {
                if (shapeIds[i] == conn.pointId)
                    exists = true;
            }
            if (!exists) {
                nextPoint = conn;
                break;
            }
        }
    }
    var plane = new THREE.Plane();
    plane.setFromCoplanarPoints(selectedPoints[0].position, selectedPoints[1].position, selectedPoints[2].position);
    var quat = new THREE.Quaternion();
    quat.setFromUnitVectors(plane.normal, new THREE.Vector3(0, 0, 1));
    var orbit = new THREE.Object3D();
    for (var i = 0; i < shapePoints.length; i++) {
        var point = new THREE.Object3D();
        point.pointIndex = i;
        orbit.add(point);
        point.position.set(shapePoints[i].x, shapePoints[i].y, shapePoints[i].z);
    }
    var inPlane = new THREE.Vector3();
    plane.projectPoint(new THREE.Vector3(0, 0, 0), inPlane);
    var position = {x: Math.round(inPlane.x * 100) / 100, y: Math.round(inPlane.y * 100) / 100, z: Math.round(inPlane.z * 100) / 100};
    orbit.applyQuaternion(quat);
    orbit.updateMatrixWorld();
    orbit.children.forEach((child) => {
        var pos = new THREE.Vector3();
        pos.setFromMatrixPosition(child.matrixWorld);
        shapePoints[child.pointIndex].x = pos.x;
        shapePoints[child.pointIndex].y = pos.y;
        shapePoints[child.pointIndex].z = pos.z;
        if (compress) {
            shapePoints[child.pointIndex].x = Math.round(shapePoints[child.pointIndex].x * 100) / 100;
            shapePoints[child.pointIndex].y = Math.round(shapePoints[child.pointIndex].y * 100) / 100;
            shapePoints[child.pointIndex].z = Math.round(shapePoints[child.pointIndex].z * 100) / 100;
        }
    });
    quat.inverse();
    var rotation = {x: quat.x, y: quat.y, z: quat.z, w: quat.w};
    textbox.value = JSON.stringify({pos: position, rot: rotation, points: shapePoints});
    // For Debug
    /*
    var shape = new THREE.Shape();
    shape.moveTo(shapePoints[0].x, shapePoints[0].y);
    for (var i = 1; i < shapePoints.length; i++) {
        shape.lineTo(shapePoints[i].x, shapePoints[i].y);
    }
    var shapeGeom = new THREE.ShapeBufferGeometry(shape);
    var mesh = new THREE.Mesh(shapeGeom, blueMat);
    mesh.position.copy(inPlane);
    mesh.applyQuaternion(quat);
    scene.add(mesh);
    */
}

function saveOBJ() {
    var obj = '';
    var points = [];
    var objId = 1;
    var pointIdToObjId = {};
    var compress = document.getElementById('compresssave').checked;
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
            pointIdToObjId[pt1.id] = objId;
            objId++;
            points.push(pt1);
        }
        if (!pt2exists) {
            pointIdToObjId[pt2.id] = objId;
            objId++;
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
    points.forEach((point) => {
        obj += 'v ' + point.pos.x + ' ' + point.pos.y + ' ' + point.pos.z + '\n';
    });
    lines.forEach((line) => {
        var objId1 = pointIdToObjId[line.id1];
        var objId2 = pointIdToObjId[line.id2];
        obj += 'l ' + objId1 + ' ' + objId2 + '\n';
    });

    var blob = new Blob([obj], {type: 'text/plain' });
    var anchor = document.createElement('a');
    anchor.download = 'model.obj';
    anchor.href = (window.URL || window.URL).createObjectURL(blob);
    anchor.dataset.downloadurl = ['text/plain', anchor.download, anchor.href].join(':');;
    anchor.click();
}

function loadOBJ() {
    var file = document.querySelector('input[type=file]').files[0];
    var reader  = new FileReader();
    reader.onloadend = function () {
        var objIdsToPoints = {};
        var objId = 1;
        var objLines = reader.result.split('\n');
        for (var i = 0; i < objLines.length; i++) {
            var objLine = objLines[i];
            var args = objLine.split(' ');
            if (args[0] == 'v') {
                var x = parseFloat(args[1]);
                var y = parseFloat(args[2]);
                var z = parseFloat(args[3]);
                var point = addPointXYZ({position: {x: x, y: y, z: z}});
                objIdsToPoints[objId] = point;
                objId++;
            }
            if (args[0] == 'l') {
                var objId1 = parseInt(args[1]);
                var objId2 = parseInt(args[2]);
                var pt1 = objIdsToPoints[objId1];
                var pt2 = objIdsToPoints[objId2];
                createLine(pt1, pt2);
            }
        }
    }
    
    if (file)
        reader.readAsText(file);
}

function saveC() {
    var output = '';
    var points = [];
    var objId = 1;
    var pointIdToObjId = {};
    var compress = document.getElementById('compresssave').checked;
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
            pointIdToObjId[pt1.id] = objId;
            objId++;
            points.push(pt1);
        }
        if (!pt2exists) {
            pointIdToObjId[pt2.id] = objId;
            objId++;
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
    output += 'static const int modelPointsLength = ' + points.length * 3 + ';\n';
    output += 'static float modelPoints[modelPointsLength] = {\n';
    points.forEach((point) => {
        var last = points[points.length - 1] == point;
        if (last)
            output += '    ' + point.pos.x + ', ' + point.pos.y + ', ' + point.pos.z + '\n';
        else
            output += '    ' + point.pos.x + ', ' + point.pos.y + ', ' + point.pos.z + ', \n';
    });
    output += '};\n';
    output += 'static const int modelIndicesLength = ' + lines.length * 2 + ';\n';
    output += 'static int modelIndices[modelIndicesLength] = {\n';
    lines.forEach((line) => {
        var last = lines[lines.length - 1] == line;
        var objId1 = pointIdToObjId[line.id1] - 1;
        var objId2 = pointIdToObjId[line.id2] - 1;
        if (last)
            output += '    ' + objId1 + ', ' + objId2 + '\n';
        else
            output += '    ' + objId1 + ', ' + objId2 + ', \n';
    });
    output += '};\n';
    var blob = new Blob([output], {type: 'text/plain' });
    var anchor = document.createElement('a');
    anchor.download = 'model.dat';
    anchor.href = (window.URL || window.URL).createObjectURL(blob);
    anchor.dataset.downloadurl = ['text/plain', anchor.download, anchor.href].join(':');;
    anchor.click();
}

function saveBin() {
    var points = [];
    var objId = 1;
    var pointIdToObjId = {};
    var compress = document.getElementById('compresssave').checked;
    lines.forEach((line) => {
        var pos1 = line.pos1;
        var pos2 = line.pos2;
        if (compress) {
            pos1.x = Math.round(pos1.x);
            pos1.y = Math.round(pos1.y);
            pos1.z = Math.round(pos1.z);
            pos2.x = Math.round(pos2.x);
            pos2.y = Math.round(pos2.y);
            pos2.z = Math.round(pos2.z);
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
            pointIdToObjId[pt1.id] = objId;
            objId++;
            points.push(pt1);
        }
        if (!pt2exists) {
            pointIdToObjId[pt2.id] = objId;
            objId++;
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
    var arraySize = 2 + (lines.length * 2) + (points.length * 2);
    var output = new Uint8Array(arraySize);
    output[0] = lines.length;
    output[1] = 0; // padding
    var count = 2;
    lines.forEach((line) => {
        var objId1 = pointIdToObjId[line.id1] - 1;
        var objId2 = pointIdToObjId[line.id2] - 1;
        output[count] = objId1;
        count++;
        output[count] = objId2;
        count++;
    });
    points.forEach((point) => {
        output[count] = point.pos.x;
        count++;
        output[count] = point.pos.z;
        count++;
    });
    var blob = new Blob([output], {type: 'application/octet-stream' });
    var anchor = document.createElement('a');
    anchor.download = 'model.bin';
    anchor.href = (window.URL || window.URL).createObjectURL(blob);
    anchor.dataset.downloadurl = ['text/plain', anchor.download, anchor.href].join(':');;
    anchor.click();
}
