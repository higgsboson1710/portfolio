// ═══════════════════════════════════════════════════════════════
// Surface View — Ocean + City on Planet Surface
// ═══════════════════════════════════════════════════════════════
import * as THREE from 'three';

let surfaceGroup = null;
let waterMesh = null;
let cityGroup = null;
let surfaceLight = null;
let isVisible = false;
let waterUniforms = null;

// ─── Water Shader ───
const waterVertexShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying float vElevation;

  void main() {
    vUv = uv;
    vec3 pos = position;

    float wave1 = sin(pos.x * 2.0 + uTime * 1.5) * 0.15;
    float wave2 = sin(pos.z * 3.0 + uTime * 2.0) * 0.1;
    float wave3 = cos(pos.x * 1.5 + pos.z * 2.0 + uTime * 1.0) * 0.12;
    float wave4 = sin(pos.x * 5.0 + pos.z * 4.0 + uTime * 3.0) * 0.04;

    pos.y += wave1 + wave2 + wave3 + wave4;
    vElevation = pos.y;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const waterFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  varying vec2 vUv;
  varying float vElevation;

  void main() {
    float mixFactor = (vElevation + 0.3) * 1.5;
    vec3 color = mix(uColor1, uColor2, clamp(mixFactor, 0.0, 1.0));

    // Shimmer
    float shimmer = sin(vUv.x * 40.0 + uTime * 2.0) * sin(vUv.y * 40.0 + uTime * 1.5);
    color += vec3(shimmer * 0.05);

    // Fresnel-like edge brightness
    float edge = pow(1.0 - abs(vUv.y - 0.5) * 2.0, 2.0) * 0.15;
    color += vec3(edge * 0.5, edge * 0.8, edge);

    gl_FragColor = vec4(color, 0.85);
  }
`;

// ─── Create Surface ───
export function createSurface(scene) {
  surfaceGroup = new THREE.Group();
  surfaceGroup.visible = false;

  // Water plane
  const waterGeo = new THREE.PlaneGeometry(30, 30, 128, 128);
  waterGeo.rotateX(-Math.PI / 2);

  waterUniforms = {
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color(0x001a33) },
    uColor2: { value: new THREE.Color(0x00aacc) },
  };

  const waterMat = new THREE.ShaderMaterial({
    vertexShader: waterVertexShader,
    fragmentShader: waterFragmentShader,
    uniforms: waterUniforms,
    transparent: true,
    side: THREE.DoubleSide,
  });

  waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.y = -1;
  surfaceGroup.add(waterMesh);

  // City island
  cityGroup = createCity();
  surfaceGroup.add(cityGroup);

  // Surface directional light
  surfaceLight = new THREE.DirectionalLight(0x88ccff, 1);
  surfaceLight.position.set(10, 20, 10);
  surfaceGroup.add(surfaceLight);

  // Fog-like particles around city
  const fogGeo = new THREE.BufferGeometry();
  const fogCount = 200;
  const fogPositions = new Float32Array(fogCount * 3);
  for (let i = 0; i < fogCount; i++) {
    fogPositions[i * 3] = (Math.random() - 0.5) * 25;
    fogPositions[i * 3 + 1] = Math.random() * 3 - 0.5;
    fogPositions[i * 3 + 2] = (Math.random() - 0.5) * 25;
  }
  fogGeo.setAttribute('position', new THREE.BufferAttribute(fogPositions, 3));
  const fogMat = new THREE.PointsMaterial({
    color: 0x00aaff,
    size: 0.3,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  surfaceGroup.add(new THREE.Points(fogGeo, fogMat));

  scene.add(surfaceGroup);
  return surfaceGroup;
}

// ─── Create Procedural City ───
function createCity() {
  const city = new THREE.Group();

  // Island platform
  const islandGeo = new THREE.CylinderGeometry(6, 7, 0.5, 32);
  const islandMat = new THREE.MeshStandardMaterial({
    color: 0x1a2a3a,
    roughness: 0.9,
    metalness: 0.2,
  });
  const island = new THREE.Mesh(islandGeo, islandMat);
  island.position.y = -0.75;
  city.add(island);

  // Buildings
  const buildingColors = [0x112233, 0x0a1a2a, 0x152535, 0x0d1d2d];
  const emissiveColors = [0x00aaff, 0x0088cc, 0x44ddff, 0xff6600];

  for (let i = 0; i < 60; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 5;
    const width = 0.2 + Math.random() * 0.5;
    const depth = 0.2 + Math.random() * 0.5;
    const height = 0.3 + Math.random() * 3;

    // Taller buildings near center
    const centerBonus = Math.max(0, (1 - dist / 5)) * 3;
    const finalHeight = height + centerBonus;

    const geo = new THREE.BoxGeometry(width, finalHeight, depth);
    const mat = new THREE.MeshStandardMaterial({
      color: buildingColors[Math.floor(Math.random() * buildingColors.length)],
      roughness: 0.5,
      metalness: 0.6,
      emissive: emissiveColors[Math.floor(Math.random() * emissiveColors.length)],
      emissiveIntensity: Math.random() * 0.15,
    });

    const building = new THREE.Mesh(geo, mat);
    building.position.set(
      Math.cos(angle) * dist,
      finalHeight / 2 - 0.5,
      Math.sin(angle) * dist
    );
    building.rotation.y = Math.random() * Math.PI;
    city.add(building);

    // Add lit windows (small emissive boxes)
    if (Math.random() > 0.4) {
      const windowCount = Math.floor(finalHeight * 2);
      for (let w = 0; w < windowCount; w++) {
        if (Math.random() > 0.5) continue;
        const wGeo = new THREE.BoxGeometry(width * 0.3, 0.08, 0.01);
        const wMat = new THREE.MeshBasicMaterial({
          color: emissiveColors[Math.floor(Math.random() * emissiveColors.length)],
          transparent: true,
          opacity: 0.6 + Math.random() * 0.4,
        });
        const win = new THREE.Mesh(wGeo, wMat);
        win.position.set(0, -finalHeight / 2 + 0.3 + w * 0.4, depth / 2 + 0.01);
        building.add(win);
      }
    }
  }

  // Central tower (mega structure)
  const towerGeo = new THREE.CylinderGeometry(0.3, 0.5, 7, 8);
  const towerMat = new THREE.MeshStandardMaterial({
    color: 0x0a1520,
    metalness: 0.8,
    roughness: 0.2,
    emissive: 0x00aaff,
    emissiveIntensity: 0.2,
  });
  const tower = new THREE.Mesh(towerGeo, towerMat);
  tower.position.y = 3;
  city.add(tower);

  // Beacon on top
  const beaconGeo = new THREE.SphereGeometry(0.25, 16, 16);
  const beaconMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.8,
  });
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.y = 6.7;
  city.add(beacon);

  // Beacon light
  const beaconLight = new THREE.PointLight(0x00ffff, 2, 15);
  beaconLight.position.y = 6.7;
  city.add(beaconLight);

  return city;
}

// ─── Show / Hide Surface ───
export function showSurface(planetWorldPos, planetColors) {
  if (!surfaceGroup) return;

  surfaceGroup.position.copy(planetWorldPos);
  surfaceGroup.position.y -= 2;

  // Tint water based on planet color
  if (planetColors) {
    waterUniforms.uColor2.value.set(planetColors.atmosphere);
  }

  surfaceGroup.visible = true;
  isVisible = true;
}

export function hideSurface() {
  if (!surfaceGroup) return;
  surfaceGroup.visible = false;
  isVisible = false;
}

// ─── Update Surface ───
export function updateSurface(time) {
  if (!isVisible || !waterUniforms) return;

  waterUniforms.uTime.value = time * 0.001;

  // Slowly rotate city
  if (cityGroup) {
    cityGroup.rotation.y += 0.0005;
  }
}
