// ═══════════════════════════════════════════════════════════════
// Main — HiggsBoson1710 Universe Entry Point
// ═══════════════════════════════════════════════════════════════
import * as THREE from 'three';
import './style.css';
import { PLANET_CONFIG, PROFILE } from './data.js';
import { createWorld, updateWorld, getPlanetMeshes, getPlanetWorldPosition } from './world.js';
import { initCamera, updateCamera, zoomToPlanet, zoomOut, playIntro } from './camera.js';
import { createSurface, showSurface, hideSurface, updateSurface, handleNatureInteraction } from './surface.js';
import { showSection, hideSection, createPlanetLabels, initChatbot } from './ui.js';
import { initAudio, playSoundscape } from './audio.js';

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
  skills: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=2073', // Tropical Beach
  achievements: '/environments/achievements.png',
  competitive: '/environments/competitive.png',
  contact: '/environments/contact.png',
};

// ─── Init ───
function init() {
  try {
    clock = new THREE.Clock();

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000010);
    scene.fog = new THREE.FogExp2(0x000010, 0.0015);

    // Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);

    // Renderer
    const canvas = document.getElementById('universe-canvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Raycaster
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Start Loading
    simulateLoading(() => {
      try {
        world = createWorld(scene);
        surface = createSurface(scene);
        initCamera(camera, renderer.domElement);
        planetLabels = createPlanetLabels(PLANET_CONFIG);
        initChatbot();
        setupEvents();
        hideLoader();
        initAudio();
        
        playIntro(camera, () => {
          document.getElementById('hint').classList.remove('hidden');
        });

        animate();
      } catch (err) {
        console.error("Initialization Error:", err);
        document.getElementById('loader-subtitle').textContent = "Initialization Failed: " + err.message;
      }
    });
  } catch (err) {
    console.error("Critical Failure:", err);
  }
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
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  if (isZoomed && surface) {
    const intersects = raycaster.intersectObjects(surface.children, true);
    if (intersects.length > 0) {
      handleNatureInteraction(intersects[0].object);
    }
    return;
  }

  if (!isZoomed) {
    const meshes = getPlanetMeshes(world);
    const intersects = raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const planetId = hit.userData.planetId;
      const planet = world.planets.find(p => p.config.id === planetId);
      if (planet) selectPlanet(planet);
    }
  }
}

function onCanvasHover(e) {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  if (isZoomed && surface) {
    const intersects = raycaster.intersectObjects(surface.children, true);
    // Find if we're hovering a creature or tree
    let isCreature = false;
    if (intersects.length > 0) {
      let obj = intersects[0].object;
      while (obj && obj.parent) {
        if (obj.userData.creature || obj.userData.isTree) { isCreature = true; break; }
        obj = obj.parent;
      }
    }
    renderer.domElement.style.cursor = isCreature ? 'pointer' : 'default';
    return;
  }

  if (!isZoomed) {
    const meshes = getPlanetMeshes(world);
    const intersects = raycaster.intersectObjects(meshes);
    renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
  }
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

    // Play sound for this environment
    playSoundscape(planet.config.id);
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

  // Return to space sound
  playSoundscape('space');

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
