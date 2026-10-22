// Game flow. Modes: title, card, lurk, beat, resolve, fall, over ('x' while a run starts).
import {ROSTER,S,G,OL,seen,RI,ramp,jabOrHold,dealOrder} from './state.js';
import {newFig,correctAct,freshType} from './characters.js';
import {buzz,kiBoom,startMusic,popIn,popSecond,eyesOpen,turnSting,passSound,flinchSound,strikeSound,nothingSound,comboSound,introSound,slumpSound,gameoverSound,shadowStart,shadowStop} from './audio.js';
import {panelOpen,showMenu,hideMenu} from './ui.js';
import {showBoard,hideBoard} from './leaderboard.js';

export function startBeat(){
  if(maybeIntro())return;
  spawn();
}
function maybeIntro(){
  // first time a character type appears, show its card
  const type=freshType();
  if(type){seen.add(type);if(seen.size===Object.keys(ROSTER).length)try{localStorage.setItem('palm_metall','1')}catch(e){}G.force=type;G.learnType=type;G.learnLeft=3;G.card={kind:'intro',type,t:performance.now()};S.mode='card';introSound();return true}
  return false;
}
export function spawn(){
  const fig=G.fig=newFig(),learning=G.learnLeft>0;if(learning)G.learnLeft--;
  G.win=Math.max(1200,2200-S.beat*55); // warm-up, then the clock holds: tension comes from the characters' timing
  if(fig.type==='sleeper'){const ms=150+Math.pow(Math.random(),1.6)*2200;G.win+=ms;fig.openAt=ms/G.win} // wildly variable nap: blink-short to agonizing
  if(fig.type==='twins'){const ms=jabOrHold(150,350,700,1100);G.win+=ms;fig.secondAt=ms/G.win} // the second face comes a beat after the first
  // lurk: variable silence before the reveal. Wider spread as the run goes on.
  const spread=ramp(S.beat,[[0,500],[20,1700],[45,2100]]);G.lurk=jabOrHold(250,600,250+spread*.6,250+spread);
  if(fig.type==='lurker'&&G.lurk>600&&Math.random()<.5)G.lurk+=500; // a Lurker's hold can stretch further; its jabs stay quick
  // most arrivals pop in instantly; once the Lurker is known, a growing share of anyone you've met comes out of the shadow
  if(fig.type!=='lurker'&&!(seen.has('lurker')&&!learning&&Math.random()<ramp(S.beat,[[10,0],[25,.3]])))G.lurk=0;
  // the shadow sometimes twitches once mid-wait, baiting a flinch (the rule never changes: never act on a shadow)
  if(G.lurk>700&&Math.random()<.4)fig.twitchAt=G.lurk*(.3+Math.random()*.4);
  G.t0=performance.now();S.mode='lurk';if(G.lurk>0)shadowStart(G.lurk);
}
// a mistake: one onlooker leaves ('ko' = knocked out by a threat let through, 'flee' = anything else)
function strike(kind='flee',thud=true){const alive=OL.filter(o=>!o.gone);if(alive.length){const o=alive[RI(alive.length)];o.gone=performance.now();o.kind=kind}S.strikes++;if(S.strikes===3)G.killer=G.fig&&!G.fig.empty?G.fig:null;S.combo=1;G.shake=16;buzz([50,40,50]);G.missT=performance.now();G.missSeed=Math.random()*100;strikeSound(kind,thud)}
function comboUp(){const c=S.combo;S.combo=Math.min(8,c+1);if((c<4&&S.combo>=4)||(c<8&&S.combo>=8))comboSound()}
// when acting became valid (ms after t0): the reveal, a Sleeper's eyes opening, a Turncoat's turn, the second Twin
function validAt(f){return G.lurk+G.win*(f.type==='sleeper'?f.openAt:f.type==='twins'?f.secondAt:f.type==='turncoat'&&f.threat?f.turnAt:0)}
export function act(a){
  const now=performance.now();if(panelOpen())return;
  if(S.mode==='title'||S.mode==='over'){hideBoard();hideMenu();startMusic();OL.forEach(o=>{o.gone=0;o.kind=''});Object.assign(S,{mode:'x',score:0,combo:1,strikes:0,beat:0,heat:0});G.killer=null;G.learnLeft=0;seen.clear();dealOrder();startBeat();return}
  if(G.paused){resume();return}
  const fig=G.fig;
  if(S.mode==='card'&&G.card.kind==='intro'&&now-G.card.t>500){spawn();return}
  if(S.mode==='lurk'&&G.t0+G.lurk-now<=80){G.buffered=a;return}
  // a move made too early (at a shadow, at empty air, at shut eyes, before a turn) is a strike like any other mistake
  const flinch=()=>{shadowStop();strike('flee',false);flinchSound();G.res={a:'flinch',ok:false,n:S.strikes,t:now,dur:500,lurk:S.mode==='lurk'};S.mode='resolve';S.beat++};
  if(S.mode==='lurk'){flinch();return}
  if(S.mode!=='beat')return;
  const rt=now-G.t0-G.lurk,k=rt/G.win,want=correctAct(fig,k);
  if(want==='early'||fig.empty&&a==='blast'){flinch();return}
  const ok=a===want;
  // the speed bonus counts from the moment acting became valid; a snap right after a wait hits harder
  const rv=now-G.t0-validAt(fig),waited=G.lurk>0||validAt(fig)>G.lurk,snap=ok&&!fig.empty&&waited&&rv<400;
  if(fig.empty){S.score+=50*S.combo;comboUp()}
  else if(ok){S.score+=Math.round(100*S.combo+(rv<400?50:0)+(fig.type==='turncoat'&&fig.threat||fig.type==='sleeper'||fig.type==='twins'?75:0));comboUp()}
  else strike(a==='pass'?'ko':'flee');
  if(a==='blast'){S.heat=Math.min(1,S.heat+.25);}else{S.heat=Math.max(0,S.heat-.2);passSound()}
  const good=fig.empty||ok,res=G.res={a,ok:good,n:S.strikes,snap,t:now+(good?85:0),dur:a==='blast'?450+S.heat*350:650};
  if(a==='blast'){res.fx=['fling','crumble','cover'][Math.floor(Math.random()*3)];res.shards=Array.from({length:26},()=>({x:(Math.random()-.5)*110,y:(Math.random()-.5)*130,v:.5+Math.random(),s:3+Math.random()*7,r:Math.random()*6,ink:Math.random()<.6}));setTimeout(()=>kiBoom(snap),Math.max(0,res.t-now))}S.mode='resolve';S.beat++;
}
// per-frame game logic (skipped while paused)
export const HITSTOP=75,SNAP_HITSTOP=140;
export function update(t){
  const fig=G.fig;
  if(S.mode==='resolve'&&G.res.a==='blast'&&!G.res.stopped&&t>=G.res.t){G.res.stopped=true;G.stopUntil=t+(G.res.snap?SNAP_HITSTOP:HITSTOP)}
  if(S.mode==='lurk'&&t-G.t0>G.lurk){S.mode='beat';if(!fig.empty)popIn();if(G.buffered){const b=G.buffered;G.buffered=null;act(b)}}
  if(S.mode==='beat'){const k=(t-G.t0-G.lurk)/G.win;
    if(fig.type==='sleeper'&&!fig.woke&&k>=fig.openAt){fig.woke=true;G.shake=4;eyesOpen()}
    if(fig.type==='turncoat'&&fig.threat&&!fig.turned&&k>=fig.turnAt){fig.turned=true;G.shake=6;turnSting()}
    if(fig.type==='twins'&&!fig.both&&k>=fig.secondAt){fig.both=true;G.shake=3;popSecond()}
    if(fig.empty&&k>.55){S.score+=50*S.combo;comboUp();G.res={a:'none',ok:true,t,dur:350};S.mode='resolve';S.beat++;nothingSound()}
    else if(k>1)act('pass')}
  if(S.mode==='resolve'&&t-G.res.t>G.res.dur){if(S.strikes>=3){S.mode='fall';G.fallT=t;slumpSound()}else startBeat()}
  if(S.mode==='fall'&&t-G.fallT>1600){S.mode='over';gameoverSound();showBoard();showMenu();if(S.score>S.best){S.best=S.score;try{localStorage.setItem('palm_best',S.best)}catch(e){}}}
}
export const playing=()=>['lurk','beat','resolve','card'].includes(S.mode);
export function pause(){if(!G.paused&&playing()){G.paused=true;G.pauseAt=performance.now();G.buffered=null;shadowStop();showMenu()}}
export function resume(){if(!G.paused)return;const d=performance.now()-G.pauseAt;G.t0+=d;if(G.res)G.res.t+=d;if(G.card)G.card.t+=d;G.paused=false;if(S.mode==='lurk')shadowStart(G.t0+G.lurk-performance.now());hideMenu()}
export function goTitle(){shadowStop();G.paused=false;G.buffered=null;hideBoard();G.fig=null;G.res=null;G.card=null;G.shake=0;G.missT=-9999;G.killer=null;G.learnLeft=0;OL.forEach(o=>{o.gone=0;o.kind=''});Object.assign(S,{mode:'title',score:0,combo:1,strikes:0,beat:0,heat:0});showMenu()}
