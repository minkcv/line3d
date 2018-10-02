
var currentId = 1;

function addPoint() {
    var pointContainer = new THREE.Object3D();
    var xGripGeom = new THREE.Geometry();
    xGripGeom.vertices.push(new THREE.Vector3(0, 0, 0));
    xGripGeom.vertices.push(new THREE.Vector3(50, 0, 0));
    var xGrip = new THREE.Line(xGripGeom, redLineMat);
    xGrip.xGrip = true;
    var yGripGeom = new THREE.Geometry();
    yGripGeom.vertices.push(new THREE.Vector3(0, 0, 0));
    yGripGeom.vertices.push(new THREE.Vector3(0, 50, 0));
    var yGrip = new THREE.Line(yGripGeom, greenLineMat);
    yGrip.yGrip = true;
    var zGripGeom = new THREE.Geometry();
    zGripGeom.vertices.push(new THREE.Vector3(0, 0, 0));
    zGripGeom.vertices.push(new THREE.Vector3(0, 0, 50));
    var zGrip = new THREE.Line(zGripGeom, blueLineMat);
    zGrip.zGrip = true;
    pointContainer.add(xGrip);
    pointContainer.add(yGrip);
    pointContainer.add(zGrip);
    pointContainer.position.copy(cam.position);
    pointContainer.pointId = currentId++;
    scene.add(pointContainer);
}
