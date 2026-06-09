import { useState, useEffect } from "react";

export default function AgeGate({ children }) {
  const [status, setStatus] = useState("loading"); // loading | pending | confirmed

  useEffect(() => {
    const confirmed = sessionStorage.getItem("lumina_age_confirmed");
    setStatus(confirmed === "yes" ? "confirmed" : "pending");
  }, []);

  const confirm = () => {
    sessionStorage.setItem("lumina_age_confirmed", "yes");
    setStatus("confirmed");
  };

  const deny = () => {
    window.location.href = "https://www.google.com";
  };

  if (status === "loading") return null;
  if (status === "confirmed") return children;

  return (
    <>
      <style>{`
        *{box-sizing:border-box;}body{margin:0;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
      <div style={{
        position:"fixed",inset:0,
        background:"linear-gradient(135deg,#080810 0%,#0d0020 50%,#080810 100%)",
        display:"flex",alignItems:"center",justifyContent:"center",
        fontFamily:"'DM Sans',sans-serif",zIndex:9999,padding:"20px"
      }}>
        {/* background glow */}
        <div style={{position:"absolute",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,58,237,0.15) 0%,transparent 70%)",top:"50%",left:"50%",transform:"translate(-50%,-50%)",pointerEvents:"none"}}/>

        <div style={{
          background:"rgba(255,255,255,0.03)",
          border:"1px solid rgba(255,255,255,0.08)",
          borderRadius:20,
          padding:"40px 36px",
          maxWidth:420,width:"100%",
          textAlign:"center",
          animation:"fadeIn 0.4s ease",
          position:"relative"
        }}>
          {/* icon */}
          <div style={{fontSize:48,marginBottom:16}}>🔞</div>

          {/* logo */}
          <p style={{color:"rgba(255,255,255,0.3)",fontSize:10,letterSpacing:4,fontFamily:"monospace",margin:"0 0 6px"}}>AI STUDIO</p>
          <p style={{color:"#fff",fontFamily:"'DM Serif Display',serif",fontSize:28,margin:"0 0 24px",fontWeight:400}}>Lumina</p>

          {/* warning box */}
          <div style={{
            background:"rgba(255,80,80,0.07)",
            border:"1px solid rgba(255,80,80,0.2)",
            borderRadius:12,
            padding:"14px 18px",
            marginBottom:24,
            textAlign:"left"
          }}>
            <p style={{color:"rgba(255,120,120,0.9)",fontSize:13,margin:"0 0 6px",fontWeight:600,letterSpacing:0.5}}>⚠ CONTEÚDO EXPLÍCITO</p>
            <p style={{color:"rgba(255,255,255,0.55)",fontSize:13,margin:0,lineHeight:1.6}}>
              Este site contém imagens e vídeos de natureza sexual explícita gerados por inteligência artificial. O acesso é <strong style={{color:"rgba(255,255,255,0.8)"}}>restrito a maiores de 18 anos</strong>.
            </p>
          </div>

          <p style={{color:"rgba(255,255,255,0.5)",fontSize:14,margin:"0 0 28px",lineHeight:1.6}}>
            Ao continuar, você confirma que tem <strong style={{color:"#fff"}}>18 anos ou mais</strong> e concorda em visualizar conteúdo adulto.
          </p>

          {/* buttons */}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <button onClick={confirm} style={{
              background:"linear-gradient(135deg,#7c3aed,#c084fc)",
              border:"none",borderRadius:12,padding:"14px 24px",
              color:"#fff",fontSize:15,cursor:"pointer",
              fontFamily:"'DM Serif Display',serif",letterSpacing:0.5,
              transition:"opacity 0.2s"
            }}>
              Tenho 18 anos ou mais — Entrar
            </button>
            <button onClick={deny} style={{
              background:"transparent",
              border:"1px solid rgba(255,255,255,0.1)",
              borderRadius:12,padding:"12px 24px",
              color:"rgba(255,255,255,0.4)",fontSize:14,cursor:"pointer",
              transition:"all 0.2s"
            }}>
              Sou menor de idade — Sair
            </button>
          </div>

          <p style={{color:"rgba(255,255,255,0.2)",fontSize:11,margin:"20px 0 0",lineHeight:1.5,fontFamily:"monospace"}}>
            Ao entrar você concorda com nossos termos de uso.<br/>Todo conteúdo é gerado por IA e fictício.
          </p>
        </div>
      </div>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
    </>
  );
}
