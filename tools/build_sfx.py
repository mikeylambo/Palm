# Rebuilds sfx/*.mp3 from the owner's source takes (not in the repo). Usage: cd <folder with the takes> && python3 tools/build_sfx.py <repo>/sfx
# cut, layer, level and export the owner's SFX for PALM. Run from the folder with the source mp3s.
import subprocess,numpy as np,sys,os
OUT=sys.argv[1];SR=44100
def load(f,ss=0,to=None):
    a=['ffmpeg','-v','error','-i',f,'-ss',str(ss)]+(['-to',str(to)] if to else [])+['-ac','1','-ar',str(SR),'-f','f32le','-']
    return np.frombuffer(subprocess.run(a,capture_output=True).stdout,dtype=np.float32).copy()
def fade(x,ms_in=2,ms_out=30):
    n=int(SR*ms_in/1000);m=int(SR*ms_out/1000)
    if n:x[:n]*=np.linspace(0,1,n)
    if m:x[-m:]*=np.linspace(1,0,m)
    return x
def verb(x,tail=.6,mix=.25):  # small dark room: a few damped echoes
    y=np.concatenate([x,np.zeros(int(SR*tail))]);out=y.copy()
    for d,g in [(.031,.5),(.047,.4),(.071,.32),(.113,.25),(.167,.18),(.241,.12),(.337,.08)]:
        k=int(SR*d);out[k:]+=mix*g*y[:-k]
    return out
def hp(x,f=250): # one-pole high-pass to keep boosted quiet takes from rumbling
    a=1/(1+2*np.pi*f/SR);y=np.zeros_like(x);p=0;px=0
    for i,v in enumerate(x):p=a*(p+v-px);px=v;y[i]=p
    return y
def save(name,x,peak_db):
    x=x*(10**(peak_db/20)/max(1e-9,np.abs(x).max()))
    p=subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(SR),'-ac','1','-i','-','-b:a','96k',os.path.join(OUT,name+'.mp3')],input=x.astype(np.float32).tobytes())
    assert p.returncode==0;print(name,f'{len(x)/SR*1000:.0f}ms')
save('pop',fade(load('pop.mp3',.02,.17)),-6)
save('pop2',fade(load('pop_twins.mp3',.125,.2),1,20),-6)           # the double pop's last hit: the second Twin
save('eyes_open',fade(hp(load('eyes_open.mp3',0,.38))),-7)
save('turn',fade(verb(fade(load('turn.mp3',0,.46)),.45,.3),2,120),-4)
save('nothing',fade(load('nothing.mp3',0,.48),2,80),-11)
save('flinch',fade(load('flinch.mp3',.17,.528),2,50),-7)
save('strike',fade(load('strike.mp3',0,.48),2,80),-5)
save('ko',fade(load('ko 2.mp3',0,.3),2,40),-4)
sc=load('flee (scramble).mp3',0,.5);yl=load('flee scream.mp3',0,.45);n=max(len(sc),len(yl))
mix=np.zeros(n);mix[:len(sc)]+=sc;mix[:len(yl)]+=yl*.35
save('flee',fade(mix,2,60),-5)
save('combo',fade(load('combo.mp3',.01,.48),2,40),-8)
save('slump',fade(load('slump.mp3',0,1.17),2,150),-5)
save('gameover',fade(verb(load('gameover.mp3',0,1.22),.8,.3),2,300),-4)
save('click',fade(load('k.mp3',0,.09),1,40),-15)
