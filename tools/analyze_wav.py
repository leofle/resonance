# Analyses level3_solve.wav / level3_decoy.wav: peak dBFS, onsets vs 180ms beat grid, per-beat pitch vs melody,
# and a "clash" metric (share of spectral energy that is NOT on the pentatonic scale or its harmonics).
import numpy as np,json,wave
E=json.load(open('tools/level3_expected.json'));SCALE=[0,2,4,7,9,12];BASE=220.0;BEAT=.18
fr=lambda p:BASE*2**(SCALE[p]/12)
def load(f):
  w=wave.open(f);SR=w.getframerate();return np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16)/32768.0,SR
def onsets(x,SR):
  N=1024;H=int(.001*SR);win=np.hanning(N);xp=np.concatenate([np.zeros(N),x])
  F=np.array([np.log1p(100*np.abs(np.fft.rfft(xp[i*H:i*H+N]*win))) for i in range(len(x)//H)])
  fl=np.concatenate([[0],np.maximum(np.diff(F,axis=0),0).sum(1)]);thr=np.median(fl)+.25*fl.max();o=[]
  for i in range(1,len(fl)-1):
    if fl[i]>thr and fl[i]==fl[max(0,i-30):i+30].max():
      j=i
      while j>0 and fl[j-1]>thr*.5:j-=1
      o.append(j*H/SR)
  return o
def buzz(seg,SR):
  # clash = sawtooth cluster a semitone above/below: rich upper harmonics; tile notes (sine + soft triangle) have almost none
  S=np.abs(np.fft.rfft(seg*np.hanning(len(seg))))**2;f=np.fft.rfftfreq(len(seg),1/SR);return S[f>1500].sum()/S[f>100].sum()
def offscale(seg,SR):
  S=np.abs(np.fft.rfft(seg*np.hanning(len(seg)),8*len(seg)))**2;f=np.fft.rfftfreq(8*len(seg),1/SR);m=(f>150)&(f<4000)
  ok=np.zeros_like(f,bool)
  for p in range(len(SCALE)):
    for h in range(1,6):ok|=np.abs(f-fr(p)*h)<np.maximum(14,fr(p)*h*(2**(35/1200)-1))
  return S[m&~ok].sum()/S[m].sum()
for k in ['solve','decoy']:
  x,SR=load(f'level3_{k}.wav');mel=E[k]['melody'];tgt=E['target']
  pk=np.abs(x).max();print(f"\n== level3_{k}.wav  tap {E[k]['tap']}  {len(x)/SR:.2f}s  peak {pk:.3f} = {20*np.log10(pk):.2f} dBFS  clipped {(np.abs(x)>=.999).sum()}")
  ons=onsets(x,SR);exp=[i*BEAT for i,c in enumerate(mel) if c]
  m=[min(ons,key=lambda o:abs(o-t))-t for t in exp];errs=[e for e in m if abs(e)<.03]
  print(f"onsets: {len(errs)}/{len(exp)} beats matched within 30ms, max |err| {max(abs(e) for e in errs)*1000:.1f} ms, mean {np.mean(errs)*1000:.1f} ms (synth has a 10ms attack ramp)")
  rows=[]
  for i,ch in enumerate(mel):
    t=i*BEAT;seg=x[int((t+.015)*SR):int((t+.165)*SR)];pre=x[int((t-.15)*SR):int(t*SR)] if t>.2 else None
    F=np.abs(np.fft.rfft(seg*np.hanning(len(seg)),8*len(seg)));f=np.fft.rfftfreq(8*len(seg),1/SR)
    if pre is not None and len(pre)==len(seg):F=np.maximum(F-1.3*np.abs(np.fft.rfft(pre*np.hanning(len(pre)),8*len(seg))),0)
    pkf=f[np.argmax(F*(f>150)*(f<900))];want=[fr(p) for p in ch];hit=any(abs(1200*np.log2(pkf/w))<30 for w in want)
    rows.append(f"b{i+1}:{'ok' if (i<len(tgt) and ch==tgt[i]) else 'WRONG'} play{[p+1 for p in ch]} {pkf:.0f}Hz {'✓' if hit else '?'} buzz {buzz(seg,SR)*100:.2f}%")
  print('\n'.join(rows))
  wrong=[i for i,c in enumerate(mel) if not (i<len(tgt) and c==tgt[i])];right=[i for i,c in enumerate(mel) if (i<len(tgt) and c==tgt[i])]
  osc=lambda idx:np.mean([buzz(x[int((i*BEAT+.015)*SR):int((i*BEAT+.165)*SR)],SR) for i in idx])*100 if idx else 0
  print(f"mean buzz (energy >1.5kHz): correct beats {osc(right):.2f}%  wrong beats {osc(wrong):.2f}%")
