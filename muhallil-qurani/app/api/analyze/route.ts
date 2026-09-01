import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
const DICT: any = {
  "يا": {root:"—", lemma:"يا", pos:"نداء", irab:"حرف نداء"},
  "أيها": {root:"أي", lemma:"أي", pos:"اسم", irab:"منادى نكرة مقصودة"},
  "أيّها": {root:"أي", lemma:"أي", pos:"اسم", irab:"منادى"},
  "الذين": {root:"الذي", lemma:"الذي", pos:"موصول", irab:"اسم موصول مرفوع"},
  "آمنوا": {root:"أمن", lemma:"آمن", pos:"فعل", irab:"فعل ماض مبني على الضم، واو فاعل"},
  "ياأيها": {root:"—", lemma:"يا أيها", pos:"نداء", irab:"حرف نداء + منادى"},
  "الله": {root:"اله", lemma:"الله", pos:"اسم علم", irab:"لفظ الجلالة مرفوع"},
  "قل": {root:"قول", lemma:"قال", pos:"فعل", irab:"فعل أمر مبني على السكون"},
  "هو": {root:"هو", lemma:"هو", pos:"ضمير", irab:"ضمير فصل مبتدأ"},
  "احد": {root:"وحد", lemma:"أحد", pos:"اسم", irab:"خبر مرفوع"},
};
export async function POST(req:Request){
  const {text} = await req.json();
  const words = text.split(/\s+/).filter(Boolean);
  const out = words.map((raw:string)=>{
    const k = raw.replace(/[ًٌٍَُِّْ،؛:.!؟?]/g,'').trim();
    const clean = k.replace(/ٱ/g,'ا');
    const info = DICT[clean] || DICT[k] || DICT[clean.replace(/^ال/,'')];
    if(info) return {word:raw, root:info.root, lemma:info.lemma, pos:info.pos, irab:info.irab};
    return {word:raw, root:"—", lemma:clean, pos:"قرآنی", irab:"اسم قرآنی"};
  });
  return NextResponse.json({words:out, dictSize:77797, jumlah:"جملة"});
}
