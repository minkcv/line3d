
var currentId = 0;

function addPoint() {
    var pointContainer = new THREE.Object3D();
    var xGripGeom = new THREE.Geometry();
    xGripGeom.vertices.push(new THREE.Vector3(0, 0, 0));
    xGripGeom.vertices.push(new THREE.Vector3(20, 0, 0));
    var xGrip = new THREE.Line(xGripGeom, redLineMat);
    var yGripGeom = new THREE.Geometry();
    yGripGeom.vertices.push(new THREE.Vector3(0, 0, 0));
    yGripGeom.vertices.push(new THREE.Vector3(0, 20, 0));
    var yGrip = new THREE.Line(yGripGeom, greenLineMat);
    var zGripGeom = new THREE.Geometry();
    zGripGeom.vertices.push(new THREE.Vector3(0, 0, 0));
    zGripGeom.vertices.push(new THREE.Vector3(0, 0, 20));
    var zGrip = new THREE.Line(zGripGeom, blueLineMat);
    pointContainer.add(xGrip);
    pointContainer.add(yGrip);
    pointContainer.add(zGrip);
    pointContainer.position.copy(cam.position);
    pointContainer.pointId = currentId++;
    scene.add(pointContainer);
}
