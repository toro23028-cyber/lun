import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { v4 as uuid } from "uuid";
import { uploadToR2, deleteFromR2 } from "./r2.js";
import { db } from "./db.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = ["video/mp4","video/webm","video/quicktime","image/jpeg","image/png","image/webp"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`Tipo não permitido: ${file.mimetype}`));
  },
});

function requireAdmin(req, res, next) {
  if (req.headers["x-admin-password"] !== process.env.ADMIN_PASSWORD)
    return res.status(401).json({ error: "Não autorizado" });
  next();
}

// extrai hashtags do título
function extractTags(title = "") {
  const tags = [];
  title.replace(/#(\w+)/g, (_, t) => tags.push(t.toLowerCase()));
  return tags;
}

// ── ROTAS PÚBLICAS ────────────────────────────────────────────────────────────

app.get("/videos", (req, res) => {
  const { tag } = req.query;
  let videos = db.getVideos();
  if (tag) videos = videos.filter(v => (v.tags || []).includes(tag.toLowerCase()));
  res.json(videos.sort(() => Math.random() - 0.5));
});

app.get("/albums", (req, res) => {
  const { tag } = req.query;
  let albums = db.getAlbums();
  if (tag) albums = albums.filter(a => (a.tags || []).includes(tag.toLowerCase()));
  res.json(albums.sort(() => Math.random() - 0.5));
});

app.get("/tags", (req, res) => {
  const tagMap = {};
  [...db.getVideos(), ...db.getAlbums()].forEach(item => {
    (item.tags || []).forEach(t => { tagMap[t] = (tagMap[t] || 0) + 1; });
  });
  const tags = Object.entries(tagMap)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
  res.json(tags);
});

app.post("/videos/:id/like", (req, res) => {
  const delta = req.body.action === "remove" ? -1 : 1;
  const video = db.updateVideoLikes(req.params.id, delta);
  if (!video) return res.status(404).json({ error: "Não encontrado" });
  res.json({ likes: video.likes });
});

app.post("/albums/:id/like", (req, res) => {
  const delta = req.body.action === "remove" ? -1 : 1;
  const album = db.updateAlbumLikes(req.params.id, delta);
  if (!album) return res.status(404).json({ error: "Não encontrado" });
  res.json({ likes: album.likes });
});

// ── ROTAS ADMIN ───────────────────────────────────────────────────────────────

app.post("/admin/login", (req, res) => {
  if (req.body.password === process.env.ADMIN_PASSWORD) res.json({ ok: true });
  else res.status(401).json({ error: "Senha incorreta" });
});

app.post("/admin/videos", requireAdmin, upload.single("file"), async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !req.file) return res.status(400).json({ error: "title e file são obrigatórios" });
    const ext = req.file.originalname.split(".").pop();
    const key = `videos/${uuid()}.${ext}`;
    const url = await uploadToR2(req.file.buffer, key, req.file.mimetype);
    const tags = extractTags(title);
    const video = db.addVideo({ id: uuid(), title, tags, url, r2Key: key, likes: 0, views: 0, createdAt: new Date().toISOString() });
    res.status(201).json(video);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Upload de álbum (múltiplas fotos)
app.post("/admin/albums", requireAdmin, upload.array("files", 50), async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !req.files?.length) return res.status(400).json({ error: "title e files são obrigatórios" });

    const photos = [];
    for (const file of req.files) {
      const ext = file.originalname.split(".").pop();
      const key = `photos/${uuid()}.${ext}`;
      const url = await uploadToR2(file.buffer, key, file.mimetype);
      photos.push({ id: uuid(), url, r2Key: key });
    }

    const tags = extractTags(title);
    const album = db.addAlbum({
      id: uuid(), title, tags,
      photos,
      coverUrl: photos[0]?.url || null,
      photoCount: photos.length,
      likes: 0,
      createdAt: new Date().toISOString(),
    });
    res.status(201).json(album);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/admin/videos/:id", requireAdmin, async (req, res) => {
  try {
    const video = db.getVideo(req.params.id);
    if (!video) return res.status(404).json({ error: "Não encontrado" });
    await deleteFromR2(video.r2Key);
    db.deleteVideo(req.params.id);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/admin/albums/:id", requireAdmin, async (req, res) => {
  try {
    const album = db.getAlbum(req.params.id);
    if (!album) return res.status(404).json({ error: "Não encontrado" });
    for (const photo of (album.photos || [])) await deleteFromR2(photo.r2Key).catch(() => {});
    db.deleteAlbum(req.params.id);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/admin/library", requireAdmin, (req, res) => {
  res.json({ videos: db.getVideos(), albums: db.getAlbums() });
});

app.get("/health", (req, res) => res.json({ status: "ok", ts: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`\n🌙 Lumina backend em http://localhost:${PORT}\n`);
});
