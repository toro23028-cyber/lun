import { useState, useRef, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

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

const fmtNum = (n) => { const x = parseInt(n)||0; return x>=1000?(x/1000).toFixed(1)+"K":x; };
const hashIdx = (str, len) => { let h=0; for(let i=0;i<str.length;i++) h=(h*31+str.charCodeAt(i))>>>0; return h%len; };

// parse hashtags from title
const parseTags = (title) => {
  const tags = [];
  const clean = title.replace(/#(\w+)/g, (_, t) => { tags.push(t.toLowerCase()); return ""; }).trim();
  return { clean, tags };
};

function Spinner({ size = 28, color = "#c084fc" }) {
  return <div style={{ width: size, height: size, border: `3px solid rgba(255,255,255,0.1)`, borderTop: `3px solid ${color}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />;
}

function HashtagBadge({ tag, onClick }) {
  return (
    <span onClick={onClick} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", fontSize: 11, padding: "2px 8px", borderRadius: 20, cursor: onClick ? "pointer" : "default", fontFamily: "monospace", letterSpacing: 0.5, transition: "all 0.15s" }}>
      #{tag}
    </span>
  );
}

// ── EXPLORE (vertical 9:16 centered) ────────────────────────────────────────

function VideoCard({ video, onLike, liked }) {
  const bg = VIDEO_THUMBS[hashIdx(video.id, VIDEO_THUMBS.length)];
  const { clean, tags } = parseTags(video.title || "");
  return (
    <div style={{ width: "100%", height: "100%", background: bg, position: "relative", userSelect: "none" }}>
      {video.url && (
        <video src={video.url} autoPlay loop muted playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      )}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 45%, rgba(0,0,0,0.92) 100%)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 16px 20px" }}>
        {clean && <p style={{ color: "#fff", fontFamily: "'DM Serif Display', serif", fontSize: 18, margin: "0 0 8px", lineHeight: 1.3, textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>{clean}</p>}
        {tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
            {tags.map(t => <HashtagBadge key={t} tag={t} />)}
          </div>
        )}
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>👁 {fmtNum(video.views)}</span>
          <button onClick={onLike} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: liked ? "#f472b6" : "rgba(255,255,255,0.6)", fontSize: 13, padding: 0, transition: "color 0.2s" }}>
            <span style={{ fontSize: 17 }}>{liked ? "♥" : "♡"}</span> {fmtNum((video.likes||0)+(liked?1:0))}
          </button>
        </div>
      </div>
    </div>
  );
}

function ExploreView({ activeTag, onTagClick }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [liked, setLiked] = useState({});
  const containerRef = useRef(null);
  const touchStartY = useRef(null);

  useEffect(() => {
    setLoading(true); setCurrent(0);
    const url = activeTag ? `${API}/videos?tag=${activeTag}` : `${API}/videos`;
    fetch(url).then(r=>r.json()).then(d=>{setVideos(d);setLoading(false);}).catch(()=>setLoading(false));
  }, [activeTag]);

  const goNext = useCallback(() => setCurrent(c=>Math.min(c+1,videos.length-1)), [videos.length]);
  const goPrev = useCallback(() => setCurrent(c=>Math.max(c-1,0)), []);

  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const h = (e) => { e.preventDefault(); if(e.deltaY>30) goNext(); else if(e.deltaY<-30) goPrev(); };
    el.addEventListener("wheel", h, { passive: false });
    return () => el.removeEventListener("wheel", h);
  }, [goNext, goPrev]);

  const handleLike = async (video) => {
    const isLiked = !!liked[video.id];
    setLiked(l=>({...l,[video.id]:!isLiked}));
    await fetch(`${API}/videos/${video.id}/like`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:isLiked?"remove":"add"})}).catch(()=>{});
  };

  return (
    <div style={{ width: "100%", height: "100%", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* 9:16 container centered */}
      <div ref={containerRef}
        onTouchStart={(e)=>{touchStartY.current=e.touches[0].clientY;}}
        onTouchEnd={(e)=>{if(!touchStartY.current)return;const d=touchStartY.current-e.changedTouches[0].clientY;if(d>40)goNext();else if(d<-40)goPrev();touchStartY.current=null;}}
        style={{ position: "relative", width: "min(100%, calc(100vh * 9/16))", height: "100%", overflow: "hidden" }}>
        {loading ? (
          <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"100%" }}><Spinner /></div>
        ) : !videos.length ? (
          <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"rgba(255,255,255,0.4)",flexDirection:"column",gap:8,fontFamily:"'DM Serif Display',serif",fontSize:18 }}>
            <span style={{fontSize:36}}>◈</span>{activeTag ? `#${activeTag} — sem vídeos` : "Nenhum vídeo ainda"}
          </div>
        ) : (
          <>
            {videos.map((video,i) => (
              <div key={video.id} style={{ position:"absolute",inset:0,transform:`translateY(${(i-current)*100}%)`,transition:"transform 0.45s cubic-bezier(0.4,0,0.2,1)" }}>
                <VideoCard video={video} onLike={()=>handleLike(video)} liked={!!liked[video.id]} />
              </div>
            ))}
            <div style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",display:"flex",flexDirection:"column",gap:5 }}>
              {videos.map((_,i) => <div key={i} onClick={()=>setCurrent(i)} style={{ width:3,height:i===current?22:7,borderRadius:2,background:i===current?"#fff":"rgba(255,255,255,0.25)",cursor:"pointer",transition:"all 0.3s" }} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── GALLERY (photos + albums) ────────────────────────────────────────────────

function AlbumCard({ album, onOpen }) {
  const g = PHOTO_GRADIENTS[hashIdx(album.id, PHOTO_GRADIENTS.length)];
  const { clean, tags } = parseTags(album.title || "");
  return (
    <div onClick={onOpen} style={{ background: g.bg, borderRadius: 10, overflow: "hidden", cursor: "pointer", position: "relative", breakInside: "avoid", marginBottom: 10 }}>
      <div style={{ paddingTop: "120%", position: "relative" }}>
        {album.coverUrl && <img src={album.coverUrl} alt={album.title} style={{ position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover" }} />}
        <div style={{ position:"absolute",inset:0,background:"linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.85) 100%)" }} />
        <div style={{ position:"absolute",top:8,right:8,background:"rgba(0,0,0,0.6)",borderRadius:20,padding:"2px 8px",fontSize:10,color:"rgba(255,255,255,0.7)",fontFamily:"monospace" }}>
          {album.photoCount || 0} ✦
        </div>
        <div style={{ position:"absolute",bottom:0,left:0,right:0,padding:"10px 10px 8px" }}>
          {clean && <p style={{ color:"#fff",fontFamily:"'DM Serif Display',serif",fontSize:13,margin:"0 0 5px",lineHeight:1.2,fontWeight:400 }}>{clean}</p>}
          {tags.length>0 && <div style={{ display:"flex",flexWrap:"wrap",gap:4 }}>{tags.slice(0,3).map(t=><HashtagBadge key={t} tag={t} />)}</div>}
          <div style={{ display:"flex",justifyContent:"flex-end",marginTop:5 }}>
            <span style={{ color:"rgba(255,255,255,0.5)",fontSize:11 }}>♡ {fmtNum(album.likes)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlbumLightbox({ album, onClose, liked, onLike }) {
  const [current, setCurrent] = useState(0);
  const photos = album.photos || [];
  const g = PHOTO_GRADIENTS[hashIdx(album.id, PHOTO_GRADIENTS.length)];
  const { clean, tags } = parseTags(album.title || "");

  useEffect(() => { const h=(e)=>{ if(e.key==="Escape") onClose(); if(e.key==="ArrowRight") setCurrent(c=>Math.min(c+1,photos.length-1)); if(e.key==="ArrowLeft") setCurrent(c=>Math.max(c-1,0)); }; window.addEventListener("keydown",h); return ()=>window.removeEventListener("keydown",h); },[onClose,photos.length]);

  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.95)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#0d0d16",borderRadius:16,overflow:"hidden",width:"min(94vw, calc(94vh * 9/16))",maxHeight:"94vh",display:"flex",flexDirection:"column",position:"relative" }}>
        {/* Photo */}
        <div style={{ position:"relative",flex:1,background:g.bg,minHeight:200 }}>
          {photos[current]?.url && <img src={photos[current].url} alt="" style={{ width:"100%",height:"100%",objectFit:"cover",display:"block" }} />}
          <button onClick={onClose} style={{ position:"absolute",top:12,right:12,background:"rgba(0,0,0,0.6)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"50%",width:32,height:32,color:"#fff",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
          {photos.length>1 && (
            <>
              <button onClick={()=>setCurrent(c=>Math.max(c-1,0))} style={{ position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,0.5)",border:"none",borderRadius:"50%",width:32,height:32,color:"#fff",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",opacity:current===0?0.3:1 }}>‹</button>
              <button onClick={()=>setCurrent(c=>Math.min(c+1,photos.length-1))} style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,0.5)",border:"none",borderRadius:"50%",width:32,height:32,color:"#fff",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",opacity:current===photos.length-1?0.3:1 }}>›</button>
              <div style={{ position:"absolute",bottom:10,left:"50%",transform:"translateX(-50%)",display:"flex",gap:4 }}>
                {photos.map((_,i)=><div key={i} onClick={()=>setCurrent(i)} style={{ width:i===current?16:6,height:6,borderRadius:3,background:i===current?"#fff":"rgba(255,255,255,0.3)",cursor:"pointer",transition:"all 0.2s" }} />)}
              </div>
            </>
          )}
        </div>
        {/* Info */}
        <div style={{ padding:"14px 16px 16px",background:"#0d0d16" }}>
          {clean && <p style={{ color:"#fff",fontFamily:"'DM Serif Display',serif",fontSize:18,margin:"0 0 8px",fontWeight:400 }}>{clean}</p>}
          {tags.length>0 && <div style={{ display:"flex",flexWrap:"wrap",gap:5,marginBottom:10 }}>{tags.map(t=><HashtagBadge key={t} tag={t} />)}</div>}
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
            <span style={{ color:"rgba(255,255,255,0.4)",fontSize:12 }}>{current+1} / {photos.length}</span>
            <button onClick={onLike} style={{ background:"none",border:"none",cursor:"pointer",color:liked?"#f472b6":"rgba(255,255,255,0.6)",fontSize:14,padding:0,display:"flex",alignItems:"center",gap:5 }}>
              <span style={{fontSize:20}}>{liked?"♥":"♡"}</span> {fmtNum((album.likes||0)+(liked?1:0))}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GalleryView({ activeTag }) {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState({});
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    setLoading(true);
    const url = activeTag ? `${API}/albums?tag=${activeTag}` : `${API}/albums`;
    fetch(url).then(r=>r.json()).then(d=>{setAlbums(d);setLoading(false);}).catch(()=>setLoading(false));
  }, [activeTag]);

  const handleLike = async (album) => {
    const isLiked = !!liked[album.id];
    setLiked(l=>({...l,[album.id]:!isLiked}));
    await fetch(`${API}/albums/${album.id}/like`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:isLiked?"remove":"add"})}).catch(()=>{});
  };

  const col1 = albums.filter((_,i)=>i%2===0);
  const col2 = albums.filter((_,i)=>i%2===1);

  return (
    <div style={{ height:"100%",overflowY:"auto",background:"#0a0a0f",padding:"24px 14px" }}>
      <div style={{ marginBottom:20 }}>
        <p style={{ color:"rgba(255,255,255,0.4)",fontSize:11,letterSpacing:3,fontFamily:"monospace",marginBottom:6 }}>AI GENERATED</p>
        <h2 style={{ color:"#fff",fontFamily:"'DM Serif Display',serif",fontSize:28,margin:0,fontWeight:400 }}>
          Gallery {activeTag && <span style={{color:"rgba(255,255,255,0.4)",fontSize:18}}>#{activeTag}</span>}
        </h2>
      </div>
      {loading ? <div style={{display:"flex",justifyContent:"center",marginTop:60}}><Spinner /></div> :
       !albums.length ? <div style={{textAlign:"center",color:"rgba(255,255,255,0.3)",marginTop:60,fontFamily:"'DM Serif Display',serif",fontSize:18}}>{activeTag?`#${activeTag} — sem álbuns`:"Nenhum álbum ainda"}</div> :
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div>{col1.map(a=><AlbumCard key={a.id} album={a} onOpen={()=>setLightbox(a)} />)}</div>
        <div>{col2.map(a=><AlbumCard key={a.id} album={a} onOpen={()=>setLightbox(a)} />)}</div>
      </div>}
      {lightbox && <AlbumLightbox album={lightbox} onClose={()=>setLightbox(null)} liked={!!liked[lightbox.id]} onLike={()=>handleLike(lightbox)} />}
    </div>
  );
}

// ── TAGS BROWSE ──────────────────────────────────────────────────────────────

function TagsView({ onTagClick }) {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/tags`).then(r=>r.json()).then(d=>{setTags(d);setLoading(false);}).catch(()=>setLoading(false));
  }, []);

  return (
    <div style={{ height:"100%",overflowY:"auto",background:"#0a0a0f",padding:"24px" }}>
      <p style={{ color:"rgba(255,255,255,0.4)",fontSize:11,letterSpacing:3,fontFamily:"monospace",marginBottom:8 }}>BROWSE</p>
      <h2 style={{ color:"#fff",fontFamily:"'DM Serif Display',serif",fontSize:28,margin:"0 0 24px",fontWeight:400 }}>Tags</h2>
      {loading ? <div style={{display:"flex",justifyContent:"center",marginTop:60}}><Spinner /></div> :
      !tags.length ? <div style={{color:"rgba(255,255,255,0.3)",fontFamily:"'DM Serif Display',serif",fontSize:16}}>Nenhuma tag ainda</div> :
      <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
        {tags.map(({tag, count}) => (
          <button key={tag} onClick={()=>onTagClick(tag)} style={{ background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:20,padding:"7px 14px",color:"#fff",cursor:"pointer",fontSize:13,fontFamily:"monospace",display:"flex",alignItems:"center",gap:6,transition:"all 0.2s" }}>
            <span style={{color:"rgba(255,255,255,0.5)"}}>#</span>{tag}
            <span style={{color:"rgba(255,255,255,0.3)",fontSize:11}}>{count}</span>
          </button>
        ))}
      </div>}
    </div>
  );
}

// ── ADMIN PANEL ──────────────────────────────────────────────────────────────

function AdminPanel({ adminPassword }) {
  const [tab, setTab] = useState("videos");
  const [libFilter, setLibFilter] = useState("all");
  const [library, setLibrary] = useState({ videos: [], albums: [] });
  const [videoForm, setVideoForm] = useState({ title: "", file: null });
  const [albumForm, setAlbumForm] = useState({ title: "", files: [] });
  const [draggingV, setDraggingV] = useState(false);
  const [draggingP, setDraggingP] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [toast, setToast] = useState(null);
  const fileRefV = useRef(null);
  const fileRefP = useRef(null);

  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3000); };

  const loadLibrary = useCallback(() => {
    fetch(`${API}/admin/library`,{headers:{"x-admin-password":adminPassword}})
      .then(r=>r.json()).then(setLibrary).catch(()=>{});
  }, [adminPassword]);

  useEffect(()=>{ if(tab==="library") loadLibrary(); },[tab,loadLibrary]);

  const uploadVideo = async () => {
    if(!videoForm.title.trim()||!videoForm.file) return showToast("Preencha título e selecione um vídeo",false);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file",videoForm.file); fd.append("title",videoForm.title);
      const res = await fetch(`${API}/admin/videos`,{method:"POST",headers:{"x-admin-password":adminPassword},body:fd});
      if(!res.ok) throw new Error((await res.json()).error);
      showToast("Vídeo publicado! ✓");
      setVideoForm({title:"",file:null});
    } catch(e){ showToast(e.message,false); }
    setUploading(false);
  };

  const uploadAlbum = async () => {
    if(!albumForm.title.trim()||!albumForm.files.length) return showToast("Preencha título e selecione as fotos",false);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("title", albumForm.title);
      albumForm.files.forEach(f => fd.append("files", f));
      setUploadProgress(`Enviando ${albumForm.files.length} foto(s)...`);
      const res = await fetch(`${API}/admin/albums`,{method:"POST",headers:{"x-admin-password":adminPassword},body:fd});
      if(!res.ok) throw new Error((await res.json()).error);
      showToast(`Álbum publicado com ${albumForm.files.length} foto(s)! ✓`);
      setAlbumForm({title:"",files:[]});
    } catch(e){ showToast(e.message,false); }
    setUploadProgress(""); setUploading(false);
  };

  const deleteItem = async (type, id) => {
    await fetch(`${API}/admin/${type}/${id}`,{method:"DELETE",headers:{"x-admin-password":adminPassword}});
    loadLibrary(); showToast("Deletado");
  };

  const inputStyle = { width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"10px 14px",color:"#fff",fontSize:15,outline:"none",boxSizing:"border-box" };
  const labelStyle = { display:"block",color:"rgba(255,255,255,0.45)",fontSize:11,letterSpacing:1,marginBottom:6,fontFamily:"monospace" };

  return (
    <div style={{ height:"100%",overflowY:"auto",background:"#080810",position:"relative" }}>
      {toast && <div style={{ position:"fixed",top:20,right:20,background:toast.ok?"#1a3a1a":"#3a1a1a",border:`1px solid ${toast.ok?"#4ade80":"#f87171"}40`,borderRadius:10,padding:"12px 20px",color:toast.ok?"#4ade80":"#f87171",fontSize:14,zIndex:300 }}>{toast.msg}</div>}

      <div style={{ borderBottom:"1px solid rgba(255,255,255,0.07)",padding:"20px 24px 0" }}>
        <p style={{ color:"rgba(255,255,255,0.3)",fontSize:10,letterSpacing:3,fontFamily:"monospace",marginBottom:6 }}>ADMIN PANEL</p>
        <h2 style={{ color:"#fff",fontFamily:"'DM Serif Display',serif",fontSize:26,margin:"0 0 20px",fontWeight:400 }}>Content Manager</h2>
        <div style={{display:"flex"}}>
          {[["videos","▶ Vídeos"],["albums","✦ Álbuns"],["library","Library"]].map(([key,label])=>(
            <button key={key} onClick={()=>setTab(key)} style={{ background:"none",border:"none",borderBottom:`2px solid ${tab===key?"#c084fc":"transparent"}`,color:tab===key?"#c084fc":"rgba(255,255,255,0.4)",cursor:"pointer",padding:"8px 20px 12px",fontSize:14,transition:"all 0.2s" }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{padding:24}}>

        {/* Upload Video */}
        {tab==="videos" && (
          <div>
            <p style={{ color:"rgba(255,255,255,0.4)",fontSize:12,marginBottom:16 }}>Use hashtags no título: <span style={{color:"rgba(255,255,255,0.7)",fontFamily:"monospace"}}>#tag1 #tag2 descrição</span></p>
            <div onDragOver={e=>{e.preventDefault();setDraggingV(true);}} onDragLeave={()=>setDraggingV(false)} onDrop={e=>{e.preventDefault();setDraggingV(false);const f=e.dataTransfer.files[0];if(f)setVideoForm(x=>({...x,file:f}));}} onClick={()=>fileRefV.current?.click()} style={{ border:`2px dashed ${draggingV?"#c084fc":"rgba(255,255,255,0.12)"}`,borderRadius:14,padding:"36px 24px",textAlign:"center",cursor:"pointer",transition:"all 0.2s",background:draggingV?"rgba(192,132,252,0.05)":"transparent",marginBottom:20 }}>
              <input ref={fileRefV} type="file" accept="video/*" style={{display:"none"}} onChange={e=>e.target.files[0]&&setVideoForm(x=>({...x,file:e.target.files[0]}))} />
              <div style={{fontSize:34,marginBottom:10}}>▶</div>
              <p style={{color:"rgba(255,255,255,0.6)",margin:"0 0 4px",fontSize:15}}>{videoForm.file?`✓ ${videoForm.file.name}`:"Drag & drop do vídeo aqui"}</p>
              <p style={{color:"rgba(255,255,255,0.25)",margin:0,fontSize:12}}>MP4 · MOV · WEBM · max 200MB</p>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div><label style={labelStyle}>TÍTULO / HASHTAGS</label><input value={videoForm.title} onChange={e=>setVideoForm(x=>({...x,title:e.target.value}))} placeholder="#tag1 #tag2 descrição opcional..." style={inputStyle} /></div>
              <button onClick={uploadVideo} disabled={uploading} style={{ background:uploading?"rgba(124,58,237,0.4)":"linear-gradient(135deg,#7c3aed,#c084fc)",border:"none",borderRadius:8,padding:"12px 24px",color:"#fff",fontSize:15,cursor:uploading?"not-allowed":"pointer",fontFamily:"'DM Serif Display',serif",display:"flex",alignItems:"center",justifyContent:"center",gap:10 }}>
                {uploading?<><Spinner size={20}/> Enviando...</>:"Publicar Vídeo"}
              </button>
            </div>
          </div>
        )}

        {/* Upload Album */}
        {tab==="albums" && (
          <div>
            <p style={{ color:"rgba(255,255,255,0.4)",fontSize:12,marginBottom:16 }}>Selecione várias fotos de uma vez para criar um álbum.</p>
            <div onDragOver={e=>{e.preventDefault();setDraggingP(true);}} onDragLeave={()=>setDraggingP(false)} onDrop={e=>{e.preventDefault();setDraggingP(false);const files=Array.from(e.dataTransfer.files).filter(f=>f.type.startsWith("image/"));if(files.length)setAlbumForm(x=>({...x,files}));}} onClick={()=>fileRefP.current?.click()} style={{ border:`2px dashed ${draggingP?"#67e8f9":"rgba(255,255,255,0.12)"}`,borderRadius:14,padding:"36px 24px",textAlign:"center",cursor:"pointer",transition:"all 0.2s",background:draggingP?"rgba(103,232,249,0.05)":"transparent",marginBottom:20 }}>
              <input ref={fileRefP} type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>{ const files=Array.from(e.target.files); if(files.length) setAlbumForm(x=>({...x,files})); }} />
              <div style={{fontSize:34,marginBottom:10}}>✦</div>
              <p style={{color:"rgba(255,255,255,0.6)",margin:"0 0 4px",fontSize:15}}>
                {albumForm.files.length>0 ? `✓ ${albumForm.files.length} foto(s) selecionada(s)` : "Drag & drop das fotos aqui"}
              </p>
              <p style={{color:"rgba(255,255,255,0.25)",margin:0,fontSize:12}}>JPG · PNG · WEBP · várias de uma vez</p>
            </div>
            {albumForm.files.length>0 && (
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
                {albumForm.files.slice(0,8).map((f,i)=>(
                  <div key={i} style={{width:52,height:52,borderRadius:6,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"rgba(255,255,255,0.4)",overflow:"hidden"}}>
                    <img src={URL.createObjectURL(f)} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />
                  </div>
                ))}
                {albumForm.files.length>8 && <div style={{width:52,height:52,borderRadius:6,background:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"rgba(255,255,255,0.5)"}}>+{albumForm.files.length-8}</div>}
              </div>
            )}
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div><label style={labelStyle}>TÍTULO / HASHTAGS</label><input value={albumForm.title} onChange={e=>setAlbumForm(x=>({...x,title:e.target.value}))} placeholder="#tag1 #tag2 descrição opcional..." style={inputStyle} /></div>
              <button onClick={uploadAlbum} disabled={uploading} style={{ background:uploading?"rgba(8,145,178,0.4)":"linear-gradient(135deg,#0891b2,#67e8f9)",border:"none",borderRadius:8,padding:"12px 24px",color:"#fff",fontSize:15,cursor:uploading?"not-allowed":"pointer",fontFamily:"'DM Serif Display',serif",display:"flex",alignItems:"center",justifyContent:"center",gap:10 }}>
                {uploading?<><Spinner size={20} color="#67e8f9"/> {uploadProgress||"Enviando..."}</>:`Publicar Álbum (${albumForm.files.length} foto${albumForm.files.length!==1?"s":""})`}
              </button>
            </div>
          </div>
        )}

        {/* Library */}
        {tab==="library" && (
          <div>
            <div style={{display:"flex",gap:6,marginBottom:20}}>
              {[["all","Tudo"],["video","Vídeos"],["album","Álbuns"]].map(([v,l])=>(
                <button key={v} onClick={()=>setLibFilter(v)} style={{ background:libFilter===v?"rgba(192,132,252,0.15)":"transparent",border:`1px solid ${libFilter===v?"rgba(192,132,252,0.4)":"rgba(255,255,255,0.1)"}`,borderRadius:20,padding:"5px 16px",color:libFilter===v?"#c084fc":"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:13 }}>{l}</button>
              ))}
              <span style={{marginLeft:"auto",color:"rgba(255,255,255,0.3)",fontSize:13,display:"flex",alignItems:"center"}}>
                {libFilter==="all"?(library.videos||[]).length+(library.albums||[]).length:libFilter==="video"?(library.videos||[]).length:(library.albums||[]).length} items
              </span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {libFilter!=="album" && (library.videos||[]).map(video=>{
                const {clean,tags} = parseTags(video.title||"");
                return (
                  <div key={video.id} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:34,height:34,borderRadius:6,background:"rgba(124,58,237,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>▶</div>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{color:"#fff",fontSize:13,margin:"0 0 3px",fontFamily:"'DM Serif Display',serif",fontWeight:400,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{clean||video.title}</p>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{tags.slice(0,4).map(t=><HashtagBadge key={t} tag={t} />)}</div>
                    </div>
                    <button onClick={()=>deleteItem("videos",video.id)} style={{background:"none",border:"1px solid rgba(255,80,80,0.2)",borderRadius:6,color:"rgba(255,100,100,0.6)",cursor:"pointer",padding:"3px 10px",fontSize:12,flexShrink:0}}>Delete</button>
                  </div>
                );
              })}
              {libFilter!=="video" && (library.albums||[]).map(album=>{
                const {clean,tags} = parseTags(album.title||"");
                return (
                  <div key={album.id} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:34,height:34,borderRadius:6,background:"rgba(103,232,249,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>✦</div>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{color:"#fff",fontSize:13,margin:"0 0 3px",fontFamily:"'DM Serif Display',serif",fontWeight:400,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{clean||album.title}</p>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}}>
                        {tags.slice(0,3).map(t=><HashtagBadge key={t} tag={t} />)}
                        <span style={{color:"rgba(255,255,255,0.3)",fontSize:11}}>{album.photoCount} foto(s)</span>
                      </div>
                    </div>
                    <button onClick={()=>deleteItem("albums",album.id)} style={{background:"none",border:"1px solid rgba(255,80,80,0.2)",borderRadius:6,color:"rgba(255,100,100,0.6)",cursor:"pointer",padding:"3px 10px",fontSize:12,flexShrink:0}}>Delete</button>
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

// ── ROOT ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState("explore");
  const [activeTag, setActiveTag] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [adminOpen, setAdminOpen] = useState(false);
  const [passError, setPassError] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const handleTagClick = (tag) => { setActiveTag(tag); setView("explore"); };

  const handleAdminLogin = async () => {
    setLoginLoading(true);
    try {
      const res = await fetch(`${API}/admin/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:adminPass})});
      if(res.ok){ setIsAdmin(true); setAdminPassword(adminPass); setAdminOpen(false); setView("admin"); setPassError(false); setAdminPass(""); }
      else setPassError(true);
    } catch { setPassError(true); }
    setLoginLoading(false);
  };

  const navItems = [
    { id:"explore", icon:"◈", label:"Explore" },
    { id:"gallery", icon:"✦", label:"Gallery" },
    { id:"tags",    icon:"#", label:"Tags"    },
  ];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      <style>{`*{box-sizing:border-box;}body{margin:0;}@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      <div style={{display:"flex",height:"100vh",background:"#080810",fontFamily:"'DM Sans',sans-serif",overflow:"hidden"}}>

        {/* Sidebar */}
        <div style={{width:190,background:"rgba(0,0,0,0.6)",borderRight:"1px solid rgba(255,255,255,0.06)",display:"flex",flexDirection:"column",padding:"24px 0",flexShrink:0}}>
          <div style={{padding:"0 18px 24px"}}>
            <p style={{color:"rgba(255,255,255,0.25)",fontSize:9,letterSpacing:4,fontFamily:"monospace",margin:"0 0 4px"}}>AI STUDIO</p>
            <p style={{color:"#fff",fontFamily:"'DM Serif Display',serif",fontSize:22,margin:0,fontWeight:400}}>Lumina</p>
          </div>
          {activeTag && (
            <div style={{margin:"0 10px 12px",background:"rgba(255,255,255,0.05)",borderRadius:8,padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{color:"rgba(255,255,255,0.6)",fontSize:12,fontFamily:"monospace"}}>#{activeTag}</span>
              <button onClick={()=>setActiveTag(null)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.3)",cursor:"pointer",fontSize:14,padding:0}}>×</button>
            </div>
          )}
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:2,padding:"0 10px"}}>
            {navItems.map(item=>(
              <button key={item.id} onClick={()=>setView(item.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:8,border:"none",background:view===item.id?"rgba(192,132,252,0.12)":"transparent",color:view===item.id?"#c084fc":"rgba(255,255,255,0.45)",cursor:"pointer",fontSize:14,textAlign:"left",transition:"all 0.2s"}}>
                <span style={{fontSize:15}}>{item.icon}</span>{item.label}
              </button>
            ))}
          </div>
          <div style={{padding:"0 10px"}}>
            {isAdmin
              ? <button onClick={()=>setView("admin")} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:8,border:"none",background:view==="admin"?"rgba(192,132,252,0.12)":"transparent",color:view==="admin"?"#c084fc":"rgba(255,255,255,0.35)",cursor:"pointer",fontSize:14,width:"100%"}}>⚙ Admin</button>
              : <button onClick={()=>setAdminOpen(true)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:8,border:"none",background:"transparent",color:"rgba(255,255,255,0.2)",cursor:"pointer",fontSize:13,width:"100%"}}>🔒 Admin</button>
            }
          </div>
        </div>

        {/* Main */}
        <div style={{flex:1,position:"relative",overflow:"hidden"}}>
          {view==="explore" && <ExploreView activeTag={activeTag} onTagClick={handleTagClick} />}
          {view==="gallery" && <GalleryView activeTag={activeTag} />}
          {view==="tags"    && <TagsView onTagClick={(t)=>{ setActiveTag(t); setView("explore"); }} />}
          {view==="admin" && isAdmin && <AdminPanel adminPassword={adminPassword} />}
        </div>

        {/* Admin modal */}
        {adminOpen && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
            <div style={{background:"#12121e",border:"1px solid rgba(255,255,255,0.1)",borderRadius:16,padding:32,width:320}}>
              <p style={{color:"rgba(255,255,255,0.4)",fontSize:11,letterSpacing:3,fontFamily:"monospace",marginBottom:8}}>RESTRICTED</p>
              <h3 style={{color:"#fff",fontFamily:"'DM Serif Display',serif",fontSize:22,margin:"0 0 24px",fontWeight:400}}>Admin Access</h3>
              <input type="password" value={adminPass} onChange={e=>{setAdminPass(e.target.value);setPassError(false);}} onKeyDown={e=>e.key==="Enter"&&handleAdminLogin()} placeholder="Password" style={{width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${passError?"rgba(255,80,80,0.5)":"rgba(255,255,255,0.1)"}`,borderRadius:8,padding:"10px 14px",color:"#fff",fontSize:14,outline:"none",marginBottom:passError?6:16}} />
              {passError && <p style={{color:"rgba(255,100,100,0.8)",fontSize:12,margin:"0 0 12px"}}>Senha incorreta</p>}
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>{setAdminOpen(false);setAdminPass("");setPassError(false);}} style={{flex:1,background:"transparent",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"10px",color:"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:14}}>Cancel</button>
                <button onClick={handleAdminLogin} disabled={loginLoading} style={{flex:1,background:"linear-gradient(135deg,#7c3aed,#c084fc)",border:"none",borderRadius:8,padding:"10px",color:"#fff",cursor:"pointer",fontSize:14,fontFamily:"'DM Serif Display',serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  {loginLoading?<Spinner size={18}/>:"Enter"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
