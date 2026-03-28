// ═══════════════════════════════════════════════════════════════
// 3D World — Planets, Sun, Stars, Asteroids, Nebula, Comets
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

// ─── Generate cloud texture for atmosphere ───
function generateCloudTexture(size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size * 4;
      const ny = y / size * 4;
      let n = fbm(nx + 5.3, ny + 8.1, 5);
      n = Math.max(0, Math.min(1, n * 1.5 - 0.2));
      const idx = (y * size + x) * 4;
      imageData.data[idx] = 255;
      imageData.data[idx + 1] = 255;
      imageData.data[idx + 2] = 255;
      imageData.data[idx + 3] = Math.floor(n * 100); // semi-transparent clouds
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

  // Sun corona
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
  light.castShadow = true;
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;
  group.add(light);

  // Ambient light
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
  mesh.receiveShadow = true;
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

  // Animated cloud layer
  const cloudGeo = new THREE.SphereGeometry(config.planetRadius * 1.08, 32, 32);
  const cloudTex = generateCloudTexture();
  const cloudMat = new THREE.MeshBasicMaterial({
    map: cloudTex,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    color: new THREE.Color(config.colors.atmosphere),
  });
  const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
  group.add(cloudMesh);

  // Outer glow
  const glowGeo = new THREE.SphereGeometry(config.planetRadius * 1.35, 32, 32);
  const glowMat = new THREE.MeshBasicMaterial({
    color: atmosColor,
    transparent: true,
    opacity: 0.05,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
  });
  const glowMesh = new THREE.Mesh(glowGeo, glowMat);
  group.add(glowMesh);

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
    ringMesh.receiveShadow = true;
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

  // Orbit ring — glowing trail
  const orbitRingGeo = new THREE.RingGeometry(config.orbitRadius - 0.08, config.orbitRadius + 0.08, 256);
  const orbitRingMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(config.colors.atmosphere),
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
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
    cloudMesh,
    glowMesh,
    satellites,
    angle,
    orbitRing,
    baseAtmosOpacity: 0.12,
    baseGlowOpacity: 0.05,
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

// ─── Create Starfield (Multi-layer for parallax) ───
function createStarfield(scene) {
  const layers = [];
  const layerConfigs = [
    { count: 5000, minR: 200, maxR: 400, size: 1.5, speed: 0.00001 },  // Near
    { count: 5000, minR: 400, maxR: 700, size: 1.0, speed: 0.000005 }, // Mid
    { count: 4000, minR: 700, maxR: 1000, size: 0.7, speed: 0.000002 }, // Far
  ];

  layerConfigs.forEach(cfg => {
    const positions = new Float32Array(cfg.count * 3);
    const colors = new Float32Array(cfg.count * 3);
    const sizes = new Float32Array(cfg.count);

    for (let i = 0; i < cfg.count; i++) {
      const r = cfg.minR + Math.random() * (cfg.maxR - cfg.minR);
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
      sizes[i] = Math.random() * cfg.size + 0.3;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
      size: cfg.size,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geo, mat);
    points.userData.rotSpeed = cfg.speed;
    scene.add(points);
    layers.push(points);
  });

  return layers;
}

// ─── Create Shooting Stars / Comets ───
function createComets(scene) {
  const comets = [];
  const cometCount = 8;

  for (let i = 0; i < cometCount; i++) {
    const cometGroup = new THREE.Group();

    // Comet head — bright sphere
    const headGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const headMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
    });
    const head = new THREE.Mesh(headGeo, headMat);
    cometGroup.add(head);

    // Comet glow
    const glowGeo = new THREE.SphereGeometry(0.4, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    cometGroup.add(new THREE.Mesh(glowGeo, glowMat));

    // Comet tail — line of particles
    const tailCount = 30;
    const tailPositions = new Float32Array(tailCount * 3);
    const tailColors = new Float32Array(tailCount * 3);
    const tailSizes = new Float32Array(tailCount);

    for (let j = 0; j < tailCount; j++) {
      tailPositions[j * 3] = -j * 0.3;
      tailPositions[j * 3 + 1] = 0;
      tailPositions[j * 3 + 2] = 0;
      const fade = 1 - j / tailCount;
      tailColors[j * 3] = 0.5 + fade * 0.5;
      tailColors[j * 3 + 1] = 0.7 + fade * 0.3;
      tailColors[j * 3 + 2] = 1;
      tailSizes[j] = fade * 2;
    }

    const tailGeo = new THREE.BufferGeometry();
    tailGeo.setAttribute('position', new THREE.BufferAttribute(tailPositions, 3));
    tailGeo.setAttribute('color', new THREE.BufferAttribute(tailColors, 3));
    const tailMat = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const tail = new THREE.Points(tailGeo, tailMat);
    cometGroup.add(tail);

    scene.add(cometGroup);

    comets.push({
      group: cometGroup,
      head,
      headMat,
      glowMat,
      tailMat,
      velocity: new THREE.Vector3(),
      active: false,
      lifetime: 0,
      maxLifetime: 0,
    });
  }

  return comets;
}

function spawnComet(comet) {
  // Random spawn on a sphere shell
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.random() * Math.PI;
  const r = 150 + Math.random() * 100;

  comet.group.position.set(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta) * 0.3,
    r * Math.cos(phi)
  );

  // Velocity towards center-ish
  const target = new THREE.Vector3(
    (Math.random() - 0.5) * 40,
    (Math.random() - 0.5) * 20,
    (Math.random() - 0.5) * 40
  );
  comet.velocity = target.sub(comet.group.position).normalize().multiplyScalar(0.5 + Math.random() * 1.0);

  // Align the comet to face its velocity
  comet.group.lookAt(comet.group.position.clone().add(comet.velocity));

  comet.active = true;
  comet.lifetime = 0;
  comet.maxLifetime = 200 + Math.random() * 300;
  comet.headMat.opacity = 1;
  comet.glowMat.opacity = 0.5;
  comet.tailMat.opacity = 0.6;
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

// ─── Create Nebula Clouds (Volumetric-ish) ───
function createNebula(scene) {
  const nebulaGroup = new THREE.Group();
  const colors = [0x4400aa, 0x0044aa, 0xaa0044, 0x006688, 0x220066, 0x004466];

  // Main cloud layers
  for (let i = 0; i < 50; i++) {
    const spriteMat = new THREE.SpriteMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      transparent: true,
      opacity: 0.02 + Math.random() * 0.04,
      blending: THREE.AdditiveBlending,
    });
    const sprite = new THREE.Sprite(spriteMat);
    const r = 180 + Math.random() * 500;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    sprite.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );
    const scale = 60 + Math.random() * 160;
    sprite.scale.set(scale, scale, 1);
    sprite.userData.baseOpacity = spriteMat.opacity;
    sprite.userData.pulseSpeed = 0.0003 + Math.random() * 0.0005;
    sprite.userData.pulseOffset = Math.random() * Math.PI * 2;
    nebulaGroup.add(sprite);
  }

  scene.add(nebulaGroup);
  return nebulaGroup;
}

// ─── Click Particle Burst ───
function createParticleBurstSystem(scene) {
  const maxParticles = 200;
  const positions = new Float32Array(maxParticles * 3);
  const colors = new Float32Array(maxParticles * 3);
  const velocities = [];
  const lifetimes = [];

  for (let i = 0; i < maxParticles; i++) {
    positions[i * 3] = 0;
    positions[i * 3 + 1] = -9999;
    positions[i * 3 + 2] = 0;
    colors[i * 3] = 0; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 1;
    velocities.push(new THREE.Vector3());
    lifetimes.push({ life: 0, maxLife: 0 });
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  return { points, positions, colors, velocities, lifetimes, nextIndex: 0 };
}

export function triggerParticleBurst(burstSystem, position) {
  if (!burstSystem) return;
  const count = 20;
  const accentColors = [
    [0, 0.83, 1],     // cyan
    [1, 0, 1],         // magenta
    [1, 0.8, 0],       // gold
    [0, 1, 0.53],      // green
  ];

  for (let i = 0; i < count; i++) {
    const idx = burstSystem.nextIndex % (burstSystem.positions.length / 3);
    burstSystem.nextIndex++;

    burstSystem.positions[idx * 3] = position.x;
    burstSystem.positions[idx * 3 + 1] = position.y;
    burstSystem.positions[idx * 3 + 2] = position.z;

    const speed = 0.1 + Math.random() * 0.3;
    burstSystem.velocities[idx].set(
      (Math.random() - 0.5) * speed,
      (Math.random() - 0.5) * speed,
      (Math.random() - 0.5) * speed
    );

    const c = accentColors[Math.floor(Math.random() * accentColors.length)];
    burstSystem.colors[idx * 3] = c[0];
    burstSystem.colors[idx * 3 + 1] = c[1];
    burstSystem.colors[idx * 3 + 2] = c[2];

    burstSystem.lifetimes[idx] = { life: 0, maxLife: 60 + Math.random() * 60 };
  }

  burstSystem.points.geometry.attributes.position.needsUpdate = true;
  burstSystem.points.geometry.attributes.color.needsUpdate = true;
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
  const comets = createComets(scene);
  const particleBurst = createParticleBurstSystem(scene);

  // Track hovered planet for glow effect
  let hoveredPlanet = null;

  return { sun, planets, starfield, asteroidBelt, outerBelt, nebula, comets, particleBurst, hoveredPlanet };
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

    // Rotate cloud layer (opposite direction, different speed)
    if (planet.cloudMesh) {
      planet.cloudMesh.rotation.y -= cfg.rotationSpeed * 0.4;
      planet.cloudMesh.rotation.x += cfg.rotationSpeed * 0.1;
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

  // Parallax star layers — each rotates at different speed
  if (world.starfield && Array.isArray(world.starfield)) {
    world.starfield.forEach(layer => {
      layer.rotation.y += layer.userData.rotSpeed;
    });

    // Twinkle on first layer
    const firstLayer = world.starfield[0];
    if (firstLayer) {
      const sizes = firstLayer.geometry.attributes.size;
      for (let i = 0; i < sizes.count; i += 10) {
        sizes.array[i] = (Math.sin(time * 0.003 + i) * 0.5 + 1) * 1.5;
      }
      sizes.needsUpdate = true;
    }
  }

  // Nebula pulse
  if (world.nebula) {
    world.nebula.children.forEach(sprite => {
      if (sprite.userData.baseOpacity) {
        const pulse = Math.sin(time * sprite.userData.pulseSpeed + sprite.userData.pulseOffset);
        sprite.material.opacity = sprite.userData.baseOpacity + pulse * 0.01;
      }
    });
  }

  // Update comets
  if (world.comets) {
    world.comets.forEach(comet => {
      if (!comet.active) {
        // Random chance to spawn
        if (Math.random() < 0.002) {
          spawnComet(comet);
        }
        return;
      }

      comet.lifetime++;
      comet.group.position.add(comet.velocity);

      // Fade out near end of life
      const progress = comet.lifetime / comet.maxLifetime;
      if (progress > 0.7) {
        const fade = 1 - (progress - 0.7) / 0.3;
        comet.headMat.opacity = fade;
        comet.glowMat.opacity = fade * 0.5;
        comet.tailMat.opacity = fade * 0.6;
      }

      if (comet.lifetime >= comet.maxLifetime) {
        comet.active = false;
        comet.headMat.opacity = 0;
        comet.glowMat.opacity = 0;
        comet.tailMat.opacity = 0;
      }
    });
  }

  // Update particle burst system
  if (world.particleBurst) {
    const pb = world.particleBurst;
    const maxP = pb.positions.length / 3;
    for (let i = 0; i < maxP; i++) {
      const lt = pb.lifetimes[i];
      if (lt.maxLife <= 0) continue;
      lt.life++;
      if (lt.life >= lt.maxLife) {
        pb.positions[i * 3 + 1] = -9999;
        lt.maxLife = 0;
        continue;
      }
      pb.positions[i * 3] += pb.velocities[i].x;
      pb.positions[i * 3 + 1] += pb.velocities[i].y;
      pb.positions[i * 3 + 2] += pb.velocities[i].z;
      // Slow down
      pb.velocities[i].multiplyScalar(0.97);
    }
    pb.points.geometry.attributes.position.needsUpdate = true;
  }

  // Planet hover pulse
  world.planets.forEach(planet => {
    const isHovered = planet === world.hoveredPlanet;
    const targetAtmos = isHovered ? 0.35 : planet.baseAtmosOpacity;
    const targetGlow = isHovered ? 0.2 : planet.baseGlowOpacity;

    planet.atmosMesh.material.opacity += (targetAtmos - planet.atmosMesh.material.opacity) * 0.08;
    planet.glowMesh.material.opacity += (targetGlow - planet.glowMesh.material.opacity) * 0.08;
  });
}

export function setHoveredPlanet(world, planet) {
  world.hoveredPlanet = planet;
}

export function getPlanetMeshes(world) {
  return world.planets.map(p => p.mesh);
}

export function getPlanetWorldPosition(planet) {
  const pos = new THREE.Vector3();
  planet.mesh.getWorldPosition(pos);
  return pos;
}
