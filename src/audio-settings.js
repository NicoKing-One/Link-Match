export const AUDIO_SETTINGS_STORAGE_KEY = "lianliankan.audioSettings";

export const DEFAULT_AUDIO_SETTINGS = Object.freeze({
  music: true,
  sound: true,
  vibration: true,
});

const SETTING_KEYS = Object.keys(DEFAULT_AUDIO_SETTINGS);

const BUTTON_SOUND = [{ frequency: 880, duration: 0.035, volume: 0.022, type: "triangle", release: 0.045 }];

const SOUND_PATTERNS = {
  button: BUTTON_SOUND,
  select: BUTTON_SOUND,
  match: [
    { frequency: 659.25, duration: 0.07, volume: 0.042, type: "triangle", release: 0.06 },
    { frequency: 880, delay: 0.065, duration: 0.08, volume: 0.04, type: "sine", release: 0.07 },
    { frequency: 1174.66, delay: 0.14, duration: 0.11, volume: 0.032, type: "triangle", release: 0.1 },
  ],
  mismatch: [
    { frequency: 246.94, endFrequency: 207.65, duration: 0.12, volume: 0.038, type: "triangle", release: 0.09 },
    { frequency: 196, endFrequency: 174.61, delay: 0.08, duration: 0.13, volume: 0.026, type: "sine", release: 0.12 },
  ],
  home: BUTTON_SOUND,
  hint: BUTTON_SOUND,
  shuffle: BUTTON_SOUND,
  pause: BUTTON_SOUND,
  resume: BUTTON_SOUND,
  success: [
    { frequency: 523.25, duration: 0.08, volume: 0.046, type: "triangle", release: 0.06 },
    { frequency: 659.25, delay: 0.075, duration: 0.08, volume: 0.046, type: "sine", release: 0.06 },
    { frequency: 783.99, delay: 0.15, duration: 0.1, volume: 0.043, type: "triangle", release: 0.08 },
    { frequency: 1046.5, delay: 0.24, duration: 0.16, volume: 0.038, type: "sine", release: 0.18 },
    { frequency: 1318.51, delay: 0.33, duration: 0.12, volume: 0.026, type: "triangle", release: 0.14 },
  ],
  fail: [
    { frequency: 392, duration: 0.14, volume: 0.034, type: "triangle", release: 0.16 },
    { frequency: 329.63, delay: 0.25, duration: 0.14, volume: 0.032, type: "sine", release: 0.18 },
    { frequency: 293.66, delay: 0.53, duration: 0.14, volume: 0.03, type: "triangle", release: 0.2 },
    { frequency: 246.94, delay: 0.82, duration: 0.16, volume: 0.026, type: "sine", release: 0.24 },
    { frequency: 196, delay: 1.09, duration: 0.14, volume: 0.022, type: "triangle", release: 0.24 },
  ],
  reward: [
    { frequency: 987.77, duration: 0.055, volume: 0.034, type: "triangle", release: 0.06 },
    { frequency: 1318.51, delay: 0.065, duration: 0.08, volume: 0.028, type: "sine", release: 0.08 },
  ],
  blocked: BUTTON_SOUND,
};

const MUSIC_PHRASE = [
  { frequency: 261.63, delay: 0, duration: 0.18, volume: 0.005, type: "triangle", attack: 0.012, release: 0.24 },
  { frequency: 659.25, delay: 0.08, duration: 0.12, volume: 0.007, type: "triangle", attack: 0.008, release: 0.2 },
  { frequency: 783.99, delay: 0.38, duration: 0.12, volume: 0.0065, type: "sine", attack: 0.008, release: 0.2 },
  { frequency: 880, delay: 0.68, duration: 0.12, volume: 0.0062, type: "triangle", attack: 0.008, release: 0.22 },
  { frequency: 392, delay: 1.02, duration: 0.16, volume: 0.0046, type: "triangle", attack: 0.012, release: 0.22 },
  { frequency: 783.99, delay: 1.14, duration: 0.12, volume: 0.006, type: "sine", attack: 0.008, release: 0.2 },
  { frequency: 659.25, delay: 1.48, duration: 0.12, volume: 0.006, type: "triangle", attack: 0.008, release: 0.2 },
  { frequency: 587.33, delay: 1.78, duration: 0.12, volume: 0.0058, type: "sine", attack: 0.008, release: 0.22 },
  { frequency: 329.63, delay: 2.16, duration: 0.16, volume: 0.0048, type: "triangle", attack: 0.012, release: 0.24 },
  { frequency: 523.25, delay: 2.28, duration: 0.12, volume: 0.006, type: "triangle", attack: 0.008, release: 0.2 },
  { frequency: 659.25, delay: 2.6, duration: 0.12, volume: 0.0062, type: "sine", attack: 0.008, release: 0.2 },
  { frequency: 783.99, delay: 2.92, duration: 0.14, volume: 0.006, type: "triangle", attack: 0.008, release: 0.24 },
  { frequency: 392, delay: 3.28, duration: 0.16, volume: 0.0046, type: "triangle", attack: 0.012, release: 0.24 },
  { frequency: 880, delay: 3.42, duration: 0.1, volume: 0.0056, type: "sine", attack: 0.008, release: 0.18 },
  { frequency: 783.99, delay: 3.72, duration: 0.12, volume: 0.0058, type: "triangle", attack: 0.008, release: 0.22 },
  { frequency: 659.25, delay: 4.04, duration: 0.15, volume: 0.0056, type: "sine", attack: 0.008, release: 0.24 },
];

const MUSIC_LOOP_MS = 5000;

export function normalizeAudioSettings(value) {
  const source = value && typeof value === "object" ? value : {};
  return SETTING_KEYS.reduce((settings, key) => {
    settings[key] = typeof source[key] === "boolean" ? source[key] : DEFAULT_AUDIO_SETTINGS[key];
    return settings;
  }, {});
}

export function loadAudioSettings(storage) {
  void storage;
  return { ...DEFAULT_AUDIO_SETTINGS };
}

export function saveAudioSettings(storage, settings) {
  void storage;
  return normalizeAudioSettings(settings);
}

export function setAudioSetting(storage, currentSettings, key, enabled) {
  if (!SETTING_KEYS.includes(key)) return saveAudioSettings(storage, currentSettings);
  return saveAudioSettings(storage, {
    ...normalizeAudioSettings(currentSettings),
    [key]: enabled === true,
  });
}

export function shouldPlayMusic(settings) {
  return normalizeAudioSettings(settings).music;
}

export function shouldPlaySound(settings) {
  return normalizeAudioSettings(settings).sound;
}

export function shouldVibrate(settings) {
  return normalizeAudioSettings(settings).vibration;
}

export function createAudioController(options = {}) {
  const getSettings = options.getSettings ?? (() => DEFAULT_AUDIO_SETTINGS);
  const createAudioContext = options.createAudioContext ?? createBrowserAudioContext;
  const setIntervalFn = options.setIntervalFn ?? globalThis.setInterval?.bind(globalThis);
  const clearIntervalFn = options.clearIntervalFn ?? globalThis.clearInterval?.bind(globalThis);
  let context = null;
  let musicTimer = null;
  let musicNodes = [];

  function getContext() {
    if (context) return context;
    context = createAudioContext();
    return context;
  }

  function ensureContext() {
    const nextContext = getContext();
    if (!nextContext) return null;
    if (nextContext.state === "suspended" && typeof nextContext.resume === "function") {
      nextContext.resume().catch?.(() => {});
    }
    return nextContext;
  }

  function playSound(name) {
    if (!shouldPlaySound(getSettings())) return;
    const pattern = SOUND_PATTERNS[name] ?? SOUND_PATTERNS.select;
    const nextContext = ensureContext();
    if (!nextContext) return;
    pattern.forEach((tone) => createTone(nextContext, tone));
  }

  function startMusic() {
    if (!shouldPlayMusic(getSettings())) return;
    const nextContext = ensureContext();
    if (!nextContext || musicTimer) return;
    scheduleMusicPhrase(nextContext);
    if (typeof setIntervalFn === "function") {
      musicTimer = setIntervalFn(() => {
        if (shouldPlayMusic(getSettings())) scheduleMusicPhrase(nextContext);
      }, MUSIC_LOOP_MS);
    }
  }

  function stopMusic() {
    if (musicTimer && typeof clearIntervalFn === "function") {
      clearIntervalFn(musicTimer);
    }
    musicTimer = null;
    musicNodes.forEach(({ oscillator, gain }) => {
      try {
        oscillator.stop();
      } catch {}
      try {
        gain.disconnect();
      } catch {}
    });
    musicNodes = [];
  }

  function setMusicEnabled(enabled) {
    if (enabled) {
      startMusic();
    } else {
      stopMusic();
    }
  }

  function syncSettings() {
    setMusicEnabled(shouldPlayMusic(getSettings()));
  }

  function scheduleMusicPhrase(nextContext) {
    musicNodes = musicNodes.filter(({ endAt }) => endAt > nextContext.currentTime);
    MUSIC_PHRASE.forEach((tone) => {
      const node = createTone(nextContext, {
        ...tone,
        type: tone.type ?? "sine",
        attack: tone.attack ?? 0.08,
        release: tone.release ?? 0.34,
      });
      if (node) musicNodes.push(node);
    });
  }

  return {
    playSound,
    setMusicEnabled,
    startMusic,
    stopMusic,
    syncSettings,
  };
}

function createBrowserAudioContext() {
  const AudioContextClass = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  return AudioContextClass ? new AudioContextClass() : null;
}

function createTone(context, tone) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const startAt = context.currentTime + (tone.delay ?? 0);
  const duration = tone.duration ?? 0.12;
  const attack = tone.attack ?? 0.01;
  const release = tone.release ?? 0.08;
  const endAt = startAt + duration;
  const frequency = tone.frequency ?? 440;
  const endFrequency = tone.endFrequency ?? frequency;
  const volume = tone.volume ?? 0.035;

  oscillator.type = tone.type ?? "sine";
  oscillator.frequency.setValueAtTime(frequency, startAt);
  if (endFrequency !== frequency && typeof oscillator.frequency.linearRampToValueAtTime === "function") {
    oscillator.frequency.linearRampToValueAtTime(endFrequency, endAt);
  }

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.linearRampToValueAtTime(volume, startAt + attack);
  if (typeof gain.gain.exponentialRampToValueAtTime === "function") {
    gain.gain.exponentialRampToValueAtTime(0.0001, endAt + release);
  } else {
    gain.gain.linearRampToValueAtTime(0.0001, endAt + release);
  }

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(endAt + release + 0.03);
  return { oscillator, gain, endAt: endAt + release + 0.03 };
}
