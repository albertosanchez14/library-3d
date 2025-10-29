import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const canvas = document.getElementById("canvas");

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color("#F0F0F0");

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 4);

// Objects
const loader = new GLTFLoader();
loader.load(
  "./src/white_bookshelf/scene.gltf",
  (gltf) => {
    const bookshelf = gltf.scene;
    bookshelf.scale.set(0.005, 0.005, 0.005);

    const box = new THREE.Box3().setFromObject(bookshelf);
    const center = box.getCenter(new THREE.Vector3());
    bookshelf.position.set(-center.x, -center.y, -center.z);

    // Get all components from the scene
    const components = [];
    bookshelf.traverse((child) => {
      if (child.isMesh) {
        components.push({
          name: child.name,
          mesh: child,
          material: child.material,
          geometry: child.geometry,
          position: child.position.clone(),
          rotation: child.rotation.clone(),
          scale: child.scale.clone()
        });
        
        console.log('Component found:', {
          name: child.name,
          type: child.type,
          material: child.material?.name || 'Unnamed material',
          vertices: child.geometry?.attributes.position?.count || 0
        });
      }
    });
    console.log('Total components found:', components.length);
    console.log('Components:', components);

    scene.add(bookshelf);
  },
  (progress) => {
    console.log("Loading progress:", progress);
  },
  (error) => {
    console.error("Error loading model:", error);
  }
);

// Light
const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.render(scene, camera);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.enablePan = true;

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
