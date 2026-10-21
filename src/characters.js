// Characters: who arrives, how they look, and the right call for each.
import {C,ROSTER,S,G,seen,R,RI} from './state.js';

// learn, then mix: right after a debut only the newcomer and the Wanderer come; after that, everyone
// you've met, the two newest a little more often. A type only ever debuts through its intro card.
export function pickType(){if(G.learnLeft>0)return Math.random()<.67?G.learnType:'wanderer';
  const sp=Object.keys(ROSTER).filter(k=>k!=='wanderer'&&seen.has(k)),pool=['wanderer',...sp,...sp.slice(-2)];
  return pool[Math.floor(Math.random()*pool.length)]}
export function freshType(){const e=Object.entries(ROSTER).find(([k,v])=>S.beat>=v.at&&!seen.has(k));return e&&e[0]}

const SKIN=['#ffffff','#f6ead8','#ead2b4','#d3ad87','#a87a56','#7d5539'];
// procedural face; ~17% of the time (never twice in a row) the original v1 face instead
export function newLook(){const useClassic=!G.lastClassic&&Math.random()<.17;G.lastClassic=useClassic;if(useClassic)return{classic:true,head:0,w:56,h:66,hair:0,hat:0,nose:0,ears:false,scar:false,freck:false,brow:5,mouth:18,skin:'#ffffff',seed:Math.random()*1000,tilt:0,mg:'none',bg:'none',cg:'none',smug:false,bob:R(2,5),bobs:R(160,240)};return{head:RI(4),w:R(48,62),h:R(56,74),hair:RI(6),hat:Math.random()<.35?1+RI(4):0,nose:RI(3),ears:Math.random()<.6,scar:false,freck:Math.random()<.2,brow:R(3,7),mouth:R(12,22),skin:SKIN[RI(SKIN.length)],seed:Math.random()*1000,tilt:R(-.12,.12),mg:['tongue','none','none','none'][RI(4)],bg:['raised','none','none'][RI(3)],cg:['blush','blush','sweat','none','none'][RI(5)],smug:Math.random()<.5,bob:R(2,7),bobs:R(140,260)}}

export function newFig(){
  const b=S.beat,type=G.force||pickType();G.force=null;
  let threat=Math.random()<.5;
  const disguise=b>=10&&Math.random()<Math.min(.5,(b-8)*.04);
  const f={type,threat,look:newLook(),empty:false,turnAt:0,turned:false,openAt:0};
  if(type==='turncoat'){f.threat=Math.random()<.6;f.aura=C.grace;f.slit=false;f.smile=true;f.turnAt=.2+Math.random()*.55}
  else if(type==='lurker'){f.empty=Math.random()<.35;f.aura=threat?C.threat:C.grace;f.slit=threat;f.smile=!threat;if(f.empty)f.threat=false}
  else if(type==='sleeper'){f.aura=C.violet;f.slit=threat;f.smile=!threat;f.openAt=.2+Math.random()*.35}
  else if(type==='twins'){const a=Math.random()<.5,b2=Math.random()<.5;f.threat=a||b2;f.aura=C.violet;
    f.pair=[{slit:a,smile:Math.random()<.5,look:newLook()},{slit:b2,smile:Math.random()<.5,look:newLook()}]}
  else if(type==='dancer'){f.threat=false;f.aura=C.threat;f.slit=false;f.smile=true;Object.assign(f.look,{classic:false,head:0,hat:0,mg:'none',tilt:0})}
  else{const at=disguise?!threat:threat;f.aura=at?C.threat:C.grace;f.slit=threat;f.smile=disguise?!threat:!threat}
  return f;
}
// k: fraction of the reaction window elapsed. 'early' = acting before a Sleeper wakes or a Turncoat turns.
export function correctAct(f,k){
  if(f.type==='turncoat'&&f.threat&&k<f.turnAt)return'early';
  if(f.type==='sleeper'&&k<f.openAt)return'early';
  return f.threat?'blast':'pass';
}
