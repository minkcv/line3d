var currentId = 1;

function addPoint() {
    var pointContainer = new THREE.Object3D();
    var xGripGeom = new THREE.Geometry();
    xGripGeom.vertices.push(new THREE.Vector3(0, 0, 0));
    xGripGeom.vertices.push(new THREE.Vector3(50, 0, 0));
    var xGrip = new THREE.Line(xGripGeom, redLineMat);
    xGrip.xGrip = true;
    xGrip.visible = false;
    var yGripGeom = new THREE.Geometry();
    yGripGeom.vertices.push(new THREE.Vector3(0, 0, 0));
    yGripGeom.vertices.push(new THREE.Vector3(0, 50, 0));
    var yGrip = new THREE.Line(yGripGeom, greenLineMat);
    yGrip.yGrip = true;
    yGrip.visible = false;
    var zGripGeom = new THREE.Geometry();
    zGripGeom.vertices.push(new THREE.Vector3(0, 0, 0));
    zGripGeom.vertices.push(new THREE.Vector3(0, 0, 50));
    var zGrip = new THREE.Line(zGripGeom, blueLineMat);
    zGrip.zGrip = true;
    zGrip.visible = false;
    var cubeGeom = new THREE.BoxGeometry(10, 10, 10);
    var cube = new THREE.Mesh(cubeGeom, blueMat);
    cube.pointCube = true;
    var scale = 1 / realCamera.zoom;
    cube.scale.set(scale, scale, scale);
    xGrip.scale.set(scale, scale, scale);
    yGrip.scale.set(scale, scale, scale);
    zGrip.scale.set(scale, scale, scale);
    pointContainer.add(xGrip);
    pointContainer.add(yGrip);
    pointContainer.add(zGrip);
    pointContainer.add(cube);
    pointContainer.position.copy(cam.position);
    pointContainer.pointId = currentId++;
    scene.add(pointContainer);
    return pointContainer;
}

function addPointXYZ(pt) {
    var pointContainer = new THREE.Object3D();
    var xGripGeom = new THREE.Geometry();
    xGripGeom.vertices.push(new THREE.Vector3(0, 0, 0));
    xGripGeom.vertices.push(new THREE.Vector3(50, 0, 0));
    var xGrip = new THREE.Line(xGripGeom, redLineMat);
    xGrip.xGrip = true;
    xGrip.visible = false;
    var yGripGeom = new THREE.Geometry();
    yGripGeom.vertices.push(new THREE.Vector3(0, 0, 0));
    yGripGeom.vertices.push(new THREE.Vector3(0, 50, 0));
    var yGrip = new THREE.Line(yGripGeom, greenLineMat);
    yGrip.yGrip = true;
    yGrip.visible = false;
    var zGripGeom = new THREE.Geometry();
    zGripGeom.vertices.push(new THREE.Vector3(0, 0, 0));
    zGripGeom.vertices.push(new THREE.Vector3(0, 0, 50));
    var zGrip = new THREE.Line(zGripGeom, blueLineMat);
    zGrip.zGrip = true;
    zGrip.visible = false;
    var cubeGeom = new THREE.BoxGeometry(10, 10, 10);
    var cube = new THREE.Mesh(cubeGeom, blueMat);
    cube.pointCube = true;
    var scale = 1 / realCamera.zoom;
    cube.scale.set(scale, scale, scale);
    xGrip.scale.set(scale, scale, scale);
    yGrip.scale.set(scale, scale, scale);
    zGrip.scale.set(scale, scale, scale);
    pointContainer.add(xGrip);
    pointContainer.add(yGrip);
    pointContainer.add(zGrip);
    pointContainer.add(cube);
    var newPos = new THREE.Vector3(pt.position.x, pt.position.y, pt.position.z);
    pointContainer.position.copy(newPos);
    if (pt.pointId) {
        pointContainer.pointId = pt.pointId;
        currentId = Math.max(currentId, pt.pointId);
    }
    else 
        pointContainer.pointId = currentId;
    currentId++;
    scene.add(pointContainer);
    return pointContainer;
}

// pt has "pointId" and "position"
// only moves lines, move the point after calling this
function movePoint(pt, translation, axis) {
    var foundObjects = [];
    lines.forEach((line) => {
        if (line.id1 == pt.pointId) {
            foundObjects.push({obj: line.obj, index: 0, point: pt.position});
            line.pos1 = pt.position;
        }
        else if (line.id2 == pt.pointId) {
            foundObjects.push({obj: line.obj, index: 1, point: pt.position});
            line.pos2 = pt.position;
        }
    });
    foundObjects.forEach((foundObj) => {
        var newPoint = new THREE.Vector3();
        newPoint.copy(foundObj.point);
        if (axis == AXIS.x)
            newPoint.x += translation;
        if (axis == AXIS.y)
            newPoint.y += translation;
        if (axis == AXIS.z)
            newPoint.z += translation;
        foundObj.obj.geometry.vertices[foundObj.index] = newPoint;
        foundObj.obj.geometry.verticesNeedUpdate = true;
    });
}

// Moves point and lines
function movePoint2(pt, newPos) {
    var foundObjects = [];
    lines.forEach((line) => {
        if (line.id1 == pt.pointId) {
            foundObjects.push({obj: line.obj, index: 0, point: pt.position});
            line.pos1 = pt.position;
        }
        else if (line.id2 == pt.pointId) {
            foundObjects.push({obj: line.obj, index: 1, point: pt.position});
            line.pos2 = pt.position;
        }
    });
    foundObjects.forEach((foundObj) => {
        foundObj.obj.geometry.vertices[foundObj.index] = newPos;
        foundObj.obj.geometry.verticesNeedUpdate = true;
    });
    pt.position.copy(newPos);
}

function getPointById(id) {
    if (id === undefined)
        return null;
    var found = null;
    scene.children.forEach((child) => {
        if (child.pointId == id)
            found = child;
    });
    return found;
}

function getConnectedPoints(pt) {
    var connectedPoints = [];
    lines.forEach((line) => {
        if (line.id1 == pt.pointId)
            connectedPoints.push(getPointById(line.id2));
        if (line.id2 == pt.pointId)
            connectedPoints.push(getPointById(line.id1));
    });
    return connectedPoints;
}