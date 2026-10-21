// Shared constants and mutable game state. Scalars live on G so every module sees the same values.
export const C={paper:'#eef59a',ink:'#111014',violet:'#7b5bd6',threat:'#e0304a',grace:'#e2a92b',dim:'#55534a'};
export const TOP=[[175,60],[580,40],[580,440],[205,480]], BOT=[[250,520],[580,478],[580,780],[285,780]];
export const ROSTER={
  wanderer:{name:'WANDERER',tip:'Read the aura, then the eyes.',at:0},
  lurker:{name:'LURKER',tip:'A shadow that sometimes never comes. Do not flinch.',at:10},
  sleeper:{name:'SLEEPER',tip:'Eyes shut. Wait for them to open, then read them. Move first and you flinch.',at:16},
  twins:{name:'TWINS',tip:'Two faces, one verdict. Blast if either one is a threat.',at:23},
  turncoat:{name:'TURNCOAT',tip:'Smiles at first. Some turn. Move before the turn and you flinch.',at:30},
};
export const S={mode:'title',score:0,combo:1,strikes:0,beat:0,best:0,heat:0};
try{S.best=+localStorage.getItem('palm_best')||0}catch(e){}
// fig: current arrival. t0/lurk/win: beat timing (ms). res: last verdict being animated. card: intro card.
// learnType/learnLeft: the newest type and how many arrivals of its learn stretch are left.
export const G={fig:null,t0:0,win:2200,lurk:0,res:null,card:null,shake:0,force:null,learnType:null,learnLeft:0,
  boil:0,boilT:0,paused:false,pauseAt:0,buffered:null,missT:-9999,missSeed:0,fallT:0,lastClassic:false,
  stopUntil:0,killer:null}; // stopUntil: hit-stop end time. killer: the arrival behind the run-ending mistake
export const seen=new Set();
// the three onlookers are the lives
export const OL=[{},{},{}].map(()=>({gone:0,kind:''}));
export const SET={music:.7,sfx:.8,shake:true,flashes:true,haptics:true};try{Object.assign(SET,JSON.parse(localStorage.getItem("palm_settings")||"{}"))}catch(e){}
export function saveSet(){try{localStorage.setItem("palm_settings",JSON.stringify(SET))}catch(e){}}
export const R=(a,b)=>a+Math.random()*(b-a),RI=n=>Math.floor(Math.random()*n);
