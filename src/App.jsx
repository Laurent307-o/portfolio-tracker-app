import{useState,useEffect,useCallback,useRef}from"react";
import{supabase}from"./supabaseClient";

/* ── helpers ── */
const fm=v=>(v||0).toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})+"€";
const PALETTE=["#3b82f6","#f59e0b","#8b5cf6","#ec4899","#10b981","#ef4444","#06b6d4","#f97316","#a3e635","#14b8a6","#e879f9","#fb923c"];
const S={page:{minHeight:"100vh",background:"#09091a",color:"#e0e0e0",fontFamily:"'Outfit',system-ui,sans-serif"},
card:{background:"#12122a",borderRadius:16,padding:"20px",border:"1px solid #ffffff08"},
inp:{background:"#0d0d20",border:"1px solid #333",borderRadius:10,padding:"12px 16px",color:"#f0f0f0",fontSize:14,width:"100%",boxSizing:"border-box",outline:"none",fontFamily:"inherit"},
btn:(ok,c="#3b82f6")=>({width:"100%",padding:"13px",borderRadius:10,border:"none",cursor:ok?"pointer":"default",fontSize:15,fontWeight:700,fontFamily:"inherit",background:ok?`linear-gradient(135deg,${c},${c}cc)`:"#222",color:ok?"#fff":"#555",transition:"all 0.3s"}),
};

/* ═══════════════════════════════════════════════
   AUTH SCREEN
   ═══════════════════════════════════════════════ */
function AuthScreen({onAuth}){
  const[mode,setMode]=useState("register");
  const[email,setEmail]=useState("");
  const[pass,setPass]=useState("");
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState("");

  const emailOk=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const rules=[{ok:pass.length>=8,l:"8 car."},{ok:/[A-Z]/.test(pass),l:"1 maj."},{ok:/[a-z]/.test(pass),l:"1 min."},{ok:/[0-9]/.test(pass),l:"1 chiffre"},{ok:/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass),l:"1 symbole"}];
  const passOk=mode==="login"?pass.length>=1:rules.every(r=>r.ok);
  const canSubmit=emailOk&&passOk;

  const submit=async()=>{
    if(!canSubmit)return;
    setLoading(true);setError("");
    try{
      if(mode==="register"){
        const{data,error:e}=await supabase.auth.signUp({email,password:pass});
        if(e)throw e;
        if(data?.user?.identities?.length===0)throw new Error("Cet email est déjà utilisé");
        onAuth(data.user);
      }else{
        const{data,error:e}=await supabase.auth.signInWithPassword({email,password:pass});
        if(e)throw e;
        onAuth(data.user);
      }
    }catch(e){setError(e.message)}
    finally{setLoading(false)}
  };

  const googleLogin=async()=>{
    setLoading(true);
    const{error:e}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:window.location.origin}});
    if(e){setError(e.message);setLoading(false)}
  };

  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:24}}>
      <div style={{width:"100%",maxWidth:360}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:64,height:64,borderRadius:16,background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:900,color:"#fff",marginBottom:12,boxShadow:"0 12px 40px #3b82f644"}}>P</div>
          <h1 style={{fontSize:22,fontWeight:800,margin:"0 0 2px",background:"linear-gradient(90deg,#60a5fa,#c084fc)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Portfolio Tracker</h1>
        </div>
        <h2 style={{fontSize:20,fontWeight:800,color:"#f0f0f0",marginBottom:4}}>{mode==="register"?"Créer un compte":"Se connecter"}</h2>
        <p style={{color:"#666",fontSize:12,marginBottom:24}}>{mode==="register"?"Gratuit, en 10 secondes":"Bon retour parmi nous"}</p>

        <button onClick={googleLogin} disabled={loading} style={{width:"100%",padding:"12px",borderRadius:10,border:"1px solid #333",background:"#0d0d20",color:"#f0f0f0",fontSize:14,fontWeight:600,fontFamily:"inherit",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:20}}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          {loading?"Connexion...":"Continuer avec Google"}
        </button>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}><div style={{flex:1,height:1,background:"#222"}}/><span style={{color:"#555",fontSize:11}}>ou par email</span><div style={{flex:1,height:1,background:"#222"}}/></div>

        <div style={{marginBottom:12}}>
          <label style={{fontSize:11,color:"#888",marginBottom:4,display:"block"}}>Email</label>
          <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setError("")}} placeholder="votre@email.com" style={{...S.inp,borderColor:email&&!emailOk?"#f87171":email&&emailOk?"#4ade80":"#333"}}/>
          {email&&!emailOk&&<div style={{fontSize:10,color:"#f87171",marginTop:4}}>Format email invalide</div>}
        </div>
        <div style={{marginBottom:6}}>
          <label style={{fontSize:11,color:"#888",marginBottom:4,display:"block"}}>Mot de passe</label>
          <input type="password" value={pass} onChange={e=>{setPass(e.target.value);setError("")}} placeholder="••••••••" style={{...S.inp,borderColor:pass&&!passOk?"#f87171":pass&&passOk?"#4ade80":"#333"}} onKeyDown={e=>e.key==="Enter"&&submit()}/>
        </div>
        {mode==="register"&&pass.length>0&&(
          <div style={{marginTop:6,marginBottom:6}}>
            <div style={{display:"flex",gap:3,marginBottom:6}}>
              {[1,2,3,4,5].map(i=>{const f=rules.filter(r=>r.ok).length;return<div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=f?(f<=2?"#f87171":f<=3?"#f59e0b":"#4ade80"):"#222",transition:"all 0.3s"}}/>})}
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
              {rules.map((r,i)=><span key={i} style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:r.ok?"#4ade8015":"#f8717115",color:r.ok?"#4ade80":"#f87171"}}>{r.ok?"✓":"×"} {r.l}</span>)}
            </div>
          </div>
        )}
        {error&&<div style={{fontSize:11,color:"#f87171",marginBottom:8,padding:"6px 10px",background:"#f8717111",borderRadius:6}}>{error}</div>}
        <div style={{marginBottom:16}}/>

        <button onClick={submit} disabled={!canSubmit||loading} style={S.btn(canSubmit,"#3b82f6")}>
          {loading?"Connexion...":mode==="register"?"Créer mon compte":"Se connecter"}
        </button>
        <p style={{textAlign:"center",marginTop:20,fontSize:12,color:"#666"}}>
          {mode==="register"?"Déjà un compte ? ":"Pas encore de compte ? "}
          <span onClick={()=>{setMode(mode==="register"?"login":"register");setPass("");setError("")}} style={{color:"#60a5fa",cursor:"pointer",fontWeight:600}}>
            {mode==="register"?"Se connecter":"S'inscrire"}
          </span>
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ADD PORTFOLIO SCREEN
   ═══════════════════════════════════════════════ */
function AddPortfolio({user,onCreated}){
  const[name,setName]=useState("");
  const[color,setColor]=useState("#3b82f6");
  const[type,setType]=useState("PEA");
  const[broker,setBroker]=useState("");
  const[loading,setLoading]=useState(false);

  const create=async()=>{
    if(!name.trim())return;
    setLoading(true);
    const{data,error}=await supabase.from("portfolios").insert({user_id:user.id,name:name.trim(),color,account_type:type,broker:broker.trim()||null}).select().single();
    setLoading(false);
    if(!error&&data)onCreated(data);
  };

  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:24}}>
      <div style={{width:"100%",maxWidth:400}}>
        <h2 style={{fontSize:22,fontWeight:800,color:"#f0f0f0",marginBottom:6}}>Créer un portefeuille</h2>
        <p style={{color:"#666",fontSize:12,marginBottom:24}}>Vous pourrez ajouter vos positions ensuite</p>

        <div style={{marginBottom:12}}>
          <label style={{fontSize:11,color:"#888",marginBottom:4,display:"block"}}>Nom du portefeuille</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Ex: PEA Fortuneo" style={S.inp}/>
        </div>
        <div style={{marginBottom:12}}>
          <label style={{fontSize:11,color:"#888",marginBottom:4,display:"block"}}>Type de compte</label>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {["PEA","CTO","AV","PER","Autre"].map(t=><button key={t} onClick={()=>setType(t)} style={{padding:"8px 16px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit",background:type===t?"#3b82f6":"#0d0d20",color:type===t?"#fff":"#888"}}>{t}</button>)}
          </div>
        </div>
        <div style={{marginBottom:12}}>
          <label style={{fontSize:11,color:"#888",marginBottom:4,display:"block"}}>Courtier (optionnel)</label>
          <input value={broker} onChange={e=>setBroker(e.target.value)} placeholder="Ex: Fortuneo, Boursorama..." style={S.inp}/>
        </div>
        <div style={{marginBottom:24}}>
          <label style={{fontSize:11,color:"#888",marginBottom:8,display:"block"}}>Couleur</label>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {PALETTE.map(c=><div key={c} onClick={()=>setColor(c)} style={{width:32,height:32,borderRadius:10,background:c,cursor:"pointer",border:color===c?"3px solid #fff":"3px solid transparent",transform:color===c?"scale(1.15)":"scale(1)",transition:"all 0.2s",opacity:color===c?1:0.5}}/>)}
          </div>
        </div>

        {/* Preview */}
        <div style={{...S.card,border:`1px solid ${color}33`,marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:16,fontWeight:800,color}}>{name||"Mon portefeuille"}</div>
            <div style={{fontSize:10,color:"#888",background:"#0d0d20",padding:"4px 10px",borderRadius:6}}>{type}{broker?` · ${broker}`:""}</div>
          </div>
        </div>

        <button onClick={create} disabled={!name.trim()||loading} style={S.btn(!!name.trim(),color)}>
          {loading?"Création...":"Créer le portefeuille"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CHOIX MÉTHODE : Scanner ou Manuel  (Sprint 2)
   ═══════════════════════════════════════════════ */
function AddPositionChoice({portfolio,onPick,onBack}){
  const Opt=({icon,title,desc,badge,onClick,color})=>(
    <div onClick={onClick} style={{...S.card,cursor:"pointer",border:`1px solid ${color}44`,marginBottom:12,transition:"all 0.2s"}}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:48,height:48,borderRadius:12,background:`${color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{icon}</div>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
            <span style={{fontSize:15,fontWeight:800,color:"#f0f0f0"}}>{title}</span>
            {badge&&<span style={{fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:4,background:`${color}33`,color}}>{badge}</span>}
          </div>
          <div style={{fontSize:11,color:"#888"}}>{desc}</div>
        </div>
        <div style={{color:color,fontSize:20,fontWeight:300}}>›</div>
      </div>
    </div>
  );
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:24}}>
      <div style={{width:"100%",maxWidth:420}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"#666",fontSize:12,cursor:"pointer",fontFamily:"inherit",marginBottom:16}}>← Retour</button>
        <h2 style={{fontSize:20,fontWeight:800,color:"#f0f0f0",marginBottom:6}}>Ajouter des positions</h2>
        <p style={{color:"#666",fontSize:12,marginBottom:20}}>dans <span style={{color:portfolio.color,fontWeight:700}}>{portfolio.name}</span></p>
        <Opt icon="📸" title="Scanner une capture d'écran" desc="Upload d'une ou plusieurs photos de ton courtier, IA extraction automatique" badge="IA" color="#8b5cf6" onClick={()=>onPick("scan")}/>
        <Opt icon="✍️" title="Saisir manuellement" desc="Formulaire classique (ISIN, quantité, PRU)" color="#3b82f6" onClick={()=>onPick("manual")}/>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SCAN SCREEN — upload multi-photos + appel /api/scan
   ═══════════════════════════════════════════════ */
function ScanScreen({user,portfolio,onExtracted,onBack}){
  const[files,setFiles]=useState([]); // [{id, dataUrl, name, size}]
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState("");
  const inputRef=useRef(null);

  const handleFiles=async(list)=>{
    setError("");
    const arr=Array.from(list||[]);
    if(files.length+arr.length>8){setError("Max 8 photos par scan");return}
    const next=[];
    for(const f of arr){
      if(!f.type.startsWith("image/")){setError("Fichier non image ignoré");continue}
      if(f.size>5*1024*1024){setError(`${f.name} trop volumineux (max 5 Mo)`);continue}
      const dataUrl=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(f)});
      next.push({id:Math.random().toString(36).slice(2),dataUrl,name:f.name,size:f.size});
    }
    setFiles(f=>[...f,...next]);
  };

  const remove=(id)=>setFiles(f=>f.filter(x=>x.id!==id));

  const scan=async()=>{
    if(!files.length)return;
    setLoading(true);setError("");
    try{
      const r=await fetch("/api/scan",{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({images:files.map(f=>f.dataUrl)})
      });
      const d=await r.json();
      if(!r.ok)throw new Error(d.error||"Erreur serveur");
      if(!d.positions?.length){setError("Aucune position détectée. Vérifie que les captures sont lisibles.");setLoading(false);return}
      onExtracted(d.positions);
    }catch(e){setError(e.message);setLoading(false)}
  };

  return(
    <div style={{maxWidth:500,margin:"0 auto",padding:"24px 16px 80px"}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:"#666",fontSize:12,cursor:"pointer",fontFamily:"inherit",marginBottom:16}}>← Retour</button>
      <h2 style={{fontSize:20,fontWeight:800,color:"#f0f0f0",marginBottom:6}}>📸 Scanner tes positions</h2>
      <p style={{color:"#666",fontSize:12,marginBottom:20}}>Jusqu'à 8 captures d'écran de ton courtier — L'IA extrait ISIN, nom, quantité, PRU.</p>

      {/* Zone d'upload */}
      <label htmlFor="scan-input" style={{display:"block",cursor:"pointer"}}>
        <div style={{...S.card,border:"2px dashed #8b5cf644",textAlign:"center",padding:"32px 16px",marginBottom:16,background:"#8b5cf608"}}>
          <div style={{fontSize:36,marginBottom:8}}>📤</div>
          <div style={{fontSize:14,fontWeight:700,color:"#c4b5fd",marginBottom:4}}>Ajouter des captures d'écran</div>
          <div style={{fontSize:11,color:"#666"}}>PNG, JPG — max 5 Mo / photo — max 8 photos</div>
        </div>
      </label>
      <input ref={inputRef} id="scan-input" type="file" accept="image/*" multiple capture="environment" onChange={e=>handleFiles(e.target.files)} style={{display:"none"}}/>

      {/* Previews */}
      {files.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))",gap:8,marginBottom:16}}>
          {files.map(f=>(
            <div key={f.id} style={{position:"relative",aspectRatio:"1",borderRadius:10,overflow:"hidden",border:"1px solid #333",background:"#0d0d20"}}>
              <img src={f.dataUrl} alt={f.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              <button onClick={()=>remove(f.id)} style={{position:"absolute",top:4,right:4,width:22,height:22,borderRadius:11,border:"none",background:"#000a",color:"#fff",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>×</button>
            </div>
          ))}
        </div>
      )}

      {error&&<div style={{fontSize:11,color:"#f87171",marginBottom:12,padding:"8px 12px",background:"#f8717111",borderRadius:8}}>{error}</div>}

      <button onClick={scan} disabled={!files.length||loading} style={S.btn(files.length>0&&!loading,"#8b5cf6")}>
        {loading?"🤖 Analyse en cours (~10-20s)...":`Lancer le scan (${files.length})`}
      </button>

      <p style={{fontSize:10,color:"#555",textAlign:"center",marginTop:14}}>Tes images sont envoyées à Claude (Anthropic) pour extraction puis supprimées — elles ne sont pas stockées.</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   REVIEW SCREEN — validation/édition avant insertion
   ═══════════════════════════════════════════════ */
function ReviewScreen({user,portfolio,extracted,onDone,onBack}){
  const[rows,setRows]=useState(()=>extracted.map((p,i)=>({
    id:i,
    keep:true,
    isin:p.isin||"",
    name:p.name||"",
    ticker:p.ticker||"",
    quantity:p.quantity!=null?String(p.quantity):"",
    pru:p.pru!=null?String(p.pru):"",
    needsVerification:!!p.needsVerification,
    warning:p.warning||"",
    suggestedName:p.suggestedName||"",
  })));
  const[saving,setSaving]=useState(false);
  const[error,setError]=useState("");

  const upd=(id,field,val)=>setRows(rs=>rs.map(r=>r.id===id?{...r,[field]:val}:r));

  // Validation format ISIN (12 chars, 2 lettres pays + 9 alphanumériques + 1 check digit Luhn)
  const isIsinFormatOk=s=>typeof s==="string"&&/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(s);
  const isIsinChecksumOk=s=>{
    if(!isIsinFormatOk(s))return false;
    // Convertir chaque lettre en nombre (A=10, B=11, ..., Z=35), puis appliquer Luhn
    const digits=s.split("").map(c=>{
      const code=c.charCodeAt(0);
      if(code>=48&&code<=57)return c;// 0-9
      return String(code-55);// A=65 → 10
    }).join("");
    let sum=0,alt=false;
    for(let i=digits.length-1;i>=0;i--){
      let n=parseInt(digits[i],10);
      if(alt){n*=2;if(n>9)n-=9;}
      sum+=n;alt=!alt;
    }
    return sum%10===0;
  };
  const isIsinValid=s=>isIsinFormatOk((s||"").toUpperCase().trim())&&isIsinChecksumOk((s||"").toUpperCase().trim());

  const valid=r=>r.keep&&isIsinValid(r.isin)&&r.name&&Number(r.quantity)>0&&Number(r.pru)>0;
  const kept=rows.filter(r=>r.keep);
  const allValid=kept.length>0&&kept.every(valid);

  const save=async()=>{
    // Contrôle à la validation : détecter les ISIN manquants ou invalides
    const missing=kept.filter(r=>!r.isin||!r.isin.trim());
    if(missing.length>0){
      setError(`ISIN manquant pour ${missing.length} position${missing.length>1?"s":""} — merci de remplir tous les ISIN avant de valider.`);
      return;
    }
    const invalid=kept.filter(r=>!isIsinValid(r.isin));
    if(invalid.length>0){
      setError(`ISIN non connu, merci d'indiquer un ISIN correct (${invalid.map(r=>r.name).join(", ")})`);
      return;
    }
    if(!allValid){
      setError("Certains champs sont invalides ou manquants.");
      return;
    }
    setSaving(true);setError("");
    const payload=kept.map(r=>({
      portfolio_id:portfolio.id,
      user_id:user.id,
      isin:r.isin.toUpperCase().trim(),
      name:r.name.trim(),
      ticker:r.ticker||null,
      quantity:Number(r.quantity),
      pru:Number(r.pru),
      first_buy_date:new Date().toISOString().split("T")[0]
    }));
    const{error:e}=await supabase.from("positions").insert(payload);
    setSaving(false);
    if(e){setError(e.message)}else{onDone(payload.length)}
  };

  return(
    <div style={{maxWidth:640,margin:"0 auto",padding:"24px 16px 80px"}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:"#666",fontSize:12,cursor:"pointer",fontFamily:"inherit",marginBottom:16}}>← Retour</button>
      <h2 style={{fontSize:20,fontWeight:800,color:"#f0f0f0",marginBottom:6}}>✓ Vérifier les positions</h2>
      <p style={{color:"#666",fontSize:12,marginBottom:20}}>{rows.length} positions extraites — Décoche, corrige, puis confirme pour ajouter à <span style={{color:portfolio.color,fontWeight:700}}>{portfolio.name}</span>.</p>

      {rows.map(r=>(
        <div key={r.id} style={{...S.card,marginBottom:10,padding:14,opacity:r.keep?1:0.45,border:`1px solid ${r.keep?(valid(r)?"#4ade8033":"#f5970033"):"#33333355"}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <input type="checkbox" checked={r.keep} onChange={e=>upd(r.id,"keep",e.target.checked)} style={{width:18,height:18,accentColor:portfolio.color,cursor:"pointer"}}/>
            <input value={r.name} onChange={e=>upd(r.id,"name",e.target.value)} placeholder="Nom du titre" style={{...S.inp,padding:"8px 12px",fontSize:13,fontWeight:700}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1.4fr 0.8fr 0.8fr",gap:8}}>
            <div>
              <label style={{fontSize:9,color:"#555",textTransform:"uppercase"}}>ISIN</label>
              <input value={r.isin} onChange={e=>upd(r.id,"isin",e.target.value.toUpperCase())} style={{...S.inp,padding:"6px 10px",fontSize:11,fontFamily:"monospace"}}/>
            </div>
            <div>
              <label style={{fontSize:9,color:"#555",textTransform:"uppercase"}}>Quantité</label>
              <input type="number" value={r.quantity} onChange={e=>upd(r.id,"quantity",e.target.value)} style={{...S.inp,padding:"6px 10px",fontSize:12}}/>
            </div>
            <div>
              <label style={{fontSize:9,color:"#555",textTransform:"uppercase"}}>PRU (€)</label>
              <input type="number" step="0.01" value={r.pru} onChange={e=>upd(r.id,"pru",e.target.value)} style={{...S.inp,padding:"6px 10px",fontSize:12}}/>
            </div>
          </div>
          {r.needsVerification&&r.warning&&<div style={{fontSize:11,color:"#f59e0b",marginTop:8,padding:"8px 12px",background:"#f59e0b15",border:"1px solid #f59e0b55",borderRadius:6,fontWeight:600}}>⚠️ {r.warning}{r.ticker?` (ticker ${r.ticker}${r.suggestedName?` — ${r.suggestedName}`:""})`:""}</div>}
          {r.keep&&r.isin&&!isIsinFormatOk(r.isin.toUpperCase().trim())&&<div style={{fontSize:10,color:"#f87171",marginTop:6}}>✗ Format ISIN incorrect (attendu : 2 lettres pays + 10 caractères alphanumériques, 12 au total)</div>}
          {r.keep&&r.isin&&isIsinFormatOk(r.isin.toUpperCase().trim())&&!isIsinChecksumOk(r.isin.toUpperCase().trim())&&<div style={{fontSize:10,color:"#f87171",marginTop:6}}>✗ ISIN au bon format mais checksum invalide — cet ISIN n'existe pas</div>}
          {r.keep&&(!r.quantity||!r.pru)&&<div style={{fontSize:10,color:"#f59e0b",marginTop:6}}>⚠ Quantité ou PRU manquant</div>}
          {r.ticker&&!r.needsVerification&&<div style={{fontSize:9,color:"#4ade80",marginTop:6}}>✓ Ticker Yahoo reconnu : {r.ticker}</div>}
        </div>
      ))}

      {error&&<div style={{fontSize:11,color:"#f87171",marginBottom:12,padding:"8px 12px",background:"#f8717111",borderRadius:8}}>{error}</div>}

      <div style={{position:"sticky",bottom:0,background:"linear-gradient(to top,#09091a,#09091aee 70%,transparent)",padding:"16px 0",marginTop:16}}>
        <button onClick={save} disabled={saving||kept.length===0} style={S.btn(!saving&&kept.length>0,portfolio.color)}>
          {saving?"Enregistrement...":`Confirmer ${kept.length} position${kept.length>1?"s":""}`}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ADD POSITION SCREEN (saisie manuelle)
   ═══════════════════════════════════════════════ */
function AddPosition({user,portfolio,onAdded,onBack}){
  const[isin,setIsin]=useState("");
  const[name,setName]=useState("");
  const[qty,setQty]=useState("");
  const[pru,setPru]=useState("");
  const[stopLoss,setStopLoss]=useState("");
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState("");

  const canSubmit=isin.length>=10&&name&&qty&&pru;

  const submit=async()=>{
    if(!canSubmit)return;
    setLoading(true);setError("");
    const{error:e}=await supabase.from("positions").insert({
      portfolio_id:portfolio.id,user_id:user.id,isin:isin.toUpperCase().trim(),
      name:name.trim(),quantity:Number(qty),pru:Number(pru),
      stop_loss:stopLoss?Number(stopLoss):null,first_buy_date:new Date().toISOString().split("T")[0]
    });
    setLoading(false);
    if(e){setError(e.message)}else{onAdded()}
  };

  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:24}}>
      <div style={{width:"100%",maxWidth:400}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"#666",fontSize:12,cursor:"pointer",fontFamily:"inherit",marginBottom:16}}>← Retour</button>
        <h2 style={{fontSize:20,fontWeight:800,color:"#f0f0f0",marginBottom:6}}>Ajouter une position</h2>
        <p style={{color:"#666",fontSize:12,marginBottom:24}}>dans <span style={{color:portfolio.color,fontWeight:700}}>{portfolio.name}</span></p>

        <div style={{marginBottom:12}}>
          <label style={{fontSize:11,color:"#888",marginBottom:4,display:"block"}}>Code ISIN *</label>
          <input value={isin} onChange={e=>setIsin(e.target.value.toUpperCase())} placeholder="Ex: FR0000121329" style={S.inp}/>
        </div>
        <div style={{marginBottom:12}}>
          <label style={{fontSize:11,color:"#888",marginBottom:4,display:"block"}}>Nom du titre *</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Ex: THALES, Amundi MSCI World..." style={S.inp}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <div>
            <label style={{fontSize:11,color:"#888",marginBottom:4,display:"block"}}>Quantité *</label>
            <input type="number" value={qty} onChange={e=>setQty(e.target.value)} placeholder="Ex: 12" style={S.inp}/>
          </div>
          <div>
            <label style={{fontSize:11,color:"#888",marginBottom:4,display:"block"}}>PRU (€) *</label>
            <input type="number" step="0.01" value={pru} onChange={e=>setPru(e.target.value)} placeholder="Ex: 193.90" style={S.inp}/>
          </div>
        </div>
        <div style={{marginBottom:20}}>
          <label style={{fontSize:11,color:"#888",marginBottom:4,display:"block"}}>Stop Loss (€) <span style={{color:"#555"}}>optionnel</span></label>
          <input type="number" step="0.01" value={stopLoss} onChange={e=>setStopLoss(e.target.value)} placeholder="Ex: 180.00" style={S.inp}/>
        </div>
        {error&&<div style={{fontSize:11,color:"#f87171",marginBottom:12,padding:"6px 10px",background:"#f8717111",borderRadius:6}}>{error}</div>}
        <button onClick={submit} disabled={!canSubmit||loading} style={S.btn(canSubmit,portfolio.color)}>
          {loading?"Ajout...":"Ajouter la position"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════ */
function Dashboard({user,onLogout}){
  const[portfolios,setPortfolios]=useState([]);
  const[positions,setPositions]=useState([]);
  const[prices,setPrices]=useState({});
  const[loading,setLoading]=useState(true);
  const[screen,setScreen]=useState("dash"); // dash | addPort | choice | scan | review | manual
  const[selPort,setSelPort]=useState(null);
  const[extracted,setExtracted]=useState([]);
  const[tab,setTab]=useState("synth");
  const[toast,setToast]=useState("");

  const load=useCallback(async()=>{
    setLoading(true);
    const[{data:p},{data:pos}]=await Promise.all([
      supabase.from("portfolios").select("*").eq("user_id",user.id).order("created_at"),
      supabase.from("positions").select("*").eq("user_id",user.id)
    ]);
    setPortfolios(p||[]);
    setPositions(pos||[]);
    const tickers=[...new Set((pos||[]).map(p=>p.ticker).filter(Boolean))];
    if(tickers.length){
      try{
        const r=await fetch(`/api/prices?tickers=${tickers.join(",")}`);
        const d=await r.json();
        setPrices(d.prices||{});
      }catch(e){console.error("Price fetch error",e)}
    }
    setLoading(false);
  },[user.id]);

  useEffect(()=>{load()},[load]);

  const showToast=(m)=>{setToast(m);setTimeout(()=>setToast(""),3500)};

  if(screen==="addPort")return<AddPortfolio user={user} onCreated={()=>{setScreen("dash");load()}}/>;
  if(screen==="choice"&&selPort)return<AddPositionChoice portfolio={selPort} onBack={()=>setScreen("dash")} onPick={m=>setScreen(m==="scan"?"scan":"manual")}/>;
  if(screen==="scan"&&selPort)return<ScanScreen user={user} portfolio={selPort} onBack={()=>setScreen("choice")} onExtracted={list=>{setExtracted(list);setScreen("review")}}/>;
  if(screen==="review"&&selPort)return<ReviewScreen user={user} portfolio={selPort} extracted={extracted} onBack={()=>setScreen("scan")} onDone={n=>{setScreen("dash");load();showToast(`${n} position${n>1?"s":""} ajoutée${n>1?"s":""} ✓`)}}/>;
  if(screen==="manual"&&selPort)return<AddPosition user={user} portfolio={selPort} onAdded={()=>{setScreen("dash");load()}} onBack={()=>setScreen("choice")}/>;

  const getPrice=(pos)=>{const p=prices[pos.ticker];return p?.price||pos.current_price||pos.pru};

  const portData=portfolios.map(port=>{
    const poss=positions.filter(p=>p.portfolio_id===port.id);
    const titres=poss.reduce((s,p)=>s+getPrice(p)*p.quantity,0);
    const invested=poss.reduce((s,p)=>s+p.pru*p.quantity,0);
    const pv=titres-invested;
    return{...port,poss,titres,invested,pv,pvPct:invested?pv/invested*100:0,total:titres+(port.cash||0)};
  });

  const totalVal=portData.reduce((s,p)=>s+p.total,0);
  const totalPV=portData.reduce((s,p)=>s+p.pv,0);
  const totalInv=portData.reduce((s,p)=>s+p.invested,0);

  if(loading)return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:40,height:40,borderRadius:20,border:"3px solid #222",borderTopColor:"#3b82f6",animation:"spin 1s linear infinite",margin:"0 auto 16px"}}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{color:"#666",fontSize:13}}>Chargement...</p>
      </div>
    </div>
  );

  return(
    <div style={{maxWidth:800,margin:"0 auto",padding:"16px 16px 80px"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      {toast&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:"#4ade80",color:"#0a0a1a",padding:"10px 20px",borderRadius:10,fontWeight:700,fontSize:13,zIndex:100,boxShadow:"0 8px 30px #4ade8055"}}>{toast}</div>}
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <h1 style={{fontSize:20,fontWeight:800,margin:0,background:"linear-gradient(90deg,#60a5fa,#c084fc)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Portfolio Tracker</h1>
          <p style={{fontSize:10,color:"#555",margin:"2px 0 0"}}>{user.email}</p>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>load()} style={{padding:"6px 12px",borderRadius:8,border:"1px solid #333",background:"#0d0d20",color:"#60a5fa",fontSize:11,fontWeight:600,fontFamily:"inherit",cursor:"pointer"}}>Rafraîchir</button>
          <button onClick={onLogout} style={{padding:"6px 12px",borderRadius:8,border:"1px solid #333",background:"#0d0d20",color:"#666",fontSize:11,fontFamily:"inherit",cursor:"pointer"}}>Déconnexion</button>
        </div>
      </div>

      {/* KPI */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
        <div style={{...S.card,padding:12}}>
          <div style={{fontSize:8,color:"#555",textTransform:"uppercase"}}>Total</div>
          <div style={{fontSize:18,fontWeight:800,color:"#f0f0f0"}}>{fm(totalVal)}</div>
        </div>
        <div style={{...S.card,padding:12}}>
          <div style={{fontSize:8,color:"#555",textTransform:"uppercase"}}>PV Latente</div>
          <div style={{fontSize:18,fontWeight:800,color:totalPV>=0?"#4ade80":"#f87171"}}>{totalPV>=0?"+":""}{fm(totalPV)}</div>
        </div>
        <div style={{...S.card,padding:12}}>
          <div style={{fontSize:8,color:"#555",textTransform:"uppercase"}}>Perf.</div>
          <div style={{fontSize:18,fontWeight:800,color:totalPV>=0?"#4ade80":"#f87171"}}>{totalInv?(totalPV/totalInv*100).toFixed(2):0}%</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {[["synth","Synthèse"],["positions","Positions"]].map(([k,l])=>
          <button key={k} onClick={()=>setTab(k)} style={{padding:"8px 16px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit",background:tab===k?"#3b82f6":"#0d0d20",color:tab===k?"#fff":"#888"}}>{l}</button>
        )}
      </div>

      {/* Portfolios */}
      {portfolios.length===0?(
        <div style={{...S.card,textAlign:"center",padding:40}}>
          <div style={{fontSize:40,marginBottom:12}}>📊</div>
          <h3 style={{fontSize:16,fontWeight:700,color:"#f0f0f0",marginBottom:6}}>Aucun portefeuille</h3>
          <p style={{color:"#666",fontSize:12,marginBottom:20}}>Commencez par créer votre premier portefeuille</p>
          <button onClick={()=>setScreen("addPort")} style={{padding:"10px 24px",borderRadius:10,border:"none",cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"inherit",background:"linear-gradient(135deg,#3b82f6,#7c3aed)",color:"#fff"}}>+ Créer un portefeuille</button>
        </div>
      ):(
        <>
          {tab==="synth"&&portData.map(port=>(
            <div key={port.id} style={{...S.card,marginBottom:12,borderLeft:`3px solid ${port.color}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div><span style={{fontSize:16,fontWeight:800,color:port.color}}>{port.name}</span><span style={{fontSize:10,color:"#555",marginLeft:8}}>{port.account_type}{port.broker?` · ${port.broker}`:""}</span></div>
                <div style={{fontSize:18,fontWeight:800,color:"#f0f0f0"}}>{fm(port.total)}</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
                <div style={{background:"#0d0d20",borderRadius:8,padding:"6px 10px"}}><div style={{fontSize:8,color:"#555"}}>TITRES</div><div style={{fontSize:13,fontWeight:700,color:"#f0f0f0"}}>{fm(port.titres)}</div></div>
                <div style={{background:"#0d0d20",borderRadius:8,padding:"6px 10px"}}><div style={{fontSize:8,color:"#555"}}>PV LATENTE</div><div style={{fontSize:13,fontWeight:700,color:port.pv>=0?"#4ade80":"#f87171"}}>{port.pv>=0?"+":""}{fm(port.pv)}</div></div>
                <div style={{background:"#0d0d20",borderRadius:8,padding:"6px 10px"}}><div style={{fontSize:8,color:"#555"}}>PERF.</div><div style={{fontSize:13,fontWeight:700,color:port.pv>=0?"#4ade80":"#f87171"}}>{port.pvPct>=0?"+":""}{port.pvPct.toFixed(2)}%</div></div>
              </div>
              <div style={{marginTop:10,display:"flex",gap:6}}>
                <button onClick={()=>{setSelPort(port);setScreen("choice")}} style={{padding:"6px 14px",borderRadius:8,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"inherit",background:port.color+"22",color:port.color}}>+ Position</button>
              </div>
            </div>
          ))}

          {tab==="positions"&&portData.map(port=>(
            <div key={port.id} style={{marginBottom:20}}>
              <h3 style={{fontSize:14,fontWeight:700,color:port.color,marginBottom:8}}>Positions {port.name}</h3>
              {port.poss.length===0?<p style={{color:"#555",fontSize:12}}>Aucune position</p>:
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                    <thead><tr style={{color:"#555",fontSize:10}}>
                      <th style={{textAlign:"left",padding:"4px 8px"}}>Titre</th>
                      <th style={{textAlign:"right",padding:"4px 8px"}}>Qté</th>
                      <th style={{textAlign:"right",padding:"4px 8px"}}>PRU</th>
                      <th style={{textAlign:"right",padding:"4px 8px"}}>Cours</th>
                      <th style={{textAlign:"right",padding:"4px 8px"}}>+/- Value</th>
                      <th style={{textAlign:"right",padding:"4px 8px"}}>%</th>
                    </tr></thead>
                    <tbody>
                      {port.poss.map(pos=>{
                        const cp=getPrice(pos);
                        const pv=(cp-pos.pru)*pos.quantity;
                        const pvp=pos.pru?(cp-pos.pru)/pos.pru*100:0;
                        return(
                          <tr key={pos.id} style={{borderTop:"1px solid #ffffff08"}}>
                            <td style={{padding:"6px 8px",color:"#e0e0e0",fontWeight:600}}>{pos.short_name||pos.name}<br/><span style={{fontSize:8,color:"#555"}}>{pos.isin}</span></td>
                            <td style={{textAlign:"right",padding:"6px 8px",color:"#ccc"}}>{pos.quantity}</td>
                            <td style={{textAlign:"right",padding:"6px 8px",color:"#ccc"}}>{fm(pos.pru)}</td>
                            <td style={{textAlign:"right",padding:"6px 8px",color:"#f0f0f0",fontWeight:700}}>{fm(cp)}</td>
                            <td style={{textAlign:"right",padding:"6px 8px",color:pv>=0?"#4ade80":"#f87171",fontWeight:700}}>{pv>=0?"+":""}{fm(pv)}</td>
                            <td style={{textAlign:"right",padding:"6px 8px",color:pv>=0?"#4ade80":"#f87171"}}>{pvp>=0?"+":""}{pvp.toFixed(2)}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              }
            </div>
          ))}

          <button onClick={()=>setScreen("addPort")} style={{width:"100%",padding:"12px",borderRadius:10,border:"1px dashed #333",background:"transparent",color:"#60a5fa",fontSize:13,fontWeight:600,fontFamily:"inherit",cursor:"pointer",marginTop:12}}>+ Ajouter un portefeuille</button>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════ */
export default function App(){
  const[user,setUser]=useState(null);
  const[loading,setLoading]=useState(true);

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      setUser(session?.user||null);
      setLoading(false);
    });
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{
      setUser(session?.user||null);
    });
    return()=>subscription.unsubscribe();
  },[]);

  const logout=async()=>{await supabase.auth.signOut();setUser(null)};

  if(loading)return(
    <div style={{...S.page,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:64,height:64,borderRadius:16,background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:900,color:"#fff",marginBottom:16}}>P</div>
        <p style={{color:"#666",fontSize:13}}>Chargement...</p>
      </div>
    </div>
  );

  return(
    <div style={S.page}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}input,button{font-family:inherit}::selection{background:#3b82f644}body{background:#09091a}`}</style>
      {user?<Dashboard user={user} onLogout={logout}/>:<AuthScreen onAuth={setUser}/>}
    </div>
  );
}
