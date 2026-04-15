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

/* ── FadeIn util (maquette Sprint 1) ── */
function FadeIn({children,delay=0}){
  return(
    <div style={{animation:`fadeIn 0.5s ${delay}ms both`}}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {children}
    </div>
  );
}

/* ── Barre de progression (onboarding Sprint 1) ── */
function ProgressBar({pct}){
  return(
    <div style={{position:"fixed",top:0,left:0,right:0,height:3,background:"#12122a",zIndex:10}}>
      <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#3b82f6,#c084fc)",transition:"width 0.4s"}}/>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PLAN CHOICE (Sprint 2 onboarding — repris du Sprint 1)
   ═══════════════════════════════════════════════ */
function PlanChoiceScreen({user,onDone,onSkip}){
  const[selected,setSelected]=useState(null);
  const[billing,setBilling]=useState("annual");
  const[loading,setLoading]=useState(false);
  const price=billing==="annual"?"30 €":"2,99 €";
  const period=billing==="annual"?"/an":"/mois";

  const validate=async()=>{
    if(!selected)return;
    setLoading(true);
    const plan=selected==="premium"?"premium":"free";
    const trialDays=selected==="premium"?(billing==="annual"?15:7):7;
    const trialStart=new Date().toISOString();
    const trialEnd=new Date(Date.now()+trialDays*86400000).toISOString();
    try{
      await supabase.from("profiles").upsert({
        id:user.id,
        email:user.email,
        plan,
        billing_cycle:selected==="premium"?billing:null,
        trial_started_at:trialStart,
        plan_expires_at:trialEnd,
        updated_at:new Date().toISOString()
      },{onConflict:"id"});
    }catch(e){console.error("Plan save error",e);}
    setLoading(false);
    onDone({plan,billing,trialDays});
  };

  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:24}}>
      <ProgressBar pct={25}/>
      <FadeIn>
        <h2 style={{fontSize:22,fontWeight:800,color:"#f0f0f0",marginBottom:4,textAlign:"center"}}>Choisissez votre formule</h2>
        <p style={{color:"#666",fontSize:12,marginBottom:20,textAlign:"center"}}>Changez d'avis à tout moment</p>
      </FadeIn>

      <FadeIn delay={100}>
        <div style={{display:"flex",background:"#12122a",borderRadius:10,padding:3,marginBottom:20,border:"1px solid #ffffff11"}}>
          {[["monthly","Mensuel"],["annual","Annuel"]].map(([v,l])=>(
            <button key={v} onClick={()=>setBilling(v)} style={{padding:"8px 20px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit",background:billing===v?"linear-gradient(135deg,#8b5cf6,#c084fc)":"transparent",color:billing===v?"#fff":"#666",transition:"all 0.3s",position:"relative"}}>
              {l}
              {v==="annual"&&<span style={{position:"absolute",top:-10,right:-10,fontSize:10,color:"#0a2e1a",fontWeight:800,background:"#4ade80",padding:"3px 9px",borderRadius:999,boxShadow:"0 2px 8px #4ade8066"}}>-17%</span>}
            </button>
          ))}
        </div>
      </FadeIn>

      <div style={{display:"flex",flexDirection:"column",gap:14,width:"100%",maxWidth:380}}>
        <FadeIn delay={200}>
          <div onClick={()=>setSelected("free")} style={{background:"#12122a",borderRadius:16,padding:"22px 20px",border:selected==="free"?"2px solid #60a5fa":"2px solid #ffffff11",cursor:"pointer",transition:"all 0.3s",transform:selected==="free"?"scale(1.02)":"scale(1)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontSize:18,fontWeight:800,color:"#f0f0f0"}}>Gratuit</div>
              <div style={{fontSize:22,fontWeight:800,color:"#60a5fa"}}>0 €</div>
            </div>
            <div style={{background:"#3b82f611",border:"1px solid #3b82f633",borderRadius:8,padding:"6px 10px",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:14}}>🎁</span>
              <span style={{fontSize:11,color:"#60a5fa",fontWeight:600}}>7 jours Premium offerts pour découvrir</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[["✅","1 portefeuille"],["✅","Cours mis à jour quotidiennement"],["✅","Graphiques de performance"],["📢","Publicités affichées"],["❌","Limité à 1 portefeuille"],["❌","Pas de graphiques avancés"],["❌","Pas d'alertes de cours"],["❌","Pas de rapport quotidien"]].map(([ic,t],i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:ic==="❌"?"#666":ic==="📢"?"#f59e0b":"#ccc"}}>
                  <span style={{fontSize:11,width:18,textAlign:"center"}}>{ic}</span>{t}
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={400}>
          <div onClick={()=>setSelected("premium")} style={{background:selected==="premium"?"linear-gradient(135deg,#12122a,#1a1035)":"#12122a",borderRadius:16,padding:"22px 20px",border:selected==="premium"?"2px solid #c084fc":"2px solid #ffffff11",cursor:"pointer",transition:"all 0.3s",transform:selected==="premium"?"scale(1.02)":"scale(1)",position:"relative",overflow:"hidden"}}>
            <div style={{display:"flex",justifyContent:"flex-end",gap:6,alignItems:"center",marginBottom:10}}>
              {billing==="annual"&&<div style={{background:"#4ade80",padding:"3px 10px",fontSize:10,fontWeight:800,color:"#0a2e1a",borderRadius:999,boxShadow:"0 2px 8px #4ade8066"}}>-17%</div>}
              <div style={{background:"linear-gradient(135deg,#8b5cf6,#c084fc)",padding:"3px 10px",fontSize:10,fontWeight:700,color:"#fff",borderRadius:999}}>Populaire</div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontSize:18,fontWeight:800,color:"#f0f0f0"}}>Premium</div>
              <div><span style={{fontSize:22,fontWeight:800,color:"#c084fc"}}>{price}</span><span style={{fontSize:11,color:"#888"}}>{period}</span></div>
            </div>
            {billing==="annual"&&<div style={{fontSize:10,color:"#4ade80",marginBottom:8}}>soit 2,50 €/mois au lieu de 2,99 €</div>}
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[["✅","Portefeuilles illimités (PEA, CTO, AV, PER...)"],["✅","Cours mis à jour quotidiennement"],["✅","Export CSV / Excel"],["✅","Aucune publicité"]].map(([ic,t],i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#ccc"}}>
                  <span style={{fontSize:11,width:18,textAlign:"center"}}>{ic}</span>{t}
                </div>
              ))}
              <div style={{borderTop:"1px solid #ffffff11",paddingTop:8,marginTop:2,display:"flex",flexDirection:"column",gap:8}}>
                {[["⭐","Graphiques avancés (Comparatif, Base 100)"],["⭐","Alertes de cours personnalisées"],["⭐","Rapport quotidien IA"]].map(([ic,t],i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#c4b5fd"}}>
                    <span style={{fontSize:11,width:18,textAlign:"center"}}>{ic}</span>
                    <span style={{fontWeight:600}}>{t}</span>
                    <span style={{fontSize:8,color:"#c4b5fd",background:"#c4b5fd15",padding:"2px 6px",borderRadius:4,fontWeight:700}}>NEW</span>
                  </div>
                ))}
              </div>

              {/* Détails alertes + rapport IA (Sprint 1 maquette) */}
              <div style={{background:"#0d0d20",borderRadius:10,padding:"10px 12px",marginTop:4,border:"1px solid #c4b5fd22"}}>
                <div style={{fontSize:11,fontWeight:700,color:"#c4b5fd",marginBottom:4}}>🔔 Alertes de cours personnalisées</div>
                <div style={{fontSize:10,color:"#aaa",lineHeight:1.5,marginBottom:8}}>
                  Définissez vos seuils sur chaque position<br/>
                  <span style={{color:"#888"}}>Vérification toutes les heures (9h-22h) · Notification push + email</span>
                </div>
                <div style={{fontSize:11,fontWeight:700,color:"#c4b5fd",marginBottom:4}}>📊 Rapport quotidien IA</div>
                <div style={{fontSize:10,color:"#aaa",lineHeight:1.6}}>
                  <div style={{marginBottom:6}}>Chaque soir, après la clôture des marchés US, un résumé personnalisé :</div>
                  <div>• L'actualité de vos positions (alertes, résultats, géopolitique, innovation...)</div>
                  <div>• Votre TOP 3 et FLOP 3 du jour</div>
                  <div>• Les événements clés à venir</div>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>

      <FadeIn delay={600}>
        <button onClick={validate} disabled={!selected||loading} style={{width:"100%",maxWidth:380,padding:"14px",borderRadius:12,border:"none",cursor:selected?"pointer":"default",fontSize:15,fontWeight:700,fontFamily:"inherit",background:!selected?"#222":selected==="premium"?"linear-gradient(135deg,#8b5cf6,#c084fc)":"linear-gradient(135deg,#3b82f6,#60a5fa)",color:selected?"#fff":"#555",marginTop:20,boxShadow:selected?"0 8px 30px "+(selected==="premium"?"#8b5cf633":"#3b82f633"):"none",transition:"all 0.3s"}}>
          {loading?"Enregistrement...":!selected?"Sélectionnez une formule":selected==="premium"?(billing==="annual"?"Commencer l'essai gratuit (15 jours)":"Commencer avec 7 jours offerts"):"Commencer avec 7 jours Premium offerts"}
        </button>
      </FadeIn>
      {selected==="free"&&<FadeIn delay={700}><p style={{color:"#888",fontSize:10,marginTop:10,textAlign:"center"}}>7 jours Premium offerts · Puis version gratuite avec publicités</p></FadeIn>}
      {selected==="premium"&&billing==="annual"&&<FadeIn delay={700}><p style={{color:"#888",fontSize:10,marginTop:10,textAlign:"center"}}>15 jours d'essai gratuit · Engagement 1 an · Annulable avant la fin de l'essai</p></FadeIn>}
      {selected==="premium"&&billing==="monthly"&&<FadeIn delay={700}><p style={{color:"#888",fontSize:10,marginTop:10,textAlign:"center"}}>7 jours offerts · Sans engagement · Annulable à tout moment</p></FadeIn>}

      <button onClick={onSkip} style={{marginTop:18,background:"none",border:"none",color:"#666",fontSize:12,fontFamily:"inherit",cursor:"pointer",textDecoration:"underline"}}>Passer pour l'instant</button>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   AUTH SCREEN
   ═══════════════════════════════════════════════ */
function AuthScreen({onAuth}){
  const[mode,setMode]=useState("register"); // register | login | forgot
  const[email,setEmail]=useState("");
  const[pass,setPass]=useState("");
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState("");
  const[infoMsg,setInfoMsg]=useState("");

  const emailOk=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const rules=[{ok:pass.length>=8,l:"8 car."},{ok:/[A-Z]/.test(pass),l:"1 maj."},{ok:/[a-z]/.test(pass),l:"1 min."},{ok:/[0-9]/.test(pass),l:"1 chiffre"},{ok:/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass),l:"1 symbole"}];
  const passOk=mode==="login"?pass.length>=1:mode==="forgot"?true:rules.every(r=>r.ok);
  const canSubmit=mode==="forgot"?emailOk:(emailOk&&passOk);

  const sendReset=async()=>{
    if(!emailOk)return;
    setLoading(true);setError("");setInfoMsg("");
    try{
      const{error:e}=await supabase.auth.resetPasswordForEmail(email,{
        redirectTo:window.location.origin+"/",
      });
      if(e)throw e;
      setInfoMsg("Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé. Vérifie ta boîte mail (et les spams).");
    }catch(e){setError(e.message)}
    finally{setLoading(false)}
  };

  const submit=async()=>{
    if(mode==="forgot")return sendReset();
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
        <h2 style={{fontSize:20,fontWeight:800,color:"#f0f0f0",marginBottom:4}}>{mode==="register"?"Créer un compte":mode==="forgot"?"Mot de passe oublié":"Se connecter"}</h2>
        <p style={{color:"#666",fontSize:12,marginBottom:24}}>{mode==="register"?"Gratuit, en 10 secondes":mode==="forgot"?"Saisis ton email, on t'envoie un lien de réinitialisation":"Bon retour parmi nous"}</p>

        {mode!=="forgot"&&<>
          <button onClick={googleLogin} disabled={loading} style={{width:"100%",padding:"12px",borderRadius:10,border:"1px solid #333",background:"#0d0d20",color:"#f0f0f0",fontSize:14,fontWeight:600,fontFamily:"inherit",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:20}}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {loading?"Connexion...":"Continuer avec Google"}
          </button>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}><div style={{flex:1,height:1,background:"#222"}}/><span style={{color:"#555",fontSize:11}}>ou par email</span><div style={{flex:1,height:1,background:"#222"}}/></div>
        </>}

        <div style={{marginBottom:12}}>
          <label style={{fontSize:11,color:"#888",marginBottom:4,display:"block"}}>Email</label>
          <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setError("");setInfoMsg("")}} placeholder="votre@email.com" style={{...S.inp,borderColor:email&&!emailOk?"#f87171":email&&emailOk?"#4ade80":"#333"}} onKeyDown={e=>e.key==="Enter"&&mode==="forgot"&&submit()}/>
          {email&&!emailOk&&<div style={{fontSize:10,color:"#f87171",marginTop:4}}>Format email invalide</div>}
        </div>
        {mode!=="forgot"&&<div style={{marginBottom:6}}>
          <label style={{fontSize:11,color:"#888",marginBottom:4,display:"block"}}>Mot de passe</label>
          <input type="password" value={pass} onChange={e=>{setPass(e.target.value);setError("")}} placeholder="••••••••" style={{...S.inp,borderColor:pass&&!passOk?"#f87171":pass&&passOk?"#4ade80":"#333"}} onKeyDown={e=>e.key==="Enter"&&submit()}/>
          {mode==="login"&&<div style={{textAlign:"right",marginTop:6}}>
            <span onClick={()=>{setMode("forgot");setPass("");setError("");setInfoMsg("")}} style={{color:"#60a5fa",cursor:"pointer",fontSize:11,fontWeight:600}}>Mot de passe oublié ?</span>
          </div>}
        </div>}
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
        {infoMsg&&<div style={{fontSize:11,color:"#4ade80",marginBottom:8,padding:"8px 12px",background:"#4ade8015",border:"1px solid #4ade8055",borderRadius:6}}>✓ {infoMsg}</div>}
        <div style={{marginBottom:16}}/>

        <button onClick={submit} disabled={!canSubmit||loading} style={S.btn(canSubmit,"#3b82f6")}>
          {loading?(mode==="forgot"?"Envoi...":"Connexion..."):mode==="register"?"Créer mon compte":mode==="forgot"?"Envoyer le lien":"Se connecter"}
        </button>
        <p style={{textAlign:"center",marginTop:20,fontSize:12,color:"#666"}}>
          {mode==="forgot"?<>
            <span onClick={()=>{setMode("login");setError("");setInfoMsg("")}} style={{color:"#60a5fa",cursor:"pointer",fontWeight:600}}>← Retour à la connexion</span>
          </>:<>
            {mode==="register"?"Déjà un compte ? ":"Pas encore de compte ? "}
            <span onClick={()=>{setMode(mode==="register"?"login":"register");setPass("");setError("");setInfoMsg("")}} style={{color:"#60a5fa",cursor:"pointer",fontWeight:600}}>
              {mode==="register"?"Se connecter":"S'inscrire"}
            </span>
          </>}
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   RESET PASSWORD SCREEN (via lien email recovery)
   ═══════════════════════════════════════════════ */
function ResetPasswordScreen({onDone}){
  const[pass,setPass]=useState("");
  const[pass2,setPass2]=useState("");
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState("");
  const[success,setSuccess]=useState(false);

  const rules=[{ok:pass.length>=8,l:"8 car."},{ok:/[A-Z]/.test(pass),l:"1 maj."},{ok:/[a-z]/.test(pass),l:"1 min."},{ok:/[0-9]/.test(pass),l:"1 chiffre"},{ok:/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass),l:"1 symbole"}];
  const passOk=rules.every(r=>r.ok);
  const matchOk=pass.length>0&&pass===pass2;
  const canSubmit=passOk&&matchOk;

  const submit=async()=>{
    if(!canSubmit)return;
    setLoading(true);setError("");
    try{
      const{error:e}=await supabase.auth.updateUser({password:pass});
      if(e)throw e;
      await supabase.auth.signOut();
      setSuccess(true);
      setTimeout(()=>onDone(),1500);
    }catch(e){setError(e.message);setLoading(false)}
  };

  if(success)return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:24}}>
      <div style={{width:"100%",maxWidth:360,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>✓</div>
        <h2 style={{fontSize:20,fontWeight:800,color:"#4ade80",marginBottom:8}}>Mot de passe mis à jour</h2>
        <p style={{color:"#888",fontSize:13}}>Redirection vers la connexion...</p>
      </div>
    </div>
  );

  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:24}}>
      <div style={{width:"100%",maxWidth:360}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:64,height:64,borderRadius:16,background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:900,color:"#fff",marginBottom:12}}>P</div>
          <h1 style={{fontSize:22,fontWeight:800,margin:"0 0 2px",background:"linear-gradient(90deg,#60a5fa,#c084fc)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Portfolio Tracker</h1>
        </div>
        <h2 style={{fontSize:20,fontWeight:800,color:"#f0f0f0",marginBottom:4}}>Nouveau mot de passe</h2>
        <p style={{color:"#666",fontSize:12,marginBottom:24}}>Choisis ton nouveau mot de passe</p>

        <div style={{marginBottom:12}}>
          <label style={{fontSize:11,color:"#888",marginBottom:4,display:"block"}}>Nouveau mot de passe</label>
          <input type="password" value={pass} onChange={e=>{setPass(e.target.value);setError("")}} placeholder="••••••••" style={{...S.inp,borderColor:pass&&!passOk?"#f87171":pass&&passOk?"#4ade80":"#333"}}/>
        </div>
        {pass.length>0&&(
          <div style={{marginBottom:12}}>
            <div style={{display:"flex",gap:3,marginBottom:6}}>
              {[1,2,3,4,5].map(i=>{const f=rules.filter(r=>r.ok).length;return<div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=f?(f<=2?"#f87171":f<=3?"#f59e0b":"#4ade80"):"#222"}}/>})}
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
              {rules.map((r,i)=><span key={i} style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:r.ok?"#4ade8015":"#f8717115",color:r.ok?"#4ade80":"#f87171"}}>{r.ok?"✓":"×"} {r.l}</span>)}
            </div>
          </div>
        )}
        <div style={{marginBottom:12}}>
          <label style={{fontSize:11,color:"#888",marginBottom:4,display:"block"}}>Confirmer</label>
          <input type="password" value={pass2} onChange={e=>{setPass2(e.target.value);setError("")}} placeholder="••••••••" style={{...S.inp,borderColor:pass2&&!matchOk?"#f87171":matchOk?"#4ade80":"#333"}} onKeyDown={e=>e.key==="Enter"&&submit()}/>
          {pass2&&!matchOk&&<div style={{fontSize:10,color:"#f87171",marginTop:4}}>Les mots de passe ne correspondent pas</div>}
        </div>
        {error&&<div style={{fontSize:11,color:"#f87171",marginBottom:8,padding:"6px 10px",background:"#f8717111",borderRadius:6}}>{error}</div>}
        <div style={{marginBottom:16}}/>
        <button onClick={submit} disabled={!canSubmit||loading} style={S.btn(canSubmit,"#3b82f6")}>
          {loading?"Mise à jour...":"Mettre à jour mon mot de passe"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ADD PORTFOLIO SCREEN
   ═══════════════════════════════════════════════ */
function AddPortfolio({user,onCreated,onboarding}){
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
      {onboarding&&<ProgressBar pct={50}/>}
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
function AddPositionChoice({portfolio,onPick,onBack,onboarding}){
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
      {onboarding&&<ProgressBar pct={75}/>}
      <div style={{width:"100%",maxWidth:420}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"#666",fontSize:12,cursor:"pointer",fontFamily:"inherit",marginBottom:16}}>← Retour</button>
        <h2 style={{fontSize:20,fontWeight:800,color:"#f0f0f0",marginBottom:6}}>Ajouter des positions</h2>
        <p style={{color:"#666",fontSize:12,marginBottom:20}}>dans <span style={{color:portfolio.color,fontWeight:700}}>{portfolio.name}</span></p>
        <Opt icon="📸" title="Scanner votre portefeuille" desc="Upload d'une ou plusieurs photos de ton courtier, IA extraction automatique" badge="IA" color="#8b5cf6" onClick={()=>onPick("scan")}/>
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
      <h2 style={{fontSize:20,fontWeight:800,color:"#f0f0f0",marginBottom:6}}>📸 Scanner votre portefeuille</h2>
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
   PROFILE SCREEN — gestion du compte (Sprint 2)
   ═══════════════════════════════════════════════ */
function ProfileSection({title,desc,children}){
  return(
    <div style={{...S.card,marginBottom:16}}>
      <h3 style={{fontSize:14,fontWeight:800,color:"#f0f0f0",marginBottom:4}}>{title}</h3>
      {desc&&<p style={{fontSize:11,color:"#666",marginBottom:14}}>{desc}</p>}
      {children}
    </div>
  );
}

function ProfileScreen({user,onBack,onLoggedOut}){
  const[profile,setProfile]=useState(null);
  const[loading,setLoading]=useState(true);

  // Email change
  const[newEmail,setNewEmail]=useState("");
  const[emailMsg,setEmailMsg]=useState("");
  const[emailErr,setEmailErr]=useState("");
  const[emailLoading,setEmailLoading]=useState(false);

  // Password change
  const[curPass,setCurPass]=useState("");
  const[newPass,setNewPass]=useState("");
  const[newPass2,setNewPass2]=useState("");
  const[pwdMsg,setPwdMsg]=useState("");
  const[pwdErr,setPwdErr]=useState("");
  const[pwdLoading,setPwdLoading]=useState(false);

  // Delete account
  const[showDelete,setShowDelete]=useState(false);
  const[confirmText,setConfirmText]=useState("");
  const[delErr,setDelErr]=useState("");
  const[delLoading,setDelLoading]=useState(false);

  useEffect(()=>{
    (async()=>{
      const{data}=await supabase.from("profiles").select("*").eq("id",user.id).single();
      setProfile(data);
      setLoading(false);
    })();
  },[user.id]);

  const emailOk=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail);
  const pwdRules=[{ok:newPass.length>=8,l:"8 car."},{ok:/[A-Z]/.test(newPass),l:"1 maj."},{ok:/[a-z]/.test(newPass),l:"1 min."},{ok:/[0-9]/.test(newPass),l:"1 chiffre"},{ok:/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPass),l:"1 symbole"}];
  const pwdStrong=pwdRules.every(r=>r.ok);
  const pwdMatch=newPass.length>0&&newPass===newPass2;
  const canChangePwd=curPass.length>0&&pwdStrong&&pwdMatch;

  const changeEmail=async()=>{
    if(!emailOk||newEmail===user.email)return;
    setEmailLoading(true);setEmailErr("");setEmailMsg("");
    try{
      const{error:e}=await supabase.auth.updateUser({email:newEmail});
      if(e){
        if(/session/i.test(e.message)){
          setEmailErr("Votre session a expiré. Déconnectez-vous puis reconnectez-vous, et réessayez.");
        }else{
          throw e;
        }
      }else{
        setEmailMsg("Un email de confirmation a été envoyé à votre nouvelle adresse. Cliquez sur le lien pour valider le changement.");
        setNewEmail("");
      }
    }catch(e){setEmailErr(e.message)}
    finally{setEmailLoading(false)}
  };

  const changePwd=async()=>{
    if(!canChangePwd)return;
    setPwdLoading(true);setPwdErr("");setPwdMsg("");
    try{
      // 1. Vérifier l'ancien mdp par re-signin
      const{error:e1}=await supabase.auth.signInWithPassword({email:user.email,password:curPass});
      if(e1){setPwdErr("Mot de passe actuel incorrect");setPwdLoading(false);return}
      // 2. Mettre à jour le mdp
      const{error:e2}=await supabase.auth.updateUser({password:newPass});
      if(e2)throw e2;
      setPwdMsg("Votre mot de passe a été mis à jour avec succès.");
      setCurPass("");setNewPass("");setNewPass2("");
    }catch(e){setPwdErr(e.message)}
    finally{setPwdLoading(false)}
  };

  const deleteAccount=async()=>{
    if(confirmText!=="SUPPRIMER")return;
    setDelLoading(true);setDelErr("");
    try{
      const{error:e}=await supabase.from("profiles").update({deleted_at:new Date().toISOString()}).eq("id",user.id);
      if(e)throw e;
      await supabase.auth.signOut();
      onLoggedOut();
    }catch(e){setDelErr(e.message);setDelLoading(false)}
  };

  if(loading)return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>
      <div style={{width:40,height:40,borderRadius:20,border:"3px solid #222",borderTopColor:"#3b82f6",animation:"spin 1s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const plan=profile?.plan||"free";
  const isPremium=plan==="premium";

  return(
    <div style={{maxWidth:560,margin:"0 auto",padding:"24px 16px 80px"}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:"#666",fontSize:12,cursor:"pointer",fontFamily:"inherit",marginBottom:16}}>← Retour</button>
      <h2 style={{fontSize:22,fontWeight:800,color:"#f0f0f0",marginBottom:6}}>Mon profil</h2>
      <p style={{color:"#666",fontSize:12,marginBottom:24}}>Gérez votre compte et vos préférences</p>

      {/* IDENTITÉ */}
      <ProfileSection title="Identité" desc="Votre adresse email sert à vous connecter et recevoir les notifications.">
        <div style={{marginBottom:12}}>
          <label style={{fontSize:11,color:"#888",marginBottom:4,display:"block"}}>Email actuel</label>
          <div style={{...S.inp,background:"#0a0a18",color:"#888",userSelect:"text"}}>{user.email}</div>
        </div>
        <div style={{marginBottom:12}}>
          <label style={{fontSize:11,color:"#888",marginBottom:4,display:"block"}}>Nouvelle adresse email</label>
          <input type="email" autoComplete="off" value={newEmail} onChange={e=>{setNewEmail(e.target.value);setEmailErr("");setEmailMsg("")}} placeholder="nouvelle@email.com" style={{...S.inp,borderColor:newEmail&&!emailOk?"#f87171":newEmail&&emailOk?"#4ade80":"#333"}}/>
          {newEmail&&!emailOk&&<div style={{fontSize:10,color:"#f87171",marginTop:4}}>Format email invalide</div>}
        </div>
        {emailErr&&<div style={{fontSize:11,color:"#f87171",marginBottom:10,padding:"8px 12px",background:"#f8717111",borderRadius:6}}>{emailErr}</div>}
        {emailMsg&&<div style={{fontSize:11,color:"#4ade80",marginBottom:10,padding:"8px 12px",background:"#4ade8015",border:"1px solid #4ade8055",borderRadius:6}}>✓ {emailMsg}</div>}
        <button onClick={changeEmail} disabled={!emailOk||newEmail===user.email||emailLoading} style={S.btn(emailOk&&newEmail!==user.email&&!emailLoading,"#3b82f6")}>
          {emailLoading?"Envoi...":"Changer mon adresse email"}
        </button>
      </ProfileSection>

      {/* PLAN */}
      <ProfileSection title="Mon abonnement">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",background:"#0d0d20",borderRadius:10,border:`1px solid ${isPremium?"#f59e0b55":"#33333355"}`}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
              <span style={{fontSize:14,fontWeight:800,color:isPremium?"#f59e0b":"#e0e0e0"}}>{isPremium?"Premium":"Gratuit"}</span>
              {isPremium&&<span style={{fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:4,background:"#f59e0b22",color:"#f59e0b"}}>⭐</span>}
            </div>
            <div style={{fontSize:11,color:"#666"}}>{isPremium?(profile?.plan_expires_at?`Valide jusqu'au ${new Date(profile.plan_expires_at).toLocaleDateString("fr-FR")}`:"Plan premium actif"):"Fonctionnalités de base"}</div>
          </div>
          {!isPremium&&<button style={{padding:"8px 14px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit",background:"linear-gradient(135deg,#f59e0b,#ef4444)",color:"#fff"}}>Passer premium</button>}
        </div>
      </ProfileSection>

      {/* SÉCURITÉ */}
      <ProfileSection title="Sécurité" desc="Changez votre mot de passe. Vous devez saisir votre mot de passe actuel pour confirmer votre identité.">
        <div style={{marginBottom:12}}>
          <label style={{fontSize:11,color:"#888",marginBottom:4,display:"block"}}>Mot de passe actuel</label>
          <input type="password" autoComplete="current-password" value={curPass} onChange={e=>{setCurPass(e.target.value);setPwdErr("");setPwdMsg("")}} placeholder="••••••••" style={S.inp}/>
        </div>
        <div style={{marginBottom:12}}>
          <label style={{fontSize:11,color:"#888",marginBottom:4,display:"block"}}>Nouveau mot de passe</label>
          <input type="password" autoComplete="new-password" value={newPass} onChange={e=>{setNewPass(e.target.value);setPwdErr("")}} placeholder="••••••••" style={{...S.inp,borderColor:newPass&&!pwdStrong?"#f87171":newPass&&pwdStrong?"#4ade80":"#333"}}/>
        </div>
        {newPass.length>0&&(
          <div style={{marginBottom:12}}>
            <div style={{display:"flex",gap:3,marginBottom:6}}>
              {[1,2,3,4,5].map(i=>{const f=pwdRules.filter(r=>r.ok).length;return<div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=f?(f<=2?"#f87171":f<=3?"#f59e0b":"#4ade80"):"#222"}}/>})}
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
              {pwdRules.map((r,i)=><span key={i} style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:r.ok?"#4ade8015":"#f8717115",color:r.ok?"#4ade80":"#f87171"}}>{r.ok?"✓":"×"} {r.l}</span>)}
            </div>
          </div>
        )}
        <div style={{marginBottom:12}}>
          <label style={{fontSize:11,color:"#888",marginBottom:4,display:"block"}}>Confirmer le nouveau mot de passe</label>
          <input type="password" autoComplete="new-password" value={newPass2} onChange={e=>{setNewPass2(e.target.value);setPwdErr("")}} placeholder="••••••••" style={{...S.inp,borderColor:newPass2&&!pwdMatch?"#f87171":pwdMatch?"#4ade80":"#333"}}/>
          {newPass2&&!pwdMatch&&<div style={{fontSize:10,color:"#f87171",marginTop:4}}>Les mots de passe ne correspondent pas</div>}
        </div>
        {pwdErr&&<div style={{fontSize:11,color:"#f87171",marginBottom:10,padding:"8px 12px",background:"#f8717111",borderRadius:6}}>{pwdErr}</div>}
        {pwdMsg&&<div style={{fontSize:11,color:"#4ade80",marginBottom:10,padding:"8px 12px",background:"#4ade8015",border:"1px solid #4ade8055",borderRadius:6}}>✓ {pwdMsg}</div>}
        <button onClick={changePwd} disabled={!canChangePwd||pwdLoading} style={S.btn(canChangePwd&&!pwdLoading,"#3b82f6")}>
          {pwdLoading?"Mise à jour...":"Mettre à jour mon mot de passe"}
        </button>
      </ProfileSection>

      {/* ZONE DANGER */}
      <div style={{...S.card,marginBottom:16,border:"1px solid #f8717144"}}>
        <h3 style={{fontSize:14,fontWeight:800,color:"#f87171",marginBottom:4}}>Zone de danger</h3>
        <p style={{fontSize:11,color:"#666",marginBottom:14}}>La suppression de votre compte est définitive après 30 jours. Vos données sont conservées durant cette période pour vous permettre de revenir en arrière.</p>
        {!showDelete?(
          <button onClick={()=>setShowDelete(true)} style={{width:"100%",padding:"11px",borderRadius:10,border:"1px solid #f8717155",background:"transparent",color:"#f87171",fontSize:13,fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>Supprimer mon compte</button>
        ):(
          <>
            <div style={{fontSize:11,color:"#f87171",marginBottom:10,padding:"10px 12px",background:"#f8717111",border:"1px solid #f8717155",borderRadius:6}}>⚠️ Pour confirmer, tapez <b>SUPPRIMER</b> ci-dessous. Votre compte sera désactivé immédiatement. Vos données seront définitivement supprimées sous 30 jours.</div>
            <input value={confirmText} onChange={e=>setConfirmText(e.target.value)} placeholder="Tapez SUPPRIMER" style={{...S.inp,marginBottom:10}}/>
            {delErr&&<div style={{fontSize:11,color:"#f87171",marginBottom:10,padding:"6px 10px",background:"#f8717111",borderRadius:6}}>{delErr}</div>}
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{setShowDelete(false);setConfirmText("");setDelErr("")}} style={{flex:1,padding:"11px",borderRadius:10,border:"1px solid #333",background:"#0d0d20",color:"#888",fontSize:13,fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>Annuler</button>
              <button onClick={deleteAccount} disabled={confirmText!=="SUPPRIMER"||delLoading} style={{flex:1,padding:"11px",borderRadius:10,border:"none",cursor:confirmText==="SUPPRIMER"&&!delLoading?"pointer":"default",fontSize:13,fontWeight:700,fontFamily:"inherit",background:confirmText==="SUPPRIMER"?"#f87171":"#333",color:confirmText==="SUPPRIMER"?"#fff":"#666"}}>
                {delLoading?"Suppression...":"Confirmer la suppression"}
              </button>
            </div>
          </>
        )}
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
  const[screen,setScreen]=useState("dash"); // dash | addPort | choice | scan | review | manual | profile
  const[selPort,setSelPort]=useState(null);
  const[extracted,setExtracted]=useState([]);
  const[tab,setTab]=useState("synth");
  const[toast,setToast]=useState("");
  const[menuOpen,setMenuOpen]=useState(false);
  const[profile,setProfile]=useState(null);
  const[skippedOnb,setSkippedOnb]=useState(false);

  const load=useCallback(async()=>{
    setLoading(true);
    const[{data:p},{data:pos},{data:prof}]=await Promise.all([
      supabase.from("portfolios").select("*").eq("user_id",user.id).order("created_at"),
      supabase.from("positions").select("*").eq("user_id",user.id),
      supabase.from("profiles").select("*").eq("id",user.id).maybeSingle()
    ]);
    setPortfolios(p||[]);
    setPositions(pos||[]);
    setProfile(prof||null);
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

  // Onboarding gate (Sprint 2) : si pas de portefeuille ET pas encore de plan choisi ET pas skippé → PlanChoice
  const needsPlan=portfolios.length===0&&!skippedOnb&&!(profile&&profile.trial_started_at);
  if(needsPlan&&screen==="dash"){
    return<PlanChoiceScreen user={user} onDone={()=>{load();setScreen("addPort")}} onSkip={()=>setSkippedOnb(true)}/>;
  }

  const isOnboarding=portfolios.length===0;
  if(screen==="addPort")return<AddPortfolio user={user} onboarding={isOnboarding} onCreated={()=>{setScreen("dash");load()}}/>;
  if(screen==="choice"&&selPort)return<AddPositionChoice portfolio={selPort} onboarding={isOnboarding&&positions.length===0} onBack={()=>setScreen("dash")} onPick={m=>setScreen(m==="scan"?"scan":"manual")}/>;
  if(screen==="scan"&&selPort)return<ScanScreen user={user} portfolio={selPort} onBack={()=>setScreen("choice")} onExtracted={list=>{setExtracted(list);setScreen("review")}}/>;
  if(screen==="review"&&selPort)return<ReviewScreen user={user} portfolio={selPort} extracted={extracted} onBack={()=>setScreen("scan")} onDone={n=>{setScreen("dash");load();showToast(`${n} position${n>1?"s":""} ajoutée${n>1?"s":""} ✓`)}}/>;
  if(screen==="manual"&&selPort)return<AddPosition user={user} portfolio={selPort} onAdded={()=>{setScreen("dash");load()}} onBack={()=>setScreen("choice")}/>;
  if(screen==="profile")return<ProfileScreen user={user} onBack={()=>setScreen("dash")} onLoggedOut={onLogout}/>;

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
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={()=>load()} style={{padding:"6px 12px",borderRadius:8,border:"1px solid #333",background:"#0d0d20",color:"#60a5fa",fontSize:11,fontWeight:600,fontFamily:"inherit",cursor:"pointer"}}>Rafraîchir</button>
          <div style={{position:"relative"}}>
            <button onClick={()=>setMenuOpen(v=>!v)} style={{width:36,height:36,borderRadius:18,border:"1px solid #333",background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",color:"#fff",fontSize:13,fontWeight:800,fontFamily:"inherit",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{(user.email||"?").charAt(0).toUpperCase()}</button>
            {menuOpen&&<>
              <div onClick={()=>setMenuOpen(false)} style={{position:"fixed",inset:0,zIndex:50}}/>
              <div style={{position:"absolute",top:42,right:0,minWidth:200,background:"#12122a",border:"1px solid #2a2a44",borderRadius:10,boxShadow:"0 12px 40px #00000088",zIndex:51,overflow:"hidden"}}>
                <div style={{padding:"10px 14px",borderBottom:"1px solid #2a2a44"}}>
                  <div style={{fontSize:11,color:"#888"}}>Connecté en tant que</div>
                  <div style={{fontSize:12,color:"#e0e0e0",fontWeight:600,wordBreak:"break-all"}}>{user.email}</div>
                </div>
                <button onClick={()=>{setMenuOpen(false);setScreen("profile")}} style={{display:"block",width:"100%",textAlign:"left",padding:"10px 14px",background:"none",border:"none",color:"#e0e0e0",fontSize:12,fontFamily:"inherit",cursor:"pointer"}}>👤 Mon profil</button>
                <button onClick={()=>{setMenuOpen(false);onLogout()}} style={{display:"block",width:"100%",textAlign:"left",padding:"10px 14px",background:"none",border:"none",color:"#f87171",fontSize:12,fontFamily:"inherit",cursor:"pointer",borderTop:"1px solid #2a2a44"}}>↪ Déconnexion</button>
              </div>
            </>}
          </div>
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
  const[recovery,setRecovery]=useState(false);

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      setUser(session?.user||null);
      setLoading(false);
    });
    const{data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{
      if(event==="PASSWORD_RECOVERY"){
        setRecovery(true);
        setUser(session?.user||null);
        return;
      }
      setUser(session?.user||null);
    });
    return()=>subscription.unsubscribe();
  },[]);

  const logout=async()=>{await supabase.auth.signOut();setUser(null)};
  const finishReset=()=>{
    setRecovery(false);
    setUser(null);
    // nettoie le hash/query de l'URL après reset
    if(window.history&&window.history.replaceState){
      window.history.replaceState(null,"",window.location.pathname);
    }
  };

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
      {recovery?<ResetPasswordScreen onDone={finishReset}/>:user?<Dashboard user={user} onLogout={logout}/>:<AuthScreen onAuth={setUser}/>}
    </div>
  );
}
