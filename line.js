function createLine(pt1, pt2) {
    var geom = new THREE.Geometry();
    geom.vertices.push(pt1);
    geom.vertices.push(pt2);
    var line = new THREE.Line(geom, whiteLineMat);
    return line;
}