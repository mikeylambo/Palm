import {SET,S,G} from './state.js';
let ac=null;
function ctx(){if(!ac){ac=new (window.AudioContext||window.webkitAudioContext)();loadSfx();hookMusic()}if(ac.state==='suspended')ac.resume();return ac}
export function tone(f,d,type='square',v=.15,slide,out){try{ctx();const o=ac.createOscillator(),gn=ac.createGain();o.type=type;o.frequency.value=f;if(slide)o.frequency.exponentialRampToValueAtTime(slide,ac.currentTime+d);gn.gain.setValueAtTime(Math.max(.0001,v*SET.sfx),ac.currentTime);gn.gain.exponentialRampToValueAtTime(.001,ac.currentTime+d);o.connect(gn).connect(out||ac.destination);o.start();o.stop(ac.currentTime+d)}catch(e){}}
export function buzz(p){if(!SET.haptics)return;try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}}

// the owner's sound files (sfx/*.mp3, cut and levelled from their picks), decoded up front so cues play with no lag.
// Until a file has loaded (or if it fails) each cue falls back to its synthesized version.
const NAMES=['pop','pop2','eyes_open','turn','nothing','flinch','strike','ko','flee','combo','slump','gameover','click'],BUF={};
function loadSfx(){NAMES.forEach(n=>fetch('sfx/'+n+'.mp3').then(r=>r.ok?r.arrayBuffer():Promise.reject()).then(b=>new Promise((ok,no)=>ac.decodeAudioData(b,ok,no))).then(d=>{BUF[n]=d}).catch(()=>{}))}
export const sfxLoaded=()=>Object.keys(BUF).length;
function sfx(name,vol=1,rate=1,offset=0,at=0){try{ctx();const b=BUF[name];if(!b)return null;const s=ac.createBufferSource(),gn=ac.createGain();s.buffer=b;s.playbackRate.value=rate;gn.gain.value=vol*SET.sfx;s.connect(gn).connect(ac.destination);s.start(ac.currentTime+at,offset);return{s,gn}}catch(e){return null}}

// the hakai boom: sub drop, saw growl, a mid thump that phone speakers can carry, low-passed noise burst.
// It runs hot into its own compressor so it sits on top of the music without clipping. A snap hits harder.
let boomBus=null;
function bus(){if(!boomBus){const c=ac.createDynamicsCompressor();c.threshold.value=-6;c.knee.value=6;c.ratio.value=6;c.attack.value=.002;c.release.value=.18;
  boomBus=ac.createGain();boomBus.gain.value=1.9;boomBus.connect(c).connect(ac.destination)}return boomBus}
export function kiBoom(big){buzz(big?70:45);G.shake=Math.max(G.shake,big?26:18);ctx();const o=bus();
  tone(85,.55,'sine',.6,30,o);tone(170,.32,'triangle',.32,60,o);tone(160,.3,'sawtooth',.24,50,o);if(big){tone(52,.9,'sine',.6,22,o);tone(1200,.08,'square',.14,300,o)}
  try{const n=ac.sampleRate*(big?.7:.45),b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.2);const src=ac.createBufferSource(),gn=ac.createGain(),f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=big?3000:2300;gn.gain.value=(big?.65:.5)*SET.sfx;src.buffer=b;src.connect(f).connect(gn).connect(o);src.start()}catch(e){}}

// cues you can react to by ear
export function popIn(){if(!sfx('pop',1,.93+Math.random()*.14)){const f=760+Math.random()*180;tone(f,.07,'triangle',.13,f*.4);tone(140,.06,'square',.06,60)}}
export function popSecond(){if(!sfx('pop2',1,.95+Math.random()*.1))tone(1100,.07,'triangle',.11,500)} // the second Twin
export function eyesOpen(){if(!sfx('eyes_open')){tone(1480,.05,'triangle',.12);setTimeout(()=>tone(1980,.06,'triangle',.1),35)}}
export function turnSting(){buzz(25);if(!sfx('turn')){tone(233,.28,'sawtooth',.09,170);tone(247,.28,'square',.06,180)}}
export function passSound(){tone(300,.25,'sine',.14,200)}
export function flinchSound(){if(!sfx('flinch'))tone(140,.2,'square',.12)}
export function strikeSound(kind,thud=true){if(thud&&!sfx('strike'))tone(70,.4,'square',.18,45);sfx(kind==='ko'?'ko':'flee',.9)}
export function nothingSound(){sfx('nothing')}
export function comboSound(){if(!sfx('combo')){tone(660,.1,'triangle',.1);setTimeout(()=>tone(990,.15,'triangle',.1),90)}}
export function introSound(){tone(523,.12,'triangle',.1);setTimeout(()=>tone(784,.2,'triangle',.1),120)}
export function slumpSound(){if(!sfx('slump'))tone(110,1.1,'sine',.2,40)}
export function gameoverSound(){sfx('gameover')}
export function click(){if(!sfx('click'))tone(440,.08,'triangle',.12)}

// music: music.mp3 (the owner's Introspecs, 169 BPM), baked by tools/bake_music.py so its last moments turn into the
// bars before LOOP[0]. The first 32 s play once, then LOOP[0]..LOOP[1] (144 bars) loops sample-accurately in Web Audio
// (an <audio loop> leaves a gap and can't keep an intro). Both points sit 60 ms inside the baked hold, so a decoder that
// shifts the file by its MP3 padding still lands on the seam. Full level through play (no ducking while you wait);
// it only drops during pause and the game-over slump.
const LOOP=[32.438,236.522];let mg=null,mus=null,musBuf=null,musWant=false;
const musData=fetch('music.mp3').then(r=>r.ok?r.arrayBuffer():null).catch(()=>null); // download starts with the page
function hookMusic(){mg=ac.createGain();mg.connect(ac.destination);
  musData.then(b=>b&&new Promise((ok,no)=>ac.decodeAudioData(b,ok,no))).then(d=>{if(d){musBuf=d;playMusic()}}).catch(()=>{})}
function playMusic(){if(mus||!musBuf||!musWant)return;mus=ac.createBufferSource();mus.buffer=musBuf;mus.loop=true;
  mus.loopStart=LOOP[0];mus.loopEnd=Math.min(LOOP[1],musBuf.duration);mus.connect(mg);mus.start()}
export const musicState=()=>mus?{loopStart:mus.loopStart,loopEnd:mus.loopEnd}:null;
export function startMusic(){try{ctx();musWant=true;playMusic()}catch(e){}musicLevel()}
export function musicLevel(){
  const v=SET.music*(G.paused||S.mode==='fall'?.25:1);
  try{if(mg)mg.gain.setTargetAtTime(v,ac.currentTime,.04)}catch(e){}
}
