// ═══════════════════════════════════════════════════════════════
// Audio Manager — HigssBosonVerse Soundscapes
// Handles ambient loops and cross-fading between worlds
// ═══════════════════════════════════════════════════════════════

const SOUNDS = {
  space: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a07254.mp3', // Deep Space
  city: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13d69d0.mp3',  // Cyberpunk City
  nature: 'https://cdn.pixabay.com/download/audio/2022/02/07/audio_83a3f064f2.mp3', // Birds & Wind
  lab: 'https://cdn.pixabay.com/download/audio/2021/11/25/audio_73e72c842b.mp3',    // Digital Static/Scanning
  digital: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_2e25d2ea99.mp3', // Ambient Glitch
  arena: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_823d06899b.mp3',   // Epic Drone
};


const ENVS_TO_SOUNDS = {
  about: 'city',
  education: 'nature',
  projects: 'lab',
  skills: 'nature',
  achievements: 'arena',
  competitive: 'digital',
  contact: 'nature',
};

let audioContext = null;
let currentSource = null;
let currentGainNode = null;
let isMuted = true;
let activeSoundKey = 'space';
const audioCache = {};

export function initAudio() {
  // Audio will be resumed on first user interaction
  const btn = document.getElementById('btn-sound');
  if (btn) {
    btn.addEventListener('click', toggleMute);
  }
}

async function loadSound(name) {
  if (audioCache[name]) return audioCache[name];
  
  const response = await fetch(SOUNDS[name]);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  audioCache[name] = audioBuffer;
  return audioBuffer;
}

export async function playSoundscape(key) {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  
  // Map environment section to sound key
  const targetKey = ENVS_TO_SOUNDS[key] || 'space';
  if (targetKey === activeSoundKey) return;
  
  activeSoundKey = targetKey;
  if (isMuted) return;

  try {
    const buffer = await loadSound(targetKey);
    crossfadeTo(buffer);
  } catch (err) {
    console.warn('Audio failed to load:', err);
  }
}

function crossfadeTo(newBuffer) {
  const oldGain = currentGainNode;
  
  // Setup new source
  const newSource = audioContext.createBufferSource();
  newSource.buffer = newBuffer;
  newSource.loop = true;
  
  const newGain = audioContext.createGain();
  newGain.gain.setValueAtTime(0, audioContext.currentTime);
  
  newSource.connect(newGain);
  newGain.connect(audioContext.destination);
  
  const fadeOutTime = 1.5;
  const fadeInTime = 1.5;

  if (oldGain) {
    oldGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + fadeOutTime);
    setTimeout(() => {
      // oldSource.stop() would need a reference. For now we just let it fade out.
    }, fadeOutTime * 1000);
  }

  newSource.start(0);
  newGain.gain.exponentialRampToValueAtTime(0.4, audioContext.currentTime + fadeInTime);
  
  currentSource = newSource;
  currentGainNode = newGain;
}

export function toggleMute() {
  isMuted = !isMuted;
  const btn = document.getElementById('btn-sound');
  
  if (isMuted) {
    btn.textContent = '🔇';
    if (currentGainNode) {
      currentGainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
    }
  } else {
    btn.textContent = '🔊';
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    // Start initial sound if nothing is playing
    if (!currentSource) {
      startInitialSound();
    } else if (currentGainNode) {
      currentGainNode.gain.exponentialRampToValueAtTime(0.4, audioContext.currentTime + 0.5);
    }
  }
}

async function startInitialSound() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  
  try {
    const buffer = await loadSound(activeSoundKey);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.4, audioContext.currentTime + 1.5);
    
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    source.start(0);
    currentSource = source;
    currentGainNode = gainNode;
  } catch (err) {
    console.warn('Initial sound failed:', err);
  }
}
