import { useState, useRef, useEffect, useCallback } from "react";

// ── Config ───────────────────────────────────────────────────────────────────
// Em produção, troque pela URL do Railway: https://lumina-backend.up.railway.app
const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

const MOCK_CATEGORIES = [
  { id: "fantasy",  label: "Fantasy",  icon: "✦", color: "#c084fc" },
  { id: "scifi",    label: "Sci-Fi",   icon: "◈", color: "#67e8f9" },
  { id: "cyberpunk",label: "Cyberpunk",icon: "⬡", color: "#f472b6" },
  { id: "nature",   label: "Nature",   icon: "◉", color: "#4ade80" },
  { id: "surreal",  label: "Surreal",  icon: "◎", color: "#fb923c" },
  { id: "dark",     label: "Dark",     icon: "◆", color: "#a78bfa" },
];

const PHOTO_GRADIENTS = [
  { bg: "radial-gradient(ellipse at 20% 30%, #3d1a78 0%, #0d0020 60%)", accent: "#c084fc" },
  { bg: "radial-gradient(ellipse at 80% 20%, #1a3a5f 0%, #000a18 60%)", accent: "#67e8f9" },
  { bg: "radial-gradient(ellipse at 50% 70%, #0a3020 0%, #020c06 60%)", accent: "#4ade80" },
  { bg: "radial-gradient(ellipse at 30% 60%, #4a001a 0%, #1a000a 60%)", accent: "#f472b6" },
  { bg: "radial-gradient(ellipse at 70% 40%, #3a1a00 0%, #0a0500 60%)", accent: "#fb923c" },
  { bg: "radial-gradient(ellipse at 40% 50%, #1a003a 0%, #080010 60%)", accent: "#a78bfa" },
  { bg: "radial-gradient(ellipse at 60% 30%, #001a3a 0%, #000810 60%)", accent: "#38bdf8" },
  { bg: "radial-gradient(ellipse at 25% 75%, #1a1a00 0%, #080800 60%)", accent: "#facc15" },
  { bg: "radial-gradient(ellipse at 75% 65%, #001a1a 0%, #000a0a 60%)", accent: "#2dd4bf" },
  { bg: "radial-gradient(ellipse at 50% 20%, #2a0a2a 0%, #0d000d 60%)", accent: "#e879f9" },
];

const fmtNum = (n) => {
  const num = parseInt(n) || 0;
  return num >= 1000 ? (num / 1000).toFixed(1) + "K" : num;
};

// hashString para escolher gradiente/thumbnail por ID determinístico
const hashIdx = (str, len) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % len;
};

const VIDEO_THUMBS = [
  "radial-gradient(ellipse at 30% 40%, #4a0e7a 0%, #1a0533 50%, #0d0020 100%)",
  "radial-gradient(ellipse at 70% 30%, #1e3a5f 0%, #0a1628 50%, #000a14 100%)",
  "radial-gradient(ellipse at 50% 60%, #0a4020 0%, #052010 50%, #020c06 100%)",
  "radial-gradient(ellipse at 40% 50%, #1a3a6e 0%, #0f1a2e 50%, #060d1a 100%)",
  "radial-gradient(ellipse at 60% 40%, #4a2000 0%, #1a0a00 50%, #0a0500 100%)",
  "radial-gradient(ellipse at 35% 55%, #2d0060 0%, #0d0020 50%, #050010 100%)",
  "radial-gradient(ellipse at 50% 35%, #003a6c 0%, #001a2c 50%, #000c16 100%)",
  "radial-gradient(ellipse at 45% 45%, #4a004a 0%, #1a001a 50%, #0a000a 100%)",
];

// ── Componentes base ─────────────────────────────────────────────────────────

function Spinner() {
  return <div style={{ width: 28, height: 28, border: "3px solid rgba(255,255,255,0.1)", borderTop: "3px solid #c084fc", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />;
}

function VideoCard({ video, onLike, liked }) {
  const cat = MOCK_CATEGORIES.find(c => c.id === video.category);
  const bg = VIDEO_THUMBS[hashIdx(video.id, VIDEO_THUMBS.length)];
  return (
    <div style={{ width: "100%", height: "100%", background: bg, position: "relative", userSelect: "none" }}>
      {video.url && (
        <video src={video.url} autoPlay loop muted playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      )}
      <div style={{ position: "absolute", fontSize: 72, opacity: 0.1, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}>{cat?.icon}</div>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.85) 100%)" }} />
      <div style={{ position: "absolute", top: 16, left: 16, display: "flex", gap: 6 }}>
        <span style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${cat?.color}40`, color: cat?.color, fontSize: 11, padding: "3px 10px", borderRadius: 20, fontFamily: "monospace", letterSpacing: 1 }}>{cat?.label?.toUpperCase()}</span>
        <span style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)", fontSize: 10, padding: "3px 8px", borderRadius: 20, fontFamily: "monospace" }}>▶ VIDEO</span>
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 16px 16px" }}>
        <p style={{ color: "#fff", fontFamily: "'DM Serif Display', serif", fontSize: 22, margin: "0 0 12px", textShadow: "0 2px 8px rgba(0,0,0,0.8)", lineHeight: 1.2 }}>{video.title}</p>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>👁 {fmtNum(video.views)}</span>
          <button onClick={onLike} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: liked ? "#f472b6" : "rgba(255,255,255,0.7)", fontSize: 13, padding: 0, transition: "color 0.2s" }}>
            <span style={{ fontSize: 18 }}>{liked ? "♥" : "♡"}</span> {fmtNum((video.likes || 0) + (liked ? 1 : 0))}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Explore ──────────────────────────────────────────────────────────────────

function ExploreView() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [liked, setLiked] = useState({});
  const containerRef = useRef(null);
  const touchStartY = useRef(null);

  useEffect(() => {
    fetch(`${API}/videos`)
      .then(r => r.json())
      .then(data => { setVideos(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const goNext = useCallback(() => setCurrent(c => Math.min(c + 1, videos.length - 1)), [videos.length]);
  const goPrev = useCallback(() => setCurrent(c => Math.max(c - 1, 0)), []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => { e.preventDefault(); if (e.deltaY > 30) goNext(); else if (e.deltaY < -30) goPrev(); };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [goNext, goPrev]);

  const handleLike = async (video) => {
    const isLiked = !!liked[video.id];
    setLiked(l => ({ ...l, [video.id]: !isLiked }));
    await fetch(`${API}/videos/${video.id}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: isLiked ? "remove" : "add" }),
    }).catch(() => {});
  };

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", background: "#000" }}><Spinner /></div>;
  if (!videos.length) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", background: "#000", color: "rgba(255,255,255,0.4)", fontFamily: "'DM Serif Display', serif", fontSize: 20, flexDirection: "column", gap: 8 }}><span style={{ fontSize: 40 }}>◈</span>Nenhum vídeo ainda</div>;

  return (
    <div ref={containerRef} onTouchStart={(e) => { touchStartY.current = e.touches[0].clientY; }} onTouchEnd={(e) => { if (!touchStartY.current) return; const d = touchStartY.current - e.changedTouches[0].clientY; if (d > 40) goNext(); else if (d < -40) goPrev(); touchStartY.current = null; }} style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#000" }}>
      {videos.map((video, i) => (
        <div key={video.id} style={{ position: "absolute", inset: 0, transform: `translateY(${(i - current) * 100}%)`, transition: "transform 0.45s cubic-bezier(0.4,0,0.2,1)" }}>
          <VideoCard video={video} onLike={() => handleLike(video)} liked={!!liked[video.id]} />
        </div>
      ))}
      <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: 6 }}>
        {videos.map((_, i) => (
          <div key={i} onClick={() => setCurrent(i)} style={{ width: 3, height: i === current ? 24 : 8, borderRadius: 2, background: i === current ? "#fff" : "rgba(255,255,255,0.3)", cursor: "pointer", transition: "all 0.3s" }} />
        ))}
      </div>
    </div>
  );
}

// ── Gallery ──────────────────────────────────────────────────────────────────

function PhotoCard({ photo, liked, onLike, onOpen }) {
  const g = PHOTO_GRADIENTS[hashIdx(photo.id, PHOTO_GRADIENTS.length)];
  const cat = MOCK_CATEGORIES.find(c => c.id === photo.category);
  const aspectRatio = photo.aspectRatio || 1;
  return (
    <div onClick={onOpen} style={{ background: g.bg, borderRadius: 10, overflow: "hidden", cursor: "pointer", position: "relative", breakInside: "avoid", marginBottom: 10 }}>
      <div style={{ paddingTop: `${(1 / aspectRatio) * 100}%`, position: "relative" }}>
        {photo.url && <img src={photo.url} alt={photo.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {!photo.url && <span style={{ fontSize: 40, opacity: 0.12 }}>{cat?.icon}</span>}
        </div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.75) 100%)" }} />
        <div style={{ position: "absolute", top: 8, left: 8 }}>
          <span style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${g.accent}40`, color: g.accent, fontSize: 9, padding: "2px 7px", borderRadius: 20, fontFamily: "monospace", letterSpacing: 1 }}>✦ PHOTO</span>
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 10px 8px" }}>
          <p style={{ color: "#fff", fontFamily: "'DM Serif Display', serif", fontSize: 13, margin: "0 0 4px", lineHeight: 1.2, fontWeight: 400 }}>{photo.title}</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>{cat?.label}</span>
            <button onClick={(e) => { e.stopPropagation(); onLike(); }} style={{ background: "none", border: "none", cursor: "pointer", color: liked ? "#f472b6" : "rgba(255,255,255,0.5)", fontSize: 11, padding: 0 }}>
              {liked ? "♥" : "♡"} {fmtNum((photo.likes || 0) + (liked ? 1 : 0))}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhotoLightbox({ photo, onClose, liked, onLike }) {
  const g = PHOTO_GRADIENTS[hashIdx(photo.id, PHOTO_GRADIENTS.length)];
  const cat = MOCK_CATEGORIES.find(c => c.id === photo.category);
  useEffect(() => { const h = (e) => e.key === "Escape" && onClose(); window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [onClose]);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: g.bg, borderRadius: 16, overflow: "hidden", maxWidth: 520, width: "90%", position: "relative" }}>
        <div style={{ paddingTop: `${(1 / (photo.aspectRatio || 1)) * 100}%`, position: "relative", minHeight: 200 }}>
          {photo.url && <img src={photo.url} alt={photo.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.9) 100%)" }} />
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "50%", width: 32, height: 32, color: "#fff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px" }}>
            <span style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${g.accent}50`, color: g.accent, fontSize: 10, padding: "3px 10px", borderRadius: 20, fontFamily: "monospace", letterSpacing: 1 }}>{cat?.label?.toUpperCase()}</span>
            <p style={{ color: "#fff", fontFamily: "'DM Serif Display', serif", fontSize: 26, margin: "10px 0 12px", lineHeight: 1.2, fontWeight: 400 }}>{photo.title}</p>
            <button onClick={onLike} style={{ background: "none", border: "none", cursor: "pointer", color: liked ? "#f472b6" : "rgba(255,255,255,0.7)", fontSize: 15, padding: 0, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 22 }}>{liked ? "♥" : "♡"}</span> {fmtNum((photo.likes || 0) + (liked ? 1 : 0))}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhotosView() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState({});
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    fetch(`${API}/photos`)
      .then(r => r.json())
      .then(data => { setPhotos(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleLike = async (photo) => {
    const isLiked = !!liked[photo.id];
    setLiked(l => ({ ...l, [photo.id]: !isLiked }));
    await fetch(`${API}/photos/${photo.id}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: isLiked ? "remove" : "add" }),
    }).catch(() => {});
  };

  const col1 = photos.filter((_, i) => i % 2 === 0);
  const col2 = photos.filter((_, i) => i % 2 === 1);

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "#0a0a0f", padding: "24px 16px" }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, letterSpacing: 3, fontFamily: "monospace", marginBottom: 8 }}>AI GENERATED</p>
        <h2 style={{ color: "#fff", fontFamily: "'DM Serif Display', serif", fontSize: 32, margin: 0, fontWeight: 400 }}>Gallery</h2>
      </div>
      {loading ? <div style={{ display: "flex", justifyContent: "center", marginTop: 60 }}><Spinner /></div> :
       !photos.length ? <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", marginTop: 60, fontFamily: "'DM Serif Display', serif", fontSize: 18 }}>Nenhuma foto ainda</div> :
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>{col1.map(p => <PhotoCard key={p.id} photo={p} liked={!!liked[p.id]} onLike={() => handleLike(p)} onOpen={() => setLightbox(p)} />)}</div>
        <div>{col2.map(p => <PhotoCard key={p.id} photo={p} liked={!!liked[p.id]} onLike={() => handleLike(p)} onOpen={() => setLightbox(p)} />)}</div>
      </div>}
      {lightbox && <PhotoLightbox photo={lightbox} onClose={() => setLightbox(null)} liked={!!liked[lightbox.id]} onLike={() => handleLike(lightbox)} />}
    </div>
  );
}

// ── Niches ───────────────────────────────────────────────────────────────────

function NichesView({ onSelectNiche, activeNiche }) {
  const [mediaFilter, setMediaFilter] = useState("all");
  const [items, setItems] = useState({ videos: [], photos: [] });

  useEffect(() => {
    if (!activeNiche) return;
    Promise.all([
      fetch(`${API}/videos?category=${activeNiche}`).then(r => r.json()),
      fetch(`${API}/photos?category=${activeNiche}`).then(r => r.json()),
    ]).then(([videos, photos]) => setItems({ videos, photos })).catch(() => {});
  }, [activeNiche]);

  return (
    <div style={{ padding: "32px 24px", height: "100%", overflowY: "auto", background: "#0a0a0f" }}>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, letterSpacing: 3, fontFamily: "monospace", marginBottom: 8 }}>BROWSE BY CATEGORY</p>
      <h2 style={{ color: "#fff", fontFamily: "'DM Serif Display', serif", fontSize: 32, margin: "0 0 32px", fontWeight: 400 }}>Niches</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 32 }}>
        {MOCK_CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => onSelectNiche(activeNiche === cat.id ? null : cat.id)} style={{ background: activeNiche === cat.id ? `${cat.color}20` : "rgba(255,255,255,0.04)", border: `1px solid ${activeNiche === cat.id ? cat.color + "80" : "rgba(255,255,255,0.08)"}`, borderRadius: 12, padding: "18px 14px", cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>{cat.icon}</div>
            <p style={{ color: activeNiche === cat.id ? cat.color : "#fff", fontFamily: "'DM Serif Display', serif", fontSize: 17, margin: "0 0 4px", fontWeight: 400 }}>{cat.label}</p>
          </button>
        ))}
      </div>
      {activeNiche && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {[["all","All"],["video","Videos"],["photo","Photos"]].map(([v,l]) => (
                <button key={v} onClick={() => setMediaFilter(v)} style={{ background: mediaFilter === v ? "rgba(192,132,252,0.15)" : "transparent", border: `1px solid ${mediaFilter === v ? "rgba(192,132,252,0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius: 20, padding: "4px 14px", color: mediaFilter === v ? "#c084fc" : "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 12 }}>{l}</button>
              ))}
            </div>
            <button onClick={() => onSelectNiche(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 13 }}>clear ×</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {mediaFilter !== "photo" && items.videos.map(video => {
              const cat = MOCK_CATEGORIES.find(c => c.id === video.category);
              return (
                <div key={video.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 6, background: `radial-gradient(circle, ${cat?.color}40 0%, transparent 70%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>▶</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: "#fff", fontSize: 14, margin: "0 0 2px", fontFamily: "'DM Serif Display', serif", fontWeight: 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{video.title}</p>
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: 0 }}>Video · ♡ {fmtNum(video.likes)}</p>
                  </div>
                </div>
              );
            })}
            {mediaFilter !== "video" && items.photos.map(photo => {
              const cat = MOCK_CATEGORIES.find(c => c.id === photo.category);
              const g = PHOTO_GRADIENTS[hashIdx(photo.id, PHOTO_GRADIENTS.length)];
              return (
                <div key={photo.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 6, background: g.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>✦</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: "#fff", fontSize: 14, margin: "0 0 2px", fontFamily: "'DM Serif Display', serif", fontWeight: 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{photo.title}</p>
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: 0 }}>Photo · {cat?.label} · ♡ {fmtNum(photo.likes)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Admin Panel ──────────────────────────────────────────────────────────────

function AdminPanel({ adminPassword }) {
  const [tab, setTab] = useState("videos");
  const [libFilter, setLibFilter] = useState("all");
  const [library, setLibrary] = useState({ videos: [], photos: [] });
  const [videoForm, setVideoForm] = useState({ title: "", category: "fantasy", file: null });
  const [photoForm, setPhotoForm] = useState({ title: "", category: "fantasy", file: null });
  const [draggingV, setDraggingV] = useState(false);
  const [draggingP, setDraggingP] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const fileRefV = useRef(null);
  const fileRefP = useRef(null);

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const loadLibrary = useCallback(() => {
    fetch(`${API}/admin/library`, { headers: { "x-admin-password": adminPassword } })
      .then(r => r.json()).then(setLibrary).catch(() => {});
  }, [adminPassword]);

  useEffect(() => { if (tab === "library") loadLibrary(); }, [tab, loadLibrary]);

  const uploadVideo = async () => {
    if (!videoForm.title.trim() || !videoForm.file) return showToast("Preencha título e selecione um vídeo", false);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", videoForm.file);
      fd.append("title", videoForm.title);
      fd.append("category", videoForm.category);
      const res = await fetch(`${API}/admin/videos`, { method: "POST", headers: { "x-admin-password": adminPassword }, body: fd });
      if (!res.ok) throw new Error((await res.json()).error);
      showToast("Vídeo publicado!");
      setVideoForm({ title: "", category: "fantasy", file: null });
    } catch (e) { showToast(e.message, false); }
    setUploading(false);
  };

  const uploadPhoto = async () => {
    if (!photoForm.title.trim() || !photoForm.file) return showToast("Preencha título e selecione uma imagem", false);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", photoForm.file);
      fd.append("title", photoForm.title);
      fd.append("category", photoForm.category);
      const res = await fetch(`${API}/admin/photos`, { method: "POST", headers: { "x-admin-password": adminPassword }, body: fd });
      if (!res.ok) throw new Error((await res.json()).error);
      showToast("Foto publicada!");
      setPhotoForm({ title: "", category: "fantasy", file: null });
    } catch (e) { showToast(e.message, false); }
    setUploading(false);
  };

  const deleteItem = async (type, id) => {
    await fetch(`${API}/admin/${type}s/${id}`, { method: "DELETE", headers: { "x-admin-password": adminPassword } });
    loadLibrary();
    showToast("Deletado");
  };

  const inputStyle = { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box" };
  const selectStyle = { ...inputStyle, background: "#1a1a2e" };
  const labelStyle = { display: "block", color: "rgba(255,255,255,0.45)", fontSize: 11, letterSpacing: 1, marginBottom: 6, fontFamily: "monospace" };

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "#080810", position: "relative" }}>
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, background: toast.ok ? "#1a3a1a" : "#3a1a1a", border: `1px solid ${toast.ok ? "#4ade80" : "#f87171"}40`, borderRadius: 10, padding: "12px 20px", color: toast.ok ? "#4ade80" : "#f87171", fontSize: 14, zIndex: 300 }}>{toast.msg}</div>
      )}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "20px 24px 0" }}>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, letterSpacing: 3, fontFamily: "monospace", marginBottom: 6 }}>ADMIN PANEL</p>
        <h2 style={{ color: "#fff", fontFamily: "'DM Serif Display', serif", fontSize: 26, margin: "0 0 20px", fontWeight: 400 }}>Content Manager</h2>
        <div style={{ display: "flex" }}>
          {[["videos","▶ Videos"],["photos","✦ Photos"],["library","Library"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{ background: "none", border: "none", borderBottom: `2px solid ${tab === key ? "#c084fc" : "transparent"}`, color: tab === key ? "#c084fc" : "rgba(255,255,255,0.4)", cursor: "pointer", padding: "8px 20px 12px", fontSize: 14, transition: "all 0.2s" }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: 24 }}>

        {tab === "videos" && (
          <div>
            <div onDragOver={(e) => { e.preventDefault(); setDraggingV(true); }} onDragLeave={() => setDraggingV(false)} onDrop={(e) => { e.preventDefault(); setDraggingV(false); const f = e.dataTransfer.files[0]; if (f) setVideoForm(x => ({ ...x, file: f })); }} onClick={() => fileRefV.current?.click()} style={{ border: `2px dashed ${draggingV ? "#c084fc" : "rgba(255,255,255,0.12)"}`, borderRadius: 14, padding: "36px 24px", textAlign: "center", cursor: "pointer", transition: "all 0.2s", background: draggingV ? "rgba(192,132,252,0.05)" : "transparent", marginBottom: 24 }}>
              <input ref={fileRefV} type="file" accept="video/*" style={{ display: "none" }} onChange={(e) => e.target.files[0] && setVideoForm(x => ({ ...x, file: e.target.files[0] }))} />
              <div style={{ fontSize: 34, marginBottom: 10 }}>▶</div>
              <p style={{ color: "rgba(255,255,255,0.6)", margin: "0 0 4px", fontSize: 15 }}>{videoForm.file ? `✓ ${videoForm.file.name}` : "Drag & drop do vídeo aqui"}</p>
              <p style={{ color: "rgba(255,255,255,0.25)", margin: 0, fontSize: 12 }}>MP4 · MOV · WEBM · max 500MB</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={labelStyle}>TÍTULO</label><input value={videoForm.title} onChange={(e) => setVideoForm(x => ({ ...x, title: e.target.value }))} placeholder="Nome do vídeo..." style={inputStyle} /></div>
              <div><label style={labelStyle}>CATEGORIA</label>
                <select value={videoForm.category} onChange={(e) => setVideoForm(x => ({ ...x, category: e.target.value }))} style={selectStyle}>
                  {MOCK_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <button onClick={uploadVideo} disabled={uploading} style={{ background: uploading ? "rgba(124,58,237,0.4)" : "linear-gradient(135deg, #7c3aed, #c084fc)", border: "none", borderRadius: 8, padding: "12px 24px", color: "#fff", fontSize: 15, cursor: uploading ? "not-allowed" : "pointer", fontFamily: "'DM Serif Display', serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                {uploading ? <><Spinner /> Enviando para R2...</> : "Publicar Vídeo"}
              </button>
            </div>
          </div>
        )}

        {tab === "photos" && (
          <div>
            <div onDragOver={(e) => { e.preventDefault(); setDraggingP(true); }} onDragLeave={() => setDraggingP(false)} onDrop={(e) => { e.preventDefault(); setDraggingP(false); const f = e.dataTransfer.files[0]; if (f) setPhotoForm(x => ({ ...x, file: f })); }} onClick={() => fileRefP.current?.click()} style={{ border: `2px dashed ${draggingP ? "#67e8f9" : "rgba(255,255,255,0.12)"}`, borderRadius: 14, padding: "36px 24px", textAlign: "center", cursor: "pointer", transition: "all 0.2s", background: draggingP ? "rgba(103,232,249,0.05)" : "transparent", marginBottom: 24 }}>
              <input ref={fileRefP} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files[0] && setPhotoForm(x => ({ ...x, file: e.target.files[0] }))} />
              <div style={{ fontSize: 34, marginBottom: 10 }}>✦</div>
              <p style={{ color: "rgba(255,255,255,0.6)", margin: "0 0 4px", fontSize: 15 }}>{photoForm.file ? `✓ ${photoForm.file.name}` : "Drag & drop da imagem aqui"}</p>
              <p style={{ color: "rgba(255,255,255,0.25)", margin: 0, fontSize: 12 }}>JPG · PNG · WEBP · max 50MB</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={labelStyle}>TÍTULO</label><input value={photoForm.title} onChange={(e) => setPhotoForm(x => ({ ...x, title: e.target.value }))} placeholder="Nome da foto..." style={inputStyle} /></div>
              <div><label style={labelStyle}>CATEGORIA</label>
                <select value={photoForm.category} onChange={(e) => setPhotoForm(x => ({ ...x, category: e.target.value }))} style={selectStyle}>
                  {MOCK_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <button onClick={uploadPhoto} disabled={uploading} style={{ background: uploading ? "rgba(8,145,178,0.4)" : "linear-gradient(135deg, #0891b2, #67e8f9)", border: "none", borderRadius: 8, padding: "12px 24px", color: "#fff", fontSize: 15, cursor: uploading ? "not-allowed" : "pointer", fontFamily: "'DM Serif Display', serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                {uploading ? <><Spinner /> Enviando para R2...</> : "Publicar Foto"}
              </button>
            </div>
          </div>
        )}

        {tab === "library" && (
          <div>
            <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
              {[["all","All"],["video","Videos"],["photo","Photos"]].map(([v,l]) => (
                <button key={v} onClick={() => setLibFilter(v)} style={{ background: libFilter === v ? "rgba(192,132,252,0.15)" : "transparent", border: `1px solid ${libFilter === v ? "rgba(192,132,252,0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius: 20, padding: "5px 16px", color: libFilter === v ? "#c084fc" : "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 13 }}>{l}</button>
              ))}
              <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.3)", fontSize: 13, display: "flex", alignItems: "center" }}>
                {libFilter === "all" ? library.videos.length + library.photos.length : libFilter === "video" ? library.videos.length : library.photos.length} items
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {libFilter !== "photo" && library.videos.map(video => {
                const cat = MOCK_CATEGORIES.find(c => c.id === video.category);
                return (
                  <div key={video.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 6, background: `radial-gradient(circle, ${cat?.color}40 0%, transparent 70%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>▶</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: "#fff", fontSize: 13, margin: "0 0 2px", fontFamily: "'DM Serif Display', serif", fontWeight: 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{video.title}</p>
                      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: 0 }}>{cat?.label} · ♡ {fmtNum(video.likes)}</p>
                    </div>
                    <button onClick={() => deleteItem("video", video.id)} style={{ background: "none", border: "1px solid rgba(255,80,80,0.2)", borderRadius: 6, color: "rgba(255,100,100,0.6)", cursor: "pointer", padding: "3px 10px", fontSize: 12, flexShrink: 0 }}>Delete</button>
                  </div>
                );
              })}
              {libFilter !== "video" && library.photos.map(photo => {
                const cat = MOCK_CATEGORIES.find(c => c.id === photo.category);
                const g = PHOTO_GRADIENTS[hashIdx(photo.id, PHOTO_GRADIENTS.length)];
                return (
                  <div key={photo.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 6, background: g.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>✦</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: "#fff", fontSize: 13, margin: "0 0 2px", fontFamily: "'DM Serif Display', serif", fontWeight: 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{photo.title}</p>
                      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: 0 }}>{cat?.label} · Photo · ♡ {fmtNum(photo.likes)}</p>
                    </div>
                    <button onClick={() => deleteItem("photo", photo.id)} style={{ background: "none", border: "1px solid rgba(255,80,80,0.2)", borderRadius: 6, color: "rgba(255,100,100,0.6)", cursor: "pointer", padding: "3px 10px", fontSize: 12, flexShrink: 0 }}>Delete</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState("explore");
  const [activeNiche, setActiveNiche] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [adminOpen, setAdminOpen] = useState(false);
  const [passError, setPassError] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const handleAdminLogin = async () => {
    setLoginLoading(true);
    try {
      const res = await fetch(`${API}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPass }),
      });
      if (res.ok) {
        setIsAdmin(true);
        setAdminPassword(adminPass);
        setAdminOpen(false);
        setView("admin");
        setPassError(false);
        setAdminPass("");
      } else {
        setPassError(true);
      }
    } catch {
      setPassError(true);
    }
    setLoginLoading(false);
  };

  const navItems = [
    { id: "explore", icon: "◈", label: "Explore" },
    { id: "photos",  icon: "✦", label: "Gallery" },
    { id: "niches",  icon: "◉", label: "Niches"  },
  ];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      <style>{`* { box-sizing: border-box; } body { margin: 0; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ display: "flex", height: "100vh", background: "#080810", fontFamily: "'DM Sans', sans-serif", overflow: "hidden" }}>

        <div style={{ width: 200, background: "rgba(0,0,0,0.6)", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", padding: "24px 0", flexShrink: 0 }}>
          <div style={{ padding: "0 20px 28px" }}>
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 9, letterSpacing: 4, fontFamily: "monospace", margin: "0 0 4px" }}>AI STUDIO</p>
            <p style={{ color: "#fff", fontFamily: "'DM Serif Display', serif", fontSize: 22, margin: 0, fontWeight: 400 }}>Lumina</p>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, padding: "0 10px" }}>
            {navItems.map(item => (
              <button key={item.id} onClick={() => setView(item.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, border: "none", background: view === item.id ? "rgba(192,132,252,0.12)" : "transparent", color: view === item.id ? "#c084fc" : "rgba(255,255,255,0.45)", cursor: "pointer", fontSize: 14, textAlign: "left", transition: "all 0.2s" }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
              </button>
            ))}
          </div>
          <div style={{ padding: "0 10px" }}>
            {isAdmin
              ? <button onClick={() => setView("admin")} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, border: "none", background: view === "admin" ? "rgba(192,132,252,0.12)" : "transparent", color: view === "admin" ? "#c084fc" : "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 14, width: "100%" }}>⚙ Admin</button>
              : <button onClick={() => setAdminOpen(true)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, border: "none", background: "transparent", color: "rgba(255,255,255,0.2)", cursor: "pointer", fontSize: 13, width: "100%" }}>🔒 Admin</button>
            }
          </div>
        </div>

        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {view === "explore" && <ExploreView />}
          {view === "photos"  && <PhotosView />}
          {view === "niches"  && <NichesView onSelectNiche={setActiveNiche} activeNiche={activeNiche} />}
          {view === "admin" && isAdmin && <AdminPanel adminPassword={adminPassword} />}
        </div>

        {adminOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div style={{ background: "#12121e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 32, width: 320 }}>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, letterSpacing: 3, fontFamily: "monospace", marginBottom: 8 }}>RESTRICTED</p>
              <h3 style={{ color: "#fff", fontFamily: "'DM Serif Display', serif", fontSize: 22, margin: "0 0 24px", fontWeight: 400 }}>Admin Access</h3>
              <input type="password" value={adminPass} onChange={(e) => { setAdminPass(e.target.value); setPassError(false); }} onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()} placeholder="Password" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${passError ? "rgba(255,80,80,0.5)" : "rgba(255,255,255,0.1)"}`, borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", marginBottom: passError ? 6 : 16 }} />
              {passError && <p style={{ color: "rgba(255,100,100,0.8)", fontSize: 12, margin: "0 0 12px" }}>Senha incorreta</p>}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setAdminOpen(false); setAdminPass(""); setPassError(false); }} style={{ flex: 1, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 14 }}>Cancel</button>
                <button onClick={handleAdminLogin} disabled={loginLoading} style={{ flex: 1, background: "linear-gradient(135deg, #7c3aed, #c084fc)", border: "none", borderRadius: 8, padding: "10px", color: "#fff", cursor: "pointer", fontSize: 14, fontFamily: "'DM Serif Display', serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {loginLoading ? <Spinner /> : "Enter"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
