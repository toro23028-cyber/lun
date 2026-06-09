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

const fmtNum = (n) => { const x=parseInt(n)||0; return x>=1000?(x/1000).toFixed(1)+"K":x; };
const hashIdx = (str, len) => { let h=0; for(let i=0;i<str.length;i++) h=(h*31+str.charCodeAt(i))>>>0; return h%len; };
const parseTags = (title="") => { const tags=[]; const clean=title.replace(/#(\w+)/g,(_,t)=>{tags.push(t.toLowerCase());return "";}).trim(); return {clean,tags}; };
const shuffle = (arr) => [...arr].sort(()=>Math.random()-0.5);
const randInt = (min, max) => Math.floor(Math.random()*(max-min+1))+min;

function Spinner({size=28,color="#c084fc"}){
  return <div style={{width:size,height:size,border:`3px solid rgba(255,255,255,0.1)`,borderTop:`3px solid ${color}`,borderRadius:"50%",animation:"spin 0.8s linear infinite",flexShrink:0}}/>;
}
function HashtagBadge({tag,onClick}){
  return <span onClick={e=>{e.stopPropagation();onClick&&onClick(tag);}} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",color:"rgba(255,255,255,0.65)",fontSize:11,padding:"2px 8px",borderRadius:20,cursor:onClick?"pointer":"default",fontFamily:"monospace",letterSpacing:0.5,whiteSpace:"nowrap"}}>#{tag}</span>;
}

// ── ALBUM LIGHTBOX ────────────────────────────────────────────────────────────
function AlbumLightbox({album,onClose,liked,onLike,onTagClick}){
  const [current,setCurrent]=useState(0);
  const photos=album.photos||[];
  const g=PHOTO_GRADIENTS[hashIdx(album.id,PHOTO_GRADIENTS.length)];
  const {clean,tags}=parseTags(album.title||"");
  useEffect(()=>{
    const h=(e)=>{if(e.key==="Escape")onClose();if(e.key==="ArrowRight")setCurrent(c=>Math.min(c+1,photos.length-1));if(e.key==="ArrowLeft")setCurrent(c=>Math.max(c-1,0));};
    window.addEventListener("keydown",h); return()=>window.removeEventListener("keydown",h);
  },[onClose,photos.length]);
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.95)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#0d0d16",borderRadius:16,overflow:"hidden",width:"min(94vw,calc(94vh*9/16))",maxHeight:"94vh",display:"flex",flexDirection:"column"}}>
        <div style={{position:"relative",flex:1,background:g.bg,minHeight:200}}>
          {photos[current]?.url&&<img src={photos[current].url} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>}
          <button onClick={onClose} style={{position:"absolute",top:12,right:12,background:"rgba(0,0,0,0.6)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"50%",width:32,height:32,color:"#fff",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          {photos.length>1&&<>
            <button onClick={()=>setCurrent(c=>Math.max(c-1,0))} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,0.5)",border:"none",borderRadius:"50%",width:32,height:32,color:"#fff",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",opacity:current===0?0.3:1}}>‹</button>
            <button onClick={()=>setCurrent(c=>Math.min(c+1,photos.length-1))} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,0.5)",border:"none",borderRadius:"50%",width:32,height:32,color:"#fff",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",opacity:current===photos.length-1?0.3:1}}>›</button>
            <div style={{position:"absolute",bottom:10,left:"50%",transform:"translateX(-50%)",display:"flex",gap:4}}>
              {photos.map((_,i)=><div key={i} onClick={()=>setCurrent(i)} style={{width:i===current?16:6,height:6,borderRadius:3,background:i===current?"#fff":"rgba(255,255,255,0.3)",cursor:"pointer",transition:"all 0.2s"}}/>)}
            </div>
          </>}
        </div>
        <div style={{padding:"14px 16px 16px",background:"#0d0d16"}}>
          {clean&&<p style={{color:"#fff",fontFamily:"'DM Serif Display',serif",fontSize:18,margin:"0 0 8px",fontWeight:400}}>{clean}</p>}
          {tags.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>{tags.map(t=><HashtagBadge key={t} tag={t} onClick={onTagClick}/>)}</div>}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{color:"rgba(255,255,255,0.4)",fontSize:12}}>{current+1} / {photos.length}</span>
            <button onClick={onLike} style={{background:"none",border:"none",cursor:"pointer",color:liked?"#f472b6":"rgba(255,255,255,0.6)",fontSize:14,padding:0,display:"flex",alignItems:"center",gap:5}}>
              <span style={{fontSize:20}}>{liked?"♥":"♡"}</span> {fmtNum((album.likes||0)+(liked?1:0))}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── FEED ITEMS ────────────────────────────────────────────────────────────────
function VideoFeedItem({video,onLike,liked,onTagClick}){
  const bg=VIDEO_THUMBS[hashIdx(video.id,VIDEO_THUMBS.length)];
  const {clean,tags}=parseTags(video.title||"");
  return(
    <div style={{width:"100%",height:"100%",background:bg,position:"relative",userSelect:"none"}}>
      {video.url&&<video src={video.url} autoPlay loop muted playsInline style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>}
      <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 45%,rgba(0,0,0,0.92) 100%)"}}/>
      <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"20px 16px"}}>
        {clean&&<p style={{color:"#fff",fontFamily:"'DM Serif Display',serif",fontSize:18,margin:"0 0 8px",lineHeight:1.3,textShadow:"0 2px 8px rgba(0,0,0,0.8)"}}>{clean}</p>}
        {tags.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:12}}>{tags.map(t=><HashtagBadge key={t} tag={t} onClick={onTagClick}/>)}</div>}
        <div style={{display:"flex",gap:16,alignItems:"center"}}>
          <span style={{color:"rgba(255,255,255,0.5)",fontSize:12}}>👁 {fmtNum(video.views)}</span>
          <button onClick={onLike} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:5,color:liked?"#f472b6":"rgba(255,255,255,0.6)",fontSize:13,padding:0}}>
            <span style={{fontSize:17}}>{liked?"♥":"♡"}</span> {fmtNum((video.likes||0)+(liked?1:0))}
          </button>
        </div>
      </div>
    </div>
  );
}

function AlbumFeedItem({album,onOpen,onLike,liked,onTagClick}){
  const g=PHOTO_GRADIENTS[hashIdx(album.id,PHOTO_GRADIENTS.length)];
  const {clean,tags}=parseTags(album.title||"");
  const photos=album.photos||[];
  return(
    <div style={{width:"100%",height:"100%",background:"#08080f",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",userSelect:"none"}}>
      {album.coverUrl&&<img src={album.coverUrl} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",filter:"blur(28px) brightness(0.25)",transform:"scale(1.1)"}}/>}
      <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(124,58,237,0.08) 0%,transparent 60%)"}}/>
      <div style={{position:"relative",zIndex:1,display:"flex",gap:24,alignItems:"center",width:"100%",padding:"0 32px",maxWidth:500}}>
        {/* Photo strip */}
        <div style={{display:"flex",gap:6,flexShrink:0}}>
          {photos.slice(0,3).map((p,i)=>(
            <div key={i} style={{width:i===1?80:60,height:i===1?110:90,borderRadius:10,overflow:"hidden",background:g.bg,border:"1px solid rgba(255,255,255,0.08)",flexShrink:0,transform:i===0?"rotate(-4deg)":i===2?"rotate(4deg)":"rotate(0deg)",boxShadow:"0 4px 20px rgba(0,0,0,0.5)"}}>
              {p.url&&<img src={p.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}
            </div>
          ))}
          {photos.length===0&&<div style={{width:60,height:90,borderRadius:10,background:g.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,opacity:0.5}}>✦</div>}
        </div>
        {/* Info */}
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(192,132,252,0.12)",border:"1px solid rgba(192,132,252,0.2)",borderRadius:20,padding:"3px 10px",marginBottom:10}}>
            <span style={{color:"#c084fc",fontSize:10,fontFamily:"monospace",letterSpacing:1}}>✦ GALERIA</span>
            <span style={{color:"rgba(192,132,252,0.6)",fontSize:10}}>{photos.length} foto{photos.length!==1?"s":""}</span>
          </div>
          {clean&&<p style={{color:"#fff",fontFamily:"'DM Serif Display',serif",fontSize:19,margin:"0 0 8px",fontWeight:400,lineHeight:1.3}}>{clean}</p>}
          {tags.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:14}}>{tags.slice(0,4).map(t=><HashtagBadge key={t} tag={t} onClick={onTagClick}/>)}</div>}
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <button onClick={onOpen} style={{background:"linear-gradient(135deg,#7c3aed,#c084fc)",border:"none",borderRadius:20,padding:"7px 18px",color:"#fff",cursor:"pointer",fontSize:12,fontFamily:"'DM Serif Display',serif",whiteSpace:"nowrap"}}>Ver galeria</button>
            <button onClick={onLike} style={{background:"none",border:"none",cursor:"pointer",color:liked?"#f472b6":"rgba(255,255,255,0.5)",fontSize:13,padding:0,display:"flex",alignItems:"center",gap:4}}>
              <span style={{fontSize:18}}>{liked?"♥":"♡"}</span>{fmtNum((album.likes||0)+(liked?1:0))}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── BUILD FEED: intervalo aleatório ───────────────────────────────────────────
function buildFeed(videos, albums){
  const feed=[];
  let vi=0, ai=0;
  while(vi<videos.length||ai<albums.length){
    const vCount = randInt(2,4);
    for(let i=0;i<vCount&&vi<videos.length;i++,vi++) feed.push({type:"video",data:videos[vi]});
    const aCount = randInt(1,2);
    for(let i=0;i<aCount&&ai<albums.length;i++,ai++) feed.push({type:"album",data:albums[ai]});
  }
  return feed;
}

// ── EXPLORE VIEW ──────────────────────────────────────────────────────────────
function ExploreView({activeTag,onTagClick}){
  const [rawData,setRawData]=useState({videos:[],albums:[]});
  const [feed,setFeed]=useState([]);
  const [loading,setLoading]=useState(true);
  const [current,setCurrent]=useState(0);
  const [liked,setLiked]=useState({});
  const [lightbox,setLightbox]=useState(null);
  const containerRef=useRef(null);
  const touchStartY=useRef(null);

  useEffect(()=>{
    setLoading(true);setCurrent(0);
    const tag=activeTag?`?tag=${activeTag}`:"";
    Promise.all([
      fetch(`${API}/videos${tag}`).then(r=>r.json()).catch(()=>[]),
      fetch(`${API}/albums${tag}`).then(r=>r.json()).catch(()=>[]),
    ]).then(([v,a])=>{
      setRawData({videos:v,albums:a});
      const built=buildFeed(shuffle(v),shuffle(a));
      setFeed([...built,...buildFeed(shuffle(v),shuffle(a)),...buildFeed(shuffle(v),shuffle(a))]);
      setLoading(false);
    });
  },[activeTag]);

  useEffect(()=>{
    if(!rawData.videos.length&&!rawData.albums.length) return;
    if(current>=feed.length-6){
      const more=buildFeed(shuffle(rawData.videos),shuffle(rawData.albums));
      setFeed(f=>[...f,...more]);
    }
  },[current,feed.length,rawData]);

  const goNext=useCallback(()=>setCurrent(c=>c+1),[]);
  const goPrev=useCallback(()=>setCurrent(c=>Math.max(c-1,0)),[]);

  useEffect(()=>{
    const el=containerRef.current;if(!el)return;
    const h=(e)=>{e.preventDefault();if(e.deltaY>30)goNext();else if(e.deltaY<-30)goPrev();};
    el.addEventListener("wheel",h,{passive:false});
    return()=>el.removeEventListener("wheel",h);
  },[goNext,goPrev]);

  const handleLike=async(item)=>{
    const isLiked=!!liked[item.id];
    setLiked(l=>({...l,[item.id]:!isLiked}));
    const type=item.photos?"albums":"videos";
    await fetch(`${API}/${type}/${item.id}/like`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:isLiked?"remove":"add"})}).catch(()=>{});
  };

  const windowSize=5;
  const start=Math.max(0,current-windowSize);
  const end=Math.min(feed.length-1,current+windowSize);

  return(
    <div style={{width:"100%",height:"100%",background:"#000",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div ref={containerRef}
        onTouchStart={e=>{touchStartY.current=e.touches[0].clientY;}}
        onTouchEnd={e=>{if(!touchStartY.current)return;const d=touchStartY.current-e.changedTouches[0].clientY;if(d>40)goNext();else if(d<-40)goPrev();touchStartY.current=null;}}
        style={{position:"relative",width:"min(100%,calc(100vh*9/16))",height:"100%",overflow:"hidden"}}>
        {loading?(
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%"}}><Spinner/></div>
        ):!feed.length?(
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"rgba(255,255,255,0.4)",flexDirection:"column",gap:8,fontFamily:"'DM Serif Display',serif",fontSize:18}}>
            <span style={{fontSize:36}}>◈</span>{activeTag?`#${activeTag} — sem resultados`:"Nenhum conteúdo ainda"}
          </div>
        ):(
          <>
            {feed.slice(start,end+1).map((item,idx)=>{
              const i=start+idx;
              return(
                <div key={`${i}-${item.type}-${item.data.id}`} style={{position:"absolute",inset:0,transform:`translateY(${(i-current)*100}%)`,transition:"transform 0.45s cubic-bezier(0.4,0,0.2,1)"}}>
                  {item.type==="video"
                    ?<VideoFeedItem video={item.data} onLike={()=>handleLike(item.data)} liked={!!liked[item.data.id]} onTagClick={onTagClick}/>
                    :<AlbumFeedItem album={item.data} onOpen={()=>setLightbox(item.data)} onLike={()=>handleLike(item.data)} liked={!!liked[item.data.id]} onTagClick={onTagClick}/>
                  }
                </div>
              );
            })}
            <div style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",display:"flex",flexDirection:"column",gap:3}}>
              {feed.slice(Math.max(0,current-4),current+5).map((item,i)=>{
                const abs=Math.max(0,current-4)+i;
                return <div key={abs} onClick={()=>setCurrent(abs)} style={{width:abs===current?4:3,height:abs===current?20:6,borderRadius:2,background:abs===current?"#fff":item.type==="album"?"rgba(192,132,252,0.5)":"rgba(255,255,255,0.25)",cursor:"pointer",transition:"all 0.3s"}}/>;
              })}
            </div>
          </>
        )}
      </div>
      {lightbox&&<AlbumLightbox album={lightbox} onClose={()=>setLightbox(null)} liked={!!liked[lightbox.id]} onLike={()=>handleLike(lightbox)} onTagClick={onTagClick}/>}
    </div>
  );
}

// ── GALLERY VIEW ──────────────────────────────────────────────────────────────
function GalleryView({activeTag,onTagClick}){
  const [albums,setAlbums]=useState([]);
  const [loading,setLoading]=useState(true);
  const [liked,setLiked]=useState({});
  const [lightbox,setLightbox]=useState(null);

  useEffect(()=>{
    setLoading(true);
    fetch(activeTag?`${API}/albums?tag=${activeTag}`:`${API}/albums`).then(r=>r.json()).then(d=>{setAlbums(d);setLoading(false);}).catch(()=>setLoading(false));
  },[activeTag]);

  const handleLike=async(album)=>{
    const isLiked=!!liked[album.id];
    setLiked(l=>({...l,[album.id]:!isLiked}));
    await fetch(`${API}/albums/${album.id}/like`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:isLiked?"remove":"add"})}).catch(()=>{});
  };

  const col1=albums.filter((_,i)=>i%2===0),col2=albums.filter((_,i)=>i%2===1);
  const Card=({a})=>{
    const g=PHOTO_GRADIENTS[hashIdx(a.id,PHOTO_GRADIENTS.length)];
    const {clean,tags}=parseTags(a.title||"");
    return(
      <div onClick={()=>setLightbox(a)} style={{background:g.bg,borderRadius:10,overflow:"hidden",cursor:"pointer",position:"relative",marginBottom:10}}>
        <div style={{paddingTop:"120%",position:"relative"}}>
          {a.coverUrl&&<img src={a.coverUrl} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>}
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.85) 100%)"}}/>
          <div style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,0.6)",borderRadius:20,padding:"2px 8px",fontSize:10,color:"rgba(255,255,255,0.7)",fontFamily:"monospace"}}>{a.photoCount||0} ✦</div>
          <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"10px"}}>
            {clean&&<p style={{color:"#fff",fontFamily:"'DM Serif Display',serif",fontSize:13,margin:"0 0 5px",fontWeight:400}}>{clean}</p>}
            {tags.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:4}}>{tags.slice(0,3).map(t=><HashtagBadge key={t} tag={t} onClick={onTagClick}/>)}</div>}
            <div style={{display:"flex",justifyContent:"flex-end"}}><span style={{color:"rgba(255,255,255,0.5)",fontSize:11}}>♡ {fmtNum(a.likes)}</span></div>
          </div>
        </div>
      </div>
    );
  };

  return(
    <div style={{height:"100%",overflowY:"auto",background:"#0a0a0f",padding:"24px 14px"}}>
      <div style={{marginBottom:20}}>
        <p style={{color:"rgba(255,255,255,0.4)",fontSize:11,letterSpacing:3,fontFamily:"monospace",marginBottom:6}}>AI GENERATED</p>
        <h2 style={{color:"#fff",fontFamily:"'DM Serif Display',serif",fontSize:28,margin:0,fontWeight:400}}>Gallery {activeTag&&<span style={{color:"rgba(255,255,255,0.4)",fontSize:18}}>#{activeTag}</span>}</h2>
      </div>
      {loading?<div style={{display:"flex",justifyContent:"center",marginTop:60}}><Spinner/></div>:
       !albums.length?<div style={{textAlign:"center",color:"rgba(255,255,255,0.3)",marginTop:60,fontFamily:"'DM Serif Display',serif",fontSize:18}}>Nenhum álbum ainda</div>:
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div>{col1.map(a=><Card key={a.id} a={a}/>)}</div>
        <div>{col2.map(a=><Card key={a.id} a={a}/>)}</div>
      </div>}
      {lightbox&&<AlbumLightbox album={lightbox} onClose={()=>setLightbox(null)} liked={!!liked[lightbox.id]} onLike={()=>handleLike(lightbox)} onTagClick={onTagClick}/>}
    </div>
  );
}

// ── TAGS VIEW ─────────────────────────────────────────────────────────────────
function TagsView({onTagClick}){
  const [tags,setTags]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{fetch(`${API}/tags`).then(r=>r.json()).then(d=>{setTags(d);setLoading(false);}).catch(()=>setLoading(false));},[]);
  return(
    <div style={{height:"100%",overflowY:"auto",background:"#0a0a0f",padding:"24px"}}>
      <p style={{color:"rgba(255,255,255,0.4)",fontSize:11,letterSpacing:3,fontFamily:"monospace",marginBottom:8}}>BROWSE</p>
      <h2 style={{color:"#fff",fontFamily:"'DM Serif Display',serif",fontSize:28,margin:"0 0 24px",fontWeight:400}}>Tags</h2>
      {loading?<div style={{display:"flex",justifyContent:"center",marginTop:60}}><Spinner/></div>:
       !tags.length?<div style={{color:"rgba(255,255,255,0.3)",fontFamily:"'DM Serif Display',serif",fontSize:16}}>Nenhuma tag ainda</div>:
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {tags.map(({tag,count})=>(
          <button key={tag} onClick={()=>onTagClick(tag)} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:20,padding:"7px 14px",color:"#fff",cursor:"pointer",fontSize:13,fontFamily:"monospace",display:"flex",alignItems:"center",gap:6}}>
            <span style={{color:"rgba(255,255,255,0.5)"}}>#</span>{tag}<span style={{color:"rgba(255,255,255,0.3)",fontSize:11}}>{count}</span>
          </button>
        ))}
      </div>}
    </div>
  );
}

// ── TAG RESULTS VIEW ──────────────────────────────────────────────────────────
function TagResultsView({tag,onBack,onTagClick}){
  const [videos,setVideos]=useState([]);
  const [albums,setAlbums]=useState([]);
  const [loading,setLoading]=useState(true);
  const [filter,setFilter]=useState("all");
  const [liked,setLiked]=useState({});
  const [lightbox,setLightbox]=useState(null);
  const [playingId,setPlayingId]=useState(null);

  useEffect(()=>{
    setLoading(true);
    Promise.all([
      fetch(`${API}/videos?tag=${tag}`).then(r=>r.json()).catch(()=>[]),
      fetch(`${API}/albums?tag=${tag}`).then(r=>r.json()).catch(()=>[]),
    ]).then(([v,a])=>{setVideos(v);setAlbums(a);setLoading(false);});
  },[tag]);

  const handleLike=async(item,type)=>{
    const isLiked=!!liked[item.id];
    setLiked(l=>({...l,[item.id]:!isLiked}));
    await fetch(`${API}/${type}/${item.id}/like`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:isLiked?"remove":"add"})}).catch(()=>{});
  };

  const showVideos=filter!=="albums", showAlbums=filter!=="videos";

  return(
    <div style={{height:"100%",overflowY:"auto",background:"#0a0a0f",padding:"24px"}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:13,padding:"0 0 16px",display:"flex",alignItems:"center",gap:6}}>← voltar</button>
      <div style={{marginBottom:20}}>
        <p style={{color:"rgba(255,255,255,0.4)",fontSize:11,letterSpacing:3,fontFamily:"monospace",marginBottom:6}}>RESULTADOS</p>
        <h2 style={{color:"#fff",fontFamily:"'DM Serif Display',serif",fontSize:28,margin:0,fontWeight:400}}>#{tag}</h2>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:20}}>
        {[["all","Tudo"],["videos","Vídeos"],["albums","Fotos"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{background:filter===v?"rgba(192,132,252,0.15)":"transparent",border:`1px solid ${filter===v?"rgba(192,132,252,0.4)":"rgba(255,255,255,0.1)"}`,borderRadius:20,padding:"5px 16px",color:filter===v?"#c084fc":"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:13}}>{l}</button>
        ))}
        <span style={{marginLeft:"auto",color:"rgba(255,255,255,0.3)",fontSize:12,display:"flex",alignItems:"center"}}>
          {(showVideos?videos.length:0)+(showAlbums?albums.length:0)} resultados
        </span>
      </div>
      {loading?<div style={{display:"flex",justifyContent:"center",marginTop:60}}><Spinner/></div>:(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>

          {/* ── VIDEOS ── */}
          {showVideos&&videos.map(video=>{
            const {clean,tags}=parseTags(video.title||"");
            const bg=VIDEO_THUMBS[hashIdx(video.id,VIDEO_THUMBS.length)];
            const isPlaying=playingId===video.id;
            return(
              <div key={video.id} style={{borderRadius:12,overflow:"hidden",position:"relative",background:bg,border:"1px solid rgba(255,255,255,0.07)"}}>
                {/* video player */}
                {video.url&&(
                  <div style={{position:"relative",paddingTop:"56.25%"}}>
                    <video
                      src={video.url}
                      controls
                      playsInline
                      style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",background:"#000"}}
                    />
                  </div>
                )}
                {!video.url&&(
                  <div style={{paddingTop:"56.25%",position:"relative"}}>
                    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:bg}}>
                      <span style={{color:"rgba(255,255,255,0.3)",fontSize:40}}>▶</span>
                    </div>
                  </div>
                )}
                {/* info bar */}
                <div style={{padding:"10px 14px",background:"rgba(0,0,0,0.6)",backdropFilter:"blur(10px)"}}>
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10}}>
                    <div style={{flex:1,minWidth:0}}>
                      {clean&&<p style={{color:"#fff",fontFamily:"'DM Serif Display',serif",fontSize:14,margin:"0 0 5px",fontWeight:400}}>{clean}</p>}
                      {tags.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:4}}>{tags.map(t=><HashtagBadge key={t} tag={t} onClick={onTagClick}/>)}</div>}
                    </div>
                    <button onClick={()=>handleLike(video,"videos")} style={{background:"none",border:"none",cursor:"pointer",color:liked[video.id]?"#f472b6":"rgba(255,255,255,0.5)",fontSize:12,padding:0,display:"flex",flexDirection:"column",alignItems:"center",gap:1,flexShrink:0}}>
                      <span style={{fontSize:18}}>{liked[video.id]?"♥":"♡"}</span>
                      <span>{fmtNum((video.likes||0)+(liked[video.id]?1:0))}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* ── ALBUMS GRID ── */}
          {showAlbums&&albums.length>0&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:showVideos&&videos.length?16:0}}>
              {albums.map(album=>{
                const g=PHOTO_GRADIENTS[hashIdx(album.id,PHOTO_GRADIENTS.length)];
                const {clean,tags}=parseTags(album.title||"");
                return(
                  <div key={album.id} onClick={()=>setLightbox(album)} style={{background:g.bg,borderRadius:10,overflow:"hidden",cursor:"pointer",position:"relative"}}>
                    <div style={{paddingTop:"120%",position:"relative"}}>
                      {album.coverUrl&&<img src={album.coverUrl} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>}
                      <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.85) 100%)"}}/>
                      <div style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,0.6)",borderRadius:20,padding:"2px 8px",fontSize:10,color:"rgba(255,255,255,0.7)",fontFamily:"monospace"}}>{album.photoCount||0} ✦</div>
                      <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"10px"}}>
                        {clean&&<p style={{color:"#fff",fontFamily:"'DM Serif Display',serif",fontSize:13,margin:"0 0 4px",fontWeight:400}}>{clean}</p>}
                        {tags.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:3}}>{tags.slice(0,2).map(t=><HashtagBadge key={t} tag={t}/>)}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading&&videos.length===0&&albums.length===0&&(
            <div style={{textAlign:"center",color:"rgba(255,255,255,0.3)",marginTop:40,fontFamily:"'DM Serif Display',serif",fontSize:18}}>Sem resultados para #{tag}</div>
          )}
        </div>
      )}
      {lightbox&&<AlbumLightbox album={lightbox} onClose={()=>setLightbox(null)} liked={!!liked[lightbox.id]} onLike={()=>handleLike(lightbox,"albums")} onTagClick={onTagClick}/>}
    </div>
  );
}

// ── ADMIN PANEL ───────────────────────────────────────────────────────────────
function AdminPanel({adminPassword}){
  const [tab,setTab]=useState("videos");
  const [libFilter,setLibFilter]=useState("all");
  const [library,setLibrary]=useState({videos:[],albums:[]});
  const [videoForm,setVideoForm]=useState({title:"",file:null});
  const [albumForm,setAlbumForm]=useState({title:"",files:[]});
  const [draggingV,setDraggingV]=useState(false);
  const [draggingP,setDraggingP]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [toast,setToast]=useState(null);
  const fileRefV=useRef(null),fileRefP=useRef(null);
  const showToast=(msg,ok=true)=>{setToast({msg,ok});setTimeout(()=>setToast(null),3000);};
  const loadLibrary=useCallback(()=>{fetch(`${API}/admin/library`,{headers:{"x-admin-password":adminPassword}}).then(r=>r.json()).then(setLibrary).catch(()=>{});},[adminPassword]);
  useEffect(()=>{if(tab==="library")loadLibrary();},[tab,loadLibrary]);
  const uploadVideo=async()=>{if(!videoForm.title.trim()||!videoForm.file)return showToast("Preencha título e selecione um vídeo",false);setUploading(true);try{const fd=new FormData();fd.append("file",videoForm.file);fd.append("title",videoForm.title);const res=await fetch(`${API}/admin/videos`,{method:"POST",headers:{"x-admin-password":adminPassword},body:fd});if(!res.ok)throw new Error((await res.json()).error);showToast("Vídeo publicado! ✓");setVideoForm({title:"",file:null});}catch(e){showToast(e.message,false);}setUploading(false);};
  const uploadAlbum=async()=>{if(!albumForm.title.trim()||!albumForm.files.length)return showToast("Preencha título e selecione as fotos",false);setUploading(true);try{const fd=new FormData();fd.append("title",albumForm.title);albumForm.files.forEach(f=>fd.append("files",f));const res=await fetch(`${API}/admin/albums`,{method:"POST",headers:{"x-admin-password":adminPassword},body:fd});if(!res.ok)throw new Error((await res.json()).error);showToast("Álbum publicado! ✓");setAlbumForm({title:"",files:[]});}catch(e){showToast(e.message,false);}setUploading(false);};
  const deleteItem=async(type,id)=>{await fetch(`${API}/admin/${type}/${id}`,{method:"DELETE",headers:{"x-admin-password":adminPassword}});loadLibrary();showToast("Deletado");};
  const inputStyle={width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"10px 14px",color:"#fff",fontSize:15,outline:"none",boxSizing:"border-box"};
  const labelStyle={display:"block",color:"rgba(255,255,255,0.45)",fontSize:11,letterSpacing:1,marginBottom:6,fontFamily:"monospace"};
  return(
    <div style={{height:"100%",overflowY:"auto",background:"#080810",position:"relative"}}>
      {toast&&<div style={{position:"fixed",top:20,right:20,background:toast.ok?"#1a3a1a":"#3a1a1a",border:`1px solid ${toast.ok?"#4ade80":"#f87171"}40`,borderRadius:10,padding:"12px 20px",color:toast.ok?"#4ade80":"#f87171",fontSize:14,zIndex:300}}>{toast.msg}</div>}
      <div style={{borderBottom:"1px solid rgba(255,255,255,0.07)",padding:"20px 24px 0"}}>
        <p style={{color:"rgba(255,255,255,0.3)",fontSize:10,letterSpacing:3,fontFamily:"monospace",marginBottom:6}}>ADMIN PANEL</p>
        <h2 style={{color:"#fff",fontFamily:"'DM Serif Display',serif",fontSize:26,margin:"0 0 20px",fontWeight:400}}>Content Manager</h2>
        <div style={{display:"flex"}}>{[["videos","▶ Vídeos"],["albums","✦ Álbuns"],["library","Library"]].map(([key,label])=><button key={key} onClick={()=>setTab(key)} style={{background:"none",border:"none",borderBottom:`2px solid ${tab===key?"#c084fc":"transparent"}`,color:tab===key?"#c084fc":"rgba(255,255,255,0.4)",cursor:"pointer",padding:"8px 20px 12px",fontSize:14}}>{label}</button>)}</div>
      </div>
      <div style={{padding:24}}>
        {tab==="videos"&&<div>
          <p style={{color:"rgba(255,255,255,0.4)",fontSize:12,marginBottom:16}}>Use hashtags: <span style={{color:"rgba(255,255,255,0.7)",fontFamily:"monospace"}}>#tag1 #tag2 descrição</span></p>
          <div onDragOver={e=>{e.preventDefault();setDraggingV(true);}} onDragLeave={()=>setDraggingV(false)} onDrop={e=>{e.preventDefault();setDraggingV(false);const f=e.dataTransfer.files[0];if(f)setVideoForm(x=>({...x,file:f}));}} onClick={()=>fileRefV.current?.click()} style={{border:`2px dashed ${draggingV?"#c084fc":"rgba(255,255,255,0.12)"}`,borderRadius:14,padding:"36px 24px",textAlign:"center",cursor:"pointer",marginBottom:20}}>
            <input ref={fileRefV} type="file" accept="video/*" style={{display:"none"}} onChange={e=>e.target.files[0]&&setVideoForm(x=>({...x,file:e.target.files[0]}))}/>
            <div style={{fontSize:34,marginBottom:10}}>▶</div>
            <p style={{color:"rgba(255,255,255,0.6)",margin:"0 0 4px",fontSize:15}}>{videoForm.file?`✓ ${videoForm.file.name}`:"Drag & drop do vídeo aqui"}</p>
            <p style={{color:"rgba(255,255,255,0.25)",margin:0,fontSize:12}}>MP4 · MOV · WEBM · max 200MB</p>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div><label style={labelStyle}>TÍTULO / HASHTAGS</label><input value={videoForm.title} onChange={e=>setVideoForm(x=>({...x,title:e.target.value}))} placeholder="#tag1 #tag2 descrição..." style={inputStyle}/></div>
            <button onClick={uploadVideo} disabled={uploading} style={{background:uploading?"rgba(124,58,237,0.4)":"linear-gradient(135deg,#7c3aed,#c084fc)",border:"none",borderRadius:8,padding:"12px 24px",color:"#fff",fontSize:15,cursor:uploading?"not-allowed":"pointer",fontFamily:"'DM Serif Display',serif",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>{uploading?<><Spinner size={20}/> Enviando...</>:"Publicar Vídeo"}</button>
          </div>
        </div>}
        {tab==="albums"&&<div>
          <p style={{color:"rgba(255,255,255,0.4)",fontSize:12,marginBottom:16}}>Selecione várias fotos de uma vez.</p>
          <div onDragOver={e=>{e.preventDefault();setDraggingP(true);}} onDragLeave={()=>setDraggingP(false)} onDrop={e=>{e.preventDefault();setDraggingP(false);const files=Array.from(e.dataTransfer.files).filter(f=>f.type.startsWith("image/"));if(files.length)setAlbumForm(x=>({...x,files}));}} onClick={()=>fileRefP.current?.click()} style={{border:`2px dashed ${draggingP?"#67e8f9":"rgba(255,255,255,0.12)"}`,borderRadius:14,padding:"36px 24px",textAlign:"center",cursor:"pointer",marginBottom:20}}>
            <input ref={fileRefP} type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>{const files=Array.from(e.target.files);if(files.length)setAlbumForm(x=>({...x,files}));}}/>
            <div style={{fontSize:34,marginBottom:10}}>✦</div>
            <p style={{color:"rgba(255,255,255,0.6)",margin:"0 0 4px",fontSize:15}}>{albumForm.files.length>0?`✓ ${albumForm.files.length} foto(s)`:"Drag & drop das fotos aqui"}</p>
            <p style={{color:"rgba(255,255,255,0.25)",margin:0,fontSize:12}}>JPG · PNG · WEBP · várias de uma vez</p>
          </div>
          {albumForm.files.length>0&&<div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>{albumForm.files.slice(0,8).map((f,i)=><div key={i} style={{width:52,height:52,borderRadius:6,overflow:"hidden",border:"1px solid rgba(255,255,255,0.1)"}}><img src={URL.createObjectURL(f)} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>)}{albumForm.files.length>8&&<div style={{width:52,height:52,borderRadius:6,background:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"rgba(255,255,255,0.5)"}}>+{albumForm.files.length-8}</div>}</div>}
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div><label style={labelStyle}>TÍTULO / HASHTAGS</label><input value={albumForm.title} onChange={e=>setAlbumForm(x=>({...x,title:e.target.value}))} placeholder="#tag1 #tag2 descrição..." style={inputStyle}/></div>
            <button onClick={uploadAlbum} disabled={uploading} style={{background:uploading?"rgba(8,145,178,0.4)":"linear-gradient(135deg,#0891b2,#67e8f9)",border:"none",borderRadius:8,padding:"12px 24px",color:"#fff",fontSize:15,cursor:uploading?"not-allowed":"pointer",fontFamily:"'DM Serif Display',serif",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>{uploading?<><Spinner size={20} color="#67e8f9"/> Enviando...</>:`Publicar Álbum (${albumForm.files.length} foto${albumForm.files.length!==1?"s":""})`}</button>
          </div>
        </div>}
        {tab==="library"&&<div>
          <div style={{display:"flex",gap:6,marginBottom:20}}>{[["all","Tudo"],["video","Vídeos"],["album","Álbuns"]].map(([v,l])=><button key={v} onClick={()=>setLibFilter(v)} style={{background:libFilter===v?"rgba(192,132,252,0.15)":"transparent",border:`1px solid ${libFilter===v?"rgba(192,132,252,0.4)":"rgba(255,255,255,0.1)"}`,borderRadius:20,padding:"5px 16px",color:libFilter===v?"#c084fc":"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:13}}>{l}</button>)}<span style={{marginLeft:"auto",color:"rgba(255,255,255,0.3)",fontSize:13,display:"flex",alignItems:"center"}}>{libFilter==="all"?(library.videos||[]).length+(library.albums||[]).length:libFilter==="video"?(library.videos||[]).length:(library.albums||[]).length} items</span></div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {libFilter!=="album"&&(library.videos||[]).map(video=>{const {clean,tags}=parseTags(video.title||"");return(<div key={video.id} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}><div style={{width:34,height:34,borderRadius:6,background:"rgba(124,58,237,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>▶</div><div style={{flex:1,minWidth:0}}><p style={{color:"#fff",fontSize:13,margin:"0 0 3px",fontFamily:"'DM Serif Display',serif",fontWeight:400,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{clean||"(sem título)"}</p><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{tags.slice(0,4).map(t=><HashtagBadge key={t} tag={t}/>)}</div></div><button onClick={()=>deleteItem("videos",video.id)} style={{background:"none",border:"1px solid rgba(255,80,80,0.2)",borderRadius:6,color:"rgba(255,100,100,0.6)",cursor:"pointer",padding:"3px 10px",fontSize:12,flexShrink:0}}>Delete</button></div>);})}
            {libFilter!=="video"&&(library.albums||[]).map(album=>{const {clean,tags}=parseTags(album.title||"");return(<div key={album.id} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}><div style={{width:34,height:34,borderRadius:6,overflow:"hidden",flexShrink:0}}>{album.coverUrl?<img src={album.coverUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",background:"rgba(103,232,249,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>✦</div>}</div><div style={{flex:1,minWidth:0}}><p style={{color:"#fff",fontSize:13,margin:"0 0 3px",fontFamily:"'DM Serif Display',serif",fontWeight:400,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{clean||"(sem título)"}</p><div style={{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}}>{tags.slice(0,3).map(t=><HashtagBadge key={t} tag={t}/>)}<span style={{color:"rgba(255,255,255,0.3)",fontSize:11}}>{album.photoCount} foto(s)</span></div></div><button onClick={()=>deleteItem("albums",album.id)} style={{background:"none",border:"1px solid rgba(255,80,80,0.2)",borderRadius:6,color:"rgba(255,100,100,0.6)",cursor:"pointer",padding:"3px 10px",fontSize:12,flexShrink:0}}>Delete</button></div>);})}
          </div>
        </div>}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App(){
  const [view,setView]=useState("explore");
  const [activeTag,setActiveTag]=useState(null);
  const [isAdmin,setIsAdmin]=useState(false);
  const [adminPassword,setAdminPassword]=useState("");
  const [adminPass,setAdminPass]=useState("");
  const [adminOpen,setAdminOpen]=useState(false);
  const [passError,setPassError]=useState(false);
  const [loginLoading,setLoginLoading]=useState(false);

  const goHome=()=>{setView("explore");setActiveTag(null);};
  const handleTagClick=(tag)=>{setActiveTag(tag);setView("tag-results");};
  const handleAdminLogin=async()=>{
    setLoginLoading(true);
    try{const res=await fetch(`${API}/admin/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:adminPass})});if(res.ok){setIsAdmin(true);setAdminPassword(adminPass);setAdminOpen(false);setView("admin");setPassError(false);setAdminPass("");}else setPassError(true);}catch{setPassError(true);}
    setLoginLoading(false);
  };

  const navItems=[{id:"explore",icon:"◈",label:"Explore"},{id:"gallery",icon:"✦",label:"Gallery"},{id:"tags",icon:"#",label:"Tags"}];

  return(
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
      <style>{`*{box-sizing:border-box;}body{margin:0;}@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      <div style={{display:"flex",height:"100vh",background:"#080810",fontFamily:"'DM Sans',sans-serif",overflow:"hidden"}}>

        {/* Sidebar */}
        <div style={{width:190,background:"rgba(0,0,0,0.6)",borderRight:"1px solid rgba(255,255,255,0.06)",display:"flex",flexDirection:"column",padding:"24px 0",flexShrink:0}}>
          <div style={{padding:"0 18px 24px"}}>
            <p style={{color:"rgba(255,255,255,0.25)",fontSize:9,letterSpacing:4,fontFamily:"monospace",margin:"0 0 4px"}}>AI STUDIO</p>
            {/* LUMINA clicável para home */}
            <button onClick={goHome} style={{background:"none",border:"none",padding:0,cursor:"pointer",textAlign:"left"}}>
              <p style={{color:"#fff",fontFamily:"'DM Serif Display',serif",fontSize:22,margin:0,fontWeight:400,transition:"opacity 0.2s"}}>Lumina</p>
            </button>
          </div>
          {activeTag&&(
            <div style={{margin:"0 10px 12px",background:"rgba(192,132,252,0.1)",border:"1px solid rgba(192,132,252,0.2)",borderRadius:8,padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{color:"#c084fc",fontSize:12,fontFamily:"monospace"}}>#{activeTag}</span>
              <button onClick={()=>{setActiveTag(null);setView("explore");}} style={{background:"none",border:"none",color:"rgba(255,255,255,0.3)",cursor:"pointer",fontSize:14,padding:0}}>×</button>
            </div>
          )}
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:2,padding:"0 10px"}}>
            {navItems.map(item=>(
              <button key={item.id} onClick={()=>setView(item.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:8,border:"none",background:view===item.id?"rgba(192,132,252,0.12)":"transparent",color:view===item.id?"#c084fc":"rgba(255,255,255,0.45)",cursor:"pointer",fontSize:14,textAlign:"left"}}>
                <span style={{fontSize:15}}>{item.icon}</span>{item.label}
              </button>
            ))}
          </div>
          <div style={{padding:"0 10px"}}>
            {isAdmin
              ?<button onClick={()=>setView("admin")} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:8,border:"none",background:view==="admin"?"rgba(192,132,252,0.12)":"transparent",color:view==="admin"?"#c084fc":"rgba(255,255,255,0.35)",cursor:"pointer",fontSize:14,width:"100%"}}>⚙ Admin</button>
              :<button onClick={()=>setAdminOpen(true)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:8,border:"none",background:"transparent",color:"rgba(255,255,255,0.2)",cursor:"pointer",fontSize:13,width:"100%"}}>🔒 Admin</button>
            }
          </div>
        </div>

        {/* Main */}
        <div style={{flex:1,position:"relative",overflow:"hidden"}}>
          {view==="explore"&&<ExploreView activeTag={activeTag} onTagClick={handleTagClick}/>}
          {view==="gallery"&&<GalleryView activeTag={activeTag} onTagClick={handleTagClick}/>}
          {view==="tags"&&<TagsView onTagClick={handleTagClick}/>}
          {view==="tag-results"&&activeTag&&<TagResultsView tag={activeTag} onBack={()=>setView("tags")} onTagClick={handleTagClick}/>}
          {view==="admin"&&isAdmin&&<AdminPanel adminPassword={adminPassword}/>}
        </div>

        {/* Admin modal */}
        {adminOpen&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
            <div style={{background:"#12121e",border:"1px solid rgba(255,255,255,0.1)",borderRadius:16,padding:32,width:320}}>
              <p style={{color:"rgba(255,255,255,0.4)",fontSize:11,letterSpacing:3,fontFamily:"monospace",marginBottom:8}}>RESTRICTED</p>
              <h3 style={{color:"#fff",fontFamily:"'DM Serif Display',serif",fontSize:22,margin:"0 0 24px",fontWeight:400}}>Admin Access</h3>
              <input type="password" value={adminPass} onChange={e=>{setAdminPass(e.target.value);setPassError(false);}} onKeyDown={e=>e.key==="Enter"&&handleAdminLogin()} placeholder="Password" style={{width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${passError?"rgba(255,80,80,0.5)":"rgba(255,255,255,0.1)"}`,borderRadius:8,padding:"10px 14px",color:"#fff",fontSize:14,outline:"none",marginBottom:passError?6:16}}/>
              {passError&&<p style={{color:"rgba(255,100,100,0.8)",fontSize:12,margin:"0 0 12px"}}>Senha incorreta</p>}
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
