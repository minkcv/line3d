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
    var v1 = new THREE.Vector3(pt1.position.x, pt1.position.y, pt1.position.z);
    var v2 = new THREE.Vector3(pt2.position.x, pt2.position.y, pt2.position.z);
    geom.vertices.push(v1);
    geom.vertices.push(v2);
    var line = new THREE.Line(geom, currentLineMat);
    line.frustumCulled = false;
    var lineData = {
        obj: line,
        geometry: line.geometry,
        id1: pt1.pointId,
        id2: pt2.pointId,
        pos1: v1,
        pos2: v2
    };
    lines.push(lineData);
    scene.add(line);
    return line;
}

function getLinesWithPoint(pt) {
    var found = [];
    lines.forEach((line) => {
        if (line.id1 == pt.pointId || line.id2 == pt.pointId)
            found.push(line);
    });
    return found;
}

// Args are like above
function deleteLine(pt1, pt2) {
    var line = null;
    var index = -1;
    for (var i = 0; i < lines.length; i++) {
        var current = lines[i];
        if ((current.id1 == pt1.pointId && current.id2 == pt2.pointId) ||
            (current.id1 == pt2.pointId && current.id2 == pt1.pointId)) {
                line = current.obj;
                index = i;
        }
    }
    if (line != null && index >= 0) {
        lines.splice(index, 1);
        scene.remove(line);
    }
}

function deleteLine2(line) {
    deleteLine({pointId: line.id1, position: line.pos1}, {pointId: line.id2, position: line.pos2});
}