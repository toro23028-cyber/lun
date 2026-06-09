import { readFileSync, writeFileSync, existsSync } from "fs";

const DB_FILE = "./data.json";
const DEFAULT_DB = { videos: [], albums: [] };

function load() {
  if (!existsSync(DB_FILE)) { writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2)); return structuredClone(DEFAULT_DB); }
  return JSON.parse(readFileSync(DB_FILE, "utf-8"));
}
function save(data) { writeFileSync(DB_FILE, JSON.stringify(data, null, 2)); }

export const db = {
  getVideos() { return load().videos; },
  getVideo(id) { return load().videos.find(v => v.id === id); },
  addVideo(v) { const d=load(); d.videos.unshift(v); save(d); return v; },
  deleteVideo(id) { const d=load(); d.videos=d.videos.filter(v=>v.id!==id); save(d); },
  updateVideoLikes(id, delta) { const d=load(); const v=d.videos.find(v=>v.id===id); if(v){v.likes=(v.likes||0)+delta;save(d);} return v; },

  getAlbums() { return load().albums || []; },
  getAlbum(id) { return (load().albums||[]).find(a => a.id === id); },
  addAlbum(a) { const d=load(); if(!d.albums) d.albums=[]; d.albums.unshift(a); save(d); return a; },
  deleteAlbum(id) { const d=load(); d.albums=(d.albums||[]).filter(a=>a.id!==id); save(d); },
  updateAlbumLikes(id, delta) { const d=load(); const a=(d.albums||[]).find(a=>a.id===id); if(a){a.likes=(a.likes||0)+delta;save(d);} return a; },
};
