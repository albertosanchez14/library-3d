import * as THREE from "three";

export class Book {
  constructor(options = {}) {
    // Default book dimensions and properties
    this.width = options.width || 0.15;
    this.height = options.height || 0.22;
    this.thickness = options.thickness || 0.03;
    this.title = options.title || "Book";
    this.color = options.color || "#8B4513";
    this.spineColor = options.spineColor || "#654321";
    this.pageColor = options.pageColor || "#F5F5DC";

    this.autoPlaced = false;
    this.group = new THREE.Group();
    this.originalMaterials = new Map();
    this.createBook();
  }

  createBook() {
    this.createCover();
    this.createSpine();
    this.createPages();
  }

  createCover() {
    // Front and back cover geometry
    const coverGeometry = new THREE.BoxGeometry(this.width, this.height, 0.002);

    // Cover material with slight roughness for realistic look
    const coverMaterial = new THREE.MeshLambertMaterial({
      color: this.color,
      roughness: 0.8,
      metalness: 0.1,
    });

    // Front cover
    const frontCover = new THREE.Mesh(coverGeometry, coverMaterial);
    frontCover.position.set(0, 0, this.thickness / 2 + 0.001);
    this.group.add(frontCover);

    // Back cover
    const backCover = new THREE.Mesh(coverGeometry, coverMaterial);
    backCover.position.set(0, 0, -this.thickness / 2 - 0.001);
    this.group.add(backCover);

    this.frontCover = frontCover;
    this.backCover = backCover;

    this.originalMaterials.set(frontCover, coverMaterial.clone());
    this.originalMaterials.set(backCover, coverMaterial.clone());
  }

  createSpine() {
    // Spine geometry
    const spineGeometry = new THREE.BoxGeometry(
      this.thickness,
      this.height,
      0.002
    );

    // Spine material - usually darker than cover
    const spineMaterial = new THREE.MeshLambertMaterial({
      color: this.spineColor,
      roughness: 0.9,
    });

    const spine = new THREE.Mesh(spineGeometry, spineMaterial);
    spine.position.set(-this.width / 2, 0, 0);
    spine.rotation.y = Math.PI / 2;
    this.group.add(spine);

    this.spine = spine;
    this.originalMaterials.set(spine, spineMaterial.clone());
  }

  createPages() {
    // Pages geometry - slightly smaller than cover
    const pageWidth = this.width - 0.005;
    const pageHeight = this.height - 0.005;
    const pagesGeometry = new THREE.BoxGeometry(
      pageWidth,
      pageHeight,
      this.thickness - 0.004
    );

    // Pages material
    const pagesMaterial = new THREE.MeshLambertMaterial({
      color: this.pageColor,
      roughness: 0.9,
    });

    const pages = new THREE.Mesh(pagesGeometry, pagesMaterial);
    pages.position.set(0.0025, 0, 0);
    this.group.add(pages);

    this.pages = pages;
    this.originalMaterials.set(pages, pagesMaterial.clone());
  }

  addDetails() {
    // Add title text on spine (simplified as a darker rectangle)
    const titleGeometry = new THREE.PlaneGeometry(this.height * 0.8, 0.008);
    const titleMaterial = new THREE.MeshBasicMaterial({
      color: "#FFD700",
      transparent: true,
      opacity: 0.9,
    });

    const titlePlane = new THREE.Mesh(titleGeometry, titleMaterial);
    titlePlane.position.set(-this.width / 2 + 0.002, 0, 0);
    titlePlane.rotation.y = Math.PI / 2;
    titlePlane.rotation.z = Math.PI / 2;
    this.group.add(titlePlane);
    this.originalMaterials.set(titlePlane, titleMaterial.clone());

    // Add some bookmark ribbon
    const ribbonGeometry = new THREE.PlaneGeometry(0.01, this.height + 0.02);
    const ribbonMaterial = new THREE.MeshBasicMaterial({
      color: "#DC143C",
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });

    const ribbon = new THREE.Mesh(ribbonGeometry, ribbonMaterial);
    ribbon.position.set(this.width * 0.3, 0, this.thickness / 2 + 0.003);
    this.group.add(ribbon);
    this.originalMaterials.set(ribbon, ribbonMaterial.clone());
  }

  setAppearance(appearance) {
    this.autoPlaced = appearance;
    this.updateAppearanceState();
  }

  updateAppearanceState() {
    this.group.traverse((child) => {
      if (child.isMesh && this.originalMaterials.has(child)) {
        const originalMaterial = this.originalMaterials.get(child);

        if (!this.autoPlaced) {
          // Restore original material properties
          child.material.transparent = originalMaterial.transparent;
          child.material.opacity = originalMaterial.opacity;
          child.material.color.copy(originalMaterial.color);
        } else {
          // Apply semitransparent unselected state
          child.material.transparent = true;
          child.material.opacity = 0.3;
          // Optionally darken the color slightly
          child.material.color.copy(originalMaterial.color).multiplyScalar(0.7);
        }

        child.material.needsUpdate = true;
      }
    });
  }

  // Method to add the book to a scene
  addToScene(scene) {
    scene.add(this.group);
  }

  // Method to set position
  setPosition(x, y, z) {
    this.group.position.set(x, y, z);
  }

  // Method to set rotation
  setRotation(x, y, z) {
    this.group.rotation.set(x, y, z);
  }

  // Method to set scale
  setScale(scale) {
    this.group.scale.setScalar(scale);
  }

  // Method to get the Three.js group
  getGroup() {
    return this.group;
  }

  // Method to dispose of resources
  dispose() {
    this.group.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
  }
}
