// Leaderboard: shared Supabase project 'leaderboards', table scores, rows tagged game:'palm'.
// When running as a claude.ai artifact, window.claude's db is used instead (inert on Vercel).
import {S} from './state.js';
import {cv} from './render.js';
// ---------- leaderboard (shared db: everyone with the link who can contribute) ----------
export const lbEl=document.getElementById('lb'),lbForm=document.getElementById('lbf'),lbName=document.getElementById('lbname'),lbGo=document.getElementById('lbgo'),lbMsg=document.getElementById('lbmsg'),lbList=document.getElementById('lblist');
let lbDb=null,board=[],postedRun=false,myDoc=null,runScore=0;
// outside claude.ai: the shared Supabase leaderboards project (publishable key, protected by RLS; same table as Neon Striker, tagged by game)
const SB_REST='https://iysvarvkltihgosbhtaa.supabase.co/rest/v1/scores',SB_KEY='sb_publishable_7Kxs-F6HGMgZmb86V1b9_A_qtyUerCh',SB_H={apikey:SB_KEY,Authorization:'Bearer '+SB_KEY,'Content-Type':'application/json'};
let sbOk=false,myEntry=null;
async function sbTop(){try{const r=await fetch(SB_REST+'?select=name,score,stage&game=eq.palm&order=score.desc&limit=10',{headers:SB_H});if(!r.ok)return null;return await r.json()}catch(e){return null}}
async function sbRefresh(){const rows=await sbTop();sbOk=!!rows;if(rows){board=rows.map((r,i)=>({id:myEntry&&r.name===myEntry.name&&r.score===myEntry.score?'mine':'sb'+i,name:r.name,score:r.score}));if(myEntry)myDoc='mine'}if(!lbEl.hidden){lbForm.hidden=!(sbOk&&runScore>0&&!postedRun);if(!lbDb)lbMsg.textContent=!sbOk?'Leaderboard unreachable right now.':postedRun?'Posted.':runScore>0?'':'Score something to get on the board.';renderBoard()}}
try{lbName.value=localStorage.getItem('palm_name')||''}catch(e){}
export function placeBoard(){const w=document.getElementById('wrap').getBoundingClientRect(),c=cv.getBoundingClientRect(),k=c.width/600;
  // laid out at the canvas's own 600px scale, then scaled with it, so it lines up on every screen
  lbEl.style.left=(c.left-w.left+54*k)+'px';lbEl.style.top=(c.top-w.top+215*k)+'px';lbEl.style.width='492px';lbEl.style.maxHeight='450px';lbEl.style.overflow='hidden';lbEl.style.transformOrigin='0 0';lbEl.style.transform='scale('+k+')'}
function renderBoard(){lbList.textContent='';
  if(!board.length){const li=document.createElement('li');li.textContent=(lbDb||sbOk)?'No scores yet. Be the first.':'';lbList.appendChild(li);return}
  board.forEach((r,i)=>{const li=document.createElement('li');if(r.id===myDoc)li.className='me';
    const rk=document.createElement('span');rk.className='rk';rk.textContent=i+1;
    const nm=document.createElement('span');nm.className='nm';nm.textContent=String(r.name||'???').slice(0,14);
    const sc=document.createElement('span');sc.className='sc';sc.textContent=String(r.score|0).padStart(6,'0');
    li.append(rk,nm,sc);lbList.appendChild(li)})}
export function showBoard(){runScore=S.score;postedRun=false;myDoc=null;myEntry=null;placeBoard();lbEl.hidden=false;if(!lbDb){lbForm.hidden=true;lbMsg.textContent='Loading scores…';board=[];renderBoard();sbRefresh();return}
  const can=!!lbDb&&runScore>0;lbForm.hidden=!can;lbGo.disabled=false;
  lbMsg.textContent=!lbDb?'Leaderboard unavailable in this view.':runScore>0?'':'Score something to get on the board.';renderBoard()}
export function hideBoard(){lbEl.hidden=true;if(document.activeElement===lbName)lbName.blur()}
addEventListener('resize',()=>{if(!lbEl.hidden)placeBoard()});
lbForm.addEventListener('submit',async e=>{e.preventDefault();if(postedRun)return;
  if(!lbDb){const name=lbName.value.trim().slice(0,16);if(!name){lbMsg.textContent='Type a name first.';lbName.focus();return}
    try{localStorage.setItem('palm_name',name)}catch(e){}
    lbGo.disabled=true;lbMsg.textContent='Posting…';
    const body={game:'palm',name,score:Math.max(0,Math.min(50000000,Math.round(runScore))),grade:'C',stage:Math.max(1,Math.min(999,S.beat||1)),daily:false,date_key:null};
    let ok=false;try{const r=await fetch(SB_REST,{method:'POST',headers:{...SB_H,Prefer:'return=minimal'},body:JSON.stringify(body)});ok=r.ok}catch(err){}
    if(ok){postedRun=true;myEntry={name,score:body.score};lbForm.hidden=true;lbMsg.textContent='Posted.';sbRefresh()}else{lbGo.disabled=false;lbMsg.textContent='Could not post. Try again.'}
    return}
  const name=lbName.value.trim().slice(0,14);if(!name){lbMsg.textContent='Type a name first.';lbName.focus();return}
  try{localStorage.setItem('palm_name',name)}catch(e){}
  lbGo.disabled=true;lbMsg.textContent='Posting…';
  try{const ref=lbDb.collection('scores').doc();myDoc=ref.id;await ref.set({name,score:runScore,beats:S.beat,at:Date.now()});postedRun=true;lbForm.hidden=true;lbMsg.textContent='Posted.';renderBoard()}
  catch(err){lbGo.disabled=false;myDoc=null;lbMsg.textContent=err&&err.code==='invalid_argument'?'You can view the board, but posting needs Contributor access to this page.':'Could not post. Try again.'}});
(async()=>{try{lbDb=await window.claude?.use?.('db')}catch(e){lbDb=null}
  if(!lbDb)return;
  lbDb.collection('scores').orderBy('score','desc').limit(10).onSnapshot(snap=>{board=snap.docs.map(d=>({id:d.id,...(d.data()||{})}));if(!lbEl.hidden)renderBoard()},()=>{})})();
