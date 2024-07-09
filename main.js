let scene, camera, renderer, ground, gridHelper;
let polygons = [];
let currentPolygon = null;
let isDrawing = true;
let selectedPolygon = null;
let mouse = new THREE.Vector2();
let raycaster = new THREE.Raycaster();

init();
animate();

function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshBasicMaterial({ color: 0xe0e0e0, side: THREE.DoubleSide });
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Grid
    gridHelper = new THREE.GridHelper(20, 20, 0x000000, 0x000000);
    scene.add(gridHelper);

    document.addEventListener('click', onMouseClick, false);
    document.addEventListener('mousedown', onMouseDown, false);
    document.addEventListener('mouseup', onMouseUp, false);
    document.addEventListener('mousemove', onMouseMove, false);

    document.getElementById('completeButton').addEventListener('click', completePolygon);
    document.getElementById('copyButton').addEventListener('click', copyPolygon);
    document.getElementById('resetButton').addEventListener('click', resetScene);
}

function onMouseClick(event) {
    if (!isDrawing) return;

    updateMouse(event);
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(ground);

    if (intersects.length > 0) {
        const point = intersects[0].point;
        if (!currentPolygon) {
            currentPolygon = new Polygon();
        }
        currentPolygon.addVertex(point);
    }
}

function onMouseDown(event) {
    updateMouse(event);
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(polygons);

    if (intersects.length > 0) {
        selectedPolygon = intersects[0].object;
    }
}

function onMouseUp(event) {
    selectedPolygon = null;
}

function onMouseMove(event) {
    if (selectedPolygon) {
        updateMouse(event);
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(ground);

        if (intersects.length > 0) {
            const point = intersects[0].point;
            selectedPolygon.position.set(point.x, 0, point.z);
        }
    }
}

function updateMouse(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

class Polygon {
    constructor() {
        this.vertices = [];
        this.line = null;
    }

    addVertex(point) {
        this.vertices.push(new THREE.Vector3(point.x, 0, point.z));

        const dotGeometry = new THREE.BufferGeometry();
        dotGeometry.setAttribute('position', new THREE.Float32BufferAttribute([point.x, 0, point.z], 3));
        const dotMaterial = new THREE.PointsMaterial({ size: 0.1, sizeAttenuation: false, color: 0xff0000 });
        const dot = new THREE.Points(dotGeometry, dotMaterial);
        scene.add(dot);

        // Update the line
        if (this.line) scene.remove(this.line);
        if (this.vertices.length > 1) {
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(this.vertices);
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
            this.line = new THREE.Line(lineGeometry, lineMaterial);
            scene.add(this.line);
        }
    }

    complete() {
        if (this.vertices.length < 3) return;

        const shape = new THREE.Shape(this.vertices.map(v => new THREE.Vector2(v.x, v.z)));
        const geometry = new THREE.ShapeGeometry(shape);
        const material = new THREE.MeshBasicMaterial({ color: 0xffa500, side: THREE.DoubleSide });
        const polygonMesh = new THREE.Mesh(geometry, material);
        polygonMesh.rotation.x = Math.PI / 2;
        scene.add(polygonMesh);

        const edgesGeometry = new THREE.EdgesGeometry(geometry);
        const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
        const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        polygonMesh.add(edges);

        polygons.push(polygonMesh);
        this.vertices = [];
        if (this.line) {
            scene.remove(this.line);
            this.line = null;
        }
        isDrawing = false;
        currentPolygon = null;
    }
}

function completePolygon() {
    if (currentPolygon) {
        currentPolygon.complete();
    }
}

function copyPolygon() {
    if (polygons.length === 0) return;

    // Clone the last polygon
    const original = polygons[polygons.length - 1];
    const copy = original.clone();

    // Adjust the position of the copy
    copy.position.set(original.position.x + 1, original.position.y, original.position.z + 1);
    scene.add(copy);

    // Add the copy to the list of polygons
    polygons.push(copy);
}

function resetScene() {
    while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
    }

    scene.add(ground);
    scene.add(gridHelper);
    polygons = [];
    isDrawing = true;
    currentPolygon = null;
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}