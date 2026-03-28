// ═══════════════════════════════════════════════════════════════
// Audio Manager — HiggsBosonVerse Immersive Soundscapes
// Rich, layered procedural audio via Web Audio API
// ═══════════════════════════════════════════════════════════════

const ENVS_TO_SOUNDS = {
  about: 'city',
  education: 'nature',
  projects: 'lab',
  skills: 'nature',
  achievements: 'arena',
  competitive: 'digital',
  contact: 'ocean',
};

let audioContext = null;
let masterGain = null;
let isMuted = true;
let activeSoundKey = 'space';
let activeNodes = [];

// ── Noise Buffers ───────────────────────────────────────────
function createNoiseBuffer(duration = 4) {
  const len = audioContext.sampleRate * duration;
  const buf = audioContext.createBuffer(1, len, audioContext.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function createPinkNoiseBuffer(duration = 4) {
  const len = audioContext.sampleRate * duration;
  const buf = audioContext.createBuffer(1, len, audioContext.sampleRate);
  const d = buf.getChannelData(0);
  let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886*b0 + w*0.0555179;
    b1 = 0.99332*b1 + w*0.0750759;
    b2 = 0.96900*b2 + w*0.1538520;
    b3 = 0.86650*b3 + w*0.3104856;
    b4 = 0.55000*b4 + w*0.5329522;
    b5 = -0.7616*b5 - w*0.0168980;
    d[i] = (b0+b1+b2+b3+b4+b5+b6+w*0.5362) * 0.11;
    b6 = w * 0.115926;
  }
  return buf;
}

// ── Brownian noise (deep, rumbling) ─────────────────────────
function createBrownNoiseBuffer(duration = 4) {
  const len = audioContext.sampleRate * duration;
  const buf = audioContext.createBuffer(1, len, audioContext.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    d[i] = (last + (0.02 * w)) / 1.02;
    last = d[i];
    d[i] *= 3.5;
  }
  return buf;
}

// ── Fade helpers ────────────────────────────────────────────
function fadeIn(gn, vol, dur) {
  gn.gain.setValueAtTime(0.001, audioContext.currentTime);
  gn.gain.exponentialRampToValueAtTime(vol, audioContext.currentTime + dur);
}
function fadeOut(gn, dur) {
  const v = gn.gain.value > 0.001 ? gn.gain.value : 0.001;
  gn.gain.setValueAtTime(v, audioContext.currentTime);
  gn.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + dur);
}

// ── Helper: make an osc connected to master ─────────────────
function makeOsc(type, freq, vol, fadeTime = 2) {
  const osc = audioContext.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioContext.currentTime);
  const g = audioContext.createGain();
  g.gain.setValueAtTime(0.001, audioContext.currentTime);
  osc.connect(g);
  g.connect(masterGain);
  osc.start();
  fadeIn(g, vol, fadeTime);
  return { source: osc, gain: g };
}

// ── Helper: make a noise source with filter ─────────────────
function makeNoise(buffer, filterType, filterFreq, filterQ, vol, fadeTime = 2) {
  const src = audioContext.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  const filt = audioContext.createBiquadFilter();
  filt.type = filterType;
  filt.frequency.setValueAtTime(filterFreq, audioContext.currentTime);
  filt.Q.setValueAtTime(filterQ, audioContext.currentTime);
  const g = audioContext.createGain();
  g.gain.setValueAtTime(0.001, audioContext.currentTime);
  src.connect(filt);
  filt.connect(g);
  g.connect(masterGain);
  src.start();
  fadeIn(g, vol, fadeTime);
  return { source: src, gain: g, filter: filt };
}

// ═══════════════════════════════════════════════════════════════
//  🌌 DEEP SPACE — Vast, subtle, immersive cosmic ambience
//  Pure deep tones only — no beeps, no high shimmer
// ═══════════════════════════════════════════════════════════════
function createSpace() {
  const n = [];

  // Layer 1: Thick cosmic rumble — brown noise, heavy lowpass
  const rumble = makeNoise(createBrownNoiseBuffer(5), 'lowpass', 160, 0.5, 0.70, 3);
  n.push(rumble);

  // Layer 2: Deep sub-bass foundation — very low sines
  n.push(makeOsc('sine', 28, 0.50, 3));   // sub-rumble
  n.push(makeOsc('sine', 55, 0.40, 3));   // low hum
  n.push(makeOsc('sine', 82, 0.25, 3.5)); // warm body
  n.push(makeOsc('sine', 110, 0.15, 4));  // mid warmth

  // Layer 3: Vast slow-evolving drone — two detuned triangle waves
  // with a very slow frequency drift for a "breathing universe" feel
  const drone1 = audioContext.createOscillator();
  drone1.type = 'triangle';
  drone1.frequency.setValueAtTime(70, audioContext.currentTime);
  const drone2 = audioContext.createOscillator();
  drone2.type = 'triangle';
  drone2.frequency.setValueAtTime(70.5, audioContext.currentTime); // slight detune = warmth

  // Very slow frequency drift on drone1
  const driftLFO = audioContext.createOscillator();
  driftLFO.type = 'sine';
  driftLFO.frequency.setValueAtTime(0.02, audioContext.currentTime); // ultra slow
  const driftGain = audioContext.createGain();
  driftGain.gain.setValueAtTime(2, audioContext.currentTime);
  driftLFO.connect(driftGain);
  driftGain.connect(drone1.frequency);
  driftLFO.start();

  const droneFilt = audioContext.createBiquadFilter();
  droneFilt.type = 'lowpass';
  droneFilt.frequency.setValueAtTime(220, audioContext.currentTime);
  droneFilt.Q.setValueAtTime(1, audioContext.currentTime);
  const droneG = audioContext.createGain();
  droneG.gain.setValueAtTime(0.001, audioContext.currentTime);
  drone1.connect(droneFilt);
  drone2.connect(droneFilt);
  droneFilt.connect(droneG);
  droneG.connect(masterGain);
  drone1.start();
  drone2.start();
  fadeIn(droneG, 0.35, 3);
  n.push(
    { source: drone1, gain: droneG },
    { source: drone2, gain: null },
    { source: driftLFO, gain: driftGain }
  );

  // Layer 4: Deep cosmic wind — pink noise, very low, slowly breathing
  const cosmicWind = audioContext.createBufferSource();
  cosmicWind.buffer = createPinkNoiseBuffer(5);
  cosmicWind.loop = true;
  const cwFilter = audioContext.createBiquadFilter();
  cwFilter.type = 'lowpass';
  cwFilter.frequency.setValueAtTime(350, audioContext.currentTime);
  cwFilter.Q.setValueAtTime(0.3, audioContext.currentTime);
  // Slow breathing modulation on the filter
  const cwLFO = audioContext.createOscillator();
  cwLFO.type = 'sine';
  cwLFO.frequency.setValueAtTime(0.04, audioContext.currentTime);
  const cwLFOG = audioContext.createGain();
  cwLFOG.gain.setValueAtTime(150, audioContext.currentTime);
  cwLFO.connect(cwLFOG);
  cwLFOG.connect(cwFilter.frequency);
  cwLFO.start();
  const cwGain = audioContext.createGain();
  cwGain.gain.setValueAtTime(0.001, audioContext.currentTime);
  cosmicWind.connect(cwFilter);
  cwFilter.connect(cwGain);
  cwGain.connect(masterGain);
  cosmicWind.start();
  fadeIn(cwGain, 0.25, 3);
  n.push({ source: cosmicWind, gain: cwGain }, { source: cwLFO, gain: cwLFOG });

  // Layer 5: Void texture — second brown noise layer, even deeper
  // gives that "infinite void" ambience
  const voidNoise = audioContext.createBufferSource();
  voidNoise.buffer = createBrownNoiseBuffer(6);
  voidNoise.loop = true;
  const voidFilt = audioContext.createBiquadFilter();
  voidFilt.type = 'lowpass';
  voidFilt.frequency.setValueAtTime(100, audioContext.currentTime);
  voidFilt.Q.setValueAtTime(0.5, audioContext.currentTime);
  const voidGain = audioContext.createGain();
  voidGain.gain.setValueAtTime(0.001, audioContext.currentTime);
  voidNoise.connect(voidFilt);
  voidFilt.connect(voidGain);
  voidGain.connect(masterGain);
  voidNoise.start();
  fadeIn(voidGain, 0.50, 3);
  n.push({ source: voidNoise, gain: voidGain });

  // Layer 6: Ultra-low sine sweep — barely perceptible movement
  const sweep = audioContext.createOscillator();
  sweep.type = 'sine';
  sweep.frequency.setValueAtTime(40, audioContext.currentTime);
  sweep.frequency.linearRampToValueAtTime(50, audioContext.currentTime + 60);
  const sweepG = audioContext.createGain();
  sweepG.gain.setValueAtTime(0.001, audioContext.currentTime);
  sweep.connect(sweepG);
  sweepG.connect(masterGain);
  sweep.start();
  fadeIn(sweepG, 0.20, 4);
  n.push({ source: sweep, gain: sweepG });

  return n;
}

// ═══════════════════════════════════════════════════════════════
//  🌿 NATURE — Forest breeze, birds-like chirps, peaceful
// ═══════════════════════════════════════════════════════════════
function createNature() {
  const n = [];

  // Layer 1: Rich wind — layered pink + brown noise
  const wind1 = makeNoise(createPinkNoiseBuffer(4), 'lowpass', 600, 0.5, 0.14, 3);
  n.push(wind1);
  const wind2 = makeNoise(createBrownNoiseBuffer(3), 'lowpass', 250, 0.6, 0.10, 3);
  n.push(wind2);

  // Modulate wind filter for breathing effect
  const windLFO = audioContext.createOscillator();
  windLFO.type = 'sine';
  windLFO.frequency.setValueAtTime(0.12, audioContext.currentTime);
  const windLFOG = audioContext.createGain();
  windLFOG.gain.setValueAtTime(250, audioContext.currentTime);
  windLFO.connect(windLFOG);
  windLFOG.connect(wind1.filter.frequency);
  windLFO.start();
  n.push({ source: windLFO, gain: windLFOG });

  // Layer 2: Peaceful chord pad (C maj7 — C4, E4, G4, B4)
  const chordFreqs = [261.6, 329.6, 392.0, 493.9];
  chordFreqs.forEach((f, i) => {
    const osc = audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, audioContext.currentTime);
    osc.detune.setValueAtTime(Math.random() * 8 - 4, audioContext.currentTime);
    const filt = audioContext.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(500 + i * 50, audioContext.currentTime);
    const g = audioContext.createGain();
    g.gain.setValueAtTime(0.001, audioContext.currentTime);
    osc.connect(filt);
    filt.connect(g);
    g.connect(masterGain);
    osc.start();
    fadeIn(g, 0.05, 3 + i * 0.3);
    n.push({ source: osc, gain: g });
  });

  // Layer 3: Bird-like chirps — high-frequency filtered noise bursts
  // We create a subtle, repeating high-pitched texture
  const birdNoise = audioContext.createBufferSource();
  birdNoise.buffer = createNoiseBuffer(2);
  birdNoise.loop = true;
  const birdBP = audioContext.createBiquadFilter();
  birdBP.type = 'bandpass';
  birdBP.frequency.setValueAtTime(4000, audioContext.currentTime);
  birdBP.Q.setValueAtTime(15, audioContext.currentTime);
  // Sweep the bird filter to create chirp-like texture
  const birdLFO = audioContext.createOscillator();
  birdLFO.type = 'sine';
  birdLFO.frequency.setValueAtTime(3, audioContext.currentTime);
  const birdLFOG = audioContext.createGain();
  birdLFOG.gain.setValueAtTime(1500, audioContext.currentTime);
  birdLFO.connect(birdLFOG);
  birdLFOG.connect(birdBP.frequency);
  birdLFO.start();
  const birdGain = audioContext.createGain();
  birdGain.gain.setValueAtTime(0.001, audioContext.currentTime);
  // Pulse the birds on and off with a slow LFO
  const birdPulse = audioContext.createOscillator();
  birdPulse.type = 'sine';
  birdPulse.frequency.setValueAtTime(0.4, audioContext.currentTime);
  const birdPulseG = audioContext.createGain();
  birdPulseG.gain.setValueAtTime(0.015, audioContext.currentTime);
  birdPulse.connect(birdPulseG);
  birdPulseG.connect(birdGain.gain);
  birdPulse.start();

  birdNoise.connect(birdBP);
  birdBP.connect(birdGain);
  birdGain.connect(masterGain);
  birdNoise.start();
  n.push(
    { source: birdNoise, gain: birdGain },
    { source: birdLFO, gain: birdLFOG },
    { source: birdPulse, gain: birdPulseG }
  );

  // Layer 4: Gentle stream / water — very lightly filtered noise
  const water = audioContext.createBufferSource();
  water.buffer = createPinkNoiseBuffer(3);
  water.loop = true;
  const waterHP = audioContext.createBiquadFilter();
  waterHP.type = 'highpass';
  waterHP.frequency.setValueAtTime(2000, audioContext.currentTime);
  waterHP.Q.setValueAtTime(0.3, audioContext.currentTime);
  const waterLP = audioContext.createBiquadFilter();
  waterLP.type = 'lowpass';
  waterLP.frequency.setValueAtTime(6000, audioContext.currentTime);
  const waterGain = audioContext.createGain();
  waterGain.gain.setValueAtTime(0.001, audioContext.currentTime);
  water.connect(waterHP);
  waterHP.connect(waterLP);
  waterLP.connect(waterGain);
  waterGain.connect(masterGain);
  water.start();
  fadeIn(waterGain, 0.04, 4);
  n.push({ source: water, gain: waterGain });

  return n;
}

// ═══════════════════════════════════════════════════════════════
//  🏙️ CITY — Cyberpunk ambience, deep synths, urban pulse
// ═══════════════════════════════════════════════════════════════
function createCity() {
  const n = [];

  // Layer 1: Thick detuned saw pad — cyberpunk synth
  const saws = [55, 55.4, 110, 110.6];
  const sawFilter = audioContext.createBiquadFilter();
  sawFilter.type = 'lowpass';
  sawFilter.frequency.setValueAtTime(350, audioContext.currentTime);
  sawFilter.Q.setValueAtTime(4, audioContext.currentTime);
  const sawGain = audioContext.createGain();
  sawGain.gain.setValueAtTime(0.001, audioContext.currentTime);
  sawFilter.connect(sawGain);
  sawGain.connect(masterGain);

  saws.forEach(f => {
    const osc = audioContext.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(f, audioContext.currentTime);
    osc.connect(sawFilter);
    osc.start();
    n.push({ source: osc, gain: null });
  });
  fadeIn(sawGain, 0.12, 2.5);
  n.push({ source: null, gain: sawGain });

  // Filter LFO — pulsing sweep
  const fLFO = audioContext.createOscillator();
  fLFO.type = 'sine';
  fLFO.frequency.setValueAtTime(0.2, audioContext.currentTime);
  const fLFOG = audioContext.createGain();
  fLFOG.gain.setValueAtTime(180, audioContext.currentTime);
  fLFO.connect(fLFOG);
  fLFOG.connect(sawFilter.frequency);
  fLFO.start();
  n.push({ source: fLFO, gain: fLFOG });

  // Layer 2: Sub-bass — deep and present
  n.push(makeOsc('sine', 35, 0.20, 2));

  // Layer 3: Urban hum texture — brown noise
  n.push(makeNoise(createBrownNoiseBuffer(3), 'lowpass', 180, 0.8, 0.10, 3));

  // Layer 4: High-end digital rain — noise bandpassed high
  const rain = makeNoise(createNoiseBuffer(2), 'bandpass', 5000, 1.5, 0.03, 3);
  n.push(rain);

  // Layer 5: Distant siren-like tone — slowly detuning
  const siren = audioContext.createOscillator();
  siren.type = 'sine';
  siren.frequency.setValueAtTime(440, audioContext.currentTime);
  const sirenLFO = audioContext.createOscillator();
  sirenLFO.type = 'sine';
  sirenLFO.frequency.setValueAtTime(0.03, audioContext.currentTime);
  const sirenLFOG = audioContext.createGain();
  sirenLFOG.gain.setValueAtTime(30, audioContext.currentTime);
  sirenLFO.connect(sirenLFOG);
  sirenLFOG.connect(siren.frequency);
  sirenLFO.start();
  const sirenFilt = audioContext.createBiquadFilter();
  sirenFilt.type = 'lowpass';
  sirenFilt.frequency.setValueAtTime(500, audioContext.currentTime);
  const sirenG = audioContext.createGain();
  sirenG.gain.setValueAtTime(0.001, audioContext.currentTime);
  siren.connect(sirenFilt);
  sirenFilt.connect(sirenG);
  sirenG.connect(masterGain);
  siren.start();
  fadeIn(sirenG, 0.025, 5);
  n.push({ source: siren, gain: sirenG }, { source: sirenLFO, gain: sirenLFOG });

  return n;
}

// ═══════════════════════════════════════════════════════════════
//  🔬 LAB — Digital machinery, scanning, electric atmosphere
// ═══════════════════════════════════════════════════════════════
function createLab() {
  const n = [];

  // Layer 1: Equipment hum — rich harmonics
  [60, 120, 180, 240].forEach((f, i) => {
    n.push(makeOsc('sine', f, 0.08 / (i + 1), 2));
  });

  // Layer 2: Scanning sweep — bandpass noise
  const scan = makeNoise(createNoiseBuffer(2), 'bandpass', 1200, 10, 0.06, 2);
  const scanLFO = audioContext.createOscillator();
  scanLFO.type = 'triangle';
  scanLFO.frequency.setValueAtTime(0.06, audioContext.currentTime);
  const scanLFOG = audioContext.createGain();
  scanLFOG.gain.setValueAtTime(1200, audioContext.currentTime);
  scanLFO.connect(scanLFOG);
  scanLFOG.connect(scan.filter.frequency);
  scanLFO.start();
  n.push(scan, { source: scanLFO, gain: scanLFOG });

  // Layer 3: Warm digital pad — filtered triangle waves
  const padFreqs = [196, 293.7, 392]; // G3, D4, G4
  const padFilter = audioContext.createBiquadFilter();
  padFilter.type = 'lowpass';
  padFilter.frequency.setValueAtTime(400, audioContext.currentTime);
  padFilter.Q.setValueAtTime(1.5, audioContext.currentTime);
  const padGain = audioContext.createGain();
  padGain.gain.setValueAtTime(0.001, audioContext.currentTime);
  padFilter.connect(padGain);
  padGain.connect(masterGain);
  padFreqs.forEach(f => {
    const osc = audioContext.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(f, audioContext.currentTime);
    osc.connect(padFilter);
    osc.start();
    n.push({ source: osc, gain: null });
  });
  fadeIn(padGain, 0.07, 3);
  n.push({ source: null, gain: padGain });

  // Layer 4: Subtle data texture — high noise
  n.push(makeNoise(createPinkNoiseBuffer(2), 'highpass', 3000, 0.5, 0.02, 3));

  // Layer 5: Soft low rumble
  n.push(makeNoise(createBrownNoiseBuffer(3), 'lowpass', 100, 0.7, 0.08, 2));

  return n;
}

// ═══════════════════════════════════════════════════════════════
//  🏆 ARENA — Epic, powerful, cinematic tension
// ═══════════════════════════════════════════════════════════════
function createArena() {
  const n = [];

  // Layer 1: Massive low drone — layered sines + triangle
  [32, 64, 96, 128].forEach((f, i) => {
    const type = i % 2 === 0 ? 'sine' : 'triangle';
    n.push(makeOsc(type, f, 0.18 / (i + 1), 2.5));
  });

  // Layer 2: Power surge — rising saw with heavy filter
  const surge = audioContext.createOscillator();
  surge.type = 'sawtooth';
  surge.frequency.setValueAtTime(55, audioContext.currentTime);
  surge.frequency.linearRampToValueAtTime(85, audioContext.currentTime + 30);
  const surgeFilt = audioContext.createBiquadFilter();
  surgeFilt.type = 'lowpass';
  surgeFilt.frequency.setValueAtTime(180, audioContext.currentTime);
  surgeFilt.Q.setValueAtTime(4, audioContext.currentTime);
  // Slow filter sweep for drama
  const surgeLFO = audioContext.createOscillator();
  surgeLFO.type = 'sine';
  surgeLFO.frequency.setValueAtTime(0.04, audioContext.currentTime);
  const surgeLFOG = audioContext.createGain();
  surgeLFOG.gain.setValueAtTime(80, audioContext.currentTime);
  surgeLFO.connect(surgeLFOG);
  surgeLFOG.connect(surgeFilt.frequency);
  surgeLFO.start();
  const surgeG = audioContext.createGain();
  surgeG.gain.setValueAtTime(0.001, audioContext.currentTime);
  surge.connect(surgeFilt);
  surgeFilt.connect(surgeG);
  surgeG.connect(masterGain);
  surge.start();
  fadeIn(surgeG, 0.10, 3);
  n.push({ source: surge, gain: surgeG }, { source: surgeLFO, gain: surgeLFOG });

  // Layer 3: Cinematic tension intervals (5th + octave)
  const tensionFreqs = [110, 165, 220]; // A2, E3, A3
  tensionFreqs.forEach((f, i) => {
    const osc = audioContext.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(f, audioContext.currentTime);
    // Slow tremolo for pulsing energy
    const trem = audioContext.createOscillator();
    trem.type = 'sine';
    trem.frequency.setValueAtTime(0.2 + i * 0.1, audioContext.currentTime);
    const tremG = audioContext.createGain();
    tremG.gain.setValueAtTime(0.04, audioContext.currentTime);
    trem.connect(tremG);
    const oscG = audioContext.createGain();
    oscG.gain.setValueAtTime(0.001, audioContext.currentTime);
    tremG.connect(oscG.gain);
    osc.connect(oscG);
    oscG.connect(masterGain);
    osc.start();
    trem.start();
    fadeIn(oscG, 0.05, 3 + i * 0.5);
    n.push({ source: osc, gain: oscG }, { source: trem, gain: tremG });
  });

  // Layer 4: Deep rumble texture
  n.push(makeNoise(createBrownNoiseBuffer(4), 'lowpass', 80, 0.8, 0.12, 2));

  return n;
}

// ═══════════════════════════════════════════════════════════════
//  ⚡ DIGITAL — Glitchy, electric, competitive energy
// ═══════════════════════════════════════════════════════════════
function createDigital() {
  const n = [];

  // Layer 1: Glitch texture — fast-sweeping narrow bandpass
  const glitch = makeNoise(createNoiseBuffer(2), 'bandpass', 2000, 14, 0.04, 2);
  const gLFO = audioContext.createOscillator();
  gLFO.type = 'sawtooth';
  gLFO.frequency.setValueAtTime(0.15, audioContext.currentTime);
  const gLFOG = audioContext.createGain();
  gLFOG.gain.setValueAtTime(2000, audioContext.currentTime);
  gLFO.connect(gLFOG);
  gLFOG.connect(glitch.filter.frequency);
  gLFO.start();
  n.push(glitch, { source: gLFO, gain: gLFOG });

  // Layer 2: Heavy detuned square pad
  const squareFreqs = [82.4, 82.9, 164.8, 165.5]; // E2 detuned pairs
  const sqFilt = audioContext.createBiquadFilter();
  sqFilt.type = 'lowpass';
  sqFilt.frequency.setValueAtTime(280, audioContext.currentTime);
  sqFilt.Q.setValueAtTime(3, audioContext.currentTime);
  const sqGain = audioContext.createGain();
  sqGain.gain.setValueAtTime(0.001, audioContext.currentTime);
  sqFilt.connect(sqGain);
  sqGain.connect(masterGain);
  squareFreqs.forEach(f => {
    const osc = audioContext.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(f, audioContext.currentTime);
    osc.connect(sqFilt);
    osc.start();
    n.push({ source: osc, gain: null });
  });
  fadeIn(sqGain, 0.08, 2.5);
  n.push({ source: null, gain: sqGain });

  // Layer 3: Sub pulse
  n.push(makeOsc('sine', 40, 0.18, 2));

  // Layer 4: Electric crackle texture
  const crackle = makeNoise(createNoiseBuffer(1), 'highpass', 6000, 2, 0.02, 3);
  n.push(crackle);

  // Layer 5: Rhythmic low pulse
  const pulse = audioContext.createOscillator();
  pulse.type = 'sine';
  pulse.frequency.setValueAtTime(55, audioContext.currentTime);
  const pulseAmp = audioContext.createGain();
  pulseAmp.gain.setValueAtTime(0.001, audioContext.currentTime);
  const pulseLFO = audioContext.createOscillator();
  pulseLFO.type = 'sine';
  pulseLFO.frequency.setValueAtTime(0.5, audioContext.currentTime);
  const pulseLFOG = audioContext.createGain();
  pulseLFOG.gain.setValueAtTime(0.08, audioContext.currentTime);
  pulseLFO.connect(pulseLFOG);
  pulseLFOG.connect(pulseAmp.gain);
  pulseLFO.start();
  pulse.connect(pulseAmp);
  pulseAmp.connect(masterGain);
  pulse.start();
  n.push({ source: pulse, gain: pulseAmp }, { source: pulseLFO, gain: pulseLFOG });

  return n;
}

// ═══════════════════════════════════════════════════════════════
//  🌊 OCEAN — Waves, serene, spacious (for Contact)
// ═══════════════════════════════════════════════════════════════
function createOcean() {
  const n = [];

  // Layer 1: Ocean waves — brown noise with slow volume modulation
  const wave = audioContext.createBufferSource();
  wave.buffer = createBrownNoiseBuffer(4);
  wave.loop = true;
  const waveFilt = audioContext.createBiquadFilter();
  waveFilt.type = 'lowpass';
  waveFilt.frequency.setValueAtTime(500, audioContext.currentTime);
  waveFilt.Q.setValueAtTime(0.3, audioContext.currentTime);
  const waveGain = audioContext.createGain();
  waveGain.gain.setValueAtTime(0.001, audioContext.currentTime);
  // Slow volume swell to simulate waves
  const waveLFO = audioContext.createOscillator();
  waveLFO.type = 'sine';
  waveLFO.frequency.setValueAtTime(0.08, audioContext.currentTime);
  const waveLFOG = audioContext.createGain();
  waveLFOG.gain.setValueAtTime(0.10, audioContext.currentTime);
  waveLFO.connect(waveLFOG);
  waveLFOG.connect(waveGain.gain);
  waveLFO.start();
  wave.connect(waveFilt);
  waveFilt.connect(waveGain);
  waveGain.connect(masterGain);
  wave.start();
  fadeIn(waveGain, 0.18, 3);
  n.push({ source: wave, gain: waveGain }, { source: waveLFO, gain: waveLFOG });

  // Layer 2: Second wave layer (slightly different freq)
  const wave2 = audioContext.createBufferSource();
  wave2.buffer = createPinkNoiseBuffer(3);
  wave2.loop = true;
  const wave2Filt = audioContext.createBiquadFilter();
  wave2Filt.type = 'lowpass';
  wave2Filt.frequency.setValueAtTime(350, audioContext.currentTime);
  const wave2Gain = audioContext.createGain();
  wave2Gain.gain.setValueAtTime(0.001, audioContext.currentTime);
  const wave2LFO = audioContext.createOscillator();
  wave2LFO.type = 'sine';
  wave2LFO.frequency.setValueAtTime(0.05, audioContext.currentTime);
  const wave2LFOG = audioContext.createGain();
  wave2LFOG.gain.setValueAtTime(0.08, audioContext.currentTime);
  wave2LFO.connect(wave2LFOG);
  wave2LFOG.connect(wave2Gain.gain);
  wave2LFO.start();
  wave2.connect(wave2Filt);
  wave2Filt.connect(wave2Gain);
  wave2Gain.connect(masterGain);
  wave2.start();
  fadeIn(wave2Gain, 0.12, 4);
  n.push({ source: wave2, gain: wave2Gain }, { source: wave2LFO, gain: wave2LFOG });

  // Layer 3: Serene tonal pad — open 5ths
  const seaChord = [220, 330, 440]; // A3, E4, A4
  seaChord.forEach((f, i) => {
    const osc = audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, audioContext.currentTime);
    osc.detune.setValueAtTime(Math.random() * 6 - 3, audioContext.currentTime);
    const filt = audioContext.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(400, audioContext.currentTime);
    const g = audioContext.createGain();
    g.gain.setValueAtTime(0.001, audioContext.currentTime);
    osc.connect(filt);
    filt.connect(g);
    g.connect(masterGain);
    osc.start();
    fadeIn(g, 0.04, 3 + i * 0.5);
    n.push({ source: osc, gain: g });
  });

  // Layer 4: Soft high shimmer
  const shimmer = makeNoise(createPinkNoiseBuffer(2), 'highpass', 4000, 0.3, 0.015, 5);
  n.push(shimmer);

  return n;
}

// ═══════════════════════════════════════════════════════════════
//  ROUTING & CONTROL
// ═══════════════════════════════════════════════════════════════

const GENERATORS = {
  space: createSpace,
  city: createCity,
  nature: createNature,
  lab: createLab,
  arena: createArena,
  digital: createDigital,
  ocean: createOcean,
};

function stopAllNodes(fadeDur = 1.8) {
  const toStop = [...activeNodes];
  activeNodes = [];
  toStop.forEach(({ source, gain }) => {
    if (gain) fadeOut(gain, fadeDur);
    setTimeout(() => {
      try { if (source) source.stop(); } catch (e) { /* ok */ }
    }, fadeDur * 1000 + 200);
  });
}

function startSoundscape(key) {
  const gen = GENERATORS[key];
  if (!gen) return;
  activeNodes = gen();
}

// ═══════════════════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════════════════

export function initAudio() {
  const btn = document.getElementById('btn-sound');
  if (btn) btn.addEventListener('click', toggleMute);
}

export async function playSoundscape(key) {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioContext.createGain();
    masterGain.gain.setValueAtTime(0.75, audioContext.currentTime);
    masterGain.connect(audioContext.destination);
  }

  const targetKey = ENVS_TO_SOUNDS[key] || 'space';
  if (targetKey === activeSoundKey && activeNodes.length > 0) return;

  activeSoundKey = targetKey;
  if (isMuted) return;

  stopAllNodes(1.8);
  setTimeout(() => startSoundscape(targetKey), 300);
}

export function toggleMute() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioContext.createGain();
    masterGain.gain.setValueAtTime(0.75, audioContext.currentTime);
    masterGain.connect(audioContext.destination);
  }

  isMuted = !isMuted;
  const btn = document.getElementById('btn-sound');

  if (isMuted) {
    btn.textContent = '🔇';
    stopAllNodes(0.8);
  } else {
    btn.textContent = '🔊';
    if (audioContext.state === 'suspended') audioContext.resume();
    startSoundscape(activeSoundKey);
  }
}

export function setVolume(value) {
  if (!masterGain) return;
  const v = Math.max(0, Math.min(1, value));
  masterGain.gain.setValueAtTime(v, audioContext.currentTime);
}

