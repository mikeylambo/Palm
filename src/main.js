// PALM entry point: wires the modules and runs the main loop.
import {S,G} from './state.js';
import {update} from './game.js';
import {draw} from './render.js';
import './ui.js';
import './leaderboard.js';

function frame(t){
  if(t-G.boilT>120){G.boil++;G.boilT=t}
  if(!G.paused)update(t);
  draw(t);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// read-only hook for the headless tests
window.PALM={get S(){return S},get G(){return G},get fig(){return G.fig}};
