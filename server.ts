import express from "express";
import cors from "cors";
import { readFileSync, writeFileSync, existsSync } from "fs";

const app = express();
const PORT = 3001;
const DATA_FILE = "./data.json";

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/api/data", (_req, res) => {
  if (!existsSync(DATA_FILE)) {
    return res.status(404).json(null);
  }
  const raw = readFileSync(DATA_FILE, "utf-8");
  res.json(JSON.parse(raw));
});

app.post("/api/data", (req, res) => {
  writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2));
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Tekken 8 Tournament API running on http://localhost:${PORT}`);
});
