import * as THREE from 'three';

export class Bookshelf {
    constructor() {
        this.group = new THREE.Group();
        this.createBookshelf();
    }

    createBookshelf() {        
        // Bookshelf dimensions
        const shelfWidth = 4;
        const shelfHeight = 0.1;
        const shelfDepth = 1;
        const shelfSpacing = 1.2;
        
        // Back panel
        const backPanelGeometry = new THREE.BoxGeometry(shelfWidth, 3.5, 0.1);
        const backPanelMaterial = new THREE.MeshStandardMaterial({
            color: 0xC0C0C0 
        });
        const backPanel = new THREE.Mesh(backPanelGeometry, backPanelMaterial);
        backPanel.position.set(0, 0, -shelfDepth/2);
        this.group.add(backPanel);
        
        // Side panels
        const sidePanelGeometry = new THREE.BoxGeometry(0.1, 3.5, shelfDepth);
        const sidePanelMaterial = new THREE.MeshStandardMaterial({
            color: 0xC0C0C0 
        });
        
        const leftSide = new THREE.Mesh(sidePanelGeometry, sidePanelMaterial);
        leftSide.position.set(-shelfWidth/2, 0, 0);
        this.group.add(leftSide);
        
        const rightSide = new THREE.Mesh(sidePanelGeometry, sidePanelMaterial);
        rightSide.position.set(shelfWidth/2, 0, 0);
        this.group.add(rightSide);
        
        // Create 3 shelves
        const shelfGeometry = new THREE.BoxGeometry(shelfWidth, shelfHeight, shelfDepth);
        const shelfMaterial = new THREE.MeshStandardMaterial({
            color: 0xC0C0C0 
        });
        
        for (let i = 0; i < 3; i++) {
            const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
            shelf.position.set(0, -1.5 + i * shelfSpacing, 0);
            this.group.add(shelf);
        }
        
        // Top shelf
        const topShelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
        topShelf.position.set(0, 1.7, 0);
        this.group.add(topShelf);
        
        // Bottom shelf
        const bottomShelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
        bottomShelf.position.set(0, -1.7, 0);
        this.group.add(bottomShelf);
    }
    
    getMesh() {
        return this.group;
    }
}