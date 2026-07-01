import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  AUDIO_SETTINGS_STORAGE_KEY,
  BACKGROUND_MUSIC_SOURCE,
  DEFAULT_AUDIO_SETTINGS,
  createAudioController,
  loadAudioSettings,
  setAudioSetting,
  shouldVibrate,
} from "../src/audio-settings.js";

test("loads default enabled settings when persisted settings are missing or invalid", () => {
  assert.deepEqual(loadAudioSettings(createMemoryStorage()), DEFAULT_AUDIO_SETTINGS);

  const storage = createMemoryStorage({
    [AUDIO_SETTINGS_STORAGE_KEY]: "{bad json",
  });
  assert.deepEqual(loadAudioSettings(storage), DEFAULT_AUDIO_SETTINGS);
});

test("audio settings reset to enabled on each new app session", () => {
  const storage = createMemoryStorage({
    [AUDIO_SETTINGS_STORAGE_KEY]: JSON.stringify({ music: false, sound: false, vibration: false }),
  });

  assert.deepEqual(loadAudioSettings(storage), DEFAULT_AUDIO_SETTINGS);
});

test("changes individual audio settings without persisting them", () => {
  const storage = createMemoryStorage();

  const nextSettings = setAudioSetting(storage, DEFAULT_AUDIO_SETTINGS, "sound", false);
  assert.deepEqual(nextSettings, {
    music: true,
    sound: false,
    vibration: true,
  });
  assert.equal(storage.getItem(AUDIO_SETTINGS_STORAGE_KEY), null);

  const mutedVibration = setAudioSetting(storage, DEFAULT_AUDIO_SETTINGS, "vibration", false);
  assert.equal(shouldVibrate(mutedVibration), false);
});

test("audio controller respects music and sound switches before creating sounds", () => {
  const events = [];
  const controller = createAudioController({
    getSettings: () => ({ music: false, sound: false, vibration: true }),
    createAudioContext: () => createFakeAudioContext(events),
    createMusicElement: createFakeMusicElement(events),
  });

  controller.startMusic();
  controller.playSound("select");

  assert.deepEqual(events, []);
});

test("audio controller plays bundled media music and procedural sound when enabled", () => {
  const events = [];
  const controller = createAudioController({
    getSettings: () => ({ music: true, sound: true, vibration: true }),
    createAudioContext: () => createFakeAudioContext(events),
    createMusicElement: createFakeMusicElement(events),
  });

  controller.startMusic();
  controller.playSound("match");
  controller.setMusicEnabled(false);

  assert.ok(events.includes("music-created:./assets/audio/background_video.mp3"));
  assert.ok(events.includes("music-loop:true"));
  assert.ok(events.includes("music-volume:0.38"));
  assert.ok(events.includes("music-play"));
  assert.ok(events.includes("music-pause"));
  assert.ok(events.some((event) => event === "context-created"));
  assert.ok(events.some((event) => event.startsWith("oscillator-start:")));
  assert.ok(events.some((event) => event.startsWith("gain-ramp:")));
  assert.ok(events.some((event) => event.startsWith("oscillator-stop:")));
});

test("audio controller retries media music playback when a loop is already loaded", () => {
  const events = [];
  const controller = createAudioController({
    getSettings: () => ({ music: true, sound: false, vibration: true }),
    createAudioContext: () => createFakeAudioContext(events),
    createMusicElement: createFakeMusicElement(events),
  });

  controller.startMusic();
  controller.startMusic();

  assert.equal(events.filter((event) => event === "music-play").length, 2);
  assert.equal(events.filter((event) => event === "music-created:./assets/audio/background_video.mp3").length, 1);
});

test("audio controller reports blocked music playback for startup retry", async () => {
  const events = [];
  const controller = createAudioController({
    getSettings: () => ({ music: true, sound: false, vibration: true }),
    createAudioContext: () => createFakeAudioContext(events),
    createMusicElement: createFakeMusicElement(events, { rejectPlay: true }),
  });

  const played = await controller.startMusic();

  assert.equal(played, false);
  assert.ok(events.includes("music-play-reject"));
});

test("background music uses a bundled media asset instead of generated WebAudio", () => {
  const events = [];
  const controller = createAudioController({
    getSettings: () => ({ music: true, sound: false, vibration: true }),
    createAudioContext: () => createFakeAudioContext(events),
    createMusicElement: createFakeMusicElement(events),
  });

  controller.startMusic({ resumeSuspended: false, scheduleWhenSuspended: false });

  assert.ok(events.includes("music-created:./assets/audio/background_video.mp3"));
  assert.ok(events.includes("music-play"));
  assert.equal(events.includes("context-created"), false);
  assert.equal(events.some((event) => event.startsWith("oscillator-start:")), false);
});

test("startup music preloads and attempts muted autoplay warmup", async () => {
  const events = [];
  const controller = createAudioController({
    getSettings: () => ({ music: true, sound: false, vibration: true }),
    createAudioContext: () => createFakeAudioContext(events),
    createMusicElement: createFakeMusicElement(events),
  });

  const played = await controller.startMusic({ warmupMuted: true });

  assert.ok(events.includes("music-preload:auto"));
  assert.ok(events.includes("music-load"));
  assert.ok(events.includes("music-muted:true"));
  assert.ok(events.includes("music-play"));
  assert.ok(events.includes("music-muted:false"));
  assert.equal(played, true);
});

test("background music media asset is the bundled MP3 file", () => {
  const mp3 = readFileSync(new URL(`../src/${BACKGROUND_MUSIC_SOURCE.replace("./", "")}`, import.meta.url));
  const hasId3Header = mp3.subarray(0, 3).toString("ascii") === "ID3";
  const hasFrameSync = mp3[0] === 0xff && (mp3[1] & 0xe0) === 0xe0;

  assert.equal(BACKGROUND_MUSIC_SOURCE, "./assets/audio/background_video.mp3");
  assert.ok(mp3.length > 0, "expected bundled BGM asset to be non-empty");
  assert.ok(hasId3Header || hasFrameSync, "expected bundled BGM asset to look like an MP3 file");
});

test("audio controller uses a concise shared button sound", () => {
  const events = [];
  const controller = createAudioController({
    getSettings: () => ({ music: true, sound: true, vibration: true }),
    createAudioContext: () => createFakeAudioContext(events),
  });

  controller.playSound("button");

  assert.equal(events.filter((event) => event.startsWith("oscillator-start:")).length, 1);
  assert.ok(events.some((event) => event === "frequency-set:880:10"));
});

test("failure sound resolves in about 1.5 seconds", () => {
  const events = [];
  const controller = createAudioController({
    getSettings: () => ({ music: true, sound: true, vibration: true }),
    createAudioContext: () => createFakeAudioContext(events),
  });

  controller.playSound("fail");

  const finalStop = Math.max(...getOscillatorTimings(events, "stop"));
  const totalDuration = finalStop - 10;
  assert.ok(totalDuration >= 1.4, `expected failure sound to last at least 1.4s, got ${totalDuration}`);
  assert.ok(totalDuration <= 1.6, `expected failure sound to finish within 1.6s, got ${totalDuration}`);
});

function getOscillatorTimings(events, phase) {
  return events
    .filter((event) => event.startsWith(`oscillator-${phase}:`))
    .map((event) => Number(event.split(":").at(-1)));
}

function createMemoryStorage(initialValues = {}) {
  const values = new Map(Object.entries(initialValues));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
  };
}

function createFakeMusicElement(events, options = {}) {
  return (src) => {
    events.push(`music-created:${src}`);
    let paused = true;
    let remainingRejectedPlays = options.rejectPlay ? 1 : 0;
    return {
      set loop(value) {
        events.push(`music-loop:${value}`);
      },
      set volume(value) {
        events.push(`music-volume:${value}`);
      },
      set preload(value) {
        events.push(`music-preload:${value}`);
      },
      set muted(value) {
        events.push(`music-muted:${value}`);
      },
      set currentTime(value) {
        events.push(`music-current-time:${value}`);
      },
      get paused() {
        return paused;
      },
      play() {
        events.push("music-play");
        if (remainingRejectedPlays > 0) {
          remainingRejectedPlays -= 1;
          events.push("music-play-reject");
          return Promise.reject(new Error("blocked"));
        }
        paused = false;
        return Promise.resolve();
      },
      pause() {
        events.push("music-pause");
        paused = true;
      },
      load() {
        events.push("music-load");
      },
    };
  };
}

function createFakeAudioContext(events, options = {}) {
  events.push("context-created");
  let oscillatorId = 0;
  let state = options.state ?? "running";
  return {
    currentTime: 10,
    destination: { type: "destination" },
    get state() {
      return state;
    },
    createGain() {
      return createFakeGain(events);
    },
    createOscillator() {
      oscillatorId += 1;
      return createFakeOscillator(events, oscillatorId);
    },
    resume() {
      events.push("context-resume");
      state = options.resumeState ?? "running";
      return Promise.resolve();
    },
  };
}

function createFakeGain(events) {
  return {
    gain: {
      value: 0,
      setValueAtTime(value, time) {
        events.push(`gain-set:${value}:${time}`);
      },
      linearRampToValueAtTime(value, time) {
        events.push(`gain-ramp:${value}:${time}`);
      },
      exponentialRampToValueAtTime(value, time) {
        events.push(`gain-exp:${value}:${time}`);
      },
    },
    connect() {
      events.push("gain-connect");
    },
    disconnect() {
      events.push("gain-disconnect");
    },
  };
}

function createFakeOscillator(events, id) {
  return {
    frequency: {
      setValueAtTime(value, time) {
        events.push(`frequency-set:${value}:${time}`);
      },
      linearRampToValueAtTime(value, time) {
        events.push(`frequency-ramp:${value}:${time}`);
      },
    },
    type: "sine",
    connect() {
      events.push("oscillator-connect");
    },
    start(time) {
      events.push(`oscillator-start:${id}:${time}`);
    },
    stop(time) {
      events.push(`oscillator-stop:${id}:${time ?? ""}`);
    },
  };
}
