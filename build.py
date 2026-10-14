import json
e=open('engine.js').read().replace("if(typeof module","//if(typeof module")
t=open('index.template.html').read()
lv=json.load(open('final.json'))
t=t.replace("__LEVELS__",json.dumps(lv,ensure_ascii=False)).replace("__ENGINE__",e)
assert "__LEVELS__" not in t and "__ENGINE__" not in t
open('index.html','w').write(t)
s=t[t.index('<script>')+8:t.rindex('</script>')];open('/tmp/res_check.js','w').write(s)
print('built',len(t))
