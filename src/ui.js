// Input (keys, buttons, swipes), pause button, and the SETTINGS / CREDITS / TITLE menus.
import {S,G,SET,saveSet} from './state.js';
import {act,pause,resume,goTitle,playing} from './game.js';
import {click,musicLevel} from './audio.js';
import {cv} from './render.js';
import {lbEl,placeBoard} from './leaderboard.js';

const wrapEl=document.getElementById('wrap'),pauseBtn=document.getElementById('btn-pause'),menuLinks=document.getElementById('menu-links'),
  panelEl=document.getElementById('panel'),titleBtn=document.getElementById('btn-title'),blastBtn=document.getElementById('blast'),passBtn=document.getElementById('pass');
export const panelOpen=()=>!panelEl.hidden;

// ---------- input ----------
pauseBtn.onclick=()=>{G.paused?resume():pause();pauseBtn.blur()};
// pause keys: ignore auto-repeat (holding P toggled it back off), KeyP on any layout, capture phase so nothing else eats it
addEventListener('keydown',e=>{if(e.repeat||!panelEl.hidden||e.target.tagName==='INPUT')return;if(e.key==='Escape'||e.key==='p'||e.key==='P'||e.code==='KeyP'||e.key==='Pause'){e.preventDefault();G.paused?resume():pause()}},true);
// game buttons never take focus, so keys always reach the game and Space never double-fires a focused button
[pauseBtn,blastBtn,passBtn].forEach(b=>b.addEventListener('mousedown',e=>e.preventDefault()));
setInterval(()=>{const on=playing()&&panelEl.hidden;pauseBtn.hidden=!on;if(on){const w=wrapEl.getBoundingClientRect(),c=cv.getBoundingClientRect();pauseBtn.style.left=(c.right-w.left-54)+'px';pauseBtn.style.top=(c.top-w.top+10)+'px';pauseBtn.textContent=G.paused?'▶':'II'}},150);
addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
blastBtn.onclick=()=>act('blast');
passBtn.onclick=()=>act('pass');
// swipe right = blast, any other swipe = pass; a tap only starts, resumes or dismisses a card
let sw=null;cv.addEventListener('touchstart',e=>{const p=e.touches[0];sw={x:p.clientX,y:p.clientY}},{passive:true});
cv.addEventListener('touchend',e=>{if(!sw)return;const p=e.changedTouches[0],dx=p.clientX-sw.x,dy=p.clientY-sw.y;sw=null;
  if(Math.max(Math.abs(dx),Math.abs(dy))<30){if(S.mode==='title'||S.mode==='over'||G.paused||S.mode==='card')act('pass');return}
  if(dx>30&&Math.abs(dx)>Math.abs(dy))act('blast');else act('pass')},{passive:true});
addEventListener('keydown',e=>{if(e.repeat||e.target.tagName==='INPUT'||!panelEl.hidden)return;if(['ArrowRight',' ','d','D'].includes(e.key)){e.preventDefault();act('blast')}else if(['ArrowLeft','ArrowDown','a','A','s','S'].includes(e.key)){e.preventDefault();act('pass')}});

// ---------- menus: settings, credits, title ----------
function canvasBox(){const w=wrapEl.getBoundingClientRect(),c=cv.getBoundingClientRect();return{l:c.left-w.left,t:c.top-w.top,w:c.width,h:c.height,k:c.height/800}}
function placeMenu(){const b=canvasBox();menuLinks.style.left=b.l+'px';menuLinks.style.width=b.w+'px';const fs=Math.max(13,Math.min(20,b.k*26));menuLinks.querySelectorAll('button').forEach(x=>{x.style.fontSize=fs+'px';x.style.padding=(fs*.3)+'px '+(fs*.8)+'px'});menuLinks.style.top=(b.t+(S.mode==='over'?785*b.k-fs*2.2:G.paused?500*b.k:620*b.k))+'px';
  // panels cover the whole stage, but never shrink below a readable size (landscape phones)
  const W=wrapEl.clientWidth,H=wrapEl.clientHeight,pw=Math.min(W,Math.max(b.w,300)),ph=Math.min(H,Math.max(b.h,340));
  panelEl.style.left=Math.max(0,b.l+(b.w-pw)/2)+'px';panelEl.style.width=pw+'px';panelEl.style.top=Math.max(0,b.t+(b.h-ph)/2)+'px';panelEl.style.height=ph+'px';panelEl.style.maxHeight=''}
export function showMenu(){titleBtn.hidden=S.mode==='title';menuLinks.hidden=false;placeMenu()}
export function hideMenu(){menuLinks.hidden=true}
function openPanel(kind){placeMenu();lbEl.hidden=true;panelEl.textContent='';const h=document.createElement('h2');panelEl.appendChild(h);
  if(kind==='settings'){h.textContent='SETTINGS';
    [['music','Music volume'],['sfx','Sound effects']].forEach(([key,lab])=>{const l=document.createElement('label');l.textContent=lab;const r=document.createElement('input');r.type='range';r.min=0;r.max=1;r.step=.05;r.value=SET[key];r.id='set-'+key;r.oninput=()=>{SET[key]=+r.value;saveSet();if(key==='music')musicLevel();else click()};l.appendChild(r);panelEl.appendChild(l)});
    [['shake','Screen shake'],['flashes','Flashes'],['haptics','Vibration']].forEach(([key,lab])=>{const l=document.createElement('label');l.textContent=lab;const c=document.createElement('input');c.type='checkbox';c.checked=!!SET[key];c.id='set-'+key;c.onchange=()=>{SET[key]=c.checked;saveSet()};l.appendChild(c);panelEl.appendChild(l)});
  }else{h.textContent='CREDITS';
    [['Game','Mikey Lambo'],['Music','Mikey Lambo']].forEach(([role,who])=>{const d=document.createElement('div');d.className='credit';const b=document.createElement('b');b.textContent=role;d.append(b,who);panelEl.appendChild(d)})}
  const x=document.createElement('button');x.type='button';x.className='close';x.textContent='BACK';x.onclick=closePanel;panelEl.appendChild(x);
  panelEl.hidden=false;menuLinks.hidden=true;pauseBtn.hidden=true;panelEl.scrollTop=0;x.focus({preventScroll:true})}
function closePanel(){panelEl.hidden=true;if(S.mode==='title'||S.mode==='over'||G.paused)showMenu();if(S.mode==='over'){lbEl.hidden=false;placeBoard()}}
document.getElementById('btn-settings').onclick=()=>openPanel('settings');
document.getElementById('btn-credits').onclick=()=>openPanel('credits');
titleBtn.onclick=goTitle;
addEventListener('keydown',e=>{if(e.key==='Escape'&&!panelEl.hidden)closePanel()});
addEventListener('resize',()=>{if(!menuLinks.hidden||!panelEl.hidden)placeMenu()});
requestAnimationFrame(()=>{menuLinks.hidden=false;placeMenu()});
