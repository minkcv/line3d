// THREE.js materials
var whiteLineMat = new THREE.LineBasicMaterial({color: 0xffffff});
var redLineMat = new THREE.LineBasicMaterial({color: 0xff0000});
var greenLineMat = new THREE.LineBasicMaterial({color: 0x00ff00});
var blueLineMat = new THREE.LineBasicMaterial({color: 0x0000ff});
var blueMat = new THREE.MeshBasicMaterial({color: 0x0000ff});
var redMat = new THREE.MeshBasicMaterial({color: 0xff0000});

// Set up 3D scene, camera, and renderer in THREE.js
var threediv = document.getElementById('three');
var width = threediv.clientWidth;
var height = threediv.clientHeight;

var scene = new THREE.Scene();
scene.background = new THREE.Color('#000000');

var scale = 2;
var realCamera = new THREE.OrthographicCamera(width / -scale, width / scale, height / scale, height / -scale, 0, 4000);

var gridHelper = new THREE.GridHelper(1000, 10, 0x555555, 0x555555);
scene.add(gridHelper);

var cam = new THREE.Object3D(); // Parent for camera
var camera = new THREE.Object3D(); // Parent for realCamera
camera.add(realCamera);
realCamera.translateZ(2000);
cam.add(camera);
scene.add(cam);

var camAxes = new THREE.AxesHelper(50, 0.5);
cam.add(camAxes);
var originAxes = new THREE.AxesHelper(50);
scene.add(originAxes);

// Start in iso view.
cam.rotation.y = Math.PI / 4;
camera.rotation.x = -Math.PI / 4;
camAxes.rotation.y = -Math.PI / 4;
realCamera.zoom = 0.8;
realCamera.updateProjectionMatrix();

var renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(width, height);
threediv.appendChild(renderer.domElement);

var raycaster = new THREE.Raycaster();
raycaster.linePrecision = 5;
var mouseVec = new THREE.Vector2();
var pickedObject = null; // Moused over object.
var selectedPoints = [];
var MODE = {connect: 0, disconnect: 1, select: 2, delete: 3, boxSelect: 4}
var clickMode = MODE.select;
selectMode();
var AXIS = {x: 0, y: 1, z: 2, none: 3};
var pickedMoveAxis = AXIS.none;
var autoConnect = true;
var autoSelect = true;
var autoDeselect = true;
var boxStartX;
var boxStartY;
var boxStarted = false;
var selectionBox = document.getElementById('selection-box');

var rotateFactor = 100;
var sprintFactor = 1;
var zoomSpeed = 0.2;

// Rotate, zoom, pan, act on keypresses, move, connect, disconnect points, etc.
function update() {
    if (keys.a in keysUp) {
        var newPt = addPoint();
        if (selectedPoints.length > 0 && autoConnect) {
            selectedPoints.forEach((point) => {
                createLine(point, newPt);
            })
        }
        if (autoSelect) {
            if (autoDeselect && selectedPoints.length > 0) {
                selectNoneAll();
            }
            selectPoint(newPt);
        }
    }

    if (keys.c in keysUp)
        connectMode();
    if (keys.s in keysUp)
        selectMode();
    if (keys.d in keysUp)
        disconnectMode();
    if (keys.x in keysUp)
        deleteMode();
    if (keys.b in keysUp)
        boxSelectMode();
    if (keys.z in keysUp)
        selectNoneAll();
    
    
    if (keys.q in keysDown) {
        cam.rotation.y = 0;
        camera.rotation.x = 0;
        camAxes.rotation.y = 0;
    }
    if (keys.w in keysDown) {
        cam.rotation.y = 0;
        camera.rotation.x = -Math.PI / 2;
        camAxes.rotation.y = 0;
    }
    if (keys.e in keysDown) {
        cam.rotation.y = Math.PI / 2;
        camera.rotation.x = 0;
        camAxes.rotation.y = -Math.PI / 2;
    }
    if (keys.r in keysDown) {
        cam.rotation.y = Math.PI / 4;
        camera.rotation.x = -Math.PI / 4;
        camAxes.rotation.y = -Math.PI / 4;
    }
    if (keys.t in keysDown) {
        cam.position.set(0, 0, 0);
    }
    if (mouseButton == 0) { // Mode action or move points - Left click
        if (clickMode == MODE.boxSelect) {
            if (mouseDown && !boxStarted) {
                boxStartX = mouseX;
                boxStartY = mouseY;
                boxStarted = true;
                selectionBox.style.left = boxStartX + 'px';
                selectionBox.style.top = boxStartY + 'px';
                selectionBox.style.display = 'block';
            }
            console.log(mouseDown);
            if (boxStarted) {
                var width = mouseX - boxStartX;
                var height = mouseY - boxStartY;
                selectionBox.style.left = boxStartX + 'px';
                selectionBox.style.top = boxStartY + 'px';
                selectionBox.style.width = Math.abs(width) + 'px';
                selectionBox.style.height = Math.abs(height) + 'px';
                if (width < 0)
                    selectionBox.style.left = boxStartX + width + 'px';
                if (height < 0)
                    selectionBox.style.top = boxStartY + height + 'px';
            }
            if (boxStarted && !mouseDown) {
                var width = Math.abs(mouseX - boxStartX);
                var height = Math.abs(mouseY - boxStartY);
                var depth = 4000;
                var geom = new THREE.BoxGeometry(width / realCamera.zoom, height / realCamera.zoom, depth);
                var box = new THREE.Mesh(geom, blueMat);
                var tx = (boxStartX - threediv.offsetLeft) - (threediv.clientWidth / 2);
                var ty = boxStartY - (threediv.clientHeight / 2);
                mouseDX = tx + (width / 2) * sign(mouseX - boxStartX);
                mouseDY = ty + (height / 2) * sign(mouseY - boxStartY);
                var boxTranslate = getScreenTranslation();
                box.position.copy(boxTranslate);
                box.position.add(cam.position);
                box.rotation.y = cam.rotation.y;
                box.rotateX(camera.rotation.x);
                box.geometry.computeBoundingBox();
                box.updateMatrixWorld(true);
                var boxMatrixInverse = new THREE.Matrix4().getInverse(box.matrixWorld);
                var inverseBox = box.clone();
                inverseBox.applyMatrix(boxMatrixInverse);
                var bb = new THREE.Box3().setFromObject(inverseBox);
                scene.children.forEach((child) => {
                    if (child.pointId) {
                        var inversePoint = child.position.clone();
                        inversePoint.applyMatrix4(boxMatrixInverse);
                        var isInside = bb.containsPoint(inversePoint);
                        if (isInside)
                            selectPoint(child);
                    }
                });
                boxStarted = false;
                selectionBox.style.display = 'none';
            }
        }
        else if (pickedObject != null) {
            if (pickedObject.pointCube) {
                if (clickMode == MODE.connect) {
                    selectedPoints.forEach((point) => {
                        var line = createLine(point, pickedObject.parent);
                    });
                }
                else if (clickMode == MODE.disconnect) {
                    selectedPoints.forEach((point) => {
                        deleteLine(point, pickedObject.parent);
                    });
                }
                else if (clickMode == MODE.select && mouseWasDown) {
                    mouseWasDown = false;
                    var selected = false;
                    selectedPoints.forEach((existing) => {
                        if (existing.pointId == pickedObject.parent.pointId)
                            selected = true;
                    });
                    if (pickedMoveAxis == AXIS.none) {
                        if (selected)
                            deselectPoint(pickedObject.parent); 
                        else
                            selectPoint(pickedObject.parent);
                    }
                }
                else if (clickMode == MODE.delete) {
                    deselectPoint(pickedObject.parent);
                    var ptId = pickedObject.parent.pointId;
                    scene.remove(pickedObject.parent);
                    var linesToPoint = getLinesWithPoint(pickedObject.parent);
                    linesToPoint.forEach((line) => {
                        deleteLine2(line);
                    });
                }
            }
        }
        if (selectedPoints.length > 0) {
            var translate = getScreenTranslation();
            if (translate.x != 0 || translate.y != 0 || translate.z != 0) {
                translate.negate();
                selectedPoints.forEach((point) => {
                    if (pickedMoveAxis == AXIS.x) {
                        movePoint(point, translate.x, AXIS.x);
                        point.translateX(translate.x);
                    }
                    if (pickedMoveAxis == AXIS.y) {
                        movePoint(point, translate.y, AXIS.y);
                        point.translateY(translate.y);
                    }
                    if (pickedMoveAxis == AXIS.z) {
                        movePoint(point, translate.z, AXIS.z);
                        point.translateZ(translate.z);
                    }
                })
            }
        }
    }
    else if (mouseButton == 2) { // Rotate view - Right mouse
        cam.rotation.y += mouseDX / rotateFactor;
        camera.rotation.x += mouseDY / rotateFactor;
        camAxes.rotation.y -= mouseDX / rotateFactor;
        if (camera.rotation.x > Math.PI / 2)
            camera.rotation.x = Math.PI / 2;
        if (camera.rotation.x < -Math.PI / 2)
            camera.rotation.x = -Math.PI / 2;
    }
    else if (mouseButton == 1) { // Pan view - Middle click
        var translate = getScreenTranslation();
        cam.position.add(translate);
    }
    else if (mouseButton == 4) { // Extra click?
        cam.translateY(-mouseDY);
    }
    if (mouseDZ < 0) { // Scroll wheel
        realCamera.zoom *= 1 + zoomSpeed;
        realCamera.updateProjectionMatrix();
    }
    else if (mouseDZ > 0) {
        realCamera.zoom *= 1 - zoomSpeed;
        realCamera.updateProjectionMatrix();
    }
    mouseDX = 0;
    mouseDY = 0;
    mouseDZ = 0;
    keysUp = [];
}

function selectPoint(point) {
    point.children.forEach((c) => {
        if (c.pointCube) {
            c.material = redMat;
        }
        if (c.xGrip || c.yGrip || c.zGrip) {
            c.visible = true;
        }
    });
    var index = -1;
    for (var i = 0; i < selectedPoints.length; i++) {
        if (selectedPoints[i].pointId == point.pointId) {
            index = i;
            break;
        }
    }
    if (index < 0)
        selectedPoints.push(point);
}

function deselectPoint(point) {
    point.children.forEach((c) => {
        if (c.pointCube) {
            c.material = blueMat;
        }
        if (c.xGrip || c.yGrip || c.zGrip) {
            c.visible = false;
        }
    });
    var index = -1;
    for (var i = 0; i < selectedPoints.length; i++) {
        if (selectedPoints[i].pointId == point.pointId) {
            index = i;
            break;
        }
    }
    if (index >= 0)
        selectedPoints.splice(index, 1);
}

var snapDistance = 0;
var snapTranslate = new THREE.Vector3();
function getScreenTranslation() {
    // Translate 2D screen movement into the appropriate 3D movement.
    // Holy crap this was difficult to figure out.
    var dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.normalize();
    var viewUp = getUpVector(dir, camera.rotation.x, cam.rotation.y);
    var viewRight = new THREE.Vector3();
    viewRight.crossVectors(dir, viewUp);
    var translate = new THREE.Vector3(
        viewRight.x * -mouseDX + viewUp.x * -mouseDY,
        viewUp.y * -mouseDY,
        viewUp.z * -mouseDY + viewRight.z * -mouseDX);
    translate.multiplyScalar(1 / realCamera.zoom);
    if (snapDistance <= 0) // No snapping
        return translate;
    var snapped = new THREE.Vector3();
    snapTranslate.add(translate);
    if (Math.abs(snapTranslate.x) > snapDistance) {
        snapped.x = snapDistance * sign(snapTranslate.x);
        snapTranslate.x = 0;
    }
    if (Math.abs(snapTranslate.y) > snapDistance) {
        snapped.y = snapDistance * sign(snapTranslate.y);
        snapTranslate.y = 0;
    }
    if (Math.abs(snapTranslate.z) > snapDistance) {
        snapped.z = snapDistance * sign(snapTranslate.z);
        snapTranslate.z = 0;
    }
    return snapped;
}

function sign(n) {
    if (n < 0)
        return -1;
    return 1;
}

function getUpVector(dir, xr, yr) {
    var ob = new THREE.Object3D();
    ob.rotateY(yr);
    ob.rotateX(xr - Math.PI / 2);
    var up = new THREE.Vector3();
    ob.getWorldDirection(up);
    return up;
}

function animate() {
    requestAnimationFrame(animate);
    update();

    if (mouseDown) {
        mouseVec.x = ((mouseX - threediv.offsetLeft) / threediv.clientWidth) * 2 - 1;
        mouseVec.y = -(mouseY / threediv.clientHeight) * 2 + 1;
        raycaster.setFromCamera(mouseVec, realCamera);
        var intersects = raycaster.intersectObjects(scene.children, true);
        pickedObject = null;
        for (var i = 0; i < intersects.length; i++) {
            if (pickedObject == null && mouseDown && !boxStarted &&
                intersects[i].object.parent.pointId) {
                pickedObject = intersects[i].object;
                if (pickedMoveAxis == AXIS.none) {
                    if (pickedObject.xGrip) {
                        pickedMoveAxis = AXIS.x;
                    }
                    if (pickedObject.yGrip) {
                        pickedMoveAxis = AXIS.y;
                    }
                    if (pickedObject.zGrip) {
                        pickedMoveAxis = AXIS.z;
                    }
                }
                break;
            }
        }
    }

    renderer.render(scene, realCamera);
}
animate();