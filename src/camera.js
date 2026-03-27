// ═══════════════════════════════════════════════════════════════
// Camera Controller — Orbit, Zoom-to-Planet, Transitions
// ═══════════════════════════════════════════════════════════════
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';

let controls = null;
let isTransitioning = false;
let currentView = 'overview'; // 'overview' | 'planet'

export function initCamera(camera, domElement) {
  // Position camera for dramatic overview
  camera.position.set(60, 45, 80);
  camera.lookAt(0, 0, 0);

  // Orbit controls
  controls = new OrbitControls(camera, domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enablePan = false;
  controls.minDistance = 15;
  controls.maxDistance = 250;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.15;
  controls.target.set(0, 0, 0);
  controls.update();

  return controls;
}

export function updateCamera() {
  if (controls && !isTransitioning) {
    controls.update();
  }
}

export function getControls() {
  return controls;
}

export function getCurrentView() {
  return currentView;
}

export function zoomToPlanet(camera, planet, onComplete) {
  if (isTransitioning) return;
  isTransitioning = true;
  currentView = 'planet';

  // Disable orbit controls during transition
  controls.enabled = false;
  controls.autoRotate = false;

  // Get world position of planet
  const targetPos = new THREE.Vector3();
  planet.mesh.getWorldPosition(targetPos);

  // Calculate camera position (zoom to 3x planet radius away)
  const radius = planet.config.planetRadius;
  const offset = new THREE.Vector3(radius * 3, radius * 2, radius * 3);
  const camTarget = targetPos.clone().add(offset);

  // Animate camera
  gsap.to(camera.position, {
    x: camTarget.x,
    y: camTarget.y,
    z: camTarget.z,
    duration: 2,
    ease: 'power3.inOut',
    onUpdate: () => {
      camera.lookAt(targetPos);
    },
  });

  gsap.to(controls.target, {
    x: targetPos.x,
    y: targetPos.y,
    z: targetPos.z,
    duration: 2,
    ease: 'power3.inOut',
    onComplete: () => {
      isTransitioning = false;
      controls.enabled = true;
      controls.minDistance = radius * 2;
      controls.maxDistance = radius * 12;
      controls.update();
      if (onComplete) onComplete();
    },
  });
}

export function zoomOut(camera, onComplete) {
  if (isTransitioning) return;
  isTransitioning = true;
  currentView = 'overview';

  controls.enabled = false;

  // Animate back to overview
  gsap.to(camera.position, {
    x: 60,
    y: 45,
    z: 80,
    duration: 2,
    ease: 'power3.inOut',
  });

  gsap.to(controls.target, {
    x: 0,
    y: 0,
    z: 0,
    duration: 2,
    ease: 'power3.inOut',
    onComplete: () => {
      isTransitioning = false;
      controls.enabled = true;
      controls.autoRotate = true;
      controls.minDistance = 15;
      controls.maxDistance = 250;
      controls.update();
      if (onComplete) onComplete();
    },
  });
}

// ─── Intro Animation ───
export function playIntro(camera, onComplete) {
  // Start far away
  camera.position.set(300, 150, 300);
  camera.lookAt(0, 0, 0);

  controls.enabled = false;

  gsap.to(camera.position, {
    x: 60,
    y: 45,
    z: 80,
    duration: 4,
    ease: 'power2.out',
    delay: 0.5,
    onUpdate: () => {
      camera.lookAt(0, 0, 0);
    },
    onComplete: () => {
      controls.enabled = true;
      controls.autoRotate = true;
      controls.update();
      if (onComplete) onComplete();
    },
  });
}
