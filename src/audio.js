import {SET,S,G} from './state.js';
let ac=null;
export function tone(f,d,type='square',v=.15,slide){try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator(),gn=ac.createGain();o.type=type;o.frequency.value=f;if(slide)o.frequency.exponentialRampToValueAtTime(slide,ac.currentTime+d);gn.gain.setValueAtTime(Math.max(.0001,v*SET.sfx),ac.currentTime);gn.gain.exponentialRampToValueAtTime(.001,ac.currentTime+d);o.connect(gn).connect(ac.destination);o.start();o.stop(ac.currentTime+d)}catch(e){}}
export function buzz(p){if(!SET.haptics)return;try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}}
// the hakai boom: sub drop, saw growl, low-passed noise burst
export function kiBoom(){buzz(45);G.shake=Math.max(G.shake,18);tone(85,.55,'sine',.45,30);tone(160,.3,'sawtooth',.18,50);try{const n=ac.sampleRate*.45,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.2);const src=ac.createBufferSource(),gn=ac.createGain(),f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=1800;gn.gain.value=.35*SET.sfx;src.buffer=b;src.connect(f).connect(gn).connect(ac.destination);src.start()}catch(e){}}
// music: drop music.mp3 in the repo root. Ducks during the Lurker wait, pause and the game-over slump.
const bgm=document.getElementById('bgm');
export function startMusic(){try{bgm.volume=SET.music;if(bgm.paused)bgm.play().catch(()=>{})}catch(e){}}
export function musicLevel(){try{const duck=S.mode==='lurk'||G.paused||S.mode==='fall';bgm.volume=SET.music*(duck?.25:1)}catch(e){}}
setInterval(musicLevel,120);
