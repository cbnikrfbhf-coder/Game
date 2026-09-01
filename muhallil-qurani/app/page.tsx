"use client"; import {useState} from "react";
export default function Home(){
  const [text,setText]=useState("يَا أَيُّهَا الَّذِينَ آمَنُوا");
  const [res,setRes]=useState<any>(null); const [loading,setLoading]=useState(false);
  const go=async()=>{setLoading(true); try{const r=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text})}); const j=await r.json(); setRes(j);}catch(e){} setLoading(false);};
  return <div style={{background:"#f8f6f1",minHeight:"100vh",padding:20,fontFamily:"system-ui"}}>
    <h1 style={{textAlign:"center",fontSize:32,fontWeight:900}}>محلّل قرآنی</h1>
    <div style={{maxWidth:600,margin:"20px auto",background:"#fff",padding:14,borderRadius:14,display:"flex",gap:8}}>
      <input value={text} onChange={e=>setText(e.target.value)} style={{flex:1,padding:10,borderRadius:8,border:"1px solid #ddd",fontSize:18}}/>
      <button onClick={go} style={{background:"#111",color:"#fff",padding:"0 16px",borderRadius:8}}>{loading?"...":"تجزیه"}</button>
    </div>
    {res && <div style={{maxWidth:800,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:10}}>
      {res.words.map((w:any,i:number)=><div key={i} style={{background:"#fff",borderRadius:12,padding:12,borderTop:"4px solid #3b82f6"}}>
        <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:10,background:"#111",color:"#fff",padding:"2px 6px",borderRadius:8}}>{w.pos}</span><b style={{fontSize:20}}>{w.word}</b></div>
        <div style={{marginTop:6,fontSize:13}}>ریشه: <b>{w.root}</b> | {w.lemma}</div>
        <div style={{marginTop:4,fontSize:11,color:"#555"}}>{w.irab}</div>
      </div>)}
    </div>}
  </div>
}
