// PALM entry point: wires the modules and runs the main loop.
import {S,G,AT} from './state.js';
import {update} from './game.js';
import {musicLevel,sfxLoaded,musicState} from './audio.js';
import {draw} from './render.js';
import './ui.js';
import './leaderboard.js';

function frame(t){
  requestAnimationFrame(frame);
  if(t<G.stopUntil)return; // hit-stop: the impact frame holds, then time picks up where it froze
  if(t-G.boilT>120){G.boil++;G.boilT=t}
  if(!G.paused)update(t);
  musicLevel();
  draw(t);
  if(G.stopUntil>t){const d=G.stopUntil-t;G.res.t+=d;G.t0+=d}
}
requestAnimationFrame(frame);
// read-only hook for the headless tests
window.PALM={get S(){return S},get G(){return G},get fig(){return G.fig},get AT(){return AT},get sfx(){return sfxLoaded()},get music(){return musicState()}};
