// ═══════════════════════════════════════════════════════════════
// 3D World — Planets, Sun, Stars, Asteroids, Nebula
// ═══════════════════════════════════════════════════════════════
import * as THREE from 'three';
import { PLANET_CONFIG } from './data.js';

// ─── Noise helper for procedural textures ───
function hash(n) { const s = Math.sin(n) * 43758.5453123; return s - Math.floor(s); }
function noise2D(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix + iy * 57.0);
  const b = hash(ix + 1 + iy * 57.0);
  const c = hash(ix + (iy + 1) * 57.0);
  const d = hash(ix + 1 + (iy + 1) * 57.0);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x, y, octaves = 5) {
  let val = 0, amp = 0.5, freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += amp * noise2D(x * freq, y * freq);
    amp *= 0.5;
    freq *= 2.1;
  }
  return val;
}

function hexToRGB(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function lerpColor(c1, c2, t) {
  return {
    r: Math.round(c1.r + (c2.r - c1.r) * t),
    g: Math.round(c1.g + (c2.g - c1.g) * t),
    b: Math.round(c1.b + (c2.b - c1.b) * t),
  };
}

// ─── Generate procedural planet texture ───
function generatePlanetTexture(colors, size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(size, size);
  const c1 = hexToRGB(colors.primary);
  const c2 = hexToRGB(colors.secondary);
  const darken = { r: Math.floor(c2.r * 0.4), g: Math.floor(c2.g * 0.4), b: Math.floor(c2.b * 0.4) };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size * 6;
      const ny = y / size * 6;
      let n = fbm(nx + 1.7, ny + 3.2, 6);
      n = Math.max(0, Math.min(1, n * 1.2));

      // Add horizontal bands for gas-giant look
      const band = Math.sin(y / size * Math.PI * 8 + n * 3) * 0.15;
      n = Math.max(0, Math.min(1, n + band));

      let color;
      if (n < 0.35) {
        color = lerpColor(darken, c2, n / 0.35);
      } else if (n < 0.65) {
        color = lerpColor(c2, c1, (n - 0.35) / 0.3);
      } else {
        color = lerpColor(c1, { r: Math.min(255, c1.r + 60), g: Math.min(255, c1.g + 60), b: Math.min(255, c1.b + 60) }, (n - 0.65) / 0.35);
      }

      const idx = (y * size + x) * 4;
      imageData.data[idx] = color.r;
      imageData.data[idx + 1] = color.g;
      imageData.data[idx + 2] = color.b;
      imageData.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return new THREE.CanvasTexture(canvas);
}

// ─── Generate sun texture ───
function generateSunTexture(size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size * 8;
      const ny = y / size * 8;
      let n = fbm(nx, ny, 4);
      const idx = (y * size + x) * 4;
      imageData.data[idx] = 255;
      imageData.data[idx + 1] = Math.floor(150 + n * 105);
      imageData.data[idx + 2] = Math.floor(n * 80);
      imageData.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return new THREE.CanvasTexture(canvas);
}

// ─── Create Sun ───
function createSun(scene) {
  const group = new THREE.Group();

  // Sun sphere
  const geo = new THREE.SphereGeometry(5, 64, 64);
  const tex = generateSunTexture();
  const mat = new THREE.MeshBasicMaterial({ map: tex });
  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);

  // Sun glow layers
  for (let i = 0; i < 3; i++) {
    const glowGeo = new THREE.SphereGeometry(5.5 + i * 1.5, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(1, 0.6 - i * 0.15, 0.1),
      transparent: true,
      opacity: 0.08 - i * 0.02,
      side: THREE.BackSide,
    });
    group.add(new THREE.Mesh(glowGeo, glowMat));
  }

  // Sun corona — additional glow layers (no sprite to avoid square artifacts)
  for (let j = 0; j < 4; j++) {
    const coronaGeo = new THREE.SphereGeometry(9 + j * 3, 24, 24);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(1, 0.5 - j * 0.08, 0.05),
      transparent: true,
      opacity: 0.035 - j * 0.007,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    group.add(new THREE.Mesh(coronaGeo, coronaMat));
  }

  // Point light
  const light = new THREE.PointLight(0xffcc66, 3.0, 500);
  group.add(light);

  // Ambient light — higher intensity so planets are visible
  scene.add(new THREE.AmbientLight(0x556688, 0.8));

  scene.add(group);
  return { group, mesh };
}

// ─── Create Planet ───
function createPlanet(config, scene) {
  const group = new THREE.Group();
  const orbitGroup = new THREE.Group();

  // Planet mesh
  const geo = new THREE.SphereGeometry(config.planetRadius, 48, 48);
  const tex = generatePlanetTexture(config.colors);
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.7,
    metalness: 0.1,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.userData = { planetId: config.id, config };
  group.add(mesh);

  // Atmosphere
  const atmosGeo = new THREE.SphereGeometry(config.planetRadius * 1.15, 32, 32);
  const atmosColor = new THREE.Color(config.colors.atmosphere);
  const atmosMat = new THREE.MeshBasicMaterial({
    color: atmosColor,
    transparent: true,
    opacity: 0.12,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
  });
  const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
  group.add(atmosMesh);

  // Outer glow
  const glowGeo = new THREE.SphereGeometry(config.planetRadius * 1.35, 32, 32);
  const glowMat = new THREE.MeshBasicMaterial({
    color: atmosColor,
    transparent: true,
    opacity: 0.05,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
  });
  group.add(new THREE.Mesh(glowGeo, glowMat));

  // Rings
  if (config.hasRings) {
    const innerR = config.planetRadius * 1.5;
    const outerR = config.planetRadius * 2.5;
    const ringGeo = new THREE.RingGeometry(innerR, outerR, 64);
    const ringTex = generateRingTexture(config.ringColor);
    const ringMat = new THREE.MeshBasicMaterial({
      map: ringTex,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2 + config.tilt;
    group.add(ringMesh);
  }

  // Satellites
  const satellites = [];
  if (config.hasSatellites) {
    for (let i = 0; i < 3; i++) {
      const satGeo = new THREE.OctahedronGeometry(0.15, 0);
      const satMat = new THREE.MeshStandardMaterial({
        color: 0xaaccff,
        emissive: 0x4488ff,
        emissiveIntensity: 0.5,
        metalness: 0.8,
        roughness: 0.2,
      });
      const sat = new THREE.Mesh(satGeo, satMat);
      sat.userData.orbitRadius = config.planetRadius * 2 + i * 0.8;
      sat.userData.speed = 0.02 + i * 0.01;
      sat.userData.offset = (i / 3) * Math.PI * 2;
      group.add(sat);
      satellites.push(sat);
    }
  }

  // Apply tilt
  group.rotation.z = config.tilt;

  // Position on orbit
  const angle = Math.random() * Math.PI * 2;
  group.position.x = Math.cos(angle) * config.orbitRadius;
  group.position.z = Math.sin(angle) * config.orbitRadius;
  group.position.y = (Math.random() - 0.5) * 2;

  orbitGroup.add(group);
  scene.add(orbitGroup);

  // Orbit ring
  const orbitRingGeo = new THREE.RingGeometry(config.orbitRadius - 0.05, config.orbitRadius + 0.05, 128);
  const orbitRingMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(config.colors.atmosphere),
    transparent: true,
    opacity: 0.08,
    side: THREE.DoubleSide,
  });
  const orbitRing = new THREE.Mesh(orbitRingGeo, orbitRingMat);
  orbitRing.rotation.x = -Math.PI / 2;
  scene.add(orbitRing);

  return {
    config,
    group,
    orbitGroup,
    mesh,
    atmosMesh,
    satellites,
    angle,
    orbitRing,
  };
}

function generateRingTexture(color, size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  const c = hexToRGB(color);

  for (let x = 0; x < size; x++) {
    const t = x / size;
    const alpha = Math.sin(t * Math.PI) * 0.8;
    const noise = (Math.random() * 0.3 + 0.7);
    ctx.fillStyle = `rgba(${Math.floor(c.r * noise)}, ${Math.floor(c.g * noise)}, ${Math.floor(c.b * noise)}, ${alpha})`;
    ctx.fillRect(x, 0, 1, 16);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

// ─── Create Starfield ───
function createStarfield(scene) {
  const count = 12000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const r = 300 + Math.random() * 700;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    const colorChoice = Math.random();
    if (colorChoice < 0.3) {
      colors[i * 3] = 0.8; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 1;
    } else if (colorChoice < 0.5) {
      colors[i * 3] = 1; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 0.7;
    } else if (colorChoice < 0.6) {
      colors[i * 3] = 1; colors[i * 3 + 1] = 0.6; colors[i * 3 + 2] = 0.4;
    } else {
      colors[i * 3] = 0.9; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 0.95;
    }

    sizes[i] = Math.random() * 2 + 0.5;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    size: 1.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);
  return points;
}

// ─── Create Asteroid Belt ───
function createAsteroidBelt(scene) {
  const beltGroup = new THREE.Group();
  const count = 600;
  const innerRadius = 46;
  const outerRadius = 52;

  for (let i = 0; i < count; i++) {
    const r = innerRadius + Math.random() * (outerRadius - innerRadius);
    const angle = Math.random() * Math.PI * 2;
    const size = 0.05 + Math.random() * 0.25;

    const geo = new THREE.IcosahedronGeometry(size, 0);
    const brightness = 0.3 + Math.random() * 0.4;
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(brightness, brightness * 0.9, brightness * 0.8),
      roughness: 0.9,
      metalness: 0.1,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      Math.cos(angle) * r,
      (Math.random() - 0.5) * 2,
      Math.sin(angle) * r
    );
    mesh.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    mesh.userData.rotSpeed = {
      x: (Math.random() - 0.5) * 0.02,
      y: (Math.random() - 0.5) * 0.02,
    };
    beltGroup.add(mesh);
  }

  scene.add(beltGroup);
  return beltGroup;
}

// ─── Create Outer Belt (Kuiper-like) ───
function createOuterBelt(scene) {
  const beltGroup = new THREE.Group();
  const count = 400;
  const innerRadius = 115;
  const outerRadius = 135;

  for (let i = 0; i < count; i++) {
    const r = innerRadius + Math.random() * (outerRadius - innerRadius);
    const angle = Math.random() * Math.PI * 2;
    const size = 0.08 + Math.random() * 0.3;

    const geo = new THREE.IcosahedronGeometry(size, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0.25, 0.25, 0.35),
      roughness: 1,
      metalness: 0,
      emissive: new THREE.Color(0.05, 0.05, 0.1),
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      Math.cos(angle) * r,
      (Math.random() - 0.5) * 3,
      Math.sin(angle) * r
    );
    mesh.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    beltGroup.add(mesh);
  }

  scene.add(beltGroup);
  return beltGroup;
}

// ─── Create Nebula Clouds ───
function createNebula(scene) {
  const nebulaGroup = new THREE.Group();
  const colors = [0x4400aa, 0x0044aa, 0xaa0044, 0x006688];

  for (let i = 0; i < 30; i++) {
    const spriteMat = new THREE.SpriteMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      transparent: true,
      opacity: 0.03 + Math.random() * 0.04,
      blending: THREE.AdditiveBlending,
    });
    const sprite = new THREE.Sprite(spriteMat);
    const r = 200 + Math.random() * 400;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    sprite.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );
    sprite.scale.set(80 + Math.random() * 120, 80 + Math.random() * 120, 1);
    nebulaGroup.add(sprite);
  }

  scene.add(nebulaGroup);
  return nebulaGroup;
}

// ═══════════════════════════════════════
// Exported World Factory & Update
// ═══════════════════════════════════════
export function createWorld(scene) {
  const sun = createSun(scene);
  const planets = PLANET_CONFIG.map(cfg => createPlanet(cfg, scene));
  const starfield = createStarfield(scene);
  const asteroidBelt = createAsteroidBelt(scene);
  const outerBelt = createOuterBelt(scene);
  const nebula = createNebula(scene);

  return { sun, planets, starfield, asteroidBelt, outerBelt, nebula };
}

export function updateWorld(world, time) {
  // Rotate sun
  if (world.sun.mesh) {
    world.sun.mesh.rotation.y = time * 0.0001;
  }

  // Orbit planets
  world.planets.forEach(planet => {
    const cfg = planet.config;
    planet.angle += cfg.speed;
    planet.group.position.x = Math.cos(planet.angle) * cfg.orbitRadius;
    planet.group.position.z = Math.sin(planet.angle) * cfg.orbitRadius;

    // Self-rotation
    planet.mesh.rotation.y += cfg.rotationSpeed;

    // Rotate atmosphere
    if (planet.atmosMesh) {
      planet.atmosMesh.rotation.y += cfg.rotationSpeed * 0.7;
    }

    // Animate satellites
    planet.satellites.forEach(sat => {
      const t = time * 0.001 * sat.userData.speed + sat.userData.offset;
      const r = sat.userData.orbitRadius;
      sat.position.x = Math.cos(t) * r;
      sat.position.y = Math.sin(t * 0.7) * 0.5;
      sat.position.z = Math.sin(t) * r;
      sat.rotation.y += 0.05;
    });
  });

  // Slowly rotate asteroid belt
  if (world.asteroidBelt) {
    world.asteroidBelt.rotation.y += 0.00005;
    world.asteroidBelt.children.forEach(a => {
      if (a.userData.rotSpeed) {
        a.rotation.x += a.userData.rotSpeed.x;
        a.rotation.y += a.userData.rotSpeed.y;
      }
    });
  }

  // Rotate outer belt
  if (world.outerBelt) {
    world.outerBelt.rotation.y -= 0.00003;
  }

  // Twinkle stars
  if (world.starfield) {
    const sizes = world.starfield.geometry.attributes.size;
    for (let i = 0; i < sizes.count; i += 10) {
      sizes.array[i] = (Math.sin(time * 0.003 + i) * 0.5 + 1) * 1.5;
    }
    sizes.needsUpdate = true;
  }
}

export function getPlanetMeshes(world) {
  return world.planets.map(p => p.mesh);
}

export function getPlanetWorldPosition(planet) {
  const pos = new THREE.Vector3();
  planet.mesh.getWorldPosition(pos);
  return pos;
}
