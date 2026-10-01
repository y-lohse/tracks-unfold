// Optional real-browser regression check. Pass an installed Playwright module path.
// node scripts/check-instrument-audio.mjs /path/to/playwright/index.mjs
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { createServer } from "vite";

assert.ok(
  process.argv[2],
  "Pass the absolute path to an installed Playwright index.mjs module; Chrome must also be installed.",
);
const { chromium } = await import(pathToFileURL(process.argv[2]).href);
const server = await createServer({ server: { host: "127.0.0.1", port: 0 } });
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.goto(server.resolvedUrls.local[0]);
  await page.getByRole("button", { name: "Instrument", exact: true }).click();
  await page.getByRole("button", { name: "A4", exact: true }).click();
  // Let the UI's minimum-tap timer finish before driving the synth directly.
  await page.waitForTimeout(500);
  const readings = await page.evaluate(async () => {
    const urls = performance
      .getEntriesByType("resource")
      .map((entry) => entry.name);
    const Tone = await import(urls.find((url) => url.includes("/tone.js")));
    const { keyboardSynth } = await import(
      urls.find((url) => url.includes("/src/keyboardSynth.ts"))
    );
    const { DEFAULT_INSTRUMENT_SOUND } = await import(
      urls.find((url) => url.includes("/src/instrumentPresets.ts"))
    );
    const waveform = new Tone.Waveform(16384);
    Tone.getDestination().connect(waveform);
    const sampleRate = Tone.getContext().sampleRate;
    const results = [];
    const selections = [];
    for (const tone of ["sine", "triangle", "square", "saw", "reed"]) {
      for (const effect of ["dry", "warmth", "grit", "room", "hall"])
        selections.push({ tone, effect, filter: "open" });
      for (const filter of ["mellow", "thin", "focused", "bloom"])
        selections.push({ tone, effect: "dry", filter });
    }
    for (const { tone, effect, filter } of selections) {
      keyboardSynth.configure({
        ...DEFAULT_INSTRUMENT_SOUND,
        tone,
        effect,
        filter,
      });
      keyboardSynth.noteOn("A4");
      await new Promise((resolve) => setTimeout(resolve, 650));
      const data = waveform.getValue();
      let energy = 0;
      let peak = 0;
      for (const sample of data) {
        energy += sample * sample;
        peak = Math.max(peak, Math.abs(sample));
      }
      const harmonics = [];
      // Hann-windowed harmonic amplitudes avoid leakage from non-integral cycles.
      for (const harmonic of [1, 3, 5, 7, 9]) {
        let real = 0;
        let imaginary = 0;
        for (let i = 0; i < data.length; i++) {
          const window =
            0.5 * (1 - Math.cos((2 * Math.PI * i) / (data.length - 1)));
          const phase = (2 * Math.PI * 440 * harmonic * i) / sampleRate;
          real += data[i] * window * Math.cos(phase);
          imaginary += data[i] * window * Math.sin(phase);
        }
        harmonics.push(Math.hypot(real, imaginary));
      }
      results.push({
        tone,
        effect,
        filter,
        db: 10 * Math.log10(energy / data.length),
        peak,
        oddHarmonics: Math.hypot(...harmonics.slice(1)) / harmonics[0],
      });
      keyboardSynth.releaseAll();
    }
    waveform.dispose();
    return results;
  });
  console.table(
    readings.map((row) => ({
      ...row,
      db: row.db.toFixed(2),
      peak: row.peak.toFixed(3),
      oddHarmonics: row.oddHarmonics.toFixed(3),
    })),
  );
  assert.deepEqual(errors, [], "Audio checks must not hide browser exceptions");
  const dry = readings.filter(
    (row) => row.effect === "dry" && row.filter === "open",
  );
  const spread =
    Math.max(...dry.map((row) => row.db)) -
    Math.min(...dry.map((row) => row.db));
  const grit = readings.find(
    (row) => row.tone === "sine" && row.effect === "grit",
  );
  console.log({ drySpreadDb: spread, gritOddHarmonics: grit.oddHarmonics });
  assert.ok(
    grit.oddHarmonics >= 0.25,
    "Grit must meaningfully distort a pure sine (odd harmonics >= 25% of fundamental)",
  );
  assert.ok(spread <= 3, "Dry oscillator levels must stay within 3 dB at A4");
  for (const tone of dry) {
    for (const row of readings.filter((row) => row.tone === tone.tone)) {
      assert.ok(
        Math.abs(row.db - tone.db) <= (row.filter === "open" ? 3 : 6),
        `${row.tone}/${row.effect}/${row.filter} exceeds its level tolerance`,
      );
      assert.ok(row.peak < 0.95, "Single notes must leave headroom");
    }
  }
} finally {
  await browser?.close();
  await server.close();
}
