import express from "express";
import cors from "cors";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  renameSync,
  copyFileSync,
} from "fs";

const app = express();
const PORT = 3001;
const DATA_FILE = "./data.json";
const TMP_FILE = "./data.json.tmp";
const BAK_FILE = "./data.json.bak";

app.use(cors());
app.use(express.json({ limit: "10mb" }));

function countTournaments(data: unknown): number {
  if (!data || typeof data !== "object") return 0;
  const seasons = (data as { seasons?: unknown }).seasons;
  if (!Array.isArray(seasons)) return 0;
  return seasons.reduce(
    (n, s) => n + (Array.isArray(s?.tournaments) ? s.tournaments.length : 0),
    0
  );
}

app.get("/api/data", (_req, res) => {
  if (!existsSync(DATA_FILE)) {
    return res.status(404).json(null);
  }
  const raw = readFileSync(DATA_FILE, "utf-8");
  res.json(JSON.parse(raw));
});

app.post("/api/data", (req, res) => {
  const body = req.body;

  // Guard against a malformed body silently wiping the database.
  if (!body || typeof body !== "object" || !Array.isArray(body.seasons)) {
    console.warn("Rejected invalid /api/data payload");
    return res.status(400).json({ ok: false, error: "invalid payload" });
  }

  try {
    // Keep the previous good copy as a one-step-back backup before overwriting.
    // If a write ever loses data, data.json.bak still holds the prior version.
    if (existsSync(DATA_FILE)) {
      const prevRaw = readFileSync(DATA_FILE, "utf-8");
      const prevCount = countTournaments(JSON.parse(prevRaw));
      const nextCount = countTournaments(body);
      // Extra safety net: refuse to shrink a populated database down to empty
      // (the classic "everything vanished" symptom). Legit shrinking that keeps
      // at least one tournament still goes through, with the .bak as recovery.
      if (prevCount > 0 && nextCount === 0) {
        console.warn(
          `Rejected POST that would empty the database (${prevCount} tournaments -> 0). ` +
            `Existing data.json left untouched.`
        );
        return res
          .status(409)
          .json({ ok: false, error: "refusing to overwrite data with empty set" });
      }
      copyFileSync(DATA_FILE, BAK_FILE);
    }

    // Atomic write: fully write a temp file, then rename over the real file.
    // A crash/kill mid-write leaves data.json intact instead of truncated.
    writeFileSync(TMP_FILE, JSON.stringify(body, null, 2));
    renameSync(TMP_FILE, DATA_FILE);
    res.json({ ok: true });
  } catch (err) {
    console.error("Failed to write data.json:", err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Tekken 8 Tournament API running on http://localhost:${PORT}`);
});
