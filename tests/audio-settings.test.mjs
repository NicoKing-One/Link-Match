import assert from "node:assert/strict";
import test from "node:test";

import {
  AUDIO_SETTINGS_STORAGE_KEY,
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
  });

  controller.startMusic();
  controller.playSound("select");

  assert.deepEqual(events, []);
});

test("audio controller plays original procedural music and sound when enabled", () => {
  const events = [];
  const controller = createAudioController({
    getSettings: () => ({ music: true, sound: true, vibration: true }),
    createAudioContext: () => createFakeAudioContext(events),
  });

  controller.startMusic();
  controller.playSound("match");
  controller.setMusicEnabled(false);

  assert.ok(events.some((event) => event === "context-created"));
  assert.ok(events.some((event) => event.startsWith("oscillator-start:")));
  assert.ok(events.some((event) => event.startsWith("gain-ramp:")));
  assert.ok(events.some((event) => event.startsWith("oscillator-stop:")));
});

test("audio controller retries resuming suspended music when a loop is already scheduled", () => {
  const events = [];
  const controller = createAudioController({
    getSettings: () => ({ music: true, sound: false, vibration: true }),
    createAudioContext: () => createFakeAudioContext(events, { state: "suspended", resumeState: "suspended" }),
    setIntervalFn: () => 1,
  });

  controller.startMusic();
  controller.startMusic();

  assert.equal(events.filter((event) => event === "context-resume").length, 2);
});

test("background music uses a brisk short-note loop instead of long ambient pads", () => {
  const events = [];
  const controller = createAudioController({
    getSettings: () => ({ music: true, sound: true, vibration: true }),
    createAudioContext: () => createFakeAudioContext(events),
    setIntervalFn: () => 1,
    clearIntervalFn: () => events.push("interval-clear"),
  });

  try {
    controller.startMusic();

    const starts = getOscillatorTimings(events, "start");
    const stops = getOscillatorTimings(events, "stop");
    assert.ok(starts.length >= 8, `expected at least 8 short music notes, got ${starts.length}`);
    const longestTone = Math.max(...starts.map((start, index) => (stops[index] ?? start) - start));
    assert.ok(longestTone <= 0.9, `expected no music tone to ring longer than 0.9s, got ${longestTone}`);
  } finally {
    controller.stopMusic();
  }
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
