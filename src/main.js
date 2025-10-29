import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Book } from "./components/book.js";

const BOOKSHELF_POSITIONS = [
  { x: -2, y: 0, z: 0 },
  { x: 2, y: -3, z: 0 },
  { x: -2, y: -6, z: 0 },
  { x: 2, y: -9, z: 0 },
];

const bookshelves = [];
const books = [];
const bookshelfTopSurfaces = []; 

const canvas = document.getElementById("canvas");

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
// const camera = new THREE.OrthographicCamera(
//   window.innerWidth / -300,
//   window.innerWidth / 300,
//   window.innerHeight / 300,
//   window.innerHeight / -300,
//   0.1,
//   1000
// );
camera.position.set(0, 0, 4);

// Objects
const loader = new GLTFLoader();
loader.load(
  "./src/wooden_wall_bookshelf/scene.gltf",
  (gltf) => {
    for (const pos of BOOKSHELF_POSITIONS) {
      const bookshelf = gltf.scene.clone();
      bookshelf.scale.set(1.5, 1.5, 1.5);
      bookshelf.position.set(pos.x, pos.y, pos.z);
      scene.add(bookshelf);
      bookshelves.push(bookshelf);

      // Calculate bounding box from actual bookshelf dimensions
      const overallBoundingBox = new THREE.Box3();
      overallBoundingBox.expandByObject(bookshelf);
      // Get the size and center of the overall bounding box
      const size = overallBoundingBox.getSize(new THREE.Vector3());
      const center = overallBoundingBox.getCenter(new THREE.Vector3());
      // Calculate top position
      const topPosition = new THREE.Vector3(
        center.x,
        center.y + size.y / 2, // Top of the bounding box
        center.z
      );

      // Store bookshelf top surface data for snapping
      bookshelfTopSurfaces.push({
        bookshelf: bookshelf,
        topY: topPosition.y,
        minX: center.x - size.x / 2,
        maxX: center.x + size.x / 2,
        minZ: center.z - size.z / 2,
        maxZ: center.z + size.z / 2,
        center: center.clone(),
      });

      // TODO: Debug only - Create a red mesh box with the calculated dimensions
      const boxGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
      const boxMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        wireframe: true,
        transparent: true,
        opacity: 0.7,
      });
      const boundingBox = new THREE.Mesh(boxGeometry, boxMaterial);
      // Position the box at the calculated center
      boundingBox.position.copy(center);
      scene.add(boundingBox);

      // TODO: Debug only - add a visual indicator for the top position
      const topIndicatorGeometry = new THREE.SphereGeometry(0.05, 8, 8);
      const topIndicatorMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
      });
      const topIndicator = new THREE.Mesh(
        topIndicatorGeometry,
        topIndicatorMaterial
      );
      topIndicator.position.copy(topPosition);
      scene.add(topIndicator);
    }
  },
  (progress) => {
    console.log("Loading progress:", progress);
  },
  (error) => {
    console.error("Error loading model:", error);
  }
);
const myBook = new Book({
  width: 0.2,
  height: 1,
  thickness: 0.33,
  color: "#8B4513",
  title: "My Book",
});
myBook.addToScene(scene);
myBook.setPosition(0, 0, 0);
myBook.setRotation(0, Math.PI / 2, 0);
books.push(myBook);

// Light
const ambientLight = new THREE.AmbientLight(0x404040, 0);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 10);
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
controls.enableZoom = false; // Disable zoom
controls.enablePan = true;
controls.enableRotate = false; // Disable rotation
controls.enabled = true; // Ensure controls are enabled initially

// Snapping configuration
const SNAP_MARGIN = 0.5;
// Function to find the nearest bookshelf top surface for snapping
function findNearestBookshelfTop(position, bookGroup = null) {
  let nearestShelf = null;
  let minDistance = Infinity;

  // Get book height to calculate bottom position
  let bookHeight = 0.22; // Default height
  if (bookGroup) {
    const book = books.find((b) => b.getGroup() === bookGroup);
    if (book) {
      bookHeight = book.height;
    }
  }

  // Calculate the bottom position of the book
  const bookBottomY = position.y - bookHeight / 2;

  for (const shelf of bookshelfTopSurfaces) {
    // Check if the book is within the horizontal bounds of the bookshelf
    if (
      position.x >= shelf.minX &&
      position.x <= shelf.maxX &&
      position.z >= shelf.minZ &&
      position.z <= shelf.maxZ
    ) {
      // Calculate vertical distance from book bottom to the top surface
      const distance = Math.abs(bookBottomY - shelf.topY);

      // If within snap margin and closer than previous candidates
      if (distance <= SNAP_MARGIN && distance < minDistance) {
        minDistance = distance;
        nearestShelf = shelf;
      }
    }
  }

  return nearestShelf;
}
// Function to snap book to bookshelf top
function snapToBookshelfTop(bookGroup, shelf) {
  // Find the book instance to get its height
  const book = books.find((b) => b.getGroup() === bookGroup);
  if (book) {
    // Position the book so its bottom touches the bookshelf top surface
    // Since the book's position is at its center, we need to add half its height
    bookGroup.position.y = shelf.topY + book.height / 2;
  } else {
    // Fallback if book instance not found
    bookGroup.position.y = shelf.topY;
  }
}

// Drag controls for books
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isDragging = false;
let dragObject = null;
let dragOffset = new THREE.Vector3();
// Mouse event handlers
function onMouseDown(event) {
  // Update mouse coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  // Update raycaster
  raycaster.setFromCamera(mouse, camera);
  // Check for intersections with books
  const bookObjects = books.map((book) => book.getGroup());
  const intersects = raycaster.intersectObjects(bookObjects, true);
  if (intersects.length > 0) {
    isDragging = true;
    dragObject = intersects[0].object;
    // Find the parent book group
    while (dragObject && !bookObjects.includes(dragObject)) {
      dragObject = dragObject.parent;
    }
    if (dragObject) {
      // Calculate offset from click point to object center
      const intersectionPoint = intersects[0].point;
      dragOffset.copy(intersectionPoint).sub(dragObject.position);
      // Disable orbit controls while dragging
      controls.enabled = false;
    }
  }
}
function onMouseMove(event) {
  if (!isDragging || !dragObject) return;
  // Update mouse coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  // Update raycaster
  raycaster.setFromCamera(mouse, camera);
  // Create a plane at the current z position of the dragged object
  const plane = new THREE.Plane(
    new THREE.Vector3(0, 0, 1),
    -dragObject.position.z
  );
  const intersectionPoint = new THREE.Vector3();
  if (raycaster.ray.intersectPlane(plane, intersectionPoint)) {
    // Update position only on x and y axes
    const newX = intersectionPoint.x - dragOffset.x;
    const newY = intersectionPoint.y - dragOffset.y;
    dragObject.position.x = newX;
    dragObject.position.y = newY;
  }
}

function onMouseUp(event) {
  if (isDragging) {
    // Find the nearest bookshelf top surface for snapping
    const nearestShelf = findNearestBookshelfTop(
      dragObject.position,
      dragObject
    );
    isDragging = false;
    if (nearestShelf) {
      // Snap the book to the bookshelf top
      snapToBookshelfTop(dragObject, nearestShelf);
    }
    // Re-enable orbit controls
    controls.enabled = true;
  }
}

// Add event listeners for drag functionality
renderer.domElement.addEventListener("mousedown", onMouseDown);
renderer.domElement.addEventListener("mousemove", onMouseMove);
renderer.domElement.addEventListener("mouseup", onMouseUp);

// Prevent context menu on right click to avoid interference
renderer.domElement.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

// Custom zoom handling with Ctrl+click
let isCtrlPressed = false;
document.addEventListener("keydown", (event) => {
  if (event.key === "Control") {
    isCtrlPressed = true;
  }
});
document.addEventListener("keyup", (event) => {
  if (event.key === "Control") {
    isCtrlPressed = false;
  }
});
renderer.domElement.addEventListener("wheel", (event) => {
  if (isCtrlPressed) {
    // Prevent default zoom behavior
    event.preventDefault();

    // Custom zoom implementation
    const zoomSpeed = 0.5;
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    // Zoom in/out based on wheel direction
    const zoomDelta = event.deltaY > 0 ? -zoomSpeed : zoomSpeed;
    camera.position.addScaledVector(direction, zoomDelta);
  }
});

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
