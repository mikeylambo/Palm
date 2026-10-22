// Headless playthrough: plays a seeded run on a virtual clock until every character type has
// appeared, then checks intro cards, pause keys, TITLE, game over, and that nothing logged an error.
// Run: npm test   (needs the `playwright` package and a Chromium it can launch)
import {chromium} from 'playwright';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const TYPES=['wanderer','lurker','sleeper','twins','turncoat'];
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
  const rel=decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/,'/index.html');
  const file=path.join(root,path.normalize(rel));
  if(!file.startsWith(root)){res.writeHead(403);return res.end()}
  try{const body=await readFile(file);res.writeHead(200,{'content-type':MIME[path.extname(file)]||'application/octet-stream'});res.end(body)}
  catch{res.writeHead(404);res.end()}
}).listen(0);

// seeded Math.random, virtual performance.now / requestAnimationFrame / setTimeout, advanced by __step(ms)
function virtualClock(){
  let s=20260101;Math.random=()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
  let T=1000,raf=[],timers=[],id=0;performance.now=()=>T;
  window.requestAnimationFrame=cb=>{raf.push(cb);return raf.length};
  window.setTimeout=(cb,ms)=>{timers.push({at:T+(ms||0),cb,id:++id});return id};
  window.__step=dt=>{T+=dt;timers.sort((a,b)=>a.at-b.at||a.id-b.id);while(timers.length&&timers[0].at<=T)timers.shift().cb();const q=raf;raf=[];q.forEach(cb=>cb(T))};
  try{localStorage.clear()}catch{}
}

const fails=[],check=(ok,what)=>{console.log((ok?'  ok   ':'  FAIL ')+what);if(!ok)fails.push(what)};
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:900,height:1000},hasTouch:true});
const errors=[];
// fonts, the leaderboard and the (optional) music file are outside the game; ignore their network noise
const external=/fonts\.g|supabase/;
page.on('pageerror',e=>errors.push('pageerror: '+e.message));
page.on('console',m=>{if(m.type()==='error'&&!external.test(m.location().url||'')&&!/Failed to load resource/.test(m.text()))errors.push('console: '+m.text())});
await page.route(/fonts\.g|supabase/,r=>r.abort());
await page.addInitScript(virtualClock);
await page.goto(`http://localhost:${server.address().port}/index.html`);
await page.waitForFunction(()=>window.PALM&&window.__step);

// 1. play well until every type has shown up
const run=await page.evaluate(TYPES=>{
  const P=window.PALM,key=k=>dispatchEvent(new KeyboardEvent('keydown',{key:k}));
  const seen=new Set(),intros=[],debutBeforeIntro=[],seq=[];let acted=null,lastCard=null,lastFig=null;
  for(let f=0;f<60000&&seen.size<TYPES.length;f++){__step(1000/60);
    const S=P.S,G=P.G,fig=P.fig,now=performance.now();
    if(S.mode==='title'){if(f%30===0)key(' ');continue}
    if(S.mode==='card'){if(G.card!==lastCard){lastCard=G.card;if(G.card.kind==='intro')intros.push(G.card.type)}if(f%40===0)key('ArrowLeft');continue}
    if(fig&&fig!==lastFig){lastFig=fig;seq.push(fig.type)}
    if(fig&&!seen.has(fig.type)){seen.add(fig.type);if(!intros.includes(fig.type))debutBeforeIntro.push(fig.type)}
    if(S.mode==='beat'&&fig&&acted!==fig){const k=(now-G.t0-G.lurk)/G.win;
      const wait=fig.type==='sleeper'?fig.openAt+.05:fig.type==='turncoat'?fig.turnAt+.05:fig.type==='twins'?fig.secondAt+.05:.1;
      if(fig.empty)continue; // an empty lurk resolves itself
      if(k>wait){acted=fig;const a=fig.threat?'blast':'pass';key(a==='blast'?' ':'ArrowLeft')}}
  }
  const runs=intros.slice(1).filter(t=>{const i=seq.indexOf(t);return i>=0&&i+3<=seq.length&&seq.slice(i,i+3).some(x=>x!==t)});
  return {seen:[...seen],intros,debutBeforeIntro,runs,beat:P.S.beat,strikes:P.S.strikes,mode:P.S.mode};
},TYPES);
console.log(`played to beat ${run.beat}, ${run.strikes} strikes`);
await page.waitForFunction(()=>PALM.sfx>=16,null,{timeout:5000}).catch(()=>{});
check(await page.evaluate(()=>PALM.sfx)===16,'all 16 sound files load and decode');
for(const t of TYPES)check(run.seen.includes(t),`${t} appeared`);
const order=await page.evaluate(()=>{let met=null;try{met=localStorage.getItem('palm_metall')}catch{}return {met,first:JSON.stringify(PALM.AT)}});
check(order.first===JSON.stringify({wanderer:0,lurker:10,sleeper:16,twins:23,turncoat:30}),'first run uses the teaching order');
check(order.met==='1','meeting every type unlocks shuffled orders');
check(run.runs.length===0,'each debut comes three in a row'+(run.runs.length?' (not: '+run.runs+')':''));
check(run.debutBeforeIntro.length===0,`every type debuted after its intro card${run.debutBeforeIntro.length?' (not: '+run.debutBeforeIntro+')':''}`);

// 2. pause: P pauses, a held (repeating) P does not toggle it back, Esc resumes
const pause=await page.evaluate(()=>{const P=window.PALM,r=[];
  const kd=(key,code,repeat=false)=>dispatchEvent(new KeyboardEvent('keydown',{key,code,repeat,bubbles:true}));
  kd('p','KeyP');__step(16);r.push(P.G.paused);
  kd('p','KeyP',true);kd('p','KeyP',true);__step(16);r.push(P.G.paused);
  kd('Escape','Escape');__step(16);r.push(P.G.paused);
  kd('з','KeyP');__step(16);r.push(P.G.paused); // P on a non-Latin layout
  return r});
check(pause[0]===true,'P pauses');
check(pause[1]===true,'holding P keeps it paused');
check(pause[2]===false,'Esc resumes');
check(pause[3]===true,'KeyP pauses on any keyboard layout');

// 3. TITLE from the pause screen
await page.click('#btn-title');
const atTitle=await page.evaluate(()=>({mode:PALM.S.mode,paused:PALM.G.paused,score:PALM.S.score}));
check(atTitle.mode==='title'&&!atTitle.paused&&atTitle.score===0,'TITLE on the pause screen returns to the title');

// 4. swipes: tap starts and dismisses cards, swipe right blasts, swipe down passes
const swipes=await page.evaluate(()=>{const P=window.PALM,cv=document.getElementById('c'),r={};
  const touch=(type,x,y)=>{const t=new Touch({identifier:1,target:cv,clientX:x,clientY:y});cv.dispatchEvent(new TouchEvent(type,{touches:type==='touchend'?[]:[t],changedTouches:[t],bubbles:true}))};
  const swipe=(dx,dy)=>{touch('touchstart',300,300);touch('touchend',300+dx,300+dy)};
  const toBeat=()=>{for(let f=0;f<600&&!(P.S.mode==='beat'&&!P.fig.empty);f++){__step(1000/60);if(P.S.mode==='card'&&f%40===39)swipe(0,0)}};
  swipe(0,0);r.started=P.S.mode!=='title';
  toBeat();swipe(0,0);__step(16);r.tapIgnored=P.S.mode==='beat';
  swipe(120,10);r.right=P.G.res&&P.G.res.a;
  toBeat();r.held=!!(P.G.res&&P.G.res.stopped);swipe(5,120);r.down=P.G.res&&P.G.res.a;
  dispatchEvent(new KeyboardEvent('keydown',{key:'p'}));return r});
check(swipes.started,'a tap on the stage starts a run');
check(swipes.tapIgnored,'a tap during a beat does nothing');
check(swipes.right==='blast','swipe right blasts');
check(swipes.down==='pass','swipe down lets it pass');
check(swipes.held,'a blast lands with a hit-stop');
await page.click('#btn-title');

// 5. lose on purpose: always blast, reach game over, TITLE from there too
const over=await page.evaluate(()=>{const P=window.PALM,key=k=>dispatchEvent(new KeyboardEvent('keydown',{key:k}));
  for(let f=0;f<20000&&P.S.mode!=='over';f++){__step(1000/60);if(f%20===0)key(P.S.mode==='card'?'ArrowLeft':' ')}
  return {mode:P.S.mode,killer:!!P.G.killer}});
check(over.mode==='over','three mistakes end the run');
check(over.killer,'the face that ended the run is kept for the slump');
check(await page.isVisible('#btn-title'),'TITLE is offered at game over');
await page.click('#btn-title');
check(await page.evaluate(()=>PALM.S.mode)==='title','TITLE at game over returns to the title');

// 6. after meeting everyone, later runs keep the Lurker first and shuffle the rest into the same slots
const deals=await page.evaluate(()=>{const seenOrders=new Set();let lurkerFirst=true;
  for(let i=0;i<30;i++){const key=k=>dispatchEvent(new KeyboardEvent('keydown',{key:k}));key(' ');__step(16);const a=PALM.AT;
    if(a.wanderer!==0||a.lurker!==10)lurkerFirst=false;seenOrders.add([a.sleeper,a.twins,a.turncoat].join());document.getElementById('btn-title')?.click();PALM.S.mode!=='title'&&dispatchEvent(new KeyboardEvent('keydown',{key:'p'}));__step(16);document.getElementById('btn-title')?.click()}
  return {lurkerFirst,orders:[...seenOrders]}});
check(deals.lurkerFirst,'the Lurker always debuts first');
check(deals.orders.length>1&&deals.orders.every(o=>o.split(',').sort().join()==='16,23,30'),'Sleeper, Twins and Turncoat shuffle into the 16/23/30 slots ('+deals.orders.length+' orders seen)');

check(errors.length===0,'no console errors'+(errors.length?':\n    '+errors.join('\n    '):''));
await browser.close();server.close();
console.log(fails.length?`\n${fails.length} check(s) failed`:'\nall checks passed');
process.exit(fails.length?1:0);
