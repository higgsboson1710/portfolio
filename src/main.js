// ═══════════════════════════════════════════════════════════════
// Main — HiggsBoson1710 Universe Entry Point
// ═══════════════════════════════════════════════════════════════
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import './style.css';
import { PLANET_CONFIG, PROFILE } from './data.js';
import { createWorld, updateWorld, getPlanetMeshes, getPlanetWorldPosition, setHoveredPlanet, triggerParticleBurst } from './world.js';
import { initCamera, updateCamera, zoomToPlanet, zoomOut, playIntro } from './camera.js';
import { createSurface, showSurface, hideSurface, updateSurface, handleNatureInteraction } from './surface.js';
import { showSection, hideSection, createPlanetLabels, initChatbot } from './ui.js';
import { initAudio, playSoundscape, setVolume } from './audio.js';

// ─── Globals ───
let scene, camera, renderer, clock, composer;
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
  skills: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=2073',
  achievements: '/environments/achievements.png',
  competitive: '/environments/competitive.png',
  contact: '/environments/contact.png',
};

// Konami Code
const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyB','KeyA'];
let konamiIndex = 0;

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
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Post-processing — Bloom
    composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.8,   // strength
      0.4,   // radius
      0.85   // threshold
    );
    composer.addPass(bloomPass);

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
    composer.setSize(window.innerWidth, window.innerHeight);
  });

  // Click on planet
  renderer.domElement.addEventListener('click', onCanvasClick);

  // Hover cursor
  renderer.domElement.addEventListener('mousemove', onCanvasHover);

  // Touch events for mobile
  renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false });
  renderer.domElement.addEventListener('touchend', onTouchEnd, { passive: false });

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

  // ─── Keyboard Navigation ───
  window.addEventListener('keydown', onKeyDown);

  // ─── Volume Slider ───
  const volumeSlider = document.getElementById('volume-slider');
  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      setVolume(parseFloat(e.target.value));
    });
  }

  // ─── Theme Toggle ───
  const themeBtn = document.getElementById('btn-theme');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }
}

function onKeyDown(e) {
  // Konami Code detection
  if (e.code === KONAMI[konamiIndex]) {
    konamiIndex++;
    if (konamiIndex === KONAMI.length) {
      konamiIndex = 0;
      triggerKonamiEasterEgg();
    }
  } else {
    konamiIndex = 0;
  }

  // Number keys 1-7 to jump to planets
  if (!isZoomed) {
    const num = parseInt(e.key);
    if (num >= 1 && num <= 7 && world) {
      const planet = world.planets[num - 1];
      if (planet) selectPlanet(planet);
    }
  }

  // Escape to go back
  if (e.key === 'Escape' && isZoomed) {
    onBack();
  }
}

function triggerKonamiEasterEgg() {
  // Warp speed effect!
  const flash = document.getElementById('entry-flash');
  const speedLines = document.getElementById('speed-lines');

  flash.style.background = 'linear-gradient(45deg, #00d4ff, #ff00ff, #ffcc00)';
  flash.style.opacity = '0.6';
  speedLines.style.opacity = '1';

  setTimeout(() => {
    flash.style.opacity = '0';
    speedLines.style.opacity = '0';
    flash.style.background = 'white';
  }, 1500);

  // Spawn a burst of particles at center
  if (world && world.particleBurst) {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        triggerParticleBurst(world.particleBurst, new THREE.Vector3(
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 20
        ));
      }, i * 100);
    }
  }
}

// ─── Touch Events for Mobile ───
let touchStartPos = null;
let touchStartTime = 0;

function onTouchStart(e) {
  if (e.touches.length === 1) {
    touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    touchStartTime = Date.now();
  }
}

function onTouchEnd(e) {
  if (!touchStartPos) return;
  const dt = Date.now() - touchStartTime;
  // Treat as tap if short time and small movement
  if (dt < 300) {
    const fakeEvent = {
      clientX: touchStartPos.x,
      clientY: touchStartPos.y,
    };
    onCanvasClick(fakeEvent);
  }
  touchStartPos = null;
}

function onCanvasClick(e) {
  const clientX = e.clientX || (e.touches && e.touches[0].clientX);
  const clientY = e.clientY || (e.touches && e.touches[0].clientY);

  mouse.x = (clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(clientY / window.innerHeight) * 2 + 1;
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
    } else if (world && world.particleBurst) {
      // Click on empty space → particle burst at a point in 3D space
      const dir = raycaster.ray.direction.clone();
      const origin = raycaster.ray.origin.clone();
      const point = origin.add(dir.multiplyScalar(50 + Math.random() * 50));
      triggerParticleBurst(world.particleBurst, point);
    }
  }
}

function onCanvasHover(e) {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  if (isZoomed && surface) {
    const intersects = raycaster.intersectObjects(surface.children, true);
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

  if (!isZoomed && world) {
    const meshes = getPlanetMeshes(world);
    const intersects = raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      renderer.domElement.style.cursor = 'pointer';
      const planetId = intersects[0].object.userData.planetId;
      const planet = world.planets.find(p => p.config.id === planetId);
      setHoveredPlanet(world, planet || null);
    } else {
      renderer.domElement.style.cursor = 'default';
      setHoveredPlanet(world, null);
    }
  }
}

function selectPlanet(planet) {
  isZoomed = true;
  selectedPlanet = planet;

  document.getElementById('hint').classList.add('hidden');
  document.getElementById('planet-labels').style.display = 'none';

  zoomToPlanet(camera, planet, () => {
    scene.background = null;
    scene.fog = null;

    const worldPos = getPlanetWorldPosition(planet);
    const surfaceGroup = showSurface(worldPos, planet.config.colors, planet.config.id);
    if (surfaceGroup && !surfaceGroup.parent) {
      scene.add(surfaceGroup);
    }

    showEnvironment(planet.config.id);
    showSection(planet.config.id);
    playSoundscape(planet.config.id);
  });
}

function onBack() {
  if (!isZoomed) return;

  scene.background = new THREE.Color(0x000010);
  scene.fog = new THREE.FogExp2(0x000010, 0.0015);

  hideSection();
  hideSurface();
  hideEnvironment();

  playSoundscape('space');

  zoomOut(camera, () => {
    isZoomed = false;
    selectedPlanet = null;
    document.getElementById('planet-labels').style.display = 'block';
    document.getElementById('hint').classList.remove('hidden');
  });
}

// ─── Theme Toggle ───
let currentTheme = 'dark';

function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'nebula' : 'dark';
  document.body.dataset.theme = currentTheme;

  const btn = document.getElementById('btn-theme');
  if (btn) {
    btn.textContent = currentTheme === 'dark' ? '🌙' : '☀️';
  }

  if (!isZoomed) {
    if (currentTheme === 'nebula') {
      scene.background = new THREE.Color(0x0a0520);
      scene.fog = new THREE.FogExp2(0x0a0520, 0.001);
    } else {
      scene.background = new THREE.Color(0x000010);
      scene.fog = new THREE.FogExp2(0x000010, 0.0015);
    }
  }
}

// ─── Environment Background ───
function showEnvironment(sectionId) {
  const envBg = document.getElementById('env-bg');
  const envImg = document.getElementById('env-bg-img');
  const envParticles = document.getElementById('env-particles');

  if (ENV_IMAGES[sectionId]) {
    envImg.src = ENV_IMAGES[sectionId];
    envBg.classList.remove('hidden');

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

  updateWorld(world, time);
  updateCamera();
  updateSurface(time);
  updatePlanetLabelPositions(time);

  // Render with post-processing (bloom)
  composer.render();
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
