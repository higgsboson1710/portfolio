// ═══════════════════════════════════════════════════════════════
// Main — HiggsBoson1710 Universe Entry Point
// ═══════════════════════════════════════════════════════════════
import * as THREE from 'three';
import './style.css';
import { PLANET_CONFIG, PROFILE } from './data.js';
import { createWorld, updateWorld, getPlanetMeshes, getPlanetWorldPosition } from './world.js';
import { initCamera, updateCamera, zoomToPlanet, zoomOut, playIntro } from './camera.js';
import { createSurface, showSurface, hideSurface, updateSurface } from './surface.js';
import { showSection, hideSection, createPlanetLabels, initChatbot } from './ui.js';

// ─── Globals ───
let scene, camera, renderer, clock;
let world, surface;
let raycaster, mouse;
let planetLabels = [];
let isZoomed = false;
let selectedPlanet = null;

// Make THREE Vector3 globally available for ui.js label projection
window.__THREE_VEC3__ = THREE.Vector3;

// Environment image map
const ENV_IMAGES = {
  about: '/environments/about.png',
  education: '/environments/education.png',
  projects: '/environments/projects.png',
  skills: '/environments/skills.png',
  achievements: '/environments/achievements.png',
  competitive: '/environments/competitive.png',
  contact: '/environments/contact.png',
};

// ─── Init ───
function init() {
  clock = new THREE.Clock();

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000010);
  scene.fog = new THREE.FogExp2(0x000010, 0.0015);

  // Camera
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );

  // Renderer
  const canvas = document.getElementById('universe-canvas');
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Raycaster for click detection
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Create the universe
  simulateLoading(() => {
    world = createWorld(scene);
    surface = createSurface(scene);

    // Camera controls
    const controls = initCamera(camera, renderer.domElement);

    // Planet labels
    planetLabels = createPlanetLabels(PLANET_CONFIG);

    // Chatbot
    initChatbot();

    // Event listeners
    setupEvents();

    // Hide loader, show UI
    hideLoader();

    // Play intro animation
    playIntro(camera, () => {
      document.getElementById('hint').classList.remove('hidden');
    });

    // Start render loop
    animate();
  });
}

// ─── Loading Simulation ───
function simulateLoading(onComplete) {
  const progressBar = document.getElementById('loader-progress');
  const percentText = document.getElementById('loader-percent');
  let progress = 0;

  const interval = setInterval(() => {
    progress += Math.random() * 15 + 5;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      setTimeout(onComplete, 300);
    }
    progressBar.style.width = `${progress}%`;
    percentText.textContent = `${Math.floor(progress)}%`;
  }, 150);
}

function hideLoader() {
  const loader = document.getElementById('loader');
  loader.classList.add('fade-out');
  setTimeout(() => {
    loader.style.display = 'none';
    document.getElementById('top-nav').classList.remove('hidden');
  }, 1000);
}

// ─── Events ───
function setupEvents() {
  // Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Click on planet
  renderer.domElement.addEventListener('click', onCanvasClick);

  // Hover cursor
  renderer.domElement.addEventListener('mousemove', onCanvasHover);

  // Back button
  document.getElementById('btn-back').addEventListener('click', onBack);

  // Planet label clicks
  document.getElementById('planet-labels').addEventListener('click', (e) => {
    const label = e.target.closest('.planet-label');
    if (!label) return;
    const planetId = label.dataset.planetId;
    const planet = world.planets.find(p => p.config.id === planetId);
    if (planet) selectPlanet(planet);
  });
}

function onCanvasClick(e) {
  if (isZoomed) return;

  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const meshes = getPlanetMeshes(world);
  const intersects = raycaster.intersectObjects(meshes);

  if (intersects.length > 0) {
    const hit = intersects[0].object;
    const planetId = hit.userData.planetId;
    const planet = world.planets.find(p => p.config.id === planetId);
    if (planet) selectPlanet(planet);
  }
}

function onCanvasHover(e) {
  if (isZoomed) return;

  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const meshes = getPlanetMeshes(world);
  const intersects = raycaster.intersectObjects(meshes);

  renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
}

function selectPlanet(planet) {
  isZoomed = true;
  selectedPlanet = planet;

  // Hide hint
  document.getElementById('hint').classList.add('hidden');

  // Hide planet labels
  document.getElementById('planet-labels').style.display = 'none';

  // Zoom camera to planet
  zoomToPlanet(camera, planet, () => {
    // Make canvas transparent so env image shows through
    scene.background = null;
    scene.fog = null;

    // Show surface (3D environment)
    const worldPos = getPlanetWorldPosition(planet);
    const surfaceGroup = showSurface(worldPos, planet.config.colors, planet.config.id);
    if (surfaceGroup && !surfaceGroup.parent) {
      scene.add(surfaceGroup);
    }

    // Show environment background
    showEnvironment(planet.config.id);

    // Show section panel
    showSection(planet.config.id);
  });
}

function onBack() {
  if (!isZoomed) return;

  // Restore scene background for space view
  scene.background = new THREE.Color(0x000010);
  scene.fog = new THREE.FogExp2(0x000010, 0.0015);

  // Hide section, surface, and environment
  hideSection();
  hideSurface();
  hideEnvironment();

  // Zoom out
  zoomOut(camera, () => {
    isZoomed = false;
    selectedPlanet = null;

    // Show planet labels again
    document.getElementById('planet-labels').style.display = 'block';

    // Show hint again
    document.getElementById('hint').classList.remove('hidden');
  });
}

// ─── Environment Background ───
function showEnvironment(sectionId) {
  const envBg = document.getElementById('env-bg');
  const envImg = document.getElementById('env-bg-img');
  const envParticles = document.getElementById('env-particles');

  if (ENV_IMAGES[sectionId]) {
    envImg.src = ENV_IMAGES[sectionId];
    envBg.classList.remove('hidden');

    // Spawn floating particles
    envParticles.innerHTML = '';
    for (let i = 0; i < 25; i++) {
      const p = document.createElement('div');
      p.className = 'env-particle';
      p.style.left = `${Math.random() * 100}%`;
      p.style.animationDuration = `${5 + Math.random() * 10}s`;
      p.style.animationDelay = `${Math.random() * 5}s`;
      p.style.width = `${2 + Math.random() * 3}px`;
      p.style.height = p.style.width;
      envParticles.appendChild(p);
    }
  }
}

function hideEnvironment() {
  const envBg = document.getElementById('env-bg');
  envBg.classList.add('hidden');
}

// ─── Animation Loop ───
function animate() {
  requestAnimationFrame(animate);
  const time = clock.getElapsedTime() * 1000;

  // Update world (orbits, rotations)
  updateWorld(world, time);

  // Update camera controls
  updateCamera();

  // Update surface (water waves)
  updateSurface(time);

  // Update planet labels
  updatePlanetLabelPositions(time);

  // Render
  renderer.render(scene, camera);
}

function updatePlanetLabelPositions(time) {
  if (isZoomed || !world) return;

  const widthHalf = window.innerWidth / 2;
  const heightHalf = window.innerHeight / 2;

  planetLabels.forEach((label, i) => {
    const planet = world.planets[i];
    if (!planet) return;

    const pos = new THREE.Vector3();
    planet.mesh.getWorldPosition(pos);
    pos.y += planet.config.planetRadius + 1.5;
    pos.project(camera);

    if (pos.z > 1) {
      label.el.style.display = 'none';
      return;
    }

    const x = (pos.x * widthHalf) + widthHalf;
    const y = -(pos.y * heightHalf) + heightHalf;

    label.el.style.display = 'block';
    label.el.style.left = `${x}px`;
    label.el.style.top = `${y}px`;

    // Fade based on distance
    const camPos = camera.position;
    const planetWorldPos = new THREE.Vector3();
    planet.mesh.getWorldPosition(planetWorldPos);
    const dist = camPos.distanceTo(planetWorldPos);

    if (dist < 150) {
      label.el.style.opacity = Math.max(0.2, Math.min(1, (150 - dist) / 100));
    } else {
      label.el.style.opacity = '0';
    }
  });
}

// ─── Boot ───
document.addEventListener('DOMContentLoaded', init);
