'use strict';

const Renderer = require('incheon').render.Renderer;
const THREE = require('three');

const DEBUG__SHOW_CANNON_FRAMES = false;

class SLRenderer extends Renderer {

    // constructor
    constructor(gameEngine, clientEngine) {
        super(gameEngine, clientEngine);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.state = 54321;
    }

    // setup the 3D scene
    init() {

        super.init();

        console.log('setting up client-side scene');

        // setup the scene
        this.scene = new THREE.Scene();

        // setup camera
        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 45, 100);
        this.camera.up = new THREE.Vector3(0, 1, 0);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.scene.add(this.camera);

        // setup light
        this.scene.add(new THREE.AmbientLight(0x606060));
        this.pointLight = new THREE.PointLight(0xffffff, 2, 100);
        this.pointLight.position.set(15, 40, 15);
        this.pointLight.castShadow = true;
        this.pointLight.shadowDarkness = 0.15;
        this.pointLight.shadow.camera.near = 1;
        this.pointLight.shadow.camera.far = 100;
        this.pointLight.shadow.bias = 0.01;
        this.scene.add(this.pointLight);

        // setup the renderer and add the canvas to the body
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.BasicShadowMap;
        document.getElementById('viewport').appendChild(this.renderer.domElement);

        // a local raycaster
        this.raycaster = new THREE.Raycaster();

        return new Promise((resolve, reject) => {

            if (!DEBUG__SHOW_CANNON_FRAMES) {
                this.emit("ready");
                this.isReady = true;
                resolve();
                return;
            }

            // show cannon objects
            window.CANNON = this.gameEngine.physicsEngine.CANNON;
            let head = document.getElementsByTagName('head')[0];
            let script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = '/src/lib/CannonDebugRenderer.js';
            script.onload = () => {
                this.cannonDebugRenderer = new THREE.CannonDebugRenderer( this.scene, this.gameEngine.physicsEngine.world );
                this.emit("ready");
                this.isReady = true;
                resolve();
            };
            head.appendChild(script);
        });
    }

    // given a point on the camera (screen click)
    // calculate a corresponding impulse
    calculateImpulse(x, y, selfObj) {
        let mouse = new THREE.Vector2(x, y);
        this.raycaster.setFromCamera(mouse, this.camera);
        let intersects = this.raycaster.intersectObjects(this.scene.children);

        for (let i in intersects) {
            if (intersects[i].object === this.floor) {
                let intersectPoint = intersects[i].point;
                let impulseVector = intersectPoint.sub(selfObj.renderObj.position);
                return impulseVector;
            }
        }

        console.log(`failed to calculate impulse`);
        return null;
    }

    // single step
    draw() {
        super.draw();
        this.renderer.render(this.scene, this.camera);
        if (this.cannonDebugRenderer)
            this.cannonDebugRenderer.update();
    }

    nextFloat() {
        const m = 0x80000000;
        const a = 1103515245;
        const c = 12345;
        this.state = (a * this.state + c) % m;
        return this.state / (m - 1);
    }

    // add one object: a single sphere
    addCar(id, position, radius) {

        // generate a color which is random but not dark
        let r = this.nextFloat();
        let g = this.nextFloat();
        let b = Math.max(0, 1 - r - g);
        let objColor = new THREE.Color(r, g, b);

        // create the visual object
        let sphereGeometry = new THREE.BoxGeometry(20, 20, 40);
        let sphereMaterial = new THREE.MeshPhongMaterial({
            color: objColor,
            wireframe: false,
            shininess: 10
        });
        let sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.castShadow = true;
        sphere.receiveShadow = true;
        sphere.position.copy(position);
        this.scene.add(sphere);
        return sphere;
    }

    addSumoRing(position, radiusTop, radiusBottom, height, radiusSegments) {
        // setup floor
        let floorMaterial = new THREE.MeshPhongMaterial({
            color: 0xde761a,
            wireframe: false,
            shininess: 30
        });
        this.floor = new THREE.Mesh(
            new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radiusSegments),
            floorMaterial);
        this.floor.position.copy(position);
        this.floor.receiveShadow = true;
        this.scene.add(this.floor);

        return this.floor;
    }

    addSumoBox(position, x, y, z) {
        // setup floor
        let floorMaterial = new THREE.MeshPhongMaterial({
            color: 0xde761a,
            wireframe: false,
            shininess: 30
        });
        this.floor = new THREE.Mesh(
            new THREE.BoxGeometry(x, y, z),
            floorMaterial);
        this.floor.position.copy(position);
        this.floor.receiveShadow = true;
        this.scene.add(this.floor);

        return this.floor;
    }

    removeObject(o) {
        this.scene.remove(o);
    }
}

module.exports = SLRenderer;