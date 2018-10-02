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
var keys = { up: 38, down: 40, right: 39, left: 37, a: 65, s: 83, d: 68, w: 87, shift: 16, f: 70, space: 32, q: 81, z: 90, e: 69, r: 82, t: 84}
addEventListener("keydown", function(e) {
    if (Object.values(keys).includes(e.keyCode))
        e.preventDefault();
    keysDown[e.keyCode] = true;
    delete keysUp[e.keyCode];
}, false);

addEventListener("keyup", function(e) {
    delete keysDown[e.keyCode];
    keysUp[e.keyCode] = true;
}, false);

// THREE.js materials
var whiteLineMat = new THREE.LineBasicMaterial({color: 0xffffff});
var redLineMat = new THREE.LineBasicMaterial({color: 0xff0000});
var greenLineMat = new THREE.LineBasicMaterial({color: 0x00ff00});
var blueLineMat = new THREE.LineBasicMaterial({color: 0x0000ff});

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

// Rotate, zoom, pan, act on keypresses.
var rotateFactor = 100;
var sprintFactor = 1;
var zoomSpeed = 0.2;
function update() {
    if (keys.a in keysUp)
        addPoint();
    
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
    if (mouseButton == 0) { // Left click
        cam.rotation.y += mouseDX / rotateFactor;
        camera.rotation.x += mouseDY / rotateFactor;
        camAxes.rotation.y -= mouseDX / rotateFactor;
        if (camera.rotation.x > Math.PI / 2)
            camera.rotation.x = Math.PI / 2;
        if (camera.rotation.x < -Math.PI / 2)
            camera.rotation.x = -Math.PI / 2;
    }
    else if (mouseButton == 2) { // Right click
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
        cam.position.add(translate);
    }
    else if (mouseButton == 1) { // Middle click
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

function getUpVector(dir, xr, yr) {
    var ob = new THREE.Object3D();
    ob.rotateY(yr);
    ob.rotateX(xr - Math.PI / 2);
    var up = new THREE.Vector3();
    ob.getWorldDirection(up);
    return up;
}

// Handle mouse clicks
var mouseButton = -1;
var mouseX;
var mouseY;
var mouseDX = 0;
var mouseDY = 0;
var mouseDZ = 0; // Scroll wheel
var mouseDown = false;

function threeDown(event) {
    event.preventDefault();
    mouseButton = event.button;
    mouseDown = true;
    mouseX = event.clientX;
    mouseY = event.clientY;
}

function threeUp(event) {
    event.preventDefault();
    mouseButton = -1;
    mouseDown = false;
    mouseX = event.clientX;
    mouseY = event.clientY;
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

function threeOut(event) {
    mouseDown = false;
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

function animate() {
    requestAnimationFrame( animate);
    update();

    mouseVec.x = ((mouseX - threediv.offsetLeft) / threediv.clientWidth) * 2 - 1;
    mouseVec.y = -(mouseY / threediv.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouseVec, realCamera);
    var intersects = raycaster.intersectObjects(scene.children, true);
    for (var i = 0; i < intersects.length; i++) {
        console.log(intersects[i]);
    }

    renderer.render(scene, realCamera);
}
animate();