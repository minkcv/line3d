// This is the format for storing a model.
var points = [
    {
        id: 0,
        x:  0,
        y:  0,
        z:  0,
        connections: [
            1
        ]
    },
    {
        id: 1,
        x:  100,
        y:  100,
        z:  100,
        connections: [
            0
        ]
    }
];

function getLines() {
    var pairs = [];
    points.forEach((p) => {
        var xyz = [p.x, p.y, p.z];
        var conns = p.connections;
        conns.forEach((c) => {
            var xyz2 = [c.x, c.y, c.z];
            if (!pairsContains([xyz, xyz2], pairs))
                pairs.push([xyz, xyz2, p.id, c.id]);
        })
    });
    return pairs;
}

function getXYZ(id) {
    points.forEach((p) => {
        if (p.id == id) {
            return [p.x, p.y, p.z];
        }
    });
    return null;
}

function pairsContains(pair, pairs) {
    pairs.forEach((p) => {
        if ((arrayCompare(p[0], pair[0]) && arrayCompare(p[1], pair[1])) || 
            (arrayCompare(p[0], pair[1]) && arrayCompare(p[1], pair[0])))
            return true;
    })
    return false;
}

function arrayCompare(a, b) {
    for (var i = 0; i < a.length; i++) {
            if (a[i] != b[i])
                return false;
    }
    return true;
}