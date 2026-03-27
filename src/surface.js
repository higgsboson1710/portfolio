// ═══════════════════════════════════════════════════════════════
// Surface View — Real 3D Environments per Section
// Procedural terrain, detailed buildings, mountains, water
// ═══════════════════════════════════════════════════════════════
import * as THREE from 'three';

// ─── Noise for terrain generation ───
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
function fbm(x, y, octaves = 6) {
  let val = 0, amp = 0.5, freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += amp * noise2D(x * freq, y * freq);
    amp *= 0.5; freq *= 2.1;
  }
  return val;
}

// ─── State ───
let activeGroup = null;
let waterMesh = null;
let waterUniforms = null;
let isVisible = false;
const envCache = {};
let creatures = []; // animated nature objects

// ─── Environment definitions per section ───
const ENV_BUILDERS = {
  about: buildCityEnvironment,
  education: buildMountainCampus,
  projects: buildTechLab,
  skills: buildBeachForest,
  achievements: buildArena,
  competitive: buildDigitalArena,
  contact: buildMountainLake,
};

// ═══════════════════════════════════════════════════════════════
// 1. CITY ENVIRONMENT — New York-style cyberpunk cityscape
// ═══════════════════════════════════════════════════════════════
function buildCityEnvironment() {
  const group = new THREE.Group();

  // Ground plane — asphalt
  const groundGeo = new THREE.PlaneGeometry(60, 60, 1, 1);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: 0.95, metalness: 0.05 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  group.add(ground);

  // Road grid
  for (let i = -2; i <= 2; i++) {
    const roadGeo = new THREE.PlaneGeometry(60, 2.5, 1, 1);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.8 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.01, i * 12);
    group.add(road);

    // Road lines
    for (let j = -15; j < 15; j += 2) {
      const lineGeo = new THREE.PlaneGeometry(1, 0.1);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(j, 0.02, i * 12);
      group.add(line);
    }
  }

  // Buildings — detailed with windows, ledges, antennas
  const buildingData = [];
  for (let bx = -4; bx <= 4; bx++) {
    for (let bz = -4; bz <= 4; bz++) {
      // Skip roads
      if (Math.abs(bz * 6) % 12 < 2) continue;
      if (Math.random() < 0.2) continue;

      const x = bx * 6 + (Math.random() - 0.5) * 2;
      const z = bz * 6 + (Math.random() - 0.5) * 2;
      const w = 1.5 + Math.random() * 2.5;
      const d = 1.5 + Math.random() * 2.5;
      const h = 3 + Math.random() * 15 + (Math.random() > 0.85 ? 10 : 0);
      buildingData.push({ x, z, w, d, h });
    }
  }

  buildingData.forEach(b => {
    const building = createDetailedBuilding(b.w, b.h, b.d);
    building.position.set(b.x, b.h / 2, b.z);
    group.add(building);
  });

  // Street lights
  for (let i = -25; i <= 25; i += 8) {
    for (let side = -1; side <= 1; side += 2) {
      const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 3, 6);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(i, 1.5, side * 1.5);
      group.add(pole);

      const lightGeo = new THREE.SphereGeometry(0.15, 8, 8);
      const lightMat = new THREE.MeshBasicMaterial({ color: 0xffaa44 });
      const lightMesh = new THREE.Mesh(lightGeo, lightMat);
      lightMesh.position.set(i, 3.1, side * 1.5);
      group.add(lightMesh);

      const pl = new THREE.PointLight(0xffaa44, 0.5, 8);
      pl.position.set(i, 3.1, side * 1.5);
      group.add(pl);
    }
  }

  // Ambient city light
  group.add(new THREE.AmbientLight(0x334466, 0.3));
  const dirLight = new THREE.DirectionalLight(0x4488cc, 0.6);
  dirLight.position.set(20, 30, 10);
  group.add(dirLight);

  // Nature: fireflies between buildings
  addFireflies(group, 30, 15, 0x44ffaa);
  // Nature: birds flying over city
  addBirdFlock(group, 5, 18, 25);

  return group;
}

function createDetailedBuilding(w, h, d) {
  const building = new THREE.Group();
  const colors = [0x0a1520, 0x111a28, 0x0d1925, 0x141e2e, 0x0f1822];
  const emissives = [0x00aaff, 0x0088cc, 0x44ccff, 0xff6633, 0xffaa00];
  const baseColor = colors[Math.floor(Math.random() * colors.length)];

  // Main body
  const bodyGeo = new THREE.BoxGeometry(w, h, d);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: baseColor, roughness: 0.4, metalness: 0.6,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  building.add(body);

  // Ledge sections (horizontal bands)
  const ledgeCount = Math.floor(h / 3);
  for (let i = 1; i <= ledgeCount; i++) {
    const ledgeGeo = new THREE.BoxGeometry(w + 0.15, 0.12, d + 0.15);
    const ledgeMat = new THREE.MeshStandardMaterial({ color: 0x1a2a3a, metalness: 0.7, roughness: 0.3 });
    const ledge = new THREE.Mesh(ledgeGeo, ledgeMat);
    ledge.position.y = -h / 2 + i * 3;
    building.add(ledge);
  }

  // Windows — rows and columns of small emissive panes
  const windowEmissive = emissives[Math.floor(Math.random() * emissives.length)];
  const floorH = 1.2;
  const floors = Math.floor(h / floorH);
  const cols = Math.max(2, Math.floor(w / 0.6));

  for (let face = 0; face < 4; face++) {
    for (let floor = 0; floor < floors; floor++) {
      for (let col = 0; col < cols; col++) {
        if (Math.random() < 0.35) continue; // some windows dark

        const ww = 0.28, wh = 0.4;
        const winGeo = new THREE.PlaneGeometry(ww, wh);
        const lit = Math.random() > 0.3;
        const winMat = new THREE.MeshBasicMaterial({
          color: lit ? windowEmissive : 0x111122,
          transparent: true,
          opacity: lit ? 0.7 + Math.random() * 0.3 : 0.2,
        });
        const win = new THREE.Mesh(winGeo, winMat);

        const yPos = -h / 2 + floor * floorH + 0.8;
        const xOff = -w / 2 + (col + 0.5) * (w / cols);
        const zOff = -d / 2 + (col + 0.5) * (d / cols);

        if (face === 0) { win.position.set(xOff, yPos, d / 2 + 0.01); }
        else if (face === 1) { win.position.set(xOff, yPos, -d / 2 - 0.01); win.rotation.y = Math.PI; }
        else if (face === 2) { win.position.set(w / 2 + 0.01, yPos, zOff); win.rotation.y = Math.PI / 2; }
        else { win.position.set(-w / 2 - 0.01, yPos, zOff); win.rotation.y = -Math.PI / 2; }
        building.add(win);
      }
    }
  }

  // Rooftop details
  // AC units
  for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
    const acGeo = new THREE.BoxGeometry(0.4, 0.3, 0.4);
    const acMat = new THREE.MeshStandardMaterial({ color: 0x334455, metalness: 0.5 });
    const ac = new THREE.Mesh(acGeo, acMat);
    ac.position.set((Math.random() - 0.5) * w * 0.6, h / 2 + 0.15, (Math.random() - 0.5) * d * 0.6);
    building.add(ac);
  }

  // Antenna on tall buildings
  if (h > 12 && Math.random() > 0.3) {
    const antH = 1 + Math.random() * 2;
    const antGeo = new THREE.CylinderGeometry(0.02, 0.03, antH, 4);
    const antMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.9 });
    const ant = new THREE.Mesh(antGeo, antMat);
    ant.position.y = h / 2 + antH / 2;
    building.add(ant);

    // Blinking light on antenna
    const blinkGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const blinkMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const blink = new THREE.Mesh(blinkGeo, blinkMat);
    blink.position.y = h / 2 + antH;
    building.add(blink);
  }

  // Neon sign on some buildings
  if (h > 8 && Math.random() > 0.6) {
    const signGeo = new THREE.PlaneGeometry(w * 0.6, 0.5);
    const signColor = [0xff0066, 0x00ffaa, 0xff6600, 0x00ccff][Math.floor(Math.random() * 4)];
    const signMat = new THREE.MeshBasicMaterial({ color: signColor, transparent: true, opacity: 0.8 });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, h * 0.2, d / 2 + 0.02);
    building.add(sign);
  }

  return building;
}

// ═══════════════════════════════════════════════════════════════
// 2. MOUNTAIN CAMPUS — Swiss-style terrain with campus buildings
// ═══════════════════════════════════════════════════════════════
function buildMountainCampus() {
  const group = new THREE.Group();
  const terrain = createTerrain(80, 80, 100, 100, 12, 0.06, 'campus');
  group.add(terrain);

  // Campus buildings on flat area
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const r = 5 + Math.random() * 3;
    const bw = 2 + Math.random() * 2;
    const bh = 2 + Math.random() * 3;
    const bd = 2 + Math.random() * 2;
    const geo = new THREE.BoxGeometry(bw, bh, bd);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xd4c4a8, roughness: 0.8, metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(Math.cos(angle) * r, bh / 2 - 0.5, Math.sin(angle) * r);

    // Roof
    const roofGeo = new THREE.ConeGeometry(Math.max(bw, bd) * 0.75, 1.5, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x663322, roughness: 0.9 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = bh / 2 + 0.75;
    roof.rotation.y = Math.PI / 4;
    mesh.add(roof);

    group.add(mesh);
  }

  // Trees scattered
  for (let i = 0; i < 40; i++) {
    const tree = createTree();
    tree.position.set(
      (Math.random() - 0.5) * 50,
      0,
      (Math.random() - 0.5) * 50
    );
    group.add(tree);
  }

  // Water
  addWater(group, 0, -1.5, 0, 20, 20);

  // Nature: birds, butterflies, falling leaves
  addBirdFlock(group, 8, 12, 20);
  addButterflies(group, 12, 4);
  addFallingLeaves(group, 40, 20, 0x885522);
  addClouds(group, 6, 20);

  // Lighting
  group.add(new THREE.AmbientLight(0x88aacc, 0.5));
  const sun = new THREE.DirectionalLight(0xffeedd, 1.0);
  sun.position.set(30, 40, 20);
  group.add(sun);

  return group;
}

// ═══════════════════════════════════════════════════════════════
// 3. TECH LAB — Futuristic facility
// ═══════════════════════════════════════════════════════════════
function buildTechLab() {
  const group = new THREE.Group();

  // Floor
  const floorGeo = new THREE.PlaneGeometry(40, 40, 40, 40);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x0a0a14, roughness: 0.3, metalness: 0.8 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  group.add(floor);

  // Grid lines on floor
  for (let i = -20; i <= 20; i += 2) {
    const lineGeo = new THREE.PlaneGeometry(40, 0.02);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.15 });
    const lineH = new THREE.Mesh(lineGeo, lineMat);
    lineH.rotation.x = -Math.PI / 2;
    lineH.position.set(0, 0.01, i);
    group.add(lineH);

    const lineV = new THREE.Mesh(lineGeo.clone(), lineMat.clone());
    lineV.rotation.x = -Math.PI / 2;
    lineV.rotation.z = Math.PI / 2;
    lineV.position.set(i, 0.01, 0);
    group.add(lineV);
  }

  // Server racks
  for (let i = -3; i <= 3; i += 2) {
    for (let j = -2; j <= 2; j += 4) {
      const rackGeo = new THREE.BoxGeometry(0.8, 4, 1.5);
      const rackMat = new THREE.MeshStandardMaterial({ color: 0x111122, metalness: 0.7, roughness: 0.3 });
      const rack = new THREE.Mesh(rackGeo, rackMat);
      rack.position.set(i * 3, 2, j * 3);
      group.add(rack);

      // Blinking LEDs
      for (let led = 0; led < 8; led++) {
        const ledGeo = new THREE.SphereGeometry(0.04, 6, 6);
        const ledColor = [0x00ff00, 0x00ff88, 0xff6600, 0x00aaff][Math.floor(Math.random() * 4)];
        const ledMat = new THREE.MeshBasicMaterial({ color: ledColor });
        const ledMesh = new THREE.Mesh(ledGeo, ledMat);
        ledMesh.position.set(0.41, -1.5 + led * 0.5, (Math.random() - 0.5) * 1.2);
        rack.add(ledMesh);
      }
    }
  }

  // Holographic display tables
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + 0.3;
    const r = 6;
    const tableGeo = new THREE.CylinderGeometry(1, 1.2, 0.8, 8);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x0a1a2a, metalness: 0.8, roughness: 0.2 });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.set(Math.cos(angle) * r, 0.4, Math.sin(angle) * r);
    group.add(table);

    // Hologram above table
    const holoGeo = new THREE.IcosahedronGeometry(0.8, 1);
    const holoMat = new THREE.MeshBasicMaterial({
      color: 0x00ffaa, transparent: true, opacity: 0.3, wireframe: true,
    });
    const holo = new THREE.Mesh(holoGeo, holoMat);
    holo.position.set(Math.cos(angle) * r, 2.5, Math.sin(angle) * r);
    holo.userData.spin = true;
    group.add(holo);

    // Hologram glow
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x00ffaa, transparent: true, opacity: 0.08,
    });
    const glow = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 16), glowMat);
    glow.position.copy(holo.position);
    group.add(glow);
  }

  // Ceiling panels
  const ceilGeo = new THREE.PlaneGeometry(40, 40);
  const ceilMat = new THREE.MeshStandardMaterial({ color: 0x080810, roughness: 0.5, metalness: 0.5, side: THREE.BackSide });
  const ceil = new THREE.Mesh(ceilGeo, ceilMat);
  ceil.rotation.x = -Math.PI / 2;
  ceil.position.y = 6;
  group.add(ceil);

  // Lighting
  group.add(new THREE.AmbientLight(0x112233, 0.3));
  const spotColors = [0x00ff88, 0x0088ff, 0x00ffcc];
  spotColors.forEach((c, i) => {
    const pl = new THREE.PointLight(c, 1, 15);
    pl.position.set(Math.cos(i * 2) * 8, 4, Math.sin(i * 2) * 8);
    group.add(pl);
  });

  // 3D Hologram Labels for projects
  const labels = [
    { text: 'FALL DETECTION', pos: [8, 5, 0] },
    { text: 'INSURANCE ML', pos: [-8, 5, 4] },
    { text: 'PATIENT API', pos: [0, 6, -8] },
  ];
  labels.forEach(l => {
    const holo = createHologramLabel(l.text, 0x00ff88);
    holo.position.set(...l.pos);
    group.add(holo);
  });

  return group;
}

// ═══════════════════════════════════════════════════════════════
// 4. BEACH & FOREST — Tropical paradise (Skills)
// ═══════════════════════════════════════════════════════════════
function buildBeachForest() {
  const group = new THREE.Group();

  // Terrain - Sand to Grass transition
  const terrain = createTerrain(80, 80, 100, 100, 4, 0.08, 'tropical');
  group.add(terrain);

  // Ocean
  addWater(group, 0, 0.2, 15, 80, 50);

  // Palm Trees on the beach
  for (let i = 0; i < 15; i++) {
    const palm = createPalmTree();
    const x = (Math.random() - 0.5) * 60;
    const z = -5 - Math.random() * 10;
    palm.position.set(x, 0, z);
    palm.rotation.y = Math.random() * Math.PI * 2;
    group.add(palm);
  }

  // Dense forest at the back
  for (let i = 0; i < 40; i++) {
    const tree = createTree();
    const x = (Math.random() - 0.5) * 70;
    const z = -20 - Math.random() * 20;
    tree.position.set(x, 0, z);
    tree.userData.isTree = true;
    group.add(tree);
  }

  // Nature: birds, butterflies, clouds
  addBirdFlock(group, 6, 15, 30);
  addButterflies(group, 10, 5);
  addClouds(group, 5, 25);
  addFireflies(group, 20, 6, 0xffffaa); // Sandy fireflies

  // Lighting — bright tropical sun
  group.add(new THREE.AmbientLight(0xffffff, 0.5));
  const sun = new THREE.DirectionalLight(0xfff4d6, 1.2);
  sun.position.set(40, 50, 20);
  group.add(sun);

  return group;
}

// ═══════════════════════════════════════════════════════════════
// 5. ARENA — Grand colosseum-like achievement hall
// ═══════════════════════════════════════════════════════════════
function buildArena() {
  const group = new THREE.Group();

  // Floor — polished marble
  const floorGeo = new THREE.CircleGeometry(20, 64);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x2a2010, roughness: 0.2, metalness: 0.4 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  group.add(floor);

  // Pillars arranged in circle
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const r = 16;
    const pillar = createPillar(0.5, 8);
    pillar.position.set(Math.cos(angle) * r, 4, Math.sin(angle) * r);
    group.add(pillar);

    // Second row
    const pillar2 = createPillar(0.4, 6);
    pillar2.position.set(Math.cos(angle) * 12, 3, Math.sin(angle) * 12);
    group.add(pillar2);
  }

  // Central podium
  const podiumGeo = new THREE.CylinderGeometry(2, 2.5, 1.5, 8);
  const podiumMat = new THREE.MeshStandardMaterial({ color: 0xcc9933, roughness: 0.3, metalness: 0.7 });
  const podium = new THREE.Mesh(podiumGeo, podiumMat);
  podium.position.y = 0.75;
  group.add(podium);

  // Trophy on podium
  const trophyBase = new THREE.CylinderGeometry(0.3, 0.5, 0.4, 8);
  const trophyMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.1, metalness: 0.9 });
  const trophy = new THREE.Mesh(trophyBase, trophyMat);
  trophy.position.y = 1.7;
  group.add(trophy);

  const cupGeo = new THREE.CylinderGeometry(0.5, 0.2, 1, 8, 1, true);
  const cup = new THREE.Mesh(cupGeo, trophyMat);
  cup.position.y = 2.4;
  group.add(cup);

  // Spotlight on trophy
  const spotLight = new THREE.SpotLight(0xffd700, 3, 15, Math.PI / 6, 0.5);
  spotLight.position.set(0, 10, 0);
  spotLight.target.position.set(0, 2, 0);
  group.add(spotLight);
  group.add(spotLight.target);

  // Stadium seating (tiered)
  for (let tier = 0; tier < 4; tier++) {
    const r = 18 + tier * 2;
    const h = 1 + tier * 1.5;
    const seatGeo = new THREE.TorusGeometry(r, 0.8, 4, 32);
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.7, metalness: 0.2 });
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.rotation.x = Math.PI / 2;
    seat.position.y = h;
    group.add(seat);
  }

  // Lighting
  group.add(new THREE.AmbientLight(0x332200, 0.3));
  const warmLight = new THREE.DirectionalLight(0xffcc66, 0.8);
  warmLight.position.set(10, 20, 10);
  group.add(warmLight);

  // 3D Hologram Label for Rank
  const rankLabel = createHologramLabel('GLOBAL RANK 62', 0xffcc00);
  rankLabel.position.set(0, 8, 0);
  group.add(rankLabel);

  return group;
}

function createPillar(radius, height) {
  const pillar = new THREE.Group();
  const bodyGeo = new THREE.CylinderGeometry(radius, radius, height, 12);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xccbb99, roughness: 0.4, metalness: 0.3 });
  pillar.add(new THREE.Mesh(bodyGeo, bodyMat));

  // Capital
  const capGeo = new THREE.BoxGeometry(radius * 3, 0.3, radius * 3);
  const cap = new THREE.Mesh(capGeo, bodyMat);
  cap.position.y = height / 2 + 0.15;
  pillar.add(cap);

  // Base
  const base = new THREE.Mesh(capGeo.clone(), bodyMat);
  base.position.y = -height / 2 - 0.15;
  pillar.add(base);

  return pillar;
}

// ═══════════════════════════════════════════════════════════════
// 6. DIGITAL ARENA — Competitive programming battle stage
// ═══════════════════════════════════════════════════════════════
function buildDigitalArena() {
  const group = new THREE.Group();

  // Hexagonal platform
  const hexGeo = new THREE.CylinderGeometry(8, 8, 0.5, 6);
  const hexMat = new THREE.MeshStandardMaterial({
    color: 0x110011, metalness: 0.9, roughness: 0.1,
    emissive: 0x330033, emissiveIntensity: 0.2,
  });
  const hex = new THREE.Mesh(hexGeo, hexMat);
  group.add(hex);

  // Edge glow ring
  const ringGeo = new THREE.TorusGeometry(8, 0.1, 8, 6);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xff3366 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.3;
  group.add(ring);

  // Floating screens around arena
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const r = 12;
    const screenGeo = new THREE.PlaneGeometry(4, 3);
    const screenMat = new THREE.MeshBasicMaterial({
      color: [0xff3366, 0x3366ff, 0x33ff66][i % 3],
      transparent: true, opacity: 0.3, side: THREE.DoubleSide,
    });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(Math.cos(angle) * r, 4, Math.sin(angle) * r);
    screen.lookAt(0, 4, 0);
    group.add(screen);

    // Screen border
    const borderGeo = new THREE.EdgesGeometry(screenGeo);
    const borderMat = new THREE.LineBasicMaterial({ color: 0xff3366 });
    screen.add(new THREE.LineSegments(borderGeo, borderMat));
  }

  // Central code pillar
  const pillarGeo = new THREE.OctahedronGeometry(1.5, 0);
  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0x220022, emissive: 0xff0044, emissiveIntensity: 0.4,
    metalness: 0.8, roughness: 0.2,
  });
  const pillar = new THREE.Mesh(pillarGeo, pillarMat);
  pillar.position.y = 3;
  pillar.userData.spin = true;
  group.add(pillar);

  // Particle cloud
  const particleCount = 500;
  const particleGeo = new THREE.BufferGeometry();
  const particlePos = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    particlePos[i * 3] = (Math.random() - 0.5) * 30;
    particlePos[i * 3 + 1] = Math.random() * 15;
    particlePos[i * 3 + 2] = (Math.random() - 0.5) * 30;
  }
  particleGeo.setAttribute('position', new THREE.Float32BufferAttribute(particlePos, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0xff3366, size: 0.1, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  group.add(new THREE.Points(particleGeo, particleMat));

  // Lighting
  group.add(new THREE.AmbientLight(0x110011, 0.2));
  group.add(new THREE.PointLight(0xff3366, 2, 20));
  const spot = new THREE.PointLight(0x3366ff, 1.5, 15);
  spot.position.set(5, 8, -5);
  group.add(spot);

  // Nature: fire embers rising
  addFireflies(group, 30, 10, 0xff3366);

  return group;
}

// ═══════════════════════════════════════════════════════════════
// 7. MOUNTAIN LAKE — Serene alpine landscape (Contact)
// ═══════════════════════════════════════════════════════════════
function buildMountainLake() {
  const group = new THREE.Group();
  const terrain = createTerrain(80, 80, 120, 120, 15, 0.05, 'alpine');
  group.add(terrain);

  // Trees
  for (let i = 0; i < 60; i++) {
    const tree = createTree();
    const tx = (Math.random() - 0.5) * 50;
    const tz = (Math.random() - 0.5) * 50;
    const th = fbm(tx * 0.05 + 5, tz * 0.05 + 5, 6) * 15;
    if (th > 1 && th < 8) {
      tree.position.set(tx, th - 0.5, tz);
      group.add(tree);
    }
  }

  // Water lake
  addWater(group, 0, -0.3, 0, 25, 25);

  // Nature: full ecosystem
  addBirdFlock(group, 10, 14, 25);
  addButterflies(group, 15, 3);
  addFallingLeaves(group, 50, 18, 0xff8866);
  addClouds(group, 8, 25);
  addFireflies(group, 25, 5, 0x88ffaa);

  // Lighting — warm sunset
  group.add(new THREE.AmbientLight(0x667788, 0.4));
  const sun = new THREE.DirectionalLight(0xffeedd, 1.2);
  sun.position.set(-20, 30, 30);
  group.add(sun);
  const fill = new THREE.DirectionalLight(0x8888cc, 0.3);
  fill.position.set(20, 10, -20);
    group.add(fill);

  return group;
}

function createHologramLabel(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  
  // HUD-style background
  ctx.fillStyle = 'rgba(0, 50, 50, 0.4)';
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = `rgb(${(color >> 16) & 255}, ${(color >> 8) & 255}, ${color & 255})`;
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, 502, 118);

  ctx.font = 'bold 50px Orbitron, sans-serif';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 64);

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(6, 1.5, 1);
  return sprite;
}

// ═══════════════════════════════════════════════════════════════
// Update Loop Extension
// ═══════════════════════════════════════════════════════════════

function createTerrain(w, d, segW, segD, maxHeight, noiseScale, type) {
  const geo = new THREE.PlaneGeometry(w, d, segW, segD);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    let h = fbm(x * noiseScale + 10, z * noiseScale + 10, 6) * maxHeight;

    // Flatten center area for campus/lake
    const distFromCenter = Math.sqrt(x * x + z * z);
    if (distFromCenter < 10) {
      h *= Math.max(0, (distFromCenter - 3) / 7);
    }

    pos.setY(i, h);

    // Vertex colors based on height
    const t = h / maxHeight;
    if (type === 'alpine') {
      if (t < 0.05) { colors[i*3] = 0.15; colors[i*3+1] = 0.35; colors[i*3+2] = 0.55; } // water edge
      else if (t < 0.25) { colors[i*3] = 0.2; colors[i*3+1] = 0.5; colors[i*3+2] = 0.15; } // grass
      else if (t < 0.5) { colors[i*3] = 0.25; colors[i*3+1] = 0.4; colors[i*3+2] = 0.12; } // dark grass
      else if (t < 0.7) { colors[i*3] = 0.45; colors[i*3+1] = 0.35; colors[i*3+2] = 0.25; } // rock
      else { colors[i*3] = 0.85; colors[i*3+1] = 0.87; colors[i*3+2] = 0.9; }
    } else if (type === 'tropical') {
      if (t < 0.2) { colors[i*3] = 0.95; colors[i*3+1] = 0.92; colors[i*3+2] = 0.75; } // Sand
      else if (t < 0.5) { colors[i*3] = 0.2; colors[i*3+1] = 0.55; colors[i*3+2] = 0.15; } // Grass
      else { colors[i*3] = 0.15; colors[i*3+1] = 0.4; colors[i*3+2] = 0.1; } // Dark foliage
    } else {
      if (t < 0.15) { colors[i*3] = 0.18; colors[i*3+1] = 0.45; colors[i*3+2] = 0.12; }
      else if (t < 0.4) { colors[i*3] = 0.22; colors[i*3+1] = 0.38; colors[i*3+2] = 0.1; }
      else if (t < 0.65) { colors[i*3] = 0.4; colors[i*3+1] = 0.32; colors[i*3+2] = 0.22; }
      else { colors[i*3] = 0.85; colors[i*3+1] = 0.87; colors[i*3+2] = 0.9; }
    }
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.85, metalness: 0.05,
    flatShading: false,
  });

  return new THREE.Mesh(geo, mat);
}

function createPalmTree() {
  const palm = new THREE.Group();
  
  // Trunk - curved
  const points = [];
  for (let i = 0; i < 10; i++) {
    const t = i / 10;
    points.push(new THREE.Vector2(Math.sin(t * 1.5) * 0.5, i * 0.4));
  }
  const trunkGeo = new THREE.CylinderGeometry(0.1, 0.18, 4, 8);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x664422, roughness: 0.9 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 2;
  trunk.rotation.z = 0.1;
  palm.add(trunk);

  // Leaves
  const leafCount = 8;
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x228833, side: THREE.DoubleSide });
  for (let i = 0; i < leafCount; i++) {
    const leafGeo = new THREE.PlaneGeometry(0.5, 2);
    leafGeo.rotateX(-Math.PI / 2);
    leafGeo.translate(0, 0, 1);
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.y = 4;
    leaf.rotation.y = (i / leafCount) * Math.PI * 2;
    leaf.rotation.x = 0.2 + Math.random() * 0.2;
    palm.add(leaf);
  }

  const scale = 0.8 + Math.random() * 0.6;
  palm.scale.set(scale, scale, scale);
  return palm;
}

function createTree() {
  const tree = new THREE.Group();
  const trunkGeo = new THREE.CylinderGeometry(0.08, 0.12, 1.2, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 0.6;
  tree.add(trunk);

  // Layered foliage
  for (let i = 0; i < 3; i++) {
    const r = 0.8 - i * 0.2;
    const h = 0.7 - i * 0.15;
    const foliageGeo = new THREE.ConeGeometry(r, h, 8);
    const foliageMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0.05 + Math.random() * 0.1, 0.3 + Math.random() * 0.2, 0.05),
      roughness: 0.9,
    });
    const foliage = new THREE.Mesh(foliageGeo, foliageMat);
    foliage.position.y = 1.2 + i * 0.5;
    tree.add(foliage);
  }

  const scale = 0.8 + Math.random() * 0.8;
  tree.scale.set(scale, scale, scale);
  return tree;
}

// ═══════════════════════════════════════════════════════════════
// NATURE CREATURES & PARTICLES
// ═══════════════════════════════════════════════════════════════

function addBirdFlock(group, count, height, spread) {
  for (let i = 0; i < count; i++) {
    const bird = new THREE.Group();
    // Body
    const bodyGeo = new THREE.ConeGeometry(0.1, 0.4, 4);
    bodyGeo.rotateX(-Math.PI / 2);
    const bodyMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
    bird.add(new THREE.Mesh(bodyGeo, bodyMat));
    // Wings
    const wingGeo = new THREE.PlaneGeometry(0.5, 0.15);
    const wingMat = new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide });
    const wingL = new THREE.Mesh(wingGeo, wingMat);
    wingL.position.set(-0.25, 0, 0);
    bird.add(wingL);
    const wingR = new THREE.Mesh(wingGeo.clone(), wingMat);
    wingR.position.set(0.25, 0, 0);
    bird.add(wingR);
    bird.position.set((Math.random()-0.5)*spread, height + Math.random()*4, (Math.random()-0.5)*spread);
    bird.userData.creature = 'bird';
    bird.userData.speed = 0.02 + Math.random()*0.03;
    bird.userData.radius = 8 + Math.random()*12;
    bird.userData.angle = Math.random()*Math.PI*2;
    bird.userData.baseY = bird.position.y;
    bird.userData.wingL = wingL;
    bird.userData.wingR = wingR;
    group.add(bird);
  }
}

function addButterflies(group, count, maxH) {
  const colors = [0xff6699, 0xffaa33, 0x66ccff, 0xaa66ff, 0xff3366, 0x33ff99];
  for (let i = 0; i < count; i++) {
    const bf = new THREE.Group();
    const c = colors[Math.floor(Math.random()*colors.length)];
    const wGeo = new THREE.PlaneGeometry(0.2, 0.15);
    const wMat = new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    const wL = new THREE.Mesh(wGeo, wMat); wL.position.x = -0.1;
    const wR = new THREE.Mesh(wGeo.clone(), wMat); wR.position.x = 0.1;
    bf.add(wL); bf.add(wR);
    bf.position.set((Math.random()-0.5)*15, 1+Math.random()*maxH, (Math.random()-0.5)*15);
    bf.userData.creature = 'butterfly';
    bf.userData.wingL = wL; bf.userData.wingR = wR;
    bf.userData.speed = 0.5 + Math.random()*1.5;
    bf.userData.wobble = Math.random()*10;
    bf.userData.basePos = bf.position.clone();
    group.add(bf);
  }
}

function addFireflies(group, count, maxH, color) {
  for (let i = 0; i < count; i++) {
    const geo = new THREE.SphereGeometry(0.05, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 });
    const ff = new THREE.Mesh(geo, mat);
    ff.position.set((Math.random()-0.5)*30, Math.random()*maxH, (Math.random()-0.5)*30);
    ff.userData.creature = 'firefly';
    ff.userData.basePos = ff.position.clone();
    ff.userData.phase = Math.random()*Math.PI*2;
    ff.userData.speed = 0.3+Math.random()*0.7;
    group.add(ff);
  }
}

function addFallingLeaves(group, count, height, color) {
  for (let i = 0; i < count; i++) {
    const geo = new THREE.PlaneGeometry(0.12, 0.08);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).offsetHSL(Math.random()*0.1-0.05, 0, Math.random()*0.2-0.1),
      side: THREE.DoubleSide, transparent: true, opacity: 0.85,
    });
    const leaf = new THREE.Mesh(geo, mat);
    leaf.position.set((Math.random()-0.5)*30, Math.random()*height, (Math.random()-0.5)*30);
    leaf.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
    leaf.userData.creature = 'leaf';
    leaf.userData.fallSpeed = 0.005+Math.random()*0.015;
    leaf.userData.swaySpeed = 1+Math.random()*2;
    leaf.userData.swayAmp = 0.02+Math.random()*0.04;
    leaf.userData.maxY = height;
    group.add(leaf);
  }
}

function addClouds(group, count, spread) {
  for (let i = 0; i < count; i++) {
    const cloud = new THREE.Group();
    const puffs = 3+Math.floor(Math.random()*4);
    for (let j = 0; j < puffs; j++) {
      const s = 1.5+Math.random()*2.5;
      const geo = new THREE.SphereGeometry(s, 8, 8);
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });
      const puff = new THREE.Mesh(geo, mat);
      puff.position.set((Math.random()-0.5)*3, (Math.random()-0.5)*0.8, (Math.random()-0.5)*3);
      puff.scale.y = 0.4;
      cloud.add(puff);
    }
    cloud.position.set((Math.random()-0.5)*spread*2, 15+Math.random()*10, (Math.random()-0.5)*spread*2);
    cloud.userData.creature = 'cloud';
    cloud.userData.speed = 0.005+Math.random()*0.01;
    cloud.userData.drift = Math.random() > 0.5 ? 1 : -1;
    group.add(cloud);
  }
}

// Water shader
const waterVert = `
  uniform float uTime;
  varying vec2 vUv;
  varying float vElevation;
  void main() {
    vUv = uv;
    vec3 pos = position;
    float w1 = sin(pos.x * 2.0 + uTime * 1.5) * 0.12;
    float w2 = sin(pos.z * 3.0 + uTime * 2.0) * 0.08;
    float w3 = cos(pos.x * 1.5 + pos.z * 2.0 + uTime) * 0.1;
    pos.y += w1 + w2 + w3;
    vElevation = pos.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;
const waterFrag = `
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  varying vec2 vUv;
  varying float vElevation;
  void main() {
    float mix_f = (vElevation + 0.2) * 2.0;
    vec3 color = mix(uColor1, uColor2, clamp(mix_f, 0.0, 1.0));
    float shimmer = sin(vUv.x * 40.0 + uTime * 2.0) * sin(vUv.y * 40.0 + uTime * 1.5) * 0.05;
    color += vec3(shimmer);
    gl_FragColor = vec4(color, 0.82);
  }
`;

function addWater(group, x, y, z, w, d) {
  const geo = new THREE.PlaneGeometry(w, d, 64, 64);
  geo.rotateX(-Math.PI / 2);

  waterUniforms = {
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color(0x001a33) },
    uColor2: { value: new THREE.Color(0x00aacc) },
  };

  const mat = new THREE.ShaderMaterial({
    vertexShader: waterVert, fragmentShader: waterFrag,
    uniforms: waterUniforms, transparent: true, side: THREE.DoubleSide,
  });

  waterMesh = new THREE.Mesh(geo, mat);
  waterMesh.position.set(x, y, z);
  group.add(waterMesh);
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

export function createSurface(scene) {
  // Pre-create nothing — build on demand
  return null;
}

export function showSurface(planetWorldPos, planetColors, sectionId) {
  if (activeGroup) {
    activeGroup.parent?.remove(activeGroup);
  }

  // Build or retrieve cached environment
  const builder = ENV_BUILDERS[sectionId] || buildCityEnvironment;
  if (!envCache[sectionId]) {
    envCache[sectionId] = builder();
  }

  activeGroup = envCache[sectionId];
  activeGroup.position.copy(planetWorldPos);
  activeGroup.position.y -= 3;

  // Tint water to planet color
  if (waterUniforms && planetColors) {
    waterUniforms.uColor2.value.set(planetColors.atmosphere);
  }

  // Add to scene at root level
  const scene = activeGroup.parent || null;
  if (!scene) {
    // Need to be added by caller
  }

  activeGroup.visible = true;
  isVisible = true;

  return activeGroup;
}

export function hideSurface() {
  if (activeGroup) {
    activeGroup.visible = false;
  }
  isVisible = false;
}

export function updateSurface(time) {
  if (!isVisible || !activeGroup) return;
  const t = time * 0.001;

  if (waterUniforms) {
    waterUniforms.uTime.value = t;
  }

  // Animate all objects in the active group
  activeGroup.children.forEach(c => {
    if (!c.userData) return;
    
    // Animation based on creature type/userData
    const ud = c.userData;

    if (ud.creature === 'bird') {
      ud.angle += ud.speed;
      c.position.x = Math.cos(ud.angle) * ud.radius;
      c.position.z = Math.sin(ud.angle) * ud.radius;
      c.position.y = (ud.baseY || 0) + Math.sin(t * 0.5 + ud.angle) * 1.5;
      c.rotation.y = -ud.angle + Math.PI / 2;
      const flap = Math.sin(t * 8) * 0.5;
      if (ud.wingL) ud.wingL.rotation.z = flap;
      if (ud.wingR) ud.wingR.rotation.z = -flap;
    } 
    else if (ud.creature === 'butterfly') {
      const panicMult = ud.panic ? 5 : 1;
      ud.wobble += 0.05 * panicMult;
      const bp = ud.basePos || c.position;
      c.position.y = bp.y + Math.sin(ud.wobble) * 1;
      c.position.x += Math.sin(ud.wobble * 0.5) * 0.02 * panicMult;
      c.position.z += Math.cos(ud.wobble * 0.5) * 0.02 * panicMult;
      const flap = Math.sin(t * 12 * panicMult + ud.wobble) * 0.7;
      if (ud.wingL) ud.wingL.rotation.z = flap;
      if (ud.wingR) ud.wingR.rotation.z = -flap;
      if (ud.panic) {
        ud.panicTimer--;
        if (ud.panicTimer <= 0) ud.panic = false;
      }
    } 
    else if (ud.creature === 'firefly') {
      const bp = ud.basePos || c.position;
      const p = ud.phase || 0;
      const s = ud.speed || 1;
      const flashMult = ud.flash ? 2 : 1;
      c.position.x = bp.x + Math.sin(t * s * flashMult + p) * 2;
      c.position.y = bp.y + Math.sin(t * s * 0.8 + p * 2) * 1.5;
      c.position.z = bp.z + Math.cos(t * s * 0.6 + p) * 2;
      c.material.opacity = (ud.flash ? 1.0 : 0.3 + Math.sin(t * 3 + p) * 0.5);
      const sc = (ud.flash ? 1.5 : 1) * (0.8 + Math.sin(t * 3 + p) * 0.2);
      c.scale.set(sc, sc, sc);
      if (ud.flash) {
        ud.flashTimer--;
        if (ud.flashTimer <= 0) { ud.flash = false; c.scale.setScalar(1); }
      }
    }
    else if (ud.type === 'leaf' || ud.isBurstLeaf) {
      c.position.y -= ud.fallSpeed || 0.02;
      c.position.x += Math.sin(t * (ud.swaySpeed || 1)) * (ud.swayAmp || 0.1);
      c.rotation.x += 0.01;
      c.rotation.z += 0.008;
      if (ud.isBurstLeaf) {
        ud.life--;
        c.material.opacity = ud.life / 100;
        if (ud.life <= 0) activeGroup.remove(c);
      } else if (c.position.y < -1) {
        c.position.y = ud.maxY || 20;
      }
    }
    else if (ud.type === 'cloud') {
      c.position.x += (ud.speed || 0.01) * (ud.drift || 1);
      if (Math.abs(c.position.x) > 40) ud.drift = -(ud.drift || 1);
    }
    else if (ud.isTree && ud.shaking) {
      ud.shakeTimer--;
      c.rotation.z = Math.sin(ud.shakeTimer * 1.2) * 0.08;
      if (ud.shakeTimer <= 0) {
        ud.shaking = false;
        c.rotation.z = 0;
      }
    }
    else if (ud.spin) {
      c.rotation.y += 0.01;
      c.rotation.z += 0.005;
    }
  });
}

export function handleNatureInteraction(object) {
  if (!object) return;
  
  // Climb up to find the interactive parent
  let root = object;
  while (root && !root.userData?.creature && !root.userData?.isTree && root.parent && root.parent !== activeGroup) {
    root = root.parent;
  }

  if (!root || !root.userData) return;
  const ud = root.userData;

  if (ud.creature === 'butterfly') {
    ud.panic = true;
    ud.panicTimer = 120;
  } else if (ud.creature === 'firefly') {
    ud.flash = true;
    ud.flashTimer = 60;
  } else if (ud.isTree) {
    shakeTree(root);
  }
}

function shakeTree(tree) {
  if (tree.userData.shaking) return;
  tree.userData.shaking = true;
  tree.userData.shakeTimer = 40;
  
  // Explode some leaves
  for (let i = 0; i < 8; i++) {
    const leafGeo = new THREE.PlaneGeometry(0.2, 0.2);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x228833, side: THREE.DoubleSide, transparent: true });
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.copy(tree.position);
    leaf.position.y += 2 + Math.random() * 2;
    leaf.position.x += (Math.random()-0.5) * 1;
    leaf.position.z += (Math.random()-0.5) * 1;
    leaf.userData.isBurstLeaf = true;
    leaf.userData.life = 100;
    leaf.userData.fallSpeed = 0.05 + Math.random() * 0.05;
    leaf.userData.swaySpeed = 2 + Math.random() * 2;
    leaf.userData.swayAmp = 0.1 + Math.random() * 0.2;
    activeGroup.add(leaf);
  }
}
