/**
 * db.js — banco de dados em JSON para fase de testes.
 * Para produção, substitua por PostgreSQL (Supabase) ou similar.
 * Os dados ficam em ./data.json na raiz do projeto.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";

const DB_FILE = "./data.json";

const DEFAULT_DB = {
  videos: [],
  photos: [],
};

function load() {
  if (!existsSync(DB_FILE)) {
    writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2));
    return structuredClone(DEFAULT_DB);
  }
  return JSON.parse(readFileSync(DB_FILE, "utf-8"));
}

function save(data) {
  writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ── API ──────────────────────────────────────────────────────────────────────

export const db = {
  // VIDEOS
  getVideos() { return load().videos; },
  getVideo(id) { return load().videos.find(v => v.id === id); },
  addVideo(video) {
    const data = load();
    data.videos.unshift(video);
    save(data);
    return video;
  },
  deleteVideo(id) {
    const data = load();
    data.videos = data.videos.filter(v => v.id !== id);
    save(data);
  },
  updateVideoLikes(id, delta) {
    const data = load();
    const v = data.videos.find(v => v.id === id);
    if (v) { v.likes = (v.likes || 0) + delta; save(data); }
    return v;
  },

  // PHOTOS
  getPhotos() { return load().photos; },
  getPhoto(id) { return load().photos.find(p => p.id === id); },
  addPhoto(photo) {
    const data = load();
    data.photos.unshift(photo);
    save(data);
    return photo;
  },
  deletePhoto(id) {
    const data = load();
    data.photos = data.photos.filter(p => p.id !== id);
    save(data);
  },
  updatePhotoLikes(id, delta) {
    const data = load();
    const p = data.photos.find(p => p.id === id);
    if (p) { p.likes = (p.likes || 0) + delta; save(data); }
    return p;
  },
};
