import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'lil-gui';

// Debug
const gui = new dat.GUI();
const parameters = {
    locationColor: '#ff0000',
    emissiveIntensity: 0.2,
    locationRotationSpeed: 1,
    sphereOrbitSpeed: 0.05,
    sphereDistance: 2.5
}

// Function to convert hue to RGB color
function hueToColor(hue) {
    return new THREE.Color().setHSL(hue, 1, 0.5);
}

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

// Renderer setup first
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

// Texture Loader
const textureLoader = new THREE.TextureLoader();

// Configure texture loading settings
const loadTextureWithSettings = (path) => {
    const texture = textureLoader.load(path);
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return texture;
};

// Load textures with enhanced settings
const metalTexture = loadTextureWithSettings('./textures/metal.jpg');
const mapTexture = loadTextureWithSettings('./textures/map.jpg');
const backgroundTexture = loadTextureWithSettings('./textures/space.jpg');
const sphereTexture = loadTextureWithSettings('./textures/Material_2077.jpg');

// Configure sphere texture specifically
sphereTexture.wrapS = THREE.RepeatWrapping;
sphereTexture.wrapT = THREE.RepeatWrapping;
sphereTexture.repeat.set(2, 2); // Repeat the texture
sphereTexture.encoding = THREE.sRGBEncoding;

// Create normal map from texture
const normalMap = sphereTexture.clone();
normalMap.encoding = THREE.LinearEncoding;

// Scene
const scene = new THREE.Scene();
scene.background = backgroundTexture;

// Create custom indicator texture
const createIndicatorTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');

    // Create gradient
    const gradient1 = context.createRadialGradient(
        128, 128, 0,
        128, 128, 128
    );
    gradient1.addColorStop(0, 'rgba(0, 255, 255, 0.5)');
    gradient1.addColorStop(0.5, 'rgba(0, 255, 255, 0.2)');
    gradient1.addColorStop(1, 'rgba(0, 255, 255, 0)');

    // Draw main glow
    context.fillStyle = gradient1;
    context.fillRect(0, 0, 256, 256);

    // Draw rings
    context.strokeStyle = 'rgba(0, 255, 255, 0.5)';
    context.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
        context.beginPath();
        context.arc(128, 128, 50 + i * 30, 0, Math.PI * 2);
        context.stroke();
    }

    // Draw scan lines
    context.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    context.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
        context.save();
        context.translate(128, 128);
        context.rotate(i * Math.PI / 4);
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(128, 0);
        context.stroke();
        context.restore();
    }

    return new THREE.CanvasTexture(canvas);
};

const indicatorTexture = createIndicatorTexture();

// Add grid helper for map-like effect
const gridHelper = new THREE.GridHelper(20, 40, 0x2d862d, 0x2d862d);
gridHelper.position.y = -0.5; // Moved very close to objects
scene.add(gridHelper);

// Ground plane with map texture
const planeGeometry = new THREE.PlaneGeometry(20, 20);
const planeMaterial = new THREE.MeshStandardMaterial({ 
    map: mapTexture,
    side: THREE.DoubleSide,
    roughness: 0.8,
    metalness: 0.2
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = Math.PI / 2;
plane.position.y = -0.5;
scene.add(plane);

// Location Marker (3D)
const locationGeometry = new THREE.ConeGeometry(1, 2, 32);
const material = new THREE.MeshStandardMaterial({ 
    color: 0xff0000,  // Set a base color (red)
    metalness: 0.3,
    roughness: 0.4,
    emissive: 0xff0000,  // Add some self-illumination
    emissiveIntensity: 0.2
}); 

// Mesh for the location marker
const location = new THREE.Mesh(locationGeometry, material);
location.rotation.x = Math.PI;
location.position.y = 1;
scene.add(location);

// Create circular indicator under location marker
const indicatorGeometry = new THREE.CircleGeometry(1.5, 32);
const indicatorMaterial = new THREE.MeshBasicMaterial({
    map: indicatorTexture,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});
const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
indicator.rotation.x = -Math.PI / 2;
indicator.position.y = -0.48; // Slightly above the ground plane
scene.add(indicator);

// Enhanced lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1); // Increased intensity
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
directionalLight2.position.set(-5, 3, -5);
scene.add(directionalLight2);

// Add a spotlight focused on the location marker
const spotLight = new THREE.SpotLight(0xffffff, 1);
spotLight.position.set(0, 5, 0);
spotLight.target = location;
spotLight.angle = Math.PI / 4;
spotLight.penumbra = 0.1;
scene.add(spotLight);
scene.add(spotLight.target);

// Sphere with increased geometry detail
const sphereGeometry = new THREE.SphereGeometry(0.5, 128, 128); // Increased size and segments

const sphereMaterial = new THREE.MeshStandardMaterial({ 
    map: sphereTexture,
    normalMap: normalMap,
    normalScale: new THREE.Vector2(1, 1),
    roughness: 0.2,
    metalness: 0.8,
    envMapIntensity: 1.5,
    side: THREE.DoubleSide
});

const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

// Add a point light that follows the sphere for better illumination
const sphereLight = new THREE.PointLight(0xffffff, 1);
sphereLight.distance = 5;
sphereLight.decay = 2;
sphere.add(sphereLight); // Attach light to sphere so it moves with it

scene.add(sphere);

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(0, 2, 5);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 0, 0);
controls.update();

// Debug controls
const locationFolder = gui.addFolder('Location Marker');
locationFolder.addColor(parameters, 'locationColor')
    .name('Color')
    .onChange(() => {
        material.color.setStyle(parameters.locationColor);
        material.emissive.setStyle(parameters.locationColor);
    });

locationFolder.add(parameters, 'emissiveIntensity')
    .min(0)
    .max(1)
    .step(0.01)
    .name('Glow Intensity')
    .onChange(() => {
        material.emissiveIntensity = parameters.emissiveIntensity;
    });

// Animation controls
const animationFolder = gui.addFolder('Animation');
animationFolder.add(parameters, 'locationRotationSpeed')
    .min(0)
    .max(5)
    .step(0.1)
    .name('Location Speed');

animationFolder.add(parameters, 'sphereOrbitSpeed')
    .min(0.01)
    .max(0.2)
    .step(0.01)
    .name('Orbit Speed');

animationFolder.add(parameters, 'sphereDistance')
    .min(1)
    .max(5)
    .step(0.1)
    .name('Orbit Distance');

// Add GUI controls for sphere material
const sphereFolder = gui.addFolder('Sphere Settings');
sphereFolder.add(sphereMaterial, 'roughness', 0, 1, 0.01).name('Roughness');
sphereFolder.add(sphereMaterial, 'metalness', 0, 1, 0.01).name('Metalness');
sphereFolder.add(sphereMaterial.normalScale, 'x', 0, 2, 0.01).name('Normal Scale').onChange((value) => {
    sphereMaterial.normalScale.y = value;
});

// Animate
const clock = new THREE.Clock();
let angle = 0;

const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    // Update sphere position to orbit horizontally around the location
    angle += parameters.sphereOrbitSpeed;
    sphere.position.x = Math.cos(angle) * parameters.sphereDistance;
    sphere.position.z = Math.sin(angle) * parameters.sphereDistance;
    
    // Add gentle up and down motion to the sphere
    sphere.position.y = Math.sin(elapsedTime) * 0.2;
    
    // Rotate the sphere itself
    sphere.rotation.y += 0.01;
    sphere.rotation.x += 0.005;

    // Rotate the location marker
    location.rotation.y = elapsedTime * parameters.locationRotationSpeed;
    location.position.y = 1 + Math.sin(elapsedTime * 2) * 0.1;

    // Animate the indicator
    indicator.rotation.z = -elapsedTime * 0.3; // Slower rotation
    const pulseSpeed = 2;
    const baseOpacity = 0.7;
    const pulseAmount = 0.2;
    indicator.material.opacity = baseOpacity + Math.sin(elapsedTime * pulseSpeed) * pulseAmount;
    
    // Scale pulse effect
    const baseScale = 1;
    const scaleAmount = 0.1;
    const scale = baseScale + Math.sin(elapsedTime * pulseSpeed) * scaleAmount;
    indicator.scale.set(scale, scale, 1);

    // Update controls
    controls.update();

    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
};

tick();

// Window resize event
window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(window.devicePixelRatio);
});