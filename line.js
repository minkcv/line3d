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