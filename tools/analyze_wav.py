import numpy as np,json,wave
w=wave.open('level4_solve.wav');SR=w.getframerate();x=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16)/32768.0
E=json.load(open('tools/level4_expected.json'));SCALE=[0,2,4,7,9,12,14,16,19,21,24,26,28]
peak=np.abs(x).max();print(f"duration {len(x)/SR:.2f}s peak {peak:.4f} = {20*np.log10(peak):.2f} dBFS, clipped samples {(np.abs(x)>=0.999).sum()}")
# onset detection: positive jumps in 2ms-hop RMS energy
hop=int(.002*SR);fr=len(x)//hop;env=np.array([np.sqrt(np.mean(x[i*hop:(i+1)*hop]**2)) for i in range(fr)])
# blind onset detector: positive spectral flux (1024-pt window, 1ms hop, log magnitude), peak-picked
N=1024;H=int(.001*SR);win=np.hanning(N);xp=np.concatenate([np.zeros(N),x])
frames=np.array([np.log1p(100*np.abs(np.fft.rfft(xp[i*H:i*H+N]*win))) for i in range((len(x))//H)])
flux=np.maximum(np.diff(frames,axis=0),0).sum(1);flux=np.concatenate([[0],flux])
thr=np.median(flux)+0.25*flux.max();ons=[]
for i in range(1,len(flux)-1):
  if flux[i]>thr and flux[i]==flux[max(0,i-30):i+30].max():
    j=i
    while j>0 and flux[j-1]>thr*0.5: j-=1   # walk back to the start of the rise
    ons.append(j*H/SR)   # window END is at frame time -> onset time
exp=sorted(set(round(e['t'],3) for e in E['exp']))
# win chord stagger 60ms => separate onsets expected
errs=[];miss=[]
for t in exp:
  c=[o for o in ons if abs(o-t)<0.025]
  if c:errs.append(min(c,key=lambda o:abs(o-t))-t)
  else:miss.append(t)
extra=[o for o in ons if min(abs(o-t) for t in exp)>0.025]
print(f"expected onset times {len(exp)}, detected {len(ons)}, matched {len(errs)}, missed {miss}, spurious {extra}")
print(f"onset error: max |{max(abs(e) for e in errs)*1000:.1f}| ms, mean {np.mean(errs)*1000:.1f} ms (onset frame = start of 2ms hop + 10ms attack ramp)")
# pitch check per onset window
allowed=[220*2**(s/12) for s in SCALE];ok=0;tot=0;rep=[]
for t in exp:
  seg=x[int((t+0.015)*SR):int((t+0.015)*SR)+int(0.15*SR)];seg=seg*np.hanning(len(seg))
  F=np.abs(np.fft.rfft(seg,8*len(seg)));f=np.fft.rfftfreq(8*len(seg),1/SR)
  want=[220*2**(SCALE[e['i']%13]/12) for e in E['exp'] if abs(e['t']-t)<1e-3]
  pre=x[int((t-0.155)*SR):int((t-0.005)*SR)]
  if len(pre)==len(seg)//1 and t>0.2:
    P=np.abs(np.fft.rfft(pre*np.hanning(len(pre)),8*len(seg)));F=np.maximum(F-P*1.3,0)  # spectral increase = newly started notes
  pk=f[np.argmax(F*(f<1100)*(f>150))]
  near=min(allowed,key=lambda a:abs(1200*np.log2(pk/a)));cents=1200*np.log2(pk/near)
  tot+=1;ok+=abs(cents)<30 and any(abs(1200*np.log2(near/wv))<1 for wv in want)
  rep.append(f"{t*1000:.0f}ms:{pk:.1f}Hz({cents:+.0f}c)")
print(f"dominant pitch on scale & newly-started pitch matches a note scheduled on that beat: {ok}/{tot}");print(' '.join(rep))
