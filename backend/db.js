import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// helpers
const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

export const db = {
  // ── VIDEOS ──────────────────────────────────────────────────────────────
  async getVideos() {
    const { data } = await supabase.from("videos").select("*").order("created_at", { ascending: false });
    return shuffle(data || []).map(v => ({ ...v, r2Key: v.r2_key, createdAt: v.created_at }));
  },
  async getVideo(id) {
    const { data } = await supabase.from("videos").select("*").eq("id", id).single();
    return data ? { ...data, r2Key: data.r2_key } : null;
  },
  async addVideo(v) {
    const { data } = await supabase.from("videos").insert({
      id: v.id, title: v.title, tags: v.tags, url: v.url,
      r2_key: v.r2Key, likes: 0, views: 0,
    }).select().single();
    return data;
  },
  async deleteVideo(id) {
    await supabase.from("videos").delete().eq("id", id);
  },
  async updateVideoLikes(id, delta) {
    const { data: current } = await supabase.from("videos").select("likes").eq("id", id).single();
    if (!current) return null;
    const { data } = await supabase.from("videos").update({ likes: (current.likes || 0) + delta }).eq("id", id).select().single();
    return data;
  },

  // ── ALBUMS ──────────────────────────────────────────────────────────────
  async getAlbums() {
    const { data } = await supabase.from("albums").select("*").order("created_at", { ascending: false });
    return shuffle(data || []).map(a => ({ ...a, coverUrl: a.cover_url, photoCount: a.photo_count, createdAt: a.created_at }));
  },
  async getAlbum(id) {
    const { data } = await supabase.from("albums").select("*").eq("id", id).single();
    return data ? { ...data, coverUrl: data.cover_url, photoCount: data.photo_count } : null;
  },
  async addAlbum(a) {
    const { data } = await supabase.from("albums").insert({
      id: a.id, title: a.title, tags: a.tags, photos: a.photos,
      cover_url: a.coverUrl, photo_count: a.photoCount, likes: 0,
    }).select().single();
    return data;
  },
  async deleteAlbum(id) {
    await supabase.from("albums").delete().eq("id", id);
  },
  async updateAlbumLikes(id, delta) {
    const { data: current } = await supabase.from("albums").select("likes").eq("id", id).single();
    if (!current) return null;
    const { data } = await supabase.from("albums").update({ likes: (current.likes || 0) + delta }).eq("id", id).select().single();
    return data;
  },
};
