// Game flow. Modes: title, card, lurk, beat, resolve, fall, over ('x' while a run starts).
import {S,G,OL,seen,RI} from './state.js';
import {newFig,correctAct,freshType} from './characters.js';
import {tone,buzz,kiBoom,startMusic} from './audio.js';
import {panelOpen,showMenu,hideMenu} from './ui.js';
import {showBoard,hideBoard} from './leaderboard.js';

export function startBeat(){
  if(G.ruleLeft>0){G.ruleLeft--}else{G.rule=null;if(S.beat>10&&S.beat%10===6){G.rule=Math.random()<.5?'ALL':'NONE';G.ruleLeft=3;G.card={kind:'rule',txt:G.rule==='ALL'?'LET NOTHING PASS':'MERCY: PASS EVERYONE',t:performance.now()};S.mode='card';tone(220,.3,'sawtooth',.1);return}}
  if(!G.rule&&maybeIntro())return;
  spawn();
}
function maybeIntro(){
  // first time a character type appears, show its card
  const type=freshType();
  if(type){seen.add(type);G.force=type;G.card={kind:'intro',type,t:performance.now()};S.mode='card';tone(523,.12,'triangle',.1);setTimeout(()=>tone(784,.2,'triangle',.1),120);return true}
  return false;
}
export function spawn(){
  const fig=G.fig=newFig();
  G.win=Math.max(900,2200-S.beat*55);if(S.beat>40)G.win=Math.max(600,900-(S.beat-40)*8);
  if(fig.type==='sleeper'){const ms=150+Math.pow(Math.random(),1.6)*2200;G.win+=ms;fig.openAt=ms/G.win} // wildly variable nap: blink-short to agonizing
  // lurk: variable silence before the reveal. Wider spread as the run goes on.
  const spread=Math.min(1700,500+S.beat*60);G.lurk=250+Math.random()*spread;
  if(fig.type==='lurker'&&Math.random()<.5)G.lurk+=500;
  if(fig.type!=='lurker')G.lurk=0; // v1: arrivals pop in instantly; only the Lurker makes you wait
  G.t0=performance.now();S.mode='lurk';
}
// a mistake: one onlooker leaves ('ko' = knocked out by a threat let through, 'flee' = anything else)
function strike(kind='flee'){const alive=OL.filter(o=>!o.gone);if(alive.length){const o=alive[RI(alive.length)];o.gone=performance.now();o.kind=kind}S.strikes++;S.combo=1;G.shake=16;buzz([50,40,50]);G.missT=performance.now();G.missSeed=Math.random()*100;tone(70,.4,'square',.18,45)}
export function act(a){
  const now=performance.now();if(panelOpen())return;
  if(S.mode==='title'||S.mode==='over'){hideBoard();hideMenu();startMusic();OL.forEach(o=>{o.gone=0;o.kind=''});Object.assign(S,{mode:'x',score:0,combo:1,strikes:0,beat:0,heat:0});G.rule=null;G.ruleLeft=0;seen.clear();startBeat();return}
  if(G.paused){resume();return}
  const fig=G.fig;
  if(S.mode==='card'&&G.card.kind==='intro'&&now-G.card.t>500){spawn();return}
  if(S.mode==='lurk'&&G.t0+G.lurk-now<=80){G.buffered=a;return}
  if(S.mode==='lurk'){strike();tone(140,.2,'square',.12);G.res={a:'flinch',ok:false,t:now,dur:500};S.mode='resolve';S.beat++;return}
  if(S.mode!=='beat')return;
  const rt=now-G.t0-G.lurk,k=rt/G.win,want=correctAct(fig,k);
  const ok=a===want;
  if(fig.empty){ // empty lurk: only a blast is wrong
    if(a==='blast')strike();else{S.score+=50*S.combo;S.combo=Math.min(8,S.combo+1)}
  }else if(ok){S.score+=Math.round(100*S.combo+(rt<400?50:0)+(fig.type==='turncoat'&&fig.threat||fig.type==='sleeper'||fig.type==='child'?75:0));S.combo=Math.min(8,S.combo+1)}
  else strike(a==='pass'?'ko':'flee');
  if(a==='blast'){S.heat=Math.min(1,S.heat+.25);}else{S.heat=Math.max(0,S.heat-.2);tone(300,.25,'sine',.14,200)}
  const good=fig.empty?a!=='blast':ok,res=G.res={a,ok:good,t:now+(good?85:0),dur:a==='blast'?450+S.heat*350:650};
  if(a==='blast'){res.fx=['fling','crumble','cover'][Math.floor(Math.random()*3)];res.shards=Array.from({length:26},()=>({x:(Math.random()-.5)*110,y:(Math.random()-.5)*130,v:.5+Math.random(),s:3+Math.random()*7,r:Math.random()*6,ink:Math.random()<.6}));setTimeout(kiBoom,Math.max(0,res.t-now))}S.mode='resolve';S.beat++;
}
// per-frame game logic (skipped while paused)
export function update(t){
  const fig=G.fig;
  if(S.mode==='lurk'&&t-G.t0>G.lurk){S.mode='beat';if(G.buffered){const b=G.buffered;G.buffered=null;act(b)}}
  if(S.mode==='beat'){const k=(t-G.t0-G.lurk)/G.win;
    if(fig.type==='sleeper'&&!fig.woke&&k>=fig.openAt){fig.woke=true;G.shake=4}
    if(fig.type==='turncoat'&&fig.threat&&!fig.turned&&k>=fig.turnAt){fig.turned=true;G.shake=6}
    if(fig.empty&&k>.55){S.score+=50*S.combo;S.combo=Math.min(8,S.combo+1);G.res={a:'none',ok:true,t,dur:350};S.mode='resolve';S.beat++}
    else if(k>1)act('pass')}
  if(S.mode==='resolve'&&t-G.res.t>G.res.dur){if(S.strikes>=3){S.mode='fall';G.fallT=t;tone(110,1.1,'sine',.2,40)}else startBeat()}
  if(S.mode==='fall'&&t-G.fallT>1600){S.mode='over';showBoard();showMenu();if(S.score>S.best){S.best=S.score;try{localStorage.setItem('palm_best',S.best)}catch(e){}}}
  if(S.mode==='card'&&G.card.kind==='rule'&&t-G.card.t>1300)spawn();
}
export const playing=()=>['lurk','beat','resolve','card'].includes(S.mode);
export function pause(){if(!G.paused&&playing()){G.paused=true;G.pauseAt=performance.now();G.buffered=null;showMenu()}}
export function resume(){if(!G.paused)return;const d=performance.now()-G.pauseAt;G.t0+=d;if(G.res)G.res.t+=d;if(G.card)G.card.t+=d;G.paused=false;hideMenu()}
export function goTitle(){G.paused=false;G.buffered=null;hideBoard();G.fig=null;G.res=null;G.card=null;G.rule=null;G.ruleLeft=0;G.shake=0;G.missT=-9999;OL.forEach(o=>{o.gone=0;o.kind=''});Object.assign(S,{mode:'title',score:0,combo:1,strikes:0,beat:0,heat:0});showMenu()}
