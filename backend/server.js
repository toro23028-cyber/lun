import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { v4 as uuid } from "uuid";
import { uploadToR2, deleteFromR2 } from "./r2.js";
import { db } from "./db.js";

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Multer: armazena em memória (buffer) antes de enviar para o R2
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter(req, file, cb) {
    const allowed = ["video/mp4", "video/webm", "video/quicktime", "image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`Tipo não permitido: ${file.mimetype}`));
  },
});

// ── Middleware de autenticação admin ─────────────────────────────────────────
function requireAdmin(req, res, next) {
  const auth = req.headers["x-admin-password"];
  if (auth !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Não autorizado" });
  }
  next();
}

// ── ROTAS PÚBLICAS ────────────────────────────────────────────────────────────

// GET /videos — lista todos os vídeos (ordem aleatória)
app.get("/videos", (req, res) => {
  const { category } = req.query;
  let videos = db.getVideos();
  if (category) videos = videos.filter(v => v.category === category);
  // Embaralha para o Explore
  videos = videos.sort(() => Math.random() - 0.5);
  res.json(videos);
});

// GET /photos — lista todas as fotos
app.get("/photos", (req, res) => {
  const { category } = req.query;
  let photos = db.getPhotos();
  if (category) photos = photos.filter(p => p.category === category);
  photos = photos.sort(() => Math.random() - 0.5);
  res.json(photos);
});

// POST /videos/:id/like — dar like
app.post("/videos/:id/like", (req, res) => {
  const { action } = req.body; // "add" | "remove"
  const delta = action === "remove" ? -1 : 1;
  const video = db.updateVideoLikes(req.params.id, delta);
  if (!video) return res.status(404).json({ error: "Não encontrado" });
  res.json({ likes: video.likes });
});

// POST /photos/:id/like — dar like
app.post("/photos/:id/like", (req, res) => {
  const { action } = req.body;
  const delta = action === "remove" ? -1 : 1;
  const photo = db.updatePhotoLikes(req.params.id, delta);
  if (!photo) return res.status(404).json({ error: "Não encontrado" });
  res.json({ likes: photo.likes });
});

// ── ROTAS ADMIN (protegidas) ─────────────────────────────────────────────────

// POST /admin/videos — upload de vídeo
app.post("/admin/videos", requireAdmin, upload.single("file"), async (req, res) => {
  try {
    const { title, category } = req.body;
    if (!title || !category) return res.status(400).json({ error: "title e category são obrigatórios" });
    if (!req.file) return res.status(400).json({ error: "Nenhum arquivo enviado" });

    const ext = req.file.originalname.split(".").pop();
    const key = `videos/${uuid()}.${ext}`;
    const url = await uploadToR2(req.file.buffer, key, req.file.mimetype);

    const video = db.addVideo({
      id: uuid(),
      title,
      category,
      url,
      r2Key: key,
      likes: 0,
      views: 0,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json(video);
  } catch (err) {
    console.error("Erro upload vídeo:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/photos — upload de foto
app.post("/admin/photos", requireAdmin, upload.single("file"), async (req, res) => {
  try {
    const { title, category } = req.body;
    if (!title || !category) return res.status(400).json({ error: "title e category são obrigatórios" });
    if (!req.file) return res.status(400).json({ error: "Nenhum arquivo enviado" });

    const ext = req.file.originalname.split(".").pop();
    const key = `photos/${uuid()}.${ext}`;
    const url = await uploadToR2(req.file.buffer, key, req.file.mimetype);

    const photo = db.addPhoto({
      id: uuid(),
      title,
      category,
      url,
      r2Key: key,
      likes: 0,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json(photo);
  } catch (err) {
    console.error("Erro upload foto:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /admin/videos/:id
app.delete("/admin/videos/:id", requireAdmin, async (req, res) => {
  try {
    const video = db.getVideo(req.params.id);
    if (!video) return res.status(404).json({ error: "Não encontrado" });
    await deleteFromR2(video.r2Key);
    db.deleteVideo(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /admin/photos/:id
app.delete("/admin/photos/:id", requireAdmin, async (req, res) => {
  try {
    const photo = db.getPhoto(req.params.id);
    if (!photo) return res.status(404).json({ error: "Não encontrado" });
    await deleteFromR2(photo.r2Key);
    db.deletePhoto(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/library — lista tudo
app.get("/admin/library", requireAdmin, (req, res) => {
  res.json({
    videos: db.getVideos(),
    photos: db.getPhotos(),
  });
});

// POST /admin/login — validar senha
app.post("/admin/login", (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) res.json({ ok: true });
  else res.status(401).json({ error: "Senha incorreta" });
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => res.json({ status: "ok", ts: new Date().toISOString() }));

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🌙 Lumina backend rodando em http://localhost:${PORT}`);
  console.log(`   R2 bucket: ${process.env.R2_BUCKET_NAME}`);
  console.log(`   Public URL: ${process.env.R2_PUBLIC_URL}\n`);
});
