import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'lil-gui';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

// Debug
const gui = new dat.GUI();
const parameters = {
    locationColor: '#ff0000',
    emissiveIntensity: 0.2,
    locationRotationSpeed: 1,
    sphereOrbitSpeed: 0.05,
    sphereDistance: 2.5,
    sphere2OrbitSpeed: 0.03,
    sphere2Distance: 5.0
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

// Configure map texture
mapTexture.wrapS = THREE.RepeatWrapping;
mapTexture.wrapT = THREE.RepeatWrapping;
mapTexture.repeat.set(4, 4);

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

// Ground plane with map texture
const planeGeometry = new THREE.PlaneGeometry(40, 40);
const planeMaterial = new THREE.MeshStandardMaterial({ 
    map: mapTexture,
    side: THREE.DoubleSide,
    roughness: 0.8,
    metalness: 0.2
});

// Create ground
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = Math.PI / 2;
plane.position.y = -0.5;
scene.add(plane);

// Create walls
const wallGeometry = new THREE.PlaneGeometry(40, 20);
const wallMaterial = new THREE.MeshStandardMaterial({
    map: mapTexture,
    side: THREE.DoubleSide,
    roughness: 0.8,
    metalness: 0.2
});

// Back wall
const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
backWall.position.z = -20;
backWall.position.y = 9.5;
scene.add(backWall);

// Left wall
const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
leftWall.rotation.y = Math.PI / 2;
leftWall.position.x = -20;
leftWall.position.y = 9.5;
scene.add(leftWall);

// Right wall
const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
rightWall.rotation.y = -Math.PI / 2;
rightWall.position.x = 20;
rightWall.position.y = 9.5;
scene.add(rightWall);

// Add ambient light for better wall visibility
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Add directional lights for better wall shadows
const mainLight = new THREE.DirectionalLight(0xffffff, 1);
mainLight.position.set(5, 5, 5);
scene.add(mainLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
fillLight.position.set(-5, 3, -5);
scene.add(fillLight);

// Add grid helper that matches the ground size
const gridHelper = new THREE.GridHelper(40, 40, 0x2d862d, 0x2d862d);
gridHelper.position.y = -0.49;
scene.add(gridHelper);

// Create location marker
const locationGeometry = new THREE.SphereGeometry(0.7, 32, 32);
const material = new THREE.MeshStandardMaterial({
    color: parameters.locationColor,
    metalness: 0.7,
    roughness: 0.2,
    emissive: parameters.locationColor,
    emissiveIntensity: parameters.emissiveIntensity
});

const location = new THREE.Mesh(locationGeometry, material);
location.position.y = 1;
location.castShadow = true;

// Add glow effect to location
const locationLight = new THREE.PointLight(parameters.locationColor, 2, 3);
locationLight.position.set(0, 0, 0);
location.add(locationLight);

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

// Create second sphere
const sphere2Geometry = new THREE.SphereGeometry(0.5, 128, 128);
const sphere2Material = new THREE.MeshStandardMaterial({
    map: sphereTexture.clone(),
    normalMap: normalMap.clone(),
    normalScale: new THREE.Vector2(1, 1),
    roughness: 0.2,
    metalness: 0.8,
    envMapIntensity: 1.5,
    side: THREE.DoubleSide
});

const sphere2 = new THREE.Mesh(sphere2Geometry, sphere2Material);

// Add point light to second sphere
const sphere2Light = new THREE.PointLight(0xffffff, 1, 10);
sphere2Light.distance = 5;
sphere2Light.decay = 2;
sphere2.add(sphere2Light);

scene.add(sphere2);

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(8, 4, 8);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2; // Prevent camera from going below ground
controls.minDistance = 5;
controls.maxDistance = 20;
controls.target.set(0, 0, 0);
controls.update();

// Add fog for depth
scene.fog = new THREE.Fog(0x000000, 20, 50);

// Debug controls
const locationFolder = gui.addFolder('Location Marker');
locationFolder.addColor(parameters, 'locationColor')
    .name('Color')
    .onChange(() => {
        material.color.setStyle(parameters.locationColor);
        material.emissive.setStyle(parameters.locationColor);
        locationLight.color.setStyle(parameters.locationColor);
    });

locationFolder.add(parameters, 'emissiveIntensity')
    .min(0)
    .max(1)
    .step(0.01)
    .name('Glow Intensity')
    .onChange(() => {
        material.emissiveIntensity = parameters.emissiveIntensity;
    });

// Add GUI controls for animation
const animationFolder = gui.addFolder('Animation');
animationFolder.add(parameters, 'locationRotationSpeed')
    .min(0)
    .max(5)
    .step(0.1)
    .name('Location Speed');

animationFolder.add(parameters, 'sphereOrbitSpeed')
    .min(0.01)
    .max(0.1)
    .step(0.01)
    .name('First Orbit Speed');

animationFolder.add(parameters, 'sphereDistance')
    .min(1)
    .max(5)
    .step(0.1)
    .name('First Orbit Distance');

animationFolder.add(parameters, 'sphere2OrbitSpeed')
    .min(0.01)
    .max(0.1)
    .step(0.01)
    .name('Second Orbit Speed');

animationFolder.add(parameters, 'sphere2Distance')
    .min(1)
    .max(8)
    .step(0.1)
    .name('Second Orbit Distance');

// Load font and create text
const fontLoader = new FontLoader();
fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
    // First text (Sir papasara ko Sir)
    const textGeometry1 = new TextGeometry('Sir papasara ko Sir', {
        font: font,
        size: 2,
        height: 0.2,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelOffset: 0,
        bevelSegments: 5
    });

    // Second text (Leo Carl Balladares)
    const textGeometry2 = new TextGeometry('Leo Carl Balladares', {
        font: font,
        size: 1.5, // Slightly smaller size
        height: 0.2,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelOffset: 0,
        bevelSegments: 5
    });

    // Center both texts
    textGeometry1.center();
    textGeometry2.center();

    const textMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        metalness: 0.3,
        roughness: 0.4,
        emissive: 0xffffff,
        emissiveIntensity: 0.2
    });

    // Create meshes for both texts
    const text1 = new THREE.Mesh(textGeometry1, textMaterial);
    const text2 = new THREE.Mesh(textGeometry2, textMaterial.clone());

    // Position first text
    text1.position.z = -19.5;
    text1.position.y = 15;
    text1.rotation.x = -Math.PI * 0.1;

    // Position second text below first text
    text2.position.z = -19.5;
    text2.position.y = 12; // Lower position
    text2.rotation.x = -Math.PI * 0.1;

    // Add glow effects
    const textGlow1 = new THREE.PointLight(0xffffff, 1, 10);
    textGlow1.position.copy(text1.position);
    textGlow1.position.z += 1;

    const textGlow2 = new THREE.PointLight(0xffffff, 1, 10);
    textGlow2.position.copy(text2.position);
    textGlow2.position.z += 1;
    
    scene.add(text1);
    scene.add(text2);
    scene.add(textGlow1);
    scene.add(textGlow2);

    // Add GUI controls for both texts
    const textFolder = gui.addFolder('Text Settings');
    
    // Controls for first text
    const text1Folder = textFolder.addFolder('Top Text');
    text1Folder.add(text1.position, 'y', 10, 20, 0.1).name('Height');
    text1Folder.add(textMaterial, 'emissiveIntensity', 0, 1, 0.01).name('Glow');
    text1Folder.addColor({ color: '#ffffff' }, 'color')
        .name('Color')
        .onChange((value) => {
            textMaterial.color.setStyle(value);
            textMaterial.emissive.setStyle(value);
            textGlow1.color.setStyle(value);
        });

    // Controls for second text
    const text2Folder = textFolder.addFolder('Bottom Text');
    text2Folder.add(text2.position, 'y', 8, 18, 0.1).name('Height');
    text2Folder.add(text2.material, 'emissiveIntensity', 0, 1, 0.01).name('Glow');
    text2Folder.addColor({ color: '#ffffff' }, 'color')
        .name('Color')
        .onChange((value) => {
            text2.material.color.setStyle(value);
            text2.material.emissive.setStyle(value);
            textGlow2.color.setStyle(value);
        });
});

// Animate
const clock = new THREE.Clock();
let angle = 0;
let angle2 = Math.PI; // Start the second sphere on the opposite side

const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    // Update first sphere position
    angle += parameters.sphereOrbitSpeed;
    sphere.position.x = Math.cos(angle) * parameters.sphereDistance;
    sphere.position.z = Math.sin(angle) * parameters.sphereDistance;
    sphere.position.y = Math.sin(elapsedTime) * 0.2 + 0.5;
    
    // Rotate first sphere
    sphere.rotation.y += 0.01;
    sphere.rotation.x += 0.005;

    // Update second sphere position with different pattern
    angle2 += parameters.sphere2OrbitSpeed;
    sphere2.position.x = Math.sin(angle2) * parameters.sphere2Distance;
    sphere2.position.z = Math.cos(angle2) * parameters.sphere2Distance;
    sphere2.position.y = Math.cos(elapsedTime * 1.5) * 0.3 + 0.7;

    // Rotate second sphere differently
    sphere2.rotation.y -= 0.015;
    sphere2.rotation.z += 0.008;

    // Animate the location sphere with a gentle pulsing effect
    location.scale.setScalar(1 + Math.sin(elapsedTime * 2) * 0.05);
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