var lines = [];

// Takes 2 "point" objects that have "positions" and "pointId"s
// returns null if the line already exists.
function createLine(pt1, pt2) {
    var exists = false;
    lines.forEach((existing) => {
        if ((existing.id1 == pt1.pointId && existing.id2 == pt2.pointId) ||
            (existing.id1 == pt2.pointId && existing.id2 == pt1.pointId)) {
                exists = true;
            }
    });
    if (exists)
        return null;
    var geom = new THREE.Geometry();
    geom.vertices.push(pt1.position);
    geom.vertices.push(pt2.position);
    var line = new THREE.Line(geom, whiteLineMat);
    var lineData = {
        obj: line,
        geometry: line.geometry,
        id1: pt1.pointId,
        id2: pt2.pointId,
        pos1: pt1.position,
        pos2: pt2.position
    };
    lines.push(lineData);
    return line;
}
