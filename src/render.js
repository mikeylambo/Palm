// All drawing. Manga page on a 600x800 canvas: top panel (arrival), bottom panel (onlookers), guardian on the left.
import {C,TOP,BOT,ROSTER,S,G,OL,SET} from './state.js';
export const cv=document.getElementById('c'),g=cv.getContext('2d');
// line boil: tiny per-layer jitter that changes ~8x a second, so hand-inked lines "breathe"
function j(k){const s=Math.sin(G.boil*12.9898+k*78.233)*43758.5453;return (s-Math.floor(s))-.5}
function layer(k,fn){g.save();g.translate(j(k)*1.6,j(k+1)*1.6);g.rotate(j(k+2)*.004);fn();g.restore()}
function poly(p,k=0){g.beginPath();p.forEach(([x,y],i)=>{const dx=j(k+i)*1.5,dy=j(k+i+9)*1.5;i?g.lineTo(x+dx,y+dy):g.moveTo(x+dx,y+dy)});g.closePath()}
function drawAura(cx,cy,col,t,alpha=1){
  g.save();poly(TOP);g.clip();g.globalAlpha=alpha;
  const gr=g.createRadialGradient(cx,cy,20,cx,cy,330);gr.addColorStop(0,'#fff');gr.addColorStop(.35,col+'cc');gr.addColorStop(1,col+'22');g.fillStyle=gr;g.fillRect(150,30,440,460);
  g.strokeStyle=C.ink;
  for(let i=0;i<64;i++){const a=i/64*Math.PI*2+j(i)*.03,r1=110+(i*37%40),r2=340;g.lineWidth=.6+((i*13)%5)*.5;g.beginPath();g.moveTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1);g.lineTo(cx+Math.cos(a)*r2,cy+Math.sin(a)*r2);g.stroke()}
  g.restore();
}
function face(L,o){ // parametric head: o={slit,smile,turned,closed,big,react}
  if(L.classic){ // the two original v1 faces: grinning friend, frazzled grump
    const pan=o.react==='panic';g.save();g.lineWidth=3;g.strokeStyle=C.ink;g.lineJoin='round';
    g.fillStyle=C.ink;g.beginPath();for(let i=0;i<=14;i++){const a=Math.PI*1.05+i/14*Math.PI*.9,r=i%2?78:120+((L.seed*(i+3))%30);g.lineTo(Math.cos(a)*r,Math.sin(a)*r-20)}g.closePath();g.fill();
    g.fillStyle='#fff';g.beginPath();g.ellipse(0,0,56,66,0,0,7);g.fill();g.stroke();
      const up=pan?-14:0;g.lineWidth=5;g.beginPath();g.moveTo(-40,-22+up);g.lineTo(-12,(o.smile?-24:-12)+up);g.moveTo(40,-22+up);g.lineTo(12,(o.smile?-24:-12)+up);g.stroke();
    g.lineWidth=3;[-24,24].forEach(x=>{
      if(o.closed){g.beginPath();g.arc(x,-4,11,.15*Math.PI,.85*Math.PI);g.stroke();return}
      const W=pan?1.6:1;g.fillStyle='#fff';g.beginPath();g.ellipse(x,-2,13*W,9*W,0,0,7);g.fill();g.stroke();
      g.fillStyle=o.turned?C.threat:C.ink;g.beginPath();o.slit?g.ellipse(x,-2,2.2,9,0,0,7):g.arc(x,-2,6,0,7);g.fill()});
    if(o.closed){g.font='bold 22px sans-serif';g.fillStyle=C.ink;g.textAlign='left';g.fillText('z',40,-46+j(3)*4);g.fillText('Z',52,-66+j(4)*4)}
    g.beginPath();
    if(pan){g.fillStyle=C.ink;g.ellipse(0,32,20,18,0,0,7);g.fill()}
    else if(o.smile){g.arc(0,26,18,.15*Math.PI,.85*Math.PI);g.stroke()}else{g.moveTo(-18,34);g.lineTo(-6,24);g.lineTo(6,30);g.lineTo(18,22);g.stroke()}
    if(o.turned){g.strokeStyle=C.threat;g.lineWidth=3;for(let i=0;i<5;i++){g.beginPath();g.moveTo(-50+i*25,-70);g.lineTo(-44+i*25,-50);g.stroke()}}
    g.restore();return;
  }
  const w=L.w,h=L.h;g.save();g.rotate(L.tilt);g.lineWidth=3;g.strokeStyle=C.ink;g.lineJoin='round';g.lineCap='round';
  const sd=n=>{const v=Math.sin(L.seed+n*91.7)*999;return v-Math.floor(v)};
  // hair behind
  g.fillStyle=C.ink;
  if(L.hair===0){g.beginPath();for(let i=0;i<=14;i++){const a=Math.PI*1.05+i/14*Math.PI*.9,r=i%2?h*1.1:h*1.6+sd(i)*h*.5+j(i)*4;g.lineTo(Math.cos(a)*r*w/56,Math.sin(a)*r-18)}g.closePath();g.fill()}
  if(L.hair===4){[-1,1].forEach(s2=>{g.beginPath();g.arc(s2*w*.85,-h*.85,w*.38,0,7);g.fill()})}
  if(L.ears){g.fillStyle=L.skin;[-1,1].forEach(s2=>{g.beginPath();g.ellipse(s2*w*1.02,2,10,16,0,0,7);g.fill();g.stroke()})}
  // head
  g.fillStyle=L.skin;g.beginPath();
  if(L.head===1){const r=16;g.moveTo(-w+r,-h);g.lineTo(w-r,-h);g.quadraticCurveTo(w,-h,w,-h+r);g.lineTo(w,h-r);g.quadraticCurveTo(w,h,w-r,h);g.lineTo(-w+r,h);g.quadraticCurveTo(-w,h,-w,h-r);g.lineTo(-w,-h+r);g.quadraticCurveTo(-w,-h,-w+r,-h)}
  else if(L.head===2){g.moveTo(0,-h);g.bezierCurveTo(w*.9,-h,w*1.25,h*.6,0,h);g.bezierCurveTo(-w*1.25,h*.6,-w*.9,-h,0,-h)}
  else if(L.head===3){g.moveTo(0,-h*1.1);g.bezierCurveTo(w*1.2,-h*1.1,w*.9,h,0,h);g.bezierCurveTo(-w*.9,h,-w*1.2,-h*1.1,0,-h*1.1)}
  else g.ellipse(0,0,w,h,0,0,7);
  g.fill();g.lineWidth=4;g.stroke();
  // hair on top
  g.fillStyle=C.ink;g.lineWidth=3;
  if(L.hair===1){g.beginPath();g.ellipse(0,-h*.55,w*1.04,h*.6,0,Math.PI,0);g.lineTo(w*1.04,-h*.35);for(let i=0;i<=8;i++)g.lineTo(w*1.04-i*w*2.08/8,-h*.35+(i%2?10:0));g.closePath();g.fill()}
  if(L.hair===2){g.strokeStyle='#fff';g.beginPath();g.arc(-w*.35,-h*.65,10,3.6,4.6);g.stroke();g.strokeStyle=C.ink}
  if(L.hair===3){g.beginPath();g.moveTo(-10,-h*.6);for(let i=0;i<6;i++){g.lineTo(-8+i*3,-h-30-sd(i)*20);g.lineTo(-6+i*3,-h*.9)}g.lineTo(10,-h*.6);g.fill()}
  if(L.hair===5){for(let i=0;i<14;i++){const x=-w+i*w/7;g.beginPath();g.moveTo(x,-h*.55);g.quadraticCurveTo(x+sd(i)*30-15,-h-15,x+sd(i+3)*20,-h-25-sd(i+7)*20);g.stroke()}}
  // hats
  if(L.hat===1){g.fillStyle='#e9e3d3';[-1,1].forEach(s2=>{g.beginPath();g.moveTo(s2*w*.5,-h*.8);g.quadraticCurveTo(s2*w*1.2,-h*1.2,s2*w*.9,-h*1.8);g.quadraticCurveTo(s2*w*.8,-h*1.2,s2*w*.2,-h*.95);g.fill();g.stroke()})}
  if(L.hat===2){g.fillStyle='#5d6aa0';g.beginPath();g.ellipse(0,-h*.7,w*.95,h*.45,0,Math.PI,0);g.fill();g.stroke();g.beginPath();g.ellipse(w*.5,-h*.7,w*.8,9,0,0,7);g.fill();g.stroke()}
  if(L.hat===3){g.fillStyle=C.grace;g.beginPath();g.moveTo(-w*.6,-h*.85);for(let i=0;i<=4;i++){g.lineTo(-w*.6+i*w*.3,-h*(i%2?1.05:1.4))}g.lineTo(w*.6,-h*.85);g.closePath();g.fill();g.stroke()}
  if(L.hat===4){g.fillStyle=C.threat;g.beginPath();g.moveTo(-w,-h*.45);g.quadraticCurveTo(0,-h*.75,w,-h*.45);g.lineTo(w,-h*.25);g.quadraticCurveTo(0,-h*.5,-w,-h*.25);g.closePath();g.fill();g.stroke();g.beginPath();g.moveTo(w,-h*.35);g.lineTo(w+22,-h*.15);g.lineTo(w+10,-h*.45);g.fill();g.stroke()}
  const E=o.big?1.4:1,ex=w*.42,ey=-h*.05;
  // brows
  const T=performance.now(),pan=o.react==='panic';
  let dl=0,dr=0;if(L.bg==='raised')dr=-10;if(pan){dl=dr=-16}
  g.lineWidth=L.brow;g.beginPath();g.moveTo(-ex-14,ey-20+dl);g.lineTo(-ex+12,(o.smile?ey-22:ey-10)+dl);g.moveTo(ex+14,ey-20+dr);g.lineTo(ex-12,(o.smile?ey-22:ey-10)+dr);g.stroke();
  // eyes
  g.lineWidth=3;[-ex,ex].forEach(x=>{
    if(o.closed){g.beginPath();g.arc(x,ey-2,11*E,.15*Math.PI,.85*Math.PI);g.stroke();return}
    const W=pan?1.7:1;g.fillStyle='#fff';g.beginPath();g.ellipse(x,ey,13*E*W,9*E*W,0,0,7);g.fill();g.stroke();
    if(L.smug&&o.smile&&!pan){g.save();g.fillStyle=L.skin;g.beginPath();g.moveTo(x-15*E,ey-10*E);g.lineTo(x+15*E,ey-10*E);g.lineTo(x+15*E,ey-2*E+(x<0?3:-3));g.lineTo(x-15*E,ey-2*E+(x<0?-3:3));g.closePath();g.fill();g.lineWidth=3;g.beginPath();g.moveTo(x-14*E,ey-2*E+(x<0?-3:3));g.lineTo(x+14*E,ey-2*E+(x<0?3:-3));g.stroke();g.restore()}
    g.fillStyle=o.turned?C.threat:C.ink;g.beginPath();o.slit?g.ellipse(x,ey,2.2*E,9*E,0,0,7):g.arc(x,ey,6*E,0,7);g.fill()});
  if(o.closed){g.font='bold 22px sans-serif';g.fillStyle=C.ink;g.textAlign='left';g.fillText('z',w*.7,-h*.7+j(3)*4);g.fillText('Z',w*.9,-h*1.0+j(4)*4)}
  // nose
  g.lineWidth=2.5;g.beginPath();
  if(L.nose===0){g.moveTo(-2,ey+12);g.lineTo(-7,ey+24);g.lineTo(2,ey+25)}else if(L.nose===1){g.arc(0,ey+20,5,0,Math.PI)}else{g.moveTo(-4,ey+22);g.lineTo(4,ey+22)}
  g.stroke();
  // mouth
  const mw=L.mouth,my=h*.45;g.lineWidth=3;g.beginPath();
  if(pan){g.fillStyle=C.ink;g.ellipse(0,my,mw*1.1,mw*.9+6,0,0,7);g.fill();g.fillStyle='#fff';g.fillRect(-mw*.8,my-mw*.9+2,mw*1.6,7);g.fillRect(-mw*.7,my+mw*.6-2,mw*1.4,6);g.fillStyle='#e8627a';g.beginPath();g.ellipse(0,my+mw*.45,mw*.5,5,0,0,7);g.fill()}
  else{
  if(o.smile){g.lineWidth=4;g.arc(0,my-20,mw*1.35,.12*Math.PI,.88*Math.PI)}else{g.moveTo(-mw,my+6);g.lineTo(-mw/3,my-4);g.lineTo(mw/3,my+2);g.lineTo(mw,my-6)}g.stroke();
  const ty=o.smile?my-14+mw*.95:my;
  g.lineWidth=2.5;
  if(L.mg==='tongue'){g.fillStyle='#e8627a';g.beginPath();g.ellipse(4,ty+9,8,11,.2,0,Math.PI);g.lineTo(-4,ty);g.closePath();g.fill();g.stroke();g.beginPath();g.moveTo(4,ty+2);g.lineTo(5,ty+12);g.stroke()}
  }
  if(L.cg==='blush'&&!pan){g.fillStyle='rgba(240,110,110,.55)';[-1,1].forEach(s2=>{g.beginPath();g.ellipse(s2*(ex+8),ey+24,13,9,0,0,7);g.fill()})}
  if(L.cg==='sweat'||pan){g.fillStyle='#9fd1f2';g.lineWidth=2;g.beginPath();g.moveTo(w*.75,-h*.55);g.quadraticCurveTo(w*1.05,-h*.15,w*.85,-h*.1);g.quadraticCurveTo(w*.6,-h*.15,w*.75,-h*.55);g.fill();g.stroke()}
  if(L.freck){g.fillStyle='#a5683f';for(let i=0;i<6;i++){g.beginPath();g.arc((i%3-1)*8+(i<3?-ex:ex),ey+16+(i%2)*4,1.6,0,7);g.fill()}}
  if(o.turned){g.strokeStyle=C.threat;g.lineWidth=3;for(let i=0;i<5;i++){g.beginPath();g.moveTo(-50+i*25,-h-4);g.lineTo(-44+i*25,-h+16);g.stroke()}g.strokeStyle=C.ink}
  g.restore();
}
function collar(){g.fillStyle=C.dim;g.beginPath();g.moveTo(-70,70);g.lineTo(0,58);g.lineTo(70,70);g.lineTo(90,130);g.lineTo(-90,130);g.closePath();g.fill();g.lineWidth=3;g.strokeStyle=C.ink;g.stroke()}
// the Dancer: a red festival demon mask, tied on a little crooked, a grin showing below it, a paper fan
function oniMask(L,T,react){const w=L.w,h=L.h;g.save();g.lineWidth=3;g.strokeStyle=C.ink;g.lineJoin='round';
  g.beginPath();g.moveTo(-w*1.02,-h*.35);g.lineTo(-w*1.25,-h*.2);g.moveTo(w*1.02,-h*.35);g.lineTo(w*1.25,-h*.25);g.stroke(); // the string
  g.rotate(react==='panic'?.5:-.08+Math.sin(T/260)*.03);
  g.fillStyle='#f4ead2';[-1,1].forEach(s2=>{g.beginPath();g.moveTo(s2*w*.35,-h*.82);g.quadraticCurveTo(s2*w*.55,-h*1.3,s2*w*.3,-h*1.55);g.quadraticCurveTo(s2*w*.2,-h*1.15,s2*w*.12,-h*.88);g.closePath();g.fill();g.stroke()});
  g.fillStyle=C.threat;g.beginPath();g.ellipse(0,-h*.28,w*1.08,h*.64,0,0,7);g.fill();g.lineWidth=4;g.stroke();
  g.lineWidth=6;g.beginPath();[-1,1].forEach(s2=>{g.moveTo(s2*w*.78,-h*.62);g.lineTo(s2*w*.12,-h*.38)});g.stroke();
  g.lineWidth=3;[-1,1].forEach(s2=>{g.fillStyle=C.grace;g.beginPath();g.ellipse(s2*w*.42,-h*.24,w*.2,h*.11,s2*.25,0,7);g.fill();g.stroke();g.fillStyle=C.ink;g.beginPath();g.arc(s2*w*.42,-h*.24,4,0,7);g.fill()});
  g.fillStyle='#fff';g.beginPath();g.moveTo(-w*.55,h*.08);g.quadraticCurveTo(0,h*.3,w*.55,h*.08);g.closePath();g.fill();g.stroke();
  g.fillStyle='#fff';[-1,1].forEach(s2=>{g.beginPath();g.moveTo(s2*w*.42,h*.1);g.lineTo(s2*w*.32,h*.3);g.lineTo(s2*w*.24,h*.14);g.closePath();g.fill();g.stroke()});
  g.restore();
  // fan, bobbing to the festival
  g.save();g.translate(w*1.35,h*.7);g.rotate(Math.sin(T/180)*.35);g.lineWidth=3;g.strokeStyle=C.ink;g.beginPath();g.moveTo(0,0);g.lineTo(0,-34);g.stroke();
  g.fillStyle='#fff';g.beginPath();g.arc(0,-56,24,0,7);g.fill();g.stroke();g.fillStyle=C.threat;g.beginPath();g.arc(0,-56,9,0,7);g.fill();g.restore()}
function drawFig(f,cx,cy,sc,k){
  const turned=f.type==='turncoat'&&f.threat&&k>=f.turnAt;
  const closed=f.type==='sleeper'&&k<f.openAt;
  const T=performance.now(),react=f.react;
  g.save();g.translate(cx,cy);g.scale(sc,sc);
  const L0=f.look;g.translate(0,react==='panic'?Math.sin(T/20)*3:Math.sin(T/L0.bobs)*L0.bob);
  if(k>=0&&k<.09&&!react){const q=(.09-k)/.09;g.scale(1+q*.25,1-q*.2)}
  if(f.type==='twins'){
    f.pair.forEach((p,i)=>{g.save();g.translate(i?70:-70,i?18:-8);g.scale(.72,.72);collar();face(p.look,{slit:p.slit,smile:p.smile,react});g.restore()});
    g.restore();return;
  }
  collar();
  face(f.look,{slit:turned||f.slit,smile:turned?false:f.smile,turned,closed:closed&&react!=='panic',react});
  if(f.type==='dancer')oniMask(f.look,T,react);
  g.restore();
}
function drawShadow(t,p){
  // silhouette pressing against the panel during the lurk
  g.save();poly(TOP);g.clip();
  g.fillStyle=`rgba(17,16,20,${.12+.18*p})`;g.beginPath();g.ellipse(560-p*60,260,70,110,0,0,7);g.fill();
  g.strokeStyle=C.ink;g.lineWidth=1;for(let i=0;i<18;i++){const y=60+i*24+j(i)*8;g.beginPath();g.moveTo(580,y);g.lineTo(580-40-p*140-(i%3)*20,y+4);g.stroke()}
  g.restore();
}
function drawGuardian(push,slump=0){
  // the original masked figure, no halo
  layer(40,()=>{
  g.translate(110,800);g.rotate(-slump*.06);g.translate(-110,-800+slump*16);const hd=slump*26;
  g.lineWidth=4;g.strokeStyle=C.ink;g.lineJoin='round';
  g.fillStyle='#b7b3c9';g.beginPath();g.moveTo(10,800);g.lineTo(40,520);g.quadraticCurveTo(90,430,170,450);g.lineTo(210,800);g.closePath();g.fill();g.stroke();
  g.save();g.clip();g.lineWidth=1;for(let i=-4;i<40;i++){g.beginPath();g.moveTo(i*10-140,820);g.lineTo(i*10+140,420);g.stroke()}
  // belt: curved band clipped to the robe, with a knot and hanging ends
  g.fillStyle='#5d6aa0';g.lineWidth=3;g.beginPath();g.moveTo(0,598);g.quadraticCurveTo(110,618,240,592);g.lineTo(240,620);g.quadraticCurveTo(110,646,0,626);g.closePath();g.fill();g.stroke();g.restore();
  g.fillStyle='#5d6aa0';g.lineWidth=3;g.beginPath();g.ellipse(150,617,13,11,0,0,7);g.fill();g.stroke();
  g.beginPath();g.moveTo(144,626);g.lineTo(134+j(91)*3,680);g.lineTo(148,676);g.lineTo(152,628);g.closePath();g.fill();g.stroke();
  g.beginPath();g.moveTo(154,626);g.lineTo(170+j(92)*3,672);g.lineTo(178,664);g.lineTo(160,624);g.closePath();g.fill();g.stroke();
  g.fillStyle='#d8d4e6';g.beginPath();g.ellipse(115-hd*.3,400+hd,48,58,.1+slump*.3,0,7);g.fill();g.stroke();
  g.fillStyle=C.ink;g.beginPath();g.moveTo(80-hd*.3,395+hd*1.2);g.lineTo(150-hd*.3,385+hd*1.4);g.lineTo(148-hd*.3,400+hd*1.4);g.lineTo(82-hd*.3,410+hd*1.2);g.fill();
  const px=255+push-slump*70,py=330+slump*190;
  g.fillStyle='#b7b3c9';g.beginPath();g.moveTo(140,470);g.quadraticCurveTo(190,400,px-30,py+20);g.lineTo(px-20,py+55);g.quadraticCurveTo(200,470,170,510);g.closePath();g.fill();g.stroke();
  g.fillStyle=C.grace;g.fillRect(px-40,py+10,16,48);g.strokeRect(px-40,py+10,16,48);
  g.save();if(S.combo>1){g.shadowColor=C.violet;g.shadowBlur=S.combo*5}
  g.fillStyle='#d8d4e6';g.beginPath();g.moveTo(px-24,py+60);g.lineTo(px-22,py-30);for(let i=0;i<4;i++){g.lineTo(px-18+i*10,py-48+Math.abs(i-1.5)*8);g.lineTo(px-12+i*10,py-20)}g.lineTo(px+20,py+50);g.closePath();g.fill();g.stroke();
  g.restore();
  });
}
let scream=0; // 0..1: how long the crowd has been screaming at the Dancer
function drawOnlookers(state){
  // the three onlookers ARE your lives. A threat let through knocks one out; any other mistake makes one flee.
  g.save();poly(BOT,20);g.fillStyle='#f6f2ea';g.fill();g.clip();
  g.strokeStyle=C.ink;g.lineWidth=1;for(let i=-8;i<30;i++){g.beginPath();g.moveTo(250+i*12,800);g.lineTo(330+i*12,460);g.stroke()}
  const T=performance.now();
  [[345,690,40],[452,618,48],[522,712,38]].forEach(([x,y,r],n)=>{
    const o=OL[n];let q=0;if(o.gone){q=(T-o.gone)/750;if(q>=1)return}
    layer(60+n*5,()=>{
    g.save();
    const e=o.gone?(o.kind==='ko'?'ko':'flee'):state;
    if(e==='fear'||e==='horror'||e==='flee')g.translate((Math.random()-.5)*4,(Math.random()-.5)*4);
    if(e==='scream'){const z=4+scream*16;g.translate((Math.random()-.5)*z,(Math.random()-.5)*z-scream*26);g.strokeStyle=C.ink;g.lineWidth=2.5;for(let i=0;i<7;i++){const a=-Math.PI*.95+i*Math.PI*.15,r0=r*1.25,r1=r0+14+scream*26+j(i+n*9)*8;g.beginPath();g.moveTo(x+Math.cos(a)*r0,y+Math.sin(a)*r0);g.lineTo(x+Math.cos(a)*r1,y+Math.sin(a)*r1);g.stroke()}}
    if(o.gone&&o.kind==='ko'){g.translate(x+q*220,y-q*260+q*q*120);g.rotate(q*9);g.translate(-x,-y)}
    if(o.gone&&o.kind==='flee'){g.translate(q*q*320,-q*30)}
    g.strokeStyle=C.ink;g.lineWidth=3;g.fillStyle='#fff';g.beginPath();g.arc(x,y,r,0,7);g.fill();g.stroke();
    g.fillStyle=C.ink;
    if(n===1){g.beginPath();const N=9;for(let i=0;i<=N;i++){const a=Math.PI*1.02+i/N*Math.PI*.96,rr=i%2?r*1.02:r*1.55+((i*7)%3)*4;g.lineTo(x+Math.cos(a)*rr,y-6+Math.sin(a)*rr)}for(let i=0;i<=6;i++){g.lineTo(x+r*.95-i*r*1.9/6,y-r*.38+(i%2?10:0))}g.closePath();g.fill()}
    else if(n===2){g.beginPath();g.ellipse(x,y-r*.7,r*.95,r*.5,0,Math.PI,0);g.fill();g.beginPath();g.arc(x,y-r*1.15,r*.32,0,7);g.fill()}
    else{g.beginPath();g.ellipse(x,y-r*.7,r*.95,r*.5,0,Math.PI,0);g.fill()}
    g.lineWidth=3;
    if(e==='ko'){[-1,1].forEach(s2=>{const ex=x+s2*r*.35,ey=y-4;g.beginPath();g.moveTo(ex-6,ey-6);g.lineTo(ex+6,ey+6);g.moveTo(ex+6,ey-6);g.lineTo(ex-6,ey+6);g.stroke()});g.beginPath();g.ellipse(x,y+r*.4,6,10,0,0,7);g.stroke();
      g.fillStyle=C.grace;for(let i=0;i<3;i++){const a=T/120+i*2.1;g.font='bold 18px sans-serif';g.fillText('★',x+Math.cos(a)*r*1.1-6,y-r*1.1+Math.sin(a)*8)}}
    else if(e==='scream'){[-1,1].forEach(s2=>{g.fillStyle='#fff';g.beginPath();g.arc(x+s2*r*.35,y-8,11,0,7);g.fill();g.stroke();g.fillStyle=C.ink;g.beginPath();g.arc(x+s2*r*.35,y-8,2.5,0,7);g.fill()});
      g.fillStyle=C.ink;g.beginPath();g.ellipse(x,y+r*.4,13+scream*5,16+scream*12,0,0,7);g.fill();g.fillStyle='#e8627a';g.beginPath();g.ellipse(x,y+r*.4+8+scream*8,7,4,0,0,7);g.fill()}
    else if(e==='fear'||e==='horror'||e==='flee'){[-1,1].forEach(s2=>{g.fillStyle='#fff';g.beginPath();g.arc(x+s2*r*.35,y-5,10,0,7);g.fill();g.stroke();g.fillStyle=C.ink;g.beginPath();g.arc(x+s2*r*.35,y-5,3,0,7);g.fill()});
      g.fillStyle=C.ink;g.beginPath();g.ellipse(x,y+r*.42,12,e==='fear'?11:19,0,0,7);g.fill();
      g.fillStyle='#7fb6e8';g.beginPath();g.ellipse(x+r*.8,y-r*.4,5,9,0,0,7);g.fill();g.beginPath();g.ellipse(x-r*.85,y-r*.25,4,7,0,0,7);g.fill();
      if(e==='flee'){g.strokeStyle=C.ink;g.lineWidth=2;for(let i=0;i<4;i++){g.beginPath();g.moveTo(x-r-10-i*4,y-15+i*12);g.lineTo(x-r-40-i*6,y-15+i*12);g.stroke()}}}
    else if(e==='joy'){[-1,1].forEach(s2=>{g.beginPath();g.arc(x+s2*r*.35,y,8,Math.PI,0);g.stroke()});g.fillStyle=C.ink;g.beginPath();g.arc(x,y+r*.12,r*.42,.05*Math.PI,.95*Math.PI);g.closePath();g.fill();g.fillStyle='#e8627a';g.beginPath();g.ellipse(x,y+r*.42,7,5,0,0,7);g.fill()}
    else if(e==='sleep'){[-1,1].forEach(s2=>{g.beginPath();g.arc(x+s2*r*.35,y-2,6,.1*Math.PI,.9*Math.PI);g.stroke()});g.font='bold 20px sans-serif';g.fillStyle=C.ink;g.fillText('z',x+r*.6,y-r*.6+j(n+5)*4)}
    else{[-1,1].forEach(s2=>{g.beginPath();g.arc(x+s2*r*.35,y-2,3,0,7);g.fill()});g.beginPath();g.moveTo(x-10,y+r*.4);g.lineTo(x+10,y+r*.4);g.stroke()}
    g.restore();
    });
  });
  g.restore();poly(BOT,20);g.lineWidth=6;g.strokeStyle=C.ink;g.stroke();
}
function txt(s,x,y,size,col=C.ink,align='center',font='Bangers'){g.font=`${size}px ${font},Impact,sans-serif`;g.textAlign=align;const light=col===C.paper||col===C.grace;g.lineWidth=Math.max(3,size/(light?9:7));g.strokeStyle=light?C.ink:C.paper;g.lineJoin='round';g.strokeText(s,x,y);g.fillStyle=col;g.fillText(s,x,y)}
function wrapText(s,x,y,w,lh){g.font='20px "Zen Kaku Gothic New",sans-serif';g.textAlign='center';const words=s.split(' ');let line='',yy=y;for(const wd of words){const tl=line?line+' '+wd:wd;if(g.measureText(tl).width>w){g.fillText(line,x,yy);line=wd;yy+=lh}else line=tl}g.fillText(line,x,yy)}

// the arrival that ended the run: still, eyes open, already turned. It fades back in as the guardian slumps.
function drawKiller(t){const f=G.killer,a=Math.min(1,(t-G.fallT)/400);
  drawAura(420,230,f.aura,t,a);g.save();g.globalAlpha=a;poly(TOP);g.clip();
  layer(1,()=>drawFig({...f,react:null,look:{...f.look,bob:0}},420,230,.95,1));g.restore()}
export function draw(t){
  const fig=G.fig,res=G.res,card=G.card,t0=G.t0,lurk=G.lurk,win=G.win;
  g.save();if(G.shake>0&&!SET.shake)G.shake=0;if(G.shake>0){g.translate((Math.random()-.5)*G.shake,(Math.random()-.5)*G.shake);G.shake*=.85;if(G.shake<.5)G.shake=0}
  g.fillStyle=C.paper;g.fillRect(-20,-20,640,840);
  poly(TOP,5);g.fillStyle='#fbfbf2';g.fill();
  let onl='calm';
  const k=fig?(t-t0-lurk)/win:0;
  if(fig)fig.react=S.mode==='resolve'?(res.a==='blast'?'panic':res.a==='pass'?'wave':null):null;
  const end=S.mode==='fall'||S.mode==='over';
  if(end&&G.killer){drawKiller(t);onl='calm'}
  else if(S.mode==='lurk'){drawShadow(t,Math.min(1,(t-t0)/lurk));onl='tense'}
  else if(fig&&(S.mode==='beat'||S.mode==='resolve')&&!res?.lurk||S.mode==='beat'){
    const f=fig;
    if(f.empty){drawShadow(t,Math.max(0,1-k*2));onl='tense'}
    else if(S.mode==='resolve'&&res.a!=='blast'){
      const q=Math.max(0,Math.min(1,(t-res.t)/400));drawAura(420,230,f.aura,t);
      g.save();poly(TOP);g.clip();layer(1,()=>drawFig(f,420,230+q*260,.95,k));g.restore();
      onl=f.threat?'horror':'joy';
    }else{
      const p=S.mode==='beat'?Math.min(1,(t-t0-lurk)/150):1;
      drawAura(420,230,f.aura,t);g.save();poly(TOP);g.clip();layer(1,()=>{let fl=0;if(S.mode==='resolve'&&res.a==='blast'){fl=Math.max(0,Math.min(1,((t-res.t)/res.dur-.04)*4))}if(fl&&res&&res.fx==='fling'){g.translate(420+fl*70,230-fl*50);g.rotate(fl*.6);g.translate(-420,-230);drawFig(f,420,230,(.6+.35*p)*(1-fl*.55),k)}else if(res&&res.fx==='crumble'){g.globalAlpha=1-fl;drawFig(f,420,230,(.6+.35*p),k);g.globalAlpha=1}else drawFig(f,420,230,(.6+.35*p),k);});g.restore();
      scream=Math.max(0,Math.min(1,k));onl=f.type==='dancer'?'scream':(f.type==='sleeper'&&k<f.openAt)?'tense':((f.threat&&!(f.type==='turncoat'&&k<f.turnAt))?'fear':'calm');
      if(S.mode==='resolve')onl=f.threat?'joy':'horror';
    }
  }else{g.save();poly(TOP);g.clip();g.strokeStyle='#c9c6b8';g.lineWidth=1;for(let i=0;i<30;i++){g.beginPath();g.moveTo(180+i*15,40);g.lineTo(160+i*15,480);g.stroke()}g.restore()}
  // combo escalation: speed lines, heavier border
  const cb=S.combo;
  if(cb>=4){g.save();g.strokeStyle=C.ink;g.lineWidth=cb>=8?2.5:1.5;const n=cb>=8?26:14;for(let i=0;i<n;i++){const y=20+i*(440/n)+j(i+40)*10;g.beginPath();g.moveTo(170-((i*37)%60),y);g.lineTo(150-((i*37)%60)-60,y+30);g.stroke()}g.restore()}
  poly(TOP,5);g.lineWidth=6+Math.min(7,cb-1);g.strokeStyle=C.ink;g.stroke();
  if(cb>=8){poly(TOP,5);g.lineWidth=3;g.strokeStyle=C.violet;g.stroke()}
  drawOnlookers(onl);
  {let push=0;if(S.mode==='resolve'&&res.a==='blast'){const bq=(t-res.t)/res.dur;push=bq<0?0:bq<.08?bq/.08*44:bq<.4?44-(bq-.08)/.32*32:12}
  drawGuardian(push,S.mode==='fall'||S.mode==='over'?Math.min(1,(t-G.fallT)/450):0)}
  const mq=(t-G.missT)/700;
  if(mq<1){g.save();g.globalCompositeOperation='saturation';g.fillStyle=`rgba(128,128,128,${1-mq})`;g.fillRect(-20,-20,640,840);g.restore();
  }
  if(S.mode==='beat'&&!fig.empty){const tk=Math.max(0,1-k);g.fillStyle=C.ink;g.fillRect(0,786,600,14);g.fillStyle=tk<.3?C.threat:C.violet;g.fillRect(0,788,600*tk,10)}
  txt(String(S.score).padStart(6,'0'),20,44,38,C.ink,'left');
  txt('×'+S.combo,20,78,26,C.violet,'left');
  if(S.mode==='resolve'&&res.a==='blast'){
    // hakai: instant. the face crumbles into ink flakes that drift up and dissolve into the white
    const q=(t-res.t)/res.dur;
    if(q>=0&&q<.15){g.fillStyle=C.violet;g.globalAlpha=.5;poly(TOP);g.fill();g.globalAlpha=1}
    if(res.fx==='crumble'&&q>=.03&&q<.75){const cq=(q-.03)/.72;g.save();poly(TOP);g.clip();
      res.shards.forEach(sh=>{const a=Math.max(0,1-cq*1.3);if(!a)return;g.globalAlpha=a;g.save();g.translate(420+sh.x+cq*sh.v*60,230+sh.y-cq*sh.v*170);g.rotate(sh.r+cq*sh.v*3);const z=sh.s*(1-cq*.6);g.fillStyle=sh.ink?C.ink:'#fff';g.strokeStyle=C.ink;g.lineWidth=1.5;g.beginPath();g.moveTo(-z,-z*.4);g.lineTo(z*.7,-z*.8);g.lineTo(z,z*.5);g.lineTo(-z*.2,z*.7);g.closePath();g.fill();if(!sh.ink)g.stroke();g.restore()});
      g.restore();g.globalAlpha=1}
    let a=q<.15?Math.max(0,q)/.15:q<.55?1:Math.max(0,1-(q-.55)/.45);if(!SET.flashes)a*=.55;
    g.fillStyle=`rgba(255,255,255,${a*.85})`;g.fillRect(-20,-20,640,840);
    if(q>.2&&q<.7)txt('BLASTED',300,420,90,C.violet);
  }
  if(S.mode==='resolve'&&res.a==='pass'&&(t-res.t)<550)txt('PASSED',300,420,90,C.dim);
  if(S.mode==='resolve'&&res.a==='flinch'&&(t-res.t)<500)txt('FLINCHED',300,420,90,C.threat);
  if(S.mode==='card'){
    {const r=ROSTER[card.type];g.fillStyle='rgba(17,16,20,.86)';g.fillRect(0,250,600,300);
      txt('NEW ARRIVAL',300,300,28,C.grace);txt(r.name,300,370,72,C.paper);g.fillStyle=C.paper;wrapText(r.tip,300,420,480,28);
      g.font='16px "Zen Kaku Gothic New",sans-serif';g.fillStyle=C.grace;g.fillText('Press any button',300,525)}
  }
  if(S.mode==='title'||S.mode==='over'){
    g.fillStyle='rgba(17,16,20,.82)';g.fillRect(0,0,600,800);
    txt(S.mode==='over'?'GAME OVER':'PALM',300,S.mode==='over'?130:250,S.mode==='over'?80:150,C.paper);
    g.font='20px "Zen Kaku Gothic New",sans-serif';g.textAlign='center';g.fillStyle=C.paper;
    if(S.mode==='over'){g.fillText(`Score ${S.score}    ·    Best ${S.best}`,300,185);g.font='16px "Zen Kaku Gothic New",sans-serif';g.fillStyle=C.grace;g.fillText('Press any button to play again',300,705)}
    const lines=S.mode==='over'?[]:
      ['Blast it, or let it pass.','','Press any button'];
    lines.forEach((l,i)=>g.fillText(l,300,330+i*34));
  }
  if(G.paused){g.fillStyle='rgba(17,16,20,.8)';g.fillRect(0,0,600,800);txt('PAUSED',300,400,90,C.paper);g.font='18px "Zen Kaku Gothic New",sans-serif';g.textAlign='center';g.fillStyle=C.grace;g.fillText('Press any button to resume',300,450)}
  g.restore();
}